/**
 * Vista 01 — Inicio.   Ruta: #/inicio   Roles: vendedor + administrador
 *
 * ⛔ DUEÑO: Sesión 2. Ninguna otra sesión edita esta carpeta.
 *
 * EL TABLERO. Pedido del CEO el 25-09-2026, y pensado para el celular, que es
 * donde los vendedores lo van a mirar:
 *
 *   · CUATRO CIFRAS, dos arriba y dos abajo, en el orden en que él las nombró
 *   · UN CÍRCULO con las investigaciones de la semana — la zanahoria
 *   · UN acceso a la página de búsqueda
 *   · próximos seguimientos, con el acceso a Agenda al pie
 *
 * ⛔ PROHIBIDO acá: gráficos decorativos, embudos de conversión, tasas de
 *    cierre, mezcla de productos. Cuatro cifras, un círculo, un botón y una
 *    lista. El círculo NO es un gráfico decorativo: es una sola cifra — cuántas
 *    investigaciones van de las que se piden — dibujada de la forma en que se
 *    entiende de un vistazo.
 *
 * ⛔ LO QUE NO SE HACE ACÁ: mentir. Con la cuenta vacía el tablero muestra
 *    números de ejemplo, porque el CEO los pidió para poder ver el diseño; pero
 *    los muestra CON UN CARTEL que dice que son de ejemplo. Un vendedor que
 *    entra y ve Gs. 186.400.000 como si fueran suyos deja de creerle al
 *    sistema el primer día, y no lo recupera más.
 *
 * Obligatorio: los cuatro estados — cargando, vacío, error con reintento, con
 * datos. Y los cinco anchos: 360, 390, 768, 1024 y 1440 px, sin scroll
 * horizontal de página. ⛔ overflow-x: hidden no es una solución.
 *
 * MASTER_SPEC.md §2.1 · DESIGN_SYSTEM.md §4 · QA_CHECKLIST.md §2
 */

import type {
  Dinero, MarcadorVisitas, ProximoSeguimiento, ResumenAgenda, ResumenInicio,
  TotalesPorMoneda,
} from '@labia/compartido';
import { crearIconoEnvuelto } from '@labia/ui/iconos';
import type { ContextoVista, Vista } from '../../nucleo/contrato-vista';
import { esqueletoCifra, esqueletoTarjeta, montarBloqueAsincrono } from '../../nucleo/estados';
import { formatearDinero, formatearFechaHora } from '../../nucleo/formato';
import './vista.css';

/** La única ruta que sale de esta pantalla hacia el motor. */
const RUTA_BUSCAR = '#/planificar';

type ClaveCifra = 'ventasAcumuladas' | 'ventasEnSetup' | 'mensualidadesCobradas' | 'mensualidadesACobrar';

interface DefinicionCifra {
  readonly clave: ClaveCifra;
  readonly etiqueta: string;
  /** La cifra de arriba a la izquierda es el total; las otras tres la componen. */
  readonly principal?: boolean;
}

/**
 * Las cuatro, con el texto exacto que pidió el CEO.
 *
 * ⛔ Las tres últimas SUMAN la primera. Por eso la primera se dibuja más
 *    grande y ocupa el ancho entero: es el total, no una cifra más.
 */
const CIFRAS: ReadonlyArray<DefinicionCifra> = [
  { clave: 'ventasAcumuladas', etiqueta: 'Ventas acumuladas a hoy', principal: true },
  { clave: 'ventasEnSetup', etiqueta: 'Ventas en setup al día de hoy' },
  { clave: 'mensualidadesCobradas', etiqueta: 'Mensualidades cobradas hasta hoy' },
  { clave: 'mensualidadesACobrar', etiqueta: 'Mensualidades a cobrar' },
];

/**
 * Números de ejemplo, en guaraníes, para una cuenta sin ventas cargadas.
 *
 * ⛔ Esto NO son datos de demostración escondidos: sólo se dibujan cuando la
 *    cuenta está vacía y SIEMPRE con el cartel de "ejemplo" encima. En cuanto
 *    entra la primera venta real, desaparecen para siempre.
 *
 * ⛔ Suman: 62.000.000 + 98.700.000 + 25.700.000 = 186.400.000. Un tablero de
 *    ejemplo con cuentas que no cierran enseña a no mirar el tablero.
 */
