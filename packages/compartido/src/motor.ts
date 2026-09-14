/**
 * Motor de planificación comercial.
 *
 * El corazón del sistema. Dos entradas —conocido y rubro— y una misma salida.
 *
 * ⛔ Acepta CUALQUIER rubro escrito. Nunca responde "rubro no encontrado":
 *    un término desconocido se crea como `pendiente_de_revision` y sigue funcionando.
 * ⛔ Nunca propone un producto fuera de los 13.
 * ⛔ Nunca inventa un precio.
 * ⛔ No se limita al mapeo literal de "Dónde tiene más sentido": ésa fue la semilla.
 *    El motor razona por actividad → operación → necesidad → producto.
 * ⛔ Toda inferencia se muestra COMO HIPÓTESIS, con su motivo.
 *
 * Ver MASTER_SPEC.md §2.2 y §6, DATA_MODEL.md §4 y §5.
 */

import type { Dinero, Id, ISODate } from './core';
import type { ProductoId } from './catalogo';

// ---------------------------------------------------------------------------
// Taxonomía — tres capas, editable y ampliable
// ---------------------------------------------------------------------------

/**
 * `pendiente_de_revision`: lo escribió un vendedor y todavía no lo confirmó
 * el administrador. **Es usable de inmediato.** El motor no frena por esto.
 */
export type EstadoTermino = 'confirmada' | 'pendiente_de_revision';

/** Probabilidad de una relación de taxonomía. Ordena, no puntúa. */
export type Probabilidad = 'tipica' | 'frecuente' | 'ocasional';

/** Capa 1 — a qué se dedica el negocio. */
export interface Actividad {
  readonly id: Id;
  readonly nombre: string;
  readonly sinonimos: ReadonlyArray<string>;
  readonly estado: EstadoTermino;
  readonly creadaPor: Id;
  readonly creadaEn: ISODate;
  /** Si fue fusionada con otra actividad, el id de destino. */
  readonly fusionadaEn: Id | null;
}

/** Capa 2 — cómo funciona el negocio por dentro. */
export interface Operacion {
  readonly id: Id;
  readonly nombre: string;
  /** La pregunta que se le hace al vendedor para confirmarla. */
  readonly pregunta: string;
  readonly estado: EstadoTermino;
}

/** Capa 3 — qué le duele. */
export interface Necesidad {
  readonly id: Id;
  readonly nombre: string;
  readonly descripcion: string;
  /** Qué preguntarle al cliente para validar o descartar este dolor. */
  readonly preguntaConfirmacion: string;
  readonly estado: EstadoTermino;
}

/** ⛔ Toda relación guarda su motivo: es lo que permite explicar un ranking. */
export interface RelacionActividadOperacion {
  readonly actividadId: Id;
  readonly operacionId: Id;
  readonly probabilidad: Probabilidad;
  readonly motivo: string;
}

export interface RelacionOperacionNecesidad {
  readonly operacionId: Id;
  readonly necesidadId: Id;
  readonly probabilidad: Probabilidad;
  readonly motivo: string;
}

/** Cuán bien le calza un producto a un negocio. Se lee SIEMPRE en texto, no sólo por color. */
export type Encaje = 'directo' | 'cercano' | 'adaptable' | 'no_recomendado';

export interface RelacionNecesidadProducto {
  readonly necesidadId: Id;
  readonly productoId: ProductoId;
  readonly encaje: Encaje;
  /** Obligatorio en `cercano` y `adaptable`: qué hay que ajustar. */
  readonly adaptacionRequerida: string | null;
  readonly argumento: string;
  readonly motivo: string;
}

export type CambioTaxonomia =
  | { readonly tipo: 'alta_actividad'; readonly nombre: string; readonly sinonimos?: ReadonlyArray<string> }
  | { readonly tipo: 'alta_operacion'; readonly nombre: string; readonly pregunta: string }
  | { readonly tipo: 'alta_necesidad'; readonly nombre: string; readonly descripcion: string; readonly preguntaConfirmacion: string }
  | { readonly tipo: 'relacion_actividad_operacion'; readonly datos: RelacionActividadOperacion }
  | { readonly tipo: 'relacion_operacion_necesidad'; readonly datos: RelacionOperacionNecesidad }
  | { readonly tipo: 'relacion_necesidad_producto'; readonly datos: RelacionNecesidadProducto };

// ---------------------------------------------------------------------------
// Entrada
// ---------------------------------------------------------------------------

export type TipoEntradaPlan = 'conocido' | 'rubro';

/**
 * ⛔ Sólo `nombre` y `queHace` son obligatorios.
 * El resto mejora el plan; no lo bloquea. El vendedor arranca con lo que sabe.
 */
export interface EntradaPlan {
  readonly tipo: TipoEntradaPlan;
  readonly nombre: string;
  /** Qué hace el negocio, en las palabras del vendedor. Texto libre. */
  readonly queHace: string;
  readonly ciudad?: string;
  readonly tamanoAproximado?: 'chico' | 'mediano' | 'grande';
  /** "Es amigo mío", "es mi primo", "es mi odontóloga". */
  readonly relacionConVendedor?: string;
  readonly loQueYaSabe?: string;
}

// ---------------------------------------------------------------------------
// Salida — el plan
// ---------------------------------------------------------------------------

/** Cómo funciona el negocio. `presente: null` = todavía sin confirmar. */
export interface OperacionDelPerfil {
  readonly operacionId: Id;
  readonly nombre: string;
  readonly presente: boolean | null;
  readonly origen: 'inferido' | 'confirmado_por_vendedor';
  readonly motivo: string;
}

