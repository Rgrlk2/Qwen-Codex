/**
 * Traducción de los errores de Postgres al contrato del Escritorio.
 *
 * ⛔ REGLA: al vendedor nunca le llega jerga técnica. Ni un código SQL, ni un
 *    nombre de restricción, ni un "violates check constraint". Llega una
 *    frase en castellano que dice qué pasó y qué hacer.
 *
 * ⛔ Y algo más importante: los mensajes que las reglas de la base levantan
 *    están escritos para leerse. Cuando una regla comercial rechaza algo
 *    —"una cotización sólo se envía al cliente después de aprobada"— ese
 *    texto SE MUESTRA TAL CUAL, porque explica exactamente lo que pasó.
 */

import type { CodigoError, ErrorApi, Resultado } from '@labia/compartido';

interface ErrorPostgres {
  readonly code?: string;
  readonly message?: string;
  readonly details?: string;
  readonly hint?: string;
}

/** Códigos de Postgres → códigos del contrato. */
function codigoDesde(pg: ErrorPostgres): CodigoError {
  switch (pg.code) {
    case '40001': return 'conflicto_version';   // el sello de trazado freno una escritura vieja
    case '23505': return 'validacion';          // clave duplicada
    case '23503': return 'no_encontrado';       // clave foránea rota
    case '23514': return 'regla_comercial';     // restricción de negocio
    case '23502': return 'validacion';          // falta un dato obligatorio
    case '42501': return 'sin_permiso';         // permisos de la base
    case 'PGRST301':
    case '401':   return 'no_autenticado';
    case 'P0001': return 'regla_comercial';     // raise exception nuestro
    default:      return 'servicio_no_disponible';
  }
}

/**
 * Las reglas de la base levantan mensajes pensados para una persona. Cuando
 * el error viene de una de ellas (`P0001` o una restricción con nombre
 * nuestro), se muestra ese texto; si no, uno genérico.
 */
function mensajeAmable(pg: ErrorPostgres, codigo: CodigoError): string {
  const crudo = (pg.message ?? '').trim();

  // Mensajes escritos por nosotros: empiezan explicando y no traen jerga.
  const esNuestro = pg.code === 'P0001'
    || /DATA_MODEL|COMMERCIAL_RULES|portafolio Lab\.IA/.test(crudo);
  if (esNuestro && crudo.length > 0) {
    return crudo.replace(/\s*\((DATA_MODEL|COMMERCIAL_RULES)[^)]*\)\s*$/, '').trim();
  }

  if (pg.code === '23505') {
    return 'Ya existe algo registrado con ese dato. Revisá si no lo cargaste antes.';
  }

  switch (codigo) {
    case 'sin_permiso':
      return 'Esta parte del Escritorio es de Administración. Si creés que tendrías que verla, avisale a Rodrigo.';
    case 'no_autenticado':
      return 'Tu sesión venció. Volvé a entrar.';
    case 'conflicto_version':
      return 'Esto cambió mientras lo editabas. Volvé a abrirlo para ver lo último.';
    case 'no_encontrado':
      return 'No encontramos eso.';
    case 'validacion':
      return 'Falta completar algún dato obligatorio.';
    case 'regla_comercial':
      return 'Esa operación no está permitida por una regla comercial.';
    default:
      return 'No pudimos completar la operación. Probá de nuevo en un momento.';
  }
}

export function fallo<T>(pg: unknown): Resultado<T> {
  const e = (pg ?? {}) as ErrorPostgres;
  const codigo = codigoDesde(e);
  const error: ErrorApi = {
    codigo,
    mensajeAmable: mensajeAmable(e, codigo),
    ...(codigo === 'servicio_no_disponible'
      ? { pista: 'Si sigue pasando, avisá: puede ser el servidor y no vos.' }
      : {}),
  };
  return { ok: false, error };
}

export function bien<T>(datos: T): Resultado<T> {
  return { ok: true, datos };
}

/** Envuelve una consulta: nunca deja escapar una excepción cruda a la vista. */
export async function intentar<T>(
  consulta: () => Promise<{ data: unknown; error: unknown }>,
  transformar: (datos: never) => T,
): Promise<Resultado<T>> {
  try {
    const { data, error } = await consulta();
    if (error) return fallo<T>(error);
    return bien(transformar(data as never));
  } catch (e) {
    return fallo<T>(e);
  }
}
