# API_CONTRACTS — Escritorio Vendedores Lab.IA

> **Versión 3.0.** Contrato entre las vistas y la capa de datos. **Las vistas nunca llaman `fetch` directo.**
> Expresión ejecutable: `packages/compartido/src/api.ts`. Dueño: **Sesión 1**.

---

## 0. Principios

| # | Principio |
|---|---|
| A1 | **Un solo puerto.** Toda vista consume `CapaDatos`. Cambiar de mock a HTTP no toca una línea de vista. |
| A2 | **Errores tipados.** Todo error es un `ErrorApi` con `codigo`, `mensajeAmable` y `pista`. ⛔ Nunca se muestra un código HTTP, una traza ni un nombre de tabla. |
| A3 | **Sin `any`.** El contrato es la barrera entre seis sesiones paralelas. |
| A4 | **Paginación explícita** en todo listado. |
| A5 | **Idempotencia** obligatoria en creación y en acciones de estado. |
| A6 | **El servidor manda en dinero.** El cliente previsualiza; el servidor recalcula y su resultado prevalece. |
| A7 | **Las respuestas nunca traen copy de producto.** Traen `productoId`. |
| A8 | **Nada se persiste desde voz o texto sin `confirmadoPorUsuario: true`.** |
| A9 | **El rol se verifica en el servidor.** Un método de administración llamado por un vendedor devuelve `sin_permiso`, siempre. |
| A10 | **Los activos sensibles se sirven desde el servidor.** Firmas y números de contacto se referencian por un identificador que ⛔ sólo el servidor resuelve. Nunca viaja una URL pública ni el valor en claro. |
| A11 | **Ninguna clave ni dato sensible vive en el navegador.** Proveedores de investigación y de modelo de lenguaje, firmas y destinos de notificación: todo pasa por el servidor. |

---

## 1. Envoltura común

```ts
type Resultado<T> =
  | { ok: true;  datos: T }
  | { ok: false; error: ErrorApi };

interface ErrorApi {
  codigo: CodigoError;
  mensajeAmable: string;   // se muestra al usuario, en es-PY
  pista?: string;
  campo?: string;
  detalle?: unknown;       // sólo registro técnico
}

type CodigoError =
  | "credenciales_invalidas" | "no_autenticado" | "sin_permiso" | "no_encontrado"
  | "validacion" | "conflicto_version" | "regla_comercial"
  | "requiere_aprobacion" | "requiere_firma" | "monedas_mezcladas"
  | "enlace_vencido" | "enlace_revocado" | "tope_aperturas"
  | "limite_excedido" | "servicio_no_disponible" | "tiempo_agotado" | "desconocido";

interface Pagina<T> { items: T[]; cursor: string | null; total: number | null }
```

| HTTP | Código |
|---|---|
| 400 | `validacion` / `monedas_mezcladas` |
| 401 | `no_autenticado` / `credenciales_invalidas` |
| 403 | `sin_permiso` |
| 404 | `no_encontrado` |
| 409 | `conflicto_version` |
| 410 | `enlace_vencido` / `enlace_revocado` |
| 422 | `regla_comercial` / `requiere_aprobacion` / `requiere_firma` |
| 429 | `limite_excedido` |
| 5xx | `servicio_no_disponible` |

---

## 2. Superficie

Cada grupo tiene **una sesión dueña** (`docs/PARALLEL_SESSIONS.md`). El contrato completo lo congela **Sesión 1**.

### 2.1 Sesión y autenticación — S1
```ts
ingresar(usuario: string, clave: string): R<Sesion>;
sesionActual(): R<Sesion>;
cerrarSesion(): R<void>;
cambiarClave(actual: string, nueva: string): R<void>;
```
⛔ `Sesion.rol` es `"vendedor" | "administrador"`. No hay otros valores posibles.

