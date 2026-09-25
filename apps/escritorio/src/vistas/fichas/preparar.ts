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
  BloqueFicha, BloqueFichaId, Dinero, FichaOficial, Moneda, PersonalizacionBloque,
  PrecioPreparado,
} from '@labia/compartido';
import {
  DECIMALES_MONEDA, MAXIMO_ACLARACION_PRECIO, NOTA_PRECIO_REFERENCIAL,
} from '@labia/compartido';
import { crear, parrafosDeTexto, vaciar } from './dom';

/** ⛔ Máximo dos destacados: si todo resalta, nada resalta (DATA_MODEL §7b.3). */
export const MAXIMO_DESTACADOS = 2;

export interface EstadoPreparacion {
  readonly bloques: ReadonlyArray<PersonalizacionBloque>;
  readonly loQueConversamos: string;
  readonly notaDelVendedor: string;
  /**
   * Precio referencial para este prospecto. `null` ⇒ el cliente ve el del copy.
   * ⛔ No es la cotización: eso lleva la aprobación del CEO.
   */
  readonly precio: PrecioPreparado | null;
}

/** Cuántas unidades mínimas entra una unidad de pantalla: USD en centavos. */
function factorMenor(moneda: Moneda): number {
  return 10 ** DECIMALES_MONEDA[moneda];
}

/** De lo que escribe el vendedor al importe guardado. Vacío ⇒ sin importe. */
function aImporte(valor: string, moneda: Moneda): Dinero | null {
  const limpio = valor.trim();
  if (limpio === '') return null;
  const numero = Number(limpio);
  if (!Number.isFinite(numero)) return null;
  return { monto: Math.round(numero * factorMenor(moneda)), moneda };
}

