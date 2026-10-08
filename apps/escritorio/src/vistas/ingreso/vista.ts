/**
 * Ingreso — usuario y contraseña.
 *
 * ⛔ DUEÑO: SESIÓN 1.
 *
 * UN SOLO LOGIN para toda la aplicación. La sesión trae el rol; el rol decide
 * qué rutas se dibujan. ⛔ No hay una pantalla de ingreso de administrador.
 *
 * Reglas:
 *   - Mensaje de error genérico ante credenciales inválidas: ⛔ no revela si el
 *     usuario existe.
 *   - Cada ingreso e intento fallido queda en RegistroAcceso.
 *   - Accesible: etiquetas reales, foco visible, envío con Enter.
 */

import type { CapaDatos, Sesion } from '@labia/compartido';
import type { ContextoVista, Vista } from '../../nucleo/contrato-vista';
import './ingreso.css';

/** Los cuatro estados del contrato, en esta pantalla. */
export type EstadoIngreso =
  /** cargando: se comprueba si ya había sesión abierta */
  | { readonly nombre: 'comprobando' }
  /** vacío: el formulario limpio, que es el arranque esperado */
  | { readonly nombre: 'formulario' }
  /** cargando: credenciales en camino */
  | { readonly nombre: 'enviando' }
  /** error: con lenguaje claro y reintento */
  | { readonly nombre: 'error'; readonly mensaje: string; readonly pista: string }
  /** con datos: hay sesión */
  | { readonly nombre: 'ingresado'; readonly sesion: Sesion };

export interface OpcionesIngreso {
  /** Se llama con la sesión resuelta: el núcleo decide a dónde ir. */
  readonly alIngresar: (sesion: Sesion) => void;
}

const TITULO = 'Escritorio Vendedores';
const BAJADA = 'Ingresá con tu usuario y contraseña.';
/** ⛔ Un solo texto de fallo: no revela si el usuario existe (MASTER_SPEC §1.3). */
const ERROR_GENERICO = 'Usuario o contraseña incorrectos.';
const PISTA_GENERICA = 'Revisá los datos e intentá otra vez.';
const FALTAN_DATOS = 'Completá tu usuario y tu contraseña.';

