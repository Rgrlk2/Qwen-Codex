/**
 * Genera `_compartido/calculo.ts` dentro de cada función de servidor que
 * calcule precios.
 *
 * ⛔ POR QUÉ SE EXTRAE Y NO SE REESCRIBE: la cotización que ve el cliente, la
 *    que firma el CEO y la que sale en el PDF tienen que dar exactamente los
 *    mismos números. Si alguien escribiera un cálculo "equivalente" para el
 *    servidor, el día que difiera un redondeo el cliente va a tener razón al
 *    reclamar.
 *
 * ⛔ CÓMO SE EXTRAE: por nombre de símbolo, copiando el texto TAL CUAL desde
 *    `export` hasta el siguiente `export` de nivel superior. No hay
 *    transformación: si el original cambia, esto cambia igual, y `--verificar`
 *    falla hasta que se regenere.
 *
 * ⛔ POR QUÉ UNA COPIA POR FUNCIÓN: al desplegar, cada función viaja con sus
 *    archivos. Teniéndola adentro, lo que corre en el servidor y lo que está
 *    en el repositorio se importan con la MISMA ruta.
 *
 *   node scripts/copiar-a-funciones.mjs              genera
 *   node scripts/copiar-a-funciones.mjs --verificar  falla si hay deriva
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const origen = join(raiz, 'packages/compartido/src');

/**
 * Qué se lleva cada función, y de dónde. Nada más que esto: lo que decide los
 * números y lo que el cliente lee con sus ojos.
 */
const QUE_SE_LLEVA = [
  ['core.ts', ['Moneda', 'Dinero']],
  ['alternativas.ts', [
    'CodigoAlternativa', 'ReglaAlternativa', 'ALTERNATIVAS', 'CuotaCalendario',
    'AlternativaCalculada', 'BaseCalculo', 'MonedasMezcladasError',
    'redondear', 'dinero', 'monedaDeLaBase', 'calcularAlternativa', 'calcularAlternativas',
  ]],
  ['aceptacion.ts', ['OpcionRespuesta', 'TEXTOS_OPCION', 'TEXTO_ACEPTACION', 'TEXTO_BOTON_ENVIO']],
];

/** Las funciones que calculan precios. */
const FUNCIONES = ['publico', 'documento'];

/**
 * Saca de un módulo la declaración de un símbolo, con su comentario de arriba,
 * tal cual está escrita.
 */
function extraer(texto, nombre) {
  const lineas = texto.split('\n');
  const declara = new RegExp(
    `^(export )?(async )?(function|const|type|interface|class) ${nombre}\\b`,
  );
  let inicio = lineas.findIndex((l) => declara.test(l));
  if (inicio < 0) throw new Error(`No encontré \`${nombre}\`.`);

  // El bloque de comentario inmediatamente anterior viaja con la declaración:
  // la razón de una regla vale tanto como la regla.
  let desde = inicio;
  while (desde > 0) {
    const previa = lineas[desde - 1].trim();
    if (previa.startsWith('*') || previa.startsWith('/**') || previa.startsWith('//')
        || previa.startsWith('*/')) { desde -= 1; } else { break; }
  }

  // Hasta la línea anterior a la siguiente declaración de nivel superior.
  // ⛔ Tiene que cortar también en las NO exportadas: `redondear` va seguida
  //    de `dinero`, y cortar sólo en `export` se llevaba las dos, dejando
  //    `dinero` declarada dos veces en el archivo generado.
  let hasta = inicio + 1;
  for (; hasta < lineas.length; hasta += 1) {
    const l = lineas[hasta];
    if (/^(export |function |const |let |class |type |interface |\/\/ ---|\/\*\*)/.test(l)) break;
  }
  while (hasta > inicio && lineas[hasta - 1].trim() === '') hasta -= 1;

  return lineas.slice(desde, hasta).join('\n');
}

const AVISO = `// ⛔ ARCHIVO GENERADO. No se edita acá: se edita en packages/compartido/src/
//    y se regenera con \`node scripts/copiar-a-funciones.mjs\`.
//
//    Trae, TAL CUAL, los símbolos que la función necesita para calcular
//    precios y para mostrarle al cliente los textos exactos. Nada se
//    reescribe: se extrae por nombre y se pega.
//
//    ⛔ La cotización que ve el cliente tiene que dar exactamente los mismos
//       números que la que vio el vendedor. Por eso esto se extrae del
//       original y el script verifica que no se haya separado.
`;

function contenido() {
  const partes = [AVISO];
  for (const [modulo, simbolos] of QUE_SE_LLEVA) {
    const texto = readFileSync(join(origen, modulo), 'utf8');
    partes.push(`\n// ${'='.repeat(74)}\n// de packages/compartido/src/${modulo}\n// ${'='.repeat(74)}\n`);
    for (const s of simbolos) partes.push(`\n${extraer(texto, s)}\n`);
  }
  return partes.join('');
}

const verificar = process.argv.includes('--verificar');
const esperado = contenido();
let derivados = 0;

for (const funcion of FUNCIONES) {
  const carpeta = join(raiz, 'supabase/functions', funcion, '_compartido');
  const ruta = join(carpeta, 'calculo.ts');
  if (verificar) {
    const actual = existsSync(ruta) ? readFileSync(ruta, 'utf8') : '';
    if (actual !== esperado) {
      console.error(`✗ ${funcion}/_compartido/calculo.ts se separó de packages/compartido/src/`);
      derivados += 1;
    } else {
      console.log(`✓ ${funcion} calcula con el mismo código que el Escritorio`);
    }
  } else {
    if (!existsSync(carpeta)) mkdirSync(carpeta, { recursive: true });
    writeFileSync(ruta, esperado);
    console.log(`→ ${funcion}/_compartido/calculo.ts`);
  }
}

if (verificar && derivados > 0) {
  console.error(`\n${derivados} copia(s) derivadas. Corré \`node scripts/copiar-a-funciones.mjs\`.`);
  process.exit(1);
}
