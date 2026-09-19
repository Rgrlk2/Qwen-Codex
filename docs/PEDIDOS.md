# PEDIDOS — Cambios fuera del ámbito propio

> Archivo de **sólo agregar**. Cada sesión escribe **únicamente en su propia sección**, al final.
> ⛔ Nunca se edita ni se borra la entrada de otra sesión: así el archivo no genera conflictos aunque lo usen las seis a la vez.
> Protocolo: `docs/PARALLEL_SESSIONS.md` §6.

## Formato

```
### [Sn] AAAA-MM-DD — Título corto
Archivo: ruta/del/archivo        (dueña: Sm)
Necesito: qué hace falta y por qué
Bloqueante: sí | no
Respuesta [Sm] AAAA-MM-DD: qué se hizo
```

---

## S1 · Núcleo y autenticación

### [S1] 2026-09-18 — Vendedores nominales y ninguna contraseña en el repositorio · **RESUELTO**
Archivos: `packages/mock/src/datos-sesion.ts` · `packages/compartido/src/identidad.ts`
· `scripts/verificar-nucleo.mjs` · `scripts/verificar-navegador.mjs`
· `scripts/verificar-portafolio.mjs`

Sesión 2 dejó pedido reemplazar las cuentas genéricas por vendedores con nombre
real y sacar toda contraseña del repositorio, pero no lo tomó porque esos
archivos eran de Sesión 1. Sesión 1 cerró antes, así que el pedido quedó sin
dueño y lo resolvió la sesión de especificación.

**Las siete cuentas, nominales:**

| Nombre | Usuario | Rol |
|---|---|---|
| Juan Pablo Fernandez | `JPFdz` | vendedor |
| Pablo Carreras | `PCrrs` | vendedor |
| Natalia Pellens | `NTPns` | vendedor |
| Carlos Torres | `CTrrz` | vendedor |
| Sebastián Torres | `STrrz` | vendedor |
| Ramón Espinola | `REspn` | vendedor |
| Rodrigo Garelik | `RGrlk` | administrador |

Los usuarios de los primeros cuatro los fijó el CEO; los de Sebastián Torres y
Ramón Espinola se derivaron con el mismo criterio. La cuenta de administración
es nominal y única: es quien aprueba cotizaciones, firma como CEO y cierra
períodos.

**⛔ Ninguna contraseña quedó escrita en el repositorio.**

- El mock ya no guarda claves. `CUENTAS_DE_EJEMPLO` pasó a ser una lista de
  `Usuario` y el tipo de cuenta **ya no tiene un campo `clave`**.
- `ingresar` acepta cualquier clave **no vacía** sobre una cuenta activa,
  porque no hay nada contra qué comparar. La clave vacía falla, y falla
  **idéntico** a un usuario inexistente: ni el mensaje ni el código revelan si
  la cuenta existe. Esa propiedad se conserva intacta.
- `Usuario.debeCambiarClave` se agregó al contrato compartido, en `true` para
  las siete: la clave inicial se entrega **por fuera del código** y el primer
  ingreso real obliga a cambiarla.
- Las dos baterías de prueba dejaron de tener credenciales literales:
  **inventan una clave distinta en cada corrida**, que sólo vive en memoria.
  Los nombres de usuario salen de los datos, salvo en `verificar-navegador.mjs`
  —corre sin empaquetar y no puede importar TypeScript—, donde van literales:
  un nombre de usuario no es un secreto.
- Control nuevo **12g** en `verificar-portafolio.mjs`: rechaza el repositorio si
  vuelve a entrar una contraseña, sea un campo `clave`, una llamada a
  `ingresar` con la clave literal, o una asignación tipo `password: '…'`.
  Probado introduciendo las cuatro violaciones.

Con mock, cualquier clave no vacía entra. Eso es correcto para datos de
ejemplo y **no** es la autenticación real: cuando se conecte, la comparación
vive en el servidor y esta capa no cambia de forma.

Bloqueante: no — resuelto.


## S2 · Interfaz e inicio

