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

_(sin pedidos)_

## S3 · Motor de planificación e investigación

_(sin pedidos)_

## S4 · Clientes, voz, seguimiento y agenda

_(sin pedidos)_

## S5 · Presentaciones y cotizaciones

_(sin pedidos)_

## S6 · Finanzas y administración

_(sin pedidos)_
