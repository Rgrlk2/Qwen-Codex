/**
 * Instantaneas de las pantallas del Escritorio.
 *
 *   npm run instantaneas
 *
 * Monta cada vista con los datos de ejemplo y guarda el HTML resultante como
 * un archivo suelto, con su CSS adentro. Sirve para rediseniar las pantallas
 * en una herramienta de disenio sin tener que levantar la aplicacion.
 *
 * ⛔ Lo que sale de aca NO es la aplicacion: es una foto. Los botones no hacen
 *    nada y no hay navegacion. El aspecto es el real —el mismo CSS, el mismo
 *    marcado que arma el codigo— y eso es lo unico que tiene que ser fiel.
 *
 * ⛔ No se inventa contenido: todo sale de packages/mock. Si una pantalla sale
 *    en estado de error o vacia, es porque asi esta hoy, y hay que verlo.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

import { crearCapaDatosMock } from '@labia/mock';
import { RUTAS } from '../apps/escritorio/src/nucleo/rutas.ts';

const RAIZ = process.cwd();
const DESTINO = `${RAIZ}/disenio/pantallas`;

// ---------------------------------------------------------------------------
// El DOM. Igual que en verificar-nucleo.mjs: los modulos del Escritorio solo
// tocan `document` dentro de sus funciones, asi que alcanza con dejar los
// globales puestos antes de la primera llamada.
// ---------------------------------------------------------------------------
const dom = new JSDOM(
  '<!doctype html><html lang="es-PY"><body><div id="app"></div></body></html>',
  { url: 'https://escritorio.ejemplo/', pretendToBeVisual: true },
);
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.HTMLInputElement = dom.window.HTMLInputElement;
globalThis.FormData = dom.window.FormData;
globalThis.Blob = dom.window.Blob;
globalThis.Node = dom.window.Node;
globalThis.CustomEvent = dom.window.CustomEvent;
globalThis.requestAnimationFrame = (f) => dom.window.setTimeout(f, 0);
globalThis.cancelAnimationFrame = (h) => dom.window.clearTimeout(h);

const leer = (ruta) => { try { return readFileSync(`${RAIZ}/${ruta}`, 'utf8'); } catch { return ''; } };

/** Hojas comunes: los ocho colores, la marca y los componentes base. */
const CSS_COMUN = [
  'packages/ui/src/tokens.css',
  'packages/ui/src/marca-labia.css',
  'packages/ui/src/base.css',
].map(leer).join('\n');

/**
 * Espera a que la vista termine de pedir datos.
 *
 * El mock responde con latencia cero, pero cada `await` es un turno del bucle
 * de eventos. Vaciamos la cola varias veces en vez de dormir un rato fijo.
 */
async function asentar(vueltas = 40) {
  for (let i = 0; i < vueltas; i += 1) {
    await new Promise((listo) => dom.window.setTimeout(listo, 0));
  }
}

/**
 * Las rutas de los activos apuntan a la raiz del sitio (`/assets/...`), que no
 * existe al abrir el archivo suelto. Se reescriben relativas a esta carpeta
 * para que los logos se vean mientras el archivo siga dentro del repositorio.
 *
 * ⛔ Se reescribe la RUTA, nunca el activo: el logo es el archivo incorporado,
 *    no uno generado ni recortado.
 */
function activosRelativos(html) {
  return html.replaceAll('"/assets/', '"../../apps/escritorio/public/assets/');
}

function paginaSuelta({ titulo, ruta, cuerpo, css, nota }) {
  return `<!doctype html>
<html lang="es-PY">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titulo} — Escritorio Vendedores Lab.IA</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
${CSS_COMUN}
${css}
</style>
</head>
<body>
<!--
  Instantanea de la pantalla "${titulo}" (ruta #/${ruta}) del Escritorio
  Vendedores Lab.IA, generada por scripts/instantaneas.mjs.

  Es una FOTO: el marcado y el CSS son los reales, pero nada funciona.
  ${nota}

  Para rediseniar: cambiá el CSS y el marcado que quieras. Lo que importa es
  que cada pieza conserve su clase, porque esa clase es la que el codigo pone.
-->
${activosRelativos(cuerpo)}
</body>
</html>
`;
}

// ---------------------------------------------------------------------------
// Las pantallas
// ---------------------------------------------------------------------------

/**
 * Los modulos de vista, por ruta.
 *
 * ⛔ Escritos uno por uno, como en main.ts y por el mismo motivo: un
 *    `import()` con la ruta armada en tiempo de ejecucion no lo puede
 *    empaquetar nadie, y el archivo no aparece al correr.
 */
const MODULOS = {
  inicio: () => import('../apps/escritorio/src/vistas/inicio/vista.ts'),
  planificar: () => import('../apps/escritorio/src/vistas/planificar/vista.ts'),
  clientes: () => import('../apps/escritorio/src/vistas/clientes/vista.ts'),
  agenda: () => import('../apps/escritorio/src/vistas/agenda/vista.ts'),
  propuestas: () => import('../apps/escritorio/src/vistas/propuestas/vista.ts'),
  dinero: () => import('../apps/escritorio/src/vistas/dinero/vista.ts'),
  administracion: () => import('../apps/escritorio/src/vistas/administracion/vista.ts'),
};

