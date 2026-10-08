/**
 * Vista 02 — Planificar.   Ruta: #/planificar   Roles: vendedor + administrador
 *
 * ⛔ DUEÑO: Sesión 3. Ninguna otra sesión edita esta carpeta.
 *
 * EL MOTOR COMERCIAL. Dos entradas, una misma salida.
 *
 * Entradas:  a) empresa o profesional conocido   b) rubro escrito libremente
 *
 * Salida:
 *   1. cómo funciona ese negocio (perfil operativo inferido)
 *   2. dolores probables, cada uno COMO HIPÓTESIS y con su motivo
 *   3. los 13 productos ordenados del 1.º al 13.º, top 10 como lista de trabajo
 *   4. producto 1, 2 y 3 destacados
 *   5. combos sugeridos con su argumento unificado
 *   6. encaje: directo · cercano · adaptable · no recomendado
 *   7. adaptación necesaria, en cercano y adaptable
 *   8. estrategia de entrada
 *   9. argumentos, apoyados en el copy aprobado
 *  10. preguntas de confirmación
 *
 * Incluye la ficha de los 13 productos y el formulario de sugerencia.
 *
 * ⛔ Acepta CUALQUIER rubro escrito. Nunca responde "rubro no encontrado":
 *    crea el término como pendiente_de_revision y sigue funcionando.
 * ⛔ No se limita al mapeo literal de "Dónde tiene más sentido": ésa fue la semilla.
 * ⛔ Nunca propone un producto fuera de los 13. Nunca inventa un precio.
 * ⛔ No se edita una sola letra del copy aprobado.
 *
 * Obligatorio: los cuatro estados — cargando, vacío, error con reintento, con
 * datos. Y los cinco anchos: 360, 390, 768, 1024 y 1440 px, sin scroll
 * horizontal de página. ⛔ overflow-x: hidden no es una solución.
 *
 * MASTER_SPEC.md · USER_FLOWS.md · API_CONTRACTS.md · DESIGN_SYSTEM.md · QA_CHECKLIST.md
 */

import './estilos.css';
import type { ContextoVista, Vista } from '../../nucleo/contrato-vista';
import { montarEntrada } from './entrada';
import { montarProductos } from './productos';

type SeccionPlanificar = 'motor' | 'productos';

function crearPestanaPrincipal(texto: string, seleccionada: boolean): HTMLButtonElement {
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.className = 'pestana';
  boton.setAttribute('role', 'tab');
  boton.setAttribute('aria-selected', String(seleccionada));
  boton.textContent = texto;
  return boton;
}

/**
 * ⛔ Convención única entre las seis sesiones (apps/escritorio/src/nucleo/
 *    contrato-vista.ts, `ModuloVista`): el módulo exporta `crearVista(): Vista`.
 *    El núcleo la llama sin argumentos y monta lo que devuelve.
 */
export function crearVista(): Vista {
  return {
    montar,
    desmontar,
  };
}

function montar(contexto: ContextoVista): void {
  contexto.raiz.replaceChildren();

  const contenedor = document.createElement('div');
  contenedor.className = 'vista planificar';

  /* ⛔ El título y el chip "Datos de ejemplo" los pone la cáscara, en su
     encabezado fijo. Esta vista traía un `header.encabezado` propio: con el
     de la cáscara quedaban dos, los dos pegajosos, uno encima del otro.
     Ver nucleo/disposicion.ts. */

  const introduccion = document.createElement('p');
  introduccion.className = 'texto-2';
  introduccion.textContent = 'El motor comercial: qué le vendo a este negocio y por qué.';
  contenedor.appendChild(introduccion);

  const pestanas = document.createElement('div');
  pestanas.className = 'pestanas';
  pestanas.setAttribute('role', 'tablist');
  pestanas.setAttribute('aria-label', 'Secciones de Planificar');
  const tabMotor = crearPestanaPrincipal('El motor comercial', true);
  const tabProductos = crearPestanaPrincipal('Los 13 productos', false);
  pestanas.append(tabMotor, tabProductos);
  contenedor.appendChild(pestanas);

  const panel = document.createElement('div');
  panel.setAttribute('role', 'tabpanel');
  contenedor.appendChild(panel);

  contexto.raiz.appendChild(contenedor);

  function mostrar(seccion: SeccionPlanificar): void {
    tabMotor.setAttribute('aria-selected', String(seccion === 'motor'));
    tabProductos.setAttribute('aria-selected', String(seccion === 'productos'));
    panel.replaceChildren();
    if (seccion === 'motor') {
      montarEntrada(contexto, panel);
    } else {
      montarProductos({ contexto, contenedor: panel });
    }
  }

  tabMotor.addEventListener('click', () => mostrar('motor'));
  tabProductos.addEventListener('click', () => mostrar('productos'));
  // Navegación con flechas entre pestañas (docs/DESIGN_SYSTEM.md §5, .pestanas).
  pestanas.addEventListener('keydown', (evento) => {
    if (evento.key !== 'ArrowRight' && evento.key !== 'ArrowLeft') return;
    evento.preventDefault();
    // Sólo hay dos pestañas: "siguiente" y "anterior" son la misma, la otra.
    const otra = document.activeElement === tabMotor ? tabProductos : tabMotor;
    otra.focus();
  });

  mostrar('motor');
}

function desmontar(): void {
  // Las tareas en vuelo (investigar, recalcular, cargar el portafolio)
  // consultan `contexto.senal.aborted` antes de tocar el DOM: no hay
  // escuchas globales, temporizadores ni grabaciones que liberar acá.
}
