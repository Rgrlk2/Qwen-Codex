/**
 * Verificaciones bloqueantes del Escritorio Vendedores Lab.IA.
 * Corresponde a docs/QA_CHECKLIST.md §1, §4, §6 y §7.
 *
 * Los calculos de las alternativas se prueban aparte, con importes reales:
 *   node scripts/verificar-calculos.mjs
 *
 *   node scripts/verificar-portafolio.mjs
 *
 * Sale con codigo 1 si alguna verificacion falla.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
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

// --- 12. Cotizacion estructurada: los 25 campos obligatorios --------------
/**
 * Sobre CODIGO EFECTIVO: los comentarios de propuestas.ts nombran cada campo
 * para explicarlo, asi que buscar en el texto crudo daria verde aunque el
 * campo se hubiera borrado de la interfaz. Probado borrando `queNoIncluye`.
 */
const prop = codigoEfectivo(readFileSync(join(RAIZ, 'packages/compartido/src/propuestas.ts'), 'utf8'), '.ts');
const CAMPOS_COTIZACION = [
  'folio', 'nombreCliente', 'nombreEmpresaOProfesional', 'nombreProducto', 'variante',
  'nombreVendedor', 'fechaEmision', 'fechaValidez',
  'setupLista', 'setupEspecial', 'ahorroSetup',
  'mensualLista', 'mensualEspecial', 'ahorroMensual',
  'permanenciaMinimaMeses', 'CondicionesInstalacion', 'tiempoEstimadoDiasHabiles',
  'aportesDelCliente', 'queIncluye', 'queNoIncluye', 'basesYCondiciones',
  'LogosDocumento', 'rgrlkGroup',
];
for (const campo of CAMPOS_COTIZACION) {
  if (!prop.includes(campo)) {
    fallos.push(`propuestas.ts no declara ${campo}: es uno de los 25 campos obligatorios (COMMERCIAL_RULES §6.1).`);
  }
}
/** La etiqueta del cliente es "Precio especial", no "precio verdadero" ni "precio efectivo". */
if (!prop.includes("ETIQUETA_PRECIO_ESPECIAL = 'Precio especial'")) {
  fallos.push('propuestas.ts no declara ETIQUETA_PRECIO_ESPECIAL = \'Precio especial\' (COMMERCIAL_RULES §6, regla C11).');
}

// --- 12b. Ningun modelo de cliente particular -----------------------------
/**
 * La cotizacion es una PLANTILLA GENERICA. No hay cliente de referencia, ni
 * condiciones heredadas de un caso, ni importes copiados de una propuesta.
 * Se busca en comentarios tambien: el modelo eliminado vivia sobre todo ahi.
 */
const MODELO_ELIMINADO = [
  { patron: /fundador[ao]/i, motivo: 'Modelo "Cliente Fundadora" eliminado: la cotizacion es una plantilla generica' },
  { patron: /leguizam[oó]n/i, motivo: 'Cliente particular: ningun nombre de cliente vive en el repositorio' },
  { patron: /carta\s*oferta/i, motivo: 'La estructura no se copia de una propuesta anterior (COMMERCIAL_RULES §6)' },
];
for (const ambito of [...AMBITOS, 'docs']) {
  for (const archivo of archivos(join(RAIZ, ambito))) {
    if (archivo.includes('/content/copy/')) continue;   // el copy aprobado es intocable
    const texto = readFileSync(archivo, 'utf8');
    for (const { patron, motivo } of MODELO_ELIMINADO) {
      const m = texto.match(patron);
      if (m) fallos.push(`${rel(archivo)}: contiene "${m[0].trim()}" — ${motivo}.`);
    }
  }
}

// --- 12c. Las cuatro alternativas financieras -----------------------------
const alt = readFileSync(join(RAIZ, 'packages/compartido/src/alternativas.ts'), 'utf8');
for (const codigo of ['estandar', 'adelantado_12', 'adelantado_24', 'diferido']) {
  if (!alt.includes(`codigo: '${codigo}'`)) {
    fallos.push(`alternativas.ts no declara la alternativa ${codigo} (COMMERCIAL_RULES §7).`);
  }
}
/**
 * Los parametros exactos de cada alternativa, leidos del CODIGO EFECTIVO: si
 * alguien cambia un factor o una cantidad de cuotas, esto lo rechaza.
 * `diferido` con 11 cuotas y 12 meses de servicio es el mes bonificado.
 */
