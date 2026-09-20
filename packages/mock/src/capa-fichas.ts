/**
 * Datos de ejemplo — la capa de fichas, ensamblada.
 *
 * ⛔ LA REGLA QUE ESTE ARCHIVO HACE CUMPLIR: la ficha oficial es fuente
 *    maestra y no se toca. Acá no hay ningún método que escriba en ella; lo
 *    único que se guarda es la CAPA del vendedor —qué bloques se ven, en qué
 *    orden, cuáles destacan y sus dos textos—. El contenido siempre sale del
 *    copy congelado, en cada lectura.
 *
 * ⛔ `obtenerFichaOficial` arma la ficha del copy cada vez que la piden. No
 *    hay una copia guardada que pueda quedar vieja: por eso el enlace sirve
 *    siempre el copy VIGENTE, y `revisarCopyDeFicha` es sólo un aviso para el
 *    vendedor.
 *
 * Ver packages/compartido/src/fichas.ts y docs/MASTER_SPEC.md §2.3.
 */

import type {
  AccesoEnlace, AvisoCopyDesactualizado, CapaFichas, ClaveIdempotencia,
  EnlaceCompartido, EntradaPorNecesidad, FichaOficial, FichaPersonalizada, Id,
  ISODate, NuevaFichaPersonalizada, OpcionesEnlaceFicha, OpcionesPagina,
  ProductoId, Version,
} from '@labia/compartido';
import { PRODUCTOS } from '@labia/compartido';
import type { NucleoMock } from './nucleo';
import { COPY_DE_LOS_TRECE, logoDe } from '@labia/compartido';
import {
  fichaOficialDe, huellaDelCopy, indiceDe, personalizacionInicial, porNecesidad, revisarCopy,
  validarPersonalizacion, type ErrorPersonalizacion,
} from '@labia/compartido';
import { CUENTAS_DE_EJEMPLO } from './datos-sesion';

const VENDEDOR_DEMO: Id = CUENTAS_DE_EJEMPLO.find((c) => c.rol === 'vendedor')?.id ?? 'usr-jpfdz';
const AHORA: ISODate = '2026-09-15T08:00:00-03:00';


/** Las trece, armadas del copy. Se calculan una vez por sesión del mock. */
const FICHAS_OFICIALES: ReadonlyMap<ProductoId, FichaOficial> = new Map(
  COPY_DE_LOS_TRECE.map((copy) => [
    copy.productoId,
    fichaOficialDe(copy, logoDe(copy.productoId), huellaDelCopy(copy.bruto), 1),
  ]),
);

/** Mensaje en castellano para cada regla de personalización. */
function mensajeDe(error: ErrorPersonalizacion): string {
  switch (error.tipo) {
    case 'demasiados_destacados':
      return `Elegiste ${error.cuantos} bloques destacados. Si todo resalta, nada resalta: como máximo dos.`;
    case 'orden_repetido':
      return 'Dos bloques quedaron en la misma posición. Volvé a ordenarlos.';
    case 'bloque_ausente':
      return 'Uno de los bloques elegidos no existe en la ficha de este producto.';
    case 'sin_bloques_visibles':
      return 'La ficha quedaría vacía: dejá visible al menos un bloque.';
  }
}

