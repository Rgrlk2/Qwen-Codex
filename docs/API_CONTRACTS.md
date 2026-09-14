# API_CONTRACTS — Escritorio Vendedores Lab.IA

> Contrato entre las vistas y la capa de datos. **Las vistas nunca llaman `fetch` directo.**
> Expresión ejecutable: `packages/compartido/src/api.ts`.
> Dos implementaciones del mismo contrato: `mock` (sin backend, para construir en paralelo) y `http`.

---

## 0. Principios

| # | Principio |
|---|---|
| A1 | **Un solo puerto.** Toda vista consume `CapaDatos`. Cambiar de mock a HTTP no toca una línea de vista. |
| A2 | **Errores tipados, no excepciones sueltas.** Todo error es un `ErrorApi` con `codigo`, `mensajeAmable` y `pista`. La interfaz muestra `mensajeAmable`, nunca un stack ni un código HTTP crudo. |
| A3 | **Sin `any`.** El contrato es la barrera entre seis sesiones paralelas; un `any` la anula. |
| A4 | **Paginación explícita** en todo listado. Sin listados abiertos. |
| A5 | **Idempotencia** en toda escritura: `claveIdempotencia` obligatoria en creación y en acciones de estado. |
| A6 | **El servidor manda en dinero.** El cliente calcula para previsualizar; el servidor recalcula y su resultado prevalece. |
| A7 | **Las respuestas nunca traen copy de producto.** Traen `productoId`; el copy se resuelve contra `content/copy/`. |
| A8 | **Nada se persiste desde voz o texto sin `confirmadoPorUsuario: true`** en el cuerpo de la petición. |

---

## 1. Envoltura común

```ts
type Resultado<T> =
  | { ok: true;  datos: T }
  | { ok: false; error: ErrorApi };

interface ErrorApi {
  codigo: CodigoError;
  mensajeAmable: string;   // se muestra al usuario, en es-PY
  pista?: string;          // qué puede hacer al respecto
  campo?: string;          // para errores de validación
  detalle?: unknown;       // sólo para registro técnico, nunca para pantalla
}

type CodigoError =
  | "no_autenticado" | "sin_permiso" | "no_encontrado" | "validacion"
  | "conflicto_version" | "regla_comercial" | "limite_excedido"
  | "enlace_vencido" | "enlace_revocado" | "tope_aperturas"
  | "servicio_no_disponible" | "tiempo_agotado" | "desconocido";

interface Pagina<T> {
  items: T[];
  cursor: string | null;   // null = no hay más
  total: number | null;    // null cuando el conteo es caro
}
```

### Códigos HTTP → `CodigoError`

| HTTP | Código | Ejemplo |
|---|---|---|
| 400 | `validacion` | falta rubro principal |
| 401 | `no_autenticado` | sesión vencida |
| 403 | `sin_permiso` | vendedor intentando aprobar |
| 404 | `no_encontrado` | cotización inexistente |
| 409 | `conflicto_version` | la cotización cambió mientras se editaba |
| 410 | `enlace_vencido` / `enlace_revocado` | enlace público caído |
| 422 | `regla_comercial` | descuento fuera de límite |
| 429 | `limite_excedido` | demasiadas peticiones |
| 5xx | `servicio_no_disponible` | backend caído |

⛔ Ningún `mensajeAmable` contiene el código HTTP, el nombre de una tabla ni una traza.

---

## 2. Superficie `CapaDatos`

Agrupada por vista. Cada grupo tiene **una sesión dueña** (`docs/PARALLEL_SESSIONS.md`); el contrato completo lo congela la **Sesión 1**.

### 2.1 Sesión / identidad
```ts
sesionActual(): Promise<Resultado<Sesion>>;
cerrarSesion(): Promise<Resultado<void>>;
```

### 2.2 Mi Día — vista 01
```ts
indicadoresDelDia(): Promise<Resultado<IndicadorDia[]>>;
agendaDelDia(fecha?: ISODate): Promise<Resultado<CompromisoAgenda[]>>;
pendientes(filtro?: FiltroPendientes): Promise<Resultado<Pagina<Pendiente>>>;
requierenAtencion(): Promise<Resultado<SenalAtencion[]>>;
graficosDelDia(): Promise<Resultado<GraficosDia>>;
resolverPendiente(id: string, clave: ClaveIdempotencia): Promise<Resultado<Pendiente>>;
consultarMiDia(pregunta: string): Promise<Resultado<RespuestaConsulta>>;
```

**`consultarMiDia` — contrato estricto:**
- `RespuestaConsulta` incluye `fuentes: ReferenciaFuente[]` **no vacío**. Una respuesta sin fuente es un error, no una respuesta.
- ⛔ **Sólo lectura.** No crea, no modifica, no dispara acciones. Una respuesta nunca contiene un efecto secundario.
- Si no hay datos suficientes, responde que no los hay. **No estima, no completa, no infiere.**

