/**
 * Inicio — la pantalla de arranque del vendedor.
 *
 * ⛔ CAMBIO PEDIDO POR EL CEO (25-09-2026). Antes esta pantalla mostraba
 *    dinero vendido · dinero cobrado · comisión acumulada · comisión pendiente.
 *    Ahora muestra las CUATRO cifras del negocio, en el orden en que él las
 *    nombró, más un marcador circular de visitas:
 *
 *      1. Ventas acumuladas a hoy      (todo lo vendido: setup + mensualidades)
 *      2. Ventas en setup al día de hoy (la parte de una sola vez)
 *      3. Mensualidades cobradas hasta hoy
 *      4. Mensualidades a cobrar
 *
 *    Las tres últimas SUMAN la primera. No es casualidad: así el vendedor ve
 *    un total y de dónde sale, sin tener que creerle a cuatro cifras sueltas.
 *
 *    La comisión no desapareció: vive en `#/dinero`, que es donde se liquida.
 *
 * ⛔ SIGUE PROHIBIDO acá: gráficos decorativos, embudos de conversión, tasas
 *    de cierre, mezcla de productos. No existe ningún tipo en este archivo que
 *    permita dibujarlos: lo que no está en el contrato no se puede graficar.
 *
 * Ver MASTER_SPEC.md §2.1, USER_FLOWS.md F1.
 */

import type { Id, ISODate, TotalesPorMoneda } from './core';
import type { CanalPreferido } from './clientes';

/**
 * El marcador circular de visitas — la zanahoria.
 *
 * La regla comercial es una investigación/visita por día hábil. El círculo se
 * llena al llegar al objetivo de la semana.
 *
 * ⛔ `objetivo` NO está clavado en el código: sale de `parametros_sistema`,
 *    igual que los meses de participación del vendedor. Si mañana el objetivo
 *    pasa a 7, se cambia el parámetro, no el programa.
 */
export interface MarcadorVisitas {
  /** Investigaciones que el vendedor registró en la semana en curso. */
  readonly hechas: number;
  /** Cuántas hacen el 100 %. Configurable; hoy arranca en 6 (lunes a sábado). */
  readonly objetivo: number;
  /** Lunes de la semana en curso, en hora de Asunción. */
  readonly desde: ISODate;
  /** Domingo de la semana en curso, en hora de Asunción. */
  readonly hasta: ISODate;
}

/** Las cuatro cifras de Inicio más el marcador. Todo el dinero, por moneda. */
export interface ResumenInicio {
  /** Todo lo vendido hasta hoy: setup + mensualidades (cobradas y por cobrar). */
  readonly ventasAcumuladas: TotalesPorMoneda;
  /** La parte de una sola vez: el setup de todo lo vendido hasta hoy. */
  readonly ventasEnSetup: TotalesPorMoneda;
  /** Mensualidades efectivamente cobradas hasta hoy. */
  readonly mensualidadesCobradas: TotalesPorMoneda;
  /** Mensualidades emitidas que todavía no entraron (pendientes y atrasadas). */
  readonly mensualidadesACobrar: TotalesPorMoneda;
  readonly visitas: MarcadorVisitas;
  /** `true` cuando el vendedor todavía no registró ninguna venta. */
  readonly sinDatosTodavia: boolean;
  readonly periodo: string;
}

export interface ProximoSeguimiento {
  readonly id: Id;
  readonly clienteId: Id;
  readonly nombreCliente: string;
  readonly titulo: string;
  readonly venceEn: ISODate | null;
  readonly vencido: boolean;
  readonly canal: CanalPreferido | null;
  readonly origen: 'paso_seguimiento' | 'objetivo_plan' | 'apertura_enlace' | 'manual';
  readonly referenciaId: Id;
}

/**
 * Las dos acciones protagonistas.
 *
 * Desde el cambio del 25-09-2026 no viven en Inicio: viven en la PÁGINA DE
 * BÚSQUEDA (`#/planificar`), que es una sola pantalla limpia con dos campos.
 * Inicio conserva un único acceso a esa página, debajo del marcador de visitas:
 * el tablero muestra cómo vas, y el botón es lo que hacés al respecto.
 *
 * El vendedor empieza por gente que conoce: el amigo con la repuestera, el
 * pariente con el restaurante, el médico, el abogado, la odontóloga, la
 * peluquería, el hotel, el motel. El sistema recibe ese nombre y devuelve un
 * plan; no le pide primero que cargue un CRM.
 */
export type AccionProtagonista = 'investigar_conocido' | 'explorar_rubro';

export interface DefinicionAccion {
  readonly accion: AccionProtagonista;
  readonly titulo: string;
  /** Ejemplo en lenguaje real: "Mi amigo tiene una repuestera". */
  readonly ejemplo: string;
  readonly ruta: string;
}
