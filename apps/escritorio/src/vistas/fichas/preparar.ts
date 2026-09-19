/**
 * Preparar la ficha para un prospecto.
 *
 * El vendedor parte de la ficha OFICIAL y arma una capa encima: muestra,
 * oculta, mueve y destaca bloques, y agrega "Lo que conversamos" y una nota.
 *
 * ⛔ LA REGLA: la ficha oficial no se toca. Acá no hay ni un campo donde
 *    escribir el contenido de un bloque, porque `PersonalizacionBloque` no
 *    tiene ninguno. El texto que se ve sale siempre de la ficha oficial.
 *
 * Ver MASTER_SPEC.md §2.3 y packages/compartido/src/fichas.ts.
 */

import type {
  BloqueFicha, BloqueFichaId, FichaOficial, PersonalizacionBloque,
} from '@labia/compartido';
import { crear, parrafosDeTexto, vaciar } from './dom';

/** ⛔ Máximo dos destacados: si todo resalta, nada resalta (DATA_MODEL §7b.3). */
export const MAXIMO_DESTACADOS = 2;

export interface EstadoPreparacion {
  readonly bloques: ReadonlyArray<PersonalizacionBloque>;
  readonly loQueConversamos: string;
  readonly notaDelVendedor: string;
}

export interface OpcionesPreparar {
  readonly ficha: FichaOficial;
  readonly contenedor: HTMLElement;
  readonly estadoInicial: EstadoPreparacion;
  /** Se llama en cada cambio, para que la vista actualice la vista previa. */
  readonly alCambiar: (estado: EstadoPreparacion) => void;
}

/** Ordena la capa y la empareja con el contenido oficial de cada bloque. */
export function bloquesOrdenados(
  ficha: FichaOficial, capa: ReadonlyArray<PersonalizacionBloque>,
): ReadonlyArray<{ readonly capa: PersonalizacionBloque; readonly oficial: BloqueFicha }> {
  return [...capa]
    .sort((a, b) => a.orden - b.orden)
    .flatMap((c) => {
      const oficial = ficha.bloques.find((b) => b.id === c.bloqueId);
      return oficial && oficial.presente ? [{ capa: c, oficial }] : [];
    });
}

/**
 * Monta el panel de preparación.
 *
 * Devuelve una función para leer el estado actual: la vista la usa al guardar.
 */
