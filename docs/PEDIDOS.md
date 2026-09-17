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

_(sin pedidos)_

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

### [S4] 2026-09-17 — apps/escritorio no declara `vite` como dependencia ni trae `vite-env.d.ts`
Archivo: apps/escritorio/package.json, vite.config.ts   (dueña: S1)
Necesito: `npm run dev`/`vite build` funcionan porque Vite resuelve
`import './estilos.css'` en tiempo de bundle, pero `tsc -b` (que sí corre en
CI vía `npm run typecheck`) no conoce ese import sin una declaración
ambiental. Mientras tanto, Clientes y Agenda agregan su propio
`declare module '*.css'` en un `tipos.d.ts` local. Cuando exista
`vite-env.d.ts` (o se agregue `vite` a `devDependencies` con sus tipos), esos
archivos locales se pueden borrar.
Bloqueante: no

### [S4] 2026-09-15 — apps/escritorio/src/main.ts y nucleo/rutas no montan ninguna vista todavía
Archivo: apps/escritorio/src/main.ts, src/nucleo/{estados,disposicion,formato}.ts   (dueña: S1/S2)
Necesito: el ruteo real, la cáscara y los helpers de formato/estado compartidos para probar
Clientes y Agenda end-to-end en el navegador. Mientras tanto, ambas vistas son autocontenidas:
implementan sus propios cuatro estados y su propio formato es-PY localmente, siguiendo el
mismo contrato documentado en DESIGN_SYSTEM.md y formato.ts, para no bloquear la sesión.
Bloqueante: no

## S5 · Presentaciones y cotizaciones

_(sin pedidos)_

## S6 · Finanzas y administración

_(sin pedidos)_
