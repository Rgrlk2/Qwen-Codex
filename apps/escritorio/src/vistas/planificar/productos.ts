/**
 * Referencia del portafolio, dentro de Planificar (MASTER_SPEC.md §2.2
 * "Referencia del portafolio", USER_FLOWS.md F4) + formulario de sugerencia
 * de producto nuevo (§13, F18).
 *
 * ⛔ El copy se lee tal cual desde content/copy/*.md (import `?raw`, nunca se
 *    copia a TypeScript) y se renderiza con markdown.ts, en el orden del
 *    documento fuente. Las secciones que un producto no tiene, no se
 *    muestran ni se rellenan (Merma IA es la única con "¿Qué datos
 *    necesita?"; Precio Vivo no tiene slogan oficial).
 * ⛔ Sin edición de copy ni de precio en ninguna vista (USER_FLOWS F4.7).
 * ⛔ Nunca propone un producto fuera de los 13 en la lista de sugerencia.
 */

import type {
  ClaveIdempotencia,
  FrecuenciaObservada,
  NuevaSugerencia,
  Producto,
  ProductoDetalle,
  ProductoId,
  Resultado,
} from '@labia/compartido';
import type { ContextoVista } from '../../nucleo/contrato-vista';
import { crearBloqueCargando, crearBloqueError, crearBloqueVacio, vaciarNodo } from './estados';
import { extraerSeccionProducto, renderizarMarkdown } from './markdown';

import copyEspecificas from '../../../../../content/copy/LabIA_9_Soluciones_Especificas_Copy_Maestro.md?raw';
import copyIntegrales from '../../../../../content/copy/LabIA_4_Soluciones_Integrales_Copy_Maestro.md?raw';