### 2.2 Inicio — S2
```ts
resumenInicio(): R<ResumenInicio>;          // las cuatro cifras
proximosSeguimientos(limite?: number): R<ProximoSeguimiento[]>;
```
`ResumenInicio` trae `dineroVendido`, `dineroCobrado`, `comisionAcumulada` y `comisionPendiente`, cada uno como `TotalesPorMoneda`.

⛔ **No existe ningún método de analítica**: sin embudos, sin tasas de conversión, sin mezcla de productos, sin series para gráficos decorativos. Lo que no está en el contrato no se puede dibujar.

### 2.3 Motor de planificación e investigación — S3
```ts
// --- Investigación automática ---
// ⛔ Corre en el SERVIDOR. El cliente recibe el resultado ya clasificado.
investigarObjetivo(entrada: EntradaObjetivo): R<InvestigacionObjetivo>;
estadoInvestigacion(id: Id): R<InvestigacionObjetivo>;
corregirInvestigacion(inv: InvestigacionObjetivo, correcciones: CorreccionDato[]): R<InvestigacionCorregida>;
planDesdeInvestigacion(inv: InvestigacionObjetivo): R<Plan>;
```

**Reglas de la investigación:**

| # | Regla |
|---|---|
| I1 | `EntradaObjetivo` admite **empresa** (RUC · razón social · nombre comercial), **profesional** (nombre · profesión; matrícula y ciudad opcionales) y **rubro** (texto libre). |
| I2 | ⛔ **Nunca devuelve un formulario largo vacío.** Si falla, marca `usoRespaldoTaxonomia: true` y devuelve `datosMinimosFaltantes` con **uno a tres campos**, cada uno con su pregunta y su *por qué hace falta*. |
| I3 | Todo dato es un `DatoInvestigado` con `clasificacion` (`verificado` · `inferido` · `no_encontrado`), `confianza` y `fuentesIds`. |
| I4 | `clasificacion === 'inferido'` ⇒ `razonamiento` no vacío. `'no_encontrado'` ⇒ `valor === null` y `confianza === null`. |
| I5 | `tamanoAproximado` sólo se completa con evidencia. Sin evidencia: `no_encontrado`. ⛔ No se estima. |
| I6 | `fuentesConsultadas` incluye **también las que fallaron**, con su motivo. El vendedor tiene derecho a saber qué no se pudo mirar. |
| I7 | ⛔ `investigarObjetivo` **no persiste**. El vendedor confirma primero. |
| I8 | `corregirInvestigacion` devuelve `cambios`: qué producto se movió en el ranking y por qué. |
| I9 | ⛔ **Ninguna clave, token ni endpoint de proveedor externo puede aparecer en el código del cliente.** Verificado por `scripts/verificar-portafolio.mjs`. |

```ts
// Taxonomía
buscarActividad(texto: string): R<Actividad[]>;
// ⛔ Nunca devuelve "no encontrado": crea el término como pendiente_de_revision.
resolverActividad(texto: string, clave: ClaveIdempotencia): R<Actividad>;
listarOperaciones(): R<Operacion[]>;
listarNecesidades(): R<Necesidad[]>;

// El plan
generarPlan(entrada: EntradaPlan): R<Plan>;              // ⛔ no persiste
recalcularPlan(plan: Plan, ajustes: AjustePerfil[]): R<PlanRecalculado>;
guardarPlan(plan: Plan, clave: ClaveIdempotencia): R<Plan>;
obtenerPlan(id: Id): R<Plan>;
listarPlanes(filtro: FiltroPlanes, pagina?): R<Pagina<Plan>>;
cerrarPlan(id: Id, motivo: MotivoCierrePlan, comentario: string): R<Plan>;
objetivosSugeridos(planId: Id): R<ObjetivoSugerido[]>;
aceptarObjetivo(objetivoId: Id, clave: ClaveIdempotencia): R<ObjetivoSugerido>;

// Portafolio
listarProductos(filtro?): R<Producto[]>;                 // ⛔ siempre ≤ 13
obtenerProducto(id: ProductoId): R<ProductoDetalle>;
preciosDeProducto(id: ProductoId): R<PrecioLista[]>;

// Sugerencias
crearSugerencia(datos: NuevaSugerencia, clave: ClaveIdempotencia): R<SugerenciaProducto>;
listarMisSugerencias(pagina?): R<Pagina<SugerenciaProducto>>;
```