const EJEMPLO: Readonly<Record<ClaveCifra, TotalesPorMoneda>> = {
  ventasAcumuladas: [{ moneda: 'PYG', monto: 186_400_000 }],
  ventasEnSetup: [{ moneda: 'PYG', monto: 62_000_000 }],
  mensualidadesCobradas: [{ moneda: 'PYG', monto: 98_700_000 }],
  mensualidadesACobrar: [{ moneda: 'PYG', monto: 25_700_000 }],
};

const VISITAS_DE_EJEMPLO = 4;

interface DatosSeguimientos {
  readonly seguimientos: ReadonlyArray<ProximoSeguimiento>;
  readonly agenda: ResumenAgenda;
}

function elemento<K extends keyof HTMLElementTagNameMap>(
  etiqueta: K, clase: string, texto?: string,
): HTMLElementTagNameMap[K] {
  const nodo = document.createElement(etiqueta);
  nodo.className = clase;
  if (texto !== undefined) nodo.textContent = texto;
  return nodo;
}

/** Una cifra del tablero: rótulo arriba, número grande abajo. */
function tarjetaCifra(definicion: DefinicionCifra, importes: TotalesPorMoneda): HTMLElement {
  const tarjeta = elemento('div', definicion.principal ? 'tablero-cifra tablero-cifra--total' : 'tablero-cifra');
  tarjeta.appendChild(elemento('span', 'tablero-cifra-etiqueta', definicion.etiqueta));

  const valor = elemento('span', 'tablero-cifra-valor');
  /** ⛔ Una línea por moneda: nunca se suman ni se truncan entre sí. */
  const lineas: ReadonlyArray<Dinero> = importes.length > 0 ? importes : [{ moneda: 'PYG', monto: 0 }];
  for (const importe of lineas) {
    valor.appendChild(elemento('span', 'tablero-cifra-linea', formatearDinero(importe)));
  }
  tarjeta.appendChild(valor);
  return tarjeta;
}

const RADIO = 52;
const PERIMETRO = 2 * Math.PI * RADIO;

/**
 * El círculo de visitas.
 *
 * Es un anillo: un arco gris de fondo y encima el arco cian recortado con
 * `stroke-dasharray`, que es la forma barata de dibujar un porcentaje sin
 * traer una biblioteca de gráficos entera para un solo número.
 */
function circuloDeVisitas(visitas: MarcadorVisitas, hechasMostradas: number): HTMLElement {
  const objetivo = Math.max(1, visitas.objetivo);
  const porcentaje = Math.min(100, Math.round((hechasMostradas / objetivo) * 100));
  const completo = hechasMostradas >= objetivo;

  const bloque = elemento('div', completo ? 'tablero-meta tablero-meta--completa' : 'tablero-meta');

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 128 128');
  svg.setAttribute('class', 'tablero-anillo');
  svg.setAttribute('role', 'img');
  svg.setAttribute(
    'aria-label',
    `${hechasMostradas} de ${objetivo} investigaciones de la semana — ${porcentaje} por ciento`,
  );

  const fondo = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  fondo.setAttribute('cx', '64');
  fondo.setAttribute('cy', '64');
  fondo.setAttribute('r', String(RADIO));
  fondo.setAttribute('class', 'tablero-anillo-fondo');
  svg.appendChild(fondo);

  const arco = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  arco.setAttribute('cx', '64');
  arco.setAttribute('cy', '64');
  arco.setAttribute('r', String(RADIO));
  arco.setAttribute('class', 'tablero-anillo-arco');
  arco.setAttribute('stroke-dasharray', `${(PERIMETRO * porcentaje) / 100} ${PERIMETRO}`);
  /* Arranca arriba y avanza como el reloj: el sentido en que la gente lee un
     progreso. Sin esto empezaría a las tres. */
  arco.setAttribute('transform', 'rotate(-90 64 64)');
  svg.appendChild(arco);

  const anillo = elemento('div', 'tablero-anillo-caja');
  anillo.appendChild(svg);
  const centro = elemento('div', 'tablero-anillo-centro');
  centro.appendChild(elemento('span', 'tablero-anillo-numero', String(hechasMostradas)));
  centro.appendChild(elemento('span', 'tablero-anillo-de', `de ${objetivo}`));
  anillo.appendChild(centro);

  const texto = elemento('div', 'tablero-meta-texto');
  texto.appendChild(elemento('span', 'tablero-meta-titulo', 'Investigaciones de esta semana'));
  texto.appendChild(elemento(
    'span',
    'tablero-meta-detalle',
    completo
      ? '¡Semana completa! Todo lo que hagas de acá en más suma de más.'
      : `Te faltan ${objetivo - hechasMostradas} para llegar a la semana completa.`,
  ));
  bloque.append(anillo, texto);
  return bloque;
}

