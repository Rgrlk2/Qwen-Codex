/**
 * Vista 01 — Inicio.   Ruta: #/inicio   Roles: vendedor + administrador
 *
 * ⛔ DUEÑO: Sesión 2. Ninguna otra sesión edita esta carpeta.
 *
 * LA PLANIFICACIÓN ES EL COMIENZO. Esta pantalla muestra:
 *   · DOS ACCIONES PROTAGONISTAS, el elemento visual dominante
 *   · cuatro cifras: dinero vendido · dinero cobrado · comisión acumulada · comisión pendiente
 *   · próximos seguimientos, con el acceso a Agenda al pie
 *
 * El vendedor arranca por gente que conoce: el amigo con la repuestera, el
 * pariente con el restaurante, el médico, el abogado, la odontóloga, la
 * peluquería, el hotel, el motel. El sistema recibe ese nombre y devuelve un
 * plan; no le pide primero que cargue un CRM.
 *
 * ⛔ PROHIBIDO acá: gráficos decorativos, embudos de conversión, tasas de
 *    cierre, mezcla de productos. Cuatro cifras, una lista y dos acciones.
 * ⛔ Con la cuenta vacía, las dos acciones quedan como lo único accionable.
 *
 * Obligatorio: los cuatro estados — cargando, vacío, error con reintento, con
 * datos. Y los cinco anchos: 360, 390, 768, 1024 y 1440 px, sin scroll
 * horizontal de página. ⛔ overflow-x: hidden no es una solución.
 *
 * MASTER_SPEC.md §2.1 · DESIGN_SYSTEM.md §4 · QA_CHECKLIST.md §2
 */

import type { DefinicionAccion, ProximoSeguimiento, ResumenAgenda, ResumenInicio } from '@labia/compartido';
import { crearIconoEnvuelto, type NombreIcono } from '@labia/ui/iconos';
import type { ContextoVista, Vista } from '../../nucleo/contrato-vista';
import { esqueletoCifra, esqueletoTarjeta, montarBloqueAsincrono } from '../../nucleo/estados';
import { formatearDinero, formatearFechaHora } from '../../nucleo/formato';
import './vista.css';

/**
 * Las dos acciones protagonistas. Texto de MASTER_SPEC.md §2.1 — no es copy de
 * producto (eso vive en content/copy/): es la interfaz propia de esta vista.
 */
const ACCION_CONOCIDO: DefinicionAccion = {
  accion: 'investigar_conocido',
  titulo: 'Investigar una empresa o un profesional que conozco',
  ejemplo: '"Mi amigo tiene una repuestera", "mi odontóloga"',
  ruta: '#/planificar?entrada=conocido',
};

const ACCION_RUBRO: DefinicionAccion = {
  accion: 'explorar_rubro',
  titulo: 'Explorar oportunidades por rubro',
  ejemplo: 'Quiero ver qué le puedo vender a las peluquerías',
  ruta: '#/planificar?entrada=rubro',
};

const ACCIONES: ReadonlyArray<DefinicionAccion> = [ACCION_CONOCIDO, ACCION_RUBRO];

/** Íconos genéricos de interfaz, no una marca (docs/ASSET_SOURCES.md §1.5). */
const ICONO_ACCION: Record<string, NombreIcono> = {
  investigar_conocido: 'buscar',
  explorar_rubro: 'brujula',
};

type ClaveCifra = 'dineroVendido' | 'dineroCobrado' | 'comisionAcumulada' | 'comisionPendiente';

const ETIQUETAS_CIFRA: ReadonlyArray<{ readonly clave: ClaveCifra; readonly etiqueta: string }> = [
  { clave: 'dineroVendido', etiqueta: 'Dinero vendido' },
  { clave: 'dineroCobrado', etiqueta: 'Dinero cobrado' },
  { clave: 'comisionAcumulada', etiqueta: 'Comisión acumulada' },
  { clave: 'comisionPendiente', etiqueta: 'Comisión pendiente' },
];

