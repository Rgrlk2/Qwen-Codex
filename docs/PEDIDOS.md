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

_(sin pedidos)_

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

_(sin pedidos)_

## S5 · Presentaciones y cotizaciones

_(sin pedidos)_

## S6 · Finanzas y administración

_(sin pedidos)_
