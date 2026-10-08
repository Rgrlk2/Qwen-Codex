/**
 * Firmas, enlace de respuesta del cliente, constancia y notificaciones.
 *
 * Circuito obligatorio:
 *   borrador del vendedor → revisión del CEO → aprobación o corrección
 *   → incorporación de firmas → PDF definitivo → enlace para el cliente
 *
 * ⛔ La firma del vendedor se registra ANTES de enviar a revisión.
 * ⛔ La firma del CEO se incorpora CUANDO APRUEBA.
 * ⛔ Una modificación posterior anula la aprobación y las firmas anteriores.
 * ⛔ Las firmas son activos protegidos servidos desde el servidor. La imagen
 *    original de la firma del CEO NO se expone por ninguna URL pública.
 *
 * Ver MASTER_SPEC.md §11.1 a §11.3, COMMERCIAL_RULES.md §8, USER_FLOWS.md F10 a F12.
 */

import type { Dinero, Id, ISODate } from './core';
import type { CodigoAlternativa } from './alternativas';

// ---------------------------------------------------------------------------
// Firmas
// ---------------------------------------------------------------------------

export type RolFirmante = 'vendedor' | 'ceo';

/**
 * Una firma incorporada a un documento.
 *
 * ⛔ `referenciaProtegida` es un identificador interno que SÓLO el servidor
 *    puede resolver a la imagen. No es una URL, no es un nombre de archivo, y
 *    no se puede adivinar. El PDF incrusta la imagen al generarse, en el
 *    servidor; el navegador nunca la descarga por separado.
 */
export interface Firma {
  readonly id: Id;
  readonly rol: RolFirmante;
  readonly firmanteId: Id;
  readonly nombreFirmante: string;
  readonly aclaracion: string;
  readonly referenciaProtegida: string;
  readonly firmadoEn: ISODate;
  /** Versión de la cotización que se firmó. Cambia la versión, cae la firma. */
  readonly versionFirmada: number;
  /** `true` cuando una edición posterior la invalidó. */
  readonly anulada: boolean;
  readonly anuladaEn: ISODate | null;
  readonly motivoAnulacion: string | null;
}

// ---------------------------------------------------------------------------
// Enlace de respuesta del cliente
// ---------------------------------------------------------------------------

/** Lo que el cliente ve. ⛔ Sin datos internos, sin otras cotizaciones, sin precios de terceros. */
export interface CotizacionPublica {
  readonly nombreCliente: string;
  readonly nombreProducto: string;
  readonly variante: string | null;
  readonly folio: string;
  readonly version: number;
  readonly emitidaEn: ISODate;
  readonly venceEn: ISODate;
  /** Las alternativas aprobadas, con su total. ⛔ Son excluyentes. */
  readonly alternativas: ReadonlyArray<AlternativaPublica>;
  readonly basesYCondiciones: string;
  readonly pdfDisponible: boolean;
  /** `true` cuando la oferta ya venció: se muestra sin importes. */
  readonly vencida: boolean;
}

export interface AlternativaPublica {
  readonly codigo: CodigoAlternativa;
  readonly nombre: string;
  readonly totalFinal: Dinero;
  readonly setupAPagar: Dinero;
  readonly importeCuota: Dinero;
  readonly cantidadCuotas: number;
  readonly mesesServicio: number;
  readonly permanenciaMinimaMeses: number;
  readonly formaDePago: string;
}

/**
 * Lo que el cliente puede responder.
 *
 * ⛔ Las cuatro alternativas económicas son EXCLUYENTES: la interfaz usa
 *    botones de opción, nunca casillas múltiples.
 */
export type OpcionRespuesta =
  | 'estandar'
  | 'adelantado_12'
  | 'adelantado_24'
  | 'diferido'
  | 'contactar_antes'
  | 'no_continuar';

/** Texto exacto de cada opción, tal como lo ve el cliente. */
export const TEXTOS_OPCION: Readonly<Record<OpcionRespuesta, string>> = {
  estandar: 'Elijo el plan estándar.',
  adelantado_12: 'Elijo pago adelantado por 12 meses.',
  adelantado_24: 'Elijo pago adelantado por 24 meses.',
  diferido: 'Elijo cheques diferidos o débito automático.',
  contactar_antes: 'Quiero que me contacten antes de elegir.',
  no_continuar: 'No continuar por ahora.',
};

