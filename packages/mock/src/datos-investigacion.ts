/**
 * Datos de ejemplo — dominio: investigacion.
 *
 * ⛔ DUEÑA: Sesión 3. Ninguna otra sesión edita este archivo.
 *
 * Implementa `investigarObjetivo` y sus vecinos de `CapaMotor` (API_CONTRACTS
 * §2.3) con los CINCO escenarios que exige el mock: completa · parcial ·
 * fuentes caídas · sin resultados · error. El tercero es el más importante:
 * prueba que el sistema NUNCA le devuelve al vendedor un formulario vacío
 * cuando algo falla (MASTER_SPEC §3.6).
 *
 * ⛔ Sin productos fuera de los 13.
 * ⛔ Sin roles fuera de vendedor y administrador.
 * ⛔ Sin copy aprobado duplicado acá: se referencia por productoId.
 *
 * ⛔ CERO CLAVES, TOKENS NI LLAMADAS A PROVEEDORES EXTERNOS ACÁ. Este archivo
 *    simula lo que el servidor devolvería YA RESUELTO. En producción, esta
 *    misma forma (`InvestigacionObjetivo`) la arma el servidor detrás de
 *    ProveedorBusqueda / ProveedorRegistroPublico / ProveedorModeloLenguaje
 *    (investigacion.ts §Proveedores); el navegador nunca ve una clave.
 *
 * Selección de escenario (determinística, para poder probar los cinco a
 * pedido): el texto de la entrada se inspecciona por palabra clave —
 * "error" → error; "caídas"/"sin conexión" → fuentes_caidas;
 * "inexistente"/"no existe" → sin_resultados; "parcial" → parcial;
 * una EMPRESA con sólo RUC (sin nombre para cruzar) → parcial con respaldo
 * de taxonomía; cualquier otro caso → completa.
 */

import type {
  CampoFaltante,
  CanalDigital,
  CorreccionDato,
  DatoInvestigado,
  EntradaObjetivo,
  EstadoInvestigacion,
  EstadoProveedores,
  FuenteInvestigacion,
  Id,
  InvestigacionCorregida,
  InvestigacionObjetivo,
  NivelConfianza,
  Plan,
  PosibleDecisor,
  SenalOperativa,
  TamanoAproximado,
  TipoFuente,
} from '@labia/compartido';

import {
  construirPerfilOperativo,
  construirRanking,
  generarId,
  inferirDolores,
  normalizarTexto,
  planDesdeResultadoInvestigacion,
  resolverActividad,
  VERSION_CATALOGO,
  VERSION_TAXONOMIA,
} from './datos-motor';
import type { ResolucionActividad } from './datos-motor';

// ---------------------------------------------------------------------------
// Datos investigados — constructores
// ---------------------------------------------------------------------------

function verificado<T>(campo: string, valor: T, fuentesIds: ReadonlyArray<Id>, confianza: NivelConfianza): DatoInvestigado<T> {
  return { campo, valor, clasificacion: 'verificado', confianza, fuentesIds, razonamiento: null, confirmadoPorVendedor: false, valorCorregido: null };
}

function inferido<T>(campo: string, valor: T, razonamiento: string, confianza: NivelConfianza): DatoInvestigado<T> {
  return { campo, valor, clasificacion: 'inferido', confianza, fuentesIds: [], razonamiento, confirmadoPorVendedor: false, valorCorregido: null };
}

function noEncontrado<T>(campo: string): DatoInvestigado<T> {
  return { campo, valor: null, clasificacion: 'no_encontrado', confianza: null, fuentesIds: [], razonamiento: null, confirmadoPorVendedor: false, valorCorregido: null };
}

// ---------------------------------------------------------------------------
// Fuentes por escenario
// ---------------------------------------------------------------------------

function fuente(tipo: TipoFuente, nombre: string, url: string | null, exito: boolean, motivoFallo: string | null = null): FuenteInvestigacion {
  return { id: generarId('fuente'), tipo, nombre, url, consultadaEn: new Date().toISOString(), exito, motivoFallo };
}

