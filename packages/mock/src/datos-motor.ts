/**
 * Datos de ejemplo — dominio: motor.
 *
 * ⛔ DUEÑO: Sesión 3. Ninguna otra sesión edita este archivo.
 *    Un archivo por dominio, nunca uno compartido: así seis sesiones escriben
 *    datos de ejemplo al mismo tiempo sin tocarse.
 *
 * Acá vive la TAXONOMÍA EN CÓDIGO (espejo de content/taxonomia/*.md) y el
 * MOTOR DE RAZONAMIENTO: de una actividad a un perfil operativo, de un perfil
 * a dolores probables, y de los dolores a un ranking de los 13 productos con
 * combos, estrategia de entrada, argumentos y preguntas de confirmación.
 *
 * ⛔ Sin productos fuera de los 13.
 * ⛔ Sin precios de lista que no estén en COMMERCIAL_RULES.md §2.
 * ⛔ Sin copy aprobado duplicado acá: se referencia por productoId y por
 *    `claveCopy`; el texto vive en content/copy/ y lo lee la vista (import
 *    `?raw`), nunca este archivo.
 * ⛔ Sin roles fuera de vendedor y administrador.
 *
 * CÓMO RAZONA (nunca mapeo literal de "Dónde tiene más sentido"):
 *
 *   texto libre ──resolverActividad──► Actividad (existente o `pendiente_de_revision`)
 *   Actividad    ──RELACIONES_ACTIVIDAD_OPERACION──► perfil operativo (con motivo)
 *   Operación    ──RELACIONES_OPERACION_NECESIDAD──►  dolores probables (con motivo,
 *                                                      siempre como hipótesis)
 *   Necesidad    ──RELACIONES_NECESIDAD_PRODUCTO──►   encaje por producto (con motivo)
 *
 * Un término que no está en la lista curada NUNCA responde "no encontrado":
 * se crea `pendiente_de_revision` y un heurístico por palabras clave (mismo
 * vocabulario de operaciones) le arma un perfil provisorio, de menor
 * confianza pero igual de completo. Así "motel", "gomería" y "criadero de
 * pollos" —ninguno nombrado en el copy aprobado— salen con plan completo.
 */

import type {
  Encaje,
  FiltroPlanes,
  FiltroProductos,
  Id,
  ISODate,
  MotivoCierrePlan,
  Necesidad,
  ObjetivoSugerido,
  Operacion,
  Plan,
  PlanDeRubro,
  Probabilidad,
  Producto,
  ProductoDetalle,
  ProductoId,
  RelacionNecesidadProducto,
  RelacionOperacionNecesidad,
} from '@labia/compartido';
import {
  crearMotorDePlanificacion, generarId, normalizarTexto, op,
  type DefinicionActividad,
} from '@labia/compartido';

import { PRODUCTOS_ESPECIFICOS } from '@labia/compartido';

import type { Dinero, Moneda } from '@labia/compartido';
import type { EstadoPrecio, ModalidadPrecio, PrecioLista } from '@labia/compartido';
import type { NuevaSugerencia, ResolucionSugerencia, SugerenciaProducto } from '@labia/compartido';

// ---------------------------------------------------------------------------
// Utilidades mínimas
// ---------------------------------------------------------------------------


export const VERSION_TAXONOMIA = 1;
export const VERSION_CATALOGO = 1;

// ===========================================================================
// CAPA 1 — Operaciones (canónicas, MASTER_SPEC §8.1)
// ===========================================================================

export const OPERACIONES_SEMILLA: ReadonlyArray<Operacion> = [
  { id: 'op-maneja-stock', nombre: 'Maneja stock o inventario', pregunta: '¿Maneja stock o inventario propio?', estado: 'confirmada' },
  { id: 'op-trabaja-turnos', nombre: 'Trabaja con turnos, citas o reservas', pregunta: '¿Atiende con turnos, citas o reservas?', estado: 'confirmada' },
  { id: 'op-atiende-whatsapp', nombre: 'Atiende consultas por WhatsApp', pregunta: '¿Recibe consultas por WhatsApp u otro chat?', estado: 'confirmada' },
  { id: 'op-reparte-domicilio', nombre: 'Reparte a domicilio', pregunta: '¿Reparte pedidos a domicilio?', estado: 'confirmada' },
  { id: 'op-local-circulacion', nombre: 'Tiene local con circulación de gente', pregunta: '¿Tiene un local físico con circulación de clientes?', estado: 'confirmada' },
  { id: 'op-varios-profesionales', nombre: 'Trabaja con varios profesionales o técnicos', pregunta: '¿Trabaja con más de un profesional o técnico?', estado: 'confirmada' },
  { id: 'op-catalogo-amplio', nombre: 'Maneja catálogo amplio de productos', pregunta: '¿Maneja una variedad amplia de productos?', estado: 'confirmada' },
  { id: 'op-compra-proveedores', nombre: 'Compra a proveedores de forma recurrente', pregunta: '¿Compra mercadería o insumos a proveedores de forma recurrente?', estado: 'confirmada' },
  { id: 'op-precios-mueven', nombre: 'Sus precios se mueven según demanda o temporada', pregunta: '¿Sus precios cambian según demanda, temporada o mercado?', estado: 'confirmada' },
  { id: 'op-administra-espacios', nombre: 'Administra espacios físicos', pregunta: '¿Administra lugares, salas o mesas que se ocupan y se liberan?', estado: 'confirmada' },
];


// ===========================================================================
// CAPA 3 — Necesidades (canónicas, con su pregunta de confirmación)
//
// ⛔ Las cinco semillas se exportan para que el servidor pueda CARGARLAS a la
//    base sin transcribirlas a mano. Copiar 1.400 líneas de taxonomía a un
//    archivo SQL es garantía de que las dos versiones diverjan; extraerlas del
//    original no.
// ===========================================================================

