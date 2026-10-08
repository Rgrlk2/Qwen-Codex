/**
 * Investigación automática — el respaldo por taxonomía.
 *
 * ⛔ MASTER_SPEC §1: la investigación externa y todo uso de modelo de lenguaje
 *    ocurren EN EL SERVIDOR, detrás de proveedores intercambiables. El
 *    navegador no lleva ninguna clave, así que esto no se resuelve acá aunque
 *    se quisiera.
 *
 * Todavía no hay proveedor elegido ni función de servidor desplegada. El
 * contrato ya dice qué hacer en ese caso y es exactamente lo que se hace:
 *
 *   «Si las fuentes externas fallan, cae a la taxonomía, marca
 *    `usoRespaldoTaxonomia` y devuelve `datosMinimosFaltantes` — sólo los
 *    campos imprescindibles, nunca un formulario largo vacío.»
 *
 * ⛔ Ningún dato se inventa. Todo lo que no se pudo averiguar sale como
 *    `no_encontrado` con el valor en nulo, que es lo que el tipo obliga.
 */

import type {
  CampoFaltante, CorreccionDato, DatoInvestigado, EntradaObjetivo, Id,
  InvestigacionCorregida, InvestigacionObjetivo, MotorDePlanificacion,
} from '@labia/compartido';

/** Un dato que no se pudo averiguar. ⛔ Valor nulo, sin razonamiento inventado. */
function sinDato<T>(campo: string): DatoInvestigado<T> {
  return {
    campo,
    valor: null,
    clasificacion: 'no_encontrado',
    confianza: null,
    fuentesIds: [],
    razonamiento: null,
    confirmadoPorVendedor: false,
    valorCorregido: null,
  };
}

/** El texto con el que el vendedor arrancó: lo único que se sabe con certeza. */
function textoDeLaEntrada(entrada: EntradaObjetivo): string {
  if (entrada.tipo === 'empresa') {
    return entrada.razonSocial ?? entrada.nombreComercial ?? entrada.ruc ?? '';
  }
  if (entrada.tipo === 'profesional') {
    return entrada.profesionOEspecialidad || entrada.nombre;
  }
  return entrada.rubro;
}

function identificador(): Id {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `inv-${Date.now()}`;
}

/**
 * Los campos mínimos que hacen falta para poder seguir.
 * ⛔ Tres, no un formulario: sin actividad no hay motor, y sin ciudad ni
 *    canal de contacto no hay forma de llegar al cliente.
 */
function loMinimoQueFalta(actividadResuelta: boolean): ReadonlyArray<CampoFaltante> {
  const faltan: CampoFaltante[] = [];
  if (!actividadResuelta) {
    faltan.push({
      campo: 'actividad',
      pregunta: '¿A qué se dedica?',
      porQueHaceFalta: 'Es lo que enciende el motor: sin la actividad no hay operaciones, ni dolores, ni productos sugeridos.',
      obligatorio: true,
      opciones: null,
    });
  }
  faltan.push({
    campo: 'ubicacion',
    pregunta: '¿En qué ciudad está?',
    porQueHaceFalta: 'Para ordenar visitas y saber si entra en tu zona.',
    obligatorio: false,
    opciones: null,
  });
  faltan.push({
    campo: 'contacto',
    pregunta: '¿Tenés un teléfono o WhatsApp de contacto?',
    porQueHaceFalta: 'Sin un canal no hay forma de retomar la conversación.',
    obligatorio: false,
    opciones: null,
  });
  return faltan;
}