function fuentesPorEscenario(estado: EstadoInvestigacion): ReadonlyArray<FuenteInvestigacion> {
  switch (estado) {
    case 'completa':
      return [
        fuente('buscador', 'Buscador web', null, true),
        fuente('mapa', 'Mapa de comercios', null, true),
        fuente('red_social', 'Redes sociales públicas', null, true),
        fuente('registro_publico', 'Registro público de contribuyentes', null, true),
      ];
    case 'parcial':
      return [
        fuente('buscador', 'Buscador web', null, true),
        fuente('red_social', 'Redes sociales públicas', null, true),
        fuente('directorio', 'Directorio comercial', null, false, 'No devolvió resultados dentro del tiempo de espera.'),
      ];
    case 'fuentes_caidas':
      return [
        fuente('buscador', 'Buscador web', null, false, 'Tiempo de espera agotado.'),
        fuente('registro_publico', 'Registro público de contribuyentes', null, false, 'Servicio no disponible en este momento.'),
        fuente('red_social', 'Redes sociales públicas', null, false, 'Servicio no disponible en este momento.'),
      ];
    case 'sin_resultados':
      return [
        fuente('buscador', 'Buscador web', null, true),
        fuente('mapa', 'Mapa de comercios', null, true),
        fuente('red_social', 'Redes sociales públicas', null, true),
      ];
    case 'error':
      return [
        fuente('buscador', 'Buscador web', null, false, 'El proveedor de búsqueda devolvió un error interno.'),
        fuente('registro_publico', 'Registro público de contribuyentes', null, false, 'El proveedor de registros públicos devolvió un error interno.'),
      ];
    case 'en_curso':
      return [];
  }
}

// ---------------------------------------------------------------------------
// Texto identificador de la entrada (lo que se investiga)
// ---------------------------------------------------------------------------

function nombreParaMostrar(entrada: EntradaObjetivo): string {
  if (entrada.tipo === 'empresa') return entrada.nombreComercial ?? entrada.razonSocial ?? entrada.ruc ?? 'la empresa';
  if (entrada.tipo === 'profesional') return entrada.nombre;
  return entrada.rubro;
}

function textoParaActividad(entrada: EntradaObjetivo): string {
  if (entrada.tipo === 'empresa') return entrada.nombreComercial ?? entrada.razonSocial ?? '';
  if (entrada.tipo === 'profesional') return entrada.profesionOEspecialidad;
  return entrada.rubro;
}

function tieneNombreParaCruzar(entrada: EntradaObjetivo): boolean {
  if (entrada.tipo === 'empresa') return Boolean(entrada.nombreComercial || entrada.razonSocial);
  return true;
}

/** ⛔ Determinística y documentada arriba: permite probar los cinco escenarios a pedido. */
function detectarEscenario(entrada: EntradaObjetivo): EstadoInvestigacion {
  const texto = normalizarTexto(JSON.stringify(entrada));
  if (/\berror\b/.test(texto)) return 'error';
  if (/caidas|sin conexion|sinconexion/.test(texto)) return 'fuentes_caidas';
  if (/inexistente|no existe|noexiste/.test(texto)) return 'sin_resultados';
  if (/\bparcial\b/.test(texto)) return 'parcial';
  if (!tieneNombreParaCruzar(entrada)) return 'parcial';
  return 'completa';
}

// ---------------------------------------------------------------------------
// El cuerpo de la investigación
// ---------------------------------------------------------------------------

function idsDe(fuentes: ReadonlyArray<FuenteInvestigacion>, tipos: ReadonlyArray<TipoFuente>): ReadonlyArray<Id> {
  return fuentes.filter((f) => f.exito && tipos.includes(f.tipo)).map((f) => f.id);
}

function construirCanales(entrada: EntradaObjetivo, nombre: string): ReadonlyArray<CanalDigital> {
  if (entrada.tipo === 'rubro') return [];
  const slug = normalizarTexto(nombre).replace(/\s+/g, '');
  return [
    { tipo: 'whatsapp', url: `https://wa.me/595900000000`, identificador: null, activo: true },
    { tipo: 'instagram', url: `https://instagram.com/${slug}`, identificador: `@${slug}`, activo: true },
  ];
}