export const NECESIDADES_SEMILLA: ReadonlyArray<Necesidad> = [
  { id: 'nec-fuera-horario', nombre: 'Pierde ventas fuera de horario', descripcion: 'Consultas que llegan cuando no hay nadie para responder.', preguntaConfirmacion: '¿Le llegan consultas fuera del horario de atención que hoy quedan sin responder?', estado: 'confirmada' },
  { id: 'nec-agenda-desordenada', nombre: 'Agenda desordenada', descripcion: 'Turnos, citas o reservas coordinados a mano, con choques y olvidos.', preguntaConfirmacion: '¿Coordina turnos o reservas a mano, por mensajes sueltos?', estado: 'confirmada' },
  { id: 'nec-no-sabe-reponer', nombre: 'No sabe qué reponer', descripcion: 'Compra por costumbre, sin cruzar lo que realmente se vende.', preguntaConfirmacion: '¿Decide qué comprar más por costumbre que por datos de venta?', estado: 'confirmada' },
  { id: 'nec-pierde-mercaderia', nombre: 'Se le pierde mercadería', descripcion: 'Diferencias entre lo comprado, lo vendido y lo que queda, sin explicación.', preguntaConfirmacion: '¿Nota diferencias entre lo que compra, lo que vende y lo que queda en stock?', estado: 'confirmada' },
  { id: 'nec-reparto-ineficiente', nombre: 'Reparto ineficiente', descripcion: 'Rutas armadas por orden de llegada del pedido, no por cercanía.', preguntaConfirmacion: '¿El repartidor arma la ruta a criterio propio, sin optimizarla?', estado: 'confirmada' },
  { id: 'nec-no-sabe-que-pasa-en-el-local', nombre: 'No sabe qué pasa en el local', descripcion: 'Sin forma de saber cuándo hay más movimiento o dónde se pierden clientes.', preguntaConfirmacion: '¿Tiene forma de saber en qué horarios y zonas del local hay más movimiento?', estado: 'confirmada' },
  { id: 'nec-precios-desactualizados', nombre: 'Precios desactualizados frente al mercado', descripcion: 'El precio queda fijo mientras la demanda, el stock o la competencia cambian.', preguntaConfirmacion: '¿Hace cuánto no revisa precios frente a la competencia o la rotación real?', estado: 'confirmada' },
  { id: 'nec-sin-memoria-del-negocio', nombre: 'No tiene memoria del negocio', descripcion: 'Sin historial propio para comparar un día, una semana o un mes con otro.', preguntaConfirmacion: '¿Lleva un registro diario de ventas que le permita comparar períodos?', estado: 'confirmada' },
  { id: 'nec-no-cotiza-rapido', nombre: 'Tarda en armar una cotización', descripcion: 'Cada cotización se arma desde cero, sin una guía de preguntas.', preguntaConfirmacion: '¿Cada cotización nueva la arma desde cero, sin una guía previa?', estado: 'confirmada' },
  { id: 'nec-no-vende-online', nombre: 'No tiene canal de venta online', descripcion: 'Todo lo que se vende depende de que el cliente pase por el local.', preguntaConfirmacion: '¿Hoy vende exclusivamente en el local, sin canal online?', estado: 'confirmada' },
  { id: 'nec-no-ve-el-mercado', nombre: 'No sabe qué hace la competencia', descripcion: 'Decide precios y compras sin mirar qué mueve el mercado.', preguntaConfirmacion: '¿Sigue de cerca lo que hacen sus competidores directos?', estado: 'confirmada' },
  { id: 'nec-no-controla-espacios', nombre: 'No controla sus espacios en tiempo real', descripcion: 'No sabe, en el momento, qué lugares están libres y cuáles ocupados.', preguntaConfirmacion: '¿Sabe en todo momento qué lugares o espacios están libres y cuáles ocupados?', estado: 'confirmada' },
  { id: 'nec-no-coordina-recursos-simultaneos', nombre: 'No coordina recursos entre eventos simultáneos', descripcion: 'Personal e insumos repartidos parejo aunque la demanda de cada sala sea distinta.', preguntaConfirmacion: '¿Cuando hay varios eventos o salas al mismo tiempo, reparte personal e insumos a ojo?', estado: 'confirmada' },
];


// ===========================================================================
// CAPA 2 — Operación → Necesidad (genérico: no depende de la actividad)
// ===========================================================================

function relOP(
  operacionId: Id,
  necesidadId: Id,
  probabilidad: Probabilidad,
  motivo: string,
): RelacionOperacionNecesidad {
  return { operacionId, necesidadId, probabilidad, motivo };
}

export const RELACIONES_OPERACION_NECESIDAD: ReadonlyArray<RelacionOperacionNecesidad> = [
  relOP('op-atiende-whatsapp', 'nec-fuera-horario', 'tipica', 'Un negocio que atiende por WhatsApp recibe mensajes a cualquier hora, incluida la que nadie contesta.'),
  relOP('op-trabaja-turnos', 'nec-agenda-desordenada', 'tipica', 'Coordinar turnos a mano es la primera fuente de choques y olvidos.'),
  relOP('op-trabaja-turnos', 'nec-fuera-horario', 'frecuente', 'Los pedidos de turno también llegan fuera de horario, y hoy quedan sin respuesta hasta el día siguiente.'),
  relOP('op-maneja-stock', 'nec-no-sabe-reponer', 'tipica', 'Manejar stock sin cruzarlo con lo vendido lleva a comprar por costumbre.'),
  relOP('op-maneja-stock', 'nec-pierde-mercaderia', 'frecuente', 'Todo stock físico acumula diferencias entre lo que entra, lo que sale y lo que queda.'),
  relOP('op-reparte-domicilio', 'nec-reparto-ineficiente', 'tipica', 'Repartir sin ordenar las paradas multiplica los kilómetros recorridos.'),
  relOP('op-local-circulacion', 'nec-no-sabe-que-pasa-en-el-local', 'tipica', 'Con circulación de gente y sin cámaras que se analicen, el movimiento real del local queda sin medir.'),
  relOP('op-local-circulacion', 'nec-sin-memoria-del-negocio', 'ocasional', 'Un local con movimiento diario genera datos que, sin registrarlos, se pierden día a día.'),
  relOP('op-varios-profesionales', 'nec-agenda-desordenada', 'frecuente', 'Coordinar la agenda de varios profesionales a mano multiplica los choques de horario.'),
  relOP('op-catalogo-amplio', 'nec-no-sabe-reponer', 'frecuente', 'Cuanto más amplio el catálogo, más difícil decidir a ojo qué reponer primero.'),
  relOP('op-catalogo-amplio', 'nec-precios-desactualizados', 'ocasional', 'Un catálogo amplio es difícil de revisar producto por producto contra el mercado.'),
  relOP('op-catalogo-amplio', 'nec-no-cotiza-rapido', 'frecuente', 'Con muchas combinaciones posibles, armar una cotización a medida lleva tiempo sin una guía.'),
  relOP('op-catalogo-amplio', 'nec-no-vende-online', 'ocasional', 'Un catálogo amplio que sólo se puede ver en el local limita el alcance del negocio.'),
  relOP('op-compra-proveedores', 'nec-pierde-mercaderia', 'frecuente', 'Cada compra a proveedores es un punto donde el conteo puede empezar a desviarse.'),
  relOP('op-compra-proveedores', 'nec-no-ve-el-mercado', 'ocasional', 'Comprar a proveedores sin mirar el mercado deja pasar cambios de precio y de oferta.'),
  relOP('op-precios-mueven', 'nec-precios-desactualizados', 'tipica', 'Si el precio se mueve por temporada o demanda, un precio fijo queda desactualizado rápido.'),
  relOP('op-precios-mueven', 'nec-no-ve-el-mercado', 'frecuente', 'Ajustar precios sin mirar a la competencia es decidir a ciegas.'),
  relOP('op-administra-espacios', 'nec-no-controla-espacios', 'tipica', 'Administrar espacios sin verlos en tiempo real es la definición misma de este dolor.'),
  relOP('op-administra-espacios', 'nec-no-coordina-recursos-simultaneos', 'ocasional', 'Varios espacios en uso al mismo tiempo exigen repartir recursos, no dividirlos parejo.'),
];


// ===========================================================================
// Necesidad → Producto (el encaje: directo · cercano · adaptable · no_recomendado)
// ===========================================================================


function relNP(
  necesidadId: Id,
  productoId: ProductoId,
  encaje: Encaje,
  argumento: string,
  motivo: string,
  adaptacionRequerida: string | null = null,
): RelacionNecesidadProducto {
  return { necesidadId, productoId, encaje, adaptacionRequerida, argumento, motivo };
}

