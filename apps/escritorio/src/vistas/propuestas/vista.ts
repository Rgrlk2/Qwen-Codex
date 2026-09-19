/**
 * Vista 04 — Propuestas.   Ruta: #/propuestas   Roles: vendedor + administrador
 *
 * ⛔ DUEÑO: Sesión 5. Ninguna otra sesión edita esta carpeta.
 *
 * DOS COSAS DISTINTAS, que nunca se mezclan:
 *
 * A) PRESENTACIÓN para dejar al cliente — se genera PRIMERO.
 *    Personalizada, visual, compartible. ⛔ SIN precio definitivo.
 *    ⛔ NO requiere aprobación.
 *
 * B) COTIZACIÓN — se prepara DESPUÉS. El vendedor propone únicamente el setup
 *    especial y la mensualidad especial; todo lo demás —precios de lista,
 *    ahorros, las cuatro alternativas, los totales y los logos— sale del
 *    catálogo y del cálculo del servidor.
 *
 * EL CIRCUITO, SIN DESVÍOS:
 *   borrador del vendedor → firma del vendedor → revisión del administrador
 *   → aprobación o corrección → firma del CEO → PDF definitivo → enlace para
 *   el cliente → respuesta del cliente → constancia → avisos
 *
 * ⛔ NINGÚN VENDEDOR PUEDE ENVIAR UNA COTIZACIÓN FINAL SIN APROBACIÓN.
 *    `emitirPdfDefinitivo` y `enviarAlCliente` devuelven `requiere_aprobacion`
 *    sobre una cotización que no está `aprobada`, y esta vista muestra ese
 *    mensaje tal cual: no hay botón, URL ni llamada que lo evite.
 * ⛔ El PDF definitivo se emite DESPUÉS de aprobar, nunca antes.
 * ⛔ La aprobación y la firma del CEO se implementan en Administración (S6),
 *    no acá: esta vista no tiene ningún botón de "aprobar".
 *
 * Los cuatro estados — cargando, vacío, error con reintento, con datos — y
 * los cinco anchos (360, 390, 768, 1024 y 1440 px, sin scroll horizontal de
 * página) se resuelven localmente en `estado-async.ts` y `estilos.css`,
 * porque `nucleo/estados.ts` y `packages/ui/src/base.css` (Sesión 2) todavía
 * no implementan nada: esta vista no espera a nadie.
 *
 * MASTER_SPEC.md · USER_FLOWS.md · API_CONTRACTS.md · DESIGN_SYSTEM.md · QA_CHECKLIST.md
 */

import '@labia/ui/tokens.css';
import './estilos.css';
import type { ContextoVista, Vista } from '../../nucleo/contrato-vista';
import { crear, vaciar } from './dom';
import { montarPresentaciones } from './presentaciones';
import { montarCotizaciones } from './cotizaciones';

type Pestana = 'presentaciones' | 'cotizaciones';

const PESTANAS: ReadonlyArray<{ readonly id: Pestana; readonly etiqueta: string }> = [
  { id: 'presentaciones', etiqueta: 'Presentaciones' },
  { id: 'cotizaciones', etiqueta: 'Cotizaciones' },
];

function crearVistaPropuestas(): Vista {
  let raizActual: HTMLElement | null = null;
  let pestanaActiva: Pestana = 'presentaciones';

  function pintar(contexto: ContextoVista): void {
    if (!raizActual) return;
    vaciar(raizActual);

    const contenedor = crear('div', { clase: 'propuestas-vista' });

    if (contexto.datosDeEjemplo) {
      contenedor.append(crear('p', { clase: 'propuestas-chip-ejemplo', texto: 'Datos de ejemplo' }));
    }

    contenedor.append(crear('h1', { texto: 'Propuestas' }));
    contenedor.append(crear('p', {
      clase: 'propuestas-explicacion',
      texto: 'Primero la presentación, para que el cliente conozca la solución. Después, si avanza, la cotización — que siempre pasa por aprobación antes de llegar al cliente.',
    }));

    const barraPestanas = crear('div', { clase: 'propuestas-pestanas', atributos: { role: 'tablist', 'aria-label': 'Propuestas' } });
    let panelActual = crear('div', { clase: 'propuestas-panel' });

    function pintarPanel(): void {
      const nuevoPanel = crear('div', { clase: 'propuestas-panel' });
      panelActual.replaceWith(nuevoPanel);
      panelActual = nuevoPanel;
      if (pestanaActiva === 'presentaciones') montarPresentaciones(panelActual, contexto);
      else montarCotizaciones(panelActual, contexto);
    }

    for (const pestana of PESTANAS) {
      const boton = crear('button', {
        clase: `propuestas-pestana${pestana.id === pestanaActiva ? ' propuestas-pestana--activa' : ''}`,
        texto: pestana.etiqueta,
        atributos: { role: 'tab', 'aria-selected': String(pestana.id === pestanaActiva), type: 'button' },
      });
      boton.addEventListener('click', () => {
        if (pestanaActiva === pestana.id) return;
        pestanaActiva = pestana.id;
        for (const hermano of Array.from(barraPestanas.children)) {
          hermano.classList.toggle('propuestas-pestana--activa', hermano === boton);
          hermano.setAttribute('aria-selected', String(hermano === boton));
        }
        pintarPanel();
      });
      barraPestanas.append(boton);
    }

    contenedor.append(barraPestanas, panelActual);
    raizActual.append(contenedor);
    pintarPanel();
  }

  return {
    montar(contexto: ContextoVista): void {
      raizActual = contexto.raiz;
      pestanaActiva = 'presentaciones';
      pintar(contexto);
    },
    desmontar(): void {
      if (raizActual) vaciar(raizActual);
      raizActual = null;
    },
  };
}

/**
 * ⛔ El nucleo monta una vista con `crearVista()` (contrato-vista.ts →
 *    `esModuloVista`). Sin esta exportacion la seccion aparece "en
 *    construccion" aunque el codigo este entero: `export default` no alcanza.
 */
export function crearVista(): Vista {
  return crearVistaPropuestas();
}

const vistaPropuestas: Vista = crearVistaPropuestas();
export default vistaPropuestas;

/**
 * La vista pública del cliente (enlace de respuesta, sin sesión). El punto de
 * entrada que decide cuándo mostrarla —detectar el token en la URL antes del
 * ruteo autenticado— es de `main.ts` (Sesión 1); acá sólo vive el montaje.
 */
export { montarPresentacionPublica, montarCotizacionPublica } from './publico';
