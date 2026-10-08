/**
 * Inicio — la pantalla de arranque del vendedor.
 *
 * "La planificación es el comienzo": esta pantalla muestra plata, próximos
 * seguimientos y DOS ACCIONES PROTAGONISTAS. Nada más.
 *
 * ⛔ PROHIBIDO en esta vista: gráficos decorativos, embudos de conversión,
 *    tasas de cierre, mezcla de productos. No existe ningún tipo acá que
 *    permita dibujarlos: lo que no está en el contrato no se puede graficar.
 *
 * Ver MASTER_SPEC.md §2.1, USER_FLOWS.md F1.
 */

import type { Id, ISODate, TotalesPorMoneda } from './core';
import type { CanalPreferido } from './clientes';

/** Las cuatro cifras de Inicio. Todas por moneda. */
export interface ResumenInicio {
  readonly dineroVendido: TotalesPorMoneda;
  readonly dineroCobrado: TotalesPorMoneda;
  readonly comisionAcumulada: TotalesPorMoneda;
  readonly comisionPendiente: TotalesPorMoneda;
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
 * Son el elemento visual DOMINANTE de la pantalla: ocupan más superficie que
 * las cuatro cifras juntas. Con la cuenta vacía, quedan como lo único accionable.
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
