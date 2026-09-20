/**
 * Selección de la implementación de CapaDatos.
 *
 * ⛔ DUEÑO: SESIÓN 1.
 * ⛔ Las vistas NUNCA llaman fetch directo: piden la capa por acá.
 *    Cambiar de mock a HTTP no toca una línea de vista.
 */

import type { CapaDatos } from '@labia/compartido';
import { crearCapaDatosMock, type CapaDatosMock } from '@labia/mock';
import { crearCapaDatosHttp } from './http';
import { crearCapaDatosSupabase } from './supabase';

/**
 * Variables de entorno de la construcción. Se declaran acá para no depender de
 * los tipos del empaquetador: el contrato de esta aplicación son sus propios
 * tipos, no los de una herramienta.
 *
 * ⛔ Acá no vive ninguna credencial: sólo la raíz de la API propia. Los
 *    proveedores de investigación y de modelo de lenguaje están en el servidor
 *    (API_CONTRACTS §0 A11).
 */
interface EntornoConstruccion {
  readonly VITE_CAPA_DATOS?: string;
  readonly VITE_API_BASE?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly DEV?: boolean;
}

function entorno(): EntornoConstruccion {
  return (import.meta as unknown as { readonly env?: EntornoConstruccion }).env ?? {};
}

export type OrigenDatos = 'mock' | 'http' | 'supabase';

export interface CapaElegida {
  readonly capa: CapaDatos;
  readonly origen: OrigenDatos;
  /**
   * ⛔ `true` con mock. La interfaz muestra el chip permanente "Datos de
   *    ejemplo": nunca se presenta un dato ficticio como real.
   */
  readonly datosDeEjemplo: boolean;
  /** Palancas del mock (latencia, falla forzada, vacío y rol). `null` si no es mock. */
  readonly mock: CapaDatosMock | null;
}

/**
 * Decide la implementación.
 *
 * `VITE_CAPA_DATOS=supabase|http|mock` manda. Sin esa variable:
 *
 *   - en desarrollo, mock;
 *   - en producción, Supabase si está configurado, y HTTP si no.
 *
 * ⛔ Nunca mock en producción, ni por descuido ni pidiéndolo: una construcción
 *    de producción no puede servir datos de ejemplo. Por eso `mock` sólo se
 *    honra cuando `DEV` es verdadero.
 * ⛔ Y nunca Supabase sin su configuración: `crearCapaDatosSupabase` falla al
 *    construirse si faltan las variables, y ese error a mitad de una pantalla
 *    no dice nada. Se decide acá, con lo que se sabe.
 */
export function elegirCapaDatos(): CapaElegida {
  const env = entorno();
  const pedido = env.VITE_CAPA_DATOS;
  const enDesarrollo = env.DEV === true;
  const haySupabase = typeof env.VITE_SUPABASE_URL === 'string' && env.VITE_SUPABASE_URL !== '';

  if (pedido === 'mock' && !enDesarrollo) {
    throw new Error(
      'VITE_CAPA_DATOS=mock en una construcción de producción. Los datos de '
      + 'ejemplo no salen a producción.',
    );
  }

  if (pedido === 'mock' || (pedido === undefined && enDesarrollo)) {
    const capa = crearCapaDatosMock();
    return { capa, origen: 'mock', datosDeEjemplo: true, mock: capa };
  }

  if (pedido === 'supabase' || (pedido === undefined && haySupabase)) {
    return {
      capa: crearCapaDatosSupabase(),
      origen: 'supabase',
      datosDeEjemplo: false,
      mock: null,
    };
  }

  const capa = crearCapaDatosHttp({ base: env.VITE_API_BASE ?? '/api' });
  return { capa, origen: 'http', datosDeEjemplo: false, mock: null };
}

/** Una sola instancia por carga de la aplicación. */
let elegida: CapaElegida | null = null;

export function capaDatos(): CapaElegida {
  elegida ??= elegirCapaDatos();
  return elegida;
}
