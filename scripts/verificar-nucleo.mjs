/**
 * Verificaciones del NUCLEO Y LA AUTENTICACION (Sesion 1).
 * Corresponde a docs/QA_CHECKLIST.md §1, §5.1, §7.4 y §7.5.
 *
 *   npm run typecheck && node scripts/verificar-nucleo.mjs
 *
 * Prueba lo que el analisis estatico no puede probar: que la guardia rechace
 * de verdad, que el ingreso no filtre si el usuario existe, que un error HTTP
 * nunca llegue a la pantalla con jerga tecnica, y que la pantalla de ingreso
 * tenga sus estados y sus etiquetas.
 *
 * Sale con codigo 1 si alguna comprobacion falla.
 */
import { JSDOM } from 'jsdom';

import * as mockMod from '../packages/mock/src/index.ts';
import * as guardia from '../apps/escritorio/src/nucleo/guardia-rol.ts';
import * as rutas from '../apps/escritorio/src/nucleo/rutas.ts';
import * as formato from '../apps/escritorio/src/nucleo/formato.ts';
import * as http from '../apps/escritorio/src/datos/http.ts';
import * as vistaMod from '../apps/escritorio/src/vistas/ingreso/vista.ts';

/**
 * ⛔ NINGUNA CONTRASENA VIVE EN EL REPOSITORIO, tampoco en las pruebas.
 *
 * El mock no guarda claves: acepta cualquiera que no este vacia. Asi que en
 * vez de escribir una, cada corrida inventa la suya, distinta, y sólo existe
 * en memoria mientras corre la prueba. Si alguien vuelve a pegar una clave
 * literal aca, verificar-portafolio.mjs lo rechaza.
 */
const claveDePrueba = () => `prueba-${Math.random().toString(36).slice(2)}`;

/** Los usuarios salen de los datos, no de literales: no se quedan viejos. */
const CUENTAS = mockMod.CUENTAS_DE_EJEMPLO;
const VENDEDOR = CUENTAS.find((c) => c.rol === 'vendedor').usuario;
const ADMIN = CUENTAS.find((c) => c.rol === 'administrador').usuario;

let ok = 0;
const fallos = [];
let grupo = '';

function seccion(nombre) { grupo = nombre; console.log(`\n${nombre}`); }
function comprobar(descripcion, condicion, detalle) {
  if (condicion) { ok += 1; console.log(`  ✓ ${descripcion}`); return; }
  fallos.push(`${grupo} — ${descripcion}${detalle ? ` (${detalle})` : ''}`);
  console.log(`  X ${descripcion}${detalle ? ` (${detalle})` : ''}`);
}
const igual = (d, a, b) => comprobar(`${d} = ${JSON.stringify(a)}`, Object.is(a, b), `esperado ${JSON.stringify(b)}`);