function nuevaClave(): ClaveIdempotencia {
  return `planificar-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function textoModalidad(modalidad: string): string {
  switch (modalidad) {
    case 'setup': return 'Implementación';
    case 'mensualidad': return 'Mensualidad';
    case 'unica_vez': return 'Pago único';
    case 'prueba': return 'Prueba';
    default: return modalidad;
  }
}

function renderizarPrecios(detalle: ProductoDetalle, contenedor: HTMLElement): void {
  if (detalle.precios.length === 0) {
    const p = document.createElement('p');
    p.className = 'texto-2';
    p.textContent = 'Sin precio de lista cargado.';
    contenedor.appendChild(p);
    return;
  }
  const lista = document.createElement('dl');
  lista.className = 'planificar-precios';
  for (const precio of detalle.precios) {
    const etiqueta = document.createElement('dt');
    etiqueta.textContent = [textoModalidad(precio.modalidad), precio.plan, precio.condicion].filter(Boolean).join(' · ');
    const valor = document.createElement('dd');
    valor.textContent = precio.textoDocumentado;
    lista.append(etiqueta, valor);
  }
  contenedor.appendChild(lista);
  if (detalle.precios.some((p) => p.ivaIncluido === null && p.estado !== 'no_documentado')) {
    const nota = document.createElement('p');
    nota.className = 'texto-3';
    nota.textContent = 'IVA no especificado en la lista vigente.';
    contenedor.appendChild(nota);
  }
}

function copyDelProducto(producto: Producto): string | null {
  const fuente = producto.familia === 'especifica' ? copyEspecificas : copyIntegrales;
  return extraerSeccionProducto(fuente, producto.nombre);
}

function renderizarFicha(detalle: ProductoDetalle, contenedor: HTMLElement): void {
  vaciarNodo(contenedor);
  const encabezado = document.createElement('div');
  encabezado.className = 'planificar-ficha-encabezado';
  const titulo = document.createElement('h3');
  titulo.textContent = detalle.nombre;
  encabezado.appendChild(titulo);
  if (detalle.aliasHistoricos.length > 0) {
    const alias = document.createElement('p');
    alias.className = 'texto-3';
    alias.textContent = `Alias histórico: ${detalle.aliasHistoricos.join(', ')}. Es el mismo producto, nunca uno aparte.`;
    encabezado.appendChild(alias);
  }
  contenedor.appendChild(encabezado);

  const cuerpoCopy = copyDelProducto(detalle);
  const seccionCopy = document.createElement('div');
  seccionCopy.className = 'planificar-copy';
  if (cuerpoCopy) {
    seccionCopy.appendChild(renderizarMarkdown(cuerpoCopy));
  } else {
    const aviso = document.createElement('p');
    aviso.className = 'texto-2';
    aviso.textContent = 'No se encontró la sección de este producto en el copy aprobado.';
    seccionCopy.appendChild(aviso);
  }
  contenedor.appendChild(seccionCopy);

  const precios = document.createElement('div');
  precios.className = 'planificar-ficha-precios';
  const tituloPrecios = document.createElement('h4');
  tituloPrecios.textContent = 'Precio de lista';
  precios.appendChild(tituloPrecios);
  renderizarPrecios(detalle, precios);
  contenedor.appendChild(precios);
}

interface OpcionesProductos {
  readonly contexto: ContextoVista;
  readonly contenedor: HTMLElement;
}

export function montarProductos({ contexto, contenedor }: OpcionesProductos): void {
  vaciarNodo(contenedor);
  contenedor.className = 'planificar-panel';

  const titulo = document.createElement('h2');
  titulo.textContent = 'Los 13 productos de Lab.IA';
  contenedor.appendChild(titulo);

  const chips = document.createElement('div');
  chips.className = 'chips';
  chips.setAttribute('role', 'group');
  chips.setAttribute('aria-label', 'Filtrar por familia');
  contenedor.appendChild(chips);

  const cuerpo = document.createElement('div');
  cuerpo.className = 'planificar-productos-cuerpo';
  contenedor.appendChild(cuerpo);

  let familiaActiva: 'especifica' | 'integral' | null = null;

  const chipTodos = crearChip('Las 13', familiaActiva === null, () => seleccionarFamilia(null));
  const chipEspecificas = crearChip('9 específicas', false, () => seleccionarFamilia('especifica'));
  const chipIntegrales = crearChip('4 integrales', false, () => seleccionarFamilia('integral'));
  chips.append(chipTodos, chipEspecificas, chipIntegrales);

  function crearChip(texto: string, activo: boolean, onActivar: () => void): HTMLButtonElement {
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'chip';
    boton.textContent = texto;
    boton.setAttribute('aria-pressed', String(activo));
    boton.addEventListener('click', () => {
      for (const hijo of Array.from(chips.children)) hijo.setAttribute('aria-pressed', 'false');
      boton.setAttribute('aria-pressed', 'true');
      onActivar();
    });
    return boton;
  }

  function seleccionarFamilia(familia: 'especifica' | 'integral' | null): void {
    familiaActiva = familia;
    void cargarLista();
  }

  async function cargarLista(): Promise<void> {
    vaciarNodo(cuerpo);
    cuerpo.appendChild(crearBloqueCargando('Cargando el portafolio…'));
    const resultado: Resultado<ReadonlyArray<Producto>> = await contexto.datos
      .listarProductos(familiaActiva ? { familia: familiaActiva, soloPublicados: true } : { soloPublicados: true })
      .catch((): Resultado<ReadonlyArray<Producto>> => ({
        ok: false,
        error: { codigo: 'desconocido', mensajeAmable: 'No se pudo cargar el portafolio. Volvé a intentar.' },
      }));
    if (contexto.senal.aborted) return;
    vaciarNodo(cuerpo);
    if (!resultado.ok) {
      cuerpo.appendChild(crearBloqueError(resultado.error, () => void cargarLista()));
      return;
    }
    if (resultado.datos.length === 0) {
      cuerpo.appendChild(crearBloqueVacio('No hay productos publicados con este filtro.'));
      return;
    }
    const lista = document.createElement('ul');
    lista.className = 'lista planificar-productos-lista';
    for (const producto of [...resultado.datos].sort((a, b) => a.orden - b.orden)) {
      const item = document.createElement('li');
      const boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'btn-texto planificar-producto-boton';
      boton.textContent = `${producto.orden}. ${producto.nombre}`;
      boton.addEventListener('click', () => void abrirFicha(producto.id));
      item.appendChild(boton);
      lista.appendChild(item);
    }
    cuerpo.appendChild(lista);

    const panelFicha = document.createElement('div');
    panelFicha.className = 'planificar-ficha';
    panelFicha.setAttribute('aria-live', 'polite');
    cuerpo.appendChild(panelFicha);

    async function abrirFicha(id: ProductoId): Promise<void> {
      vaciarNodo(panelFicha);
      panelFicha.appendChild(crearBloqueCargando('Cargando la ficha…'));
      const detalle = await contexto.datos.obtenerProducto(id).catch((): Resultado<ProductoDetalle> => ({
        ok: false,
        error: { codigo: 'desconocido', mensajeAmable: 'No se pudo abrir la ficha. Volvé a intentar.' },
      }));
      if (contexto.senal.aborted) return;
      vaciarNodo(panelFicha);
      if (!detalle.ok) {
        panelFicha.appendChild(crearBloqueError(detalle.error, () => void abrirFicha(id)));
        return;
      }
      renderizarFicha(detalle.datos, panelFicha);
    }
  }

  void cargarLista();
}

// ---------------------------------------------------------------------------
// Sugerencia de producto nuevo — cuando ninguno de los 13 encaja (F18)
// ---------------------------------------------------------------------------

const FRECUENCIAS: ReadonlyArray<{ readonly valor: FrecuenciaObservada; readonly texto: string }> = [
  { valor: 'unica', texto: 'Es la primera vez que lo escucho' },
  { valor: 'ocasional', texto: 'Lo escuché alguna vez más' },
  { valor: 'frecuente', texto: 'Lo escucho seguido' },
];

interface OpcionesSugerencia {
  readonly contexto: ContextoVista;
  readonly contenedor: HTMLElement;
  readonly productosSinEncaje: ReadonlyArray<ProductoId>;
  readonly nombresProductos: ReadonlyMap<ProductoId, string>;
}

export function montarFormularioSugerencia({ contexto, contenedor, productosSinEncaje, nombresProductos }: OpcionesSugerencia): void {
  vaciarNodo(contenedor);
  contenedor.className = 'planificar-sugerencia tarjeta';

  const titulo = document.createElement('h3');
  titulo.textContent = 'Ninguno de los 13 encaja: sugerir un producto';
  contenedor.appendChild(titulo);

  const explicacion = document.createElement('p');
  explicacion.className = 'texto-2';
  explicacion.textContent = 'Esto no abre el portafolio: es un canal formal para que el administrador evalúe la demanda. El silencio no es una respuesta válida — recibirás una resolución.';
  contenedor.appendChild(explicacion);

  const formulario = document.createElement('form');
  formulario.className = 'planificar-form';
  formulario.noValidate = true;

  const campoTitulo = crearCampoTexto('sugerencia-titulo', 'Título', true);
  const campoProblema = crearCampoTextoLargo('sugerencia-problema', 'El problema, en palabras del cliente', true);
  const campoPorQue = crearCampoTextoLargo('sugerencia-porque', `Por qué ${productosSinEncaje.map((id) => nombresProductos.get(id) ?? id).join(' y ') || 'el portafolio actual'} no alcanza`, true);

  const campoFrecuencia = document.createElement('fieldset');
  campoFrecuencia.className = 'campo';
  const leyenda = document.createElement('legend');
  leyenda.textContent = '¿Con qué frecuencia lo escuchaste?';
  campoFrecuencia.appendChild(leyenda);
  for (const [indice, frecuencia] of FRECUENCIAS.entries()) {
    const etiqueta = document.createElement('label');
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'frecuencia';
    radio.value = frecuencia.valor;
    if (indice === 0) radio.checked = true;
    etiqueta.append(radio, document.createTextNode(` ${frecuencia.texto}`));
    campoFrecuencia.appendChild(etiqueta);
  }

  const envio = document.createElement('button');
  envio.type = 'submit';
  envio.className = 'btn';
  envio.textContent = 'Enviar sugerencia';

  const aviso = document.createElement('p');
  aviso.setAttribute('role', 'status');
  aviso.className = 'planificar-aviso-envio';

  formulario.append(campoTitulo.campo, campoProblema.campo, campoFrecuencia, campoPorQue.campo, envio, aviso);
  contenedor.appendChild(formulario);

  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const titulo = campoTitulo.entrada.value.trim();
    const problema = campoProblema.entrada.value.trim();
    const porQue = campoPorQue.entrada.value.trim();
    const frecuencia = (new FormData(formulario).get('frecuencia') as FrecuenciaObservada | null) ?? 'unica';
    if (!titulo || !problema || !porQue) {
      aviso.textContent = 'Completá título, problema y por qué no alcanza antes de enviar.';
      aviso.setAttribute('role', 'alert');
      return;
    }
    const datos: NuevaSugerencia = {
      titulo,
      problemaCliente: problema,
      frecuenciaObservada: frecuencia,
      productosQueNoAlcanzan: productosSinEncaje,
      porQueNoAlcanzan: porQue,
    };
    envio.disabled = true;
    void contexto.datos.crearSugerencia(datos, nuevaClave()).then((resultado) => {
      envio.disabled = false;
      if (resultado.ok) {
        aviso.setAttribute('role', 'status');
        aviso.textContent = 'Sugerencia enviada. El administrador la va a resolver y vas a ver la respuesta acá.';
        formulario.reset();
      } else {
        aviso.setAttribute('role', 'alert');
        aviso.textContent = resultado.error.mensajeAmable;
      }
    });
  });
}

function crearCampoTexto(id: string, etiquetaTexto: string, obligatorio: boolean): { campo: HTMLElement; entrada: HTMLInputElement } {
  const campo = document.createElement('div');
  campo.className = 'campo';
  const etiqueta = document.createElement('label');
  etiqueta.htmlFor = id;
  etiqueta.textContent = obligatorio ? `${etiquetaTexto} *` : etiquetaTexto;
  const entrada = document.createElement('input');
  entrada.type = 'text';
  entrada.id = id;
  entrada.className = 'entrada';
  entrada.required = obligatorio;
  campo.append(etiqueta, entrada);
  return { campo, entrada };
}

function crearCampoTextoLargo(id: string, etiquetaTexto: string, obligatorio: boolean): { campo: HTMLElement; entrada: HTMLTextAreaElement } {
  const campo = document.createElement('div');
  campo.className = 'campo';
  const etiqueta = document.createElement('label');
  etiqueta.htmlFor = id;
  etiqueta.textContent = obligatorio ? `${etiquetaTexto} *` : etiquetaTexto;
  const entrada = document.createElement('textarea');
  entrada.id = id;
  entrada.className = 'entrada';
  entrada.required = obligatorio;
  entrada.rows = 3;
  campo.append(etiqueta, entrada);
  return { campo, entrada };
}