function construirDecisores(entrada: EntradaObjetivo, fuenteId: Id): ReadonlyArray<PosibleDecisor> {
  if (entrada.tipo === 'profesional') {
    return [{ nombre: entrada.nombre, cargo: entrada.profesionOEspecialidad, fuenteId, confianza: 'alta' }];
  }
  if (entrada.tipo === 'empresa') {
    return [{ nombre: 'Titular o encargado del local', cargo: 'A confirmar con el vendedor', fuenteId, confianza: 'baja' }];
  }
  return [];
}

/** El motor razona sobre el texto de la entrada: nunca queda sin perfil. */
function razonar(entrada: EntradaObjetivo, vendedorId: Id) {
  const resolucion = resolverActividad(textoParaActividad(entrada), vendedorId);
  const perfilOperativo = construirPerfilOperativo(resolucion);
  const doloresProbables = inferirDolores(perfilOperativo);
  const productosRecomendados = construirRanking(doloresProbables);
  return { resolucion, perfilOperativo, doloresProbables, productosRecomendados };
}

function construirInvestigacion(entrada: EntradaObjetivo, vendedorId: Id, forzarEscenario?: EstadoInvestigacion): InvestigacionObjetivo {
  const estado = forzarEscenario ?? detectarEscenario(entrada);
  const fuentes = fuentesPorEscenario(estado);
  const nombre = nombreParaMostrar(entrada);
  const { resolucion, perfilOperativo, doloresProbables, productosRecomendados } = razonar(entrada, vendedorId);
  const idsBuscador = idsDe(fuentes, ['buscador', 'mapa']);
  const idsRegistro = idsDe(fuentes, ['registro_publico']);
  const idsRedSocial = idsDe(fuentes, ['red_social']);
  const usoRespaldoTaxonomia = estado === 'fuentes_caidas' || estado === 'error';

  let actividad: DatoInvestigado<string>;
  let ubicacion: DatoInvestigado<string>;
  let sitioWeb: DatoInvestigado<string>;
  let productosOServicios: DatoInvestigado<ReadonlyArray<string>>;
  let senalesOperativas: DatoInvestigado<ReadonlyArray<SenalOperativa>>;
  let tamanoAproximado: DatoInvestigado<TamanoAproximado>;
  let canalesDigitales: DatoInvestigado<ReadonlyArray<CanalDigital>>;
  let redesEncontradas: DatoInvestigado<ReadonlyArray<CanalDigital>>;
  let posiblesDecisores: DatoInvestigado<ReadonlyArray<PosibleDecisor>>;
  const datosMinimosFaltantes: CampoFaltante[] = [];

  switch (estado) {
    case 'completa': {
      actividad = resolucion.esNueva
        ? inferido('actividad', resolucion.actividad.nombre, `Se dedujo del nombre "${nombre}"; no es una actividad confirmada todavía en la taxonomía.`, 'media')
        : verificado('actividad', resolucion.actividad.nombre, [...idsBuscador, ...idsRegistro], 'alta');
      ubicacion = verificado('ubicacion', entrada.ciudad ?? 'Asunción', idsBuscador, 'media');
      sitioWeb = inferido('sitioWeb', `https://www.google.com/search?q=${encodeURIComponent(nombre)}`, 'No se encontró un dominio propio; se referencia la búsqueda pública del nombre.', 'baja');
      productosOServicios = verificado('productosOServicios', [perfilOperativo.nombreActividad], idsBuscador, 'media');
      senalesOperativas = verificado(
        'senalesOperativas',
        perfilOperativo.operaciones.slice(0, 3).map((o) => ({ operacionId: o.operacionId, descripcion: o.nombre, evidencia: 'Mencionado en publicaciones públicas recientes.', confianza: 'media' as NivelConfianza })),
        idsRedSocial,
        'media',
      );
      tamanoAproximado = inferido('tamanoAproximado', 'chico', 'Un solo local visible en redes y poca variedad de fotos: perfil típico de negocio chico. Confirmar con el vendedor.', 'baja');
      canalesDigitales = verificado('canalesDigitales', construirCanales(entrada, nombre), idsRedSocial, 'media');
      redesEncontradas = canalesDigitales;
      posiblesDecisores = verificado('posiblesDecisores', construirDecisores(entrada, idsBuscador[0] ?? fuentes[0]!.id), idsBuscador, 'baja');
      break;
    }
    case 'parcial': {
      const sinNombre = !tieneNombreParaCruzar(entrada);
      actividad = sinNombre
        ? inferido('actividad', perfilOperativo.nombreActividad, 'Sólo se aportó el RUC: sin un nombre para cruzar contra fuentes públicas, se toma la mejor referencia disponible.', 'baja')
        : inferido('actividad', resolucion.actividad.nombre, `Coincide parcialmente con "${nombre}" en las fuentes que sí respondieron.`, 'media');
      ubicacion = entrada.ciudad ? verificado('ubicacion', entrada.ciudad, idsBuscador, 'media') : noEncontrado('ubicacion');
      sitioWeb = noEncontrado('sitioWeb');
      productosOServicios = verificado('productosOServicios', [perfilOperativo.nombreActividad], idsBuscador, 'baja');
      senalesOperativas = noEncontrado('senalesOperativas');
      tamanoAproximado = noEncontrado('tamanoAproximado');
      canalesDigitales = verificado('canalesDigitales', construirCanales(entrada, nombre), idsRedSocial, 'baja');
      redesEncontradas = canalesDigitales;
      posiblesDecisores = noEncontrado('posiblesDecisores');
      if (sinNombre) {
        datosMinimosFaltantes.push({
          campo: 'nombreComercial',
          pregunta: '¿Con qué nombre lo conocen los clientes?',
          porQueHaceFalta: 'El RUC solo no alcanza para cruzarlo contra fuentes públicas ni redes.',
          obligatorio: false,
          opciones: null,
        });
      }
      break;
    }
    case 'fuentes_caidas': {
      actividad = inferido(
        'actividad',
        perfilOperativo.nombreActividad,
        'Las fuentes externas no respondieron; se usa la taxonomía interna como respaldo a partir de lo que escribió el vendedor.',
        'baja',
      );
      ubicacion = entrada.ciudad ? verificado('ubicacion', entrada.ciudad, [], 'baja') : noEncontrado('ubicacion');
      sitioWeb = noEncontrado('sitioWeb');
      productosOServicios = inferido('productosOServicios', [perfilOperativo.nombreActividad], 'Se infiere del perfil típico de la actividad, sin confirmación externa.', 'baja');
      senalesOperativas = noEncontrado('senalesOperativas');
      tamanoAproximado = noEncontrado('tamanoAproximado');
      canalesDigitales = noEncontrado('canalesDigitales');
      redesEncontradas = noEncontrado('redesEncontradas');
      posiblesDecisores = noEncontrado('posiblesDecisores');
      datosMinimosFaltantes.push(
        {
          campo: 'confirmarActividad',
          pregunta: `¿A qué se dedica exactamente "${nombre}"?`,
          porQueHaceFalta: 'Sin esto, el plan se arma con un perfil genérico en vez de uno ajustado a este negocio.',
          obligatorio: true,
          opciones: null,
        },
        {
          campo: 'ciudad',
          pregunta: '¿En qué ciudad está?',
          porQueHaceFalta: 'Ayuda a priorizar el seguimiento, aunque el plan funciona igual sin este dato.',
          obligatorio: false,
          opciones: null,
        },
      );
      break;
    }
    case 'sin_resultados': {
      actividad = inferido(
        'actividad',
        perfilOperativo.nombreActividad,
        `Las fuentes respondieron pero no hay rastro público de "${nombre}"; se toma como referencia lo que escribió el vendedor.`,
        'baja',
      );
      ubicacion = noEncontrado('ubicacion');
      sitioWeb = noEncontrado('sitioWeb');
      productosOServicios = inferido('productosOServicios', [perfilOperativo.nombreActividad], 'Sin rastro público: se infiere del perfil típico de la actividad declarada.', 'baja');
      senalesOperativas = noEncontrado('senalesOperativas');
      tamanoAproximado = noEncontrado('tamanoAproximado');
      canalesDigitales = noEncontrado('canalesDigitales');
      redesEncontradas = noEncontrado('redesEncontradas');
      posiblesDecisores = noEncontrado('posiblesDecisores');
      datosMinimosFaltantes.push({
        campo: 'confirmarActividad',
        pregunta: `¿Es correcto que "${nombre}" se dedica a "${perfilOperativo.nombreActividad}"?`,
        porQueHaceFalta: 'No se encontró presencia pública: confirmarlo evita construir el plan sobre un supuesto equivocado.',
        obligatorio: true,
        opciones: null,
      });
      break;
    }
    case 'error': {
      actividad = inferido(
        'actividad',
        perfilOperativo.nombreActividad,
        'El proveedor de búsqueda e investigación falló; se usa la taxonomía interna como respaldo.',
        'baja',
      );
      ubicacion = noEncontrado('ubicacion');
      sitioWeb = noEncontrado('sitioWeb');
      productosOServicios = inferido('productosOServicios', [perfilOperativo.nombreActividad], 'Se infiere del perfil típico de la actividad, sin poder confirmar por la falla del proveedor.', 'baja');
      senalesOperativas = noEncontrado('senalesOperativas');
      tamanoAproximado = noEncontrado('tamanoAproximado');
      canalesDigitales = noEncontrado('canalesDigitales');
      redesEncontradas = noEncontrado('redesEncontradas');
      posiblesDecisores = noEncontrado('posiblesDecisores');
      datosMinimosFaltantes.push({
        campo: 'confirmarActividad',
        pregunta: `¿A qué se dedica exactamente "${nombre}"?`,
        porQueHaceFalta: 'El proveedor de investigación falló; con este dato el plan deja de depender de un supuesto genérico.',
        obligatorio: true,
        opciones: null,
      });
      break;
    }
    case 'en_curso': {
      actividad = noEncontrado('actividad');
      ubicacion = noEncontrado('ubicacion');
      sitioWeb = noEncontrado('sitioWeb');
      productosOServicios = noEncontrado('productosOServicios');
      senalesOperativas = noEncontrado('senalesOperativas');
      tamanoAproximado = noEncontrado('tamanoAproximado');
      canalesDigitales = noEncontrado('canalesDigitales');
      redesEncontradas = noEncontrado('redesEncontradas');
      posiblesDecisores = noEncontrado('posiblesDecisores');
      break;
    }
  }

  const confianzaGlobal = calcularConfianzaGlobal([actividad, ubicacion, senalesOperativas, tamanoAproximado]);

  return {
    id: generarId('inv'),
    entrada,
    estado,
    investigadoEn: new Date().toISOString(),
    vendedorId,
    actividad,
    actividadId: resolucion.actividad.id,
    ubicacion,
    canalesDigitales,
    sitioWeb,
    redesEncontradas,
    productosOServicios,
    senalesOperativas,
    posiblesDecisores,
    tamanoAproximado,
    perfilOperativo,
    doloresProbables,
    productosRecomendados,
    fuentesConsultadas: fuentes,
    confianzaGlobal,
    datosMinimosFaltantes,
    usoRespaldoTaxonomia,
    versionTaxonomia: VERSION_TAXONOMIA,
    versionCatalogo: VERSION_CATALOGO,
  };
}