export const RELACIONES_NECESIDAD_PRODUCTO: ReadonlyArray<RelacionNecesidadProducto> = [
  // --- Pierde ventas fuera de horario ---
  relNP('nec-fuera-horario', 'vendedor-24-7', 'directo',
    'Responde la consulta en el momento en que hoy nadie está disponible.',
    'Es exactamente el problema que resuelve: atender cuando no hay nadie del equipo.'),
  relNP('nec-fuera-horario', 'agendar-ia', 'cercano',
    'Convierte la consulta de fuera de horario directamente en un turno reservado.',
    'No responde consultas generales, pero puede tomar la reserva en el mismo momento.',
    'Configurarlo como canal de reserva y no de venta consultiva.'),
  relNP('nec-fuera-horario', 'cotiza-facil', 'adaptable',
    'Deja una cotización lista para revisar apenas se retoma el horario de atención.',
    'Sirve si ya está cargado con precios y reglas de descuento; si no, no hay nada que mostrar fuera de horario.',
    'Cargar previamente precios, condiciones y descuentos permitidos.'),

  // --- Agenda desordenada ---
  relNP('nec-agenda-desordenada', 'agendar-ia', 'directo',
    'Ordena turnos, profesionales y horarios reales en un solo lugar.',
    'Es su función central: coordinar la agenda de un equipo.'),
  relNP('nec-agenda-desordenada', 'vendedor-24-7', 'cercano',
    'Puede derivar la conversación hacia un turno en lugar de dejarla suelta.',
    'Ordena la conversación de venta, no la agenda en sí misma.',
    'Conectarlo con el flujo de reservas para que derive, no sólo informe.'),

  // --- No sabe qué reponer ---
  relNP('nec-no-sabe-reponer', 'radar-stock', 'directo',
    'Muestra qué se está por terminar y qué lleva meses sin salida antes de la próxima compra.',
    'Es su función central: decidir con datos qué reponer.'),
  relNP('nec-no-sabe-reponer', 'precio-vivo', 'cercano',
    'Detecta qué está quedando parado antes de que valga la pena bajarle el precio.',
    'Mira la rotación para decidir precio, no para decidir compra, pero el dato es el mismo.'),
  relNP('nec-no-sabe-reponer', 'merma-ia', 'adaptable',
    'Cruza lo que falta con lo que efectivamente se perdió, no sólo con lo que se vendió.',
    'Su foco es la pérdida, no la reposición; sirve como segunda lectura del mismo problema.',
    'Usar sus reportes de diferencias como insumo para la próxima compra, no como reemplazo de Radar Stock.'),

  // --- Se le pierde mercadería ---
  relNP('nec-pierde-mercaderia', 'merma-ia', 'directo',
    'Compara compras, ventas y stock real para señalar dónde está la diferencia.',
    'Es su función central: encontrar mercadería que se pierde.'),
  relNP('nec-pierde-mercaderia', 'radar-stock', 'cercano',
    'Al mostrar qué debería quedar en stock, expone las mismas diferencias desde otro ángulo.',
    'Ordena reposición, no pérdidas; el cruce de datos es parecido pero el foco es distinto.'),

  // --- Reparto ineficiente ---
  relNP('nec-reparto-ineficiente', 'ruta-ia', 'directo',
    'Reordena las mismas entregas para recorrer menos kilómetros con el mismo repartidor.',
    'Es su función central: ordenar rutas de reparto.'),

  // --- No sabe qué pasa en el local ---
  relNP('nec-no-sabe-que-pasa-en-el-local', 'ojo-digital', 'directo',
    'Muestra horarios de mayor movimiento y zonas por donde casi nadie pasa.',
    'Es su función central: leer la circulación real del local.'),

  // --- Precios desactualizados ---
  relNP('nec-precios-desactualizados', 'precio-vivo', 'directo',
    'Sugiere subir, bajar o mantener cada precio según rotación, stock y costo de reposición.',
    'Es su función central: mantener el precio alineado con lo que realmente pasa con cada producto.'),
  relNP('nec-precios-desactualizados', 'faro-digital', 'cercano',
    'Muestra cómo se mueven los precios de la competencia antes de decidir el propio.',
    'Informa el contexto de mercado; la decisión de precio final la toma Precio Vivo o el dueño.'),

  // --- Sin memoria del negocio ---
  relNP('nec-sin-memoria-del-negocio', 'pulso-digital', 'directo',
    'Construye un historial propio del negocio día a día, comparable en el tiempo.',
    'Es su función central: dar memoria al negocio a partir de unos pocos datos diarios.'),
  relNP('nec-sin-memoria-del-negocio', 'merma-ia', 'adaptable',
    'Suma al historial diario el dato de qué se pierde y cuándo, no sólo qué se vende.',
    'Su historial es de compras, ventas y stock, no de la operación diaria completa.',
    'Combinar sus reportes con un registro diario del negocio, no reemplazarlo.'),

  // --- Tarda en cotizar ---
  relNP('nec-no-cotiza-rapido', 'cotiza-facil', 'directo',
    'Hace primero las preguntas que cambian la recomendación y arma la cotización recién después.',
    'Es su función central: acelerar y ordenar la cotización consultiva.'),
  relNP('nec-no-cotiza-rapido', 'vendedor-24-7', 'cercano',
    'Adelanta las preguntas del cliente antes de que un vendedor humano retome la conversación.',
    'Prepara el terreno para cotizar, pero no arma la cotización en sí.'),

  // --- No vende online ---
  relNP('nec-no-vende-online', 'smart-commerce', 'directo',
    'Abre una tienda online que funciona incluso con el local cerrado.',
    'Es su función central: dar un canal de venta digital propio.'),
  relNP('nec-no-vende-online', 'vendedor-24-7', 'cercano',
    'Permite mostrar catálogo y precios por WhatsApp mientras no exista una tienda propia.',
    'No es una tienda: es un canal de conversación que puede sostener ventas simples mientras tanto.'),

  // --- No ve el mercado ---
  relNP('nec-no-ve-el-mercado', 'faro-digital', 'directo',
    'Sigue precios, promociones y productos nuevos de la competencia visible.',
    'Es su función central: mirar el mercado para que la decisión no sea a ciegas.'),
  relNP('nec-no-ve-el-mercado', 'precio-vivo', 'cercano',
    'Usa precios de competencia, cuando están disponibles, como un dato más para su sugerencia.',
    'El mercado es un insumo de su cálculo, no su foco principal.'),

  // --- No controla espacios ---
  relNP('nec-no-controla-espacios', 'park-ia', 'directo',
    'Muestra en tiempo real qué lugares están libres, cuáles ocupados, y calcula el cobro de cada uno.',
    'Es su función central: administrar espacios que se ocupan y se liberan.'),

  // --- No coordina recursos simultáneos ---
  relNP('nec-no-coordina-recursos-simultaneos', 'exeq-ia', 'directo',
    'Detecta qué sala está aumentando su ocupación para redistribuir personal e insumos hacia ahí.',
    'Es su función central: coordinar recursos entre servicios simultáneos.'),
];


// ===========================================================================
// CAPA 1 — Actividades curadas (semilla ampliada) + heurístico genérico
// ===========================================================================