export function respaldoPorTaxonomia(
  entrada: EntradaObjetivo,
  vendedorId: Id,
  motor: MotorDePlanificacion,
): InvestigacionObjetivo {
  const texto = textoDeLaEntrada(entrada);
  const resolucion = motor.resolverActividad(texto, vendedorId);
  const perfil = motor.construirPerfilOperativo(resolucion);
  const dolores = motor.inferirDolores(perfil);
  const ranking = motor.construirRanking(dolores);
  const hayActividad = texto.trim().length > 0;

  return {
    id: identificador(),
    entrada,
    // ⛔ `fuentes_caidas`, no `completa`: decir que está completa cuando no se
    //    consultó ninguna fuente sería mentirle al vendedor.
    estado: 'fuentes_caidas',
    investigadoEn: new Date().toISOString(),
    vendedorId,

    actividad: hayActividad
      ? {
          campo: 'actividad',
          valor: resolucion.actividad.nombre,
          clasificacion: 'inferido',
          confianza: resolucion.esNueva ? 'baja' : 'media',
          fuentesIds: [],
          razonamiento: resolucion.esNueva
            ? `"${texto}" no está confirmado en la taxonomía todavía: se armó un perfil provisorio con las palabras del texto.`
            : `El texto "${texto}" coincide con la actividad "${resolucion.actividad.nombre}" de la taxonomía confirmada.`,
          confirmadoPorVendedor: false,
          valorCorregido: null,
        }
      : sinDato<string>('actividad'),
    actividadId: hayActividad ? resolucion.actividad.id : null,

    ubicacion: sinDato<string>('ubicacion'),
    canalesDigitales: sinDato('canalesDigitales'),
    sitioWeb: sinDato<string>('sitioWeb'),
    redesEncontradas: sinDato('redesEncontradas'),
    productosOServicios: sinDato('productosOServicios'),
    senalesOperativas: sinDato('senalesOperativas'),
    posiblesDecisores: sinDato('posiblesDecisores'),
    tamanoAproximado: sinDato('tamanoAproximado'),

    perfilOperativo: perfil,
    doloresProbables: dolores,
    productosRecomendados: ranking,

    // ⛔ Ninguna fuente consultada, y se dice.
    fuentesConsultadas: [],
    confianzaGlobal: 'baja',
    datosMinimosFaltantes: loMinimoQueFalta(hayActividad),
    usoRespaldoTaxonomia: true,
    versionTaxonomia: 1,
    versionCatalogo: 1,
  };
}

/**
 * El vendedor confirma, corrige o agrega; el motor recalcula y dice qué cambió.
 * ⛔ Corregir la actividad rehace el perfil entero: es el dato del que cuelga
 *    todo lo demás.
 */
export function aplicarCorrecciones(
  inv: InvestigacionObjetivo,
  correcciones: ReadonlyArray<CorreccionDato>,
  motor: MotorDePlanificacion,
): InvestigacionCorregida {
  let actividad = inv.actividad;
  let actividadId = inv.actividadId;
  let rehacer = false;

  for (const c of correcciones) {
    if (c.campo !== 'actividad') continue;
    if (c.accion === 'confirmar') {
      actividad = { ...actividad, confirmadoPorVendedor: true };
    } else if (c.accion === 'corregir' || c.accion === 'agregar') {
      actividad = {
        ...actividad,
        valorCorregido: String(c.valor),
        confirmadoPorVendedor: true,
        clasificacion: 'verificado',
        confianza: 'alta',
        razonamiento: 'Lo corrigió el vendedor.',
      };
      rehacer = true;
    } else {
      actividad = { ...actividad, valor: null, clasificacion: 'no_encontrado', confianza: null };
      actividadId = null;
      rehacer = true;
    }
  }

  if (!rehacer) {
    return { investigacion: { ...inv, actividad }, cambios: [] };
  }

  const texto = actividad.valorCorregido ?? actividad.valor ?? '';
  const resolucion = motor.resolverActividad(texto, inv.vendedorId);
  const perfil = motor.construirPerfilOperativo(resolucion);
  const dolores = motor.inferirDolores(perfil);
  const ranking = motor.construirRanking(dolores);

  const antes = new Map(inv.productosRecomendados.map((p) => [p.productoId, p]));
  const cambios = ranking.flatMap((nueva) => {
    const anterior = antes.get(nueva.productoId);
    if (!anterior) return [];
    if (anterior.posicion === nueva.posicion && anterior.encaje === nueva.encaje) return [];
    return [{
      productoId: nueva.productoId,
      posicionAnterior: anterior.posicion,
      posicionNueva: nueva.posicion,
      encajeAnterior: anterior.encaje,
      encajeNuevo: nueva.encaje,
      motivo: anterior.posicion === nueva.posicion
        ? `Mantuvo el puesto ${nueva.posicion}, pero cambió su encaje de "${anterior.encaje}" a "${nueva.encaje}".`
        : `Pasó del puesto ${anterior.posicion} al ${nueva.posicion} al corregirse la actividad.`,
    }];
  }).sort((a, b) => a.posicionNueva - b.posicionNueva);

  return {
    investigacion: {
      ...inv,
      actividad,
      actividadId: texto.trim().length > 0 ? resolucion.actividad.id : actividadId,
      perfilOperativo: perfil,
      doloresProbables: dolores,
      productosRecomendados: ranking,
    },
    cambios,
  };
}
