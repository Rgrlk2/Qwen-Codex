/**
 * Mini-renderer de markdown para el copy aprobado.
 *
 * ⛔ El copy vive SOLO en content/copy/*.md (content/copy/COPY_LOCK.md).
 * Este módulo lo LEE tal cual (importado con `?raw`, ver tipos-raw.d.ts) y lo
 * pasa a DOM sin tocar una letra: no resume, no corrige ortografía ni
 * acentuación, no reordena secciones.
 *
 * ⛔ Construye nodos DOM directamente (createElement / textContent), nunca
 *    innerHTML con el texto: aunque el copy es contenido propio y de
 *    confianza, es la forma más simple de no introducir un vector de XSS si
 *    algún día ese archivo deja de serlo.
 *
 * Soporta el subconjunto que usa el copy aprobado: encabezados `##`/`###`,
 * listas `- `, citas `> `, separadores `---` y **negrita**. Nada más aparece
 * en los dos documentos de content/copy/.
 */

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/**
 * Devuelve el bloque de markdown entre "# N. NOMBRE" y el próximo
 * encabezado de nivel 1 (o el fin del archivo), comparando `NOMBRE` contra
 * `nombreProducto` sin distinguir may/min ni acentos.
 */
export function extraerSeccionProducto(md: string, nombreProducto: string): string | null {
  const lineas = md.split('\n');
  const objetivo = normalizar(nombreProducto);
  let inicio = -1;
  let fin = lineas.length;
  for (let i = 0; i < lineas.length; i += 1) {
    const linea = lineas[i] ?? '';
    const coincidencia = /^#\s+\d+\.\s*(.+?)\s*$/.exec(linea);
    if (!coincidencia) continue;
    if (inicio === -1) {
      if (normalizar(coincidencia[1] ?? '') === objetivo) inicio = i + 1;
    } else {
      fin = i;
      break;
    }
  }
  if (inicio === -1) return null;
  return lineas.slice(inicio, fin).join('\n').trim();
}

/** Negrita `**texto**` como único formato inline presente en el copy aprobado. */
function agregarTextoConEnfasis(contenedor: HTMLElement, texto: string): void {
  const partes = texto.split(/(\*\*[^*]+\*\*)/g);
  for (const parte of partes) {
    if (parte.length === 0) continue;
    const negrita = /^\*\*([^*]+)\*\*$/.exec(parte);
    if (negrita) {
      const fuerte = document.createElement('strong');
      fuerte.textContent = negrita[1] ?? '';
      contenedor.appendChild(fuerte);
    } else {
      contenedor.appendChild(document.createTextNode(parte));
    }
  }
}

const NIVELES_ENCABEZADO: Readonly<Record<string, keyof HTMLElementTagNameMap>> = {
  '##': 'h3',
  '###': 'h4',
  '####': 'h5',
};

export function renderizarMarkdown(md: string): DocumentFragment {
  const fragmento = document.createDocumentFragment();
  const bloques = md.split(/\n{2,}/).map((b) => b.trim()).filter((b) => b.length > 0);

  for (const bloque of bloques) {
    const lineas = bloque.split('\n');
    const primera = lineas[0] ?? '';

    const encabezado = /^(#{2,4})\s+(.*)$/.exec(primera);
    if (encabezado) {
      const etiqueta = NIVELES_ENCABEZADO[encabezado[1] ?? ''] ?? 'h4';
      const elemento = document.createElement(etiqueta);
      agregarTextoConEnfasis(elemento, encabezado[2] ?? '');
      fragmento.appendChild(elemento);
      continue;
    }

    if (/^-\s+/.test(primera)) {
      const lista = document.createElement('ul');
      for (const linea of lineas) {
        const item = /^-\s+(.*)$/.exec(linea.trim());
        if (!item) continue;
        const elementoItem = document.createElement('li');
        agregarTextoConEnfasis(elementoItem, item[1] ?? '');
        lista.appendChild(elementoItem);
      }
      fragmento.appendChild(lista);
      continue;
    }

    if (/^>\s?/.test(primera)) {
      const cita = document.createElement('blockquote');
      agregarTextoConEnfasis(cita, lineas.map((l) => l.replace(/^>\s?/, '')).join(' '));
      fragmento.appendChild(cita);
      continue;
    }

    if (/^-{3,}\s*$/.test(primera)) {
      fragmento.appendChild(document.createElement('hr'));
      continue;
    }

    const parrafo = document.createElement('p');
    agregarTextoConEnfasis(parrafo, lineas.join(' '));
    fragmento.appendChild(parrafo);
  }

  return fragmento;
}
