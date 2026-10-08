/**
 * El motor de planificación: de un texto de actividad a un plan.
 *
 * Acá vive el razonamiento completo —perfil operativo, dolores inferidos,
 * ranking de productos, combos, estrategia de entrada, argumentos y preguntas
 * de confirmación— y NO los datos sobre los que razona.
 *
 * ⛔ Por qué está en `compartido` y no en el mock: es lo que decide qué le
 *    recomienda Lab.IA a un cliente. Con dos copias —una para los datos de
 *    ejemplo y otra para el servidor— la tercera corrección arregla una y se
 *    olvida de la otra, y el Escritorio pasa a aconsejar distinto según de
 *    dónde vengan los datos. Una sola copia, alimentada por dos fuentes.
 *
 * ⛔ Nada de esto persiste. `generarPlan` y `recalcularPlan` devuelven el plan
 *    para que el vendedor lo ajuste; guardarlo ocurre aparte.
 */

import type { Id } from './core';
import type { Producto, ProductoId } from './catalogo';
import type {
  Actividad, AjustePerfil, Argumento, CambioPlan, Combo, DolorInferido, Encaje,
  EjePlan, EntradaPlan, EstadoTermino, EstrategiaEntrada, Necesidad, Operacion,
  OperacionDelPerfil, PerfilOperativo, Plan, PlanRecalculado, PosicionRanking,
  PreguntaConfirmacion, Probabilidad, RelacionNecesidadProducto,
  RelacionOperacionNecesidad,
} from './motor';

interface OperacionAsignada {
  readonly operacionId: Id;
  readonly probabilidad: Probabilidad;
  readonly motivo: string;
}

interface DefinicionActividad {
  readonly id: Id;
  readonly nombre: string;
  readonly sinonimos: ReadonlyArray<string>;
  readonly operaciones: ReadonlyArray<OperacionAsignada>;
}

export type { OperacionAsignada, DefinicionActividad };

export interface ResolucionActividad {
  readonly actividad: Actividad;
  readonly esNueva: boolean;
  readonly operaciones: ReadonlyArray<OperacionAsignada>;
}

/**
 * Lo que el motor necesita saber para razonar. Los datos de ejemplo lo arman
 * con sus semillas; la capa de Supabase, con lo que lee de la base.
 */
export interface DatosTaxonomia {
  readonly operaciones: ReadonlyArray<Operacion>;
  readonly necesidades: ReadonlyArray<Necesidad>;
  readonly relacionesOperacionNecesidad: ReadonlyArray<RelacionOperacionNecesidad>;
  readonly relacionesNecesidadProducto: ReadonlyArray<RelacionNecesidadProducto>;
  readonly actividades: ReadonlyArray<DefinicionActividad>;
  readonly productos: ReadonlyArray<Producto>;
  readonly versionTaxonomia: number;
  readonly versionCatalogo: number;
}


let contadorId = 1;
export function generarId(prefijo: string): Id {
  contadorId += 1;
  return `${prefijo}-${contadorId.toString(36)}`;
}

/** Minúsculas, sin acentos, sin puntuación repetida. Para comparar texto libre. */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Descripción breve, propia, de qué hace cada producto. Nunca el copy aprobado. */
const FUNCION_NUCLEO: Readonly<Record<ProductoId, string>> = {
  'ojo-digital': 'lee el video de las cámaras que ya existen para mostrar circulación y horarios de mayor movimiento',
  'pulso-digital': 'arma un historial diario de ventas y gastos a partir de unos pocos datos enviados por WhatsApp',
  'vendedor-24-7': 'atiende consultas por WhatsApp cuando no hay nadie del equipo disponible',
  'radar-stock': 'cruza historial de ventas y stock disponible para decidir qué reponer y qué frenar',
  'faro-digital': 'sigue precios y movimientos visibles de la competencia',
  'merma-ia': 'cruza compras, ventas y stock real para encontrar dónde se pierde mercadería',
  'cotiza-facil': 'guía con preguntas antes de armar una cotización, para no recomendar a ciegas',
  'precio-vivo': 'sugiere cuándo conviene subir, bajar o mantener el precio de cada producto',
  'ruta-ia': 'reordena las paradas del reparto del día para acortar el recorrido',
  'park-ia': 'registra en tiempo real qué lugares de un espacio administrado están libres y ocupados, y calcula el cobro',
  'smart-commerce': 'abre una tienda online con un panel gerencial armado para ese negocio',
  'agendar-ia': 'organiza turnos, reservas y la agenda de un equipo, con lista de espera',
  'exeq-ia': 'mide la ocupación de cada sala para redistribuir personal e insumos entre servicios simultáneos',
} as const;