// ===========================================================================
// DOM para la vista de ingreso. Ningun modulo del Escritorio toca `document`
// al evaluarse —solo dentro de sus funciones—, asi que alcanza con dejar los
// globales puestos antes de la primera llamada.
// ===========================================================================
const dom = new JSDOM('<!doctype html><html lang="es-PY"><body><div id="app"></div></body></html>', {
  url: 'https://escritorio.ejemplo/',
  pretendToBeVisual: true,
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.FormData = dom.window.FormData;
globalThis.Blob = dom.window.Blob;


// ===========================================================================
// 1. Guardia de rol — QA §1.5 y §1.6
// ===========================================================================
seccion('Guardia de rol — el ruteo');

igual('rutas declaradas', rutas.RUTAS.length, 7);
comprobar(
  'las siete rutas son las esperadas',
  ['inicio', 'planificar', 'clientes', 'agenda', 'propuestas', 'dinero', 'administracion']
    .every((r) => rutas.RUTAS.some((x) => x.ruta === r)),
);
comprobar(
  'ningun rol fuera de vendedor y administrador',
  rutas.RUTAS.every((r) => r.roles.every((rol) => rol === 'vendedor' || rol === 'administrador')),
);

igual('vendedor ve 6 destinos', guardia.rutasVisibles('vendedor').length, 6);
igual('administrador ve 7 destinos', guardia.rutasVisibles('administrador').length, 7);
comprobar(
  'administracion no aparece entre los destinos del vendedor',
  !guardia.rutasVisibles('vendedor').some((r) => r.ruta === 'administracion'),
);

const aMano = guardia.resolverAcceso('#/administracion', 'vendedor');
igual('URL escrita a mano por un vendedor', aMano.tipo, 'sin_permiso');
comprobar('el rechazo trae mensaje claro', typeof aMano.mensaje === 'string' && aMano.mensaje.length > 10);
comprobar('el rechazo trae la salida (pista)', typeof aMano.pista === 'string' && aMano.pista.length > 10);
comprobar(
  'el rechazo NO es una redireccion silenciosa a inicio',
  aMano.tipo !== 'permitida' && aMano.ruta.ruta === 'administracion',
);
igual('administrador si entra a administracion', guardia.resolverAcceso('#/administracion', 'administrador').tipo, 'permitida');
igual('sin sesion todo cae al ingreso', guardia.resolverAcceso('#/dinero', null).tipo, 'ingreso');
igual('hash vacio con sesion cae a la ruta por defecto', guardia.resolverAcceso('', 'vendedor').ruta.ruta, 'inicio');
igual('ruta inexistente se informa', guardia.resolverAcceso('#/no-existe', 'vendedor').tipo, 'desconocida');
igual('hash con parametros se recorta', guardia.rutaDesdeHash('#/agenda?dia=hoy'), 'agenda');
igual('hash con subruta se recorta', guardia.rutaDesdeHash('#/clientes/abc-1'), 'clientes');

// ===========================================================================
// 2. Guardia en la CAPA DE DATOS — QA §1.6
// ===========================================================================
seccion('Guardia de rol — la capa de datos (ocultar el enlace no protege)');

const capaVendedor = mockMod.crearCapaDatosMock({ configuracion: { latenciaMs: 0, rol: 'vendedor' } });

const METODOS_ADMIN = [
  'controlFinanciero', 'porCobrar', 'rankingVendedores', 'listarPresupuestos',
  'definirPresupuesto', 'listarParticipacionesTodas', 'verificarCierrePeriodo',
  'cerrarPeriodo', 'crearAjuste', 'resolverObservacion', 'listarTodosLosClientes',
  'lineaDeTiempoDeCualquierCliente', 'colaDeRevision', 'revisarCotizacion',
  'recalcularCotizacion', 'firmarComoCeo', 'firmasDeCotizacion', 'anulacionesDeFirma',
  'listarConstancias', 'reintentarNotificaciones', 'listarParticipaciones',
  'publicarParticipacion', 'cargarPreciosLista', 'publicarProducto',
  'listarActividadesPendientes', 'confirmarActividad', 'fusionarActividad',
  'editarTaxonomia', 'listarVendedores', 'crearVendedor', 'cambiarRol',
  'desactivarVendedor', 'reasignarCartera', 'obtenerParametros', 'actualizarParametros',
  'estadoProveedores', 'usoPorVendedor', 'listarRegistroAcceso', 'listarAperturasEnlace',
  'listarSugerencias', 'resolverSugerencia', 'agregadoSugerencias',
];
igual('metodos de administracion cubiertos', METODOS_ADMIN.length, 42);

const escapados = [];
for (const nombre of METODOS_ADMIN) {
  const metodo = capaVendedor[nombre];
  if (typeof metodo !== 'function') { escapados.push(`${nombre}: no existe`); continue; }
  const r = await metodo.call(capaVendedor, {}, undefined);
  if (r.ok || r.error.codigo !== 'sin_permiso') escapados.push(`${nombre}: ${r.ok ? 'ok' : r.error.codigo}`);
}
comprobar(
  'los 42 metodos de administracion responden sin_permiso a un vendedor',
  escapados.length === 0,
  escapados.join(', '),
);

capaVendedor.mock.fijarRol('administrador');
const conAdmin = await capaVendedor.listarRegistroAcceso({});
comprobar('con rol administrador ya no responden sin_permiso', !conAdmin.ok ? conAdmin.error.codigo !== 'sin_permiso' : true);
capaVendedor.mock.fijarRol('vendedor');

// ===========================================================================
// 3. Ingreso: un solo login, error generico, registro de accesos
// ===========================================================================
seccion('Ingreso — un solo login, error generico, registro');

const capa = mockMod.crearCapaDatosMock({ configuracion: { latenciaMs: 0, rol: 'vendedor' } });

const sinSesion = await capa.sesionActual();
comprobar('sin ingresar no hay sesion', !sinSesion.ok && sinSesion.error.codigo === 'no_autenticado');

const usuarioInexistente = await capa.ingresar('no-existe-nadie', claveDePrueba());
/**
 * Con mock no existe "clave incorrecta": no hay clave guardada. Lo que si
 * tiene que fallar es la clave VACIA, y fallar exactamente igual que un
 * usuario inexistente.
 */
const claveMala = await capa.ingresar(VENDEDOR, '   ');
comprobar('usuario inexistente falla', !usuarioInexistente.ok);
comprobar('clave vacia falla', !claveMala.ok);
comprobar(
  '⛔ el mock no guarda ninguna contrasena',
  CUENTAS.every((c) => !Object.prototype.hasOwnProperty.call(c, 'clave')),
);
comprobar(
  '⛔ toda cuenta nace obligada a cambiar la clave inicial',
  CUENTAS.every((c) => c.debeCambiarClave === true),
);
comprobar(
  '⛔ el mensaje NO revela si el usuario existe',
  !usuarioInexistente.ok && !claveMala.ok
    && usuarioInexistente.error.mensajeAmable === claveMala.error.mensajeAmable
    && usuarioInexistente.error.codigo === claveMala.error.codigo,
  !usuarioInexistente.ok && !claveMala.ok
    ? `"${usuarioInexistente.error.mensajeAmable}" vs "${claveMala.error.mensajeAmable}"` : '',
);
comprobar(
  'el mensaje no nombra al usuario tecleado',
  !usuarioInexistente.ok && !/no-existe-nadie/i.test(usuarioInexistente.error.mensajeAmable),
);

const entrada = await capa.ingresar(VENDEDOR, claveDePrueba());
comprobar('ingreso valido devuelve sesion', entrada.ok);
igual('el rol viene en la sesion', entrada.ok ? entrada.datos.rol : null, 'vendedor');
comprobar('⛔ la sesion marca datos de ejemplo', entrada.ok && entrada.datos.datosDeEjemplo === true);

const capacidades = await capa.capacidades();
comprobar('vendedor NO tiene verAdministracion', capacidades.ok && capacidades.datos.verAdministracion === false);
comprobar('vendedor NO aprueba cotizaciones', capacidades.ok && capacidades.datos.aprobarCotizaciones === false);

const capaAdmin = mockMod.crearCapaDatosMock({ configuracion: { latenciaMs: 0 } });
const entradaAdmin = await capaAdmin.ingresar(ADMIN, claveDePrueba());
igual('un solo login sirve para el administrador', entradaAdmin.ok ? entradaAdmin.datos.rol : null, 'administrador');
const capAdmin = await capaAdmin.capacidades();
comprobar('administrador SI tiene verAdministracion', capAdmin.ok && capAdmin.datos.verAdministracion === true);

const registros = await capaAdmin.listarRegistroAcceso({});
comprobar('el ingreso quedo registrado', registros.ok && registros.datos.items.some((r) => r.accion === 'ingreso'));

const capaFallos = mockMod.crearCapaDatosMock({ configuracion: { latenciaMs: 0 } });
await capaFallos.ingresar(VENDEDOR, '');
await capaFallos.ingresar(ADMIN, claveDePrueba());
const conFallidos = await capaFallos.listarRegistroAcceso({ accion: 'intento_fallido' });
comprobar('el intento fallido quedo registrado', conFallidos.ok && conFallidos.datos.items.length === 1);
comprobar(
  '⛔ el registro del intento fallido no guarda la clave tecleada',
  conFallidos.ok && !/clave|contrase/i.test(JSON.stringify(conFallidos.datos.items)),
);

const cerrada = await capa.cerrarSesion();
comprobar('cerrar sesion funciona', cerrada.ok);
comprobar('tras cerrar no hay sesion', !(await capa.sesionActual()).ok);

// ===========================================================================
// 4. Nucleo del mock: los tres escenarios de toda vista
// ===========================================================================
seccion('Nucleo del mock — con datos, vacio y error');

const palancas = mockMod.crearCapaDatosMock({ configuracion: { latenciaMs: 0 } });
await palancas.ingresar(ADMIN, claveDePrueba());

const conDatos = await palancas.listarVendedores({});
comprobar('con datos: hay cuentas de ejemplo', conDatos.ok && conDatos.datos.items.length === CUENTAS.length);

palancas.mock.configurar({ forzarVacio: true });
const vacio = await palancas.listarVendedores({});
comprobar('modo vacio: listado vacio para probar el estado vacio', vacio.ok && vacio.datos.items.length === 0);
palancas.mock.configurar({ forzarVacio: false });

palancas.mock.configurar({
  fallaForzada: { codigo: 'servicio_no_disponible', mensajeAmable: 'No pudimos conectarnos en este momento.' },
});
const forzado = await palancas.listarVendedores({});
comprobar('falla forzada: error para probar el estado de error', !forzado.ok && forzado.error.codigo === 'servicio_no_disponible');
const trasFalla = await palancas.listarVendedores({});
comprobar('la falla forzada se consume una vez: el reintento sale en verde', trasFalla.ok);

const semilla1 = mockMod.crearNucleoMock({ semilla: 7 });
const semilla2 = mockMod.crearNucleoMock({ semilla: 7 });
igual('el mock es reproducible con la misma semilla', semilla1.aleatorio(), semilla2.aleatorio());

const pagina = mockMod.crearNucleoMock({ latenciaMs: 0 }).paginar([1, 2, 3, 4, 5], undefined, 2);
comprobar('paginacion explicita: primera pagina', pagina.items.length === 2 && pagina.cursor === '2' && pagina.total === 5);

const pendiente = await palancas.resumenInicio();
comprobar(
  '⛔ un metodo aun no ensamblado devuelve error, no un exito vacio',
  !pendiente.ok && pendiente.error.codigo === 'servicio_no_disponible',
);

// ===========================================================================
// 5. Capa HTTP — la tabla de API_CONTRACTS §1, sin jerga en pantalla
// ===========================================================================
seccion('Capa HTTP — traduccion de estados y mensajes en castellano');

const TABLA = [[400, 'validacion'], [401, 'no_autenticado'], [403, 'sin_permiso'],
  [404, 'no_encontrado'], [409, 'conflicto_version'], [410, 'enlace_vencido'],
  [422, 'regla_comercial'], [429, 'limite_excedido'], [500, 'servicio_no_disponible'],
  [503, 'servicio_no_disponible']];
for (const [estado, codigo] of TABLA) igual(`estado ${estado}`, http.codigoDesdeEstado(estado), codigo);

/** `Response` global de Node (undici): jsdom no implementa fetch. */
function servidorFalso(estado, cuerpo) {
  return async () => new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), {
    status: estado, headers: { 'Content-Type': 'application/json' },
  });
}

