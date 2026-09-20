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
15. `necesidad_producto_con_motivo` — la columna que se me había escapado al exportar la taxonomía.
16. `planes_y_objetivos` — el plan como foto del razonamiento, con sus reglas.
17. `sugerencias_precios_y_escrituras_del_motor` — la sugerencia con la forma del contrato, vigencia de precios, y las altas del motor.
18. `aceptar_objetivo_con_las_columnas_reales` — corrección: la agenda no tiene `programada_para`.
19. `precios_de_lista_del_portafolio` — los 29 precios, que nunca se habían cargado.
20. `reglas_de_la_agenda` — lo resuelto no se reabre; descartar y mover exigen motivo.
21. `alta_manual_en_la_agenda` — la única entrada que se crea a mano.
22. `fichas_descarte_y_escrituras` — dónde anotar un descarte, el tope de destacados y el enlace.
23. `las_firmas_mandan` — sin firma no va a revisión; sin las dos, no sale el PDF ni se envía.
24. `escrituras_de_propuestas` — altas de presentación y cotización, y la firma del vendedor.
25. `el_precio_de_lista_sale_del_catalogo` — corrección: lo mandaba el navegador.
26. `se_puede_cotizar_sin_precio_de_lista` — Smart Commerce y Exeq.IA quedaban fuera.
27. `documentos_enlaces_y_nueva_version` — emitir, compartir y editar.
28. `la_version_de_la_cotizacion_es_la_del_documento` — dos cosas se llamaban igual y se pisaban.
29. `fi5_de_verdad_anula_las_firmas` — la regla estaba escrita y no funcionaba.
30. `editar_lo_ya_enviado_tambien_caduca` — FI5 no alcanzaba a lo que ya tenía el cliente.
31. `abrir_observacion` — la única escritura del vendedor sobre el dinero.
32. `las_decisiones_de_administracion` — revisar, firmar como CEO, cerrar período, publicar participación.
33. `parametros_sistema` — una sola fila, cambiar exige motivo, sin tipo de cambio institucional.
34. `el_registro_de_quien_hizo_que` — el registro de accesos reconstruido contra el contrato.
35. `las_cinco_que_faltaban` — presupuesto, ajuste, fusión de actividad, reasignación de cartera, uso del equipo.
36. `el_registro_se_escribe_solo` — ocho disparadores: la auditoría no depende de que alguien se acuerde.
37. `el_registro_necesita_hora_de_verdad` — `now()` era la hora de la transacción, no la del hecho.
38. `la_respuesta_del_cliente` — la constancia, los importes congelados y la cola de avisos.
39. `el_vendedor_tiene_telefono` — no había dónde guardarlo, y la cola apuntaba a la tabla equivocada.
40. `completar_no_es_editar` — el documento emitido admite una sola transición: dónde quedó el archivo.

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

## Tres cosas que faltaban y no se veían

Aparecieron al escribir la capa del motor contra el servidor, no leyendo el
código.

**Los precios nunca se habían cargado.** `precio_lista` estaba vacía: el
Escritorio contra el servidor no habría mostrado ni un precio. Ya están los
29, exportados del mismo archivo que usa el Escritorio. ⛔ Smart Commerce y
Exeq.IA quedan `no_documentado` con monto nulo, que es lo correcto: no tienen
precio publicado y se cotizan personalizado. No se inventa un número para
llenar la columna.

**A `necesidad_producto` le faltaba el `motivo`** —el texto que explica por qué
ese producto resuelve esa necesidad, que es lo que el vendedor lee para armar
el argumento frente al cliente. Error mío al exportar la taxonomía: el motor
alimentado desde la base habría armado planes con el motivo vacío donde los
datos de ejemplo tienen una explicación.

**`sugerencia_producto` no se parecía al contrato.** Tenía `descripcion` y
`necesidad_id`; el contrato pide el problema en palabras del cliente, la
actividad, con qué frecuencia se observó, qué productos se quedaron cortos y
por qué. Esa forma no es decorativa: es lo que hace que una sugerencia sirva
para decidir si un producto 14 tiene sentido.

## El plan, guardado

El razonamiento de un plan —perfil operativo, dolores, ranking, combos,
estrategia, argumentos, preguntas— es una **foto** de lo que el motor pensó en
un momento, que después el vendedor ajusta. Nada consulta adentro de esa foto,
así que va como `jsonb`; normalizarla en siete tablas sería trabajo sin nadie
que lo use. Lo que sí se consulta —eje, vendedor, estado, período, meta— son
columnas de verdad, con sus reglas:

| Regla | Dónde vive |
|---|---|
| El ranking son los 13, sin repetidos | `check (jsonb_array_length(razonamiento->'ranking') = 13)` |
| Posiciones 1, 2 y 3: ni dos ni cuatro | `check (cardinality(productos_destacados) = 3)` |
| Un plan de rubro necesita período y meta | `check` cruzado con el eje |
| Cerrar exige motivo **y** comentario | `check (estado = 'abierto' or …)` |
| Un plan cerrado es terminal | Disparador `cerrado_es_terminal` |
| Aceptar un objetivo genera una **tarea**, nunca un cliente | `aceptar_objetivo`, en una transacción |

## Investigación automática: por qué todavía no consulta nada

⛔ MASTER_SPEC §1: la investigación externa y todo uso de modelo de lenguaje
ocurren **en el servidor**, detrás de proveedores intercambiables. El navegador
no lleva ninguna clave, así que esto no se resuelve del lado del cliente aunque
se quisiera. Y todavía no hay proveedor elegido.

El contrato ya dice qué hacer en ese caso, y es exactamente lo que se hace:
caer a la taxonomía, marcar `usoRespaldoTaxonomia`, devolver estado
`fuentes_caidas` y pedir **tres** campos mínimos —nunca un formulario largo
vacío—. Todo lo que no se pudo averiguar sale como `no_encontrado` con el valor
en nulo.

⛔ Ningún dato se inventa, y el estado no dice `completa` cuando no se consultó
ninguna fuente. Decir lo contrario sería mentirle al vendedor sobre de dónde
salió lo que está viendo.

## La agenda

⛔ La agenda **se puebla sola** desde planes, objetivos aceptados, seguimientos,
presentaciones, cotizaciones, vencimientos y aperturas de enlace. Por eso la
única escritura de creación es la manual, y es la excepción: la restricción
`agenda_manual_acotada` la limita a visita, llamada y próximo paso.

⛔ **"Atrasada" no es una columna.** Se calcula contra la fecha de hoy cada vez
que se lee. Guardarla obligaría a recorrer la tabla todas las noches para que
no mienta.

Probado contra la API real, con el token de un vendedor:

| Intento | Resultado |
|---|---|
| Alta manual | creada |
| La misma clave otra vez | **mismo id**, una sola entrada |
| Crear a mano un `vencimiento` | **rechazado**, no es de las que se tipean |
| Mover una fecha sin motivo | **rechazado**, con el texto que ve la persona |
| Mover con motivo | queda `reprogramada`, con quién y por qué |
| Completar | queda `completada`, con su fecha |
| Mover algo **ya completado** | **rechazado**: lo resuelto no se reabre |
| Descartar sin motivo | **rechazado** |
| Descartar con motivo | queda `descartada`, con el motivo escrito |
| **Borrar** una entrada | no borra nada: las dos filas siguen enteras |

⛔ Sobre el borrado, con precisión: la API devuelve `204` —que parece éxito—
pero **no borra**. Como la tabla no tiene política de `delete`, la fila ni
siquiera es visible para borrarse y PostgREST informa éxito sobre cero filas.
AG4 se cumple, pero en silencio. No es un problema para el Escritorio, que no
tiene método para borrar de la agenda; queda dicho porque un `204` invita a
creer lo contrario.

## Las fichas: el copy no está en la base

⛔ **La ficha oficial no se guarda en el servidor.** El contenido sale del copy
congelado de `content/copy/` en cada lectura, con la misma función que usan los
datos de ejemplo. Por eso no puede haber una copia vieja en la base, y por eso
el enlace sirve siempre el copy **vigente**. `revisarCopyDeFicha` es sólo un
aviso para el vendedor: para que no se entere delante del cliente.

Lo único que vive en la base es la **capa** del vendedor: qué bloques se ven,
en qué orden, cuáles destacan, y sus dos textos propios.

Probado contra la API real:

| Intento | Resultado |
|---|---|
| Preparar una ficha con sus bloques | creada, todo en una transacción |
| **Escribir copy propio en un bloque** | `Could not find the 'texto' column` |
| Un **tercer** bloque destacado | **rechazado**: hasta dos |
| Compartir | token de 44 caracteres |
| ¿El token lleva adentro el id de la ficha? | **no** |
| ¿Y el del cliente? | **no** |
| ¿Una ficha pide código? | **no**: es material de presentación, no una cotización |
| Descartar sin motivo | **rechazado** |
| Descartar con motivo | queda con el motivo escrito |