/** Rutas visibles para un rol, en el orden del registro. */
const destinosDe = (rol) => RUTAS
  .filter((r) => r.roles.includes(rol))
  .map((r) => ({ ruta: r.ruta, titulo: r.titulo, enBarraInferior: r.enBarraInferior }));

async function instantaneaDeIngreso() {
  const vista = await import('../apps/escritorio/src/vistas/ingreso/vista.ts');
  const capa = crearCapaDatosMock({ configuracion: { latenciaMs: 0 } });
  const raiz = document.createElement('div');
  raiz.id = 'app';
  const control = new dom.window.AbortController();
  const v = vista.crearVista({ alIngresar: () => {} });
  await v.montar({ datos: capa, raiz, rol: 'vendedor', senal: control.signal, datosDeEjemplo: true });
  await asentar();
  return {
    titulo: 'Ingreso', ruta: 'ingreso', cuerpo: raiz.outerHTML,
    css: leer('apps/escritorio/src/vistas/ingreso/estilos.css'),
    nota: 'Es la unica pantalla sin la cascara: todavia no hay sesion.',
  };
}

async function instantaneaDeVista(entrada, rol) {
  const disposicionMod = await import('../apps/escritorio/src/nucleo/disposicion.ts');
  const vista = await MODULOS[entrada.ruta]();

  const capa = crearCapaDatosMock({ configuracion: { latenciaMs: 0, rol } });
  const raiz = document.createElement('div');
  raiz.id = 'app';

  const disposicion = disposicionMod.crearDisposicion({
    raiz, rol, datosDeEjemplo: true,
    nombreUsuario: rol === 'administrador' ? 'Rodrigo Garelik' : 'Juan Pablo Fernandez',
    destinos: destinosDe(rol),
    cerrarSesion: () => {},
  });
  disposicion.marcarRuta(entrada.ruta);

  const control = new dom.window.AbortController();
  const v = vista.crearVista();
  await v.montar({
    datos: capa, raiz: disposicion.contenido, rol,
    senal: control.signal, datosDeEjemplo: true,
  });
  await asentar();

  return {
    titulo: entrada.titulo, ruta: entrada.ruta, cuerpo: raiz.outerHTML,
    css: leer(`apps/escritorio/src/vistas/${entrada.ruta}/estilos.css`),
    nota: rol === 'administrador'
      ? 'Se monto con rol administrador: es la unica que el vendedor no ve.'
      : 'Se monto con rol vendedor, con los datos de ejemplo del mock.',
  };
}

/**
 * El taller de la ficha, que no es una ruta: vive dentro de Clientes.
 * Se saca aparte porque es la pantalla donde el vendedor arma lo que ve el
 * prospecto, y se redisenia por su cuenta.
 */
async function instantaneaDelTaller() {
  const taller = await import('../apps/escritorio/src/vistas/fichas/taller.ts');
  const capa = crearCapaDatosMock({ configuracion: { latenciaMs: 0 } });
  const raiz = document.createElement('div');
  raiz.id = 'app';
  const contenedor = document.createElement('div');
  contenedor.className = 'vista';
  raiz.appendChild(contenedor);
  const control = new dom.window.AbortController();
  await taller.montarTaller({
    datos: capa, contenedor, productoId: 'park-ia',
    clienteId: 'cliente-hotel-las-mercedes',
    nombreVendedor: 'Juan Pablo Fernandez', senal: control.signal,
  });
  await asentar();
  return {
    titulo: 'Ficha — taller', ruta: 'ficha-taller', cuerpo: raiz.outerHTML,
    css: leer('apps/escritorio/src/vistas/fichas/estilos.css'),
    nota: 'A la izquierda el vendedor arma la ficha; a la derecha ve lo que le llega al cliente.',
  };
}

// ---------------------------------------------------------------------------

mkdirSync(DESTINO, { recursive: true });

const hechas = [];
const fallidas = [];

async function guardar(fabricar, nombre) {
  try {
    const pantalla = await fabricar();
    const archivo = `${DESTINO}/${pantalla.ruta}.html`;
    writeFileSync(archivo, paginaSuelta(pantalla), 'utf8');
    const kb = (Buffer.byteLength(paginaSuelta(pantalla), 'utf8') / 1024).toFixed(0);
    hechas.push({ nombre: pantalla.titulo, archivo: `disenio/pantallas/${pantalla.ruta}.html`, kb });
    console.log(`  ✓ ${pantalla.titulo.padEnd(18)} ${kb.padStart(4)} KB`);
  } catch (error) {
    fallidas.push({ nombre, motivo: error?.message ?? String(error) });
    console.log(`  X ${nombre}: ${error?.message ?? error}`);
  }
}

console.log('\nInstantaneas de las pantallas\n');

await guardar(instantaneaDeIngreso, 'Ingreso');
for (const entrada of RUTAS) {
  const rol = entrada.roles.includes('vendedor') ? 'vendedor' : 'administrador';
  await guardar(() => instantaneaDeVista(entrada, rol), entrada.titulo);
}
await guardar(instantaneaDelTaller, 'Ficha — taller');

console.log(`\n${hechas.length} pantalla(s) en disenio/pantallas/`);
if (fallidas.length) {
  console.error(`\n${fallidas.length} no salieron:`);
  for (const f of fallidas) console.error(`  X ${f.nombre}: ${f.motivo}`);
  process.exit(1);
}
