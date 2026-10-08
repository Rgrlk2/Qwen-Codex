#!/usr/bin/env node
/**
 * Prueba de los cuatro cálculos de las alternativas financieras.
 *
 * Con S = precio especial del setup y M = precio mensual especial:
 *
 *   A · Plan estándar                S + (M × 12)
 *   B · Adelantado 12 meses          S + (M × 12 × 0,90)
 *   C · Adelantado 24 meses          S + (M × 24 × 0,80)
 *   D · Cheques diferidos o débito   S + (M × 11 × 0,90)
 *
 * Cada caso se calcula acá a mano, con las fórmulas escritas arriba, y se
 * compara contra lo que devuelve `calcularAlternativas` de
 * packages/compartido. Si alguna vez dejan de coincidir, esto falla.
 *
 * Verifica además:
 *   · que B, C y D no sean acumulables (cada una parte del mismo especial);
 *   · que el descuento caiga SOBRE LA MENSUALIDAD, nunca sobre el setup;
 *   · que las cuotas sumen exactamente el total de mensualidades;
 *   · que mezclar monedas lance error en lugar de sumar.
 *
 * Uso: node scripts/verificar-calculos.mjs
 */

import { calcularAlternativas, ALTERNATIVAS, MonedasMezcladasError } from '../packages/compartido/dist/alternativas.js';

let fallos = 0;
let pruebas = 0;

function comprobar(etiqueta, esperado, obtenido) {
  pruebas++;
  if (esperado !== obtenido) {
    fallos++;
    console.error(`  ✗ ${etiqueta}\n      esperado: ${esperado}\n      obtenido: ${obtenido}`);
  } else {
    console.log(`  ✓ ${etiqueta} = ${formato(obtenido)}`);
  }
}

function formato(n) {
  return typeof n === 'number' ? new Intl.NumberFormat('es-PY').format(n) : String(n);
}

/** Casos de prueba. Importes de ejemplo: no son precios de ningún producto. */
const CASOS = [
  { nombre: 'Guaraníes, cifras redondas', moneda: 'PYG', setup: 3_000_000, mensual: 500_000 },
  { nombre: 'Guaraníes, con resto en el redondeo', moneda: 'PYG', setup: 1_750_000, mensual: 333_333 },
  { nombre: 'Dólares en centavos', moneda: 'USD', setup: 120_000, mensual: 9_900 },
];