/**
 * 26 actividades curadas: las seis nombradas en MASTER_SPEC §8.1 (incluidas
 * motel y gomería), las tres de prueba obligatoria (QA_CHECKLIST §3.1: motel,
 * gomería, criadero de pollos) y una muestra representativa de las familias
 * de la semilla de copy (content/taxonomia/semilla-copy.md).
 *
 * ⛔ Esto es semilla ampliada, NO el techo: cualquier otro texto pasa por el
 *    heurístico de ACTIVIDAD_DESCONOCIDA() más abajo y queda pendiente_de_revision.
 */
export const ACTIVIDADES_CURADAS: ReadonlyArray<DefinicionActividad> = [
  {
    id: 'act-repuestera', nombre: 'Repuestera', sinonimos: ['casa de repuestos', 'repuestos', 'autopartes'],
    operaciones: [
      op('op-maneja-stock', 'tipica', 'Una repuestera vive de tener la pieza correcta en stock.'),
      op('op-catalogo-amplio', 'tipica', 'Maneja cientos de referencias distintas por marca y modelo.'),
      op('op-compra-proveedores', 'frecuente', 'Repone contra proveedores e importadores de forma recurrente.'),
      op('op-precios-mueven', 'ocasional', 'El precio de importación y el tipo de cambio mueven el costo de reposición.'),
    ],
  },
  {
    id: 'act-restaurante', nombre: 'Restaurante', sinonimos: ['gastronomia', 'resto', 'parrilla', 'bar', 'comida'],
    operaciones: [
      op('op-local-circulacion', 'tipica', 'Un restaurante vive de la circulación de comensales en el salón.'),
      op('op-trabaja-turnos', 'frecuente', 'Las reservas de mesa funcionan como turnos.'),
      op('op-reparte-domicilio', 'frecuente', 'El delivery es hoy un canal habitual de la gastronomía.'),
      op('op-compra-proveedores', 'frecuente', 'Compra insumos frescos a proveedores de forma recurrente.'),
    ],
  },
  {
    id: 'act-odontologia', nombre: 'Odontología', sinonimos: ['consultorio odontologico', 'clinica dental', 'dentista', 'odontologa', 'odontologo'],
    operaciones: [
      op('op-trabaja-turnos', 'tipica', 'La atención odontológica se organiza por turno.'),
      op('op-varios-profesionales', 'frecuente', 'Es frecuente que un consultorio tenga más de un odontólogo.'),
      op('op-atiende-whatsapp', 'frecuente', 'Las consultas y confirmaciones de turno suelen llegar por WhatsApp.'),
    ],
  },
  {
    id: 'act-peluqueria', nombre: 'Peluquería', sinonimos: ['salon de belleza', 'barberia', 'centro de estetica', 'estilista'],
    operaciones: [
      op('op-trabaja-turnos', 'tipica', 'El servicio se agenda por turno.'),
      op('op-varios-profesionales', 'tipica', 'Suele haber más de un estilista o profesional trabajando en paralelo.'),
      op('op-atiende-whatsapp', 'frecuente', 'Los turnos se piden y confirman mayormente por WhatsApp.'),
    ],
  },
  {
    id: 'act-hotel', nombre: 'Hotel', sinonimos: ['hospedaje', 'posada', 'hosteria'],
    operaciones: [
      op('op-administra-espacios', 'tipica', 'Un hotel administra habitaciones que se ocupan y se liberan como cualquier espacio.'),
      op('op-trabaja-turnos', 'tipica', 'Check-in y check-out funcionan como turnos con horario.'),
      op('op-precios-mueven', 'frecuente', 'La tarifa cambia según temporada y ocupación.'),
      op('op-atiende-whatsapp', 'frecuente', 'Reservas y consultas llegan por WhatsApp fuera del horario de recepción.'),
    ],
  },
  {
    id: 'act-motel', nombre: 'Motel', sinonimos: ['albergue transitorio', 'hotel por horas'],
    operaciones: [
      op('op-trabaja-turnos', 'tipica', 'La habitación se reserva y se libera por turno, casi siempre por horas.'),
      op('op-precios-mueven', 'tipica', 'La tarifa cambia según franja horaria y día de la semana.'),
      op('op-atiende-whatsapp', 'frecuente', 'Buena parte de las reservas se coordinan por WhatsApp, a cualquier hora.'),
      op('op-maneja-stock', 'ocasional', 'Hay insumos de limpieza y amenities que también se reponen.'),
      op('op-local-circulacion', 'ocasional', 'La recepción y las áreas comunes tienen circulación, aunque menor que un comercio.'),
    ],
  },
  {
    id: 'act-veterinaria', nombre: 'Veterinaria', sinonimos: ['clinica veterinaria', 'veterinario'],
    operaciones: [
      op('op-trabaja-turnos', 'tipica', 'Las consultas se agendan por turno.'),
      op('op-maneja-stock', 'frecuente', 'Maneja insumos y medicamentos que hay que reponer.'),
      op('op-atiende-whatsapp', 'frecuente', 'Consultas y urgencias suelen llegar primero por WhatsApp.'),
    ],
  },
  {
    id: 'act-gomeria', nombre: 'Gomería', sinonimos: ['taller de neumaticos', 'servicio de gomas', 'gomeria y alineacion'],
    operaciones: [
      op('op-local-circulacion', 'tipica', 'Los clientes esperan en el local mientras se hace el servicio.'),
      op('op-maneja-stock', 'tipica', 'Mantiene stock de neumáticos y repuestos chicos por medida y marca.'),
      op('op-atiende-whatsapp', 'frecuente', 'Consulta de precio y disponibilidad de medida suele llegar por WhatsApp.'),
      op('op-compra-proveedores', 'frecuente', 'Repone stock contra distribuidoras de neumáticos.'),
    ],
  },
  {
    id: 'act-criadero-de-pollos', nombre: 'Criadero de pollos', sinonimos: ['granja avicola', 'avicola', 'criadero avicola', 'produccion avicola'],
    operaciones: [
      op('op-maneja-stock', 'tipica', 'Maneja stock de alimento balanceado, insumos veterinarios y aves en distintas etapas.'),
      op('op-compra-proveedores', 'tipica', 'Compra alimento e insumos a proveedores de forma recurrente y en volumen.'),
      op('op-precios-mueven', 'frecuente', 'El precio del pollo y del alimento balanceado se mueven con el mercado agropecuario.'),
      op('op-reparte-domicilio', 'ocasional', 'Parte de la producción se entrega directamente a comercios o clientes.'),
    ],
  },
  {
    id: 'act-farmacia', nombre: 'Farmacia', sinonimos: ['botica', 'drogueria'],
    operaciones: [
      op('op-maneja-stock', 'tipica', 'El medicamento vencido o faltante es un problema central del rubro.'),
      op('op-catalogo-amplio', 'tipica', 'Maneja cientos de productos entre medicamentos y perfumería.'),
      op('op-reparte-domicilio', 'frecuente', 'El delivery de medicamentos es un servicio habitual.'),
      op('op-atiende-whatsapp', 'frecuente', 'Consultas de stock y precio llegan por WhatsApp.'),
    ],
  },
  {
    id: 'act-ferreteria', nombre: 'Ferretería', sinonimos: ['ferreteria industrial'],
    operaciones: [
      op('op-catalogo-amplio', 'tipica', 'Miles de referencias chicas conviven en el mismo local.'),
      op('op-maneja-stock', 'tipica', 'La rotación de cada ítem es muy distinta entre sí.'),
      op('op-compra-proveedores', 'frecuente', 'Repone contra múltiples proveedores por rubro.'),
    ],
  },
  {
    id: 'act-supermercado', nombre: 'Supermercado', sinonimos: ['autoservicio', 'minimarket', 'almacen grande'],
    operaciones: [
      op('op-maneja-stock', 'tipica', 'El stock es el corazón de la operación diaria.'),
      op('op-catalogo-amplio', 'tipica', 'Maneja miles de productos de rotación muy distinta.'),
      op('op-local-circulacion', 'tipica', 'La circulación de clientes en el salón de ventas es constante.'),
      op('op-compra-proveedores', 'frecuente', 'Repone contra decenas de proveedores.'),
    ],
  },
  {
    id: 'act-panaderia', nombre: 'Panadería', sinonimos: ['panificadora'],
    operaciones: [
      op('op-local-circulacion', 'tipica', 'El mostrador tiene circulación constante durante el día.'),
      op('op-maneja-stock', 'frecuente', 'Maneja insumos de producción que se reponen seguido.'),
    ],
  },
  {
    id: 'act-taller-mecanico', nombre: 'Taller mecánico', sinonimos: ['mecanica', 'taller automotor'],
    operaciones: [
      op('op-trabaja-turnos', 'tipica', 'Los vehículos entran al taller con turno u orden de trabajo.'),
      op('op-maneja-stock', 'frecuente', 'Maneja stock de repuestos e insumos propios.'),
      op('op-atiende-whatsapp', 'frecuente', 'Consultas de diagnóstico y presupuesto llegan por WhatsApp.'),
    ],
  },
  {
    id: 'act-inmobiliaria', nombre: 'Inmobiliaria', sinonimos: ['agencia inmobiliaria', 'corretaje'],
    operaciones: [
      op('op-atiende-whatsapp', 'tipica', 'Las consultas por una propiedad llegan sobre todo por WhatsApp.'),
      op('op-varios-profesionales', 'frecuente', 'Suele trabajar con varios corredores en paralelo.'),
      op('op-catalogo-amplio', 'ocasional', 'La cartera de propiedades puede ser amplia y variada.'),
    ],
  },
  {
    id: 'act-distribuidora', nombre: 'Distribuidora', sinonimos: ['mayorista', 'deposito'],
    operaciones: [
      op('op-reparte-domicilio', 'tipica', 'Entrega pedidos a comercios de forma habitual.'),
      op('op-maneja-stock', 'tipica', 'Su negocio depende de tener stock disponible para despachar.'),
      op('op-compra-proveedores', 'tipica', 'Compra en volumen a proveedores o fabricantes.'),
      op('op-catalogo-amplio', 'frecuente', 'Distribuye múltiples líneas de producto.'),
    ],
  },
  {
    id: 'act-funeraria', nombre: 'Empresa funeraria', sinonimos: ['funeraria', 'casa velatoria', 'servicio funebre'],
    operaciones: [
      op('op-administra-espacios', 'tipica', 'Administra salas velatorias que se ocupan y se liberan según el servicio.'),
      op('op-varios-profesionales', 'frecuente', 'Coordina distintos roles de personal durante cada servicio.'),
      op('op-atiende-whatsapp', 'frecuente', 'Buena parte de la coordinación con la familia ocurre por WhatsApp.'),
    ],
  },
  {
    id: 'act-estacionamiento', nombre: 'Estacionamiento', sinonimos: ['parking', 'playa de estacionamiento', 'garage'],
    operaciones: [
      op('op-administra-espacios', 'tipica', 'Administrar lugares libres y ocupados es la operación completa del negocio.'),
      op('op-precios-mueven', 'ocasional', 'Algunas playas ajustan tarifa por franja horaria.'),
    ],
  },
  {
    id: 'act-boutique', nombre: 'Boutique de ropa', sinonimos: ['tienda de ropa', 'moda', 'indumentaria'],
    operaciones: [
      op('op-catalogo-amplio', 'tipica', 'Maneja variedad de talles, colores y modelos por temporada.'),
      op('op-local-circulacion', 'tipica', 'La prueba de producto ocurre en el local, con circulación de clientas.'),
      op('op-precios-mueven', 'frecuente', 'El precio baja fuerte al cierre de cada temporada.'),
    ],
  },
  {
    id: 'act-electronica', nombre: 'Tienda de electrónica', sinonimos: ['celulares y tecnologia', 'tecnologia'],
    operaciones: [
      op('op-catalogo-amplio', 'tipica', 'Maneja múltiples marcas y modelos en simultáneo.'),
      op('op-maneja-stock', 'tipica', 'El stock por modelo determina directamente la venta.'),
      op('op-precios-mueven', 'frecuente', 'Los modelos pierden valor rápido cuando sale una versión nueva.'),
      op('op-atiende-whatsapp', 'frecuente', 'Consultas de precio y stock llegan sobre todo por WhatsApp.'),
    ],
  },
  {
    id: 'act-perfumeria', nombre: 'Perfumería', sinonimos: ['cosmetica'],
    operaciones: [
      op('op-catalogo-amplio', 'tipica', 'Maneja muchas líneas y presentaciones distintas.'),
      op('op-maneja-stock', 'frecuente', 'Los productos chicos y caros son los que más se extravían.'),
      op('op-local-circulacion', 'frecuente', 'Depende de la circulación y la prueba de producto en el local.'),
    ],
  },
  {
    id: 'act-vivero', nombre: 'Vivero', sinonimos: ['jardineria', 'plantas'],
    operaciones: [
      op('op-maneja-stock', 'tipica', 'Las plantas y los insumos de jardinería son stock perecedero.'),
      op('op-local-circulacion', 'frecuente', 'Los clientes recorren el vivero antes de elegir.'),
      op('op-precios-mueven', 'ocasional', 'Algunas especies tienen precio estacional.'),
    ],
  },
  {
    id: 'act-kiosco-de-barrio', nombre: 'Kiosco de barrio', sinonimos: ['despensa', 'almacen de barrio'],
    operaciones: [
      op('op-maneja-stock', 'tipica', 'Vive de tener siempre lo básico disponible.'),
      op('op-catalogo-amplio', 'frecuente', 'Suele combinar muchos rubros chicos en poco espacio.'),
      op('op-atiende-whatsapp', 'ocasional', 'Algunos pedidos y encargos llegan por WhatsApp al vecino.'),
    ],
  },
  {
    id: 'act-estudio-de-arquitectura', nombre: 'Estudio de arquitectura', sinonimos: ['estudio de diseno', 'arquitecto', 'arquitecta'],
    operaciones: [
      op('op-varios-profesionales', 'tipica', 'Suele combinar arquitectos, dibujantes y otros roles técnicos.'),
      op('op-atiende-whatsapp', 'frecuente', 'El seguimiento de obra y consultas ocurre mayormente por WhatsApp.'),
      op('op-trabaja-turnos', 'ocasional', 'Las reuniones con clientes se agendan como turnos.'),
    ],
  },
  {
    id: 'act-concesionaria', nombre: 'Concesionaria de vehículos', sinonimos: ['venta de vehiculos', 'agencia de autos'],
    operaciones: [
      op('op-catalogo-amplio', 'tipica', 'Maneja varios modelos y versiones en simultáneo.'),
      op('op-varios-profesionales', 'frecuente', 'Trabaja con varios vendedores y asesores de crédito.'),
      op('op-atiende-whatsapp', 'frecuente', 'Las primeras consultas de precio llegan mayormente por WhatsApp.'),
    ],
  },
  {
    id: 'act-climatizacion', nombre: 'Climatización', sinonimos: ['aire acondicionado', 'refrigeracion'],
    operaciones: [
      op('op-catalogo-amplio', 'frecuente', 'Cada ambiente necesita un equipo distinto según metros y uso.'),
      op('op-atiende-whatsapp', 'frecuente', 'La primera consulta suele llegar por WhatsApp con una foto del ambiente.'),
      op('op-reparte-domicilio', 'ocasional', 'La instalación implica traslado de equipo y técnico.'),
      op('op-varios-profesionales', 'ocasional', 'Puede combinar vendedor y técnico instalador.'),
    ],
  },
];


