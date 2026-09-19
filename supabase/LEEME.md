# El servidor — Supabase

Proyecto: **escritorio-vendedores-labia**
Referencia: `ihkqtzqbdzhkorxmxhjx` · Región: `sa-east-1` (São Paulo, la más cerca de Asunción)

⛔ Ninguna clave vive en este repositorio. La URL y la clave pública van por
variables de entorno (`.env`, que está ignorado); la clave de servicio no se
usa nunca desde el navegador.

## Qué hace cumplir la base, y ya no el navegador

Esto es lo que cambia respecto de la versión con datos de ejemplo: las reglas
dejaron de ser una intención del código y pasaron a ser una garantía del motor
de base de datos. No hay forma de escribir una fila que las viole, ni siquiera
con acceso directo.

| Regla | Dónde vive ahora |
|---|---|
| **G8 · Nada llega al cliente sin aprobación** | Disparador `transicion_de_cotizacion`. Probado: los tres caminos posibles para saltearla fallan. |
| **Nadie aprueba su propia cotización** | Disparador `nadie_aprueba_lo_suyo`. Además exige rol administrador. |
| **G1 · El portafolio es cerrado** | 13 filas y un disparador que rechaza altas y bajas. Probado: Sentinela no entra. |
| **G2 · Ningún producto inventado se persiste** | `producto.id` es clave primaria; toda referencia es clave foránea. |
| **G3 · Sólo dos roles** | El tipo `rol_usuario` tiene dos valores. Un tercero no existe. |
| **§20 · Administración bloqueada en el servidor** | `es_administrador()` + políticas por fila. Un vendedor que escriba la URL a mano obtiene cero filas, no una pantalla escondida. |
| **La cartera es de su vendedor** | Políticas por fila. La consulta no devuelve clientes ajenos. |
| **PC1 · Una sola moneda por cotización** | Una sola columna `moneda`. Mezclarlas es imposible. |
| **PC2 · Los ahorros no se escriben** | Columnas generadas. Un descuento que no se dio no se puede declarar. |
| **CC1 · Lo que NO incluye, escrito** | Tabla `cotizacion_alcance`. |
| **G11 · Nada de voz se guarda sin confirmar** | `seguimiento.confirmado_por_usuario` con restricción `= true`. |
| **G12 · Los registros son append-only** | Disparador `inmutable` sobre versiones y eventos de revisión. |
| **AG4 · La agenda no se borra** | Sin política de borrado. Se descarta con motivo. |
| **FI3/FI4 · La firma del CEO no es una URL** | Restricción que rechaza cualquier cosa con forma de ruta o de archivo de imagen. |
| **FI5 · Editar lo aprobado anula la firma** | El mismo disparador de estados la anula sola. |
| **§0 · Borrado lógico** | Ninguna tabla comercial tiene política de `delete`. |
| **Autoría de cada fila** | Disparador `sella_trazado`: `creado_por` sale de `auth.uid()`, no del navegador. |
| **Bloqueo optimista** | El mismo disparador sube `version` y rechaza con 40001 una escritura basada en una lectura vieja. |

## Migraciones aplicadas

1. `fundacion_identidad_y_roles` — usuarios sobre `auth.users`, los dos roles, la guardia.
2. `catalogo_cerrado_y_taxonomia` — los 13, precios de lista, taxonomía de tres capas.
3. `clientes_seguimientos_y_agenda` — cartera, contactos, seguimientos, audio, agenda.
4. `presentaciones_y_cotizaciones` — la máquina de estados comercial y las firmas.
5. `endurecer_funciones` — `search_path` fijo y permisos mínimos, tras el análisis de seguridad.
6. `fichas_documentos_y_enlaces` — personalización por bloques, PDF sólo si está aprobada, enlaces con token.
7. `dinero_participaciones_y_liquidaciones` — participaciones al 100 %, comisión sólo contra cobro, liquidación cerrada.
8. `registro_de_ingreso` — alta de usuarios y registro de cada intento de entrada.
9. `taxonomia_del_motor` — las tres capas del motor, extraídas del propio código (ver abajo).
10. `sello_de_trazado` — quién creó cada cosa, quién la tocó y bloqueo optimista.
11. `alinear_clientes_con_el_contrato` — actividad y referencia obligatorias, fecha de resolución de un paso.
12. `altas_atomicas_e_idempotentes` — `crear_cliente` y `guardar_seguimiento` en una transacción.
13. `alta_de_usuario_crea_cuentas_que_entran` — corrección de un error que dejaba afuera a cada vendedor nuevo.
14. `audio_de_seguimiento` — el audio existe antes que el seguimiento; subirlo, registrarlo y borrarlo.