export function montarPreparar(opciones: OpcionesPreparar): () => EstadoPreparacion {
  const { ficha, contenedor, alCambiar } = opciones;
  let estado: EstadoPreparacion = opciones.estadoInicial;

  const panel = crear('div', { clase: 'fichas-preparar' });

  // --- Los bloques ---------------------------------------------------------
  const lista = crear('ol', { clase: 'fichas-bloques', atributos: { 'aria-label': 'Bloques de la ficha' } });
  panel.append(
    crear('h3', { clase: 'fichas-titulo-seccion', texto: 'Qué le mostrás' }),
    crear('p', {
      clase: 'fichas-ayuda',
      texto: 'Podés ocultar lo que no aplique, cambiar el orden y destacar hasta dos bloques. El texto es el oficial y no se edita.',
    }),
    lista,
  );

  const aviso = crear('p', { clase: 'fichas-aviso', atributos: { role: 'status' } });
  aviso.hidden = true;
  panel.append(aviso);

  function cambiar(siguiente: EstadoPreparacion): void {
    estado = siguiente;
    pintarBloques();
    alCambiar(estado);
  }

  function mover(bloqueId: BloqueFichaId, direccion: -1 | 1): void {
    const orden = bloquesOrdenados(ficha, estado.bloques).map((x) => x.capa.bloqueId);
    const i = orden.indexOf(bloqueId);
    const j = i + direccion;
    if (i === -1 || j < 0 || j >= orden.length) return;
    [orden[i], orden[j]] = [orden[j]!, orden[i]!];
    cambiar({
      ...estado,
      bloques: estado.bloques.map((b) => ({ ...b, orden: orden.indexOf(b.bloqueId) })),
    });
  }

  function alternarVisible(bloqueId: BloqueFichaId): void {
    const siguiente = estado.bloques.map((b) =>
      b.bloqueId === bloqueId ? { ...b, visible: !b.visible } : b);
    if (!siguiente.some((b) => b.visible)) {
      mostrarAviso('Tiene que quedar al menos un bloque visible.');
      return;
    }
    cambiar({ ...estado, bloques: siguiente });
  }

  function alternarDestacado(bloqueId: BloqueFichaId): void {
    const actual = estado.bloques.find((b) => b.bloqueId === bloqueId);
    if (!actual) return;
    if (!actual.destacado) {
      const cuantos = estado.bloques.filter((b) => b.destacado && b.visible).length;
      if (cuantos >= MAXIMO_DESTACADOS) {
        mostrarAviso(`Podés destacar hasta ${MAXIMO_DESTACADOS} bloques. Sacá uno antes de agregar otro.`);
        return;
      }
    }
    cambiar({
      ...estado,
      bloques: estado.bloques.map((b) =>
        b.bloqueId === bloqueId ? { ...b, destacado: !b.destacado } : b),
    });
  }

  let temporizador: ReturnType<typeof setTimeout> | undefined;
  function mostrarAviso(texto: string): void {
    aviso.textContent = texto;
    aviso.hidden = false;
    if (temporizador) clearTimeout(temporizador);
    temporizador = setTimeout(() => { aviso.hidden = true; }, 4000);
  }

  function pintarBloques(): void {
    vaciar(lista);
    const ordenados = bloquesOrdenados(ficha, estado.bloques);
    ordenados.forEach(({ capa, oficial }, i) => {
      const fila = crear('li', { clase: `fichas-bloque${capa.visible ? '' : ' fichas-bloque--oculto'}${capa.destacado ? ' fichas-bloque--destacado' : ''}` });

      const cabecera = crear('div', { clase: 'fichas-bloque-cabecera' });
      cabecera.append(crear('span', { clase: 'fichas-bloque-titulo', texto: oficial.titulo }));
      if (oficial.sensibleAlPrecio) {
        cabecera.append(crear('span', { clase: 'fichas-etiqueta', texto: 'precio' }));
      }

      const acciones = crear('div', { clase: 'fichas-bloque-acciones' });

      const verOcultar = crear('button', {
        clase: 'fichas-btn',
        texto: capa.visible ? 'Ocultar' : 'Mostrar',
        atributos: { type: 'button', 'aria-pressed': String(!capa.visible) },
      });
      verOcultar.addEventListener('click', () => alternarVisible(capa.bloqueId));

      const destacar = crear('button', {
        clase: `fichas-btn${capa.destacado ? ' fichas-btn--activo' : ''}`,
        texto: capa.destacado ? 'Sin destacar' : 'Destacar',
        atributos: { type: 'button', 'aria-pressed': String(capa.destacado) },
      });
      destacar.disabled = !capa.visible;
      destacar.addEventListener('click', () => alternarDestacado(capa.bloqueId));

      const subir = crear('button', {
        clase: 'fichas-btn fichas-btn--icono', texto: '↑',
        atributos: { type: 'button', 'aria-label': `Subir ${oficial.titulo}` },
      });
      subir.disabled = i === 0;
      subir.addEventListener('click', () => mover(capa.bloqueId, -1));

      const bajar = crear('button', {
        clase: 'fichas-btn fichas-btn--icono', texto: '↓',
        atributos: { type: 'button', 'aria-label': `Bajar ${oficial.titulo}` },
      });
      bajar.disabled = i === ordenados.length - 1;
      bajar.addEventListener('click', () => mover(capa.bloqueId, 1));

      acciones.append(subir, bajar, verOcultar, destacar);
      cabecera.append(acciones);

      const cuerpo = crear('div', { clase: 'fichas-bloque-cuerpo' });
      cuerpo.append(...parrafosDeTexto(oficial.contenido));

      fila.append(cabecera, cuerpo);
      lista.append(fila);
    });
  }

  // --- Los dos textos del vendedor ----------------------------------------
  function campoTexto(
    etiqueta: string, ayuda: string, valor: string,
    alEscribir: (v: string) => void,
  ): HTMLElement {
    const id = `ficha-${etiqueta.toLowerCase().replace(/[^a-z]+/g, '-')}`;
    const grupo = crear('div', { clase: 'fichas-campo' });
    grupo.append(crear('label', { texto: etiqueta, atributos: { for: id } }));
    grupo.append(crear('span', { clase: 'fichas-ayuda', texto: ayuda }));
    const area = crear('textarea', { clase: 'fichas-textarea', atributos: { id, rows: '3' } });
    area.value = valor;
    area.addEventListener('input', () => alEscribir(area.value));
    grupo.append(area);
    return grupo;
  }

  panel.append(
    crear('h3', { clase: 'fichas-titulo-seccion', texto: 'Lo tuyo' }),
    crear('p', {
      clase: 'fichas-ayuda',
      texto: 'Esto se muestra separado del texto oficial, para que el cliente distinga qué dice Lab.IA y qué decís vos.',
    }),
    campoTexto(
      'Lo que conversamos',
      'Lo que te dijo en la reunión, con tus palabras.',
      estado.loQueConversamos,
      (v) => { estado = { ...estado, loQueConversamos: v }; alCambiar(estado); },
    ),
    campoTexto(
      'Nota del vendedor',
      'Un cierre corto: en qué quedaron.',
      estado.notaDelVendedor,
      (v) => { estado = { ...estado, notaDelVendedor: v }; alCambiar(estado); },
    ),
  );

  pintarBloques();
  contenedor.append(panel);
  return () => estado;
}