**Reglas del motor:**
- `resolverActividad` **nunca** devuelve `no_encontrado`. Crea el término y lo devuelve como `pendiente_de_revision`.
- `generarPlan` **no persiste nada**: devuelve el plan para que el vendedor lo ajuste.
- `Plan.ranking` trae **exactamente 13** posiciones, sin repetidos, cada una con `motivo` no vacío.
- `recalcularPlan` devuelve además `cambios: CambioPlan[]`: qué se movió y por qué.
- `listarProductos` devuelve como máximo **13** ítems, todos del catálogo cerrado. Cualquier otro id es un fallo de contrato, no un dato.

### 2.4 Agenda operativa — S4
```ts
agendaHoy(fecha?: ISODate): R<AgendaHoy>;
agendaSemana(desde?: ISODate): R<AgendaSemana>;
agendaMes(anio: number, mes: number): R<AgendaMes>;
cronogramaComercial(desde: ISODate, hasta: ISODate): R<CronogramaComercial>;
listarEntradas(filtro: FiltroAgenda, pagina?): R<Pagina<EntradaAgenda>>;
entradasAtrasadas(pagina?): R<Pagina<EntradaAgenda>>;

crearEntradaManual(datos: NuevaEntradaManual, clave: ClaveIdempotencia): R<EntradaAgenda>;
ajustarEntrada(ajuste: AjusteEntrada): R<EntradaAgenda>;
completarEntrada(entradaId: Id, clave: ClaveIdempotencia): R<EntradaAgenda>;
descartarEntrada(entradaId: Id, motivo: string): R<EntradaAgenda>;
```

**Reglas de la agenda:**

| # | Regla |
|---|---|
| A1 | ⛔ **La agenda se puebla sola.** El servidor deriva las entradas de planes, objetivos aceptados, seguimientos, presentaciones, cotizaciones, vencimientos y aperturas de enlace. |
| A2 | `crearEntradaManual` es la **excepción**, y sólo admite `visita`, `llamada` y `proximo_paso`. |
| A3 | ⛔ `ajustarEntrada` exige `motivo`. Sin motivo ⇒ `validacion`. |
| A4 | Una entrada vencida y pendiente vuelve con `atrasada: true` y `diasDeAtraso`. ⛔ No se reprograma sola ni se oculta. |
| A5 | ⛔ **No existe `borrarEntrada`.** Se descarta con motivo; queda en la historia. |
| A6 | `resumenAgenda()` (en `CapaInicio`) devuelve sólo dos contadores. ⛔ Inicio no duplica la agenda. |

### 2.5 Clientes, voz y seguimiento — S4
```ts
listarClientes(filtro: FiltroClientes, pagina?): R<Pagina<Cliente>>;
obtenerCliente(id: Id): R<ClienteDetalle>;
crearCliente(datos: NuevoCliente, clave: ClaveIdempotencia): R<Cliente>;
actualizarCliente(id: Id, cambios, version: Version): R<Cliente>;
listarContactos(clienteId: Id): R<Contacto[]>;
lineaDeTiempo(clienteId: Id, pagina?): R<Pagina<EventoLineaTiempo>>;

soporteDictado(): R<SoporteDictado>;
subirAudio(archivo: Blob, clave: ClaveIdempotencia): R<AudioSeguimiento>;
procesarCaptura(entrada: CapturaSeguimiento): R<PropuestaDeSeguimiento>;   // ⛔ no persiste
guardarSeguimiento(datos: SeguimientoConfirmado, clave: ClaveIdempotencia): R<Seguimiento>;
listarSeguimientos(filtro, pagina?): R<Pagina<Seguimiento>>;
borrarAudio(audioId: Id, motivo: string): R<void>;
actualizarPaso(pasoId: Id, estado: EstadoPaso): R<PasoSugerido>;
```
- `procesarCaptura` **no escribe nada**.
- `guardarSeguimiento` exige `confirmadoPorUsuario: true`; sin eso ⇒ `validacion`.
- `mencionesFueraDeCatalogo` sólo puede derivar a una sugerencia, ⛔ nunca a un producto.
- `borrarAudio` borra el audio; ⛔ **no** borra la transcripción ni el seguimiento.