⛔ Ese segundo renglón es la prueba que importa. **PF1 no es una validación que
alguien pueda saltear: es que la columna no existe.** El error ni siquiera
viene de una regla nuestra — viene de que no hay dónde escribir.

## El circuito comercial

```
borrador → firma del vendedor → EN REVISIÓN (va al CEO)
  → aprueba → firma del CEO → PDF definitivo
  → recién ahí: enviada al cliente → enlace → respuesta
```

⛔ Nada de esto lo defiende el Escritorio. Probado contra la API real con dos
sesiones, un vendedor y un administrador:

| Intento | Resultado |
|---|---|
| Mandar al cliente sin aprobación | **rechazado** (G8) |
| El vendedor aprueba su propia cotización | **rechazado**: sólo Administración |
| Mandar a revisión sin firmar | **rechazado** |
| Emitir el PDF con una sola firma | **rechazado** |
| Enviar al cliente con una sola firma | **rechazado** |
| Enlace sobre algo no aprobado | **rechazado** |
| Editar mientras está en revisión | **rechazado**: la está mirando Administración |
| Editar algo cerrado (aceptada, perdida, vencida) | **rechazado** |

## FI5 estaba escrita y no funcionaba

El hallazgo más serio de esta capa, y venía de antes.

`transicion_de_cotizacion` tiene desde siempre un `UPDATE` que anula las firmas
al editar algo aprobado. Pero **`firma` no tiene política de escritura**: con
RLS activo, ese update no alcanza ninguna fila y Postgres no se queja. La regla
existía en el código y no en los hechos.

En concreto, verificado: el CEO aprueba y firma Gs. 2.400.000, el documento sale
al cliente, el vendedor lo baja a Gs. 1.000.000 — y las dos firmas seguían
figurando como vigentes.

Y había un segundo tramo: FI5 sólo miraba `aprobada`, no `enviada_al_cliente`.
Una cotización **ya en manos del cliente** se editaba en silencio.

Corregido. La anulación pasa a `anular_firmas_de_version`, una función
`SECURITY DEFINER` que **sólo sabe anular**: pone `anulada`, su fecha y su
motivo, nada más. Y `firma` sigue sin política de update, así que nadie
des-anula una firma a mano. Verificado contra la API:

| Intento | Resultado |
|---|---|
| Editar una cotización ya enviada al cliente | versión 1 → 2, vuelve a borrador |
| Las dos firmas | **caducadas**, con el motivo escrito |
| Volver a mandarla al cliente | **rechazado**: ya no está aprobada |
| Des-anular una firma a mano | **no alcanza ninguna fila** |

## El precio de lista no lo manda el navegador

Error mío, corregido. `crear_cotizacion` tomaba `setupLista` y `mensualLista`
del cuerpo de la llamada.

Los ahorros son **columnas generadas**: lista − especial. Si el navegador elige
la lista, elige el ahorro que se le muestra al cliente. Un vendedor podía poner
una lista inflada y la base calculaba fielmente una mentira: *"ahorra
Gs. 5.000.000"* sobre un precio que nunca existió.

La columna generada garantiza que la resta esté bien hecha. **No garantiza que
los números sean los de Lab.IA.** Eso lo garantiza leerlos del catálogo.

Probado: mandé una lista de 50.000.000 para Agendar.IA y quedó la real,
3.000.000. También mandé otro nombre de producto y quedó el del catálogo.

⛔ Smart Commerce y Exeq.IA no tienen precio publicado. Con `setup_lista`
obligatorio no se los podía cotizar en absoluto —dos de los trece productos
fuera del Escritorio—. Ahora la lista puede ser nula y el **ahorro queda nulo,
no cero**: no hay contra qué comparar, y un "ahorra Gs. 0" sería tan falso como
inventarle una lista.

## Dos cosas que se llamaban igual

`cotizacion.version` es la versión del **documento**, a la que se atan las
firmas. Pero el sello de trazado la subía en cada escritura, porque ahí
`version` es el bloqueo optimista.

Verificado: pasar de borrador a revisión y a aprobada dejaba la cotización en
versión 3, con la firma del vendedor huérfana en la 1, y el circuito se trababa
en *"faltan firmas"* sin que faltara ninguna. El sello ahora acepta un argumento
para no tocar esa columna donde significa otra cosa.

## El dinero: el vendedor observa, no edita

⛔ En toda la capa de dinero hay **una sola escritura** del vendedor: abrir una
observación. Y no toca ningún importe — deja dicho que algo no cuadra para que
lo mire Administración.

Que no pueda tocar plata no es una validación de pantalla: es que **no existe
ningún otro método**, y las políticas de la base dan escritura sobre importes
sólo a `es_administrador()`.