for (const caso of CASOS) {
  const S = caso.setup;
  const M = caso.mensual;
  const base = {
    setupLista: { monto: Math.round(S * 1.25), moneda: caso.moneda },
    setupEspecial: { monto: S, moneda: caso.moneda },
    mensualLista: { monto: Math.round(M * 1.2), moneda: caso.moneda },
    mensualEspecial: { monto: M, moneda: caso.moneda },
  };

  console.log(`\n${caso.nombre} — S = ${formato(S)} ${caso.moneda}, M = ${formato(M)} ${caso.moneda}`);

  const [a, b, c, d] = calcularAlternativas(base);

  // --- A · Plan estándar: S + (M × 12), en 12 cuotas ---
  console.log('\n  A · Plan estándar  →  S + (M × 12)');
  comprobar('total final A', S + M * 12, a.totalFinal.monto);
  comprobar('cuota A', M, a.importeCuota.monto);
  comprobar('cuotas A', 12, a.cantidadCuotas);
  comprobar('meses de servicio A', 12, a.mesesServicio);
  comprobar('permanencia mínima A', 12, a.permanenciaMinimaMeses);

  // --- B · Adelantado 12: S + (M × 12 × 0,90), pago único ---
  console.log('\n  B · Adelantado 12 meses  →  S + (M × 12 × 0,90)');
  const mensualidadesB = Math.round(M * 12 * 0.9);
  comprobar('total final B', S + mensualidadesB, b.totalFinal.monto);
  comprobar('mensualidades B', mensualidadesB, b.mensualidadesAPagar.monto);
  comprobar('setup sin descuento en B', S, b.setupAPagar.monto);
  comprobar('meses de servicio B', 12, b.mesesServicio);

  // --- C · Adelantado 24: S + (M × 24 × 0,80), pago único ---
  console.log('\n  C · Adelantado 24 meses  →  S + (M × 24 × 0,80)');
  const mensualidadesC = Math.round(M * 24 * 0.8);
  comprobar('total final C', S + mensualidadesC, c.totalFinal.monto);
  comprobar('mensualidades C', mensualidadesC, c.mensualidadesAPagar.monto);
  comprobar('setup sin descuento en C', S, c.setupAPagar.monto);
  comprobar('meses de servicio C', 24, c.mesesServicio);

  // --- D · Diferido: S + (M × 11 × 0,90). 12 meses de servicio, 11 cuotas ---
  console.log('\n  D · Cheques diferidos o débito automático  →  S + (M × 11 × 0,90)');
  const cuotaD = Math.round(M * 0.9);
  comprobar('total final D', S + cuotaD * 11, d.totalFinal.monto);
  comprobar('cuota D', cuotaD, d.importeCuota.monto);
  comprobar('cuotas D (una bonificada)', 11, d.cantidadCuotas);
  comprobar('meses de servicio D', 12, d.mesesServicio);
  comprobar('permanencia mínima D', 12, d.permanenciaMinimaMeses);

  // --- Invariantes transversales ---
  console.log('\n  Invariantes');
  for (const alt of [a, b, c, d]) {
    // El setup nunca recibe el descuento de la alternativa.
    comprobar(`setup intacto en ${alt.codigo}`, S, alt.setupAPagar.monto);
    // El total es exactamente setup + mensualidades: no hay sumas escondidas.
    comprobar(
      `total = setup + mensualidades en ${alt.codigo}`,
      alt.setupAPagar.monto + alt.mensualidadesAPagar.monto,
      alt.totalFinal.monto,
    );
    // Las cuotas del calendario suman el total final, al guaraní.
    const sumaCalendario = alt.calendarioPago.reduce((t, cuota) => t + cuota.importe.monto, 0);
    comprobar(`el calendario suma el total en ${alt.codigo}`, alt.totalFinal.monto, sumaCalendario);
    // Una sola moneda en toda la alternativa.
    const monedas = new Set([
      alt.totalFinal.moneda, alt.setupAPagar.moneda, alt.mensualidadesAPagar.moneda,
      alt.importeCuota.moneda, alt.valorMensualEfectivo.moneda,
      ...alt.calendarioPago.map((cuota) => cuota.importe.moneda),
    ]);
    comprobar(`una sola moneda en ${alt.codigo}`, 1, monedas.size);
  }

  // NO ACUMULABLES: cada alternativa parte del mismo M especial, no una de otra.
  // Si fueran acumulables, D sobre B daría M × 0,81. Comprobamos que no.
  comprobar('B y D no se acumulan (0,90 una vez, no 0,81)', Math.round(M * 0.9), d.importeCuota.monto);
  comprobar('C no acumula sobre B (0,80 una vez, no 0,72)', Math.round(M * 24 * 0.8), c.mensualidadesAPagar.monto);
}

// --- Monedas mezcladas: tiene que fallar, no sumar ---
console.log('\nMonedas mezcladas');
pruebas++;
try {
  calcularAlternativas({
    setupLista: { monto: 1000, moneda: 'PYG' },
    setupEspecial: { monto: 900, moneda: 'PYG' },
    mensualLista: { monto: 100, moneda: 'USD' },
    mensualEspecial: { monto: 90, moneda: 'USD' },
  });
  fallos++;
  console.error('  ✗ mezclar PYG con USD tendría que lanzar y no lanzó');
} catch (error) {
  if (error instanceof MonedasMezcladasError) {
    console.log('  ✓ mezclar PYG con USD lanza MonedasMezcladasError');
  } else {
    fallos++;
    console.error(`  ✗ lanzó ${error.name} en lugar de MonedasMezcladasError`);
  }
}

// --- Las cuatro alternativas existen, y son cuatro ---
console.log('\nTabla de alternativas');
comprobar('cantidad de alternativas', 4, ALTERNATIVAS.length);
comprobar('códigos', 'estandar,adelantado_12,adelantado_24,diferido', ALTERNATIVAS.map((r) => r.codigo).join(','));

console.log(`\n${fallos === 0 ? '✓' : '✗'} ${pruebas - fallos}/${pruebas} comprobaciones`);
process.exit(fallos === 0 ? 0 : 1);
