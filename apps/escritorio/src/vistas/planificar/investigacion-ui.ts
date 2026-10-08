/**
 * Renderiza el resultado de la investigación automática (MASTER_SPEC.md §3,
 * USER_FLOWS.md F2/F2b/F3).
 *
 * ⛔ Cada dato se muestra como verificado, inferido o no encontrado, SIEMPRE
 *    EN TEXTO (nunca sólo por color): QA_CHECKLIST §3b.6.
 * ⛔ Las fuentes que fallaron se listan igual, con su motivo (§3b.10).
 * ⛔ Con fuentes caídas, sólo se piden los campos mínimos faltantes — nunca
 *    un formulario largo (§3.6, §3b.11).
 * ⛔ El vendedor sólo confirma, corrige o agrega (§3.4): nunca completa el
 *    perfil operativo a mano.
 */

import type {
  CampoFaltante,
  ClasificacionDato,
  CorreccionDato,
  DatoInvestigado,
  FuenteInvestigacion,
  InvestigacionObjetivo,
  Plan,
  Resultado,
} from '@labia/compartido';
import type { ContextoVista } from '../../nucleo/contrato-vista';
import { crearBloqueCargando, crearBloqueError, vaciarNodo } from './estados';
import { renderizarPlan } from './plan-ui';

const ETIQUETA_CLASIFICACION: Readonly<Record<ClasificacionDato, string>> = {
  verificado: 'Verificado en una fuente pública',
  inferido: 'Hipótesis del sistema — todavía no confirmado',
  no_encontrado: 'No se encontró',
};

function textoDeValor(valor: unknown): string {
  if (valor === null || valor === undefined) return '';
  if (Array.isArray(valor)) {
    return valor
      .map((v) => (typeof v === 'string' ? v : typeof v === 'object' && v !== null && 'nombre' in v ? String((v as { nombre: unknown }).nombre) : JSON.stringify(v)))
      .join(', ');
  }
  if (typeof valor === 'string') return valor;
  return String(valor);
}

interface FilaDato {
  readonly etiqueta: string;
  readonly dato: DatoInvestigado<unknown>;
  readonly permiteTextoLibre: boolean;
}

function renderizarFilaDato(fila: FilaDato, onCorregir: (campo: string, valor: string) => void): HTMLElement {
  const contenedor = document.createElement('div');
  contenedor.className = 'planificar-dato';

  const encabezado = document.createElement('div');
  encabezado.className = 'planificar-dato-encabezado';
  const etiqueta = document.createElement('span');
  etiqueta.textContent = fila.etiqueta;
  const clasificacion = document.createElement('span');
  clasificacion.className = `dato dato--${fila.dato.clasificacion.replace('_', '-')}`;
  clasificacion.textContent = ETIQUETA_CLASIFICACION[fila.dato.clasificacion];
  encabezado.append(etiqueta, clasificacion);
  if (fila.dato.confianza) {
    const confianza = document.createElement('span');
    confianza.className = `confianza confianza--${fila.dato.confianza}`;
    confianza.textContent = `Confianza ${fila.dato.confianza}`;
    encabezado.appendChild(confianza);
  }
  contenedor.appendChild(encabezado);

  const valorTexto = textoDeValor(fila.dato.valorCorregido ?? fila.dato.valor);
  if (valorTexto) {
    const valor = document.createElement('p');
    valor.textContent = valorTexto;
    contenedor.appendChild(valor);
  }
  if (fila.dato.clasificacion === 'inferido' && fila.dato.razonamiento) {
    const razonamiento = document.createElement('p');
    razonamiento.className = 'texto-3';
    razonamiento.textContent = `Por qué se infiere: ${fila.dato.razonamiento}`;
    contenedor.appendChild(razonamiento);
  }
  if (fila.dato.clasificacion === 'no_encontrado') {
    const explicacion = document.createElement('p');
    explicacion.className = 'texto-3';
    explicacion.textContent = 'No se rellena ni se estima. Si lo sabés, agregalo abajo.';
    contenedor.appendChild(explicacion);
  }
  if (fila.dato.confirmadoPorVendedor) {
    const confirmado = document.createElement('p');
    confirmado.className = 'texto-3';
    confirmado.textContent = 'Confirmado por vos.';
    contenedor.appendChild(confirmado);
  }

  if (fila.permiteTextoLibre) {
    const formulario = document.createElement('form');
    formulario.className = 'planificar-form planificar-form-inline';
    const entrada = document.createElement('input');
    entrada.type = 'text';
    entrada.className = 'entrada';
    entrada.placeholder = fila.dato.clasificacion === 'no_encontrado' ? 'Agregar lo que sepas' : 'Corregir';
    entrada.value = valorTexto;
    entrada.setAttribute('aria-label', `Corregir ${fila.etiqueta.toLowerCase()}`);
    const boton = document.createElement('button');
    boton.type = 'submit';
    boton.className = 'btn-texto';
    boton.textContent = fila.dato.clasificacion === 'no_encontrado' ? 'Agregar' : 'Confirmar o corregir';
    formulario.append(entrada, boton);
    formulario.addEventListener('submit', (evento) => {
      evento.preventDefault();
      onCorregir(fila.dato.campo, entrada.value.trim());
    });
    contenedor.appendChild(formulario);
  }

  return contenedor;
}

