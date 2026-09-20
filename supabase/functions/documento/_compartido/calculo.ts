// ⛔ ARCHIVO GENERADO. No se edita acá: se edita en packages/compartido/src/
//    y se regenera con `node scripts/copiar-a-funciones.mjs`.
//
//    Trae, TAL CUAL, los símbolos que la función necesita para calcular
//    precios y para mostrarle al cliente los textos exactos. Nada se
//    reescribe: se extrae por nombre y se pega.
//
//    ⛔ La cotización que ve el cliente tiene que dar exactamente los mismos
//       números que la que vio el vendedor. Por eso esto se extrae del
//       original y el script verifica que no se haya separado.

// ==========================================================================
// de packages/compartido/src/core.ts
// ==========================================================================

/**
 * Monedas del portafolio. PYG en 12 productos; USD documentado en Precio Vivo.
 * No hay tipo de cambio institucional definido: ver COMMERCIAL_RULES.md §1 y §11 (X3).
 */
export type Moneda = 'PYG' | 'USD';

/**
 * Importe con moneda. `monto` va en **unidad mínima entera**:
 *  - PYG: guaraníes (sin decimales)
 *  - USD: centavos
 *
 * El parámetro genérico impide sumar monedas distintas en tiempo de compilación.
 */
export interface Dinero<M extends Moneda = Moneda> {
  readonly monto: number;
  readonly moneda: M;
}

// ==========================================================================
// de packages/compartido/src/alternativas.ts
// ==========================================================================

export type CodigoAlternativa = 'estandar' | 'adelantado_12' | 'adelantado_24' | 'diferido';

/** Parámetros de cada alternativa. Fuente única: no se repiten en ningún otro lado. */
export interface ReglaAlternativa {
  readonly codigo: CodigoAlternativa;
  readonly nombre: string;
  /** Meses de servicio que recibe el cliente. */
  readonly mesesServicio: number;
  /** Cuotas que efectivamente paga. En `diferido` es una menos: hay un mes bonificado. */
  readonly cuotasAPagar: number;
  /** Factor sobre la mensualidad especial. 1 = sin descuento. */
  readonly factorMensual: number;
  /** Permanencia mínima comprometida, en meses. */
  readonly permanenciaMinimaMeses: number;
  /** `true` cuando el cliente paga todas las cuotas por adelantado, en un solo pago. */
  readonly pagoUnicoAdelantado: boolean;
  readonly descripcionPago: string;
}

/**
 * Las cuatro reglas. ⛔ No acumulables entre sí.
 *
 * `diferido` recibe 12 meses de servicio y paga 11 cuotas: el mes bonificado
 * es la diferencia entre `mesesServicio` y `cuotasAPagar`.
 */
export const ALTERNATIVAS: ReadonlyArray<ReglaAlternativa> = [
  {
    codigo: 'estandar',
    nombre: 'Plan estándar',
    mesesServicio: 12,
    cuotasAPagar: 12,
    factorMensual: 1,
    permanenciaMinimaMeses: 12,
    pagoUnicoAdelantado: false,
    descripcionPago: 'Setup al inicio y 12 mensualidades.',
  },
  {
    codigo: 'adelantado_12',
    nombre: 'Pago adelantado de 12 meses',
    mesesServicio: 12,
    cuotasAPagar: 12,
    factorMensual: 0.9,
    permanenciaMinimaMeses: 12,
    pagoUnicoAdelantado: true,
    descripcionPago: 'Setup y las 12 mensualidades en un solo pago, con 10 % de descuento.',
  },
  {
    codigo: 'adelantado_24',
    nombre: 'Pago adelantado de 24 meses',
    mesesServicio: 24,
    cuotasAPagar: 24,
    factorMensual: 0.8,
    permanenciaMinimaMeses: 24,
    pagoUnicoAdelantado: true,
    descripcionPago: 'Setup y las 24 mensualidades en un solo pago, con 20 % de descuento.',
  },
  {
    codigo: 'diferido',
    nombre: 'Cheques diferidos o débito automático',
    mesesServicio: 12,
    cuotasAPagar: 11,
    factorMensual: 0.9,
    permanenciaMinimaMeses: 12,
    pagoUnicoAdelantado: false,
    descripcionPago:
      'Setup al inicio y 11 cuotas con 10 % de descuento. Un mes bonificado: recibe 12 meses de servicio.',
  },
];

/** Una cuota del calendario de pago. */
export interface CuotaCalendario {
  readonly numero: number;
  readonly concepto: string;
  readonly importe: Dinero;
  /** Mes relativo desde la aceptación. 0 = al aceptar. */
  readonly mesRelativo: number;
}

export interface AlternativaCalculada {
  readonly codigo: CodigoAlternativa;
  readonly nombre: string;

  /** Lo que costaría todo a precio de lista, por los meses de servicio de esta alternativa. */
  readonly precioTotalLista: Dinero;
  /** Precio especial sin el descuento de la alternativa: S + (M × mesesServicio). */
  readonly precioEspecialSinPromocion: Dinero;
  /** Lo que baja el descuento de la alternativa sobre el precio especial. */
  readonly descuentoAdicional: Dinero;
  /** Diferencia entre el precio de lista y el total final. */
  readonly ahorroTotal: Dinero;

  readonly setupAPagar: Dinero;
  /** Suma de todas las cuotas mensuales que paga. */
  readonly mensualidadesAPagar: Dinero;
  /** Importe de cada cuota. */
  readonly importeCuota: Dinero;
  readonly cantidadCuotas: number;
  readonly mesesServicio: number;
  readonly permanenciaMinimaMeses: number;