### 2.6 Presentaciones y cotizaciones — S5
```ts
// Presentación — sin precio definitivo, sin aprobación
listarPresentaciones(filtro, pagina?): R<Pagina<Presentacion>>;
crearPresentacion(datos: NuevaPresentacion, clave: ClaveIdempotencia): R<Presentacion>;
actualizarPresentacion(id: Id, cambios, version: Version): R<Presentacion>;
emitirPresentacion(id: Id, clave: ClaveIdempotencia): R<DocumentoEmitido>;

// Cotización — el vendedor manda SÓLO los dos precios especiales
listarCotizaciones(filtro, pagina?): R<Pagina<Cotizacion>>;
obtenerCotizacion(id: Id): R<CotizacionDetalle>;
crearCotizacion(datos: NuevaCotizacion, clave: ClaveIdempotencia): R<Cotizacion>;
actualizarCotizacion(id: Id, cambios, version: Version): R<Cotizacion>;
previsualizarCotizacion(productoId: ProductoId, precios: PreciosEntrada,
                        variante?: string): R<PrevisualizacionCotizacion>;
previsualizarTotales(base: BaseCalculo): R<TotalesPorMoneda>;
compararConLista(productoId: ProductoId, precios: PreciosEntrada): R<ComparacionConLista>;
historialVersiones(id: Id): R<VersionCotizacion[]>;

// Firma del vendedor, antes de revisión
firmarComoVendedor(cotizacionId: Id, clave: ClaveIdempotencia): R<Firma>;
enviarARevision(id: Id, comentario: string, clave: ClaveIdempotencia): R<Cotizacion>;

// Sólo después de aprobar
emitirPdfDefinitivo(cotizacionId: Id, clave: ClaveIdempotencia): R<DocumentoEmitido>;
enviarAlCliente(cotizacionId: Id, clave: ClaveIdempotencia): R<Cotizacion>;
marcarDesenlace(id: Id, desenlace: "aceptada" | "perdida", motivo?: string): R<Cotizacion>;

// Enlaces, aperturas y respuesta
crearEnlace(propuestaId: Id, opciones: OpcionesEnlace, clave: ClaveIdempotencia): R<EnlaceCompartido>;
revocarEnlace(enlaceId: Id, motivo: string): R<EnlaceCompartido>;
aperturasDePropuesta(propuestaId: Id, pagina?): R<Pagina<AccesoEnlace>>;
constanciaDeCotizacion(cotizacionId: Id): R<ConstanciaRespuesta | null>;
```