function renderizarFuentes(fuentes: ReadonlyArray<FuenteInvestigacion>): HTMLElement {
  const seccion = document.createElement('section');
  seccion.className = 'tarjeta planificar-seccion';
  const h3 = document.createElement('h3');
  h3.textContent = 'Fuentes consultadas';
  seccion.appendChild(h3);
  const lista = document.createElement('ul');
  lista.className = 'lista';
  for (const fuente of fuentes) {
    const item = document.createElement('li');
    const estado = fuente.exito ? 'Respondió' : 'No respondió';
    item.textContent = fuente.exito
      ? `${fuente.nombre} — ${estado}`
      : `${fuente.nombre} — ${estado}: ${fuente.motivoFallo ?? 'sin motivo registrado'}`;
    lista.appendChild(item);
  }
  seccion.appendChild(lista);
  return seccion;
}

interface OpcionesInvestigacion {
  readonly contexto: ContextoVista;
  readonly contenedor: HTMLElement;
  readonly investigacionInicial: InvestigacionObjetivo;
}

export function renderizarInvestigacion({ contexto, contenedor, investigacionInicial }: OpcionesInvestigacion): void {
  let investigacion = investigacionInicial;
  dibujar();

  function dibujar(): void {
    vaciarNodo(contenedor);
    contenedor.className = 'planificar-investigacion';

    if (investigacion.usoRespaldoTaxonomia) {
      const aviso = document.createElement('div');
      aviso.className = 'aviso';
      aviso.setAttribute('role', 'status');
      aviso.textContent = 'Las fuentes externas no respondieron. Este plan se armó con la taxonomía interna como respaldo; con menos confianza, pero completo.';
      contenedor.appendChild(aviso);
    }

    if (investigacion.datosMinimosFaltantes.length > 0) {
      contenedor.appendChild(renderizarCamposFaltantes(investigacion.datosMinimosFaltantes));
    }

    const filas: FilaDato[] = [
      { etiqueta: 'Actividad / rubro', dato: investigacion.actividad, permiteTextoLibre: true },
      { etiqueta: 'Ubicación', dato: investigacion.ubicacion, permiteTextoLibre: true },
      { etiqueta: 'Sitio web', dato: investigacion.sitioWeb, permiteTextoLibre: false },
      { etiqueta: 'Canales digitales', dato: investigacion.canalesDigitales, permiteTextoLibre: false },
      { etiqueta: 'Productos o servicios observables', dato: investigacion.productosOServicios, permiteTextoLibre: false },
      { etiqueta: 'Señales operativas', dato: investigacion.senalesOperativas, permiteTextoLibre: false },
      { etiqueta: 'Posibles decisores', dato: investigacion.posiblesDecisores, permiteTextoLibre: false },
      { etiqueta: 'Tamaño aproximado', dato: investigacion.tamanoAproximado, permiteTextoLibre: false },
    ];

    const seccionDatos = document.createElement('section');
    seccionDatos.className = 'tarjeta planificar-seccion';
    const h3 = document.createElement('h3');
    h3.textContent = 'Lo que se investigó';
    seccionDatos.appendChild(h3);
    for (const fila of filas) {
      seccionDatos.appendChild(
        renderizarFilaDato(fila, (campo, valor) => {
          void aplicarCorreccion({ campo, valor, accion: valor ? 'corregir' : 'confirmar' });
        }),
      );
    }
    contenedor.appendChild(seccionDatos);

    contenedor.appendChild(renderizarFuentes(investigacion.fuentesConsultadas));

    const acciones = document.createElement('div');
    acciones.className = 'planificar-acciones';
    const botonPlan = document.createElement('button');
    botonPlan.type = 'button';
    botonPlan.className = 'btn';
    botonPlan.textContent = 'Ver el plan completo';
    const panelPlan = document.createElement('div');
    panelPlan.setAttribute('aria-live', 'polite');
    botonPlan.addEventListener('click', () => void abrirPlan(panelPlan, botonPlan));
    acciones.appendChild(botonPlan);
    contenedor.append(acciones, panelPlan);
  }

  function renderizarCamposFaltantes(campos: ReadonlyArray<CampoFaltante>): HTMLElement {
    const seccion = document.createElement('section');
    seccion.className = 'tarjeta planificar-seccion planificar-campos-faltantes';
    const h3 = document.createElement('h3');
    h3.textContent = 'Sólo necesitamos esto';
    seccion.appendChild(h3);
    const nota = document.createElement('p');
    nota.className = 'texto-2';
    nota.textContent = `${campos.length} ${campos.length === 1 ? 'dato, no un formulario completo' : 'datos, no un formulario completo'}.`;
    seccion.appendChild(nota);

    const formulario = document.createElement('form');
    formulario.className = 'planificar-form';
    const entradas = new Map<string, HTMLInputElement>();
    for (const campo of campos) {
      const contenedorCampo = document.createElement('div');
      contenedorCampo.className = 'campo';
      const etiqueta = document.createElement('label');
      etiqueta.htmlFor = `faltante-${campo.campo}`;
      etiqueta.textContent = campo.obligatorio ? `${campo.pregunta} *` : campo.pregunta;
      const porQue = document.createElement('p');
      porQue.className = 'texto-3';
      porQue.textContent = campo.porQueHaceFalta;
      const entrada = document.createElement('input');
      entrada.type = 'text';
      entrada.id = `faltante-${campo.campo}`;
      entrada.className = 'entrada';
      entradas.set(campo.campo, entrada);
      contenedorCampo.append(etiqueta, porQue, entrada);
      formulario.appendChild(contenedorCampo);
    }
    const enviar = document.createElement('button');
    enviar.type = 'submit';
    enviar.className = 'btn';
    enviar.textContent = 'Guardar y continuar';
    formulario.appendChild(enviar);
    formulario.addEventListener('submit', (evento) => {
      evento.preventDefault();
      const correcciones: CorreccionDato[] = [...entradas.entries()]
        .filter(([, entrada]) => entrada.value.trim().length > 0)
        .map(([campo, entrada]) => ({ campo, valor: entrada.value.trim(), accion: 'agregar' as const }));
      if (correcciones.length > 0) void aplicarCorreccion(...correcciones);
    });
    seccion.appendChild(formulario);
    return seccion;
  }

  async function aplicarCorreccion(...correcciones: ReadonlyArray<CorreccionDato>): Promise<void> {
    const resultado = await contexto.datos.corregirInvestigacion(investigacion, correcciones).catch(() => null);
    if (contexto.senal.aborted) return;
    if (!resultado || !resultado.ok) return;
    investigacion = resultado.datos.investigacion;
    dibujar();
    if (resultado.datos.cambios.length > 0) {
      const aviso = document.createElement('div');
      aviso.className = 'aviso';
      aviso.setAttribute('role', 'status');
      const titulo = document.createElement('p');
      titulo.textContent = 'La corrección movió el ranking:';
      aviso.appendChild(titulo);
      const lista = document.createElement('ul');
      for (const cambio of resultado.datos.cambios.slice(0, 5)) {
        const item = document.createElement('li');
        item.textContent = `${cambio.productoId}: ${cambio.motivo}`;
        lista.appendChild(item);
      }
      aviso.appendChild(lista);
      contenedor.prepend(aviso);
    }
  }

  async function abrirPlan(panel: HTMLElement, boton: HTMLButtonElement): Promise<void> {
    boton.disabled = true;
    vaciarNodo(panel);
    panel.appendChild(crearBloqueCargando('Armando el plan…'));
    const resultado = await contexto.datos.planDesdeInvestigacion(investigacion).catch((): Resultado<Plan> => ({
      ok: false,
      error: { codigo: 'desconocido', mensajeAmable: 'No se pudo armar el plan. Volvé a intentar.' },
    }));
    boton.disabled = false;
    if (contexto.senal.aborted) return;
    vaciarNodo(panel);
    if (!resultado.ok) {
      panel.appendChild(crearBloqueError(resultado.error, () => void abrirPlan(panel, boton)));
      return;
    }
    renderizarPlan(contexto, panel, resultado.datos);
  }
}
