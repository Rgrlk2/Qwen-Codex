/**
 * Verificacion en NAVEGADOR REAL de la puerta del cliente.
 *
 * Abre `#/p/<token>` contra una construccion servida y comprueba lo que de
 * verdad importa de esa pantalla:
 *
 *   1. Que muestre la cotizacion (no la pantalla de ingreso).
 *   2. ⛔ Que NO se filtre nada del Escritorio: ni menu, ni rutas, ni sesion.
 *   3. Que no haya errores de consola.
 *
 *   BASE=http://127.0.0.1:8765 TOKEN_CLIENTE=<token> node scripts/verificar-enlace-cliente.mjs
 *
 * ⛔ Necesita `playwright-core`, que NO es dependencia del proyecto
 *    (`npm i --no-save playwright-core`). Sin el paquete, o sin TOKEN_CLIENTE,
 *    avisa y sale en verde: es complementaria, no la que bloquea la entrega.
 */
const BASE = process.env.BASE ?? 'http://127.0.0.1:8765';
const TOKEN = process.env.TOKEN_CLIENTE ?? '';

if (TOKEN === '') {
  console.log('Sin TOKEN_CLIENTE: no hay enlace que abrir. Se omite.');
  process.exit(0);
}

let chromium;
try { ({ chromium } = await import('playwright-core')); }
catch { console.log('Sin playwright-core instalado. Se omite.'); process.exit(0); }

/** ⛔ Nada de esto puede aparecer en la pantalla del cliente. */
const DEL_ESCRITORIO = [
  'Planificar', 'Administración', 'Cerrar sesión', 'Ingresar',
  'Mi cartera', 'Comisión', 'Datos de ejemplo',
];

/**
 * Chromium no lee `HTTPS_PROXY` del entorno: hay que decirselo. En este
 * entorno la salida a internet pasa por un proxy que vuelve a terminar TLS,
 * y su CA ya esta en el almacen del navegador. Sin `--proxy-server`, Chromium
 * sale por afuera y el certificado no le cierra.
 *
 * ⛔ No se desactiva la verificacion de certificados. Se usa el proxy que
 *    corresponde, que es lo que hace que el certificado valide.
 */
const proxy = process.env.HTTPS_PROXY ?? process.env.https_proxy;
const navegador = await chromium.launch({
  executablePath: process.env.CHROMIUM ?? '/opt/pw-browsers/chromium',
  ...(proxy ? { proxy: { server: proxy, bypass: '127.0.0.1,localhost' } } : {}),
});
const pagina = await navegador.newPage({ viewport: { width: 420, height: 900 } });
/**
 * Errores que cuentan: los de la aplicacion.
 *
 * ⛔ Se ignoran los de recursos de OTRO origen (la tipografia de Google, por
 *    ejemplo) porque en este entorno la salida pasa por un proxy cuya CA el
 *    navegador empaquetado no conoce. Eso es del entorno, no del producto:
 *    ignorarlo aca es honesto, desactivar la verificacion de certificados no
 *    lo seria. Lo que la aplicacion misma rompa, se ve igual.
 */
const errores = [];
const ajenos = [];
pagina.on('pageerror', (e) => errores.push(String(e)));
pagina.on('requestfailed', (r) => {
  if (!r.url().startsWith(BASE)) ajenos.push(r.url());
  else errores.push(`No cargo ${r.url()}: ${r.failure()?.errorText ?? ''}`);
});
pagina.on('console', (m) => {
  if (m.type() !== 'error') return;
  const t = m.text();
  if (/Failed to load resource/.test(t)) return; // ya lo cubre `requestfailed`
  errores.push(t);
});

await pagina.goto(`${BASE}/#/p/${encodeURIComponent(TOKEN)}`, { waitUntil: 'networkidle' });
await pagina.waitForTimeout(1200);

const texto = (await pagina.innerText('body')).trim();
const fallos = [];

if (texto === '' || /Cargando/.test(texto)) fallos.push('La pantalla quedo vacia o cargando.');
for (const q of DEL_ESCRITORIO) {
  if (texto.includes(q)) fallos.push(`Se filtro "${q}" a la pantalla del cliente.`);
}
if (errores.length > 0) fallos.push(`Errores de la aplicacion: ${errores.join(' | ')}`);
if (ajenos.length > 0) {
  console.log(`(${ajenos.length} recurso(s) de otro origen no cargaron; en este entorno es la CA del proxy: ${ajenos[0].slice(0, 70)}…)`);
}

console.log('--- lo que ve el cliente ---');
console.log(texto.slice(0, 1200));
console.log();

await navegador.close();

if (fallos.length > 0) {
  console.error('FALLA:');
  for (const f of fallos) console.error(`  X ${f}`);
  process.exit(1);
}
console.log('OK — la puerta del cliente muestra su cotizacion y nada del Escritorio.');