**Reglas duras:**
- ⛔ **No existe `aprobarCotizacion` en esta capa.** Aprobar es de administración (§2.8).
- `crearCotizacion` recibe **`PreciosEntrada`**: `setupEspecial` y `mensualEspecial`, nada más. ⛔ Precios de lista, ahorros, alternativas, totales y logos **no se envían**: salen del catálogo y del cálculo del servidor.
- ⛔ **El servidor vuelve a ejecutar los cuatro cálculos antes de aprobar.** El navegador puede previsualizar con las funciones puras de `alternativas.ts`, pero **el resultado del servidor prevalece**.
- Monedas distintas en la base ⇒ `monedas_mezcladas`. ⛔ Nunca un total mezclado.
- `previsualizarTotales` devuelve **un `Dinero` por moneda**. ⛔ Nunca un total consolidado.
- `firmarComoVendedor` manda **la intención de firmar**, ⛔ nunca la imagen ni su ubicación. El servidor resuelve `referenciaProtegida`.
- `enviarARevision` sin firma de vendedor vigente ⇒ `requiere_firma`.
- `emitirPdfDefinitivo` sobre una cotización que no está `aprobada` ⇒ `requiere_aprobacion`; sin las **dos** firmas vigentes ⇒ `requiere_firma`.
- `enviarAlCliente` sobre una cotización que no está `aprobada` ⇒ `requiere_aprobacion`.
- `actualizarCotizacion` sobre `aprobada` crea versión nueva en `borrador`, **caduca la aprobación y anula las firmas**; la respuesta lo informa en `avisos[]`.
- `emitirPdfDefinitivo` es idempotente por `(cotizacionId, version)`.

### 2.7 Dinero del vendedor — S6
```ts
resumenDinero(periodo: PeriodoMensual): R<ResumenDinero>;   // las ocho cifras, por moneda
listarMensualidades(filtro, pagina?): R<Pagina<Mensualidad>>;
listarLineasParticipacion(periodo: PeriodoMensual, pagina?): R<Pagina<LineaParticipacion>>;
listarLiquidaciones(pagina?): R<Pagina<Liquidacion>>;
obtenerLiquidacion(id: Id): R<LiquidacionDetalle>;
abrirObservacion(datos: NuevaObservacion, clave: ClaveIdempotencia): R<Observacion>;
```
⛔ **No existe ningún método de escritura sobre participaciones, líneas ni liquidaciones en esta capa.** El vendedor observa; no edita.

### 2.8 Administración — S6 · sólo rol `administrador`
```ts
// Control financiero
controlFinanciero(periodo: PeriodoMensual): R<ControlFinanciero>;
porCobrar(filtro, pagina?): R<Pagina<LineaPorCobrar>>;          // con antigüedad
rankingVendedores(periodo: PeriodoMensual): R<FilaRanking[]>;   // ⛔ en guaraníes

// Presupuesto
listarPresupuestos(periodo: PeriodoMensual): R<Presupuesto[]>;
definirPresupuesto(datos: NuevoPresupuesto, clave: ClaveIdempotencia): R<Presupuesto>;

// Comisiones
listarParticipacionesTodas(periodo, pagina?): R<Pagina<LineaParticipacion>>;
verificarCierrePeriodo(periodo): R<VerificacionCierre>;
cerrarPeriodo(periodo, clave: ClaveIdempotencia): R<Liquidacion[]>;
crearAjuste(datos: NuevoAjuste, clave: ClaveIdempotencia): R<Ajuste>;
resolverObservacion(id: Id, estado, comentario: string): R<Observacion>;

// Clientes de toda la operación
listarTodosLosClientes(filtro, pagina?): R<Pagina<Cliente>>;
lineaDeTiempoDeCualquierCliente(clienteId: Id, pagina?): R<Pagina<EventoLineaTiempo>>;

// Aprobación de cotizaciones, firmas y constancias
colaDeRevision(filtro, pagina?): R<Pagina<CotizacionDetalle>>;
recalcularCotizacion(id: Id): R<AlternativaCalculada[]>;      // ⛔ los cuatro cálculos, en servidor
revisarCotizacion(id: Id, accion: "aprobar" | "corregir" | "rechazar",
                  comentario: string, clave: ClaveIdempotencia,
                  alternativasAprobadas?: CodigoAlternativa[]): R<Cotizacion>;
firmarComoCeo(cotizacionId: Id, clave: ClaveIdempotencia): R<Firma>;
firmasDeCotizacion(cotizacionId: Id): R<Firma[]>;
anulacionesDeFirma(cotizacionId: Id, rol?: RolFirmante): R<Firma[]>;
listarConstancias(pagina?): R<Pagina<ConstanciaRespuesta>>;
reintentarNotificaciones(constanciaId: Id): R<ResultadoNotificaciones>;

// Configuración comercial
listarParticipaciones(): R<ParticipacionProducto[]>;
publicarParticipacion(datos: NuevaParticipacion, clave: ClaveIdempotencia): R<ParticipacionProducto>;
listarActividadesPendientes(pagina?): R<Pagina<Actividad>>;
confirmarActividad(id: Id): R<Actividad>;
fusionarActividad(origenId: Id, destinoId: Id, motivo: string): R<Actividad>;
editarTaxonomia(cambio: CambioTaxonomia, clave: ClaveIdempotencia): R<void>;
listarVendedores(filtro, pagina?): R<Pagina<Usuario>>;
crearVendedor(datos: NuevoUsuario, clave: ClaveIdempotencia): R<Usuario>;
desactivarVendedor(id: Id, motivo: string): R<Usuario>;
reasignarCartera(datos: ReasignacionCartera, clave: ClaveIdempotencia): R<ResultadoReasignacion>;

// Accesos y frecuencia de uso
usoPorVendedor(periodo: PeriodoMensual): R<UsoPorVendedor[]>;
listarRegistroAcceso(filtro, pagina?): R<Pagina<RegistroAcceso>>;
listarAperturasEnlace(filtro, pagina?): R<Pagina<AccesoEnlace>>;

// Sugerencias
listarSugerencias(filtro, pagina?): R<Pagina<SugerenciaProducto>>;
resolverSugerencia(id: Id, resolucion: ResolucionSugerencia): R<SugerenciaProducto>;
```

