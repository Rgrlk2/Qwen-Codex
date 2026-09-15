/**
 * Verificacion en NAVEGADOR REAL del nucleo y la autenticacion (Sesion 1).
 * Corresponde a docs/QA_CHECKLIST.md §1.5, §7.3 y §7.4.
 *
 * Lo que jsdom no puede probar: el ancho real de la pagina en los cinco
 * anchos, el contorno de foco calculado y el area tactil.
 *
 *   npm run dev                        (en otra terminal, levanta el mock)
 *   node scripts/verificar-navegador.mjs
 *
 * Variables:
 *   BASE       raiz del servidor a probar (por defecto http://localhost:5173)
 *   CHROMIUM   ruta al ejecutable, si no esta en el lugar habitual
 *
 * ⛔ Necesita `playwright-core`, que NO es dependencia del proyecto: se instala
 *    aparte (`npm i --no-save playwright-core`) para no cargarle al repositorio
 *    un navegador entero. Sin el paquete, el script avisa y sale en verde: es
 *    una verificacion complementaria, no la que bloquea la entrega.
 */

const BASE = process.env.BASE ?? 'http://localhost:5173';
const ANCHOS = [360, 390, 768, 1024, 1440];

let chromium;
try {
  ({ chromium } = await import('playwright-core'));
} catch {
  console.log('SALTEADA — falta playwright-core. Instalalo con: npm i --no-save playwright-core');
  process.exit(0);
}

const EJECUTABLE = process.env.CHROMIUM
  ?? process.env.CHROMIUM_PATH
  ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let fallos = 0;
const ok = (d, c, extra = '') => {
  console.log(`${c ? '  ✓' : '  X'} ${d}${!c && extra ? ` (${extra})` : ''}`);
  if (!c) fallos += 1;
};

const navegador = await chromium.launch({ executablePath: EJECUTABLE, args: ['--no-sandbox'] });
const pagina = await navegador.newPage();
const excepciones = [];
const recursos = [];
pagina.on('pageerror', (e) => excepciones.push(String(e)));
pagina.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/i.test(m.text())) excepciones.push(m.text()); });
pagina.on('requestfailed', (r) => recursos.push(`${r.url()} — ${r.failure()?.errorText ?? ''}`));

/** ⛔ Cero scroll horizontal DE PAGINA en los cinco anchos (QA §7.3.2). */
async function medirAnchos(etiqueta) {
  for (const ancho of ANCHOS) {
    await pagina.setViewportSize({ width: ancho, height: 900 });
    await pagina.waitForTimeout(120);
    const r = await pagina.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      ventana: window.innerWidth,
      culpables: [...document.querySelectorAll('*')]
        .filter((e) => e.getBoundingClientRect().right > window.innerWidth + 1)
        .map((e) => `${e.tagName}.${e.className}`).slice(0, 3),
    }));
    ok(`${etiqueta} · ${ancho} px sin scroll horizontal`, r.scroll <= r.ventana, `${r.scroll} > ${r.ventana}: ${r.culpables.join(', ')}`);
  }
}

console.log(`\nIngreso (${BASE})`);
await pagina.goto(`${BASE}/#/inicio`, { waitUntil: 'networkidle' });
await pagina.waitForSelector('#ingreso-usuario', { timeout: 15_000 });
ok('sin sesion, el Escritorio muestra el ingreso', await pagina.locator('#ingreso-usuario').isVisible());
ok('⛔ chip permanente "Datos de ejemplo"', (await pagina.locator('text=Datos de ejemplo').count()) > 0);
await medirAnchos('Ingreso');

await pagina.setViewportSize({ width: 1440, height: 900 });
await pagina.locator('#ingreso-usuario').focus();
const contorno = await pagina.evaluate(() => {
  const estilo = getComputedStyle(document.querySelector('#ingreso-usuario'));
  return { ancho: estilo.outlineWidth, estilo: estilo.outlineStyle };
});
ok('⛔ foco visible: el outline no se elimina', contorno.estilo !== 'none' && Number.parseFloat(contorno.ancho) >= 2, JSON.stringify(contorno));