### [S2] 2026-09-17 — Vendedores demostrativos con nombre real y sin contraseña en el repositorio
Archivo: packages/mock/src/datos-sesion.ts (dueña: S1), scripts/verificar-nucleo.mjs (dueña: S1)
Necesito: el CEO pidió reemplazar las cuentas de ejemplo actuales
(`vendedora` / `administracion`) por cuatro vendedores nombrados:
Juan Pablo Fernandez (usuario `JPFdz`), Pablo Carreras (`PCrrs`),
Natalia Pellens (`NTPns`) y Carlos Torres (`CTrrz`); y pidió explícitamente
que **ninguna contraseña quede escrita en HTML, JS, TS, mocks ni ningún
archivo del repositorio**, dejando preparada la obligación de cambiar la
clave inicial cuando se conecte la autenticación real.
No lo edité yo: `datos-sesion.ts` es de Sesión 1, y `scripts/verificar-nucleo.mjs`
tiene sus pruebas de ingreso escritas contra las credenciales actuales
(usuario y clave literales, en más de diez puntos) — cambiarlas sin
coordinar rompe esa batería. La app sigue funcionando hoy con las cuentas
vigentes; este pedido es para que Sesión 1 decida el diseño (por ejemplo,
que el mock no compare contra una clave guardada, sino que la exija no
vacía y marque `debeCambiarClave` en el primer ingreso real) y actualice
ambos archivos a la vez.
Bloqueante: no

### [S2] 2026-09-17 — Nombre de usuario y foto del vendedor en la cáscara
Archivo: apps/escritorio/src/nucleo/contrato-vista.ts → `OpcionesDisposicion` (dueña: S1), packages/compartido/src/identidad.ts → `Usuario` (dueña: S1)
Necesito: armé el avatar del vendedor (iniciales sobre degradado, con el
mismo espacio reservado para una fotografía) y el bloque de nombre en
`nucleo/disposicion.ts`, pero `OpcionesDisposicion` sólo trae
`nombreUsuario` y `rol`: no hay un usuario de acceso (`@JPFdz`) separado del
nombre, ni un campo de foto en `Usuario`. Si se agrega `usuario` a
`OpcionesDisposicion` (ya existe en `Usuario.usuario`, sólo falta
reenviarlo desde `main.ts`) y, más adelante, una URL de foto opcional en
`Usuario`, la cáscara los muestra sin tocar nada más: `crearAvatar` ya
acepta una foto opcional y cae a las iniciales si no llega.
Bloqueante: no

## S3 · Motor de planificación e investigación

_(sin pedidos)_

## S4 · Clientes, voz, seguimiento y agenda

### [S4] 2026-09-15 — packages/ui/src/base.css no tiene los componentes del §5 de DESIGN_SYSTEM.md
Archivo: packages/ui/src/base.css        (dueña: S2)
Necesito: `.tarjeta`, `.lista`, `.btn`, `.campo`, `.chips`/`.chip`, `.pestanas`/`.pestana`,
`.calendario`, `.cronograma`/`.cronograma-contenedor`, `.entrada-agenda`, `.dato`,
`.confianza`, `.tabla`/`.tabla-contenedor`, `.aviso`, `.cargando`/`.hueso`, `.vacio`, `.error`.
Hoy el archivo sólo importa tokens.css. Mientras tanto, Clientes y Agenda usan esos mismos
nombres de clase en el marcado (para integrar sin retrabajo) y les agrego una hoja de estilos
propia con prefijo de vista que cubre lo que falta, sólo con tokens (sin color literal).
Bloqueante: no

### [S4] 2026-09-15 — content/taxonomia/actividades.md todavía no tiene términos cargados
Archivo: content/taxonomia/actividades.md   (dueña: S3)
Necesito: `Cliente.actividadId` referencia una `Actividad` real de la taxonomía del motor.
Como todavía no hay ninguna cargada, el mock de clientes usa sus propios ids de ejemplo
(slugs legibles: `repuestera`, `restauran-pame-garelik`, etc.) y una etiqueta local sólo para
mostrarlos en la ficha. Cuando la taxonomía de S3 exista, se cablean los ids reales.
Bloqueante: no

### [S4] 2026-09-17 — resuelto al rebasar contra integracion/escritorio
`main.ts`, `contrato-vista.ts`, `guardia-rol.ts` y `nucleo/formato.ts` de Sesión 1 ya están
mergeados en `integracion/escritorio`. Esta sesión rebaseó contra esa rama y:
· adoptó la convención `export function crearVista(): Vista` en clientes/vista.ts y
  agenda/vista.ts (antes exportaba un singleton por `default`, que `esModuloVista` no detecta);
· usa `packages/mock/src/nucleo.ts` real (`NucleoMock.responder/paginar/listar/identificador`)
  en vez de una implementación local duplicada;
· usa la vendedora de ejemplo real de `datos-sesion.ts` (`usr-vendedora`) como dueña de la
  cartera, en vez de un id inventado;