Probado contra la API real, con dos vendedores y una línea de cada uno:

| Intento | Resultado |
|---|---|
| Ver las líneas de participación | ve **una**, la suya; la del otro no existe para él |
| Subirse su propia comisión | no mueve nada: sigue en Gs. 395.000 |
| Publicarse una participación 90/10 | **rechazado** por RLS |
| Cambiar el importe de un cobro | no mueve nada |
| Crearse una liquidación | **rechazado** por RLS |
| Abrir una observación | **permitido** — lo único |
| Abrirla ya resuelta a su favor | **rechazado**: nace `abierta` |

⛔ Dos matices honestos. Subirse la comisión y tocar un cobro devuelven `[]`
—cero filas afectadas— en vez de un error: como esas tablas no tienen política
de `update`, la fila no es visible para escribirse y PostgREST informa éxito
sobre cero filas. El importe **no se mueve**, que es lo que importa, pero el
rechazo es silencioso. Mismo patrón que el borrado en la agenda.

## Las reglas del dinero, probadas al intentar romperlas

Armando los datos de prueba me frenaron dos veces, y las dos tenían razón:

- **G7** · Una participación se devenga **sólo contra un cobro confirmado**.
  Inventé una referencia que no existía y la base la rechazó nombrando la regla.
- **No hay mensualidad sin cotización.** La clave foránea no deja registrar un
  cobro recurrente que no venga de un documento comercial.

La cadena está encadenada de punta a punta: cotización → mensualidad → cobro
confirmado → línea de participación. No se puede empezar por el medio.

## Administración: la capa donde trabajás vos

Ocho de nueve. Lo que se agregó en este tramo:

**Las cinco funciones que la capa llamaba y no existían.** `administracion.ts`
invocaba `definir_presupuesto`, `crear_ajuste`, `fusionar_actividad`,
`reasignar_cartera` y `uso_por_vendedor`. Ninguna estaba escrita: la pantalla
habría compilado y fallado al primer clic. Ahora están, con sus reglas adentro:

- **Presupuesto.** Una sola fila por vendedor y período; redefinir **sube la
  versión**, no agrega una fila (el ranking ordena por monto y dos filas lo
  romperían). Meta de cero rechazada. Período cerrado no recibe metas nuevas:
  la meta se fija antes de jugar el partido.
- **Ajuste.** Motivo obligatorio, importe distinto de cero, y **se aplica sobre
  un período abierto**. Un período cerrado no se reabre ni se reescribe: por eso
  `reabrirPeriodo` no existe y el ajuste corrige hacia adelante. Si viene de una
  observación, esa observación tiene que estar resuelta como *procede* o
  *parcial*: una observación abierta o rechazada no mueve plata.
- **Fusión de actividad.** El nombre viejo **sobrevive como sinónimo**, así la
  captura sigue encontrando lo que la gente ya escribía. El término de origen
  **no se borra**: los planes ya generados lo citan. Sin cadenas: no se fusiona
  hacia algo que ya fue fusionado.
- **Reasignación de cartera.** Qué pasa con lo en curso es una decisión
  explícita, sin default silencioso: si no decidís qué hacer con los planes
  abiertos, la función se planta. Lo que ya salió no se muda — una cotización
  aprobada o enviada lleva firmas y el nombre del vendedor adentro. Y **las
  líneas ya devengadas no se tocan nunca**: son de quien las generó. La función
  las cuenta y te las informa.
- **Uso del equipo.** Sólo Administración. Ingresos del período, planes,
  seguimientos, cotizaciones que salieron del borrador, y el marcado de inactivo
  contra el umbral de `parametros_sistema`.

### El registro de accesos estaba mal hecho

La tabla `registro_acceso` era un log de ingresos: `usuario_id`, `accion`,
`resultado`. El contrato (`registros.ts`) pide otra cosa: **quién hizo qué,
sobre qué entidad, y cómo estaba antes**. La capa de datos ya filtraba por
`actor_id`, `entidad_tipo` y `entidad_id` — columnas que no existían. Se
reconstruyó contra el contrato.

Tres decisiones del rediseño:

- **Sin política de INSERT.** El navegador no escribe el registro, ni siquiera
  el tuyo. Se escribe sólo desde `anotar_registro()`, `SECURITY DEFINER`, que
  no está expuesta como endpoint. Probado: con sesión de administrador, un
  `insert` directo a nombre de otro vendedor fue rechazado por RLS.