export function crearCapaFichasMock(nucleo: NucleoMock): CapaFichas {
  let capas: ReadonlyArray<FichaPersonalizada> = semilla();
  const clavesUsadas = new Map<string, unknown>();
  let enlaces: ReadonlyArray<EnlaceCompartido> = [];

  function idempotente<T>(clave: string, crear: () => T): T {
    if (clavesUsadas.has(clave)) return clavesUsadas.get(clave) as T;
    const resultado = crear();
    clavesUsadas.set(clave, resultado);
    return resultado;
  }

  return {
    // =====================================================================
    // La ficha oficial — ⛔ sólo lectura, siempre del copy vigente
    // =====================================================================
    async obtenerFichaOficial(productoId: ProductoId) {
      const ficha = FICHAS_OFICIALES.get(productoId);
      if (!ficha) {
        return nucleo.responderError<FichaOficial>({
          codigo: 'no_encontrado',
          mensajeAmable: 'Ese producto no está en el portafolio.',
        });
      }
      return nucleo.responder(ficha);
    },

    async indicePortafolio() {
      return nucleo.responder(indiceDe([...FICHAS_OFICIALES.values()]));
    },

    /**
     * ⛔ Entrada por dolor, no por nombre: el vendedor llega desde lo que el
     *    cliente dijo que le pasa. `porNecesidad` deja fuera lo adaptable.
     */
    async fichasPorNecesidad(necesidadId: Id) {
      const necesidad = NECESIDADES_DE_EJEMPLO.find((n) => n.id === necesidadId);
      if (!necesidad) {
        return nucleo.responderError<EntradaPorNecesidad>({
          codigo: 'no_encontrado',
          mensajeAmable: 'No encontramos esa necesidad.',
        });
      }
      const encajes = necesidad.encajes.flatMap((e) => {
        const ficha = FICHAS_OFICIALES.get(e.productoId);
        return ficha ? [{ ficha, encaje: e.encaje }] : [];
      });
      return nucleo.responder(porNecesidad(necesidad.id, necesidad.enunciado, encajes));
    },

    // =====================================================================
    // La capa del vendedor, para un prospecto
    // =====================================================================
    async listarFichasPersonalizadas(clienteId: Id, pagina?: OpcionesPagina) {
      const suyas = nucleo.listar(capas.filter((c) => c.clienteId === clienteId));
      return nucleo.responder(nucleo.paginar(suyas, pagina?.cursor, pagina?.limite));
    },

    async obtenerFichaPersonalizada(id: Id) {
      const capa = capas.find((c) => c.id === id);
      if (!capa) {
        return nucleo.responderError<FichaPersonalizada>({
          codigo: 'no_encontrado',
          mensajeAmable: 'No encontramos esa ficha preparada.',
        });
      }
      return nucleo.responder(capa);
    },

    async prepararFicha(datos: NuevaFichaPersonalizada, clave: ClaveIdempotencia) {
      const ficha = FICHAS_OFICIALES.get(datos.productoId);
      if (!ficha) {
        return nucleo.responderError<FichaPersonalizada>({
          codigo: 'no_encontrado',
          mensajeAmable: 'Ese producto no está en el portafolio.',
        });
      }
      const falla = validarPersonalizacion(ficha, datos.bloques);
      if (falla) {
        return nucleo.responderError<FichaPersonalizada>({
          codigo: 'regla_comercial', mensajeAmable: mensajeDe(falla),
        });
      }
      return idempotente(clave, () => {
        const nueva: FichaPersonalizada = {
          id: nucleo.identificador('ficha'),
          productoId: datos.productoId,
          clienteId: datos.clienteId,
          vendedorId: VENDEDOR_DEMO,
          planId: datos.planId ?? null,
          bloques: datos.bloques,
          loQueConversamos: datos.loQueConversamos ?? null,
          notaDelVendedor: datos.notaDelVendedor ?? null,
          huellaCopy: ficha.huellaCopy,
          version: 1,
          creadoEn: AHORA, creadoPor: VENDEDOR_DEMO,
          actualizadoEn: AHORA, actualizadoPor: VENDEDOR_DEMO,
        };
        capas = [...capas, nueva];
        return nucleo.responder(nueva);
      });
    },

    async actualizarFicha(id: Id, cambios: Partial<NuevaFichaPersonalizada>, version: Version) {
      const indice = capas.findIndex((c) => c.id === id);
      if (indice === -1) {
        return nucleo.responderError<FichaPersonalizada>({
          codigo: 'no_encontrado',
          mensajeAmable: 'No encontramos esa ficha preparada.',
        });
      }
      const actual = capas[indice]!;
      if (actual.version !== version) {
        return nucleo.responderError<FichaPersonalizada>({
          codigo: 'conflicto_version',
          mensajeAmable: 'Esta ficha cambió mientras la preparabas. Volvé a abrirla para ver lo último.',
        });
      }
      const ficha = FICHAS_OFICIALES.get(actual.productoId)!;
      const bloques = cambios.bloques ?? actual.bloques;
      const falla = validarPersonalizacion(ficha, bloques);
      if (falla) {
        return nucleo.responderError<FichaPersonalizada>({
          codigo: 'regla_comercial', mensajeAmable: mensajeDe(falla),
        });
      }
      const actualizada: FichaPersonalizada = {
        ...actual,
        bloques,
        loQueConversamos: cambios.loQueConversamos ?? actual.loQueConversamos,
        notaDelVendedor: cambios.notaDelVendedor ?? actual.notaDelVendedor,
        // ⛔ Al guardar se sella la huella vigente: es lo que compara el aviso.
        huellaCopy: ficha.huellaCopy,
        version: actual.version + 1,
        actualizadoEn: AHORA, actualizadoPor: VENDEDOR_DEMO,
      };
      capas = capas.map((c, i) => (i === indice ? actualizada : c));
      return nucleo.responder(actualizada);
    },

    /** ⛔ Descarta la capa. La ficha oficial no se toca. */
    async descartarFicha(id: Id, _motivo: string) {
      if (!capas.some((c) => c.id === id)) {
        return nucleo.responderError<void>({
          codigo: 'no_encontrado',
          mensajeAmable: 'No encontramos esa ficha preparada.',
        });
      }
      capas = capas.filter((c) => c.id !== id);
      return nucleo.responder(undefined as void);
    },

    async revisarCopyDeFicha(id: Id) {
      const capa = capas.find((c) => c.id === id);
      if (!capa) {
        return nucleo.responderError<AvisoCopyDesactualizado | null>({
          codigo: 'no_encontrado',
          mensajeAmable: 'No encontramos esa ficha preparada.',
        });
      }
      const ficha = FICHAS_OFICIALES.get(capa.productoId)!;
      return nucleo.responder(revisarCopy(ficha, capa));
    },

    // =====================================================================
    // El enlace
    // ⛔ Token opaco: no lleva el id de la ficha ni del cliente adentro.
    // =====================================================================
    async compartirFicha(id: Id, opciones: OpcionesEnlaceFicha, clave: ClaveIdempotencia) {
      if (!capas.some((c) => c.id === id)) {
        return nucleo.responderError<EnlaceCompartido>({
          codigo: 'no_encontrado',
          mensajeAmable: 'No encontramos esa ficha preparada.',
        });
      }
      return idempotente(clave, () => {
        const enlace: EnlaceCompartido = {
          id: nucleo.identificador('enlace'),
          // El enlace apunta a la CAPA preparada, no a la ficha oficial: lo
          // que vence y se revoca es lo que el vendedor armó para ese cliente.
          propuestaId: id,
          tipoPropuesta: 'ficha',
          versionPropuesta: capas.find((c) => c.id === id)?.version ?? 1,
          // ⛔ Token opaco: no deriva del id de la ficha ni del cliente.
          token: nucleo.identificador('tok'),
          venceEn: opciones.venceEn,
          topeAperturas: opciones.topeAperturas ?? null,
          aperturas: 0,
          // Una ficha no se firma ni se responde: se lee. Por eso no pide
          // código y nunca queda "respondida".
          requiereCodigo: false,
          respondido: false,
          revocadoEn: null,
          revocadoPor: null,
          creadoEn: AHORA,
          creadoPor: VENDEDOR_DEMO,
        };
        enlaces = [...enlaces, enlace];
        return nucleo.responder(enlace);
      });
    },

    async revocarEnlaceFicha(enlaceId: Id, _motivo: string) {
      const indice = enlaces.findIndex((e) => e.id === enlaceId);
      if (indice === -1) {
        return nucleo.responderError<EnlaceCompartido>({
          codigo: 'no_encontrado',
          mensajeAmable: 'No encontramos ese enlace.',
        });
      }
      const revocado: EnlaceCompartido = {
        ...enlaces[indice]!, revocadoEn: AHORA, revocadoPor: VENDEDOR_DEMO,
      };
      enlaces = enlaces.map((e, i) => (i === indice ? revocado : e));
      return nucleo.responder(revocado);
    },

    /** ⛔ Registro separado: las aperturas se leen, no se derivan del enlace. */
    async aperturasDeFicha(id: Id, pagina?: OpcionesPagina) {
      const suyas = nucleo.listar(APERTURAS_DE_EJEMPLO.filter((a) => a.documentoId === id));
      return nucleo.responder(nucleo.paginar(suyas, pagina?.cursor, pagina?.limite));
    },
  };
}

