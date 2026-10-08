/**
 * Captura de un seguimiento: convertir lo que el vendedor dictó o escribió en
 * una propuesta estructurada.
 *
 * ⛔ Esto NO PERSISTE NADA. Devuelve una propuesta para que la persona la
 *    revise y confirme. La regla dura de MASTER_SPEC §2.3 —nada derivado de
 *    voz o texto se guarda sin confirmación humana— se cumple porque este
 *    módulo no tiene por dónde escribir.
 *
 * ⛔ Y nunca inventa un producto: lo que no corresponde a uno de los 13 sale
 *    por `mencionesFueraDeCatalogo`, que es una lista de frases, no de
 *    productos. Un texto que habla de "una app de reservas" no se convierte
 *    en Agendar.IA por su cuenta.
 *
 * Vive acá, y no en el mock, porque es lógica de verdad y la usan las dos
 * capas de datos. Tenerla en un solo lugar es lo que garantiza que el
 * Escritorio se comporte igual contra los datos de ejemplo y contra el
 * servidor.
 */

import type { ProductoId } from './catalogo';
import type { EtapaCliente } from './clientes';
import type { ISODate } from './core';
import type { CapturaSeguimiento, PasoSugerido, PropuestaDeSeguimiento } from './seguimiento';

/** Paso tal como se propone: todavía sin id, sin estado y sin resolución. */
export type PasoPropuesto = Omit<PasoSugerido, 'id' | 'seguimientoId' | 'estado' | 'resueltoEn'>;

const PALABRAS_CLAVE_PRODUCTO: ReadonlyArray<readonly [ProductoId, ReadonlyArray<string>]> = [
  ['vendedor-24-7', ['whatsapp', 'consulta fuera de horario', 'atiende de noche']],
  ['radar-stock', ['stock', 'inventario', 'reponer']],
  ['precio-vivo', ['precio', 'lista de precios', 'actualizar precios']],
  ['ruta-ia', ['reparto', 'ruta', 'delivery', 'repartidor']],
  ['agendar-ia', ['turno', 'agenda de turnos', 'reserva']],
  ['smart-commerce', ['tienda online', 'ecommerce', 'venta online', 'sucursal digital']],
  ['park-ia', ['estacionamiento', 'playa de auto', 'parking']],
  ['exeq-ia', ['encuesta', 'experiencia del cliente', 'satisfacción']],
  ['merma-ia', ['merma', 'vencimiento de mercadería', 'pérdida de stock']],
  ['cotiza-facil', ['cotización', 'presupuesto rápido']],
  ['pulso-digital', ['reseña', 'opinión de clientes', 'reputación']],
  ['ojo-digital', ['cámara', 'vidriera', 'circulación de gente']],
  ['faro-digital', ['promoción', 'aviso', 'publicidad digital']],
];

const FRASES_FUERA_DE_CATALOGO = ['otro sistema', 'una app de', 'un software de', 'una planilla de'];

function enDias(dias: number): ISODate {
  const base = new Date();
  base.setUTCDate(base.getUTCDate() + dias);
  return base.toISOString();
}

/** ⛔ Sólo ids del catálogo cerrado. Lo que no está acá, no sale de acá. */
export function detectarProductos(texto: string): ProductoId[] {
  const minusculas = texto.toLowerCase();
  const detectados: ProductoId[] = [];
  for (const [id, claves] of PALABRAS_CLAVE_PRODUCTO) {
    if (claves.some((clave) => minusculas.includes(clave))) detectados.push(id);
  }
  return detectados;
}

/**
 * Menciones que NO corresponden a ninguno de los 13.
 * ⛔ Nunca se convierten en producto: a lo sumo, en una sugerencia.
 */
export function detectarMencionesFueraDeCatalogo(texto: string): string[] {
  const minusculas = texto.toLowerCase();
  return FRASES_FUERA_DE_CATALOGO.filter((frase) => minusculas.includes(frase));
}

export function sugerirEtapa(texto: string): EtapaCliente | null {
  const minusculas = texto.toLowerCase();
  if (/cerr(ó|o)|acept(ó|o)|compr(ó|o)|firm(ó|o)/.test(minusculas)) return 'ganado';
  if (/no le interes(ó|a)|rechaz(ó|a)|se baj(ó|a)/.test(minusculas)) return 'perdido';
  if (/cotizaci(ó|o)n|presupuesto/.test(minusculas)) return 'cotizacion';
  if (/present(é|e)|mostr(é|e)|hicimos la demo/.test(minusculas)) return 'presentacion';
  if (/diagnostic|relevamiento|entendimos el negocio/.test(minusculas)) return 'diagnostico';
  return null;
}

export function detectarPasos(texto: string): PasoPropuesto[] {
  const minusculas = texto.toLowerCase();
  const pasos: PasoPropuesto[] = [];
  if (/llamar|volver a llamar/.test(minusculas)) {
    pasos.push({ titulo: 'Llamar para seguir la conversación', venceEn: enDias(2) });
  }
  if (/enviar|mandar|compartir/.test(minusculas)) {
    pasos.push({ titulo: 'Enviar la información conversada', venceEn: enDias(1) });
  }
  if (/visitar|pasar por|ir al local/.test(minusculas)) {
    pasos.push({ titulo: 'Coordinar una visita', venceEn: enDias(5) });
  }
  if (pasos.length === 0) {
    pasos.push({ titulo: 'Retomar contacto', venceEn: enDias(3) });
  }
  return pasos;
}

/** La propuesta completa. ⛔ No escribe: devuelve. */
export function estructurarCaptura(entrada: CapturaSeguimiento): PropuestaDeSeguimiento {
  const texto = entrada.texto.trim();
  return {
    notaEstructurada: texto,
    pasosPropuestos: detectarPasos(entrada.texto),
    etapaSugerida: sugerirEtapa(entrada.texto),
    productosMencionados: detectarProductos(entrada.texto),
    mencionesFueraDeCatalogo: detectarMencionesFueraDeCatalogo(entrada.texto),
    borradorRespuesta:
      texto.length > 0
        ? 'Gracias por la charla de hoy. Te comparto lo que conversamos y quedo atento/a a tu confirmación.'
        : null,
  };
}
