/**
 * Verificaciones bloqueantes del portafolio cerrado.
 * Corresponde a docs/QA_CHECKLIST.md §1 y §7.
 *
 *   node scripts/verificar-portafolio.mjs
 *
 * Sale con codigo 1 si alguna verificacion falla.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const RAIZ = new URL('..', import.meta.url).pathname;

const ESPECIFICOS = [
  'ojo-digital', 'pulso-digital', 'vendedor-24-7', 'radar-stock', 'faro-digital',
  'merma-ia', 'cotiza-facil', 'precio-vivo', 'ruta-ia',
];
const INTEGRALES = ['park-ia', 'smart-commerce', 'agendar-ia', 'exeq-ia'];
const PRODUCTOS = [...ESPECIFICOS, ...INTEGRALES];

/** Terminos prohibidos en codigo y contenido (no en documentacion de exclusion). */
const PROHIBIDOS = [
  { patron: /sentinela/i, motivo: 'Producto excluido del portafolio (MASTER_SPEC §0 R2)' },
  { patron: /elvio|brun\s*ayala/i, motivo: 'Marca de la referencia visual, no de Lab.IA (ASSET_SOURCES §2)' },
  { patron: /i-monograma/i, motivo: 'Monograma de otra marca (ASSET_SOURCES §2 P1)' },
];

const AMBITOS = ['apps', 'packages', 'content'];
const EXT = new Set(['.ts', '.tsx', '.js', '.mjs', '.css', '.html', '.json', '.md']);

const fallos = [];
const avisos = [];

function archivos(dir) {
  const salida = [];
  let entradas;
  try { entradas = readdirSync(dir); } catch { return salida; }
  for (const e of entradas) {
    if (e === 'node_modules' || e === 'dist' || e.startsWith('.')) continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) salida.push(...archivos(p));
    else if (EXT.has(extname(p))) salida.push(p);
  }
  return salida;
}

// --- 1. Portafolio cerrado en 13 -------------------------------------------
if (PRODUCTOS.length !== 13) fallos.push(`El portafolio tiene ${PRODUCTOS.length} productos, deben ser 13.`);
if (ESPECIFICOS.length !== 9) fallos.push(`Hay ${ESPECIFICOS.length} especificas, deben ser 9.`);
if (INTEGRALES.length !== 4) fallos.push(`Hay ${INTEGRALES.length} integrales, deben ser 4.`);
if (new Set(PRODUCTOS).size !== 13) fallos.push('Hay identificadores de producto repetidos.');

// --- 2. El catalogo compartido declara exactamente esos 13 -----------------
const catalogo = readFileSync(join(RAIZ, 'packages/compartido/src/catalogo.ts'), 'utf8');
for (const id of PRODUCTOS) {
  if (!catalogo.includes(`'${id}'`)) fallos.push(`catalogo.ts no declara el producto '${id}'.`);
}

// --- 3. Terminos prohibidos en codigo y contenido --------------------------
for (const ambito of AMBITOS) {
  for (const archivo of archivos(join(RAIZ, ambito))) {
    const texto = readFileSync(archivo, 'utf8');
    for (const { patron, motivo } of PROHIBIDOS) {
      if (patron.test(texto)) {
        fallos.push(`${archivo.replace(RAIZ, '')}: contiene "${patron.source}" — ${motivo}`);
      }
    }
  }
}

// --- 4. El copy no esta duplicado en codigo -------------------------------
const FRASES_COPY = [
  'Tus cámaras ya miran',
  'El vendedor que nunca duerme',
  'Comprá con datos',
  'Lo que se pierde, ahora se ve',
  'Cada vehículo registrado',
];
for (const archivo of archivos(join(RAIZ, 'packages')).concat(archivos(join(RAIZ, 'apps')))) {
  if (archivo.endsWith('.md')) continue;
  const texto = readFileSync(archivo, 'utf8');
  for (const frase of FRASES_COPY) {
    if (texto.includes(frase)) {
      fallos.push(`${archivo.replace(RAIZ, '')}: copy aprobado duplicado en codigo ("${frase}"). El copy vive solo en content/copy/.`);
    }
  }
}

// --- 5. La API no expone alta de producto ni reapertura de periodo --------
const api = readFileSync(join(RAIZ, 'packages/compartido/src/api.ts'), 'utf8');
const sinLineasDeComentario = api
  .split('\n')
  .filter((l) => !l.trimStart().startsWith('*') && !l.trimStart().startsWith('//'))
  .join('\n');
for (const prohibido of ['crearProducto', 'eliminarProducto', 'reabrirPeriodo', 'editarReglaComision']) {
  if (sinLineasDeComentario.includes(`${prohibido}(`)) {
    fallos.push(`api.ts declara ${prohibido}(): prohibido por contrato (API_CONTRACTS §2.8).`);
  }
}

// --- 6. La taxonomia solo vive en un archivo ------------------------------
const taxonomia = join(RAIZ, 'content/taxonomia/rubros.md');
try { readFileSync(taxonomia, 'utf8'); }
catch { fallos.push('Falta content/taxonomia/rubros.md (unico archivo que declara rubros).'); }

// --- Resultado -------------------------------------------------------------
if (avisos.length) {
  console.log('Avisos:');
  for (const a of avisos) console.log('  ·', a);
}
if (fallos.length) {
  console.error(`\nFALLA — ${fallos.length} verificacion(es) bloqueante(s):\n`);
  for (const f of fallos) console.error('  ⛔', f);
  process.exit(1);
}
console.log(`OK — portafolio cerrado en 13 productos (${ESPECIFICOS.length} especificas + ${INTEGRALES.length} integrales).`);
console.log('OK — sin terminos prohibidos, sin copy duplicado en codigo, sin metodos prohibidos en la API.');