· re-exporta `formatearFecha`/`formatearFechaHora`/`formatearDinero` de
  `nucleo/formato.ts` desde el `util.ts` de cada vista, en vez de reimplementarlos;
· sigue el patrón `css.d.ts` de `vistas/ingreso/` (Sesión 1) para tipar
  `import './estilos.css'` bajo `tsc -b`, uno por carpeta, sin depender de un
  `vite-env.d.ts` global que todavía no existe.
Sigue pendiente (no bloqueante): `nucleo/{estados,disposicion}.ts` (Sesión 2) todavía no
existen, así que Clientes y Agenda implementan sus cuatro estados y su propia hoja de
estilos con los mismos nombres de clase de DESIGN_SYSTEM.md §5, para integrar sin
retrabajo cuando `base.css` los traiga.
Bloqueante: no

## S5 · Presentaciones y cotizaciones

_(sin pedidos)_

## S6 · Finanzas y administración

### [S6] 2026-09-17 — Falta un listado de observaciones para administración
Archivo: packages/compartido/src/api.ts (dueña: S1)
Necesito: `CapaDinero.abrirObservacion` crea una `Observacion`, pero `CapaAdministracion`
no tiene ningún método para listarlas. `resolverObservacion(id, estado, comentario)`
existe, pero el administrador no tiene forma de conocer el `id` de una observación
abierta sin que otra vista se la muestre. Pido un método aditivo, por ejemplo
`listarObservaciones(filtro, pagina?): R<Pagina<Observacion>>`, agregado a
`CapaAdministracion` en `api.ts` y a `dinero.ts` si hace falta un `FiltroObservaciones`.
Bloqueante: no — mientras tanto, la sección Comisiones de Administración resuelve
una observación por el id de línea de participación, que sí está listado.

## Integración · Especificación

### [ESPEC] 2026-09-19 — Las mismas veinte líneas de DOM están escritas tres veces
Archivos: `apps/escritorio/src/vistas/fichas/dom.ts` (dueña: especificación)
· `apps/escritorio/src/vistas/propuestas/dom.ts` (dueña: S5)
· `apps/escritorio/src/vistas/clientes/util.ts` (dueña: S4)
· destino propuesto: `packages/ui/src/dom.ts` (dueña: S2)

Necesito: `crear(etiqueta, {clase, texto, atributos})` y `vaciar(elemento)` existen
en `fichas/dom.ts` y en `propuestas/dom.ts` con el mismo cuerpo —sólo cambian el
nombre de dos variables locales del bucle y el salto de línea de la firma—; `propuestas/dom.ts` agrega
además `agregar(padre, ...hijos)`, y `clientes/util.ts` resuelve el mismo problema
por otro camino (`esc()` + plantillas de texto). Son tres implementaciones del
mismo ayudante, y cada vista nueva agrega una cuarta.

Propongo promoverlas a `packages/ui/src/dom.ts` con la unión de las tres firmas
(`crear`, `vaciar`, `agregar`) y exponerlas como `"./dom": "./src/dom.ts"` en el
`exports` de `packages/ui/package.json` — hoy ese paquete sólo publica las tres
hojas de estilo y `iconos`. Las tres vistas pasan a importar de ahí y borran su
copia local; `clientes/util.ts` conserva `esc()` mientras siga armando marcado
por plantilla.

No lo hice en el cambio de fichas porque toca dos carpetas de otras sesiones y un
paquete compartido, y la deuda no rompe nada: las copias son idénticas, no
divergentes. Es limpieza, no corrección.

Bloqueante: no

### [ESPEC] 2026-09-19 — `TipoPropuesta` ya no nombra sólo propuestas
Archivo: `packages/compartido/src/propuestas.ts` (dueña: S5)

Al ensamblar la capa de fichas apareció que `CapaFichas.compartirFicha` devuelve
un `EnlaceCompartido`, cuyo campo `tipoPropuesta` era `'presentacion' | 'cotizacion'`.
Una ficha compartida no tenía cómo declararse: viajaba disfrazada de presentación,
y Administración la mostraba como tal.

Hecho en este cambio: se agregó `'ficha'` al tipo, y el ternario de
`administracion/vista.ts` que etiquetaba la apertura pasó a ser un `switch`
exhaustivo, para que el próximo tipo rompa la compilación en vez de mostrarse mal.