### 2.3 Mi Cartera — vista 02
```ts
listarCuentas(filtro: FiltroCuentas, cursor?: string): Promise<Resultado<Pagina<Cuenta>>>;
obtenerCuenta(id: string): Promise<Resultado<CuentaDetalle>>;
crearCuenta(datos: NuevaCuenta, clave: ClaveIdempotencia): Promise<Resultado<Cuenta>>;
actualizarCuenta(id: string, cambios: Partial<NuevaCuenta>, version: number): Promise<Resultado<Cuenta>>;
listarContactos(cuentaId: string): Promise<Resultado<Contacto[]>>;
lineaDeTiempo(cuentaId: string, cursor?: string): Promise<Resultado<Pagina<EventoLineaTiempo>>>;

listarRubros(): Promise<Resultado<Rubro[]>>;
resumenPorRubro(rubroId: string): Promise<Resultado<ResumenRubro>>;

listarPlanes(filtro: FiltroPlanes): Promise<Resultado<Pagina<PlanDeAccion>>>;
crearPlan(datos: NuevoPlan, clave: ClaveIdempotencia): Promise<Resultado<PlanDeAccion>>;
cerrarPlan(id: string, motivo: MotivoCierrePlan, comentario: string): Promise<Resultado<PlanDeAccion>>;
objetivosSugeridos(planId: string): Promise<Resultado<ObjetivoSugerido[]>>;
aceptarObjetivo(objetivoId: string, clave: ClaveIdempotencia): Promise<Resultado<ObjetivoSugerido>>;
```
**Reglas:** `crearPlan` con `eje: "rubro"` y `cuentaId` presente ⇒ `validacion`. `cerrarPlan` sin motivo ⇒ `validacion`.

### 2.4 Mi Portafolio — vista 03
```ts
listarProductos(filtro?: FiltroProductos): Promise<Resultado<Producto[]>>;      // siempre ≤ 13
obtenerProducto(id: ProductoId): Promise<Resultado<ProductoDetalle>>;
preciosDeProducto(id: ProductoId): Promise<Resultado<PrecioCatalogo[]>>;
productosRecomendados(cuentaId: string): Promise<Resultado<ProductoId[]>>;
crearSugerenciaProducto(datos: NuevaSugerencia, clave: ClaveIdempotencia): Promise<Resultado<SugerenciaProducto>>;
listarMisSugerencias(cursor?: string): Promise<Resultado<Pagina<SugerenciaProducto>>>;
```
**Reglas:** `listarProductos` devuelve como máximo **13** ítems, todos con `id` dentro del catálogo cerrado. Cualquier otro id es un fallo de contrato, no un dato. `ProductoDetalle` trae `claveCopy`, **no** el texto del copy.

### 2.5 Mis Propuestas — vista 04
```ts
// Presentaciones
listarPresentaciones(filtro, cursor?): Promise<Resultado<Pagina<Presentacion>>>;
crearPresentacion(datos: NuevaPresentacion, clave: ClaveIdempotencia): Promise<Resultado<Presentacion>>;
actualizarPresentacion(id: string, cambios, version: number): Promise<Resultado<Presentacion>>;

// Cotizaciones
listarCotizaciones(filtro, cursor?): Promise<Resultado<Pagina<Cotizacion>>>;
obtenerCotizacion(id: string): Promise<Resultado<CotizacionDetalle>>;
crearCotizacion(datos: NuevaCotizacion, clave: ClaveIdempotencia): Promise<Resultado<Cotizacion>>;
actualizarCotizacion(id: string, cambios, version: number): Promise<Resultado<Cotizacion>>;
previsualizarTotales(items: ItemCotizacionEntrada[]): Promise<Resultado<Dinero[]>>;
enviarAAprobacion(id: string, comentario: string, clave: ClaveIdempotencia): Promise<Resultado<Cotizacion>>;
marcarDesenlace(id: string, desenlace: "aceptada" | "perdida", motivo?: string): Promise<Resultado<Cotizacion>>;
historialVersiones(id: string): Promise<Resultado<VersionCotizacion[]>>;

// Documentos y enlaces
emitirPdf(propuestaId: string, clave: ClaveIdempotencia): Promise<Resultado<DocumentoEmitido>>;
crearEnlace(propuestaId: string, opciones: OpcionesEnlace, clave: ClaveIdempotencia): Promise<Resultado<EnlaceCompartido>>;
revocarEnlace(enlaceId: string, motivo: string): Promise<Resultado<EnlaceCompartido>>;
accesosDePropuesta(propuestaId: string, cursor?: string): Promise<Resultado<Pagina<AccesoEnlace>>>;
```
**Reglas:**
- `previsualizarTotales` devuelve **un `Dinero` por moneda**. Nunca un único total consolidado.
- `enviarAAprobacion` sobre una cotización con `items[].aCotizar === true` es válido; enviarla **al cliente** sin aprobación no.
- `emitirPdf` es idempotente por `(propuestaId, versionPropuesta)`: dos llamadas devuelven el mismo `DocumentoEmitido`.
- `actualizarCotizacion` sobre estado `aprobada` ⇒ crea versión nueva en `borrador` y caduca la aprobación. La respuesta lo informa en `avisos[]`.