// --- Heurístico por palabras clave: nunca "no encontrado" (MASTER_SPEC M1) ---


/** Arma un perfil provisorio para cualquier texto que no matchea la semilla curada. */

// ===========================================================================
// Catálogo — 13 productos y precios (COMMERCIAL_RULES.md §2, transcripción literal)
// ===========================================================================

export const PRODUCTOS_CATALOGO: ReadonlyArray<Producto> = [
  { id: 'ojo-digital', nombre: 'Ojo Digital', familia: 'especifica', orden: 1, claveCopy: 'ojo-digital', aliasHistoricos: [], publicado: true },
  { id: 'pulso-digital', nombre: 'Pulso Digital', familia: 'especifica', orden: 2, claveCopy: 'pulso-digital', aliasHistoricos: [], publicado: true },
  { id: 'vendedor-24-7', nombre: 'Vendedor 24/7', familia: 'especifica', orden: 3, claveCopy: 'vendedor-24-7', aliasHistoricos: [], publicado: true },
  { id: 'radar-stock', nombre: 'Radar Stock', familia: 'especifica', orden: 4, claveCopy: 'radar-stock', aliasHistoricos: [], publicado: true },
  { id: 'faro-digital', nombre: 'Faro Digital', familia: 'especifica', orden: 5, claveCopy: 'faro-digital', aliasHistoricos: ['FARO Inteligente'], publicado: true },
  { id: 'merma-ia', nombre: 'Merma IA', familia: 'especifica', orden: 6, claveCopy: 'merma-ia', aliasHistoricos: [], publicado: true },
  { id: 'cotiza-facil', nombre: 'Cotiza Fácil', familia: 'especifica', orden: 7, claveCopy: 'cotiza-facil', aliasHistoricos: [], publicado: true },
  { id: 'precio-vivo', nombre: 'Precio Vivo', familia: 'especifica', orden: 8, claveCopy: 'precio-vivo', aliasHistoricos: [], publicado: true },
  { id: 'ruta-ia', nombre: 'Ruta IA', familia: 'especifica', orden: 9, claveCopy: 'ruta-ia', aliasHistoricos: [], publicado: true },
  { id: 'park-ia', nombre: 'Park.IA', familia: 'integral', orden: 10, claveCopy: 'park-ia', aliasHistoricos: [], publicado: true },
  { id: 'smart-commerce', nombre: 'Smart Commerce', familia: 'integral', orden: 11, claveCopy: 'smart-commerce', aliasHistoricos: [], publicado: true },
  { id: 'agendar-ia', nombre: 'Agendar.IA', familia: 'integral', orden: 12, claveCopy: 'agendar-ia', aliasHistoricos: [], publicado: true },
  { id: 'exeq-ia', nombre: 'Exeq.IA', familia: 'integral', orden: 13, claveCopy: 'exeq-ia', aliasHistoricos: [], publicado: true },
];

