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

## Lo que falta del servidor

- La capa de datos del navegador contra Supabase, en reemplazo del mock:
  hecha la sesión, faltan clientes, motor, fichas, propuestas y dinero.
- Generación del PDF y transcripción de voz (funciones de servidor).
- Notificaciones salientes.
