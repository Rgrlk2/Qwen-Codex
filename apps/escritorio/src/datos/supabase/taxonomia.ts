/**
 * La taxonomía del motor, leída del servidor.
 *
 * El razonamiento vive en `@labia/compartido` y es el mismo para los datos de
 * ejemplo y para el servidor; lo único que cambia es con qué se lo alimenta.
 * Este archivo es ese "con qué" para el servidor.
 *
 * ⛔ Se lee UNA VEZ por carga de la aplicación. Son ~130 relaciones que casi
 *    nunca cambian: pedirlas en cada plan sería siete consultas por cada
 *    tecla. Si el vendedor da de alta una actividad nueva, se vuelve a pedir.
 */

import type {
  DatosTaxonomia, DefinicionActividad, Necesidad, Operacion, Producto,
  ProductoId, Probabilidad, RelacionNecesidadProducto, RelacionOperacionNecesidad,
} from '@labia/compartido';
import { supabase } from './conexion';

interface FilaOperacion {
  readonly id: string; readonly nombre: string;
  readonly pregunta: string; readonly estado: Operacion['estado'];
}
interface FilaNecesidad {
  readonly id: string; readonly nombre: string; readonly descripcion: string;
  readonly pregunta_confirmacion: string; readonly estado: Necesidad['estado'];
}
interface FilaActividad {
  readonly id: string; readonly nombre: string;
  readonly sinonimos: ReadonlyArray<string>;
}
interface FilaActividadOperacion {
  readonly actividad_id: string; readonly operacion_id: string;
  readonly probabilidad: Probabilidad; readonly motivo: string;
}
interface FilaOperacionNecesidad {
  readonly operacion_id: string; readonly necesidad_id: string;
  readonly probabilidad: Probabilidad; readonly motivo: string;
}
interface FilaNecesidadProducto {
  readonly necesidad_id: string; readonly producto_id: string;
  readonly encaje: RelacionNecesidadProducto['encaje'];
  readonly adaptacion_requerida: string | null;
  readonly argumento: string; readonly motivo: string;
}
interface FilaProducto {
  readonly id: string; readonly nombre: string; readonly familia: Producto['familia'];
  readonly orden: number; readonly clave_copy: string;
  readonly alias_historicos: ReadonlyArray<string>; readonly publicado: boolean;
}

/** ⛔ Si una consulta falla, no se arma media taxonomía: se lanza. */
async function traer<T>(tabla: string, columnas: string, orden?: string): Promise<T[]> {
  const sb = supabase();
  let consulta = sb.from(tabla).select(columnas);
  if (orden) consulta = consulta.order(orden, { ascending: true });
  const { data, error } = await consulta;
  if (error) throw error;
  return (data ?? []) as unknown as T[];
}

export async function leerTaxonomia(): Promise<DatosTaxonomia> {
  const [operaciones, necesidades, actividades, actOp, opNec, necProd, productos] =
    await Promise.all([
      traer<FilaOperacion>('operacion', 'id, nombre, pregunta, estado'),
      traer<FilaNecesidad>('necesidad', 'id, nombre, descripcion, pregunta_confirmacion, estado'),
      traer<FilaActividad>('actividad', 'id, nombre, sinonimos', 'nombre'),
      traer<FilaActividadOperacion>('actividad_operacion', 'actividad_id, operacion_id, probabilidad, motivo'),
      traer<FilaOperacionNecesidad>('operacion_necesidad', 'operacion_id, necesidad_id, probabilidad, motivo'),
      traer<FilaNecesidadProducto>('necesidad_producto', 'necesidad_id, producto_id, encaje, adaptacion_requerida, argumento, motivo'),
      traer<FilaProducto>('producto', 'id, nombre, familia, orden, clave_copy, alias_historicos, publicado', 'orden'),
    ]);

  // Las operaciones de cada actividad, agrupadas.
  const porActividad = new Map<string, Array<{ operacionId: string; probabilidad: Probabilidad; motivo: string }>>();
  for (const r of actOp) {
    const lista = porActividad.get(r.actividad_id) ?? [];
    lista.push({ operacionId: r.operacion_id, probabilidad: r.probabilidad, motivo: r.motivo });
    porActividad.set(r.actividad_id, lista);
  }

  const definiciones: DefinicionActividad[] = actividades.map((a) => ({
    id: a.id,
    nombre: a.nombre,
    sinonimos: a.sinonimos,
    operaciones: porActividad.get(a.id) ?? [],
  }));

  return {
    operaciones: operaciones.map((o) => ({
      id: o.id, nombre: o.nombre, pregunta: o.pregunta, estado: o.estado,
    })),
    necesidades: necesidades.map((n) => ({
      id: n.id, nombre: n.nombre, descripcion: n.descripcion,
      preguntaConfirmacion: n.pregunta_confirmacion, estado: n.estado,
    })),
    relacionesOperacionNecesidad: opNec.map((r): RelacionOperacionNecesidad => ({
      operacionId: r.operacion_id, necesidadId: r.necesidad_id,
      probabilidad: r.probabilidad, motivo: r.motivo,
    })),
    relacionesNecesidadProducto: necProd.map((r): RelacionNecesidadProducto => ({
      necesidadId: r.necesidad_id, productoId: r.producto_id as ProductoId,
      encaje: r.encaje, adaptacionRequerida: r.adaptacion_requerida,
      argumento: r.argumento, motivo: r.motivo,
    })),
    actividades: definiciones,
    productos: productos.map((p): Producto => ({
      id: p.id as ProductoId, nombre: p.nombre, familia: p.familia, orden: p.orden,
      claveCopy: p.clave_copy, aliasHistoricos: p.alias_historicos, publicado: p.publicado,
    })),
    versionTaxonomia: 1,
    versionCatalogo: 1,
  };
}

// ---------------------------------------------------------------------------
// La taxonomía, una sola vez por carga de la aplicación
// ---------------------------------------------------------------------------

/**
 * ⛔ UNA SOLA CACHÉ, acá. El motor la usa para planificar y las fichas
 *    internas la usan para saber cómo se vende cada producto. Si cada uno
 *    guardara la suya, el día que el vendedor da de alta una actividad nueva
 *    una de las dos se quedaría vieja, y no habría forma de saber cuál.
 */
let cargada: Promise<DatosTaxonomia> | null = null;

export function taxonomiaCargada(): Promise<DatosTaxonomia> {
  cargada ??= leerTaxonomia();
  return cargada;
}

/** Tras dar de alta o fusionar un término, lo que está en memoria quedó viejo. */
export function olvidarTaxonomiaCargada(): void {
  cargada = null;
}
