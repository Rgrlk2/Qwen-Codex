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
import { ORDEN_CANONICO } from '../packages/compartido/src/index.ts';

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
console.log('\nResultado\n');
if (fallos.length) {
  console.error(`FALLA — ${fallos.length} comprobacion(es):\n`);
  for (const f of fallos) console.error('  X', f);
  process.exit(1);
}
console.log(`✓ ${ok}/${ok} comprobaciones de las fichas de producto`);