Para traerlas a un entorno local: `supabase link --project-ref ihkqtzqbdzhkorxmxhjx && supabase db pull`.

## Autenticación — contraseñas de verdad

Las siete cuentas existen en el servidor y la contraseña **se verifica**. El
mock aceptaba cualquiera que no estuviera vacía; ahora la comprueba el
servidor contra un resumen criptográfico, y el navegador nunca ve nada
parecido a una clave guardada.

⛔ **Ninguna contraseña está en este repositorio.** Las generó la base al azar
y se entregaron una sola vez. Las siete están marcadas `debe_cambiar_clave`.

⛔ **El correo de ingreso se DERIVA del usuario**, no se consulta. `JPFdz` →
`jpfdz@usuarios.labia.local`, un dominio interno que no existe y al que no se
le manda nada. Consultarlo hubiera sido un oráculo: probando nombres
cualquiera podría averiguar qué usuarios existen, que es la mitad del trabajo
de entrar. Derivándolo, un usuario inexistente y una contraseña equivocada
recorren el mismo camino y devuelven el mismo texto. Verificado.

El correo corporativo real de cada persona vive aparte, en `usuario.email`,
para mostrar y para avisos.

## La guardia, probada contra el servidor real

No con la aplicación: con llamadas directas a la API, con el token de un
vendedor de verdad. Es la prueba que importa, porque es lo que haría alguien
que quiere saltearse la pantalla.

| Como vendedor (Juan Pablo) | Resultado |
|---|---|
| Ver su propio perfil | 1 fila |
| Ver el registro de accesos (sólo Administración) | **0 filas** |
| Ver los presupuestos (sólo Administración) | **0 filas** |
| Ascenderse a administrador | **rechazado**, sigue vendedor |
| Dar de alta un usuario | **rechazado** |
| Agregar un producto 14 | **rechazado** |
| Leer los 13 productos | 13, como corresponde |

| Como administrador (Rodrigo) | Resultado |
|---|---|
| Ver todos los usuarios | 7 |
| Dar de alta un vendedor | creado |

La guardia **discrimina**, no bloquea a todos: es la diferencia entre una
puerta con llave y una pared.

## La taxonomía del motor no se transcribió: se extrajo

Las tres capas —10 operaciones, 13 necesidades, 26 actividades y las 131
relaciones entre ellas— viven en `packages/mock/src/datos-motor.ts`, que es
donde se escribieron y donde se discuten. `scripts/exportar-taxonomia.mjs`
las lee de ahí y escribe `supabase/taxonomia.sql`.

⛔ **A mano habrían divergido.** Copiar 1.400 líneas a un archivo SQL garantiza
que en la tercera corrección alguien arregle una de las dos versiones y se
olvide de la otra. Extrayéndolas, la del servidor no puede alejarse del
original: se vuelve a generar.

Para regenerarlo: `node scripts/exportar-taxonomia.mjs`.

Comprobado en la base: ninguna actividad queda sin productos alcanzables, y
la cadena actividad → operación → necesidad → producto resuelve entera.

## El sello de trazado

Cinco tipos del contrato llevan `Trazado`: Usuario, Cliente,
FichaPersonalizada, Presentacion y Cotizacion. Tres de las tablas ya tenían
las columnas, pero **nadie las mantenía**: `creado_por` venía sin valor por
defecto, así que el dato de autoría lo ponía el navegador, y `version` se
quedaba en 1 para siempre —con lo cual el `conflicto_version` del contrato
existía en el código y no en los hechos.

Ahora lo pone la base. Probado por SQL directo, salteando la aplicación:

| Intento | Resultado |
|---|---|
| Crear diciendo que lo creó otro vendedor | **descartado**, la autoría la pone `auth.uid()` |
| Crear mandando `version: 99` | **descartado**, queda en 1 |
| Guardar con una versión vieja | **rechazado** `[40001]` con el texto que ve el vendedor |
| Guardar con la versión correcta | OK, sube 1 → 2 |
| Reescribir `creado_por` / `creado_en` de una fila existente | **rechazado**, la historia no se toca |

