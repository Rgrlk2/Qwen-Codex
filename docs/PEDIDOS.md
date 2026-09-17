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

_(sin pedidos)_