  readonly totalFinal: Dinero;
  /** Lo que termina costando el mes de servicio: mensualidades a pagar ÷ meses de servicio. */
  readonly valorMensualEfectivo: Dinero;

  readonly formaDePago: string;
  readonly calendarioPago: ReadonlyArray<CuotaCalendario>;
}

/** Entrada del cálculo. ⛔ Las cuatro monedas tienen que coincidir. */
export interface BaseCalculo {
  readonly setupLista: Dinero;
  /** S — precio especial del setup. */
  readonly setupEspecial: Dinero;
  readonly mensualLista: Dinero;
  /** M — precio mensual especial. */
  readonly mensualEspecial: Dinero;
}

export class MonedasMezcladasError extends Error {
  constructor(monedas: ReadonlyArray<Moneda>) {
    super(`No se pueden mezclar monedas en una cotización: ${[...new Set(monedas)].join(', ')}.`);
    this.name = 'MonedasMezcladasError';
  }
}

/**
 * Redondeo a la unidad mínima de la moneda.
 *
 * `Dinero.monto` ya viene en unidad mínima entera (guaraníes sin decimales,
 * dólares en centavos), así que redondear al entero más cercano es redondear a
 * la unidad mínima. Medio hacia arriba.
 */
function redondear(valor: number): number {
  return Math.round(valor);
}

function dinero(monto: number, moneda: Moneda): Dinero {
  return { monto: redondear(monto), moneda };
}

/** ⛔ Lanza si las cuatro monedas de la base no son la misma. */
export function monedaDeLaBase(base: BaseCalculo): Moneda {
  const monedas = [
    base.setupLista.moneda,
    base.setupEspecial.moneda,
    base.mensualLista.moneda,
    base.mensualEspecial.moneda,
  ];
  const primera = monedas[0]!;
  if (monedas.some((m) => m !== primera)) throw new MonedasMezcladasError(monedas);
  return primera;
}

/**
 * Calcula una alternativa.
 *
 * Detalle de redondeo, que importa:
 *   - En las alternativas de **pago único adelantado** (B y C) el cliente paga
 *     una sola vez, así que el descuento se aplica sobre el total de las
 *     mensualidades y se redondea una vez: `redondear(M × n × factor)`.
 *   - En las alternativas **en cuotas** (A y D) el cliente paga cuota por
 *     cuota, así que se redondea **la cuota** y el total es la cuota por la
 *     cantidad. Si se redondeara el total, las cuotas no sumarían el total y
 *     el cliente tendría razón al reclamar.
 */
export function calcularAlternativa(base: BaseCalculo, regla: ReglaAlternativa): AlternativaCalculada {
  const moneda = monedaDeLaBase(base);
  const S = base.setupEspecial.monto;
  const M = base.mensualEspecial.monto;

  let importeCuota: number;
  let totalMensualidades: number;
  if (regla.pagoUnicoAdelantado) {
    totalMensualidades = redondear(M * regla.cuotasAPagar * regla.factorMensual);
    importeCuota = totalMensualidades;
  } else {
    importeCuota = redondear(M * regla.factorMensual);
    totalMensualidades = importeCuota * regla.cuotasAPagar;
  }

  const totalFinal = S + totalMensualidades;
  const precioTotalLista = base.setupLista.monto + base.mensualLista.monto * regla.mesesServicio;
  const precioEspecialSinPromocion = S + M * regla.mesesServicio;

  const calendario: CuotaCalendario[] = [
    { numero: 0, concepto: 'Setup', importe: dinero(S, moneda), mesRelativo: 0 },
  ];
  if (regla.pagoUnicoAdelantado) {
    calendario.push({
      numero: 1,
      concepto: `${regla.cuotasAPagar} mensualidades por adelantado`,
      importe: dinero(totalMensualidades, moneda),
      mesRelativo: 0,
    });
  } else {
    for (let i = 1; i <= regla.cuotasAPagar; i++) {
      calendario.push({
        numero: i,
        concepto: `Mensualidad ${i} de ${regla.cuotasAPagar}`,
        importe: dinero(importeCuota, moneda),
        mesRelativo: i,
      });
    }
  }

  return {
    codigo: regla.codigo,
    nombre: regla.nombre,
    precioTotalLista: dinero(precioTotalLista, moneda),
    precioEspecialSinPromocion: dinero(precioEspecialSinPromocion, moneda),
    descuentoAdicional: dinero(precioEspecialSinPromocion - totalFinal, moneda),
    ahorroTotal: dinero(precioTotalLista - totalFinal, moneda),
    setupAPagar: dinero(S, moneda),
    mensualidadesAPagar: dinero(totalMensualidades, moneda),
    importeCuota: dinero(importeCuota, moneda),
    cantidadCuotas: regla.cuotasAPagar,
    mesesServicio: regla.mesesServicio,
    permanenciaMinimaMeses: regla.permanenciaMinimaMeses,
    totalFinal: dinero(totalFinal, moneda),
    valorMensualEfectivo: dinero(totalMensualidades / regla.mesesServicio, moneda),
    formaDePago: regla.descripcionPago,
    calendarioPago: calendario,
  };
}

/** Las cuatro alternativas, en orden. */
export function calcularAlternativas(base: BaseCalculo): ReadonlyArray<AlternativaCalculada> {
  return ALTERNATIVAS.map((r) => calcularAlternativa(base, r));
}

// ==========================================================================
// de packages/compartido/src/aceptacion.ts
// ==========================================================================

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