// ---------------------------------------------------------------------------
// Semilla
// ---------------------------------------------------------------------------

/**
 * Una ficha ya preparada, para que la vista no arranque siempre vacía.
 * Park.IA para el hotel: el vendedor ocultó el precio y destacó el ejemplo.
 */
function semilla(): ReadonlyArray<FichaPersonalizada> {
  const parkIa = FICHAS_OFICIALES.get('park-ia');
  if (!parkIa) return [];
  const bloques = personalizacionInicial(parkIa).map((b) => ({
    ...b,
    visible: b.bloqueId === 'precioDeReferencia' ? false : b.visible,
    destacado: b.bloqueId === 'ejemplo' || b.bloqueId === 'beneficios',
  }));
  return [{
    id: 'ficha-park-ia-hotel-las-mercedes',
    productoId: 'park-ia',
    clienteId: 'cliente-hotel-las-mercedes',
    vendedorId: VENDEDOR_DEMO,
    planId: null,
    bloques,
    loQueConversamos:
      'Me contaste que en el estacionamiento del hotel anotan las entradas en un cuaderno '
      + 'y que el fin de semana largo se les mezclaron los lugares reservados con los de paso. '
      + 'Te preparé esta ficha pensando en eso.',
    notaDelVendedor:
      'Cualquier duda escribime y lo vemos juntos. Si querés, armamos una prueba con un solo '
      + 'sector del estacionamiento antes de decidir nada.',
    huellaCopy: parkIa.huellaCopy,
    version: 1,
    creadoEn: AHORA, creadoPor: VENDEDOR_DEMO,
    actualizadoEn: AHORA, actualizadoPor: VENDEDOR_DEMO,
  }];
}