const httpProhibido = http.crearCapaDatosHttp({ base: '/api', buscar: servidorFalso(403, { ok: false, error: { codigo: 'sin_permiso' } }) });
const rechazo = await httpProhibido.controlFinanciero('2026-09');
comprobar('403 del servidor ⇒ sin_permiso', !rechazo.ok && rechazo.error.codigo === 'sin_permiso');
comprobar('el mensaje esta en castellano', !rechazo.ok && /rol/i.test(rechazo.error.mensajeAmable));

const JERGA_PROHIBIDA = [
  'Error 500: SELECT * FROM cotizaciones WHERE id = 3 failed',
  'TypeError: undefined is not a function\n    at Objeto.metodo',
  'HTTP 503 Service Unavailable',
];
for (const crudo of JERGA_PROHIBIDA) {
  const sucio = http.crearCapaDatosHttp({ base: '/api', buscar: servidorFalso(500, { ok: false, error: { codigo: 'servicio_no_disponible', mensajeAmable: crudo } }) });
  const r = await sucio.resumenInicio();
  const texto = r.ok ? '' : `${r.error.mensajeAmable} ${r.error.pista ?? ''}`;
  comprobar(
    `⛔ jerga descartada: ${crudo.slice(0, 28)}…`,
    !r.ok && !/\b\d{3}\b|select|at |typeerror|http/i.test(texto),
    texto,
  );
}