### 2.6 Mi Seguimiento — vista 05
```ts
listarSeguimientos(filtro: FiltroSeguimientos, cursor?): Promise<Resultado<Pagina<Seguimiento>>>;
procesarCaptura(entrada: CapturaSeguimiento): Promise<Resultado<PropuestaDeSeguimiento>>;
guardarSeguimiento(datos: SeguimientoConfirmado, clave: ClaveIdempotencia): Promise<Resultado<Seguimiento>>;
subirAudio(archivo: Blob, clave: ClaveIdempotencia): Promise<Resultado<AudioSeguimiento>>;
borrarAudio(audioId: string, motivo: string): Promise<Resultado<void>>;
actualizarPaso(pasoId: string, estado: EstadoPaso): Promise<Resultado<PasoSugerido>>;
```
**Reglas:**
- `procesarCaptura` **no persiste nada**. Devuelve una propuesta para que el usuario confirme.
- `guardarSeguimiento` exige `confirmadoPorUsuario: true`; sin eso ⇒ `validacion`.
- `PropuestaDeSeguimiento.productosMencionados` sólo contiene ids de los 13; lo demás va en `mencionesFueraDeCatalogo: string[]`, que sólo puede derivar a una sugerencia (§2.4), nunca a un producto.

### 2.7 Mi Dinero — vista 06
```ts
resumenDinero(periodo: Periodo): Promise<Resultado<ResumenDinero>>;       // totales por moneda
listarMensualidades(filtro, cursor?): Promise<Resultado<Pagina<Mensualidad>>>;
listarComisiones(periodo: Periodo, cursor?): Promise<Resultado<Pagina<LineaComision>>>;
listarLiquidaciones(cursor?): Promise<Resultado<Pagina<Liquidacion>>>;
obtenerLiquidacion(id: string): Promise<Resultado<LiquidacionDetalle>>;
abrirDiscrepancia(datos: NuevaDiscrepancia, clave: ClaveIdempotencia): Promise<Resultado<Discrepancia>>;
```
**Reglas:** `ResumenDinero.totales` es `Dinero[]`, una entrada por moneda. ⛔ No existe ningún campo `totalConsolidado`. Toda escritura sobre comisiones desde este grupo está **prohibida por contrato**: no hay método para hacerlo.

### 2.8 Administración
```ts
// Usuarios y equipos
listarUsuarios(filtro, cursor?): Promise<Resultado<Pagina<Usuario>>>;
crearUsuario / actualizarUsuario / desactivarUsuario
fijarLimiteDescuento(usuarioId: string, limite: Dinero | null, motivo: string): Promise<Resultado<Usuario>>;
reasignarCartera(datos: ReasignacionCartera, clave: ClaveIdempotencia): Promise<Resultado<ResultadoReasignacion>>;

// Catálogo
publicarProducto(id: ProductoId, publicado: boolean, motivo: string): Promise<Resultado<Producto>>;
cargarPrecios(precios: PrecioCatalogoEntrada[], motivo: string): Promise<Resultado<{ versionCatalogo: number }>>;

// Aprobaciones
colaAprobacion(filtro, cursor?): Promise<Resultado<Pagina<SolicitudAprobacion>>>;
resolverAprobacion(id: string, accion: AccionAprobacion, comentario: string, clave: ClaveIdempotencia): Promise<Resultado<SolicitudAprobacion>>;
delegarAprobacion(id: string, aprobadorId: string, motivo: string): Promise<Resultado<SolicitudAprobacion>>;

// Dinero
listarReglasComision(cursor?): Promise<Resultado<Pagina<ReglaComision>>>;
publicarReglaComision(datos: NuevaReglaComision, clave: ClaveIdempotencia): Promise<Resultado<ReglaComision>>;
simularRegla(datos: NuevaReglaComision, periodo: Periodo): Promise<Resultado<SimulacionComision>>;
verificarCierrePeriodo(periodo: Periodo): Promise<Resultado<VerificacionCierre>>;
cerrarPeriodo(periodo: Periodo, clave: ClaveIdempotencia): Promise<Resultado<Liquidacion[]>>;
crearAjuste(datos: NuevoAjuste, clave: ClaveIdempotencia): Promise<Resultado<AjusteComision>>;
resolverDiscrepancia(id: string, resolucion, comentario: string): Promise<Resultado<Discrepancia>>;

// Sugerencias
listarSugerencias(filtro, cursor?): Promise<Resultado<Pagina<SugerenciaProducto>>>;
resolverSugerencia(id: string, resolucion: ResolucionSugerencia): Promise<Resultado<SugerenciaProducto>>;

// Registros
listarAccesosEnlace(filtro, cursor?): Promise<Resultado<Pagina<AccesoEnlace>>>;
listarAuditoria(filtro, cursor?): Promise<Resultado<Pagina<RegistroAuditoria>>>;
exportarAuditoria(filtro): Promise<Resultado<DocumentoEmitido>>;   // se audita a sí misma

// Parámetros
obtenerParametros(): Promise<Resultado<ParametrosSistema>>;
actualizarParametros(cambios: Partial<ParametrosSistema>, motivo: string): Promise<Resultado<ParametrosSistema>>;
```

