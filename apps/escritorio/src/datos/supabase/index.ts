/**
 * La `CapaDatos` completa contra Supabase: las nueve capas ensambladas.
 *
 * ⛔ Una `CapaDatos` a medias no se puede enchufar. El contrato es una sola
 *    interfaz; si falta un método, el Escritorio compila y revienta la primera
 *    vez que alguien abre esa pantalla. Por eso este archivo aparece recién
 *    ahora, con las nueve escritas.
 *
 * ⛔ Acá no hay ninguna regla de negocio. Cada capa trae las suyas, y las que
 *    de verdad importan no están en TypeScript: están en la base, como
 *    políticas por fila, restricciones y disparadores. Un navegador
 *    modificado, o alguien llamando a la API a mano, choca con lo mismo.
 */

import type { CapaDatos } from '@labia/compartido';
import { crearCapaSesionSupabase } from './sesion';
import { crearCapaInicio } from './inicio';
import { crearCapaMotor } from './motor';
import { crearCapaClientes } from './clientes';
import { crearCapaAgenda } from './agenda';
import { crearCapaFichas } from './fichas';
import { crearCapaPropuestas } from './propuestas';
import { crearCapaDinero } from './dinero';
import { crearCapaAdministracion } from './administracion';

export function crearCapaDatosSupabase(): CapaDatos {
  return {
    ...crearCapaSesionSupabase(),
    ...crearCapaInicio(),
    ...crearCapaMotor(),
    ...crearCapaClientes(),
    ...crearCapaAgenda(),
    ...crearCapaFichas(),
    ...crearCapaPropuestas(),
    ...crearCapaDinero(),
    ...crearCapaAdministracion(),
  };
}

export { supabase } from './conexion';