/** El acceso a la página de búsqueda: una sola puerta, con la lupa. */
function accesoABuscar(): HTMLElement {
  const enlace = document.createElement('a');
  enlace.className = 'tablero-buscar';
  enlace.href = RUTA_BUSCAR;
  enlace.appendChild(crearIconoEnvuelto('buscar', 'md'));
  const texto = elemento('span', 'tablero-buscar-texto');
  texto.appendChild(elemento('span', 'tablero-buscar-titulo', 'Buscar a quién visitar'));
  texto.appendChild(elemento('span', 'tablero-buscar-ejemplo', 'Un cliente que conocés, o un rubro entero'));
  enlace.appendChild(texto);
  return enlace;
}

function renderTablero(datos: ResumenInicio, contenedor: HTMLElement): void {
  const deEjemplo = datos.sinDatosTodavia;

  if (deEjemplo) {
    const aviso = elemento('p', 'tablero-aviso-ejemplo');
    aviso.appendChild(elemento('strong', 'tablero-aviso-fuerte', 'Números de ejemplo.'));
    aviso.appendChild(document.createTextNode(
      ' Todavía no hay ventas cargadas en tu cuenta. Apenas se registre la primera, acá vas a ver la tuya.',
    ));
    contenedor.appendChild(aviso);
  }

  const rejilla = elemento('div', 'tablero-rejilla');
  for (const definicion of CIFRAS) {
    rejilla.appendChild(tarjetaCifra(definicion, deEjemplo ? EJEMPLO[definicion.clave] : datos[definicion.clave]));
  }
  contenedor.appendChild(rejilla);

  contenedor.appendChild(circuloDeVisitas(
    datos.visitas,
    deEjemplo ? VISITAS_DE_EJEMPLO : datos.visitas.hechas,
  ));
  contenedor.appendChild(accesoABuscar());
}