interface PalabraClave {
  readonly patron: RegExp;
  readonly operacionId: Id;
  readonly motivo: string;
}

const PALABRAS_CLAVE_OPERACION: ReadonlyArray<PalabraClave> = [
  { patron: /stock|inventari|dep[oó]sit|almac[eé]n|mercader/i, operacionId: 'op-maneja-stock', motivo: 'El texto menciona stock, inventario o depósito.' },
  { patron: /turno|reserv|cita|agenda|horario/i, operacionId: 'op-trabaja-turnos', motivo: 'El texto menciona turnos, reservas o citas.' },
  { patron: /whatsapp|consulta|atenci[oó]n al cliente|mensaje/i, operacionId: 'op-atiende-whatsapp', motivo: 'El texto sugiere atención de consultas por chat.' },
  { patron: /repart|delivery|domicilio|entrega/i, operacionId: 'op-reparte-domicilio', motivo: 'El texto menciona reparto o entregas.' },
  { patron: /local|sucursal|tienda|sal[oó]n|mostrador/i, operacionId: 'op-local-circulacion', motivo: 'El texto sugiere un local físico con circulación de público.' },
  { patron: /profesional|especialista|t[eé]cnico|equipo de/i, operacionId: 'op-varios-profesionales', motivo: 'El texto sugiere más de un profesional o técnico trabajando.' },
  { patron: /variedad|cat[aá]logo|productos|modelos/i, operacionId: 'op-catalogo-amplio', motivo: 'El texto sugiere un catálogo o variedad amplia de productos.' },
  { patron: /proveedor|compra|import/i, operacionId: 'op-compra-proveedores', motivo: 'El texto menciona compra a proveedores.' },
  { patron: /precio|temporada|mercado|demanda/i, operacionId: 'op-precios-mueven', motivo: 'El texto sugiere precios que cambian con el mercado o la temporada.' },
  { patron: /espacio|sala|lugar(es)?|estacionamiento|mesa/i, operacionId: 'op-administra-espacios', motivo: 'El texto sugiere administración de espacios físicos.' },
];

export function op(operacionId: Id, probabilidad: Probabilidad, motivo: string): OperacionAsignada {
  return { operacionId, probabilidad, motivo };
}

/**
 * Arma el motor sobre una taxonomía concreta.
 *
 * Las búsquedas de abajo son lo único que toca los datos; el razonamiento que
 * les sigue es el mismo se lo alimente quien se lo alimente.
 */
