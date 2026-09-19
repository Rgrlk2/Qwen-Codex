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

## Migraciones aplicadas

1. `fundacion_identidad_y_roles` — usuarios sobre `auth.users`, los dos roles, la guardia.
2. `catalogo_cerrado_y_taxonomia` — los 13, precios de lista, taxonomía de tres capas.
3. `clientes_seguimientos_y_agenda` — cartera, contactos, seguimientos, audio, agenda.
4. `presentaciones_y_cotizaciones` — la máquina de estados comercial y las firmas.
5. `endurecer_funciones` — `search_path` fijo y permisos mínimos, tras el análisis de seguridad.

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

## Lo que falta del servidor

- Fichas, documentos emitidos, enlaces con token y registro de aperturas.
- Dinero: participaciones, mensualidades, cobros, liquidaciones, presupuestos.
- Notificaciones y constancias.
- La capa de datos del navegador contra Supabase, en reemplazo del mock.
- Generación del PDF y transcripción de voz (funciones de servidor).
