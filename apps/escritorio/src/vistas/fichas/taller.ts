/**
 * El taller de la ficha: preparar a la izquierda, vista previa a la derecha.
 *
 * Es lo que abre el vendedor cuando el motor le recomendó un producto y quiere
 * armar la ficha para ese prospecto. En celular las dos mitades se apilan.
 *
 * ⛔ La vista previa se arma con `fichaPublicaDe`, la misma función que sirve
 *    el enlace real. No hay una maqueta paralela que pueda mentir.
 */

import type {
  CapaDatos, FichaOficial, FichaPersonalizada, Id, PersonalizacionBloque, ProductoId,
} from '@labia/compartido';
// ⛔ De `@labia/compartido`, NUNCA de `@labia/mock`: el paquete de ejemplo
//    reexporta lo mismo, pero importarlo desde acá mete los clientes
//    inventados dentro de lo que se publica.
import { conBloquesNuevos, fichaPublicaDe, personalizacionInicial } from '@labia/compartido';

import { crear, vaciar } from './dom';
import { montarPreparar, type EstadoPreparacion } from './preparar';
import { pintarFichaInterna } from './vista-interna';
import { pintarVistaPrevia } from './vista-previa';
import './estilos.css';

export interface OpcionesTaller {
  readonly datos: CapaDatos;
  readonly contenedor: HTMLElement;
  readonly productoId: ProductoId;
  readonly clienteId: Id;
  readonly nombreVendedor: string;
  readonly senal: AbortSignal;
  /** Capa ya guardada, si el vendedor la había preparado antes. */
  readonly existente?: FichaPersonalizada;
  readonly alGuardar?: (capa: FichaPersonalizada) => void;
}