function precio(
  productoId: ProductoId,
  modalidad: ModalidadPrecio,
  moneda: Moneda,
  estado: EstadoPrecio,
  textoDocumentado: string,
  opciones: {
    plan?: string;
    montoDesde?: number;
    montoHasta?: number;
    ivaIncluido?: boolean;
    condicion?: string;
  } = {},
): PrecioLista {
  return {
    id: generarId('precio'),
    productoId,
    modalidad,
    plan: opciones.plan ?? null,
    estado,
    moneda,
    montoDesde: opciones.montoDesde ?? null,
    montoHasta: opciones.montoHasta ?? null,
    ivaIncluido: opciones.ivaIncluido ?? null,
    textoDocumentado,
    condicion: opciones.condicion ?? null,
    vigenteDesde: '2026-09-14',
    vigenteHasta: null,
    versionCatalogo: VERSION_CATALOGO,
  };
}

export const PRECIOS_CATALOGO: ReadonlyArray<PrecioLista> = [
  precio('ojo-digital', 'setup', 'PYG', 'documentado_desde', 'desde aproximadamente Gs. 700.000', { montoDesde: 700_000 }),
  precio('ojo-digital', 'mensualidad', 'PYG', 'documentado_rango', 'aproximadamente Gs. 350.000 a Gs. 1.100.000', { montoDesde: 350_000, montoHasta: 1_100_000 }),

  precio('pulso-digital', 'mensualidad', 'PYG', 'documentado_rango', 'Gs. 270.000 a Gs. 960.000 por mes, según plan', { montoDesde: 270_000, montoHasta: 960_000 }),

  precio('vendedor-24-7', 'mensualidad', 'PYG', 'documentado_rango', 'Aproximadamente Gs. 590.000 a Gs. 1.500.000 por mes, según cantidad de conversaciones y funciones', { montoDesde: 590_000, montoHasta: 1_500_000 }),

  precio('radar-stock', 'mensualidad', 'PYG', 'documentado_rango', 'Aproximadamente Gs. 270.000 a Gs. 900.000 por mes, según cantidad de productos y plan', { montoDesde: 270_000, montoHasta: 900_000 }),

  precio('faro-digital', 'mensualidad', 'PYG', 'documentado_rango', 'Gs. 108.000 a Gs. 630.000 por mes, según alcance', { montoDesde: 108_000, montoHasta: 630_000 }),
  precio('faro-digital', 'setup', 'PYG', 'documentado_rango', 'La implementación observada va desde aproximadamente Gs. 600.000 a Gs. 2.700.000', { montoDesde: 600_000, montoHasta: 2_700_000 }),

  precio('merma-ia', 'mensualidad', 'PYG', 'documentado_desde', 'Desde Gs. 80.000 por mes para un rubro. El valor sube si se analizan varios rubros o un alcance mayor', { montoDesde: 80_000 }),

  precio('cotiza-facil', 'prueba', 'PYG', 'documentado_exacto', 'Prueba de 30 días: Gs. 3.900.000 + IVA', { montoDesde: 3_900_000, ivaIncluido: false }),
  precio('cotiza-facil', 'setup', 'PYG', 'documentado_desde', 'Implementación: desde Gs. 4.900.000 + IVA', { montoDesde: 4_900_000, ivaIncluido: false }),
  precio('cotiza-facil', 'mensualidad', 'PYG', 'documentado_desde', 'Mensual: desde Gs. 690.000 + IVA', { montoDesde: 690_000, ivaIncluido: false }),
  precio('cotiza-facil', 'mensualidad', 'PYG', 'documentado_desde', 'Planes de mayor alcance llegan a Gs. 5.900.000/mes o más', { montoDesde: 5_900_000, ivaIncluido: false, condicion: 'Planes de mayor alcance' }),

  precio('precio-vivo', 'setup', 'USD', 'documentado_rango', 'Implementación: USD 300 a USD 800', { montoDesde: 30_000, montoHasta: 80_000 }),
  precio('precio-vivo', 'mensualidad', 'USD', 'documentado_rango', 'Mensual: USD 150 a USD 400', { montoDesde: 15_000, montoHasta: 40_000 }),
  precio('precio-vivo', 'mensualidad', 'USD', 'documentado_desde', 'Alcances grandes: desde USD 600/mes', { montoDesde: 60_000, condicion: 'Alcances grandes' }),

  precio('ruta-ia', 'mensualidad', 'PYG', 'documentado_exacto', '1 repartidor: Gs. 90.000/mes', { montoDesde: 90_000, condicion: '1 repartidor' }),
  precio('ruta-ia', 'mensualidad', 'PYG', 'documentado_exacto', '2 a 4 repartidores: Gs. 180.000/mes', { montoDesde: 180_000, condicion: '2 a 4 repartidores' }),
  precio('ruta-ia', 'mensualidad', 'PYG', 'documentado_exacto', '5 o más: Gs. 320.000/mes', { montoDesde: 320_000, condicion: '5 o más repartidores' }),

  precio('park-ia', 'unica_vez', 'PYG', 'documentado_exacto', 'Piloto Control: Gs. 1.500.000 por única vez', { plan: 'Piloto Control', montoDesde: 1_500_000 }),
  precio('park-ia', 'setup', 'PYG', 'documentado_exacto', 'Park.IA Base: instalación Gs. 2.900.000', { plan: 'Base', montoDesde: 2_900_000 }),
  precio('park-ia', 'mensualidad', 'PYG', 'documentado_exacto', 'mensualidad Gs. 490.000', { plan: 'Base', montoDesde: 490_000 }),
  precio('park-ia', 'setup', 'PYG', 'documentado_exacto', 'Park.IA Control: instalación Gs. 4.900.000', { plan: 'Control', montoDesde: 4_900_000 }),
  precio('park-ia', 'mensualidad', 'PYG', 'documentado_exacto', 'mensualidad Gs. 790.000', { plan: 'Control', montoDesde: 790_000 }),
  precio('park-ia', 'setup', 'PYG', 'documentado_exacto', 'Park.IA Control Plus: instalación Gs. 7.900.000', { plan: 'Control Plus', montoDesde: 7_900_000 }),
  precio('park-ia', 'mensualidad', 'PYG', 'documentado_exacto', 'mensualidad Gs. 1.290.000', { plan: 'Control Plus', montoDesde: 1_290_000 }),

  precio('smart-commerce', 'setup', 'PYG', 'no_documentado', 'Precio oficial no encontrado. Se cotiza personalizado'),

  precio('agendar-ia', 'setup', 'PYG', 'documentado_exacto', 'Implementación: Gs. 3.000.000', { montoDesde: 3_000_000 }),
  precio('agendar-ia', 'mensualidad', 'PYG', 'documentado_exacto', 'Mensualidad: Gs. 790.000', { montoDesde: 790_000 }),

  precio('exeq-ia', 'setup', 'PYG', 'no_documentado', 'Precio oficial no encontrado. Se cotiza personalizado'),
];