function renderSeguimientos(datos: DatosSeguimientos, contenedor: HTMLElement): void {
  const lista = document.createElement('div');
  lista.className = 'lista';

  for (const seguimiento of datos.seguimientos) {
    const fila = document.createElement('a');
    fila.className = 'lista-fila';
    fila.href = `#/clientes/${seguimiento.clienteId}`;

    const cuerpo = document.createElement('span');
    cuerpo.className = 'lista-fila-cuerpo';

    const titulo = document.createElement('span');
    titulo.className = 'lista-fila-titulo';
    titulo.textContent = seguimiento.nombreCliente;
    cuerpo.appendChild(titulo);

    const detalle = document.createElement('span');
    detalle.className = 'lista-fila-detalle';
    detalle.textContent = seguimiento.titulo;
    cuerpo.appendChild(detalle);

    fila.appendChild(cuerpo);

    const meta = document.createElement('span');
    meta.className = seguimiento.vencido ? 'lista-fila-meta lista-fila-meta--atrasado' : 'lista-fila-meta';
    meta.textContent = seguimiento.venceEn
      ? (seguimiento.vencido ? 'Atrasado — ' : '') + formatearFechaHora(seguimiento.venceEn)
      : 'Sin fecha';
    fila.appendChild(meta);

    lista.appendChild(fila);
  }

  contenedor.appendChild(lista);

  const pie = document.createElement('div');
  pie.className = 'inicio-agenda-acceso';

  const contadores = document.createElement('div');
  contadores.className = 'inicio-agenda-contadores';

  const pendientes = document.createElement('span');
  pendientes.className = 'inicio-agenda-contador';
  const pendientesFuerte = document.createElement('strong');
  pendientesFuerte.textContent = String(datos.agenda.pendientesHoy);
  pendientes.appendChild(pendientesFuerte);
  pendientes.appendChild(document.createTextNode(' pendientes de hoy'));
  contadores.appendChild(pendientes);

  const atrasados = document.createElement('span');
  atrasados.className = 'inicio-agenda-contador inicio-agenda-contador--atrasados';
  const atrasadosFuerte = document.createElement('strong');
  atrasadosFuerte.textContent = String(datos.agenda.atrasados);
  atrasados.appendChild(atrasadosFuerte);
  atrasados.appendChild(document.createTextNode(' atrasados'));
  contadores.appendChild(atrasados);

  pie.appendChild(contadores);

  const acceso = document.createElement('a');
  acceso.className = 'btn-borde btn';
  acceso.href = '#/agenda';
  acceso.textContent = 'Ir a Agenda';
  pie.appendChild(acceso);

  contenedor.appendChild(pie);
}

/** Convención del núcleo (Sesión 1, `nucleo/contrato-vista.ts`): `crearVista(): Vista`. */
export function crearVista(): Vista {
  let raiz: HTMLElement | null = null;

  function montar(contexto: ContextoVista): void {
    raiz = contexto.raiz;
    contexto.raiz.replaceChildren();

    /* ⛔ El título y el chip "Datos de ejemplo" los pone la cáscara, una sola
       vez, en el encabezado fijo. Antes los escribía también esta vista y se
       veían duplicados. Ver nucleo/disposicion.ts. */

    const seccionTablero = document.createElement('section');
    seccionTablero.className = 'inicio-seccion';
    seccionTablero.setAttribute('aria-label', 'Tu tablero');
    contexto.raiz.appendChild(seccionTablero);

    const seccionSeguimientos = document.createElement('section');
    seccionSeguimientos.className = 'inicio-seccion tarjeta';
    seccionSeguimientos.setAttribute('aria-label', 'Próximos seguimientos');
    contexto.raiz.appendChild(seccionSeguimientos);

    montarBloqueAsincrono<ResumenInicio>({
      contenedor: seccionTablero,
      etiqueta: 'tu tablero',
      senal: contexto.senal,
      cargar: () => contexto.datos.resumenInicio(),
      renderCargando: () => CIFRAS.map(() => esqueletoCifra()),
      renderConDatos: (datos, contenedor) => renderTablero(datos, contenedor),
    });

    montarBloqueAsincrono<DatosSeguimientos>({
      contenedor: seccionSeguimientos,
      etiqueta: 'próximos seguimientos',
      senal: contexto.senal,
      cargar: async () => {
        const [seguimientos, agenda] = await Promise.all([
          contexto.datos.proximosSeguimientos(5),
          contexto.datos.resumenAgenda(),
        ]);
        if (!seguimientos.ok) return seguimientos;
        if (!agenda.ok) return agenda;
        return { ok: true, datos: { seguimientos: seguimientos.datos, agenda: agenda.datos } };
      },
      renderCargando: () => [esqueletoTarjeta()],
      detectarVacio: (datos) =>
        datos.seguimientos.length === 0
          ? {
              titulo: 'Todavía no tenés seguimientos',
              mensaje: 'Arrancá por alguien que conocés: investigá un cliente, o explorá un rubro entero.',
              accionTexto: 'Buscar a quién visitar',
              accionHref: RUTA_BUSCAR,
            }
          : null,
      renderConDatos: (datos, contenedor) => renderSeguimientos(datos, contenedor),
    });
  }

  function desmontar(): void {
    raiz?.replaceChildren();
    raiz = null;
  }

  return { montar, desmontar };
}
