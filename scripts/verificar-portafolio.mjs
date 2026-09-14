/**
 * Verificaciones bloqueantes del Escritorio Vendedores Lab.IA.
 * Corresponde a docs/QA_CHECKLIST.md §1, §4 y §7.
 *
 *   node scripts/verificar-portafolio.mjs
 *
 * Sale con codigo 1 si alguna verificacion falla.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const RAIZ = new URL('..', import.meta.url).pathname;

const ESPECIFICOS = [
  'ojo-digital', 'pulso-digital', 'vendedor-24-7', 'radar-stock', 'faro-digital',
  'merma-ia', 'cotiza-facil', 'precio-vivo', 'ruta-ia',
];
const INTEGRALES = ['park-ia', 'smart-commerce', 'agendar-ia', 'exeq-ia'];
const PRODUCTOS = [...ESPECIFICOS, ...INTEGRALES];

const ROLES = ['vendedor', 'administrador'];

/**
 * Prohibido en CODIGO EFECTIVO. Los comentarios se descartan antes de buscar:
 * una regla que se dispara con su propio texto de prohibicion no sirve para nada.
 */
const PROHIBIDOS = [
  { patron: /sentinela/i, motivo: 'Producto excluido del portafolio (MASTER_SPEC §0 R2)' },
  // Solo valores de rol entre comillas: 'supervisor' / "auditor".
  { patron: /['"](supervisor|auditor)['"]/i, motivo: 'Rol eliminado: solo existen vendedor y administrador (MASTER_SPEC §1.2)' },
  { patron: /elvio|brun\s*ayala|i-monograma/i, motivo: 'Marca de la referencia operativa, no de Lab.IA (ASSET_SOURCES §2)' },
  // "sans-serif" es correcto y obligatorio en la pila de respaldo; "serif" suelto no.
  { patron: /Newsreader|Georgia\s*,|(?<!sans-)\bserif\b/i, motivo: 'Tipografia serif: la identidad Lab.IA usa Inter (DESIGN_SYSTEM §3)' },
  { patron: /E1B864|EFD293|C79A46|--oro\b/i, motivo: 'Paleta dorada de la referencia: la identidad Lab.IA es navy/azul/cyan (DESIGN_SYSTEM §1)' },
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
const rel = (p) => p.replace(RAIZ, '');

/**
 * Quita comentarios antes de buscar terminos prohibidos.
 * Sin esto, cada "⛔ prohibido usar X" del propio repositorio se reporta como
 * una violacion de X, y la verificacion se vuelve ruido.
 */
function codigoEfectivo(texto, ext) {
  if (ext === '.md') return texto;
  let t = texto.replace(/\/\*[\s\S]*?\*\//g, ' ');          // bloque
  if (ext !== '.css') t = t.replace(/(^|[^:])\/\/.*$/gm, '$1'); // linea
  if (ext === '.html') t = t.replace(/<!--[\s\S]*?-->/g, ' ');
  return t;
}

// --- 1. Portafolio cerrado en 13 -------------------------------------------
if (PRODUCTOS.length !== 13) fallos.push(`El portafolio tiene ${PRODUCTOS.length} productos, deben ser 13.`);
if (ESPECIFICOS.length !== 9) fallos.push(`Hay ${ESPECIFICOS.length} especificas, deben ser 9.`);
if (INTEGRALES.length !== 4) fallos.push(`Hay ${INTEGRALES.length} integrales, deben ser 4.`);
if (new Set(PRODUCTOS).size !== 13) fallos.push('Hay identificadores de producto repetidos.');

const catalogo = readFileSync(join(RAIZ, 'packages/compartido/src/catalogo.ts'), 'utf8');
for (const id of PRODUCTOS) {
  if (!catalogo.includes(`'${id}'`)) fallos.push(`catalogo.ts no declara el producto '${id}'.`);
}

// --- 2. Un solo sistema, dos roles -----------------------------------------
if (existsSync(join(RAIZ, 'apps/admin'))) {
  fallos.push('Existe apps/admin: la administracion debe ser una ruta protegida dentro de la unica aplicacion (MASTER_SPEC §1.1).');
}
const apps = readdirSync(join(RAIZ, 'apps')).filter((d) => statSync(join(RAIZ, 'apps', d)).isDirectory());
if (apps.length !== 1 || apps[0] !== 'escritorio') {
  fallos.push(`apps/ debe contener exactamente una aplicacion (escritorio); contiene: ${apps.join(', ')}.`);
}
const identidad = readFileSync(join(RAIZ, 'packages/compartido/src/identidad.ts'), 'utf8');
for (const rol of ROLES) {
  if (!identidad.includes(`'${rol}'`)) fallos.push(`identidad.ts no declara el rol '${rol}'.`);
}

// --- 3. Terminos prohibidos en codigo y contenido --------------------------
for (const ambito of AMBITOS) {
  for (const archivo of archivos(join(RAIZ, ambito))) {
    const texto = codigoEfectivo(readFileSync(archivo, 'utf8'), extname(archivo));
    for (const { patron, motivo } of PROHIBIDOS) {
      const m = texto.match(patron);
      if (m) fallos.push(`${rel(archivo)}: contiene "${m[0].trim()}" — ${motivo}`);
    }
  }
}

// --- 4. El copy no esta duplicado en codigo -------------------------------
const FRASES_COPY = [
  'Tus camaras ya miran', 'Tus cámaras ya miran',
  'El vendedor que nunca duerme',
  'Compra con datos', 'Comprá con datos',
  'Lo que se pierde, ahora se ve',
  'Cada vehiculo registrado', 'Cada vehículo registrado',
];
for (const archivo of [...archivos(join(RAIZ, 'packages')), ...archivos(join(RAIZ, 'apps'))]) {
  if (archivo.endsWith('.md')) continue;
  const texto = codigoEfectivo(readFileSync(archivo, 'utf8'), extname(archivo));
  for (const frase of FRASES_COPY) {
    if (texto.includes(frase)) {
      fallos.push(`${rel(archivo)}: copy aprobado duplicado en codigo ("${frase}"). El copy vive solo en content/copy/.`);
    }
  }
}

// --- 5. Metodos que el contrato no debe exponer ---------------------------
const api = readFileSync(join(RAIZ, 'packages/compartido/src/api.ts'), 'utf8');
const sinComentarios = api
  .split('\n')
  .filter((l) => {
    const t = l.trimStart();
    return !t.startsWith('*') && !t.startsWith('//') && !t.startsWith('/*');
  })
  .join('\n');
const METODOS_PROHIBIDOS = [
  'crearProducto', 'eliminarProducto', 'reabrirPeriodo', 'editarParticipacion',
  'autoaprobarCotizacion', 'editarCopy', 'editarPrecioLista', 'aprobarCotizacion',
];
for (const m of METODOS_PROHIBIDOS) {
  if (sinComentarios.includes(`${m}(`)) {
    fallos.push(`api.ts declara ${m}(): prohibido por contrato (API_CONTRACTS §2.7).`);
  }
}

// --- 6. Identidad: Inter, sin serif, sin dorado ---------------------------
const tokens = join(RAIZ, 'packages/ui/src/tokens.css');
if (!existsSync(tokens)) {
  fallos.push('Falta packages/ui/src/tokens.css.');
} else {
  const css = readFileSync(tokens, 'utf8');
  if (!/--fuente:\s*Inter/.test(css)) fallos.push('tokens.css: la tipografia debe ser Inter (DESIGN_SYSTEM §3).');
  if (!css.includes('#030A1C')) fallos.push('tokens.css: falta el fondo navy documentado #030A1C (DESIGN_SYSTEM §1.1).');
}
const marca = join(RAIZ, 'packages/ui/src/marca-labia.css');
if (!existsSync(marca)) {
  fallos.push('Falta packages/ui/src/marca-labia.css: unico archivo con los hex de marca.');
} else if (/--marca-pendiente:\s*1/.test(readFileSync(marca, 'utf8'))) {
  avisos.push('marca-labia.css: faltan los hex oficiales de azul y cyan. La interfaz se ve monocromatica navy (esperado hasta que llegue la marca).');
}

// --- 7. Responsive: overflow-x hidden como parche -------------------------
for (const ambito of ['apps', 'packages/ui']) {
  for (const archivo of archivos(join(RAIZ, ambito))) {
    if (!['.css', '.html', '.ts'].includes(extname(archivo))) continue;
    const texto = codigoEfectivo(readFileSync(archivo, 'utf8'), extname(archivo));
    if (/overflow-x:\s*hidden/.test(texto) && !/tabla-contenedor/.test(texto)) {
      fallos.push(`${rel(archivo)}: usa overflow-x: hidden. Se corrige la causa del desborde, no se tapa (DESIGN_SYSTEM §7).`);
    }
  }
}

// --- 8. Taxonomia editable en un solo lugar -------------------------------
if (!existsSync(join(RAIZ, 'content/taxonomia/LEEME.md'))) {
  fallos.push('Falta content/taxonomia/LEEME.md (unico lugar que declara taxonomia).');
}

// --- Resultado -------------------------------------------------------------
if (avisos.length) {
  console.log('Avisos:');
  for (const a of avisos) console.log('  ·', a);
  console.log('');
}
if (fallos.length) {
  console.error(`FALLA — ${fallos.length} verificacion(es) bloqueante(s):\n`);
  for (const f of fallos) console.error('  X', f);
  process.exit(1);
}
console.log(`OK — portafolio cerrado en 13 productos (${ESPECIFICOS.length} especificas + ${INTEGRALES.length} integrales).`);
console.log('OK — una sola aplicacion, dos roles (vendedor, administrador).');
console.log('OK — sin terminos prohibidos, sin copy duplicado, sin metodos prohibidos en la API.');
console.log('OK — identidad Lab.IA: Inter, navy documentado, sin serif, sin paleta dorada.');
console.log('OK — sin overflow-x: hidden usado como parche de desborde.');