- **`nombre_actor` es una foto, no un join.** Si mañana alguien cambia de
  nombre, el registro de ayer sigue diciendo el de ayer. Un registro que se
  reescribe con el tiempo no es registro.
- **Se anota solo, por disparador.** Ocho disparadores cubren alta y baja de
  vendedor, participación, parámetros, cierre de período, emisión de PDF,
  enlace emitido y revocado, borrado de audio, y las tres decisiones sobre una
  cotización (aprobación, corrección, rechazo). Una línea de auditoría que
  depende de que el que escribió el RPC se acuerde de llamarla no es auditoría.
  Del audio borrado **no se guarda la referencia de almacenamiento**: el
  registro dice *que* se borró, no *cómo* volver a encontrarlo.

### Un defecto mío, encontrado por la propia prueba

Puse `default now()` en `ocurrido_en`. En Postgres `now()` es la hora de
**inicio de la transacción**, no la del hecho: dos decisiones tomadas en la
misma transacción quedaban con el mismo sello y el orden entre ellas se perdía.
En una auditoría eso es la diferencia entre *"aprobó y después firmó"* y
*"firmó y después aprobó"*. Corregido a `clock_timestamp()`. Las nueve líneas
anteriores al arreglo comparten cinco sellos y así van a quedar: el registro
no se reescribe, ni para arreglarlo.

### Una prueba que dio verde por el motivo equivocado

Probé que una versión de participación publicada no se puede borrar. Dio OK.
Estaba mal: el `DELETE` no lo frenó el disparador de inmutabilidad — lo filtró
RLS, que devuelve **cero filas y ningún error**. La prueba no distinguía
"bloqueado" de "no hizo nada". Rehecha contando filas antes y después:

- Por la API, con sesión de administrador: el `DELETE` no borra nada, **en
  silencio**. Las tres versiones siguen ahí.
- Como dueña de la tabla: el disparador sí habla — *"Esta tabla es inmutable:
  las filas se agregan, no se cambian ni se borran"*.

Las dos protegen. Sólo una avisa. Es el mismo patrón ya anotado para la agenda
y los cobros: **RLS filtra, no rechaza**.

### Probado contra las reglas, intentando romperlas

34 comprobaciones, cada una intentando la violación con la sesión real del rol
que la intentaría — `role authenticated` más `request.jwt.claims`, el mismo
camino que abre PostgREST, con RLS y `auth.uid()` de verdad:

| | Lo que se intentó | Lo que contestó la base |
|---|---|---|
| PR1 | Un vendedor se fija su propia meta | *"Definir presupuestos es de Administración."* |
| PR5 | Repetir la clave de idempotencia con otro monto | Quedó en 50.000.000, no en 99.999.999 |
| PR8 | El vendedor se baja la meta por `PATCH` directo | 0 filas; la meta quedó intacta |
| AJ1 | Un vendedor se ajusta la comisión a sí mismo | *"Crear ajustes es de Administración."* |
| AJ4 | Ajustar contra una observación inexistente | *"Esa observación no existe."* |
| AJ7 | Editar un ajuste ya creado | 0 filas; el importe quedó intacto |
| FU5 | Fusionar y perder el nombre viejo | Sobrevivió como sinónimo |
| FU7 | Fusionar hacia algo ya fusionado | *"El destino ya fue fusionado en otra actividad."* |
| RC4 | Reasignar sin decidir qué pasa con los planes | *"Decí qué pasa con los planes abiertos: cerrar o transferir."* |
| RC8 | — | Informó las líneas devengadas intactas |
| US1 | Un vendedor mira el uso de todo el equipo | *"El uso del equipo lo ve Administración."* |
| RG3 | Fabricar una línea de registro a nombre de otro | Rechazado por RLS |
| RG6 | Borrar una versión de participación publicada | *"Esta tabla es inmutable"* |

Y una más, sin número: intenté borrar el registro de accesos entero para
limpiar mis propias pruebas. **Se negó**, incluso corriendo como dueña de la
tabla. Las cinco líneas de esas pruebas siguen ahí, con mi nombre y mi rol.

### Dos rastros que dejaron las pruebas, y no se borran

- **Ojo Digital tiene tres versiones de participación.** La 1 es la del
  portafolio (50/50), la 2 la publiqué en 60/40 para probar el disparador, y la
  3 vuelve a 50/50 con el motivo escrito. No se puede borrar la 2 — y está
  bien: así se corrige una regla comercial, publicando la siguiente. La vigente
  es la 3, la regla comercial correcta.
- **El registro tiene nueve líneas de prueba**, todas a tu nombre porque probé
  con tu sesión. Append-only quiere decir esto.

