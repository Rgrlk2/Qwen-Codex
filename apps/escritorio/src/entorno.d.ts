/**
 * `import.meta.env`, declarado a mano.
 *
 * ⛔ POR QUÉ HACE FALTA ESCRIBIRLO ASÍ Y NO LEERLO POR UNA VARIABLE: al
 *    construir para producción, la herramienta reemplaza el TEXTO
 *    `import.meta.env.DEV` por `false` antes de compilar. Eso deja muerto el
 *    bloque que arma los datos de ejemplo, y el paquete entero —con sus
 *    clientes inventados— desaparece del archivo que se publica.
 *
 *    Si en vez de eso se lee `env.DEV` a través de una función, la
 *    herramienta no puede saber cuánto vale y se lleva los datos de ejemplo
 *    a producción. Ya pasó: viajaban "Ferretería Modelo S.R.L." y "Hotel Las
 *    Mercedes" dentro de lo publicado.
 *
 * Se declara acá en vez de traer los tipos de la herramienta para no
 * arrastrar su configuración entera por dos propiedades.
 */
interface ImportMetaEnv {
  /** `true` sólo mientras se desarrolla. En lo publicado, `false` literal. */
  readonly DEV?: boolean;
  readonly VITE_CAPA_DATOS?: 'mock' | 'http' | 'supabase';
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