/** Y al revés, para rellenar el campo con lo que ya estaba guardado. */
function aCampo(importe: Dinero | null): string {
  if (!importe) return '';
  const f = factorMenor(importe.moneda);
  return f === 1 ? String(importe.monto) : String(importe.monto / f);
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

  /**
   * Cosas que hay que revisar cada vez que cambian los bloques.
   * Hoy sólo una: el aviso de "pusiste precio pero el bloque está oculto".
   */
  const alRepintarBloques: Array<() => void> = [];

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
    for (const revisar of alRepintarBloques) revisar();
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

  // --- El precio referencial ----------------------------------------------
  //
  // ⛔ POR QUÉ ESTÁ ACÁ: el copy publica rangos a propósito ("según plan",
  //    "según cantidad de usuarios"). Después de la reunión el vendedor sabe
  //    el tamaño del cliente y puede poner SU número. Sigue siendo
  //    referencial: lo que compromete a Lab.IA es la cotización, y ésa pasa
  //    por la aprobación del CEO antes de salir.
  //
  // ⛔ Y NO ROMPE LA REGLA: el copy no se edita en ningún lado. Acá se cargan
  //    dos importes y una aclaración; el renglón que lee el cliente lo arma
  //    `textoPrecioPreparado()`, la misma función en las dos pantallas.
  const bloquePrecio = ficha.bloques.find((b) => b.id === 'precioDeReferencia');
  if (bloquePrecio?.presente) {
    const seccion = crear('div', { clase: 'fichas-campo' });

    const encender = crear('input', {
      atributos: { type: 'checkbox', id: 'ficha-precio-propio' },
    }) as HTMLInputElement;
    encender.checked = estado.precio !== null;

    const lineaEncender = crear('div', { clase: 'fichas-precio-encender' });
    lineaEncender.append(
      encender,
      crear('label', {
        texto: 'Poner un precio para este cliente',
        atributos: { for: 'ficha-precio-propio' },
      }),
    );

    const delCopy = crear('div', { clase: 'fichas-precio-copy' });
    delCopy.append(
      crear('span', { clase: 'fichas-ayuda', texto: 'Si no lo ponés, el cliente ve lo que dice la ficha oficial:' }),
      ...parrafosDeTexto(bloquePrecio.contenido),
    );

    const campos = crear('div', { clase: 'fichas-precio-campos' });

    const selectMoneda = crear('select', {
      clase: 'fichas-entrada', atributos: { id: 'ficha-precio-moneda' },
    }) as HTMLSelectElement;
    for (const m of ['PYG', 'USD'] as const) {
      const opcion = crear('option', { texto: m === 'PYG' ? 'Guaraníes' : 'Dólares' }) as HTMLOptionElement;
      opcion.value = m;
      selectMoneda.append(opcion);
    }
    selectMoneda.value = estado.precio?.setup?.moneda ?? estado.precio?.mensual?.moneda ?? 'PYG';

    function campoNumero(id: string, etiqueta: string, ayuda: string, valor: string): HTMLInputElement {
      const grupo = crear('div', { clase: 'fichas-campo' });
      grupo.append(crear('label', { texto: etiqueta, atributos: { for: id } }));
      grupo.append(crear('span', { clase: 'fichas-ayuda', texto: ayuda }));
      const entrada = crear('input', {
        clase: 'fichas-entrada',
        atributos: { id, type: 'number', min: '0', step: '1', inputmode: 'numeric' },
      }) as HTMLInputElement;
      entrada.value = valor;
      grupo.append(entrada);
      campos.append(grupo);
      return entrada;
    }

    const grupoMoneda = crear('div', { clase: 'fichas-campo' });
    grupoMoneda.append(
      crear('label', { texto: 'Moneda', atributos: { for: 'ficha-precio-moneda' } }),
      selectMoneda,
    );
    campos.append(grupoMoneda);

    const entradaSetup = campoNumero(
      'ficha-precio-setup', 'Implementación',
      'Lo que se paga una vez, al inicio. Dejalo vacío si este producto no lo cobra.',
      aCampo(estado.precio?.setup ?? null),
    );
    const entradaMensual = campoNumero(
      'ficha-precio-mensual', 'Mensualidad',
      'Lo que se paga cada mes. Dejalo vacío si se cobra una sola vez.',
      aCampo(estado.precio?.mensual ?? null),
    );

    const grupoAclaracion = crear('div', { clase: 'fichas-campo' });
    grupoAclaracion.append(
      crear('label', { texto: 'Aclaración (opcional)', atributos: { for: 'ficha-precio-aclaracion' } }),
      crear('span', { clase: 'fichas-ayuda', texto: 'Qué incluye ese precio: "3 sucursales y 5 usuarios".' }),
    );
    const entradaAclaracion = crear('input', {
      clase: 'fichas-entrada',
      atributos: {
        id: 'ficha-precio-aclaracion', type: 'text',
        maxlength: String(MAXIMO_ACLARACION_PRECIO),
      },
    }) as HTMLInputElement;
    entradaAclaracion.value = estado.precio?.aclaracion ?? '';
    grupoAclaracion.append(entradaAclaracion);
    campos.append(grupoAclaracion);

    function leerPrecio(): PrecioPreparado | null {
      if (!encender.checked) return null;
      const moneda = selectMoneda.value as Moneda;
      const setup = aImporte(entradaSetup.value, moneda);
      const mensual = aImporte(entradaMensual.value, moneda);
      // ⛔ Sin ningún importe no hay precio: se vuelve al del copy antes que
      //    mostrarle al cliente un bloque de precio vacío.
      if (!setup && !mensual) return null;
      const aclaracion = entradaAclaracion.value.trim();
      return { setup, mensual, aclaracion: aclaracion === '' ? null : aclaracion };
    }

    const avisoPrecio = crear('p', {
      clase: 'fichas-aviso',
      texto: 'Pusiste un precio, pero el bloque "Precio de referencia" está oculto: el cliente no lo va a ver.',
      atributos: { role: 'status' },
    });

    function refrescarPrecio(): void {
      campos.hidden = !encender.checked;
      delCopy.hidden = encender.checked;
      const bloque = estado.bloques.find((b) => b.bloqueId === 'precioDeReferencia');
      avisoPrecio.hidden = !(encender.checked && bloque !== undefined && !bloque.visible);
      estado = { ...estado, precio: leerPrecio() };
      alCambiar(estado);
    }

    encender.addEventListener('change', refrescarPrecio);
    selectMoneda.addEventListener('change', refrescarPrecio);
    for (const entrada of [entradaSetup, entradaMensual, entradaAclaracion]) {
      entrada.addEventListener('input', refrescarPrecio);
    }
    alRepintarBloques.push(() => {
      const bloque = estado.bloques.find((b) => b.bloqueId === 'precioDeReferencia');
      avisoPrecio.hidden = !(encender.checked && bloque !== undefined && !bloque.visible);
    });

    seccion.append(lineaEncender, delCopy, campos, avisoPrecio);
    panel.append(
      crear('h3', { clase: 'fichas-titulo-seccion', texto: 'El precio' }),
      crear('p', { clase: 'fichas-ayuda', texto: NOTA_PRECIO_REFERENCIAL }),
      seccion,
    );
    campos.hidden = !encender.checked;
    delCopy.hidden = encender.checked;
    avisoPrecio.hidden = true;
  }

  pintarBloques();
  contenedor.append(panel);
  return () => estado;
}
