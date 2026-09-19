/**
 * Utilidades mínimas de DOM para el módulo de fichas.
 *
 * ⚠️ Esto es la tercera copia de las mismas veinte líneas: existen iguales en
 *    `vistas/propuestas/dom.ts` y algo parecido en `vistas/clientes/util.ts`.
 *    Corresponde promoverlas a `packages/ui` en una limpieza, pero eso toca
 *    archivos de otras sesiones y no entra en este cambio. Queda anotado en
 *    `docs/PEDIDOS.md`.
 */

export function crear<K extends keyof HTMLElementTagNameMap>(
  etiqueta: K,
  opciones?: {
    readonly clase?: string;
    readonly texto?: string;
    readonly atributos?: Readonly<Record<string, string>>;
  },
): HTMLElementTagNameMap[K] {
  const elemento = document.createElement(etiqueta);
  if (opciones?.clase) elemento.className = opciones.clase;
  if (opciones?.texto !== undefined) elemento.textContent = opciones.texto;
  if (opciones?.atributos) {
    for (const [n, v] of Object.entries(opciones.atributos)) elemento.setAttribute(n, v);
  }
  return elemento;
}

export function vaciar(elemento: HTMLElement): void {
  elemento.replaceChildren();
}

/**
 * Convierte el copy aprobado —markdown simple— en nodos.
 *
 * ⛔ Sin `innerHTML`: el copy es contenido nuestro, pero "Lo que conversamos"
 *    y la nota del vendedor son texto escrito por una persona, y se renderizan
 *    con el mismo camino. Nada se interpreta como HTML.
 */
export function parrafosDeTexto(texto: string): ReadonlyArray<HTMLElement> {
  const salida: HTMLElement[] = [];
  let lista: HTMLUListElement | null = null;
  for (const cruda of texto.split('\n')) {
    const linea = cruda.trim();
    if (linea.length === 0) { lista = null; continue; }
    if (linea.startsWith('- ') || linea.startsWith('* ')) {
      if (!lista) { lista = crear('ul', { clase: 'fichas-lista' }); salida.push(lista); }
      lista.append(crear('li', { texto: sinEnfasis(linea.slice(2)) }));
      continue;
    }
    lista = null;
    salida.push(crear('p', { texto: sinEnfasis(linea) }));
  }
  return salida;
}

/** El copy usa `**` para resaltar. Acá se limpia: el resalte lo da el CSS. */
function sinEnfasis(t: string): string {
  return t.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1');
}