const utilDelServidor = http.crearCapaDatosHttp({ base: '/api', buscar: servidorFalso(400, { ok: false, error: { codigo: 'validacion', mensajeAmable: 'El RUC tiene que llevar guion.', campo: 'ruc' } }) });
const validacion = await utilDelServidor.crearCliente({}, 'k1');
comprobar('un mensaje util del servidor si se muestra', !validacion.ok && validacion.error.mensajeAmable === 'El RUC tiene que llevar guion.');
comprobar('y conserva el campo afectado', !validacion.ok && validacion.error.campo === 'ruc');

const ambiguo = http.crearCapaDatosHttp({ base: '/api', buscar: servidorFalso(401, { ok: false, error: { codigo: 'credenciales_invalidas' } }) });
const login = await ambiguo.ingresar('a', 'b');
igual('401 con codigo preciso del servidor', !login.ok ? login.error.codigo : null, 'credenciales_invalidas');

const caido = http.crearCapaDatosHttp({ base: '/api', buscar: async () => { throw new Error('ECONNREFUSED 127.0.0.1:443'); } });
const sinRed = await caido.resumenInicio();
comprobar('la red caida ⇒ servicio_no_disponible', !sinRed.ok && sinRed.error.codigo === 'servicio_no_disponible');
comprobar('⛔ y sin la traza de red en pantalla', !sinRed.ok && !/ECONN|127\.0\.0\.1/i.test(sinRed.error.mensajeAmable));