### Cuatro mapeos que compilaban y mentían

`administracion.ts` casteaba filas `snake_case` directo al contrato
`camelCase` para el registro de accesos, las aperturas de enlace y las
sugerencias. TypeScript lo acepta con `as unknown as`; en ejecución
`entidadTipo` habría sido `undefined`. Reemplazados por tres funciones que
mapean campo por campo.

## Inicio, y las nueve enchufadas

La novena capa es chica —tres métodos— y su regla es una sola: **Inicio no
calcula nada por su cuenta**. Las cuatro cifras se proyectan de la misma
función que alimenta la pantalla de Dinero, y el contador de agenda sale de la
misma que arma la Agenda. Si Inicio dijera una cifra y Dinero otra, el vendedor
deja de creerle a las dos.

Dos decisiones que quedaron escritas ahí:

- **Lo que no es un seguimiento no se disfraza de seguimiento.** La agenda
  tiene ocho orígenes; el contrato admite cuatro para un "próximo seguimiento".
  El vencimiento de una cotización, una presentación enviada y una cotización
  en revisión son estados del circuito comercial: aparecen en la Agenda, no en
  la lista corta de Inicio. Antes que etiquetarlos mal, quedan afuera.
- **`sinDatosTodavia` es literal**: ninguna venta registrada. Con una venta
  cobrada en cero sigue siendo falso, porque hay actividad. La pantalla usa ese
  campo para dejar las dos acciones protagonistas como lo único accionable, en
  vez de mostrar cuatro ceros que no significan nada.

### El ensamblado

`apps/escritorio/src/datos/supabase/index.ts` junta las nueve en una sola
`CapaDatos`. Aparece recién ahora a propósito: una `CapaDatos` a medias compila
y revienta la primera vez que alguien abre la pantalla que falta. Que el
typechecker acepte el ensamblado es la prueba de que no falta ningún método.

### Cómo se elige el origen

`VITE_CAPA_DATOS=supabase|http|mock` manda. Sin esa variable:

- en desarrollo, **mock**;
- en producción, **Supabase** si `VITE_SUPABASE_URL` está configurada, y HTTP si no.

⛔ **Nunca mock en producción**, ni por descuido ni pidiéndolo: `VITE_CAPA_DATOS=mock`
en una construcción de producción ahora **falla al arrancar** con un mensaje
claro, en vez de servir datos de ejemplo como si fueran reales.

⛔ Y nunca Supabase sin su configuración: se decide acá, con lo que se sabe, en
vez de dejar que reviente a mitad de una pantalla con un error que no dice nada.

Construcción verificada: `npm run build` pasa, y el paquete que va al navegador
no contiene ninguna contraseña, ninguna clave de servicio, ningún teléfono ni
ninguna referencia a la firma del CEO.

## Las funciones de servidor

Tres, desplegadas en el proyecto. Son todo lo que el navegador **no** puede
hacer, y están ahí por una razón concreta cada una.

### `publico` — el enlace del cliente

La única puerta del sistema que se abre sin sesión. El cliente no tiene cuenta:
para que leyera su cotización desde el navegador haría falta una política que
deje leer cotizaciones sin sesión, y eso abre la tabla entera. Acá el servidor
valida el token, resuelve qué fila corresponde y devuelve **sólo** los campos
que ese cliente puede ver.

Lo que nunca sale por ahí, aunque esté en la misma fila: notas internas del
vendedor, precios de lista, comisiones, el plan que la originó, el ranking de
productos, el teléfono del CEO y la imagen de las firmas.

Un detalle que importa: **un solo mensaje** para token inexistente, vencido,
revocado y agotado. Distinguirlos le diría a quien prueba tokens al azar cuáles
existieron. El registro de aperturas sí distingue — ahí el motivo real queda.

### `documento` — el PDF definitivo

No puede vivir en el navegador (A12): el PDF lleva la imagen de la firma del
CEO incrustada, y generarlo del lado del cliente obligaría a mandarle esa
imagen a cualquiera que abra la pantalla. Acá se lee del depósito privado, se
incrusta, y lo único que sale es el PDF.

La función **no comprueba** que esté aprobada y firmada: llama a
`emitir_documento` con la sesión de quien pide, y de eso se encarga el
disparador `pdf_solo_si_aprobada`. Dos controles distintos para la misma regla
serían dos lugares donde equivocarse.

⛔ **No inventa activos.** Si falta la imagen de una firma, el documento sale
con el nombre y la aclaración de quien firmó, y una línea que dice *"(firma
registrada en el sistema)"*. Dibujar un garabato en lugar de una firma que no
está sería una falsificación.