**Reglas duras que el contrato defiende por ausencia:**

| ⛔ Método que NO existe | Por qué |
|---|---|
| `crearProducto`, `eliminarProducto` | El portafolio está cerrado en 13. |
| `editarParticipacion` | Sólo `publicarParticipacion`, con versión nueva. |
| `reabrirPeriodo` | Sólo `crearAjuste`. |
| Escritura o borrado sobre `RegistroAcceso` / `AccesoEnlace` | Son append-only. |
| `autoaprobarCotizacion`, cualquier aprobación por umbral | Toda cotización pasa por una persona. |
| `editarCopy`, `editarPrecioLista` | El copy y el precio de lista son sólo lectura. |

Y las que se verifican en tiempo de ejecución:
- `revisarCotizacion` con `actorId === cotizacion.vendedorId` ⇒ `sin_permiso`.
- `revisarCotizacion` con comentario vacío ⇒ `validacion`.
- `revisarCotizacion('aprobar', …)` ⛔ **recalcula las cuatro alternativas en el servidor antes de aprobar** e incorpora la firma del CEO.
- `firmarComoCeo` ⛔ resuelve e incrusta la imagen **en el servidor**. No hay URL pública de la firma del CEO, ni en el enlace, ni en el PDF, ni en el navegador.
- `reintentarNotificaciones` ⛔ **no vuelve a guardar la constancia**: ya está guardada. Sólo reenvía el aviso.
- `publicarParticipacion` con porcentajes que no suman 100 ⇒ `validacion`.
- `cerrarPeriodo` sin `verificarCierrePeriodo` en verde ⇒ `regla_comercial` con la lista de bloqueos.
- Cualquier método de §2.7 llamado con rol `vendedor` ⇒ `sin_permiso`.