export interface PerfilOperativo {
  readonly actividadId: Id;
  readonly nombreActividad: string;
  readonly actividadEsNueva: boolean;
  readonly operaciones: ReadonlyArray<OperacionDelPerfil>;
  readonly resumen: string;
}

/**
 * Un dolor inferido.
 * ⛔ `esHipotesis` es literalmente `true`: el motor jamás presenta una
 *    inferencia como hecho verificado.
 */
export interface DolorInferido {
  readonly necesidadId: Id;
  readonly nombre: string;
  readonly probabilidad: Probabilidad;
  readonly motivo: string;
  readonly esHipotesis: true;
  readonly preguntaConfirmacion: string;
  readonly confirmadoPorVendedor: boolean | null;
}

/** Una de las 13 posiciones del ranking. */
export interface PosicionRanking {
  /** 1 a 13. */
  readonly posicion: number;
  readonly productoId: ProductoId;
  readonly encaje: Encaje;
  readonly puntaje: number;
  /** ⛔ No vacío. Es la respuesta a "¿por qué éste primero?". */
  readonly motivo: string;
  readonly necesidadesQueAtiende: ReadonlyArray<Id>;
  /** Obligatorio en `cercano` y `adaptable`. */
  readonly adaptacionRequerida: string | null;
  /** `posicion <= 10`. */
  readonly enTop10: boolean;
}

/** Dos o tres productos que se potencian en ese negocio. */
export interface Combo {
  readonly productoIds: ReadonlyArray<ProductoId>;
  readonly motivo: string;
  readonly argumentoUnificado: string;
  readonly ordenDeEntrada: ReadonlyArray<ProductoId>;
}

export interface Argumento {
  readonly productoId: ProductoId;
  readonly texto: string;
  /** De qué sección del copy aprobado sale. El motor no inventa argumentos. */
  readonly seccionCopy: string;
}

export interface PreguntaConfirmacion {
  readonly necesidadId: Id;
  readonly pregunta: string;
  readonly queValida: string;
}

export interface EstrategiaEntrada {
  readonly porDondeEmpezar: string;
  readonly productoDeEntrada: ProductoId;
  readonly gancho: string;
  readonly queEvitar: string | null;
}

/** El plan completo. `generarPlan` lo devuelve sin persistir nada. */
export interface Plan {
  readonly id: Id | null;
  readonly eje: EjePlan;
  readonly objetivoId: Id | null;
  readonly vendedorId: Id;
  readonly entrada: EntradaPlan;
  readonly perfilOperativo: PerfilOperativo;
  readonly doloresInferidos: ReadonlyArray<DolorInferido>;
  /** ⛔ Exactamente 13 posiciones, sin productos repetidos. */
  readonly ranking: ReadonlyArray<PosicionRanking>;
  /** Posiciones 1, 2 y 3. */
  readonly productosDestacados: readonly [ProductoId, ProductoId, ProductoId];
  readonly combos: ReadonlyArray<Combo>;
  readonly estrategiaEntrada: EstrategiaEntrada;
  readonly argumentos: ReadonlyArray<Argumento>;
  readonly preguntasConfirmacion: ReadonlyArray<PreguntaConfirmacion>;
  /** Ningún producto encaja: el plan ofrece registrar una sugerencia. */
  readonly ningunProductoEncaja: boolean;
  readonly versionTaxonomia: number;
  readonly versionCatalogo: number;
  readonly generadoEn: ISODate;
}

/** ⛔ Un plan tiene UN SOLO eje. */
export type EjePlan = 'empresa' | 'profesional' | 'rubro';

export type MotivoCierrePlan = 'cumplido' | 'parcial' | 'descartado' | 'reemplazado';

/** El vendedor corrige el perfil ("no, no tiene reparto propio"). */
export interface AjustePerfil {
  readonly operacionId: Id;
  readonly presente: boolean;
}

/** Al recalcular, el motor muestra QUÉ CAMBIÓ. */
export interface CambioPlan {
  readonly productoId: ProductoId;
  readonly posicionAnterior: number;
  readonly posicionNueva: number;
  readonly encajeAnterior: Encaje;
  readonly encajeNuevo: Encaje;
  readonly motivo: string;
}

export interface PlanRecalculado {
  readonly plan: Plan;
  readonly cambios: ReadonlyArray<CambioPlan>;
}

// ---------------------------------------------------------------------------
// Plan de rubro
// ---------------------------------------------------------------------------

export interface PlanDeRubro extends Plan {
  readonly eje: 'rubro';
  readonly periodoDesde: ISODate;
  readonly periodoHasta: ISODate;
  /** En guaraníes. */
  readonly metaGuaranies: Dinero;
  readonly estado: 'abierto' | 'cerrado';
  readonly motivoCierre: MotivoCierrePlan | null;
}

/**
 * ⛔ Un plan de rubro NO crea clientes.
 * Aceptar un objetivo genera una tarea, nunca un registro comercial.
 */
export interface ObjetivoSugerido {
  readonly id: Id;
  readonly planId: Id;
  readonly clienteId: Id;
  readonly nombreCliente: string;
  readonly estado: 'sugerido' | 'aceptado' | 'descartado';
}

export interface FiltroPlanes {
  readonly eje?: EjePlan;
  readonly estado?: 'abierto' | 'cerrado';
  readonly vendedorId?: Id;
  readonly objetivoId?: Id;
}