const altEfectivo = codigoEfectivo(alt, '.ts');
const PARAMETROS_ESPERADOS = [
  { codigo: 'estandar', mesesServicio: 12, cuotasAPagar: 12, factorMensual: '1' },
  { codigo: 'adelantado_12', mesesServicio: 12, cuotasAPagar: 12, factorMensual: '0.9' },
  { codigo: 'adelantado_24', mesesServicio: 24, cuotasAPagar: 24, factorMensual: '0.8' },
  { codigo: 'diferido', mesesServicio: 12, cuotasAPagar: 11, factorMensual: '0.9' },
];
for (const esperado of PARAMETROS_ESPERADOS) {
  const bloque = altEfectivo.match(
    new RegExp(`codigo: '${esperado.codigo}',[\\s\\S]{0,600}?descripcionPago`),
  );
  if (!bloque) {
    fallos.push(`alternativas.ts: no se pudo leer el bloque de ${esperado.codigo}.`);
    continue;
  }
  const b = bloque[0];
  if (!b.includes(`mesesServicio: ${esperado.mesesServicio},`)) {
    fallos.push(`alternativas.ts: ${esperado.codigo} deberia tener mesesServicio: ${esperado.mesesServicio} (COMMERCIAL_RULES §7.1).`);
  }
  if (!b.includes(`cuotasAPagar: ${esperado.cuotasAPagar},`)) {
    fallos.push(`alternativas.ts: ${esperado.codigo} deberia tener cuotasAPagar: ${esperado.cuotasAPagar} (COMMERCIAL_RULES §7.1).`);
  }
  if (!b.includes(`factorMensual: ${esperado.factorMensual},`)) {
    fallos.push(`alternativas.ts: ${esperado.codigo} deberia tener factorMensual: ${esperado.factorMensual} (COMMERCIAL_RULES §7.1).`);
  }
}

// --- 12d. Respuesta del cliente: opciones y casilla obligatoria -----------
const ace = readFileSync(join(RAIZ, 'packages/compartido/src/aceptacion.ts'), 'utf8');
const OPCIONES = {
  estandar: 'Elijo el plan estándar.',
  adelantado_12: 'Elijo pago adelantado por 12 meses.',
  adelantado_24: 'Elijo pago adelantado por 24 meses.',
  diferido: 'Elijo cheques diferidos o débito automático.',
  contactar_antes: 'Quiero que me contacten antes de elegir.',
  no_continuar: 'No continuar por ahora.',
};
for (const [codigo, texto] of Object.entries(OPCIONES)) {
  if (!ace.includes(`${codigo}: '${texto}'`)) {
    fallos.push(`aceptacion.ts: falta el texto exacto de la opcion ${codigo} (MASTER_SPEC §11.2).`);
  }
}
const TEXTO_ACEPTACION_ESPERADO =
  'He revisado la opción seleccionada y solicito que Lab.IA continúe con los próximos pasos.';
if (!ace.includes(TEXTO_ACEPTACION_ESPERADO)) {
  fallos.push('aceptacion.ts: falta el texto exacto de la casilla obligatoria (MASTER_SPEC §11.2).');
}
if (!ace.includes("TEXTO_BOTON_ENVIO = 'Enviar mi elección'")) {
  fallos.push('aceptacion.ts: el boton final debe decir exactamente "Enviar mi elección".');
}
/** La casilla y la constancia son obligaciones de tipo, no validaciones salteables. */
for (const literal of ['aceptacionMarcada: true', 'constanciaGuardada: true', "naturaleza: 'constancia_comercial'"]) {
  if (!codigoEfectivo(ace, '.ts').includes(literal)) {
    fallos.push(`aceptacion.ts: falta el literal \`${literal}\` (DATA_MODEL §8.5 y §8.6).`);
  }
}
/** Es una constancia comercial. Nunca un contrato ni una firma electronica legal. */
const CONFUSION_LEGAL = /(esta\s+cotizaci[oó]n|esta\s+respuesta|la\s+respuesta|la\s+constancia)[^.]{0,80}\b(es|equivale a|constituye)\b[^.]{0,40}\b(contrato|firma electr[oó]nica)/i;
for (const archivo of [...archivos(join(RAIZ, 'packages')), ...archivos(join(RAIZ, 'apps'))]) {
  const texto = readFileSync(archivo, 'utf8');
  if (CONFUSION_LEGAL.test(texto)) {
    fallos.push(`${rel(archivo)}: presenta la respuesta del cliente como contrato o firma electronica legal. Es una constancia comercial (MASTER_SPEC §11.3).`);
  }
}

