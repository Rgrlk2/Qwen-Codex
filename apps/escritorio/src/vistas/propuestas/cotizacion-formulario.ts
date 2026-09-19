/**
 * Formulario de creación de una cotización.
 *
 * El vendedor escribe sólo lo que la plantilla genérica le pide: a quién,
 * qué producto, las condiciones de instalación y alcance, y los DOS importes
 * especiales (setup y mensual). Todo lo demás —precios de lista, ahorros,
 * las cuatro alternativas, los totales y los logos— lo calcula el servidor.
 * ⛔ No hay ningún campo de "ahorro": eso nunca se escribe.
 */

import type {
  AporteDelCliente, CapaDatos, Moneda, NuevaCotizacion, Producto, ProductoId, TipoAporteCliente,
} from '@labia/compartido';
import type { ContextoVista } from '../../nucleo/contrato-vista';
import { crear, vaciar } from './dom';
import { nuevaClaveIdempotencia } from './ids';

async function cargarProductos(datos: CapaDatos): Promise<ReadonlyArray<Producto>> {
  try {
    const resultado = await datos.listarProductos();
    if (resultado.ok) return resultado.datos;
  } catch {
    // Se degrada al select vacío: el vendedor no puede quedar sin poder cotizar.
  }
  return [];
}

const TIPOS_APORTE: ReadonlyArray<{ readonly valor: TipoAporteCliente; readonly texto: string }> = [
  { valor: 'insumo', texto: 'Insumo' },
  { valor: 'acceso', texto: 'Acceso' },
  { valor: 'cuenta', texto: 'Cuenta' },
  { valor: 'informacion', texto: 'Información' },
  { valor: 'equipo', texto: 'Equipo' },
];

function filaAporte(contenedor: HTMLElement, alQuitar: () => void): { obtener: () => AporteDelCliente | null } {
  const fila = crear('div', { clase: 'propuestas-fila-aporte' });
  const selectTipo = crear('select');
  for (const { valor, texto } of TIPOS_APORTE) {
    const opcion = crear('option', { texto, atributos: { value: valor } });
    selectTipo.append(opcion);
  }
  const descripcion = crear('input', { atributos: { placeholder: 'Qué tiene que aportar el cliente' } });
  const bloqueante = crear('label', { clase: 'propuestas-checkbox' });
  const casillaBloqueante = crear('input', { atributos: { type: 'checkbox' } });
  bloqueante.append(casillaBloqueante, document.createTextNode('Bloqueante'));
  const botonQuitar = crear('button', { clase: 'propuestas-btn-texto', texto: 'Quitar' });
  botonQuitar.type = 'button';
  botonQuitar.addEventListener('click', () => { fila.remove(); alQuitar(); });
  fila.append(selectTipo, descripcion, bloqueante, botonQuitar);
  contenedor.append(fila);
  return {
    obtener: () => {
      if (!descripcion.value.trim()) return null;
      return { tipo: selectTipo.value as TipoAporteCliente, descripcion: descripcion.value.trim(), bloqueante: casillaBloqueante.checked };
    },
  };
}