**Reglas duras de administración:**
- ⛔ **No existe `crearProducto` ni `eliminarProducto`.** El portafolio cerrado se defiende en el contrato, no con una validación que alguien pueda saltear.
- ⛔ **No existe `editarReglaComision`.** Sólo `publicarReglaComision` con versión nueva.
- ⛔ **No existe `reabrirPeriodo`.** Sólo `crearAjuste`.
- ⛔ **No existe ningún método de escritura ni borrado sobre `RegistroAuditoria` ni `AccesoEnlace`.**
- `resolverAprobacion` con `actorId === solicitanteId` ⇒ `sin_permiso`.
- `cerrarPeriodo` exige `verificarCierrePeriodo` en verde; si no, ⇒ `regla_comercial` con la lista de bloqueos.

### 2.9 Enlace público (sin sesión)
```ts
obtenerPropuestaPublica(token: string, codigo?: string): Promise<Resultado<PropuestaPublica>>;
descargarPdfPublico(token: string): Promise<Resultado<{ url: string; venceEn: ISODate }>>;
```
**Reglas:** superficie mínima. ⛔ Sin datos de otras cuentas, sin navegación al Escritorio, sin listados. `PropuestaPublica` de una cotización `vencida` viene **sin importes** y con `avisoVigencia`. Cada llamada genera un `AccesoEnlace`; la respuesta **nunca** revela cuántos accesos hubo.

---

## 3. Concurrencia

| Mecanismo | Uso |
|---|---|
| `version: number` optimista | Toda entidad editable. Desajuste ⇒ `conflicto_version` con la versión actual en `detalle`, para que la vista ofrezca recargar sin perder lo escrito. |
| `claveIdempotencia: string` | Toda creación y toda acción de estado. El servidor devuelve el mismo resultado ante una repetición. Evita cotizaciones duplicadas por doble toque. |
| Bloqueo pesimista | **No se usa.** Con esta volumetría, agrega complejidad sin resolver nada. |

---

## 4. Implementaciones

| Implementación | Paquete | Uso |
|---|---|---|
| `CapaDatosMock` | `packages/mock` | Desarrollo en paralelo sin backend. Datos de ejemplo claramente marcados, latencia simulada, **modo de falla forzada** para poder probar los estados de error. |
| `CapaDatosHttp` | `apps/*/src/datos/http.ts` | Producción. Traduce HTTP ⇄ `Resultado<T>` según §1. |

**Regla de los datos de ejemplo** (heredada de la referencia): mientras el Escritorio corra con mock, la interfaz muestra de forma permanente el chip **"Datos de ejemplo"**. Nunca se presenta un dato ficticio como real.

---

## 5. Contrato de rendimiento

| Operación | Objetivo |
|---|---|
| Lecturas de vista (indicadores, listados) | p95 < 800 ms |
| `procesarCaptura` (voz/texto) | p95 < 6 s, con progreso visible desde el primer segundo |
| `emitirPdf` | p95 < 10 s, asíncrono con estado consultable |
| Enlace público | p95 < 1,5 s en 3G |

Superado el umbral, la interfaz **no se congela**: muestra progreso y deja cancelar.

---

## 6. Versionado

- La `CapaDatos` se versiona junto a `packages/compartido`.
- Un cambio que rompa el contrato exige acuerdo de las seis sesiones y lo aplica la **Sesión 1**. Ninguna otra sesión edita `api.ts`.
- Los cambios aditivos (campos opcionales, métodos nuevos) no rompen y se pueden pedir a Sesión 1 sin ceremonia.