export function crearMotorDePlanificacion(datos: DatosTaxonomia) {
  const VERSION_TAXONOMIA = datos.versionTaxonomia;
  const VERSION_CATALOGO = datos.versionCatalogo;
  const RELACIONES_OPERACION_NECESIDAD = datos.relacionesOperacionNecesidad;
  const RELACIONES_NECESIDAD_PRODUCTO = datos.relacionesNecesidadProducto;
  const ACTIVIDADES_CURADAS = datos.actividades;
  const PRODUCTOS_CATALOGO = datos.productos;
  const PRODUCTOS: ReadonlyArray<ProductoId> = datos.productos.map((p) => p.id);

  // Registros vivos: `resolverActividad` agrega términos nuevos acá.
  const registroOperaciones: Operacion[] = [...datos.operaciones];
  const registroNecesidades: Necesidad[] = [...datos.necesidades];

  function buscarOperacion(id: Id): Operacion | null {
    return registroOperaciones.find((o) => o.id === id) ?? null;
  }

  function buscarNecesidad(id: Id): Necesidad | null {
    return registroNecesidades.find((n) => n.id === id) ?? null;
  }

  function relacionesDeOperacion(operacionId: Id): ReadonlyArray<RelacionOperacionNecesidad> {
    return RELACIONES_OPERACION_NECESIDAD.filter((r) => r.operacionId === operacionId);
  }

  function relacionNecesidadProducto(necesidadId: Id, productoId: ProductoId): RelacionNecesidadProducto {
    const explicita = RELACIONES_NECESIDAD_PRODUCTO.find(
      (r) => r.necesidadId === necesidadId && r.productoId === productoId,
    );
    if (explicita) return explicita;
    const necesidad = buscarNecesidad(necesidadId);
    const nombreProd = nombreProducto(productoId);
    return {
      necesidadId,
      productoId,
      encaje: 'no_recomendado',
      adaptacionRequerida: null,
      argumento: '',
      motivo: `${nombreProd} ${FUNCION_NUCLEO[productoId]}; no se relaciona con "${necesidad?.nombre ?? necesidadId}".`,
    };
  }

  const registroActividades: Actividad[] = ACTIVIDADES_CURADAS.map((def) => ({
    id: def.id,
    nombre: def.nombre,
    sinonimos: def.sinonimos,
    estado: 'confirmada' as EstadoTermino,
    creadaPor: 'sistema',
    creadaEn: '2026-09-14T00:00:00-03:00',
    fusionadaEn: null,
  }));

  const operacionesPorActividad = new Map<Id, ReadonlyArray<OperacionAsignada>>(
    ACTIVIDADES_CURADAS.map((def) => [def.id, def.operaciones]),
  );

  function operacionesPorHeuristico(textoNormalizado: string): ReadonlyArray<OperacionAsignada> {
    const encontradas: OperacionAsignada[] = [];
    for (const { patron, operacionId, motivo } of PALABRAS_CLAVE_OPERACION) {
      if (patron.test(textoNormalizado)) {
        encontradas.push({ operacionId, probabilidad: 'frecuente', motivo });
      }
    }
    if (encontradas.length > 0) return encontradas;
    // ⛔ Nunca queda vacío: MASTER_SPEC M1 — el motor nunca rechaza una entrada.
    return [
      op('op-atiende-whatsapp', 'ocasional', 'Sin más información que el texto escrito, se asume un negocio de atención al público típico; hay que confirmarlo con el vendedor.'),
      op('op-local-circulacion', 'ocasional', 'Sin más información, se asume que recibe algún tipo de público; hay que confirmarlo con el vendedor.'),
    ];
  }

  /** Coincidencia exacta o por sinónimo, tolerante a plural/singular simple. */
  function coincideActividad(textoNormalizado: string, def: DefinicionActividad): boolean {
    const candidatos = [def.nombre, ...def.sinonimos].map(normalizarTexto);
    return candidatos.some((c) => c.length > 2 && (textoNormalizado.includes(c) || c.includes(textoNormalizado)));
  }

  function buscarActividad(texto: string): ReadonlyArray<Actividad> {
    const t = normalizarTexto(texto);
    if (t.length === 0) return registroActividades;
    return registroActividades.filter((a) => {
      const candidatos = [a.nombre, ...a.sinonimos].map(normalizarTexto);
      return candidatos.some((c) => c.includes(t) || t.includes(c));
    });
  }

  /**
   * ⛔ NUNCA devuelve "no encontrado" (MASTER_SPEC M1, T4). Si el texto no
   * coincide con la semilla curada, crea la actividad como `pendiente_de_revision`
   * y le arma un perfil provisorio con el heurístico por palabras clave.
   */
  function resolverActividad(texto: string, creadaPor: Id): ResolucionActividad {
    const t = normalizarTexto(texto);
    // ⛔ Texto vacío: cualquier candidato "incluye" la cadena vacía, así que sin
    // esta guarda coincidiría siempre con el primer curado. Va directo al
    // heurístico (que arma el perfil mínimo por defecto).
    const definicion = t.length === 0 ? undefined : ACTIVIDADES_CURADAS.find((d) => coincideActividad(t, d));
    if (definicion) {
      const actividad = registroActividades.find((a) => a.id === definicion.id);
      if (actividad) {
        return { actividad, esNueva: false, operaciones: operacionesPorActividad.get(definicion.id) ?? [] };
      }
    }
    const existente = registroActividades.find(
      (a) => normalizarTexto(a.nombre) === t && a.estado === 'pendiente_de_revision',
    );
    if (existente) {
      return { actividad: existente, esNueva: true, operaciones: operacionesPorActividad.get(existente.id) ?? operacionesPorHeuristico(t) };
    }
    const nombre = texto.trim().length > 0 ? texto.trim() : 'Rubro sin especificar';
    const nueva: Actividad = {
      id: generarId('act'),
      nombre,
      sinonimos: [],
      estado: 'pendiente_de_revision',
      creadaPor,
      creadaEn: new Date().toISOString(),
      fusionadaEn: null,
    };
    registroActividades.push(nueva);
    const operaciones = operacionesPorHeuristico(t);
    operacionesPorActividad.set(nueva.id, operaciones);
    return { actividad: nueva, esNueva: true, operaciones };
  }

  // ===========================================================================
  // Del texto al plan: perfil → dolores → ranking → combos → estrategia
  // ===========================================================================

  function nombreProducto(id: ProductoId): string {
    const producto = PRODUCTOS_CATALOGO.find((p) => p.id === id);
    return producto?.nombre ?? id;
  }

  function construirPerfilOperativo(resolucion: ResolucionActividad): PerfilOperativo {
    const operaciones: OperacionDelPerfil[] = resolucion.operaciones.map((asignada) => {
      const operacion = buscarOperacion(asignada.operacionId);
      return {
        operacionId: asignada.operacionId,
        nombre: operacion?.nombre ?? asignada.operacionId,
        presente: asignada.probabilidad === 'ocasional' ? null : true,
        origen: 'inferido',
        motivo: asignada.motivo,
      };
    });
    const resumen = resolucion.esNueva
      ? `"${resolucion.actividad.nombre}" no está confirmado todavía en la taxonomía: el perfil de abajo es una primera aproximación, a partir de lo que sugiere el texto escrito.`
      : `Perfil típico de "${resolucion.actividad.nombre}", a partir de la taxonomía confirmada.`;
    return {
      actividadId: resolucion.actividad.id,
      nombreActividad: resolucion.actividad.nombre,
      actividadEsNueva: resolucion.esNueva,
      operaciones,
      resumen,
    };
  }

  /** `tipica` + incierto → `frecuente`; cualquier otra + incierto → `ocasional`. Nunca sube. */
  function combinarProbabilidad(base: Probabilidad, incierto: boolean): Probabilidad {
    if (!incierto) return base;
    return base === 'tipica' ? 'frecuente' : 'ocasional';
  }

  const PESO_PROBABILIDAD: Readonly<Record<Probabilidad, number>> = { tipica: 3, frecuente: 2, ocasional: 1 };
  const PESO_ENCAJE: Readonly<Record<Encaje, number>> = { directo: 4, cercano: 3, adaptable: 2, no_recomendado: 0 };

  function inferirDolores(perfil: PerfilOperativo): ReadonlyArray<DolorInferido> {
    interface Acumulado { probabilidad: Probabilidad; peso: number; motivos: string[] }
    const acumulado = new Map<Id, Acumulado>();

    for (const opDelPerfil of perfil.operaciones) {
      if (opDelPerfil.presente === false) continue;
      const incierto = opDelPerfil.presente === null;
      for (const rel of relacionesDeOperacion(opDelPerfil.operacionId)) {
        const probabilidad = combinarProbabilidad(rel.probabilidad, incierto);
        const peso = PESO_PROBABILIDAD[probabilidad];
        const motivo = `${opDelPerfil.nombre.charAt(0).toLowerCase()}${opDelPerfil.nombre.slice(1)} → ${rel.motivo}`;
        const previo = acumulado.get(rel.necesidadId);
        if (!previo || peso > previo.peso) {
          acumulado.set(rel.necesidadId, { probabilidad, peso, motivos: previo ? [motivo, ...previo.motivos] : [motivo] });
        } else {
          previo.motivos.push(motivo);
        }
      }
    }

    const dolores: DolorInferido[] = [];
    for (const [necesidadId, datos] of acumulado) {
      const necesidad = buscarNecesidad(necesidadId);
      if (!necesidad) continue;
      dolores.push({
        necesidadId,
        nombre: necesidad.nombre,
        probabilidad: datos.probabilidad,
        motivo: datos.motivos.slice(0, 2).join(' Además, '),
        esHipotesis: true,
        preguntaConfirmacion: necesidad.preguntaConfirmacion,
        confirmadoPorVendedor: null,
      });
    }
    return dolores.sort((a, b) => PESO_PROBABILIDAD[b.probabilidad] - PESO_PROBABILIDAD[a.probabilidad]);
  }

  interface Contribucion {
    readonly necesidad: Necesidad;
    readonly relacion: RelacionNecesidadProducto;
    readonly peso: number;
  }

  function construirRanking(dolores: ReadonlyArray<DolorInferido>): ReadonlyArray<PosicionRanking> {
    const contribucionesPorProducto = new Map<ProductoId, Contribucion[]>();
    const puntajePorProducto = new Map<ProductoId, number>();
    for (const id of PRODUCTOS) puntajePorProducto.set(id, 0);

    for (const dolor of dolores) {
      const necesidad = buscarNecesidad(dolor.necesidadId);
      if (!necesidad) continue;
      const pesoNecesidad = PESO_PROBABILIDAD[dolor.probabilidad];
      for (const productoId of PRODUCTOS) {
        const relacion = relacionNecesidadProducto(dolor.necesidadId, productoId);
        const peso = pesoNecesidad * PESO_ENCAJE[relacion.encaje];
        puntajePorProducto.set(productoId, (puntajePorProducto.get(productoId) ?? 0) + peso);
        if (peso > 0) {
          const lista = contribucionesPorProducto.get(productoId) ?? [];
          lista.push({ necesidad, relacion, peso });
          contribucionesPorProducto.set(productoId, lista);
        }
      }
    }

    const ordenCatalogo = new Map<ProductoId, number>(PRODUCTOS_CATALOGO.map((p) => [p.id, p.orden]));
    const ordenados = [...PRODUCTOS].sort((a, b) => {
      const diferencia = (puntajePorProducto.get(b) ?? 0) - (puntajePorProducto.get(a) ?? 0);
      if (diferencia !== 0) return diferencia;
      return (ordenCatalogo.get(a) ?? 99) - (ordenCatalogo.get(b) ?? 99);
    });

    return ordenados.map((productoId, indice) => {
      const contribuciones = (contribucionesPorProducto.get(productoId) ?? []).sort((a, b) => b.peso - a.peso);
      const principal = contribuciones[0] ?? null;
      const encaje: Encaje = principal ? principal.relacion.encaje : 'no_recomendado';
      const nombreProd = nombreProducto(productoId);
      const motivo = principal
        ? [principal, contribuciones[1]]
          .filter((c): c is Contribucion => c !== undefined)
          .map((c) => `${c.relacion.encaje === 'directo' ? 'Resuelve directo' : c.relacion.encaje === 'no_recomendado' ? 'No corresponde' : `Encaje ${c.relacion.encaje}`} con "${c.necesidad.nombre}": ${c.relacion.argumento || c.relacion.motivo}`)
          .join(' ')
        : `No se identificó, con la información actual, una necesidad de este negocio que ${nombreProd} resuelva: ${FUNCION_NUCLEO[productoId]}.`;
      return {
        posicion: indice + 1,
        productoId,
        encaje,
        puntaje: puntajePorProducto.get(productoId) ?? 0,
        motivo,
        necesidadesQueAtiende: contribuciones.filter((c) => c.relacion.encaje !== 'no_recomendado').map((c) => c.necesidad.id),
        adaptacionRequerida: principal?.relacion.adaptacionRequerida ?? null,
        enTop10: indice + 1 <= 10,
      };
    });
  }

  const COMBOS_CANDIDATOS: ReadonlyArray<[ProductoId, ProductoId, string]> = [
    ['ojo-digital', 'radar-stock', 'Ver qué pasa en el piso de venta y decidir qué reponer son dos caras del mismo control de local.'],
    ['vendedor-24-7', 'agendar-ia', 'Atender fuera de horario y ofrecer un turno en el mismo mensaje cierra el círculo de la primera consulta.'],
    ['merma-ia', 'radar-stock', 'Encontrar la pérdida y decidir la reposición parten del mismo cruce entre compras, ventas y stock.'],
    ['faro-digital', 'precio-vivo', 'Mirar el mercado y ajustar el propio precio son la misma decisión, contada en dos pasos.'],
    ['pulso-digital', 'merma-ia', 'La memoria diaria del negocio y el control de pérdidas se alimentan del mismo hábito de registrar.'],
    ['cotiza-facil', 'vendedor-24-7', 'Adelantar preguntas por WhatsApp y usarlas para armar la cotización evita empezar dos veces de cero.'],
  ];

  function construirCombos(ranking: ReadonlyArray<PosicionRanking>): ReadonlyArray<Combo> {
    const posicionPorProducto = new Map(ranking.map((p) => [p.productoId, p]));
    const combos: Combo[] = [];
    for (const [a, b, argumentoUnificado] of COMBOS_CANDIDATOS) {
      const posA = posicionPorProducto.get(a);
      const posB = posicionPorProducto.get(b);
      if (!posA || !posB) continue;
      if (posA.encaje === 'no_recomendado' || posB.encaje === 'no_recomendado') continue;
      if (posA.posicion > 8 && posB.posicion > 8) continue;
      const ordenDeEntrada = [posA, posB].sort((x, y) => x.posicion - y.posicion).map((p) => p.productoId);
      combos.push({
        productoIds: [a, b],
        motivo: `Ambos aparecen entre las mejores opciones para este negocio (posiciones ${posA.posicion} y ${posB.posicion}).`,
        argumentoUnificado,
        ordenDeEntrada,
      });
      if (combos.length >= 3) break;
    }
    return combos;
  }

  function construirEstrategiaEntrada(
    ranking: ReadonlyArray<PosicionRanking>,
    dolores: ReadonlyArray<DolorInferido>,
  ): EstrategiaEntrada {
    const top = ranking[0]!;
    const primerDolor = dolores[0] ?? null;
    const nombreTop = nombreProducto(top.productoId);
    const porDondeEmpezar = primerDolor
      ? `Arrancá preguntando por "${primerDolor.nombre.toLowerCase()}": es el dolor con más indicios en este perfil, y ${nombreTop} lo resuelve con encaje ${top.encaje.replace('_', ' ')}.`
      : `Arrancá presentando ${nombreTop} como puerta de entrada: es la mejor opción disponible con la información actual, aunque conviene confirmar el perfil del negocio primero.`;
    const gancho = primerDolor
      ? `¿Hoy están perdiendo por "${primerDolor.nombre.toLowerCase()}"? Contale que ${nombreTop} ${FUNCION_NUCLEO[top.productoId]}.`
      : `Preguntale primero cómo funciona el día a día del negocio: con eso alcanza para ajustar la recomendación de ${nombreTop}.`;
    const queEvitar = top.encaje === 'adaptable' || top.encaje === 'cercano'
      ? `No prometer que ${nombreTop} funciona "de fábrica" para este caso: ${top.adaptacionRequerida ?? 'la adaptación necesaria'} hay que confirmarla antes de cerrar.`
      : null;
    return { porDondeEmpezar, productoDeEntrada: top.productoId, gancho, queEvitar };
  }

  const SECCIONES_COPY_CITABLES: ReadonlyArray<string> = ['Beneficios', 'Ejemplo', '5 casos de uso', 'Dónde tiene más sentido'];

  function construirArgumentos(ranking: ReadonlyArray<PosicionRanking>): ReadonlyArray<Argumento> {
    return ranking
      .filter((p) => p.encaje !== 'no_recomendado')
      .slice(0, 3)
      .map((p, indice) => {
        const nombreProd = nombreProducto(p.productoId);
        const necesidad = buscarNecesidad(p.necesidadesQueAtiende[0] ?? '');
        const texto = necesidad
          ? `${nombreProd} ${FUNCION_NUCLEO[p.productoId]}. Es la respuesta concreta a "${necesidad.nombre.toLowerCase()}", que es justo lo que este negocio parece tener hoy sin resolver.`
          : `${nombreProd} ${FUNCION_NUCLEO[p.productoId]}.`;
        return {
          productoId: p.productoId,
          texto,
          seccionCopy: SECCIONES_COPY_CITABLES[indice % SECCIONES_COPY_CITABLES.length]!,
        };
      });
  }

  function construirPreguntasConfirmacion(dolores: ReadonlyArray<DolorInferido>): ReadonlyArray<PreguntaConfirmacion> {
    return dolores.map((d) => ({ necesidadId: d.necesidadId, pregunta: d.preguntaConfirmacion, queValida: d.nombre }));
  }

  // ===========================================================================
  // El plan completo
  // ===========================================================================

  function textoActividadDesdeEntrada(entrada: EntradaPlan): string {
    if (entrada.tipo === 'rubro') return entrada.nombre;
    return `${entrada.queHace} ${entrada.nombre}`.trim();
  }

  function generarPlan(entrada: EntradaPlan, eje: EjePlan, vendedorId: Id): Plan {
    const resolucion = resolverActividad(textoActividadDesdeEntrada(entrada), vendedorId);
    return construirPlanDesdeResolucion(entrada, eje, vendedorId, resolucion);
  }

  function construirPlanDesdeResolucion(
    entrada: EntradaPlan,
    eje: EjePlan,
    vendedorId: Id,
    resolucion: ResolucionActividad,
  ): Plan {
    const perfilOperativo = construirPerfilOperativo(resolucion);
    return construirPlanDesdePerfil(entrada, eje, vendedorId, perfilOperativo);
  }

  function construirPlanDesdePerfil(
    entrada: EntradaPlan,
    eje: EjePlan,
    vendedorId: Id,
    perfilOperativo: PerfilOperativo,
  ): Plan {
    const doloresInferidos = inferirDolores(perfilOperativo);
    const ranking = construirRanking(doloresInferidos);
    const combos = construirCombos(ranking);
    const estrategiaEntrada = construirEstrategiaEntrada(ranking, doloresInferidos);
    const argumentos = construirArgumentos(ranking);
    const preguntasConfirmacion = construirPreguntasConfirmacion(doloresInferidos);
    const [p1, p2, p3] = ranking;
    const productosDestacados: readonly [ProductoId, ProductoId, ProductoId] = [p1!.productoId, p2!.productoId, p3!.productoId];
    return {
      id: null,
      eje,
      objetivoId: null,
      vendedorId,
      entrada,
      perfilOperativo,
      doloresInferidos,
      ranking,
      productosDestacados,
      combos,
      estrategiaEntrada,
      argumentos,
      preguntasConfirmacion,
      ningunProductoEncaja: ranking.slice(0, 3).every((p) => p.encaje === 'no_recomendado'),
      versionTaxonomia: VERSION_TAXONOMIA,
      versionCatalogo: VERSION_CATALOGO,
      generadoEn: new Date().toISOString(),
    };
  }

  /** Construye un Plan a partir de una investigación ya confirmada (planDesdeInvestigacion). */
  function planDesdeResultadoInvestigacion(
    entrada: EntradaPlan,
    eje: EjePlan,
    vendedorId: Id,
    perfilOperativo: PerfilOperativo,
    doloresInferidos: ReadonlyArray<DolorInferido>,
    ranking: ReadonlyArray<PosicionRanking>,
  ): Plan {
    const combos = construirCombos(ranking);
    const estrategiaEntrada = construirEstrategiaEntrada(ranking, doloresInferidos);
    const argumentos = construirArgumentos(ranking);
    const preguntasConfirmacion = construirPreguntasConfirmacion(doloresInferidos);
    const [p1, p2, p3] = ranking;
    const productosDestacados: readonly [ProductoId, ProductoId, ProductoId] = [p1!.productoId, p2!.productoId, p3!.productoId];
    return {
      id: null,
      eje,
      objetivoId: null,
      vendedorId,
      entrada,
      perfilOperativo,
      doloresInferidos,
      ranking,
      productosDestacados,
      combos,
      estrategiaEntrada,
      argumentos,
      preguntasConfirmacion,
      ningunProductoEncaja: ranking.slice(0, 3).every((p) => p.encaje === 'no_recomendado'),
      versionTaxonomia: VERSION_TAXONOMIA,
      versionCatalogo: VERSION_CATALOGO,
      generadoEn: new Date().toISOString(),
    };
  }

  function recalcularPlan(plan: Plan, ajustes: ReadonlyArray<AjustePerfil>): PlanRecalculado {
    const operacionesActualizadas = new Map<Id, OperacionDelPerfil>(
      plan.perfilOperativo.operaciones.map((o) => [o.operacionId, o]),
    );
    for (const ajuste of ajustes) {
      const existente = operacionesActualizadas.get(ajuste.operacionId);
      if (existente) {
        operacionesActualizadas.set(ajuste.operacionId, {
          ...existente,
          presente: ajuste.presente,
          origen: 'confirmado_por_vendedor',
        });
      } else {
        const operacion = buscarOperacion(ajuste.operacionId);
        operacionesActualizadas.set(ajuste.operacionId, {
          operacionId: ajuste.operacionId,
          nombre: operacion?.nombre ?? ajuste.operacionId,
          presente: ajuste.presente,
          origen: 'confirmado_por_vendedor',
          motivo: 'Confirmado directamente por el vendedor.',
        });
      }
    }
    const perfilNuevo: PerfilOperativo = {
      ...plan.perfilOperativo,
      operaciones: [...operacionesActualizadas.values()],
    };
    const planNuevo = construirPlanDesdePerfil(plan.entrada, plan.eje, plan.vendedorId, perfilNuevo);
    const planConId: Plan = { ...planNuevo, id: plan.id, objetivoId: plan.objetivoId };

    const posicionAnteriorPorProducto = new Map(plan.ranking.map((p) => [p.productoId, p]));
    const cambios: CambioPlan[] = [];
    for (const nueva of planConId.ranking) {
      const anterior = posicionAnteriorPorProducto.get(nueva.productoId);
      if (!anterior) continue;
      if (anterior.posicion !== nueva.posicion || anterior.encaje !== nueva.encaje) {
        cambios.push({
          productoId: nueva.productoId,
          posicionAnterior: anterior.posicion,
          posicionNueva: nueva.posicion,
          encajeAnterior: anterior.encaje,
          encajeNuevo: nueva.encaje,
          motivo: anterior.posicion > nueva.posicion
            ? `Subió del puesto ${anterior.posicion} al ${nueva.posicion} tras la corrección del perfil.`
            : anterior.posicion < nueva.posicion
              ? `Bajó del puesto ${anterior.posicion} al ${nueva.posicion} tras la corrección del perfil.`
              : `Mantuvo el puesto ${nueva.posicion}, pero cambió su encaje de "${anterior.encaje}" a "${nueva.encaje}".`,
        });
      }
    }
    cambios.sort((a, b) => a.posicionNueva - b.posicionNueva);
    return { plan: planConId, cambios };
  }

  return {
    buscarActividad,
    resolverActividad,
    construirPerfilOperativo,
    inferirDolores,
    construirRanking,
    construirCombos,
    construirEstrategiaEntrada,
    construirArgumentos,
    construirPreguntasConfirmacion,
    generarPlan,
    planDesdeResultadoInvestigacion,
    recalcularPlan,
    listarOperaciones: (): ReadonlyArray<Operacion> => registroOperaciones,
    listarNecesidades: (): ReadonlyArray<Necesidad> => registroNecesidades,
    listarActividades: (): ReadonlyArray<Actividad> => registroActividades,
    catalogo: (): ReadonlyArray<Producto> => PRODUCTOS_CATALOGO,
  };
}

export type MotorDePlanificacion = ReturnType<typeof crearMotorDePlanificacion>;
