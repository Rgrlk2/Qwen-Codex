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

// --- 6. Identidad oficial Lab.IA -----------------------------------------
/** Los ocho colores oficiales. Ninguno se cambia ni se "ajusta". */
const COLORES_OFICIALES = [
  '#020711', '#06162F', '#0A55D9', '#098CFF',
  '#00D9FF', '#12D9FF', '#F2F7FF', '#AEB8C8',
];
const marca = join(RAIZ, 'packages/ui/src/marca-labia.css');
if (!existsSync(marca)) {
  fallos.push('Falta packages/ui/src/marca-labia.css: unico archivo con los hex de marca.');
} else {
  // Sin comentarios: el hex tiene que estar DECLARADO, no sólo mencionado en la
  // tabla de contraste del encabezado.
  const css = codigoEfectivo(readFileSync(marca, 'utf8'), '.css').toUpperCase();
  for (const hex of COLORES_OFICIALES) {
    if (!css.includes(hex)) {
      fallos.push(`marca-labia.css: falta el color oficial ${hex} declarado (MASTER_SPEC §14.1).`);
    }
  }
  if (!/--LABIA-FUENTE:\s*INTER/.test(css)) {
    fallos.push('marca-labia.css: la tipografia oficial es Inter (MASTER_SPEC §14.1).');
  }
  if (/--MARCA-PENDIENTE:\s*1/.test(css)) {
    fallos.push('marca-labia.css: --marca-pendiente sigue en 1, pero los ocho colores oficiales ya estan definidos.');
  }
}
const tokens = join(RAIZ, 'packages/ui/src/tokens.css');
if (!existsSync(tokens)) {
  fallos.push('Falta packages/ui/src/tokens.css.');
} else {
  const css = readFileSync(tokens, 'utf8');
  if (!/--fuente:\s*var\(--labia-fuente\)/.test(css)) {
    fallos.push('tokens.css: --fuente debe consumir --labia-fuente (Inter).');
  }
  // ⛔ #0A55D9 no alcanza AA para texto: 3.18 sobre #020711, 2.85 sobre #06162F.
  //    Es color de relleno. --azul-texto y --cian son los de texto.
  if (!/--azul-texto:/.test(css)) {
    fallos.push('tokens.css: falta --azul-texto. #0A55D9 no puede usarse como color de texto (MASTER_SPEC §14.2).');
  }
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

// --- 9. Las siete rutas, con la agenda protegida --------------------------
const RUTAS_ESPERADAS = [
  'inicio', 'planificar', 'clientes', 'agenda', 'propuestas', 'dinero', 'administracion',
];
const rutas = readFileSync(join(RAIZ, 'apps/escritorio/src/nucleo/rutas.ts'), 'utf8');
for (const r of RUTAS_ESPERADAS) {
  if (!rutas.includes(`ruta: '${r}'`)) fallos.push(`rutas.ts no declara la ruta '${r}'.`);
}
if (!/ruta: 'administracion'[\s\S]{0,200}roles: \['administrador'\]/.test(rutas)) {
  fallos.push("rutas.ts: #/administracion debe estar restringida al rol administrador (MASTER_SPEC §1.1).");
}

// --- 10. Investigacion: proveedores en el servidor ------------------------
const inv = readFileSync(join(RAIZ, 'packages/compartido/src/investigacion.ts'), 'utf8');
for (const t of ['InvestigacionObjetivo', 'DatoInvestigado', 'FuenteInvestigacion', 'NivelConfianza', 'EstadoInvestigacion']) {
  if (!inv.includes(t)) fallos.push(`investigacion.ts no declara ${t} (MASTER_SPEC §3).`);
}
if (!sinComentarios.includes('investigarObjetivo(')) {
  fallos.push('api.ts no declara investigarObjetivo() (API_CONTRACTS §2.3).');
}
/** Ninguna clave ni endpoint de proveedor puede vivir en el cliente. */
const SECRETOS = /(apiKey|api_key|secret|bearer\s|sk-[A-Za-z0-9]|token:\s*['"][A-Za-z0-9]{12})/i;
for (const archivo of archivos(join(RAIZ, 'apps'))) {
  const texto = codigoEfectivo(readFileSync(archivo, 'utf8'), extname(archivo));
  if (SECRETOS.test(texto)) {
    fallos.push(`${rel(archivo)}: posible credencial en el cliente. Investigacion y modelo de lenguaje viven en el servidor (MASTER_SPEC §3.5).`);
  }
}

// --- 11. Agenda: existe y es de S4 ---------------------------------------
const ag = join(RAIZ, 'packages/compartido/src/agenda.ts');
if (!existsSync(ag)) fallos.push('Falta packages/compartido/src/agenda.ts (MASTER_SPEC §4).');
if (!existsSync(join(RAIZ, 'apps/escritorio/src/vistas/agenda'))) {
  fallos.push('Falta la vista apps/escritorio/src/vistas/agenda/.');
}

// --- 12. Cotizacion estructurada ------------------------------------------
const prop = readFileSync(join(RAIZ, 'packages/compartido/src/propuestas.ts'), 'utf8');
for (const campo of ['HitoPagoSetup', 'mesesIncluidos', 'mesesCongelamientoPrecio', 'CondicionHabilitante', 'descuentoSetupPorcentaje']) {
  if (!prop.includes(campo)) {
    fallos.push(`propuestas.ts no declara ${campo} (COMMERCIAL_RULES §6).`);
  }
}

// --- 13. Referencias cruzadas entre documentos ---------------------------
/**
 * Con cinco rondas de renumeracion, una referencia "MASTER_SPEC §12" que ya no
 * existe es el defecto mas facil de dejar y el mas dificil de ver. Este chequeo
 * valida que toda referencia apunte a una seccion real.
 */
const DOCS = [
  'MASTER_SPEC', 'USER_FLOWS', 'DATA_MODEL', 'API_CONTRACTS', 'COMMERCIAL_RULES',
  'DESIGN_SYSTEM', 'ASSET_SOURCES', 'QA_CHECKLIST', 'PARALLEL_SESSIONS',
  'INVENTARIO_ACTIVOS', 'PROMPTS_SESIONES', 'PEDIDOS',
];

/** Secciones (## N.) y subsecciones (### N.M) que existen en cada documento. */
const secciones = new Map();
for (const doc of DOCS) {
  const ruta = join(RAIZ, `docs/${doc}.md`);
  if (!existsSync(ruta)) { fallos.push(`Falta docs/${doc}.md.`); continue; }
  const texto = readFileSync(ruta, 'utf8');
  const set = new Set();
  // Encabezados: "## 5." / "### 5.2"
  for (const m of texto.matchAll(/^#{2,4} ([0-9]+(?:\.[0-9]+)*)[. ]/gm)) set.add(m[1]);
  // Items numerados en fila de tabla: "| 5.2 ⛔ |" — QA_CHECKLIST numera asi.
  for (const m of texto.matchAll(/^\| ([0-9]+(?:\.[0-9]+)+)[a-z]? /gm)) set.add(m[1]);
  secciones.set(doc, set);
}

const AMBITOS_REF = ['docs', 'packages/compartido/src', 'packages/ui/src', 'apps', 'content', 'scripts'];
for (const ambito of AMBITOS_REF) {
  for (const archivo of archivos(join(RAIZ, ambito))) {
    const texto = readFileSync(archivo, 'utf8');
    for (const m of texto.matchAll(/\b([A-Z_]{4,})(?:\.md)? §([0-9]+(?:\.[0-9]+)?)/g)) {
      const [, doc, sec] = m;
      if (!secciones.has(doc)) continue;          // no es un documento nuestro
      const set = secciones.get(doc);
      // Una referencia a §N vale si existe §N o alguna §N.M
      const valida = set.has(sec) || [...set].some((x) => x.startsWith(`${sec}.`));
      if (!valida) {
        fallos.push(`${rel(archivo)}: referencia a ${doc} §${sec}, que no existe.`);
      }
    }
  }
}

// --- 14. Inventario de activos --------------------------------------------
if (!existsSync(join(RAIZ, 'docs/INVENTARIO_ACTIVOS.md'))) {
  fallos.push('Falta docs/INVENTARIO_ACTIVOS.md: los activos se buscan en Drive, no se declaran pendientes.');
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
console.log('OK — identidad Lab.IA: ocho colores oficiales + Inter, sin serif, sin paleta dorada.');
console.log('OK — sin overflow-x: hidden usado como parche de desborde.');
console.log('OK — siete rutas, #/administracion restringida al administrador.');
console.log('OK — investigacion automatica declarada, sin credenciales en el cliente.');
console.log('OK — agenda operativa y cotizacion estructurada declaradas.');
console.log('OK — todas las referencias cruzadas entre documentos apuntan a secciones reales.');