interface DatosSeguimientos {
  readonly seguimientos: ReadonlyArray<ProximoSeguimiento>;
  readonly agenda: ResumenAgenda;
}

function crearAcciones(): HTMLElement {
  const seccion = document.createElement('section');
  seccion.className = 'inicio-seccion acciones-protagonistas';
  seccion.setAttribute('aria-label', 'Empezar');

  for (const accion of ACCIONES) {
    const enlace = document.createElement('a');
    enlace.className = 'accion-protagonista';
    enlace.href = accion.ruta;

    enlace.appendChild(crearIconoEnvuelto(ICONO_ACCION[accion.accion] ?? 'buscar', 'lg'));

    const titulo = document.createElement('span');
    titulo.className = 'accion-protagonista-titulo';
    titulo.textContent = accion.titulo;
    enlace.appendChild(titulo);

    const ejemplo = document.createElement('span');
    ejemplo.className = 'accion-protagonista-ejemplo';
    ejemplo.textContent = accion.ejemplo;
    enlace.appendChild(ejemplo);

    seccion.appendChild(enlace);
  }

  return seccion;
}

function renderCifras(datos: ResumenInicio, contenedor: HTMLElement): void {
  const rejilla = document.createElement('div');
  rejilla.className = 'rejilla';

  for (const { clave, etiqueta } of ETIQUETAS_CIFRA) {
    const totales = datos[clave];
    const cifra = document.createElement('div');
    cifra.className = 'cifra';

    const etiquetaEl = document.createElement('span');
    etiquetaEl.className = 'cifra-etiqueta';
    etiquetaEl.textContent = etiqueta;
    cifra.appendChild(etiquetaEl);

    const valorEl = document.createElement('span');
    if (datos.sinDatosTodavia || totales.length === 0) {
      valorEl.className = 'cifra-valor cifra-valor--vacia';
      valorEl.textContent = 'Todavía no registraste ventas';
    } else {
      valorEl.className = 'cifra-valor';
      /** ⛔ Una línea por moneda: nunca se suman ni se truncan entre sí. */
      for (const importe of totales) {
        const linea = document.createElement('span');
        linea.textContent = formatearDinero(importe);
        valorEl.appendChild(linea);
      }
    }
    cifra.appendChild(valorEl);

    rejilla.appendChild(cifra);
  }

  contenedor.appendChild(rejilla);
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

    const h1 = document.createElement('h1');
    h1.className = 'inicio-titulo encabezado-titulo';
    h1.textContent = 'Inicio';
    h1.tabIndex = -1;
    contexto.raiz.appendChild(h1);
    h1.focus();

    if (contexto.datosDeEjemplo) {
      const chip = document.createElement('span');
      chip.className = 'chip-datos-ejemplo inicio-chip-datos-ejemplo';
      chip.textContent = 'Datos de ejemplo';
      contexto.raiz.appendChild(chip);
    }

    contexto.raiz.appendChild(crearAcciones());

    const seccionCifras = document.createElement('section');
    seccionCifras.className = 'inicio-seccion';
    seccionCifras.setAttribute('aria-label', 'Tu plata');
    contexto.raiz.appendChild(seccionCifras);

    const seccionSeguimientos = document.createElement('section');
    seccionSeguimientos.className = 'inicio-seccion tarjeta';
    seccionSeguimientos.setAttribute('aria-label', 'Próximos seguimientos');
    contexto.raiz.appendChild(seccionSeguimientos);

    montarBloqueAsincrono<ResumenInicio>({
      contenedor: seccionCifras,
      etiqueta: 'tu plata',
      senal: contexto.senal,
      cargar: () => contexto.datos.resumenInicio(),
      renderCargando: () => ETIQUETAS_CIFRA.map(() => esqueletoCifra()),
      renderConDatos: (datos, contenedor) => renderCifras(datos, contenedor),
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
              mensaje: 'Arrancá por alguien que conocés: investigá una empresa o un profesional, o explorá un rubro.',
              accionTexto: 'Investigar un conocido',
              accionHref: ACCION_CONOCIDO.ruta,
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