// ===========================================================================
// El motor, armado con estas semillas
//
// ⛔ El razonamiento NO vive acá: vive en @labia/compartido/motor-logica y lo
//    comparten los datos de ejemplo y el servidor. Acá sólo están los datos
//    con los que se lo alimenta. Si el Escritorio aconsejara distinto contra
//    el mock que contra Supabase, seria porque alguien volvio a duplicarlo.
// ===========================================================================

const MOTOR = crearMotorDePlanificacion({
  operaciones: OPERACIONES_SEMILLA,
  necesidades: NECESIDADES_SEMILLA,
  relacionesOperacionNecesidad: RELACIONES_OPERACION_NECESIDAD,
  relacionesNecesidadProducto: RELACIONES_NECESIDAD_PRODUCTO,
  actividades: ACTIVIDADES_CURADAS,
  productos: PRODUCTOS_CATALOGO,
  versionTaxonomia: VERSION_TAXONOMIA,
  versionCatalogo: VERSION_CATALOGO,
});

// Reexportados porque otros modulos del mock los importaban de aca.
export { generarId, normalizarTexto };
export type { ResolucionActividad } from '@labia/compartido';

export const listarOperaciones = MOTOR.listarOperaciones;
export const listarNecesidades = MOTOR.listarNecesidades;
export const buscarActividad = MOTOR.buscarActividad;
export const resolverActividad = MOTOR.resolverActividad;
export const construirPerfilOperativo = MOTOR.construirPerfilOperativo;
export const inferirDolores = MOTOR.inferirDolores;
export const construirRanking = MOTOR.construirRanking;
export const construirCombos = MOTOR.construirCombos;
export const construirEstrategiaEntrada = MOTOR.construirEstrategiaEntrada;
export const construirArgumentos = MOTOR.construirArgumentos;
export const construirPreguntasConfirmacion = MOTOR.construirPreguntasConfirmacion;
export const generarPlan = MOTOR.generarPlan;
export const planDesdeResultadoInvestigacion = MOTOR.planDesdeResultadoInvestigacion;
export const recalcularPlan = MOTOR.recalcularPlan;

export function listarProductosCatalogo(filtro?: FiltroProductos): ReadonlyArray<Producto> {
  let resultado = PRODUCTOS_CATALOGO;
  if (filtro?.familia) resultado = resultado.filter((p) => p.familia === filtro.familia);
  if (filtro?.soloPublicados) resultado = resultado.filter((p) => p.publicado);
  if (filtro?.texto) {
    const t = normalizarTexto(filtro.texto);
    resultado = resultado.filter((p) => normalizarTexto(p.nombre).includes(t));
  }
  if (filtro?.actividadId) {
    const relevantes = new Set(
      RELACIONES_NECESIDAD_PRODUCTO
        .filter((r) => r.encaje !== 'no_recomendado')
        .map((r) => r.productoId),
    );
    resultado = resultado.filter((p) => relevantes.has(p.id));
  }
  return resultado;
}

function necesidadesDeProducto(id: ProductoId): ReadonlyArray<Id> {
  return RELACIONES_NECESIDAD_PRODUCTO
    .filter((r) => r.productoId === id && r.encaje !== 'no_recomendado')
    .map((r) => r.necesidadId);
}

export function obtenerProductoDetalle(id: ProductoId): ProductoDetalle | null {
  const producto = PRODUCTOS_CATALOGO.find((p) => p.id === id);
  if (!producto) return null;
  return { ...producto, precios: preciosDeProducto(id), necesidadesIds: necesidadesDeProducto(id) };
}

export function preciosDeProducto(id: ProductoId): ReadonlyArray<PrecioLista> {
  return PRECIOS_CATALOGO.filter((p) => p.productoId === id);
}

// ===========================================================================
// Planes — almacén en memoria (mock) + escenarios "con datos" y "vacío"
// ===========================================================================