Queda pendiente, no bloqueante: el nombre. `TipoPropuesta` hoy nombra el tipo de
documento de un enlace, no sólo las propuestas. `TipoDocumentoEnlace` sería el
nombre correcto. No lo renombré porque toca `propuestas.ts`, `datos-propuestas.ts`,
`datos-finanzas.ts` y la vista de Administración a la vez, y es puro renombre.

Bloqueante: no

### [ESPEC] 2026-09-19 — Tres vistas no arrancaban: `export default` en vez de `crearVista` · **RESUELTO**
Archivos: `apps/escritorio/src/vistas/propuestas/vista.ts` (dueña: S5)
· `apps/escritorio/src/vistas/dinero/vista.ts` (dueña: S6)
· `apps/escritorio/src/vistas/administracion/vista.ts` (dueña: S6)

`main.ts` monta una vista sólo si su módulo exporta `crearVista()`
(`esModuloVista`, contrato-vista.ts). Esas tres exportaban su vista con
`export default`, así que el Escritorio mostraba **"en construcción"** en
Propuestas, Dinero y Administración pese a tener el código entero —1.416, 530 y
1.412 líneas—. S4 ya había adoptado la convención al rebasar; S5 y S6 no.

Apareció al generar las instantáneas de las pantallas: las tres fallaron con
`crearVista is not a function`, que es exactamente lo que le pasaba al núcleo en
silencio.

Resuelto: las tres exportan ahora `crearVista()`. Se dejó el `export default`
donde estaba, para no tocar lo que ya lo importe así.

Bloqueante: era sí — tres de las siete secciones no abrían.

### [ESPEC] 2026-09-19 — Clientes y Agenda pisaban el sistema de diseño en toda la app · **RESUELTO**
Archivos: `apps/escritorio/src/vistas/clientes/estilos.css` (dueña: S4)
· `apps/escritorio/src/vistas/agenda/estilos.css` (dueña: S4)

Las dos hojas declaraban ~30 componentes compartidos **sin prefijo** —`.tarjeta`,
`.btn`, `.chip`, `.pestana`, `.campo`, `.entrada`, `.tabla`, `.cargando`, `.hueso`,
`.vacio`, `.error`, `.aviso`, `.dato`, `.saltar`—. Su propia cabecera explicaba por
qué: *"packages/ui/src/base.css todavía no define los componentes compartidos del
§5 de DESIGN_SYSTEM.md (docs/PEDIDOS.md [S4] 2026-09-15), así que esta hoja cubre
acá los que la vista necesita, con los mismos nombres de clase para integrar sin
retrabajo."*

Como las hojas de vista se cargan DESPUÉS de `base.css`, esas copias ganaban en
toda la aplicación, no sólo en su vista. Se vio al aplicar el diseño: el bloque de
error de Clientes salía en columna y estirado a media pantalla, porque su
`.vacio, .error` local forzaba `flex-direction: column` sobre el de la base.

Resuelto: se quitaron los bloques que `base.css` ya define; quedan sólo las piezas
propias (`.lista-item`, `.etapa`, `.calendario-*`, `.cronograma-*`, `.clientes-*`,
`.agenda-*`, `.entrada-agenda*`). Es exactamente la integración que ese pedido
dejaba anotada.

Bloqueante: era sí para el diseño — sin esto, el aspecto aprobado no se aplicaba.

### [ESPEC] 2026-09-19 — Cinco vistas escribían su propio título y su propio chip · **RESUELTO**
Archivos: `apps/escritorio/src/nucleo/disposicion.ts` (dueña: S1)
· `inicio/vista.ts` (S2) · `planificar/vista.ts` (S3) · `clientes/plantillas.ts` (S4)
· `agenda/plantillas.ts` (S4) · `propuestas/vista.ts` (S5) · `dinero/vista.ts` (S6)
· `administracion/vista.ts` (S6)

El diseño trae un encabezado fijo con el rótulo "Escritorio vendedores", el título
de la ruta y el chip "Datos de ejemplo". La cáscara no tenía ninguno: `.encabezado`
existía en `base.css` pero nadie lo construía, así que cada vista escribía su propio
`<h1>` y su propio chip, y Planificar hasta su propio `header.encabezado` pegajoso.

Resuelto: `crearDisposicion` arma el encabezado y toma el título de `destinos`, que
ya lo trae —la cáscara no necesita conocer el registro de rutas—. Las siete vistas
dejaron de escribirlo. Ahora hay un `<h1>` y un chip por pantalla, verificado en las
nueve instantáneas.

El foco al cambiar de ruta lo lleva ese título (`tabIndex = -1`), que es donde antes
lo ponía cada vista.

Bloqueante: no
