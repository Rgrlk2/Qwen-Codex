/**
 * Verificaciones de las FICHAS DE PRODUCTO.
 *
 *   npm run verificar:fichas
 *
 * Prueba lo que el analisis estatico no alcanza: que el copy aprobado se corte
 * bien en bloques, que la capa de personalizacion respete sus limites, y —lo
 * mas importante— que lo que ve el cliente no arrastre nada interno.
 *
 * Sale con codigo 1 si alguna comprobacion falla.
 */
import { readFileSync } from 'node:fs';

import {
  bloquesDelCopy, personalizacionInicial, validarPersonalizacion,
  fichaPublicaDe, revisarCopy, indiceDe, porNecesidad, MAXIMO_DESTACADOS,
  validarPrecioPreparado, textoPrecioPreparado, NOTA_PRECIO_REFERENCIAL,
  conBloquesNuevos,
} from '../packages/compartido/src/fichas-logica.ts';
import { textoDinero } from '../packages/compartido/src/core.ts';
import { ENCABEZADOS_DEL_COPY, ORDEN_CANONICO, PRODUCTOS } from '../packages/compartido/src/index.ts';
import { crearCapaDatosMock } from '../packages/mock/src/index.ts';
import { fichaInternaDe } from '../packages/compartido/src/fichas-internas.ts';
import {
  NECESIDADES_SEMILLA, OPERACIONES_SEMILLA, PRODUCTOS_CATALOGO,
  RELACIONES_NECESIDAD_PRODUCTO, RELACIONES_OPERACION_NECESIDAD,
} from '../packages/mock/src/datos-motor.ts';
import { JSDOM } from 'jsdom';
import * as vistaClientes from '../apps/escritorio/src/vistas/clientes/vista.ts';

let ok = 0;
const fallos = [];
let grupo = '';
const seccion = (n) => { grupo = n; console.log(`\n${n}`); };
function comprobar(d, cond, detalle) {
  if (cond) { ok += 1; console.log(`  ✓ ${d}`); return; }
  fallos.push(`${grupo} — ${d}${detalle ? ` (${detalle})` : ''}`);
  console.log(`  X ${d}${detalle ? ` (${detalle})` : ''}`);
}

const ESP = readFileSync('content/copy/LabIA_9_Soluciones_Especificas_Copy_Maestro.md', 'utf8');
const INT = readFileSync('content/copy/LabIA_4_Soluciones_Integrales_Copy_Maestro.md', 'utf8');
const trozo = (t, n) => {
  const i = t.indexOf(`# ${n}.`);
  const j = t.indexOf('\n# ', i + 3);
  return t.slice(i, j === -1 ? undefined : j);
};

// ===========================================================================
seccion('El copy aprobado se corta en bloques');

const ESPECIFICAS = [[1,'Ojo Digital'],[2,'Pulso Digital'],[3,'Vendedor 24/7'],[4,'Radar Stock'],
  [5,'Faro Digital'],[6,'Merma IA'],[7,'Cotiza Fácil'],[8,'Precio Vivo'],[9,'Ruta IA']];
const INTEGRALES = [[1,'Park.IA'],[2,'Smart Commerce'],[3,'Agendar.IA'],[4,'Exeq.IA']];

const fichas = [];
for (const [doc, lista, familia] of [[ESP, ESPECIFICAS, 'especifica'], [INT, INTEGRALES, 'integral']]) {
  for (const [n, nombre] of lista) {
    const bloques = bloquesDelCopy(trozo(doc, n));
    const presentes = bloques.filter((b) => b.presente);
    comprobar(`${nombre}: tiene bloques con contenido`, presentes.length >= 5, `${presentes.length}`);
    fichas.push({ productoId: nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-'), nombreProducto: nombre,
      familia, bloques, logo: `logo-${n}`, huellaCopy: 'h1', versionCatalogo: 1 });
  }
}
comprobar('las 13 fichas se arman del copy', fichas.length === 13, `${fichas.length}`);
comprobar('⛔ el inventario de bloques esta completo en las trece',
  fichas.every((f) => f.bloques.length === ORDEN_CANONICO.length));
comprobar('⛔ los bloques presentes van en el orden del documento fuente, no en uno fijo',
  fichas.every((f) => {
    const presentes = f.bloques.filter((b) => b.presente).map((b) => b.id);
    return presentes.every((id, i) => i === 0 || presentes.indexOf(id) === i);
  }));