const almacenPlanes = new Map<Id, Plan>();
const almacenObjetivos = new Map<Id, ObjetivoSugerido>();

function sembrarPlanesDeEjemplo(): void {
  const ejemplo1 = generarPlan(
    { tipo: 'conocido', nombre: 'Repuestera de mi amigo Diego', queHace: 'vende repuestos de auto' },
    'empresa',
    'vendedor-demo',
  );
  const guardado1: Plan = { ...ejemplo1, id: generarId('plan') };
  almacenPlanes.set(guardado1.id!, guardado1);

  const ejemplo2 = generarPlan(
    { tipo: 'rubro', nombre: 'peluquerías', queHace: 'peluquerías de Asunción' },
    'rubro',
    'vendedor-demo',
  );
  const guardado2: PlanDeRubro = {
    ...ejemplo2,
    id: generarId('plan'),
    eje: 'rubro',
    periodoDesde: '2026-09-01',
    periodoHasta: '2026-11-30',
    metaGuaranies: { monto: 15_000_000, moneda: 'PYG' } satisfies Dinero,
    estado: 'abierto',
    motivoCierre: null,
  };
  almacenPlanes.set(guardado2.id!, guardado2);

  const objetivo: ObjetivoSugerido = {
    id: generarId('obj'),
    planId: guardado2.id!,
    clienteId: generarId('cliente'),
    nombreCliente: 'Peluquería Estilo Central',
    estado: 'sugerido',
  };
  almacenObjetivos.set(objetivo.id, objetivo);
}
sembrarPlanesDeEjemplo();

export function guardarPlan(plan: Plan): Plan {
  const id = plan.id ?? generarId('plan');
  const guardado: Plan = { ...plan, id };
  almacenPlanes.set(id, guardado);
  return guardado;
}

export function obtenerPlan(id: Id): Plan | null {
  return almacenPlanes.get(id) ?? null;
}

export function listarPlanes(filtro: FiltroPlanes): ReadonlyArray<Plan> {
  let resultado = [...almacenPlanes.values()];
  if (filtro.eje) resultado = resultado.filter((p) => p.eje === filtro.eje);
  if (filtro.vendedorId) resultado = resultado.filter((p) => p.vendedorId === filtro.vendedorId);
  if (filtro.objetivoId) resultado = resultado.filter((p) => p.objetivoId === filtro.objetivoId);
  if (filtro.estado) {
    resultado = resultado.filter((p): p is PlanDeRubro => 'estado' in p && (p as PlanDeRubro).estado === filtro.estado);
  }
  return resultado;
}

export function crearPlanDeRubro(
  plan: Plan,
  periodoDesde: ISODate,
  periodoHasta: ISODate,
  metaGuaranies: Dinero,
): PlanDeRubro {
  const id = plan.id ?? generarId('plan');
  const planDeRubro: PlanDeRubro = {
    ...plan,
    id,
    eje: 'rubro',
    periodoDesde,
    periodoHasta,
    metaGuaranies,
    estado: 'abierto',
    motivoCierre: null,
  };
  almacenPlanes.set(id, planDeRubro);
  return planDeRubro;
}

export function cerrarPlan(id: Id, motivo: MotivoCierrePlan, _comentario: string): PlanDeRubro | null {
  const plan = almacenPlanes.get(id);
  if (!plan || plan.eje !== 'rubro') return null;
  const cerrado: PlanDeRubro = { ...(plan as PlanDeRubro), estado: 'cerrado', motivoCierre: motivo };
  almacenPlanes.set(id, cerrado);
  return cerrado;
}

export function objetivosSugeridos(planId: Id): ReadonlyArray<ObjetivoSugerido> {
  return [...almacenObjetivos.values()].filter((o) => o.planId === planId);
}

export function aceptarObjetivo(objetivoId: Id): ObjetivoSugerido | null {
  const objetivo = almacenObjetivos.get(objetivoId);
  if (!objetivo) return null;
  const actualizado: ObjetivoSugerido = { ...objetivo, estado: 'aceptado' };
  almacenObjetivos.set(objetivoId, actualizado);
  return actualizado;
}

// ===========================================================================
// Sugerencias de producto nuevo — canal formal, no abre el portafolio
// ===========================================================================

const almacenSugerencias: SugerenciaProducto[] = [
  {
    id: generarId('sug'),
    titulo: 'Control de combustible para flota propia',
    problemaCliente: '"Necesito saber cuánto gasoil carga cada camión, no sólo la ruta que hace."',
    clienteId: null,
    actividadId: 'act-distribuidora',
    frecuenciaObservada: 'ocasional',
    productosQueNoAlcanzan: ['ruta-ia'],
    porQueNoAlcanzan: 'Ruta IA ordena el recorrido, pero no mide consumo de combustible por vehículo.',
    adjuntos: [],
    creadaPor: 'vendedor-demo',
    creadaEn: '2026-08-20T10:00:00-03:00',
    estado: 'en_evaluacion',
    resolucion: null,
    productoQueLoCubre: null,
    duplicadaDe: null,
    resueltaPor: null,
    resueltaEn: null,
  },
];

export function crearSugerencia(datos: NuevaSugerencia, creadaPor: Id): SugerenciaProducto {
  const sugerencia: SugerenciaProducto = {
    id: generarId('sug'),
    titulo: datos.titulo,
    problemaCliente: datos.problemaCliente,
    clienteId: datos.clienteId ?? null,
    actividadId: datos.actividadId ?? null,
    frecuenciaObservada: datos.frecuenciaObservada,
    productosQueNoAlcanzan: datos.productosQueNoAlcanzan,
    porQueNoAlcanzan: datos.porQueNoAlcanzan,
    adjuntos: [],
    creadaPor,
    creadaEn: new Date().toISOString(),
    estado: 'recibida',
    resolucion: null,
    productoQueLoCubre: null,
    duplicadaDe: null,
    resueltaPor: null,
    resueltaEn: null,
  };
  almacenSugerencias.push(sugerencia);
  return sugerencia;
}

export function listarMisSugerencias(creadaPor: Id): ReadonlyArray<SugerenciaProducto> {
  return almacenSugerencias.filter((s) => s.creadaPor === creadaPor);
}

export function resolverSugerenciaEnMemoria(id: Id, resolucion: ResolucionSugerencia, resueltaPor: Id): SugerenciaProducto | null {
  const indice = almacenSugerencias.findIndex((s) => s.id === id);
  if (indice === -1) return null;
  const actual = almacenSugerencias[indice]!;
  const actualizada: SugerenciaProducto = {
    ...actual,
    estado: resolucion.estado,
    resolucion: resolucion.resolucion,
    productoQueLoCubre: resolucion.productoQueLoCubre ?? null,
    duplicadaDe: resolucion.duplicadaDe ?? null,
    resueltaPor,
    resueltaEn: new Date().toISOString(),
  };
  almacenSugerencias[indice] = actualizada;
  return actualizada;
}

// ===========================================================================
// Escenario vacío — para probar el estado "vacío" de la vista
// ===========================================================================

export function listarPlanesVacio(): ReadonlyArray<Plan> {
  return [];
}

export function listarMisSugerenciasVacio(): ReadonlyArray<SugerenciaProducto> {
  return [];
}

export { PRODUCTOS_ESPECIFICOS };