/** ⛔ Obligatoria. Sin esto marcado, el botón de envío no habilita. */
export const TEXTO_ACEPTACION =
  'He revisado la opción seleccionada y solicito que Lab.IA continúe con los próximos pasos.';

export const TEXTO_BOTON_ENVIO = 'Enviar mi elección';

export interface RespuestaDelCliente {
  readonly opcion: OpcionRespuesta;
  /** ⛔ Tiene que ser `true`. Sin esto, `validacion`. */
  readonly aceptacionMarcada: true;
}

// ---------------------------------------------------------------------------
// Constancia
// ---------------------------------------------------------------------------

/**
 * Registro inmutable de la respuesta del cliente.
 *
 * ⛔ Funciona como CONSTANCIA COMERCIAL o aval de intención.
 *    NO es un contrato. NO es una firma electrónica legal.
 *    La interfaz y el documento lo dicen con esas palabras.
 */
export interface ConstanciaRespuesta {
  readonly id: Id;
  readonly clienteId: Id;
  readonly nombreCliente: string;
  readonly cotizacionId: Id;
  readonly folio: string;
  /** La versión exacta que el cliente vio y aceptó. */
  readonly versionCotizacion: number;
  readonly opcionSeleccionada: OpcionRespuesta;
  /** Los importes de la alternativa elegida, congelados. `null` si no eligió una. */
  readonly importesAceptados: AlternativaPublica | null;
  readonly respondidaEn: ISODate;
  readonly venceEn: ISODate;
  /** El texto de aceptación tal como estaba al momento de marcarlo. */
  readonly textoAceptacion: string;
  /** Identificación del enlace por el que respondió. */
  readonly enlaceId: Id;
  /** Huella del PDF aprobado que el cliente tuvo a la vista. */
  readonly huellaDocumento: string;
  /** ⛔ Recordatorio en el propio registro: no es un contrato. */
  readonly naturaleza: 'constancia_comercial';
}

// ---------------------------------------------------------------------------
// Notificaciones
// ---------------------------------------------------------------------------

export type CanalNotificacion =
  | 'celular_vendedor'
  | 'whatsapp_corporativo'
  | 'celular_ceo'
  | 'panel_administracion';

export type EstadoNotificacion = 'pendiente' | 'enviada' | 'fallida' | 'reintentando';

/**
 * Un intento de notificación.
 *
 * ⛔ El destino NO se guarda acá en claro para `celular_ceo`: se referencia por
 *    `destinoProtegido`, que sólo el servidor resuelve. El número personal del
 *    CEO nunca aparece en el enlace, en el PDF ni en código del navegador.
 */
export interface Notificacion {
  readonly id: Id;
  readonly constanciaId: Id;
  readonly canal: CanalNotificacion;
  /** Referencia interna al destino. ⛔ Nunca el número en claro. */
  readonly destinoProtegido: string;
  readonly estado: EstadoNotificacion;
  readonly intentos: number;
  readonly ultimoIntentoEn: ISODate | null;
  readonly proximoIntentoEn: ISODate | null;
  readonly error: string | null;
}

/**
 * ⛔ Si una notificación falla, la constancia SE CONSERVA igual y el aviso se
 *    reintenta. Nunca se pierde la elección del cliente por un fallo de aviso.
 */
export interface ResultadoNotificaciones {
  readonly constanciaId: Id;
  readonly notificaciones: ReadonlyArray<Notificacion>;
  readonly constanciaGuardada: true;
  readonly avisosPendientes: number;
}

/**
 * Configuración de destinos. ⛔ VIVE SÓLO EN EL SERVIDOR.
 *
 * El WhatsApp corporativo es público y está documentado en la guía de marca.
 * El celular del CEO es configurable y nunca sale del servidor: el cliente
 * recibe únicamente el estado del envío, jamás el destino.
 */
export interface DestinosNotificacion {
  /** Público y corporativo. */
  readonly whatsappCorporativo: '+595 984 355775';
  /** ⛔ Sólo servidor. Acá se expone si está configurado, nunca su valor. */
  readonly celularCeoConfigurado: boolean;
  readonly celularVendedorConfigurado: boolean;
}