export function crearVista(opciones: OpcionesIngreso): Vista {
  let raiz: HTMLElement | null = null;
  let datos: CapaDatos | null = null;
  let datosDeEjemplo = false;
  let senal: AbortSignal | null = null;
  let estado: EstadoIngreso = { nombre: 'comprobando' };
  /** Se conserva lo tecleado entre estados: un error no borra el trabajo. */
  let usuarioEscrito = '';

  function fijar(nuevo: EstadoIngreso): void {
    estado = nuevo;
    dibujar();
  }

  function pantalla(): HTMLElement {
    const seccion = document.createElement('section');
    seccion.className = 'ingreso';
    return seccion;
  }

  function tarjeta(padre: HTMLElement): HTMLElement {
    const caja = document.createElement('div');
    caja.className = 'ingreso-tarjeta';
    padre.appendChild(caja);

    const marca = document.createElement('div');
    marca.className = 'ingreso-marca';
    const h1 = document.createElement('h1');
    h1.className = 'ingreso-titulo';
    h1.textContent = TITULO;
    const bajada = document.createElement('p');
    bajada.className = 'ingreso-bajada';
    bajada.textContent = BAJADA;
    marca.append(h1, bajada);
    caja.appendChild(marca);

    /** ⛔ Con mock, el chip es permanente: nunca un dato ficticio como real. */
    if (datosDeEjemplo) {
      const chip = document.createElement('span');
      chip.className = 'ingreso-chip';
      chip.textContent = 'Datos de ejemplo';
      caja.appendChild(chip);
    }
    return caja;
  }

  function campo(
    formulario: HTMLElement,
    id: string,
    etiqueta: string,
    tipo: 'text' | 'password',
    autocompletado: AutoFill,
    valor: string,
  ): HTMLInputElement {
    const envoltura = document.createElement('div');
    envoltura.className = 'ingreso-campo';

    /** Etiqueta real, asociada por `for`. ⛔ Nunca un placeholder como etiqueta. */
    const rotulo = document.createElement('label');
    rotulo.className = 'ingreso-etiqueta';
    rotulo.htmlFor = id;
    rotulo.textContent = etiqueta;

    const entrada = document.createElement('input');
    entrada.className = 'ingreso-entrada';
    entrada.id = id;
    entrada.name = id;
    entrada.type = tipo;
    entrada.autocomplete = autocompletado;
    entrada.required = true;
    entrada.value = valor;
    entrada.setAttribute('aria-describedby', 'ingreso-mensaje');

    envoltura.append(rotulo, entrada);
    formulario.appendChild(envoltura);
    return entrada;
  }

  function bloqueCargando(caja: HTMLElement, texto: string): void {
    const aviso = document.createElement('p');
    aviso.className = 'ingreso-bajada';
    aviso.setAttribute('role', 'status');
    aviso.textContent = texto;
    const hueso1 = document.createElement('div');
    hueso1.className = 'ingreso-hueso ingreso-hueso--corto';
    const hueso2 = document.createElement('div');
    hueso2.className = 'ingreso-hueso';
    const hueso3 = document.createElement('div');
    hueso3.className = 'ingreso-hueso';
    caja.append(aviso, hueso1, hueso2, hueso3);
  }

  function dibujar(): void {
    if (!raiz) return;
    raiz.replaceChildren();
    const seccion = pantalla();
    raiz.appendChild(seccion);
    const caja = tarjeta(seccion);

    if (estado.nombre === 'comprobando') {
      bloqueCargando(caja, 'Comprobando tu sesión…');
      return;
    }
    if (estado.nombre === 'ingresado') {
      bloqueCargando(caja, 'Entrando al Escritorio…');
      return;
    }

    const formulario = document.createElement('form');
    formulario.className = 'ingreso-formulario';
    formulario.noValidate = true;
    caja.appendChild(formulario);

    const usuario = campo(formulario, 'ingreso-usuario', 'Usuario', 'text', 'username', usuarioEscrito);
    const clave = campo(formulario, 'ingreso-clave', 'Contraseña', 'password', 'current-password', '');

    /**
     * Región de mensajes: `role="alert"` para que el lector de pantalla lo
     * anuncie, y `aria-describedby` en los dos campos (QA_CHECKLIST §7.4.7).
     */
    const mensaje = document.createElement('div');
    mensaje.id = 'ingreso-mensaje';
    mensaje.setAttribute('role', 'alert');
    mensaje.setAttribute('aria-live', 'assertive');
    formulario.appendChild(mensaje);

    if (estado.nombre === 'error') {
      const caja2 = document.createElement('div');
      caja2.className = 'ingreso-error';
      const texto = document.createElement('strong');
      texto.textContent = estado.mensaje;
      const pista = document.createElement('span');
      pista.className = 'ingreso-error-pista';
      pista.textContent = estado.pista;
      caja2.append(texto, pista);
      mensaje.appendChild(caja2);
      usuario.setAttribute('aria-invalid', 'true');
      clave.setAttribute('aria-invalid', 'true');
    }

    const enviando = estado.nombre === 'enviando';

    /**
     * `type="submit"`: Enter envía el formulario sin ningún atajo de teclado
     * propio. ⛔ Nunca un `div` con onclick.
     */
    const boton = document.createElement('button');
    boton.className = 'ingreso-boton';
    boton.type = 'submit';
    boton.textContent = enviando ? 'Ingresando…' : 'Ingresar';
    boton.disabled = enviando;
    formulario.appendChild(boton);

    const pie = document.createElement('p');
    pie.className = 'ingreso-pie';
    pie.textContent = datosDeEjemplo
      ? 'Este Escritorio corre con datos de ejemplo: nada de lo que veas es real.'
      : 'Cada ingreso y cada intento fallido quedan registrados.';
    caja.appendChild(pie);

    formulario.addEventListener('submit', (evento) => {
      evento.preventDefault();
      usuarioEscrito = usuario.value;
      void enviar(usuario.value, clave.value);
    });

    usuario.addEventListener('input', () => { usuarioEscrito = usuario.value; });

    /** El foco va al primer campo con problema, o al primero vacío. */
    if (estado.nombre === 'error') usuario.focus();
    else if (usuario.value.trim() === '') usuario.focus();
    else clave.focus();
  }

  async function enviar(usuario: string, clave: string): Promise<void> {
    if (usuario.trim() === '' || clave === '') {
      fijar({ nombre: 'error', mensaje: FALTAN_DATOS, pista: PISTA_GENERICA });
      return;
    }
    if (!datos) return;
    fijar({ nombre: 'enviando' });

    const resultado = await datos.ingresar(usuario.trim(), clave);
    if (senal?.aborted === true) return;

    if (!resultado.ok) {
      /**
       * ⛔ Ante credenciales inválidas, siempre el MISMO texto: el mensaje del
       *    servidor no puede filtrar si el usuario existe. Los demás errores
       *    (servicio caído, tiempo agotado, endpoint inexistente) sí se muestran
       *    tal cual, porque no dicen nada del usuario y el vendedor necesita
       *    saber qué pasó: presentar un servidor caído como "contraseña mala"
       *    manda a la gente a cambiar su clave por nada.
       */
      const filtrable = resultado.error.codigo === 'credenciales_invalidas'
        || resultado.error.codigo === 'no_autenticado';
      fijar({
        nombre: 'error',
        mensaje: filtrable ? ERROR_GENERICO : resultado.error.mensajeAmable,
        pista: filtrable ? PISTA_GENERICA : (resultado.error.pista ?? PISTA_GENERICA),
      });
      return;
    }

    fijar({ nombre: 'ingresado', sesion: resultado.datos });
    opciones.alIngresar(resultado.datos);
  }

  return {
    async montar(contexto: ContextoVista): Promise<void> {
      raiz = contexto.raiz;
      datos = contexto.datos;
      datosDeEjemplo = contexto.datosDeEjemplo;
      senal = contexto.senal;

      /** El estado cargando se dibuja ANTES de pedir nada (§7.5.4). */
      fijar({ nombre: 'comprobando' });

      const actual = await datos.sesionActual();
      if (senal.aborted) return;

      if (actual.ok) {
        fijar({ nombre: 'ingresado', sesion: actual.datos });
        opciones.alIngresar(actual.datos);
        return;
      }
      /** Sin sesión previa: el formulario limpio es el arranque esperado. */
      fijar({ nombre: 'formulario' });
    },

    desmontar(): void {
      raiz?.replaceChildren();
      raiz = null;
      datos = null;
      senal = null;
    },
  };
}

/** Estado actual, para las pruebas del núcleo. */
export const TEXTOS_INGRESO = {
  titulo: TITULO,
  errorGenerico: ERROR_GENERICO,
  faltanDatos: FALTAN_DATOS,
} as const;