export function renderizarFormularioNuevaCotizacion(
  contenedor: HTMLElement,
  contexto: ContextoVista,
  alCrear: (id: string) => void,
  alCancelar: () => void,
): void {
  vaciar(contenedor);
  const formulario = crear('form', { clase: 'propuestas-tarjeta propuestas-formulario' });
  formulario.append(crear('h2', { texto: 'Nueva cotización' }));
  formulario.append(crear('p', {
    clase: 'propuestas-explicacion',
    texto: 'Plantilla genérica de Lab.IA: sirve para cualquiera de los 13 productos, cualquier variante y cualquier cliente. No hay ningún importe fijado de antemano.',
  }));

  function campoTexto(id: string, etiquetaTexto: string, tipo = 'text'): { envoltorio: HTMLElement; entrada: HTMLInputElement } {
    const envoltorio = crear('div', { clase: 'propuestas-campo' });
    envoltorio.append(crear('label', { texto: etiquetaTexto, atributos: { for: id } }));
    const entrada = crear('input', { atributos: { id, type: tipo } });
    envoltorio.append(entrada);
    return { envoltorio, entrada };
  }

  function campoArea(id: string, etiquetaTexto: string): { envoltorio: HTMLElement; entrada: HTMLTextAreaElement } {
    const envoltorio = crear('div', { clase: 'propuestas-campo' });
    envoltorio.append(crear('label', { texto: etiquetaTexto, atributos: { for: id } }));
    const entrada = crear('textarea', { atributos: { id, rows: '3' } });
    envoltorio.append(entrada);
    return { envoltorio, entrada };
  }

  const cliente = campoTexto('cot-cliente', 'ID del cliente');
  cliente.entrada.required = true;

  const campoProducto = crear('div', { clase: 'propuestas-campo' });
  campoProducto.append(crear('label', { texto: 'Producto', atributos: { for: 'cot-producto' } }));
  const selectProducto = crear('select', { atributos: { id: 'cot-producto', required: 'true' } });
  campoProducto.append(selectProducto);

  const variante = campoTexto('cot-variante', 'Variante o plan (dejar vacío si no aplica)');

  const moneda = crear('div', { clase: 'propuestas-campo' });
  moneda.append(crear('label', { texto: 'Moneda', atributos: { for: 'cot-moneda' } }));
  const selectMoneda = crear('select', { atributos: { id: 'cot-moneda' } });
  selectMoneda.append(crear('option', { texto: 'Guaraníes (PYG)', atributos: { value: 'PYG' } }));
  selectMoneda.append(crear('option', { texto: 'Dólares (USD)', atributos: { value: 'USD' } }));
  moneda.append(selectMoneda);

  const setupEspecial = campoTexto('cot-setup', 'Precio especial del setup (S)', 'number');
  setupEspecial.entrada.required = true;
  setupEspecial.entrada.min = '0';
  const mensualEspecial = campoTexto('cot-mensual', 'Precio mensual especial (M)', 'number');
  mensualEspecial.entrada.required = true;
  mensualEspecial.entrada.min = '0';

  const fechaValidez = campoTexto('cot-validez', 'Fecha de validez de la oferta', 'date');
  fechaValidez.entrada.required = true;

  const permanencia = crear('p', { clase: 'propuestas-meta', texto: 'Permanencia mínima: 12 meses (fija, no editable).' });

  const instalacionDescripcion = campoArea('cot-instalacion', 'Condiciones de instalación');
  instalacionDescripcion.entrada.required = true;
  const tiempoInstalacionDias = campoTexto('cot-dias', 'Tiempo estimado de instalación (días hábiles)', 'number');
  tiempoInstalacionDias.entrada.required = true;
  tiempoInstalacionDias.entrada.min = '1';

  const campoAportes = crear('div', { clase: 'propuestas-campo' });
  campoAportes.append(crear('label', { texto: 'Qué aporta el cliente (insumos, accesos, cuentas, información, equipos)' }));
  const listaAportes = crear('div');
  const filas: Array<{ obtener: () => AporteDelCliente | null }> = [];
  const botonAgregarAporte = crear('button', { clase: 'propuestas-btn-texto', texto: '+ Agregar aporte' });
  botonAgregarAporte.type = 'button';
  botonAgregarAporte.addEventListener('click', () => {
    filas.push(filaAporte(listaAportes, () => undefined));
  });
  campoAportes.append(listaAportes, botonAgregarAporte);
  // Al menos un aporte para empezar: la cotización sin ninguno no se puede enviar a revisión.
  filas.push(filaAporte(listaAportes, () => undefined));

  const queIncluye = campoArea('cot-incluye', 'Qué incluye (una línea por ítem)');
  queIncluye.entrada.required = true;
  const queNoIncluye = campoArea('cot-no-incluye', 'Qué NO incluye (obligatorio, una línea por ítem)');
  queNoIncluye.entrada.required = true;
  const limites = campoArea('cot-limites', 'Límites incluidos (opcional, una línea por ítem)');
  const bases = campoArea('cot-bases', 'Bases y condiciones');
  bases.entrada.required = true;
  const iva = campoTexto('cot-iva', 'Tratamiento del IVA (por ejemplo: "IVA incluido")');
  iva.entrada.required = true;
  const notas = campoArea('cot-notas', 'Notas internas (opcional, no la ve el cliente)');

  const zonaAviso = crear('div', { clase: 'propuestas-aviso', atributos: { role: 'alert' } });
  zonaAviso.hidden = true;

  const acciones = crear('div', { clase: 'propuestas-acciones' });
  const botonGuardar = crear('button', { clase: 'propuestas-btn', texto: 'Crear borrador' });
  botonGuardar.type = 'submit';
  const botonCancelar = crear('button', { clase: 'propuestas-btn-texto', texto: 'Cancelar' });
  botonCancelar.type = 'button';
  botonCancelar.addEventListener('click', alCancelar);
  acciones.append(botonGuardar, botonCancelar);

  formulario.append(
    cliente.envoltorio, campoProducto, variante.envoltorio, moneda, setupEspecial.envoltorio,
    mensualEspecial.envoltorio, fechaValidez.envoltorio, permanencia,
    instalacionDescripcion.envoltorio, tiempoInstalacionDias.envoltorio, campoAportes,
    queIncluye.envoltorio, queNoIncluye.envoltorio, limites.envoltorio, bases.envoltorio,
    iva.envoltorio, notas.envoltorio, zonaAviso, acciones,
  );
  contenedor.append(formulario);

  cargarProductos(contexto.datos).then((productos) => {
    if (contexto.senal.aborted) return;
    vaciar(selectProducto);
    if (productos.length === 0) {
      selectProducto.append(crear('option', { texto: 'No se pudo cargar el catálogo', atributos: { value: '' } }));
      return;
    }
    for (const producto of productos) {
      selectProducto.append(crear('option', { texto: producto.nombre, atributos: { value: producto.id } }));
    }
  });

  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    zonaAviso.hidden = true;

    const lineas = (texto: string): ReadonlyArray<string> => texto.split('\n').map((l) => l.trim()).filter(Boolean);
    const aportesDelCliente = filas.map((f) => f.obtener()).filter((a): a is AporteDelCliente => a !== null);

    if (!selectProducto.value) {
      zonaAviso.textContent = 'Elegí un producto.';
      zonaAviso.hidden = false;
      return;
    }
    if (aportesDelCliente.length === 0) {
      zonaAviso.textContent = 'Agregá al menos un aporte que necesita el cliente.';
      zonaAviso.hidden = false;
      return;
    }
    if (lineas(queNoIncluye.entrada.value).length === 0) {
      zonaAviso.textContent = 'Qué no incluye no puede quedar vacío.';
      zonaAviso.hidden = false;
      return;
    }

    const monedaElegida = selectMoneda.value as Moneda;
    const factorMenor = monedaElegida === 'USD' ? 100 : 1;
    const datos: NuevaCotizacion = {
      clienteId: cliente.entrada.value.trim(),
      productoId: selectProducto.value as ProductoId,
      ...(variante.entrada.value.trim() ? { variante: variante.entrada.value.trim() } : {}),
      precios: {
        setupEspecial: { monto: Math.round(Number(setupEspecial.entrada.value) * factorMenor), moneda: monedaElegida },
        mensualEspecial: { monto: Math.round(Number(mensualEspecial.entrada.value) * factorMenor), moneda: monedaElegida },
      },
      condiciones: {
        permanenciaMinimaMeses: 12,
        instalacion: {
          descripcion: instalacionDescripcion.entrada.value.trim(),
          tiempoEstimadoDiasHabiles: Number(tiempoInstalacionDias.entrada.value),
          tiempoEstimadoTexto: `Hasta ${tiempoInstalacionDias.entrada.value} días hábiles desde la aceptación.`,
          aportesDelCliente,
        },
        alcance: {
          queIncluye: lineas(queIncluye.entrada.value),
          queNoIncluye: lineas(queNoIncluye.entrada.value),
          limitesIncluidos: lineas(limites.entrada.value),
        },
        basesYCondiciones: bases.entrada.value.trim(),
        tratamientoIva: iva.entrada.value.trim(),
        notasInternas: notas.entrada.value.trim() ? notas.entrada.value.trim() : null,
      },
      fechaValidez: new Date(fechaValidez.entrada.value).toISOString(),
    };

    botonGuardar.disabled = true;
    contexto.datos.crearCotizacion(datos, nuevaClaveIdempotencia()).then((resultado) => {
      botonGuardar.disabled = false;
      if (!resultado.ok) {
        zonaAviso.textContent = resultado.error.mensajeAmable;
        zonaAviso.hidden = false;
        return;
      }
      alCrear(resultado.datos.id);
    });
  });
}