### `avisos` — NO1 a NO4

La cola guarda `destino_protegido = 'ceo'`, una referencia. El número real vive
en una variable de entorno de esta función y no sale de ahí: no aparece en el
enlace, ni en el PDF, ni en el código del navegador, ni en la respuesta de la
API, ni en el mensaje de error de un aviso fallido. Lo único consultable desde
afuera es **si está configurado**, nunca cuál es.

⛔ **No hay proveedor de mensajería elegido, y no se simula uno.** Marcar
"enviada" una notificación que nadie mandó sería peor que dejarla pendiente: el
vendedor creería que al cliente ya lo llamaron. Mientras no exista
`PROVEEDOR_MENSAJES`, cada intento falla con el motivo escrito y la cola
reintenta con espera creciente (1, 5, 15, 60, 240 minutos) hasta rendirse a los
seis. El canal `panel_administracion` no necesita proveedor: la fila **es** el
aviso.

### El mismo cálculo, no uno equivalente

`supabase/functions/*/_compartido/calculo.ts` se **genera** con
`npm run copiar:funciones`, extrayendo por nombre los símbolos que hacen falta
de `packages/compartido/src/`. Nada se reescribe.

La razón: la cotización que ve el cliente, la que firma el CEO y la que sale en
el PDF tienen que dar exactamente los mismos números. Si alguien escribiera un
cálculo "equivalente" para el servidor, el día que difiera un redondeo el
cliente va a tener razón al reclamar. `npm run verificar:funciones` falla si la
copia se separó del original, y está dentro de `npm run verificar`.

⚠️ **Al desplegar**: la versión que corre hoy se subió por la herramienta de
gestión, archivo por archivo. Para garantizar que lo desplegado es byte a byte
lo del repositorio, desplegá con la CLI desde la raíz:
`supabase functions deploy publico documento avisos`. Un despliegue **reemplaza
todos los archivos** de la función, no sólo los que mandás.

## El circuito comercial, probado de punta a punta

Contra el servidor real, con los tres despliegues vivos:

| | Lo que se hizo | Lo que pasó |
|---|---|---|
| C1 | El vendedor firma y manda a revisión | La base exigió la firma antes de dejar avanzar |
| C2 | El CEO aprueba y firma | Con comentario obligatorio y sin poder aprobar lo suyo |
| C3 | Se crea el enlace | Token opaco, 32 bytes del generador criptográfico |
| — | El cliente abre el enlace desde un iPhone | Cotización completa, dispositivo detectado como `celular` |
| — | Token al azar | *"Este enlace ya no está disponible"*, el mismo mensaje que para uno vencido |
| — | Sin la clave publicable | HTTP 401 antes de llegar a la función |
| R1 | Responder sin marcar la casilla | *"Marcá la casilla para confirmar que revisaste la opción."* |
| R2 | Responder con una opción inventada | *"Elegí una de las opciones."* |
| R3 | Elegir *adelantado 12 meses* | Constancia guardada, importes congelados |
| R4 | Reenviar eligiendo **otra** opción | Devolvió la **primera** constancia: una por enlace, y no se reescribe |
| — | Los avisos, sin proveedor | 3 fallidos con motivo, reintento programado, constancia intacta (NO4) |
| D1 | Pedir el PDF sin sesión | Rechazado |
| D2 | Pedir el PDF con la sesión del vendedor | Generado, guardado en el depósito privado |
| — | Bajarlo por el enlace del cliente | Enlace firmado de 5 minutos, PDF de verdad |

Los números coincidieron en los tres lugares —página del cliente, constancia y
PDF— porque los tres corren el mismo código:

| Alternativa | Cuota | Total |
|---|---|---|
| Plan estándar | Gs. 750.000 × 12 | Gs. 11.400.000 |
| Adelantado 12 | Gs. 8.100.000 × 1 | Gs. 10.500.000 |
| Adelantado 24 | Gs. 14.400.000 × 1 | Gs. 16.800.000 |
| Diferido | Gs. 675.000 × 11 | Gs. 9.825.000 |

### Tres defectos que encontró esta prueba

**El PDF existía y nadie podía encontrarlo.** La fila de `documento_emitido` es
inmutable, así que guardar dónde quedó el archivo fallaba — y mi función no
miraba ese error, de modo que contestaba que todo había salido bien mientras el
PDF quedaba huérfano en el depósito. Se corrigió en los dos lados: la base
ahora admite **una sola transición** (poner la referencia cuando era nula, todo
lo demás igual), la función mira el error y, si no puede registrar el archivo,
lo borra en vez de dejarlo colgando. La ruta pasó a ser fija —una por
cotización y versión— así un reintento sobrescribe en lugar de acumular.

