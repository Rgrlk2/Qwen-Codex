/**
 * Dictado y grabación — vista Clientes.
 *
 * ⛔ DUEÑO: Sesión 4.
 *
 * ⛔ Pide permiso de micrófono y AVISA EXPLÍCITAMENTE que está grabando.
 * ⛔ Sin soporte de dictado: se informa con texto claro y se ofrece el camino
 *    de texto. NUNCA UN BOTÓN INERTE.
 *
 * El servidor mock (`CapaClientes.soporteDictado`) dice si el circuito de
 * dictado está habilitado; este módulo además comprueba que el navegador
 * tenga cámara de grabación (MediaRecorder) y reconocimiento de voz.
 */

import type { CapaDatos, SoporteDictado } from '@labia/compartido';

interface ResultadoReconocimiento {
  readonly isFinal: boolean;
  readonly 0: { readonly transcript: string };
}
interface ListaResultadosReconocimiento {
  readonly length: number;
  [indice: number]: ResultadoReconocimiento;
}
interface EventoReconocimiento extends Event {
  readonly results: ListaResultadosReconocimiento;
  readonly resultIndex: number;
}
interface ReconocimientoDeVoz extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((evento: EventoReconocimiento) => void) | null;
  onerror: ((evento: Event) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
interface VentanaConDictado extends Window {
  SpeechRecognition?: new () => ReconocimientoDeVoz;
  webkitSpeechRecognition?: new () => ReconocimientoDeVoz;
}

function obtenerConstructorReconocimiento(): (new () => ReconocimientoDeVoz) | null {
  const ventana = window as VentanaConDictado;
  return ventana.SpeechRecognition ?? ventana.webkitSpeechRecognition ?? null;
}

export async function verificarSoporteDictado(datos: CapaDatos): Promise<SoporteDictado> {
  const resultado = await datos.soporteDictado();
  if (!resultado.ok) {
    return { disponible: false, motivoNoDisponible: 'No pudimos confirmar el soporte de dictado en este momento.' };
  }
  if (!resultado.datos.disponible) return resultado.datos;
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return { disponible: false, motivoNoDisponible: 'Este navegador no permite grabar audio. Usá el camino de texto.' };
  }
  if (!obtenerConstructorReconocimiento()) {
    return { disponible: false, motivoNoDisponible: 'Este navegador no ofrece dictado por voz. Usá el camino de texto.' };
  }
  return { disponible: true, motivoNoDisponible: null };
}

export interface ControladorGrabacion {
  /** Detiene la grabación y libera el micrófono. Devuelve el audio final. */
  detener(): Promise<{ blob: Blob; segundos: number }>;
  /** Corta sin guardar nada. */
  cancelar(): void;
}

export async function iniciarGrabacion(
  onTranscripcion: (texto: string) => void,
  onError: (mensaje: string) => void,
): Promise<ControladorGrabacion> {
  const flujo = await navigator.mediaDevices.getUserMedia({ audio: true });
  const inicioEn = Date.now();
  const trozos: Blob[] = [];
  const grabador = new MediaRecorder(flujo);
  grabador.addEventListener('dataavailable', (evento) => {
    if (evento.data.size > 0) trozos.push(evento.data);
  });
  grabador.start();

  let transcripcionAcumulada = '';
  const Constructor = obtenerConstructorReconocimiento();
  const reconocedor = Constructor ? new Constructor() : null;
  if (reconocedor) {
    reconocedor.lang = 'es-PY';
    reconocedor.continuous = true;
    reconocedor.interimResults = true;
    reconocedor.onresult = (evento) => {
      let interina = '';
      for (let i = evento.resultIndex; i < evento.results.length; i += 1) {
        const resultado = evento.results[i];
        if (!resultado) continue;
        if (resultado.isFinal) transcripcionAcumulada += `${resultado[0].transcript} `;
        else interina += resultado[0].transcript;
      }
      onTranscripcion((transcripcionAcumulada + interina).trim());
    };
    reconocedor.onerror = () => onError('El dictado se interrumpió. Podés seguir grabando o pasar a texto.');
    try {
      reconocedor.start();
    } catch {
      onError('No se pudo iniciar el reconocimiento de voz en este dispositivo.');
    }
  }

  function detenerTodo(): void {
    if (grabador.state !== 'inactive') grabador.stop();
    for (const pista of flujo.getTracks()) pista.stop();
    if (reconocedor) {
      reconocedor.onresult = null;
      reconocedor.onerror = null;
      try {
        reconocedor.stop();
      } catch {
        // Ya estaba detenido: no es un error para el usuario.
      }
    }
  }

  return {
    detener(): Promise<{ blob: Blob; segundos: number }> {
      return new Promise((resolve) => {
        grabador.addEventListener(
          'stop',
          () => {
            const blob = new Blob(trozos, { type: grabador.mimeType || 'audio/webm' });
            resolve({ blob, segundos: Math.round((Date.now() - inicioEn) / 1000) });
          },
          { once: true },
        );
        detenerTodo();
      });
    },
    cancelar(): void {
      detenerTodo();
    },
  };
}