## Un vendedor nuevo no podía entrar

Encontrado probando el alta contra la API real, no leyendo el código.

GoTrue —el servicio de sesiones de Supabase— lee ocho columnas de token de
`auth.users` como texto. Cuatro no tienen valor por defecto. Si quedan en
nulo, el ingreso muere con `500 Database error querying schema`: un error que
no dice nada, del lado del servidor, y la persona queda afuera sin
explicación.

Las siete cuentas que ya existían se habían corregido a mano en su momento,
pero **la función que da de alta seguía creándolas mal**. O sea: cada vendedor
que Rodrigo diera de alta desde Administración habría nacido sin poder entrar.
Corregido en `alta_de_usuario`, y verificado: una cuenta creada con la versión
vieja no obtiene sesión; con la nueva, sí.

## Altas que se pueden reintentar

Dar de alta un cliente escribe en tres tablas; guardar un seguimiento, en
cinco. PostgREST no hace eso de forma atómica: son tres o cinco llamadas, y si
la tercera falla queda un cliente a medio crear. Por eso las altas van por
`crear_cliente` y `guardar_seguimiento`, que lo hacen en una transacción.

Y la `ClaveIdempotencia` del contrato ahora significa algo: se guarda en
`operacion_idempotente`. Si al vendedor se le corta el internet y aprieta
"Guardar" otra vez, queda **un** cliente, no dos.

Probado contra la API real, con el token de un vendedor de verdad:

| Intento | Resultado |
|---|---|
| Alta de cliente con contacto | creado, todo en una transacción |
| La misma clave otra vez, con otro nombre | **mismo id**, un solo cliente |
| `creado_por` de lo creado | el vendedor real, no lo que mandó el navegador |
| Seguimiento sin confirmar | **rechazado**, con el texto que ve la persona |
| Seguimiento confirmado | guardado, con su paso, su producto y su evento |
| La última interacción del cliente | se movió sola |

## El audio existe antes que el seguimiento

El recorrido es: grabar → subir → procesar el texto → recién ahí confirmar y
guardar. O sea que hay un rato en que el audio no cuelga de nada. Por eso
`seguimiento_id` dejó de ser obligatorio y la política de RLS mira quién lo
subió mientras está suelto.

| Intento | Resultado |
|---|---|
| Subir y registrar | audio con retención a 90 días |
| La misma clave otra vez | **mismo id**, una sola fila |
| Borrar sin decir por qué | **rechazado** |
| Borrar con motivo | referencia soltada, **la fila queda** con quién y cuándo |
| La transcripción | **intacta**: el texto es el registro comercial |
| Bajar el archivo sin sesión | **rechazado**, el balde es privado |

⛔ **El archivo se borra de verdad**, no sólo su referencia. Antes quedaba
guardado y era recuperable.

⛔ **Advertencia sobre el borrado y la CDN.** El balde se sirve detrás de
Cloudflare. Comprobado: después de borrar el archivo del origen, el borde
sigue entregando la copia cacheada un rato, aun con `cache-control: no-cache`.
Por eso el nombre del archivo **no** es la clave de idempotencia —que la vista
genera con un camino de respaldo basado en `Math.random()`— sino un
`crypto.randomUUID()`. Así, pasado el borrado, sólo puede alcanzar la copia
cacheada quien ya tenía la dirección exacta; no se llega probando rutas.

## Pendiente de un clic tuyo, Rodrigo

El análisis de seguridad marca una cosa que no se arregla por SQL: **la
protección contra contraseñas filtradas está apagada**. Encendida, Supabase
compara cada contraseña nueva contra HaveIBeenPwned y rechaza las que ya se
filtraron. Se activa en el panel, en Authentication → Policies.

## Lo que falta del servidor

- La capa de datos del navegador contra Supabase, en reemplazo del mock:
  hechas la sesión y los clientes; faltan motor, agenda, fichas, propuestas,
  dinero, administración e inicio. Hasta que estén las nueve, el Escritorio
  sigue eligiendo entre mock y HTTP: una `CapaDatos` a medias no se puede
  enchufar.
- Generación del PDF y transcripción de voz (funciones de servidor).
- Notificaciones salientes.