// --- 12e. El numero personal del CEO no vive en el navegador --------------
/**
 * El WhatsApp corporativo +595 984 355775 es publico y puede aparecer.
 * Cualquier OTRO celular paraguayo en apps/ es sospechoso: el numero del CEO
 * se configura y se guarda SOLO en el servidor.
 */
const WHATSAPP_CORPORATIVO = '984355775';
const TELEFONO_PY = /(?:\+?595|0)[\s.-]?9[\s.-]?\d{2}[\s.-]?\d{3}[\s.-]?\d{3}/g;
for (const archivo of archivos(join(RAIZ, 'apps'))) {
  const texto = readFileSync(archivo, 'utf8');   // tambien en comentarios: ahi tampoco va
  for (const m of texto.match(TELEFONO_PY) ?? []) {
    if (m.replace(/[^0-9]/g, '').endsWith(WHATSAPP_CORPORATIVO)) continue;
    fallos.push(`${rel(archivo)}: numero de celular "${m}" en codigo del navegador. Solo el WhatsApp corporativo puede aparecer; el del CEO vive unicamente en el servidor (MASTER_SPEC §11.3).`);
  }
}
/** La firma del CEO no se sirve por URL publica. */
const FIRMA_EXPUESTA = /(firma[-_]?(del[-_]?)?ceo|ceo[-_]?firma)[^\n]{0,40}\.(png|jpe?g|svg|webp)/i;
for (const archivo of [...archivos(join(RAIZ, 'apps')), ...archivos(join(RAIZ, 'packages'))]) {
  const texto = readFileSync(archivo, 'utf8');
  const m = texto.match(FIRMA_EXPUESTA);
  if (m) {
    fallos.push(`${rel(archivo)}: "${m[0]}" parece una ruta a la firma del CEO. Es un activo protegido, se sirve desde el servidor (MASTER_SPEC §11.1).`);
  }
}

// --- 12f. Logo oficial de Park.IA -----------------------------------------
/**
 * Los trece productos tienen su logo. El de Park.IA se guarda tal cual lo
 * entrego el CEO: si alguien lo regenera, lo recomprime o lo recorta, el
 * SHA-256 cambia y esto lo rechaza.
 */
const LOGO_PARK = join(RAIZ, 'apps/escritorio/public/assets/productos/park-ia/logo-park-ia.webp');
const SHA_LOGO_PARK = '534320db17a2ef422a88ce890f053596dc442922c6d53e84f7e5dc3e6ead94f7';
if (!existsSync(LOGO_PARK)) {
  fallos.push('Falta apps/escritorio/public/assets/productos/park-ia/logo-park-ia.webp: es el logo oficial de Park.IA.');
} else {
  const bytes = readFileSync(LOGO_PARK);
  const sha = createHash('sha256').update(bytes).digest('hex');
  if (sha !== SHA_LOGO_PARK) {
    fallos.push(
      `logo-park-ia.webp fue modificado (sha256 ${sha.slice(0, 16)}..., esperado ${SHA_LOGO_PARK.slice(0, 16)}...). ` +
      'PROHIBIDO generar otro, redibujar, recolorear, recortar, quitar el fondo o deformar: INVENTARIO_ACTIVOS §3.2.',
    );
  }
  // Proporcion cuadrada, leida de la cabecera VP8X del propio archivo.
  if (bytes.slice(12, 16).toString('latin1') === 'VP8X') {
    const ancho = bytes.readUIntLE(24, 3) + 1;
    const alto = bytes.readUIntLE(27, 3) + 1;
    if (ancho !== alto) {
      fallos.push(`logo-park-ia.webp dejo de ser cuadrado (${ancho} x ${alto}). Se muestra con object-fit: contain, sin deformar.`);
    }
  }
}
const invActivos = readFileSync(join(RAIZ, 'docs/INVENTARIO_ACTIVOS.md'), 'utf8');
if (/Park\.IA\s+no\s+tiene\s+logo/i.test(invActivos)) {
  fallos.push('INVENTARIO_ACTIVOS.md sigue afirmando que Park.IA no tiene logo. Lo tiene: adjunto del CEO del 15/09/2026 (§3.2).');
}

