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
} from '../packages/mock/src/datos-fichas.ts';
import { ORDEN_CANONICO, PRODUCTOS } from '../packages/compartido/src/index.ts';
import { crearCapaDatosMock } from '../packages/mock/src/index.ts';

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
comprobar('el orden de los bloques es el del documento fuente',
  fichas.every((f) => f.bloques.map((b) => b.id).join() === ORDEN_CANONICO.join()));

const merma = fichas.find((f) => f.nombreProducto === 'Merma IA');
const conDatos = fichas.filter((f) => f.bloques.find((b) => b.id === 'datosQueNecesita')?.presente);
comprobar('⛔ "¿Qué datos necesita?" existe SOLO en Merma IA (COPY_LOCK)',
  conDatos.length === 1 && conDatos[0].nombreProducto === 'Merma IA',
  conDatos.map((f) => f.nombreProducto).join(', ') || 'ninguna');

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
console.log('\nResultado\n');
if (fallos.length) {
  console.error(`FALLA — ${fallos.length} comprobacion(es):\n`);
  for (const f of fallos) console.error('  X', f);
  process.exit(1);
}
console.log(`✓ ${ok}/${ok} comprobaciones de las fichas de producto`);