function calcularConfianzaGlobal(datos: ReadonlyArray<DatoInvestigado<unknown>>): NivelConfianza {
  const puntaje: Readonly<Record<NivelConfianza, number>> = { alta: 3, media: 2, baja: 1 };
  const confianzas = datos.map((d) => d.confianza).filter((c): c is NivelConfianza => c !== null);
  if (confianzas.length === 0) return 'baja';
  const promedio = confianzas.reduce((total, c) => total + puntaje[c], 0) / confianzas.length;
  if (promedio >= 2.5) return 'alta';
  if (promedio >= 1.5) return 'media';
  return 'baja';
}

// ---------------------------------------------------------------------------
// Almacén en memoria (mock) — para estadoInvestigacion(id)
// ---------------------------------------------------------------------------

const almacenInvestigaciones = new Map<Id, InvestigacionObjetivo>();

export function investigarObjetivo(entrada: EntradaObjetivo, vendedorId: Id, forzarEscenario?: EstadoInvestigacion): InvestigacionObjetivo {
  const investigacion = construirInvestigacion(entrada, vendedorId, forzarEscenario);
  almacenInvestigaciones.set(investigacion.id, investigacion);
  return investigacion;
}

export function estadoInvestigacion(id: Id): InvestigacionObjetivo | null {
  return almacenInvestigaciones.get(id) ?? null;
}