const agotado = http.crearCapaDatosHttp({ base: '/api', buscar: async () => { const e = new Error('tardo'); e.name = 'TimeoutError'; throw e; } });
const tarde = await agotado.investigarObjetivo({ tipo: 'rubro', rubro: 'motel' });
igual('tiempo agotado', !tarde.ok ? tarde.error.codigo : null, 'tiempo_agotado');

let urlLlamada = '';
const espia = http.crearCapaDatosHttp({
  base: '/api',
  buscar: async (url) => { urlLlamada = String(url); return new Response(JSON.stringify({ ok: true, datos: null }), { status: 200 }); },
});
await espia.investigarObjetivo({ tipo: 'empresa', ruc: '80012345-6' });
comprobar('la investigacion se pide al servidor propio', urlLlamada === '/api/motor/investigarObjetivo', urlLlamada);
comprobar('⛔ nunca a un proveedor externo', !/^https?:\/\//i.test(urlLlamada));

// ===========================================================================
// 6. Formato es-PY — QA §5.1
// ===========================================================================
seccion('Formato es-PY — moneda siempre explicita');

igual('guaranies', formato.formatearDinero({ monto: 1250000, moneda: 'PYG' }), 'Gs. 1.250.000');
igual('dolares (centavos)', formato.formatearDinero({ monto: 129900, moneda: 'USD' }), 'USD 1.299,00');
comprobar(
  '⛔ ningun importe queda sin moneda',
  ['PYG', 'USD'].every((m) => /^(Gs\.|USD) /.test(formato.formatearDinero({ monto: 1, moneda: m }))),
);
const porMoneda = formato.formatearTotales([{ monto: 1000, moneda: 'PYG' }, { monto: 500, moneda: 'USD' }]);
comprobar('totales: una linea por moneda, sin consolidar', porMoneda.length === 2 && porMoneda[0].startsWith('Gs.') && porMoneda[1].startsWith('USD'));
comprobar(
  '⛔ no se exporta ninguna funcion que consolide monedas',
  !Object.keys(formato).some((n) => /^(formatearTotal|sumarTotales|consolidar|totalGeneral)$/.test(n)),
);
igual('rango como rango, sin promediar', formato.formatearRango({ monto: 100, moneda: 'PYG' }, { monto: 300, moneda: 'PYG' }), 'Gs. 100 a Gs. 300');
let mezclo = false;
try { formato.formatearRango({ monto: 1, moneda: 'PYG' }, { monto: 1, moneda: 'USD' }); } catch { mezclo = true; }
comprobar('⛔ un rango no puede mezclar monedas', mezclo);
igual('fecha en zona de Asuncion', formato.formatearFecha('2026-09-15T23:30:00-03:00'), '15/09/2026');
igual('la zona horaria es America/Asuncion', formato.ZONA, 'America/Asuncion');
igual('dia de calendario en Asuncion', formato.diaEnAsuncion(new Date('2026-09-16T02:00:00Z')), '2026-09-15');
igual('periodo en palabras', formato.formatearPeriodo('2026-09'), 'septiembre de 2026');
const importe = formato.elementoImporte({ monto: 5000, moneda: 'PYG' }, document);
igual('el importe sale con tabular-nums', importe.style.fontVariantNumeric, 'tabular-nums');

// ===========================================================================
// 7. La pantalla de ingreso — estados y accesibilidad (QA §7.4, §7.5)
// ===========================================================================
seccion('Pantalla de ingreso — cuatro estados y accesibilidad');

const capaVista = mockMod.crearCapaDatosMock({ configuracion: { latenciaMs: 0 } });
const contenedor = document.getElementById('app');
let sesionRecibida = null;
const vista = vistaMod.crearVista({ alIngresar: (s) => { sesionRecibida = s; } });
const control = new dom.window.AbortController();

const montaje = vista.montar({ datos: capaVista, raiz: contenedor, rol: 'vendedor', senal: control.signal, datosDeEjemplo: true });
comprobar('el estado cargando se dibuja antes de pedir nada', contenedor.querySelector('.ingreso-hueso') !== null);
await montaje;

comprobar('hay un solo h1', contenedor.querySelectorAll('h1').length === 1);
const formulario = contenedor.querySelector('form');
comprobar('hay un formulario real', formulario !== null);
const campoUsuario = contenedor.querySelector('#ingreso-usuario');
const campoClave = contenedor.querySelector('#ingreso-clave');
comprobar('campo de usuario', campoUsuario !== null && campoUsuario.type === 'text');
comprobar('campo de contrasena enmascarado', campoClave !== null && campoClave.type === 'password');
comprobar(
  'etiquetas reales asociadas por for',
  [...contenedor.querySelectorAll('label')].filter((l) => l.htmlFor === 'ingreso-usuario' || l.htmlFor === 'ingreso-clave').length === 2,
);
comprobar('autocompletado correcto', campoUsuario.autocomplete === 'username' && campoClave.autocomplete === 'current-password');
const boton = contenedor.querySelector('button[type="submit"]');
comprobar('boton submit real: Enter envia', boton !== null && boton.textContent === 'Ingresar');
comprobar('⛔ ningun div con onclick haciendo de boton', contenedor.querySelectorAll('div[onclick]').length === 0);
comprobar('region de mensajes con role=alert', contenedor.querySelector('[role="alert"]') !== null);
comprobar('⛔ chip permanente "Datos de ejemplo"', /Datos de ejemplo/.test(contenedor.textContent));
comprobar('⛔ no hay una segunda pantalla de ingreso de administrador', !/administrador/i.test(contenedor.textContent));

/**
 * Estado de error: credenciales invalidas.
 * Se usa un usuario que NO existe, con una clave inventada: con mock, una
 * clave no vacia sobre una cuenta real entraria, y lo que hay que probar aca
 * es la pantalla de error.
 */
const USUARIO_INEXISTENTE = 'no-existe-nadie';
campoUsuario.value = USUARIO_INEXISTENTE;
campoClave.value = claveDePrueba();
formulario.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
await new Promise((listo) => setTimeout(listo, 10));
const textoError = contenedor.querySelector('.ingreso-error')?.textContent ?? '';
comprobar('estado de error visible', textoError.length > 0);
comprobar('⛔ el error es generico', /Usuario o contrase/i.test(textoError));
comprobar('⛔ no dice si el usuario existe', !/no existe|usuario no|no registrado|inexistente/i.test(textoError));
comprobar('el reintento queda disponible', contenedor.querySelector('button[type="submit"]').disabled === false);
comprobar('se conserva lo tecleado en usuario', contenedor.querySelector('#ingreso-usuario').value === USUARIO_INEXISTENTE);
comprobar('⛔ la contrasena NO se conserva', contenedor.querySelector('#ingreso-clave').value === '');
comprobar('los campos quedan marcados aria-invalid', contenedor.querySelector('#ingreso-usuario').getAttribute('aria-invalid') === 'true');

// Campos vacios
contenedor.querySelector('#ingreso-usuario').value = '';
contenedor.querySelector('form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
await new Promise((listo) => setTimeout(listo, 10));
comprobar('campos vacios: se pide completarlos', /Complet/i.test(contenedor.querySelector('.ingreso-error')?.textContent ?? ''));

// Ingreso valido
contenedor.querySelector('#ingreso-usuario').value = VENDEDOR;
contenedor.querySelector('#ingreso-clave').value = claveDePrueba();
contenedor.querySelector('form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
await new Promise((listo) => setTimeout(listo, 10));
comprobar('ingreso valido entrega la sesion al nucleo', sesionRecibida !== null && sesionRecibida.rol === 'vendedor');

vista.desmontar();
comprobar('desmontar limpia el contenedor', contenedor.childElementCount === 0);

// Estado de error de servicio: mensaje propio, no el generico
const capaCaida = mockMod.crearCapaDatosMock({ configuracion: { latenciaMs: 0 } });
capaCaida.mock.configurar({ fallaForzada: { codigo: 'no_autenticado', mensajeAmable: 'x' } });
const vista2 = vistaMod.crearVista({ alIngresar: () => {} });
await vista2.montar({ datos: capaCaida, raiz: contenedor, rol: 'vendedor', senal: new dom.window.AbortController().signal, datosDeEjemplo: true });
contenedor.querySelector('#ingreso-usuario').value = VENDEDOR;
contenedor.querySelector('#ingreso-clave').value = claveDePrueba();
capaCaida.mock.configurar({ fallaForzada: { codigo: 'servicio_no_disponible', mensajeAmable: 'No pudimos conectarnos en este momento.', pista: 'Proba de nuevo en unos segundos.' } });
contenedor.querySelector('form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
await new Promise((listo) => setTimeout(listo, 10));
comprobar(
  'un servicio caido se explica tal cual (no como credenciales malas)',
  /No pudimos conectarnos/.test(contenedor.querySelector('.ingreso-error')?.textContent ?? ''),
);
vista2.desmontar();

// ⛔ Un endpoint inexistente NO puede leerse como "contrasena mala": manda a la
//    gente a cambiar su clave por un problema que no es suyo.
const capaSinRuta = mockMod.crearCapaDatosMock({ configuracion: { latenciaMs: 0 } });
const vista3 = vistaMod.crearVista({ alIngresar: () => {} });
await vista3.montar({ datos: capaSinRuta, raiz: contenedor, rol: 'vendedor', senal: new dom.window.AbortController().signal, datosDeEjemplo: true });
contenedor.querySelector('#ingreso-usuario').value = VENDEDOR;
contenedor.querySelector('#ingreso-clave').value = claveDePrueba();
capaSinRuta.mock.configurar({ fallaForzada: { codigo: 'no_encontrado', mensajeAmable: 'No encontramos lo que buscabas.', pista: 'Avisa a Administracion.' } });
contenedor.querySelector('form').dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
await new Promise((listo) => setTimeout(listo, 10));
comprobar(
  '⛔ un endpoint caido no se muestra como credenciales invalidas',
  !/Usuario o contrase/i.test(contenedor.querySelector('.ingreso-error')?.textContent ?? ''),
  contenedor.querySelector('.ingreso-error')?.textContent ?? '',
);
vista3.desmontar();

// ===========================================================================
seccion('Resultado');
if (fallos.length) {
  console.error(`\nFALLA — ${fallos.length} comprobacion(es):\n`);
  for (const f of fallos) console.error('  X', f);
  process.exit(1);
}
console.log(`\n✓ ${ok}/${ok} comprobaciones del nucleo y la autenticacion`);
