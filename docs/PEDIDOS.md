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

_(sin pedidos)_

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