/**
 * El vendedor confirma, corrige o agrega. Una corrección sobre `actividad`
 * vuelve a resolver el perfil y recalcula el ranking, mostrando qué cambió
 * (MASTER_SPEC §3.4).
 */
export function corregirInvestigacion(
  investigacion: InvestigacionObjetivo,
  correcciones: ReadonlyArray<CorreccionDato>,
): InvestigacionCorregida {
  let actualizada: InvestigacionObjetivo = { ...investigacion };
  const rankingAnterior = new Map(investigacion.productosRecomendados.map((p) => [p.productoId, p]));

  for (const correccion of correcciones) {
    if (correccion.campo === 'actividad' && (correccion.accion === 'corregir' || correccion.accion === 'agregar')) {
      const textoNuevo = String(correccion.valor);
      const resolucion: ResolucionActividad = resolverActividad(textoNuevo, investigacion.vendedorId);
      const perfilOperativo = construirPerfilOperativo(resolucion);
      const doloresProbables = inferirDolores(perfilOperativo);
      const productosRecomendados = construirRanking(doloresProbables);
      actualizada = {
        ...actualizada,
        actividad: {
          ...actualizada.actividad,
          valor: resolucion.actividad.nombre,
          confirmadoPorVendedor: true,
          valorCorregido: resolucion.actividad.nombre,
        },
        actividadId: resolucion.actividad.id,
        perfilOperativo,
        doloresProbables,
        productosRecomendados,
      };
    } else {
      actualizada = aplicarCorreccionSimple(actualizada, correccion);
    }
  }

  const cambios = actualizada.productosRecomendados
    .map((nueva) => {
      const anterior = rankingAnterior.get(nueva.productoId);
      if (!anterior || (anterior.posicion === nueva.posicion && anterior.encaje === nueva.encaje)) return null;
      return {
        productoId: nueva.productoId,
        posicionAnterior: anterior.posicion,
        posicionNueva: nueva.posicion,
        encajeAnterior: anterior.encaje,
        encajeNuevo: nueva.encaje,
        motivo: anterior.posicion > nueva.posicion
          ? `Subió del puesto ${anterior.posicion} al ${nueva.posicion} tras la corrección.`
          : anterior.posicion < nueva.posicion
            ? `Bajó del puesto ${anterior.posicion} al ${nueva.posicion} tras la corrección.`
            : `Mantuvo el puesto ${nueva.posicion}, pero cambió su encaje de "${anterior.encaje}" a "${nueva.encaje}".`,
      };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null)
    .sort((a, b) => a.posicionNueva - b.posicionNueva);

  almacenInvestigaciones.set(actualizada.id, actualizada);
  return { investigacion: actualizada, cambios };
}

function aplicarCorreccionSimple(investigacion: InvestigacionObjetivo, correccion: CorreccionDato): InvestigacionObjetivo {
  const marcar = <T>(dato: DatoInvestigado<T>): DatoInvestigado<T> => ({
    ...dato,
    confirmadoPorVendedor: correccion.accion !== 'descartar',
    valorCorregido: correccion.accion === 'corregir' || correccion.accion === 'agregar' ? (correccion.valor as T) : dato.valorCorregido,
  });
  switch (correccion.campo) {
    case 'ubicacion': return { ...investigacion, ubicacion: marcar(investigacion.ubicacion) };
    case 'sitioWeb': return { ...investigacion, sitioWeb: marcar(investigacion.sitioWeb) };
    case 'productosOServicios': return { ...investigacion, productosOServicios: marcar(investigacion.productosOServicios) };
    case 'tamanoAproximado': return { ...investigacion, tamanoAproximado: marcar(investigacion.tamanoAproximado) };
    default: return investigacion;
  }
}

/** Convierte una investigación confirmada en un plan (CapaMotor.planDesdeInvestigacion). */
export function planDesdeInvestigacion(investigacion: InvestigacionObjetivo): Plan {
  const eje = investigacion.entrada.tipo;
  const nombre = nombreParaMostrar(investigacion.entrada);
  const queHace = investigacion.actividad.valorCorregido ?? investigacion.actividad.valor ?? investigacion.perfilOperativo.nombreActividad;
  return planDesdeResultadoInvestigacion(
    { tipo: eje === 'rubro' ? 'rubro' : 'conocido', nombre, queHace },
    eje,
    investigacion.vendedorId,
    investigacion.perfilOperativo,
    investigacion.doloresProbables,
    investigacion.productosRecomendados,
  );
}

// ---------------------------------------------------------------------------
// Estado de los proveedores — sólo lectura para Administración
// ---------------------------------------------------------------------------

export function estadoProveedores(): EstadoProveedores {
  return {
    busqueda: [
      { nombre: 'Buscador web (proveedor a definir)', tipo: 'buscador', disponible: true },
      { nombre: 'Mapa de comercios (proveedor a definir)', tipo: 'mapa', disponible: true },
    ],
    registrosPublicos: [
      { nombre: 'Registro de contribuyentes (proveedor a definir)', pais: 'PY', identificadoresSoportados: ['ruc', 'razon_social'], disponible: true },
    ],
    modeloLenguaje: [
      { nombre: 'Modelo de lenguaje (proveedor a definir)', usos: ['normalizar', 'inferir', 'redactar', 'clasificar'], disponible: true },
    ],
    modoRespaldo: false,
    verificadoEn: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Datos de ejemplo listos — los cinco escenarios, para que la vista los pruebe
// ---------------------------------------------------------------------------

const VENDEDOR_EJEMPLO = 'vendedor-demo';

export const INVESTIGACION_COMPLETA: InvestigacionObjetivo = investigarObjetivo(
  { tipo: 'empresa', ruc: '80012345-6', razonSocial: 'Comercial San Miguel S.A.', nombreComercial: 'Repuestera del Este', ciudad: 'Asunción' },
  VENDEDOR_EJEMPLO,
  'completa',
);

export const INVESTIGACION_PARCIAL: InvestigacionObjetivo = investigarObjetivo(
  { tipo: 'profesional', nombre: 'Dra. Marta Ayala', profesionOEspecialidad: 'Odontología' },
  VENDEDOR_EJEMPLO,
  'parcial',
);

export const INVESTIGACION_FUENTES_CAIDAS: InvestigacionObjetivo = investigarObjetivo(
  { tipo: 'rubro', rubro: 'motel' },
  VENDEDOR_EJEMPLO,
  'fuentes_caidas',
);

export const INVESTIGACION_SIN_RESULTADOS: InvestigacionObjetivo = investigarObjetivo(
  { tipo: 'empresa', nombreComercial: 'Negocio Inexistente XYZ' },
  VENDEDOR_EJEMPLO,
  'sin_resultados',
);

export const INVESTIGACION_ERROR: InvestigacionObjetivo = investigarObjetivo(
  { tipo: 'empresa', ruc: '80099999-1' },
  VENDEDOR_EJEMPLO,
  'error',
);