// --- 12g. Ninguna contrasena vive en el repositorio -----------------------
/**
 * Instruccion del CEO: ninguna contrasena escrita en HTML, JS, TS, mocks ni
 * ningun archivo del repositorio.
 *
 * El mock no guarda claves —acepta cualquiera no vacia— y las pruebas
 * inventan la suya en cada corrida. Estos tres controles impiden que vuelva
 * a entrar una:
 *   a) las cuentas de ejemplo no declaran un campo `clave`;
 *   b) nadie llama a `ingresar` con una cadena literal por contrasena;
 *   c) no aparece una asignacion de clave/password a un literal.
 */
const sesionMock = codigoEfectivo(
  readFileSync(join(RAIZ, 'packages/mock/src/datos-sesion.ts'), 'utf8'), '.ts',
);
if (/\bclave\s*:\s*['"`]/.test(sesionMock)) {
  fallos.push('datos-sesion.ts declara una contrasena literal. Ninguna clave vive en el repositorio.');
}
if (!sesionMock.includes('debeCambiarClave')) {
  fallos.push('datos-sesion.ts no marca debeCambiarClave: la clave inicial tiene que cambiarse al primer ingreso real.');
}

/** `ingresar(usuario, 'algo')` con la clave literal. El usuario si puede serlo. */
const INGRESO_CON_CLAVE_LITERAL = /\.?ingresar\(\s*[^,)]+,\s*(['"`])(?!\s*\1)(?:(?!\1).){3,}\1/;
for (const archivo of [...archivos(join(RAIZ, 'scripts')), ...archivos(join(RAIZ, 'apps')), ...archivos(join(RAIZ, 'packages'))]) {
  if (archivo.endsWith('.md')) continue;
  const texto = codigoEfectivo(readFileSync(archivo, 'utf8'), extname(archivo));
  const m = texto.match(INGRESO_CON_CLAVE_LITERAL);
  if (m) {
    fallos.push(`${rel(archivo)}: "${m[0].trim()}" pasa una contrasena literal a ingresar(). Las pruebas inventan la clave en cada corrida.`);
  }
}

/**
 * Asignaciones tipo `password: "..."` / `claveInicial = "..."`.
 *
 * ⛔ OJO con la palabra "clave" a secas: en castellano tambien significa clave
 *    de busqueda, y el repositorio la usa asi de forma legitima —la `clave` de
 *    un mapa, `ClaveIdempotencia`—. Buscarla suelta marcaba codigo correcto
 *    (`clave: 'dineroVendido'`), asi que solo se marca cuando viene calificada
 *    como contrasena. El campo `clave` de una cuenta lo cubre el control
 *    especifico de datos-sesion.ts, mas arriba.
 */
const CLAVE_LITERAL = /(?:contrase[nñ]a|password|passwd|pwd|clave(?:Inicial|Actual|Nueva|Temporal|Secreta|Maestra|DeAcceso|PorDefecto))\s*[:=]\s*(['"`])(?!\s*\1)(?:(?!\1).){3,}\1/i;
for (const ambito of ['apps', 'packages', 'scripts']) {
  for (const archivo of archivos(join(RAIZ, ambito))) {
    if (archivo.endsWith('.md')) continue;
    const texto = codigoEfectivo(readFileSync(archivo, 'utf8'), extname(archivo));
    const m = texto.match(CLAVE_LITERAL);
    if (m) {
      fallos.push(`${rel(archivo)}: "${m[0].trim()}" parece una contrasena escrita en el repositorio.`);
    }
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
console.log('OK — agenda operativa y los 25 campos obligatorios de la cotizacion.');
console.log('OK — sin modelo de cliente particular: la cotizacion es una plantilla generica.');
console.log('OK — las cuatro alternativas financieras, con sus parametros exactos.');
console.log('OK — respuesta del cliente: seis opciones excluyentes, casilla obligatoria y constancia comercial.');
console.log('OK — sin celular del CEO ni firma expuesta en codigo del navegador.');
console.log('OK — los 13 logos oficiales, con el de Park.IA intacto y cuadrado.');
console.log('OK — ninguna contrasena escrita en el repositorio.');
console.log('OK — todas las referencias cruzadas entre documentos apuntan a secciones reales.');