/**
 * Necesidades de ejemplo, enunciadas como las dice el cliente.
 * ⛔ `adaptable` y `no_recomendado` están a propósito: la entrada por dolor
 *    tiene que dejarlos fuera, y sin ellos esa regla no se probaría.
 */
const NECESIDADES_DE_EJEMPLO: ReadonlyArray<{
  readonly id: Id;
  readonly enunciado: string;
  readonly encajes: ReadonlyArray<{ readonly productoId: ProductoId; readonly encaje: string }>;
}> = [
  {
    id: 'necesidad-pierdo-mercaderia',
    enunciado: 'Se me vence la mercadería y me entero cuando ya la tiré',
    encajes: [
      { productoId: 'merma-ia', encaje: 'directo' },
      { productoId: 'radar-stock', encaje: 'cercano' },
      { productoId: 'precio-vivo', encaje: 'adaptable' },
      { productoId: 'exeq-ia', encaje: 'no_recomendado' },
    ],
  },
  {
    id: 'necesidad-no-doy-abasto-whatsapp',
    enunciado: 'No doy abasto con los mensajes de WhatsApp y pierdo ventas',
    encajes: [
      { productoId: 'vendedor-24-7', encaje: 'directo' },
      { productoId: 'agendar-ia', encaje: 'cercano' },
      { productoId: 'cotiza-facil', encaje: 'adaptable' },
    ],
  },
  {
    id: 'necesidad-no-se-que-dicen-de-mi',
    enunciado: 'No sé qué dicen de mi negocio en internet',
    encajes: [
      { productoId: 'ojo-digital', encaje: 'directo' },
      { productoId: 'pulso-digital', encaje: 'directo' },
      { productoId: 'faro-digital', encaje: 'cercano' },
    ],
  },
];

/** Aperturas del enlace de la ficha semilla. Registro propio, no derivado. */
const APERTURAS_DE_EJEMPLO: ReadonlyArray<AccesoEnlace> = [
  {
    id: 'acceso-ficha-1', enlaceId: 'enlace-ficha-park-ia',
    documentoId: 'ficha-park-ia-hotel-las-mercedes', tipoDocumento: 'ficha',
    ocurridoEn: '2026-09-15T19:42:00-03:00', tipoDispositivo: 'celular',
    paisAproximado: 'PY', duracionSegundos: 184, resultado: 'ok',
  },
  {
    id: 'acceso-ficha-2', enlaceId: 'enlace-ficha-park-ia',
    documentoId: 'ficha-park-ia-hotel-las-mercedes', tipoDocumento: 'ficha',
    ocurridoEn: '2026-09-16T08:11:00-03:00', tipoDispositivo: 'escritorio',
    paisAproximado: 'PY', duracionSegundos: 41, resultado: 'ok',
  },
];

/** ⛔ El portafolio es cerrado: trece, ni uno más. */
const _trece: 13 = PRODUCTOS.length as 13;
void _trece;