**El cliente no veía qué incluye y qué no.** Filtraba el alcance por una clase
(`condicion`) que la base no usa: las reales son `incluye`, `no_incluye` y
`limite`. Ahora viaja entero y con su etiqueta.

**El guardián de credenciales marcaba el nombre, no el valor.** `apikey` es el
nombre de una cabecera HTTP que Supabase fija y que el navegador tiene que
mandar; prohibirlo por el nombre obligaría a esconderlo, que es peor. La regla
ahora mira el **valor**: acepta una variable `VITE_…PUBLIC/PUBLICABLE/ANON` y
rechaza todo lo demás. Se probó en los dos sentidos —cuatro fugas inventadas
que tiene que atrapar y el caso legítimo que tiene que dejar pasar— y la prueba
está en el propio commit.

### Lo que la base no dejó limpiar

Al borrar los datos de prueba, la base se negó a eliminar la cotización, la
constancia, el documento emitido y el enlace. Está bien: son registros
inmutables de algo que un cliente respondió. El cliente de prueba quedó
archivado y renombrado `[PRUEBA] Repuestera del Este S.A.`.

⚠️ **Antes de salir a producción** conviene recrear la base desde las
migraciones: por diseño, esta historia no se puede borrar desde adentro.

### La puerta del cliente, en un navegador de verdad

`main.ts` decide el enlace del cliente **antes que cualquier otra cosa**. Si el
ruteo autenticado arrancara primero, mandaría a la pantalla de ingreso a
alguien que no tiene cuenta — lo último que tiene que ver quien recibió una
cotización. El enlace llega como `#/p/<token>`, y desde ahí no se monta nada
del Escritorio: ni disposición, ni menú, ni sesión.

Probado en Chromium sobre la construcción real
(`npm run verificar:enlace-cliente`):

- Sin responder, el cliente ve su cotización completa: folio y versión, a quién
  va, producto, fechas, las cuatro alternativas con sus totales, bases y
  condiciones, las seis opciones excluyentes con su texto exacto, la casilla
  obligatoria y *"Enviar mi elección"*.
- Ya respondida, ve su constancia y la frase que la define: *"Esto es una
  constancia comercial (un aval de intención). No es un contrato ni una firma
  electrónica legal."*
- De «Planificar», «Administración», «Cerrar sesión», «Mi cartera», «Comisión»
  o «Datos de ejemplo» no aparece nada. La comprobación falla si alguna se
  filtra.

**Y encontró un defecto que sólo se ve mirando la pantalla**: el servidor manda
`2026-10-05` y el cliente leía *"válida hasta el 04 de octubre"*. `new Date()`
sobre una fecha sin hora la toma como medianoche UTC, y Asunción está detrás de
UTC: la cotización le sacaba **un día** al cliente. Una fecha de calendario
ahora se dibuja como calendario, sin moverla de zona.

⚠️ **Una decisión tuya, Rodrigo**: la pantalla del cliente carga la tipografía
Inter desde Google. Funciona igual si no carga (cae a la del sistema), pero es
un pedido a un tercero desde el enlace que abre tu cliente. Se puede servir la
tipografía desde el propio sitio; avisame si querés que lo haga.

## Lo que falta del servidor

- ~~La capa de datos del navegador contra Supabase~~ — **hecha, las nueve.**
  Sesión, inicio, motor, clientes, agenda, fichas, propuestas, dinero y
  administración, ensambladas y enchufadas en `proveedor.ts`.
- Elegir proveedor de investigación y desplegar la función de servidor que lo
  llame. Mientras tanto rige el respaldo por taxonomía de arriba.
- ~~Generación del PDF~~ — **hecha** (`documento`).
- ~~Notificaciones salientes~~ — **la cola y los reintentos están hechos**
  (`avisos`). Falta que elijas proveedor de mensajería y cargues
  `PROVEEDOR_MENSAJES`, `PROVEEDOR_MENSAJES_CLAVE`, `CELULAR_CEO` y
  `WHATSAPP_CORPORATIVO` en las variables de la función.
- Transcripción de voz: falta elegir proveedor. Mientras tanto el vendedor
  escribe el seguimiento, que es lo que el contrato ya permite.
- El cronograma comercial: se arma sobre presentaciones y cotizaciones, que
  son de la capa de propuestas. Hasta que esa capa exista contra el servidor
  devuelve vacío. ⛔ Barras inventadas serían peores que ninguna.
