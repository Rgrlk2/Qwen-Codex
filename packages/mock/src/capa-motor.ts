/**
 * Datos de ejemplo — el motor de planificación e investigación, ensamblado.
 *
 * `datos-motor.ts` y `datos-investigacion.ts` traen la lógica y los datos como
 * funciones sueltas: el taxonomía, el catálogo, el perfil operativo, los
 * dolores inferidos, el ranking y los planes. Este archivo es sólo el
 * adaptador que las presenta como `CapaMotor`: agrega la latencia del mock,
 * la paginación, la idempotencia y los errores en castellano.
 *
 * ⛔ Acá no se decide nada del dominio. Si una regla comercial parece vivir en
 *    este archivo, está en el lugar equivocado.
 */

import type {
  Actividad, AjustePerfil, CapaMotor, ClaveIdempotencia, CorreccionDato, Dinero,
  EjePlan, EntradaObjetivo, EntradaPlan, FiltroPlanes, FiltroProductos, Id,
  InvestigacionObjetivo, ISODate, MotivoCierrePlan, NuevaSugerencia,
  ObjetivoSugerido, OpcionesPagina, Plan, PlanDeRubro, ProductoDetalle,
  ProductoId, SugerenciaProducto,
} from '@labia/compartido';
import type { NucleoMock } from './nucleo';
import * as motor from './datos-motor';
import * as investigacion from './datos-investigacion';
import { CUENTAS_DE_EJEMPLO } from './datos-sesion';

const VENDEDOR_DEMO: Id = CUENTAS_DE_EJEMPLO.find((c) => c.rol === 'vendedor')?.id ?? 'usr-jpfdz';

export function crearCapaMotorMock(nucleo: NucleoMock): CapaMotor {
  const clavesUsadas = new Map<string, unknown>();
  const idempotente = <T,>(clave: string, crear: () => T): T => {
    if (clavesUsadas.has(clave)) return clavesUsadas.get(clave) as T;
    const resultado = crear();
    clavesUsadas.set(clave, resultado);
    return resultado;
  };

  const noEncontrado = <T,>(mensajeAmable: string) =>
    nucleo.responderError<T>({ codigo: 'no_encontrado', mensajeAmable });

  return {
    // --- Investigación ---------------------------------------------------
    async investigarObjetivo(entrada: EntradaObjetivo) {
      return nucleo.responder(investigacion.investigarObjetivo(entrada, VENDEDOR_DEMO));
    },

    async estadoInvestigacion(id: Id) {
      const encontrada = investigacion.estadoInvestigacion(id);
      if (!encontrada) return noEncontrado<InvestigacionObjetivo>('No encontramos esa investigación.');
      return nucleo.responder(encontrada);
    },

    async corregirInvestigacion(inv: InvestigacionObjetivo, correcciones: ReadonlyArray<CorreccionDato>) {
      return nucleo.responder(investigacion.corregirInvestigacion(inv, correcciones));
    },

    async planDesdeInvestigacion(inv: InvestigacionObjetivo) {
      return nucleo.responder(investigacion.planDesdeInvestigacion(inv));
    },

    // --- Actividad y taxonomía -------------------------------------------
    async buscarActividad(texto: string) {
      return nucleo.responder(nucleo.listar(motor.buscarActividad(texto)));
    },

    /** ⛔ El contrato devuelve la actividad, no la resolución interna. */
    async resolverActividad(texto: string, clave: ClaveIdempotencia) {
      return idempotente(clave, () => {
        const resolucion = motor.resolverActividad(texto, VENDEDOR_DEMO);
        return nucleo.responder<Actividad>(resolucion.actividad);
      });
    },

    async listarOperaciones() {
      return nucleo.responder(nucleo.listar(motor.listarOperaciones()));
    },

    async listarNecesidades() {
      return nucleo.responder(nucleo.listar(motor.listarNecesidades()));
    },

    // --- Planes -----------------------------------------------------------
    async generarPlan(entrada: EntradaPlan, eje: EjePlan) {
      return nucleo.responder(motor.generarPlan(entrada, eje, VENDEDOR_DEMO));
    },

    async recalcularPlan(plan: Plan, ajustes: ReadonlyArray<AjustePerfil>) {
      return nucleo.responder(motor.recalcularPlan(plan, ajustes));
    },

    async guardarPlan(plan: Plan, clave: ClaveIdempotencia) {
      return idempotente(clave, () => nucleo.responder(motor.guardarPlan(plan)));
    },

    async obtenerPlan(id: Id) {
      const plan = motor.obtenerPlan(id);
      if (!plan) return noEncontrado<Plan>('No encontramos ese plan.');
      return nucleo.responder(plan);
    },

    async listarPlanes(filtro: FiltroPlanes, pagina?: OpcionesPagina) {
      const items = nucleo.listar(motor.listarPlanes(filtro));
      return nucleo.responder(nucleo.paginar(items, pagina?.cursor, pagina?.limite));
    },

    async crearPlanDeRubro(
      plan: Plan, periodoDesde: ISODate, periodoHasta: ISODate,
      metaGuaranies: Dinero, clave: ClaveIdempotencia,
    ) {
      return idempotente(clave, () =>
        nucleo.responder(motor.crearPlanDeRubro(plan, periodoDesde, periodoHasta, metaGuaranies)));
    },

    /** ⛔ Sin motivo no se cierra: es una decisión que queda registrada. */
    async cerrarPlan(id: Id, motivo: MotivoCierrePlan, comentario: string) {
      if (!motivo) {
        return nucleo.responderError<PlanDeRubro>({
          codigo: 'validacion',
          mensajeAmable: 'Elegí por qué cerrás el plan.',
        });
      }
      const cerrado = motor.cerrarPlan(id, motivo, comentario);
      if (!cerrado) return noEncontrado<PlanDeRubro>('No encontramos ese plan de rubro.');
      return nucleo.responder(cerrado);
    },

    async objetivosSugeridos(planId: Id) {
      return nucleo.responder(nucleo.listar(motor.objetivosSugeridos(planId)));
    },

    async aceptarObjetivo(objetivoId: Id, clave: ClaveIdempotencia) {
      return idempotente(clave, () => {
        const objetivo = motor.aceptarObjetivo(objetivoId);
        if (!objetivo) return noEncontrado<ObjetivoSugerido>('No encontramos ese objetivo.');
        return nucleo.responder(objetivo);
      });
    },

    // --- Catálogo ---------------------------------------------------------
    async listarProductos(filtro?: FiltroProductos) {
      return nucleo.responder(nucleo.listar(motor.listarProductosCatalogo(filtro)));
    },

    async obtenerProducto(id: ProductoId) {
      const detalle = motor.obtenerProductoDetalle(id);
      if (!detalle) return noEncontrado<ProductoDetalle>('Ese producto no está en el portafolio.');
      return nucleo.responder(detalle);
    },

    async preciosDeProducto(id: ProductoId) {
      return nucleo.responder(nucleo.listar(motor.preciosDeProducto(id)));
    },

    // --- Sugerencias del vendedor ----------------------------------------
    async crearSugerencia(datos: NuevaSugerencia, clave: ClaveIdempotencia) {
      return idempotente(clave, () =>
        nucleo.responder<SugerenciaProducto>(motor.crearSugerencia(datos, VENDEDOR_DEMO)));
    },

    async listarMisSugerencias(pagina?: OpcionesPagina) {
      const items = nucleo.listar(motor.listarMisSugerencias(VENDEDOR_DEMO));
      return nucleo.responder(nucleo.paginar(items, pagina?.cursor, pagina?.limite));
    },
  };
}
