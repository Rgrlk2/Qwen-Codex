/**
 * Conexión a Supabase.
 *
 * ⛔ Acá vive la clave PUBLICABLE, y sólo ésa. Es la que está pensada para
 *    viajar al navegador: por sí sola no da acceso a ningún dato. Quien
 *    protege la información son las políticas por fila de la base, que se
 *    evalúan con la sesión de quien consulta.
 *
 * ⛔ La clave de SERVICIO —la que saltea esas políticas— no existe en este
 *    repositorio ni llega jamás al navegador. Vive sólo en el servidor, y
 *    sólo la usan las funciones que necesitan actuar sin sesión.
 *
 * ⛔ Ninguna de las dos se escribe en el código: salen del entorno.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

interface EntornoSupabase {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

function entorno(): EntornoSupabase {
  return (import.meta as unknown as { readonly env?: EntornoSupabase }).env ?? {};
}

let cliente: SupabaseClient | null = null;

/**
 * El cliente, uno solo por carga.
 *
 * ⛔ Si faltan las variables, se avisa acá y con claridad. Un cliente a medio
 *    configurar falla más tarde, en una consulta cualquiera, con un mensaje
 *    que no dice nada.
 */
export function supabase(): SupabaseClient {
  if (cliente) return cliente;

  const env = entorno();
  const url = env.VITE_SUPABASE_URL;
  const clave = env.VITE_SUPABASE_ANON_KEY;

  if (!url || !clave) {
    throw new Error(
      'Falta la configuración del servidor: VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY. '
      + 'Ver supabase/LEEME.md.',
    );
  }

  cliente = createClient(url, clave, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // El Escritorio no usa enlaces mágicos: la sesión no viaja en la URL.
      detectSessionInUrl: false,
    },
  });
  return cliente;
}

export function hayConfiguracionDeServidor(): boolean {
  const env = entorno();
  return Boolean(env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY);
}