// ⛔ EL QUE DUELE: un encabezado que el copy usa y el lector no conoce se
//    descarta en silencio. Asi se perdieron el precio de cinco productos y
//    "En una frase" de los trece.
const encabezadosDelDocumento = new Set(
  [...ESP.split('\n'), ...INT.split('\n')]
    .map((l) => /^###\s+(.+?)\s*$/.exec(l))
    .filter((m) => m !== null)
    .map((m) => m[1]),
);
const sinMapear = [...encabezadosDelDocumento].filter((h) => !ENCABEZADOS_DEL_COPY.includes(h));
comprobar('⛔ NINGUN encabezado del copy aprobado queda sin mapear',
  sinMapear.length === 0, sinMapear.join(' | '));

comprobar('⛔ las trece fichas tienen bloque de precio',
  fichas.every((f) => f.bloques.some((b) => b.id === 'precioDeReferencia' && b.presente)),
  fichas.filter((f) => !f.bloques.some((b) => b.id === 'precioDeReferencia' && b.presente))
    .map((f) => f.nombreProducto).join(', '));
comprobar('⛔ las trece fichas tienen "En una frase"',
  fichas.every((f) => f.bloques.some((b) => b.id === 'enUnaFrase' && b.presente)),
  fichas.filter((f) => !f.bloques.some((b) => b.id === 'enUnaFrase' && b.presente))
    .map((f) => f.nombreProducto).join(', '));

// --- Las particularidades que COPY_LOCK.md manda respetar -----------------
const precioVivo = fichas.find((f) => f.nombreProducto === 'Precio Vivo');
comprobar('⛔ Precio Vivo NO muestra "sin eslogan oficial" como titular',
  !precioVivo.bloques.some((b) => b.presente && b.id === 'slogan'));
comprobar('⛔ Precio Vivo muestra en su lugar la propuesta de valor documentada',
  precioVivo.bloques.some((b) => b.presente && b.id === 'propuestaDeValor'));
comprobar('⛔ y la tarjeta del portafolio de Precio Vivo tampoco dice "sin eslogan"',
  !indiceDe(fichas).especificas.find((e) => e.nombreProducto === 'Precio Vivo')
    .slogan.toLowerCase().includes('sin eslogan'));
comprobar('⛔ Precio Vivo conserva SU encabezado: "¿Que mira?", no "¿Que hace?"',
  precioVivo.bloques.find((b) => b.id === 'queHace')?.titulo === '¿Qué mira?');
const cotiza = fichas.find((f) => f.nombreProducto === 'Cotiza Fácil');
comprobar('⛔ Cotiza Facil conserva SU encabezado: "¿Que necesita del negocio?"',
  cotiza.bloques.find((b) => b.id === 'datosQueNecesita')?.titulo === '¿Qué necesita del negocio?');
comprobar('⛔ y lo lleva DESPUES de "¿Que hace?", como en el documento',
  cotiza.bloques.filter((b) => b.presente).map((b) => b.id).indexOf('datosQueNecesita')
    > cotiza.bloques.filter((b) => b.presente).map((b) => b.id).indexOf('queHace'));
const merma = fichas.find((f) => f.nombreProducto === 'Merma IA');
comprobar('⛔ Merma IA conserva el suyo y lo lleva ANTES, como en el documento',
  merma.bloques.find((b) => b.id === 'datosQueNecesita')?.titulo === '¿Qué datos necesita?'
  && merma.bloques.filter((b) => b.presente).map((b) => b.id).indexOf('datosQueNecesita')
     < merma.bloques.filter((b) => b.presente).map((b) => b.id).indexOf('queHace'));
comprobar('⛔ y los otros once NO tienen esa seccion: no se rellena para emparejar',
  fichas.filter((f) => f.bloques.some((b) => b.id === 'datosQueNecesita' && b.presente)).length === 2);

// COPY_LOCK.md dice que Merma IA es la unica con la seccion *titulada*
// "¿Que datos necesita?", y eso sigue siendo exacto: Cotiza Facil tiene la
// misma seccion con SU propio encabezado aprobado, y lo conserva.
const conEseTitulo = fichas.filter((f) =>
  f.bloques.some((b) => b.presente && b.titulo === '¿Qué datos necesita?'));
comprobar('⛔ el encabezado "¿Qué datos necesita?" existe SOLO en Merma IA (COPY_LOCK)',
  conEseTitulo.length === 1 && conEseTitulo[0].nombreProducto === 'Merma IA',
  conEseTitulo.map((f) => f.nombreProducto).join(', ') || 'ninguna');

// ===========================================================================
seccion('La capa de personalizacion y sus limites');

const inicial = personalizacionInicial(merma);
comprobar('la capa inicial deja todo visible', inicial.every((b) => b.visible));
comprobar('la capa inicial no destaca nada', inicial.every((b) => !b.destacado));
comprobar('la capa inicial valida', validarPersonalizacion(merma, inicial) === null);

const tres = inicial.map((b, i) => ({ ...b, destacado: i < 3 }));
comprobar(`⛔ mas de ${MAXIMO_DESTACADOS} destacados se rechaza`,
  validarPersonalizacion(merma, tres)?.tipo === 'demasiados_destacados');

const repetido = inicial.map((b, i) => (i === 1 ? { ...b, orden: 0 } : b));
comprobar('⛔ orden repetido se rechaza', validarPersonalizacion(merma, repetido)?.tipo === 'orden_repetido');

const ninguno = inicial.map((b) => ({ ...b, visible: false }));
comprobar('⛔ ocultar todo se rechaza', validarPersonalizacion(merma, ninguno)?.tipo === 'sin_bloques_visibles');

const ajeno = [...inicial, { bloqueId: 'datosQueNecesita', visible: true, orden: 99, destacado: false }];
const ojo = fichas.find((f) => f.nombreProducto === 'Ojo Digital');
comprobar('⛔ un bloque que el producto no tiene se rechaza',
  validarPersonalizacion(ojo, ajeno)?.tipo === 'bloque_ausente');

// ===========================================================================
seccion('La ficha INTERNA del vendedor — y la regla de no inventar');

const FUENTES = {
  operaciones: OPERACIONES_SEMILLA,
  necesidades: NECESIDADES_SEMILLA,
  relacionesOperacionNecesidad: RELACIONES_OPERACION_NECESIDAD,
  relacionesNecesidadProducto: RELACIONES_NECESIDAD_PRODUCTO,
  nombresDeProducto: new Map(PRODUCTOS_CATALOGO.map((p) => [p.id, p.nombre])),
};
const oficialV247 = fichas.find((f) => f.nombreProducto === 'Vendedor 24/7');
const interna = fichaInternaDe(FUENTES, 'vendedor-24-7', oficialV247);

comprobar('la ficha interna se arma con la taxonomia cargada',
  !interna.sinTaxonomia && interna.queResuelve.length > 0);

// ⛔ LA REGLA: ni un texto inventado. Cada cadena tiene que estar escrita en
//    la taxonomia. Si alguna vez alguien "mejora" un argumento, esto falla.
const TEXTOS_DE_LA_TAXONOMIA = new Set([
  ...NECESIDADES_SEMILLA.flatMap((n) => [n.nombre, n.descripcion, n.preguntaConfirmacion]),
  ...OPERACIONES_SEMILLA.flatMap((o) => [o.nombre, o.pregunta]),
  ...RELACIONES_OPERACION_NECESIDAD.map((r) => r.motivo),
  ...RELACIONES_NECESIDAD_PRODUCTO.flatMap((r) => [r.argumento, r.motivo, r.adaptacionRequerida ?? '']),
  ...PRODUCTOS_CATALOGO.map((p) => p.nombre),
]);
const inventados = [
  ...interna.queResuelve.flatMap((d) => [d.nombre, d.descripcion, d.argumento, d.motivo,
    ...(d.adaptacionRequerida ? [d.adaptacionRequerida] : [])]),
  ...interna.senales.flatMap((s) => [s.operacion, s.dolor, s.motivo]),
  ...interna.preguntas.flatMap((p) => [p.texto, p.queValida]),
  ...interna.complementarios.flatMap((c) => [c.nombreProducto, c.porLaOperacion, c.cubreElDolor]),
  ...interna.noOfrecerlo.flatMap((n) => [n.dolor, n.motivo]),
].filter((t) => !TEXTOS_DE_LA_TAXONOMIA.has(t));
comprobar('⛔ NI UN texto inventado: todo sale de la taxonomia',
  inventados.length === 0, inventados.slice(0, 2).join(' || '));

comprobar('las senales van de una operacion del negocio a un dolor',
  interna.senales.length > 0
  && interna.senales.every((s) => s.operacion && s.dolor && s.motivo));
comprobar('⛔ lo tipico va antes que lo ocasional',
  interna.senales.every((s, i) => i === 0
    || ['tipica', 'frecuente', 'ocasional'].indexOf(interna.senales[i - 1].probabilidad)
       <= ['tipica', 'frecuente', 'ocasional'].indexOf(s.probabilidad)));
comprobar('trae preguntas para descubrir, sin repetir ninguna',
  interna.preguntas.length > 0
  && new Set(interna.preguntas.map((p) => p.texto)).size === interna.preguntas.length);
comprobar('⛔ un producto NUNCA se complementa a si mismo',
  interna.complementarios.every((c) => c.productoId !== 'vendedor-24-7'));
comprobar('los complementarios salen de una operacion compartida, no de una lista suelta',
  interna.complementarios.every((c) =>
    interna.queObservar.includes(c.porLaOperacion)));
comprobar('⛔ lo no_recomendado NO aparece como algo que resuelve',
  interna.queResuelve.every((d) => d.encaje !== 'no_recomendado'));
comprobar('y si esta documentado donde NO va, se dice',
  interna.noOfrecerlo.every((n) =>
    RELACIONES_NECESIDAD_PRODUCTO.some((r) =>
      r.productoId === 'vendedor-24-7' && r.necesidadId === n.necesidadId
      && r.encaje === 'no_recomendado')));
comprobar('⛔ primero el encaje directo, despues el cercano',
  interna.queResuelve.every((d, i) => i === 0
    || ['directo', 'cercano', 'adaptable'].indexOf(interna.queResuelve[i - 1].encaje)
       <= ['directo', 'cercano', 'adaptable'].indexOf(d.encaje)));
comprobar('trae el precio del copy a mano, para no ir a buscarlo',
  typeof interna.precioDeReferencia === 'string' && interna.precioDeReferencia.length > 0);

// --- Sin taxonomia cargada: se dice, no se rellena ------------------------
const internaSinTaxonomia = fichaInternaDe(
  { ...FUENTES, relacionesNecesidadProducto: [], relacionesOperacionNecesidad: [] },
  'vendedor-24-7', oficialV247,
);
comprobar('⛔ sin taxonomia cargada, lo dice en vez de rellenar con el copy',
  internaSinTaxonomia.sinTaxonomia
  && internaSinTaxonomia.queResuelve.length === 0
  && internaSinTaxonomia.senales.length === 0
  && internaSinTaxonomia.preguntas.length === 0
  && internaSinTaxonomia.complementarios.length === 0);

// --- ⛔ Y NUNCA llega al cliente -----------------------------------------
const publicaV247 = fichaPublicaDe(oficialV247, {
  id: 'p', productoId: 'vendedor-24-7', clienteId: 'c', vendedorId: 'v', planId: null,
  bloques: personalizacionInicial(oficialV247),
  loQueConversamos: null, notaDelVendedor: null, precio: null,
  huellaCopy: 'h1', version: 1,
  creadoEn: '', creadoPor: '', actualizadoEn: '', actualizadoPor: '',
}, 'Ana');
const CAMPOS_PUBLICOS = JSON.stringify(publicaV247);
const FILTRADO = [
  ...interna.senales.map((s) => s.motivo),
  ...interna.preguntas.map((p) => p.texto),
  ...interna.queResuelve.map((d) => d.motivo),
].filter((t) => t && CAMPOS_PUBLICOS.includes(t));
comprobar('⛔ NADA de la ficha interna aparece en lo que recibe el cliente',
  FILTRADO.length === 0, FILTRADO.slice(0, 1).join(''));

// ===========================================================================
seccion('Lo que ve el cliente — la superficie minima');

const capa = {
  id: 'f1', productoId: merma.productoId, clienteId: 'c1', vendedorId: 'v1', planId: 'p1',
  bloques: inicial.map((b) => (b.bloqueId === 'precioDeReferencia' ? { ...b, visible: false } : b)),
  loQueConversamos: 'Nos dijo que pierde mercaderia todos los meses.',
  notaDelVendedor: 'Quedamos en hablar el jueves.',
  huellaCopy: 'h1', version: 1,
  creadoEn: '', creadoPor: 'v1', actualizadoEn: '', actualizadoPor: 'v1',
};
const publica = fichaPublicaDe(merma, capa, 'Juan Pablo');

comprobar('⛔ el bloque oculto NO llega al cliente',
  !publica.bloques.some((b) => b.id === 'precioDeReferencia'));
comprobar('el resto de los bloques si llega', publica.bloques.length === inicial.length - 1);
comprobar('el contenido sale de la ficha OFICIAL, no de la capa',
  publica.bloques.every((b) => merma.bloques.find((o) => o.id === b.id)?.contenido === b.contenido));

const serial = JSON.stringify(publica);
for (const fuga of ['vendedorId', 'clienteId', 'planId', 'comision', 'ranking', 'huellaCopy', 'sensibleAlPrecio', 'presente']) {
  comprobar(`⛔ no se filtra "${fuga}"`, !serial.includes(fuga));
}
comprobar('los dos textos del vendedor si viajan',
  publica.loQueConversamos !== null && publica.notaDelVendedor !== null);
comprobar('⛔ un solo llamado a la accion: "Hablemos"', publica.llamadoALaAccion === 'Hablemos');

const ordenada = { ...capa, bloques: capa.bloques.map((b) => ({ ...b, orden: 100 - b.orden })) };
const alReves = fichaPublicaDe(merma, ordenada, 'Juan Pablo');
comprobar('el cliente recibe los bloques en el orden que eligio el vendedor',
  alReves.bloques[0].id !== publica.bloques[0].id);

// ===========================================================================
seccion('El precio de la ficha: referencial, y del vendedor');

const fichaPrecio = fichas.find((f) => f.nombreProducto === 'Park.IA');
const capaPrecio = {
  id: 'p', productoId: 'park-ia', clienteId: 'c', vendedorId: 'v', planId: null,
  bloques: personalizacionInicial(fichaPrecio),
  loQueConversamos: null, notaDelVendedor: null, precio: null,
  huellaCopy: 'h1', version: 1,
  creadoEn: '', creadoPor: '', actualizadoEn: '', actualizadoPor: '',
};

// --- Sin precio propio: manda el copy -------------------------------------
const sinPrecio = fichaPublicaDe(fichaPrecio, capaPrecio, 'Ana');
const bloqueOficialPrecio = fichaPrecio.bloques.find((b) => b.id === 'precioDeReferencia');
comprobar('sin precio del vendedor, el cliente lee el del copy, palabra por palabra',
  sinPrecio.bloques.find((b) => b.id === 'precioDeReferencia')?.contenido
    === bloqueOficialPrecio.contenido);

// --- Con precio propio: manda el del vendedor -----------------------------
const PRECIO = {
  setup: { monto: 2_400_000, moneda: 'PYG' },
  mensual: { monto: 620_000, moneda: 'PYG' },
  aclaracion: 'Incluye los 40 lugares del subsuelo.',
};
const conPrecio = fichaPublicaDe(fichaPrecio, { ...capaPrecio, precio: PRECIO }, 'Ana');
const textoCliente = conPrecio.bloques.find((b) => b.id === 'precioDeReferencia')?.contenido ?? '';
comprobar('con precio del vendedor, el cliente lee ese importe',
  textoCliente.includes(textoDinero(PRECIO.setup))
  && textoCliente.includes(textoDinero(PRECIO.mensual)));
comprobar('y la aclaracion del vendedor viaja con el',
  textoCliente.includes(PRECIO.aclaracion));
comprobar('⛔ el rango del copy ya no aparece: se reemplaza, no se suma',
  !textoCliente.includes(bloqueOficialPrecio.contenido));

// --- ⛔ La regla que no se negocia ----------------------------------------
comprobar('⛔ el precio propio NO toca ningun otro bloque',
  conPrecio.bloques.filter((b) => b.id !== 'precioDeReferencia').every((b) =>
    b.contenido === fichaPrecio.bloques.find((o) => o.id === b.id).contenido));
comprobar('⛔ y la ficha OFICIAL queda intacta tras mostrar el precio propio',
  fichaPrecio.bloques.find((b) => b.id === 'precioDeReferencia').contenido
    === bloqueOficialPrecio.contenido);

// --- El bloque oculto no se muestra, haya precio o no ---------------------
const ocultandoPrecio = {
  ...capaPrecio,
  precio: PRECIO,
  bloques: capaPrecio.bloques.map((b) =>
    b.bloqueId === 'precioDeReferencia' ? { ...b, visible: false } : b),
};
comprobar('⛔ poner precio no es decidir mostrarlo: con el bloque oculto, no sale',
  !fichaPublicaDe(fichaPrecio, ocultandoPrecio, 'Ana').bloques
    .some((b) => b.id === 'precioDeReferencia'));

// --- La nota de "esto es referencia" no se pega dentro del copy -----------
comprobar('⛔ la nota de referencia NO se mete en el texto del bloque',
  !textoCliente.includes(NOTA_PRECIO_REFERENCIAL)
  && NOTA_PRECIO_REFERENCIAL.length > 0);

// --- Validaciones ---------------------------------------------------------
comprobar('un precio sin ningun importe se rechaza',
  validarPrecioPreparado({ setup: null, mensual: null, aclaracion: null })?.tipo === 'sin_importes');
comprobar('un importe negativo se rechaza',
  validarPrecioPreparado({ setup: { monto: -1, moneda: 'PYG' }, mensual: null, aclaracion: null })
    ?.tipo === 'monto_negativo');
comprobar('⛔ mezclar guaranies con dolares en el mismo precio se rechaza',
  validarPrecioPreparado({
    setup: { monto: 1, moneda: 'PYG' }, mensual: { monto: 1, moneda: 'USD' }, aclaracion: null,
  })?.tipo === 'monedas_mezcladas');
comprobar('una aclaracion larguisima se rechaza',
  validarPrecioPreparado({ ...PRECIO, aclaracion: 'x'.repeat(241) })?.tipo === 'aclaracion_larga');
comprobar('cero es un precio valido: una implementacion bonificada',
  validarPrecioPreparado({ setup: { monto: 0, moneda: 'PYG' }, mensual: null, aclaracion: null })
    === null);

// --- Solo mensual, solo setup ---------------------------------------------
const soloMensual = textoPrecioPreparado({
  setup: null, mensual: { monto: 350_000, moneda: 'PYG' }, aclaracion: null });
comprobar('un producto sin setup no muestra un renglon de implementacion en cero',
  !soloMensual.includes('Implementación') && soloMensual.includes('Mensualidad'));

// --- El importe se escribe igual en todos lados ---------------------------
comprobar('los guaranies se agrupan con punto y sin decimales',
  textoDinero({ monto: 2_400_000, moneda: 'PYG' }) === 'Gs.\u00A02.400.000');
comprobar('los dolares se guardan en centavos y se muestran con coma',
  textoDinero({ monto: 123_456, moneda: 'USD' }) === 'USD\u00A01.234,56');

// --- Una ficha vieja y un copy con una seccion nueva ---------------------
//
// ⛔ Esto es lo que paso de verdad al mapear los encabezados que faltaban:
//    aparecieron bloques que ninguna capa guardada conocia.
const capaVieja = personalizacionInicial(fichaPrecio)
  .filter((b) => b.bloqueId !== 'enUnaFrase' && b.bloqueId !== 'precioDeReferencia');
const completada = conBloquesNuevos(fichaPrecio, capaVieja);
comprobar('⛔ una seccion aprobada DESPUES de preparar la ficha no desaparece',
  completada.some((b) => b.bloqueId === 'enUnaFrase' && b.visible));
comprobar('⛔ pero una seccion nueva SENSIBLE AL PRECIO entra oculta: la muestra el vendedor',
  completada.some((b) => b.bloqueId === 'precioDeReferencia' && !b.visible));
comprobar('y no toca las decisiones que el vendedor ya habia tomado',
  capaVieja.every((v) => {
    const igual = completada.find((c) => c.bloqueId === v.bloqueId);
    return igual?.visible === v.visible && igual?.orden === v.orden;
  }));
comprobar('⛔ y el cliente la ve, aunque la capa guardada sea vieja',
  fichaPublicaDe(fichaPrecio, { ...capaPrecio, bloques: capaVieja }, 'Ana')
    .bloques.some((b) => b.id === 'enUnaFrase'));

// ===========================================================================
seccion('Aviso de copy desactualizado');

comprobar('con el copy vigente no avisa', revisarCopy(merma, capa) === null);
const aviso = revisarCopy(merma, { ...capa, huellaCopy: 'vieja' });
comprobar('con el copy cambiado avisa', aviso !== null);
comprobar('⛔ y aclara que se sirve el VIGENTE, no una copia vieja', aviso?.seSirveElVigente === true);

// ===========================================================================
seccion('El portafolio');

const indice = indiceDe(fichas);
comprobar('nueve especificas', indice.especificas.length === 9, `${indice.especificas.length}`);
comprobar('cuatro integrales', indice.integrales.length === 4, `${indice.integrales.length}`);
comprobar('cada entrada lleva su slogan', indice.especificas.every((e) => e.slogan.length > 0));

const porDolor = porNecesidad('nec-1', 'Se me pierde mercaderia', [
  { ficha: merma, encaje: 'directo' },
  { ficha: ojo, encaje: 'cercano' },
  { ficha: fichas.find((f) => f.nombreProducto === 'Ruta IA'), encaje: 'adaptable' },
]);
comprobar('⛔ la entrada por dolor deja fuera lo adaptable', porDolor.fichas.length === 2);
comprobar('⛔ y pone lo directo primero', porDolor.fichas[0].nombreProducto === 'Merma IA');

// ===========================================================================
seccion('La capa de fichas del mock, ensamblada');

const datos = crearCapaDatosMock({ configuracion: { latenciaMs: 0 } });

const idx = await datos.indicePortafolio();
comprobar('el indice sale del copy, no de una lista escrita a mano',
  idx.ok && idx.datos.especificas.length === 9 && idx.datos.integrales.length === 4,
  idx.ok ? `${idx.datos.especificas.length}+${idx.datos.integrales.length}` : idx.error?.codigo);

let sinBloques = [];
let sinLogo = [];
for (const id of PRODUCTOS) {
  const r = await datos.obtenerFichaOficial(id);
  if (!r.ok) { sinBloques.push(`${id}: ${r.error.codigo}`); continue; }
  if (r.datos.bloques.filter((b) => b.presente).length < 5) sinBloques.push(id);
  if (r.datos.logo !== `/assets/productos/${id}/logo-${id}.webp`) sinLogo.push(id);
}
comprobar('las trece fichas oficiales se sirven con contenido', sinBloques.length === 0, sinBloques.join(' '));
comprobar('cada una apunta a su logo incorporado', sinLogo.length === 0, sinLogo.join(' '));

const inexistente = await datos.obtenerFichaOficial('no-existe');
comprobar('un producto fuera del portafolio da no_encontrado',
  !inexistente.ok && inexistente.error.codigo === 'no_encontrado');

// --- La datos del vendedor -------------------------------------------------
const oficial = (await datos.obtenerFichaOficial('park-ia')).datos;
const partida = personalizacionInicial(oficial);
// ⛔ Copia del CONTENIDO, no una referencia: el mock devuelve siempre el mismo
//    objeto, asi que guardar `oficial` y compararlo despues no probaria nada.
const copyAntes = JSON.stringify(oficial.bloques);

const creada = await datos.prepararFicha(
  { productoId: 'park-ia', clienteId: 'cliente-demo', bloques: partida }, 'clave-1');
comprobar('preparar una ficha guarda la capa', creada.ok && creada.datos.version === 1);
const repetida = await datos.prepararFicha(
  { productoId: 'park-ia', clienteId: 'cliente-demo', bloques: partida }, 'clave-1');
comprobar('la misma clave de idempotencia no duplica',
  repetida.ok && creada.ok && repetida.datos.id === creada.datos.id);

const tresDestacados = partida.map((b, i) => ({ ...b, destacado: i < 3 }));
const rechazo = await datos.prepararFicha(
  { productoId: 'park-ia', clienteId: 'cliente-demo', bloques: tresDestacados }, 'clave-2');
comprobar('⛔ tres destacados se rechazan con regla_comercial',
  !rechazo.ok && rechazo.error.codigo === 'regla_comercial', rechazo.ok ? 'paso' : rechazo.error.codigo);

const todosOcultos = partida.map((b) => ({ ...b, visible: false }));
const vacia = await datos.prepararFicha(
  { productoId: 'park-ia', clienteId: 'cliente-demo', bloques: todosOcultos }, 'clave-3');
comprobar('⛔ una ficha sin bloques visibles se rechaza',
  !vacia.ok && vacia.error.codigo === 'regla_comercial');

const viejaVersion = await datos.actualizarFicha(creada.datos.id, { loQueConversamos: 'x' }, 99);
comprobar('⛔ actualizar con version vieja da conflicto_version',
  !viejaVersion.ok && viejaVersion.error.codigo === 'conflicto_version');

const puesta = await datos.actualizarFicha(
  creada.datos.id, { loQueConversamos: 'Lo que hablamos el martes.' }, 1);
comprobar('actualizar sube la version', puesta.ok && puesta.datos.version === 2);

// ⛔ LA REGLA: no hay forma de escribir en la ficha oficial desde la datos.
const despues = await datos.obtenerFichaOficial('park-ia');
comprobar('⛔ la ficha oficial quedo intacta despues de personalizarla',
  despues.ok && JSON.stringify(despues.datos.bloques) === copyAntes);

const avisoE2E = await datos.revisarCopyDeFicha(creada.datos.id);
comprobar('con el copy vigente no hay aviso', avisoE2E.ok && avisoE2E.datos === null);

// --- El enlace ------------------------------------------------------------
const enlace = await datos.compartirFicha(
  creada.datos.id, { venceEn: '2026-10-01T00:00:00-03:00' }, 'clave-enlace');
comprobar('el enlace de una ficha se declara como ficha',
  enlace.ok && enlace.datos.tipoPropuesta === 'ficha');
comprobar('⛔ el token no lleva adentro el id de la ficha ni del cliente',
  enlace.ok && !enlace.datos.token.includes(creada.datos.id) && !enlace.datos.token.includes('cliente-demo'));
comprobar('⛔ una ficha no pide codigo ni queda respondida',
  enlace.ok && enlace.datos.requiereCodigo === false && enlace.datos.respondido === false);

const revocado = await datos.revocarEnlaceFicha(enlace.datos.id, 'prueba');
comprobar('revocar deja constancia de quien', revocado.ok && revocado.datos.revocadoEn !== null
  && revocado.datos.revocadoPor !== null);

// --- Descartar ------------------------------------------------------------
const descarte = await datos.descartarFicha(creada.datos.id, 'prueba');
comprobar('descartar la capa responde bien', descarte.ok);
const trasDescarte = await datos.obtenerFichaOficial('park-ia');
comprobar('⛔ descartar la capa NO borra la ficha oficial',
  trasDescarte.ok && trasDescarte.datos.bloques.filter((b) => b.presente).length >= 5);

// --- Entrada por dolor ----------------------------------------------------
const dolor = await datos.fichasPorNecesidad('necesidad-pierdo-mercaderia');
comprobar('la entrada por dolor responde', dolor.ok, dolor.ok ? '' : dolor.error?.codigo);
comprobar('⛔ y deja fuera lo adaptable y lo no recomendado',
  dolor.ok && dolor.datos.fichas.length === 2, dolor.ok ? `${dolor.datos.fichas.length}` : '');
comprobar('⛔ lo directo va primero',
  dolor.ok && dolor.datos.fichas[0].productoId === 'merma-ia');

// ===========================================================================
seccion('El taller se abre desde la ficha del cliente');

// La vista de Clientes arma marcado con innerHTML y carga en varios turnos;
// se monta en un DOM de verdad y se la maneja como la manejaria una persona.
const domC = new JSDOM('<!doctype html><html lang="es-PY"><body><div id="app"></div></body></html>', {
  url: 'https://escritorio.ejemplo/', pretendToBeVisual: true,
});
globalThis.window = domC.window;
globalThis.document = domC.window.document;
globalThis.HTMLElement = domC.window.HTMLElement;
globalThis.HTMLInputElement = domC.window.HTMLInputElement;
globalThis.FormData = domC.window.FormData;
globalThis.Blob = domC.window.Blob;
globalThis.Node = domC.window.Node;
globalThis.CustomEvent = domC.window.CustomEvent;
// ⛔ `Element` hace falta: la vista decide con `evento.target instanceof Element`.
//    Sin el, el manejador de clics tira y la vista parece no responder.
globalThis.Element = domC.window.Element;
globalThis.HTMLTextAreaElement = domC.window.HTMLTextAreaElement;
globalThis.HTMLButtonElement = domC.window.HTMLButtonElement;
globalThis.HTMLDialogElement = domC.window.HTMLDialogElement;
globalThis.requestAnimationFrame = (f) => domC.window.setTimeout(f, 0);

const asentar = async (vueltas = 40) => {
  for (let i = 0; i < vueltas; i += 1) await new Promise((l) => domC.window.setTimeout(l, 0));
};

const datosC = crearCapaDatosMock({ configuracion: { latenciaMs: 0 } });
const raizC = domC.window.document.getElementById('app');
const controlC = new domC.window.AbortController();
const vista = vistaClientes.crearVista();
await vista.montar({
  datos: datosC, raiz: raizC, rol: 'vendedor',
  senal: controlC.signal, datosDeEjemplo: true,
});
await asentar();

const primerCliente = raizC.querySelector('[data-accion="abrir-cliente"]');
comprobar('la cartera lista clientes', primerCliente !== null);

if (primerCliente) {
  primerCliente.click();
  await asentar();

  const seccionFichas = raizC.querySelector('#clientes-ficha-taller');
  comprobar('la ficha del cliente trae la seccion de fichas', seccionFichas !== null);

  const elegir = raizC.querySelectorAll('[data-accion="preparar-ficha"]');
  comprobar('ofrece al menos un producto para preparar', elegir.length > 0, `${elegir.length}`);

  if (elegir.length > 0) {
    comprobar('⛔ el taller arranca vacio, no ocupando la pantalla',
      seccionFichas.children.length === 0);

    elegir[0].click();
    await asentar();

    const preparar = raizC.querySelector('#clientes-ficha-taller .fichas-preparar');
    comprobar('al elegir un producto se monta el taller', preparar !== null);

    const previa = raizC.querySelector('#clientes-ficha-taller .ficha-publica');
    comprobar('y con el la vista previa de lo que ve el cliente', previa !== null);

    const texto = raizC.querySelector('#clientes-ficha-taller').textContent ?? '';
    comprobar('el taller trae el copy oficial, no un marcador de posicion',
      texto.length > 400 && !/lorem|placeholder|TODO/i.test(texto), `${texto.length} caracteres`);

    comprobar('⛔ el chip elegido queda marcado',
      elegir[0].getAttribute('aria-pressed') === 'true');

    // ⛔ La regla del sistema: la ficha oficial no se edita desde ningun lado.
    const editables = raizC.querySelectorAll(
      '#clientes-ficha-taller .fichas-bloque-cuerpo [contenteditable], '
      + '#clientes-ficha-taller .fichas-bloque-cuerpo input, '
      + '#clientes-ficha-taller .fichas-bloque-cuerpo textarea',
    );
    comprobar('⛔ el copy oficial no es editable desde el taller', editables.length === 0,
      `${editables.length} campos`);
  }
}

vista.desmontar();

// ===========================================================================
console.log('\nResultado\n');
if (fallos.length) {
  console.error(`FALLA — ${fallos.length} comprobacion(es):\n`);
  for (const f of fallos) console.error('  X', f);
  process.exit(1);
}
console.log(`✓ ${ok}/${ok} comprobaciones de las fichas de producto`);