/** Los cuatro estados. Una vista sin vacío o sin error no está terminada. */
export async function montarTaller(opciones: OpcionesTaller): Promise<void> {
  const { datos, contenedor, productoId, clienteId, nombreVendedor, senal } = opciones;

  vaciar(contenedor);
  contenedor.append(crear('div', {
    clase: 'fichas-cargando',
    texto: 'Abriendo la ficha…',
    atributos: { role: 'status' },
  }));

  const resultado = await datos.obtenerFichaOficial(productoId);
  if (senal.aborted) return;

  if (!resultado.ok) {
    vaciar(contenedor);
    const error = crear('div', { clase: 'fichas-error', atributos: { role: 'alert' } });
    error.append(crear('p', { texto: resultado.error.mensajeAmable }));
    if (resultado.error.pista) error.append(crear('p', { clase: 'fichas-ayuda', texto: resultado.error.pista }));
    const reintentar = crear('button', { clase: 'fichas-btn', texto: 'Volver a intentar', atributos: { type: 'button' } });
    reintentar.addEventListener('click', () => void montarTaller(opciones));
    error.append(reintentar);
    contenedor.append(error);
    return;
  }

  const ficha: FichaOficial = resultado.datos;
  const conContenido = ficha.bloques.filter((b) => b.presente);

  if (conContenido.length === 0) {
    vaciar(contenedor);
    contenedor.append(crear('div', {
      clase: 'fichas-vacio',
      texto: 'Esta ficha todavía no tiene contenido aprobado. Avisale a Administración.',
      atributos: { role: 'status' },
    }));
    return;
  }

  vaciar(contenedor);
  const taller = crear('div', { clase: 'fichas-taller' });
  const columnaPreparar = crear('div', { clase: 'fichas-columna' });
  const columnaPrevia = crear('div', { clase: 'fichas-columna' });
  taller.append(columnaPreparar, columnaPrevia);
  contenedor.append(taller);

  const inicial: EstadoPreparacion = opciones.existente
    ? {
        // ⛔ Si el copy sumó una sección después de preparar esta ficha, acá
        //    aparece, para que el vendedor la vea y decida. No se la esconde.
        bloques: conBloquesNuevos(ficha, opciones.existente.bloques),
        loQueConversamos: opciones.existente.loQueConversamos ?? '',
        notaDelVendedor: opciones.existente.notaDelVendedor ?? '',
        precio: opciones.existente.precio,
      }
    : {
        bloques: personalizacionInicial(ficha),
        loQueConversamos: '',
        notaDelVendedor: '',
        // ⛔ Arranca sin precio propio: el cliente ve el del copy hasta que el
        //    vendedor decida otra cosa.
        precio: null,
      };

  function repintarPrevia(estado: EstadoPreparacion): void {
    // Se arma una capa efímera sólo para previsualizar: no se guarda nada.
    const capa: FichaPersonalizada = {
      id: opciones.existente?.id ?? 'previa',
      productoId, clienteId,
      vendedorId: opciones.existente?.vendedorId ?? '',
      planId: opciones.existente?.planId ?? null,
      bloques: estado.bloques,
      loQueConversamos: estado.loQueConversamos.trim() || null,
      notaDelVendedor: estado.notaDelVendedor.trim() || null,
      precio: estado.precio,
      huellaCopy: ficha.huellaCopy,
      version: opciones.existente?.version ?? 0,
      creadoEn: '', creadoPor: '', actualizadoEn: '', actualizadoPor: '',
    };
    pintarVistaPrevia({
      contenedor: columnaPrevia,
      ficha: fichaPublicaDe(ficha, capa, nombreVendedor),
      esEnsayo: true,
    });
  }

  // --- Cómo se vende: la ficha INTERNA, arriba de todo y plegada -----------
  //
  // ⛔ Va antes de preparar nada, porque decidir qué mostrarle a ESTE cliente
  //    se hace mejor sabiendo qué le duele y qué preguntarle. Plegada, porque
  //    el vendedor entró a preparar, no a estudiar.
  // ⛔ Nunca sale al cliente: no hay enlace ni documento que la lleve.
  const cajaInterna = crear('div', { clase: 'fichas-interna-lugar' });
  columnaPreparar.append(cajaInterna);
  void datos.fichaInternaDeProducto(productoId).then((r) => {
    if (senal.aborted || !r.ok) return;
    pintarFichaInterna({ contenedor: cajaInterna, ficha: r.datos });
  });

  const leerEstado = montarPreparar({
    ficha,
    contenedor: columnaPreparar,
    estadoInicial: inicial,
    alCambiar: repintarPrevia,
  });
  repintarPrevia(inicial);

  // --- Guardar -------------------------------------------------------------
  if (!opciones.alGuardar) return;

  const barra = crear('div', { clase: 'fichas-barra' });
  const guardar = crear('button', { clase: 'fichas-btn fichas-btn--activo', texto: 'Guardar la ficha', atributos: { type: 'button' } });
  const estadoGuardado = crear('span', { clase: 'fichas-ayuda', atributos: { role: 'status' } });

  guardar.addEventListener('click', () => {
    const estado = leerEstado();
    guardar.disabled = true;
    estadoGuardado.textContent = 'Guardando…';
    void datos.prepararFicha(
      {
        productoId, clienteId,
        bloques: estado.bloques as ReadonlyArray<PersonalizacionBloque>,
        ...(estado.loQueConversamos.trim() ? { loQueConversamos: estado.loQueConversamos.trim() } : {}),
        ...(estado.notaDelVendedor.trim() ? { notaDelVendedor: estado.notaDelVendedor.trim() } : {}),
        ...(estado.precio ? { precio: estado.precio } : {}),
      },
      `ficha-${clienteId}-${productoId}-${Date.now()}`,
    ).then((r) => {
      if (senal.aborted) return;
      guardar.disabled = false;
      if (!r.ok) { estadoGuardado.textContent = r.error.mensajeAmable; return; }
      estadoGuardado.textContent = 'Guardada.';
      opciones.alGuardar?.(r.datos);
    });
  });

  barra.append(guardar, estadoGuardado);
  columnaPreparar.append(barra);
}