const areas = await pagina.evaluate(() => ({
  boton: document.querySelector('button[type="submit"]').getBoundingClientRect().height,
  campo: document.querySelector('#ingreso-usuario').getBoundingClientRect().height,
}));
ok('⛔ area tactil >= 44 px', areas.boton >= 44 && areas.campo >= 44, JSON.stringify(areas));

async function intentar(usuario, clave) {
  await pagina.fill('#ingreso-usuario', usuario);
  await pagina.fill('#ingreso-clave', clave);
  await pagina.press('#ingreso-clave', 'Enter');
  await pagina.waitForSelector('.ingreso-error', { timeout: 10_000 });
  return pagina.locator('.ingreso-error').innerText();
}
const conClaveMala = await intentar('vendedora', 'clave-que-no-es');
const conUsuarioInexistente = await intentar('no-existe-nadie', 'clave-que-no-es');
ok('Enter envia el formulario', conClaveMala.length > 0);
ok('⛔ el mensaje es el mismo exista o no el usuario', conClaveMala === conUsuarioInexistente, `"${conClaveMala}" vs "${conUsuarioInexistente}"`);

console.log('\nGuardia de rol — vendedor');
await pagina.fill('#ingreso-usuario', 'vendedora');
await pagina.fill('#ingreso-clave', 'ejemplo-vendedora');
await pagina.press('#ingreso-clave', 'Enter');
await pagina.waitForSelector('nav.lateral', { timeout: 15_000 });
const destinos = await pagina.locator('nav.lateral a').allInnerTexts();
ok('el vendedor ve seis destinos', destinos.length === 6, destinos.join(', '));
ok('⛔ sin enlace a Administracion', !destinos.some((d) => /Administraci/.test(d)));

await pagina.goto(`${BASE}/#/administracion`, { waitUntil: 'networkidle' });
await pagina.waitForTimeout(300);
const rechazo = await pagina.locator('[role="alert"]').innerText();
ok('⛔ URL escrita a mano: mensaje claro, no pantalla en blanco', /no corresponde a tu rol/i.test(rechazo), rechazo);
ok('⛔ sin redireccion silenciosa: el hash se conserva', new URL(pagina.url()).hash === '#/administracion', pagina.url());
ok('ofrece la vuelta a Inicio', (await pagina.locator('a[href="#/inicio"]').count()) > 0);

await pagina.goto(`${BASE}/#/no-existe`, { waitUntil: 'networkidle' });
await pagina.waitForTimeout(200);
ok('una ruta inexistente se informa', /no existe/i.test(await pagina.locator('[role="alert"]').innerText()));
await medirAnchos('Cascara');

console.log('\nGuardia de rol — administrador (mismo login)');
await pagina.goto(`${BASE}/#/inicio`, { waitUntil: 'networkidle' });
await pagina.click('button.btn-texto');
await pagina.waitForSelector('#ingreso-usuario', { timeout: 15_000 });
await pagina.fill('#ingreso-usuario', 'administracion');
await pagina.fill('#ingreso-clave', 'ejemplo-administracion');
await pagina.press('#ingreso-clave', 'Enter');
await pagina.waitForSelector('nav.lateral', { timeout: 15_000 });
const destinosAdmin = await pagina.locator('nav.lateral a').allInnerTexts();
ok('el administrador ve siete destinos', destinosAdmin.length === 7, destinosAdmin.join(', '));
await pagina.goto(`${BASE}/#/administracion`, { waitUntil: 'networkidle' });
await pagina.waitForTimeout(300);
ok('el administrador si entra a Administracion', !/no corresponde a tu rol/i.test(await pagina.locator('[role="alert"]').innerText()));

console.log('\nConsola');
ok('sin excepciones de JavaScript', excepciones.length === 0, excepciones.slice(0, 3).join(' | '));
if (recursos.length) {
  console.log('  · recursos que el entorno no pudo bajar (no son codigo de la app):');
  for (const r of [...new Set(recursos)]) console.log(`      ${r}`);
}

await navegador.close();
if (fallos) { console.error(`\nFALLA — ${fallos} comprobacion(es) en navegador real.`); process.exit(1); }
console.log('\n✓ navegador real: guardia, cinco anchos, foco y area tactil en verde');