### 2.9 Enlace público — sin sesión
```ts
obtenerPresentacionPublica(token: string, codigo?: string): R<PresentacionPublica>;
obtenerCotizacionPublica(token: string, codigo?: string): R<CotizacionPublica>;
descargarPdfPublico(token: string): R<{ url: string; venceEn: ISODate }>;

responderCotizacion(token: string, respuesta: RespuestaDelCliente,
                    clave: ClaveIdempotencia): R<ConstanciaRespuesta>;
obtenerConstanciaPublica(token: string): R<ConstanciaRespuesta | null>;
```
⛔ Superficie mínima. Sin datos de otros clientes, sin navegación al Escritorio, sin listados.
Una cotización `vencida` vuelve **sin importes** y ⛔ **no acepta respuesta**.
Cada llamada genera un `AccesoEnlace`; ⛔ la respuesta **nunca** revela cuántas aperturas hubo.

**`responderCotizacion`:**

| # | Regla |
|---|---|
| P1 | ⛔ `RespuestaDelCliente.aceptacionMarcada` es **literal `true`**. Sin la casilla marcada el código no compila y el servidor devuelve `validacion`. |
| P2 | ⛔ **Una sola opción**: las alternativas son excluyentes. La interfaz usa **botones de opción, no casillas múltiples**. |
| P3 | ⛔ La **constancia se guarda antes** de intentar los avisos. |
| P4 | ⛔ Si un aviso falla, `constanciaGuardada` sigue siendo `true` y el envío se reintenta. **Nunca se pierde la elección del cliente.** |
| P5 | ⛔ Es una **constancia comercial**, no un contrato ni una firma electrónica legal. |
| P6 | ⛔ El número personal del CEO **nunca** viaja en esta superficie. `DestinosNotificacion` expone **si** está configurado, nunca su valor. |
| P7 | Idempotente por `(token, clave)`: un doble envío no genera dos constancias. |

---

## 3. Concurrencia

| Mecanismo | Uso |
|---|---|
| `version: number` optimista | Toda entidad editable. Desajuste ⇒ `conflicto_version` con la versión actual, para recargar sin perder lo escrito. |
| `claveIdempotencia` | Toda creación y acción de estado. Evita cotizaciones duplicadas por doble toque. |
| Bloqueo pesimista | **No se usa.** |

---

## 4. Implementaciones

| Implementación | Paquete | Uso |
|---|---|---|
| `CapaDatosMock` | `packages/mock` | Construcción en paralelo sin backend. Datos de ejemplo marcados, latencia simulada y **modo de falla forzada** para probar los estados de error. |
| `CapaDatosHttp` | `apps/escritorio/src/datos/http.ts` | Producción. Traduce HTTP ⇄ `Resultado<T>`. |

Mientras la app corra con mock, la interfaz muestra de forma permanente el chip **"Datos de ejemplo"**. ⛔ Nunca se presenta un dato ficticio como real.

---

## 5. Rendimiento

| Operación | Objetivo |
|---|---|
| Inicio (cuatro cifras + seguimientos) | p95 < 800 ms |
| Agenda: Hoy, Semana, Mes | p95 < 800 ms |
| `cronogramaComercial` | p95 < 2 s |
| **`investigarObjetivo`** | p95 < 20 s, **asíncrono con estado consultable**. Progreso visible desde el primer segundo, con las fuentes que se van consultando. |
| `generarPlan` | p95 < 4 s, con progreso visible desde el primer segundo |
| `procesarCaptura` (voz/texto) | p95 < 6 s, con progreso |
| `emitirPdfDefinitivo` | p95 < 10 s, asíncrono con estado consultable |
| Enlace público | p95 < 1,5 s en 3G |

Superado el umbral, la interfaz **no se congela**: muestra progreso y deja cancelar.

---

## 6. Versionado del contrato

- Un cambio **rompiente** (renombrar un campo, cambiar un tipo, quitar un método) exige acuerdo de las seis sesiones; lo aplica **Sesión 1**.
- Un cambio **aditivo** (campo opcional, método nuevo) se pide a Sesión 1 sin ceremonia.
- ⛔ Ninguna otra sesión edita `api.ts`.
