# DATA_MODEL — Escritorio Vendedores Lab.IA

> **Versión 2.0.** Modelo conceptual y lógico. La expresión ejecutable son las interfaces de `packages/compartido/src/`.
> Si este documento y el código difieren, **manda el código** y este documento se corrige.

---

## 0. Convenciones

| Convención | Regla |
|---|---|
| Identificadores | `string` opaco. Sólo `ProductoId` tiene significado: es un slug del catálogo cerrado. |
| Fechas | ISO-8601 con zona. Zona de negocio: `America/Asuncion`. |
| Dinero | Siempre el par `{ monto, moneda }`. **Ningún campo de dinero sin moneda al lado.** |
| Montos | Enteros en unidad mínima: PYG sin decimales, USD en centavos. Sin flotantes en dinero. |
| Copy | **No se almacena.** Se referencia por `productoId` y se resuelve contra `content/copy/`. |
| Borrado | Lógico (`archivadoEn`). **Físico prohibido** en registros de acceso. |
| Registros | `RegistroAcceso` y `AccesoEnlace` son *append-only*. |

---

## 1. Mapa de entidades

```
Usuario (rol: vendedor | administrador)
   │
   ├──< Cliente >── Actividad ──< Operacion ──< Necesidad ──> Producto (13)
   │       │
   │       ├──< Contacto
   │       ├──< Plan            (eje: empresa | profesional | rubro)
   │       ├──< Seguimiento ──< PasoSugerido
   │       ├──< Presentacion ──┐
   │       ├──< Cotizacion ────┤──< DocumentoEmitido ──< AccesoEnlace
   │       │        │          └──< EnlaceCompartido ──< AccesoEnlace
   │       │        └──< VersionCotizacion ──< EventoRevision
   │       └──< Mensualidad ──< CobroMensualidad
   │
   ├──< LineaParticipacion ──> ParticipacionProducto(version)
   ├──< Liquidacion
   ├──< Observacion
   ├──< Presupuesto
   └──< SugerenciaProducto

Producto (13, cerrado) ──< PrecioLista

RegistroAcceso  (transversal, append-only)
```

---

## 2. Identidad

### 2.1 `Usuario`
`id` · `nombre` · `email` · `usuario` · `rol: "vendedor" | "administrador"` · `activo` · `creadoEn` · `ultimoIngresoEn` · `ingresosEnPeriodo`.

⛔ **Sólo dos roles.** No existen `supervisor` ni `auditor` en ninguna capa.

### 2.2 `Sesion`
`usuario` · `iniciadaEn` · `rol` · `datosDeEjemplo: boolean`.

La ruta `#/administracion` se protege **en el ruteo y en la capa de datos**. Ocultar el enlace no es proteger.

---

## 3. Catálogo

### 3.1 `Producto`
Conjunto **cerrado de 13 filas**. ⛔ No existe alta de producto en ninguna capa.

`id: ProductoId` · `nombre` · `familia: "especifica" | "integral"` · `orden` · `claveCopy` · `aliasHistoricos` · `publicado`.

`claveCopy` es un ancla para resolver el copy; ⛔ **no contiene el texto**.

### 3.2 `PrecioLista`
`id` · `productoId` · `modalidad: "setup" | "mensualidad" | "unica_vez" | "prueba"` · `plan` · `estado: "documentado_exacto" | "documentado_rango" | "documentado_desde" | "no_documentado"` · `moneda` · `montoDesde` · `montoHasta` · `ivaIncluido: boolean | null` · `textoDocumentado` · `condicion` · `versionCatalogo`.

`textoDocumentado` es **lo que se muestra**. Los campos numéricos existen para comparar contra el precio propuesto, ⛔ nunca para reemplazar el texto aprobado.
`ivaIncluido: null` = **no documentado**. ⛔ No se asume régimen.

---

## 4. Taxonomía del motor

Tres capas. **Editable y ampliable.** La taxonomía derivada literalmente del copy es la **semilla**, no el límite.

### 4.1 `Actividad`
`id` · `nombre` · `sinonimos: string[]` · `estado: "confirmada" | "pendiente_de_revision"` · `creadaPor` · `creadaEn` · `fusionadaEn: Id | null`.

**Invariante clave:** un término escrito por un vendedor que no existe **se crea** como `pendiente_de_revision` y queda usable de inmediato. ⛔ El motor nunca rechaza una entrada.

### 4.2 `Operacion`
Cómo funciona el negocio por dentro.
`id` · `nombre` · `pregunta` (la que se le hace al vendedor para confirmarla) · `estado`.

Ejemplos: maneja stock · trabaja con turnos · atiende por WhatsApp · reparte a domicilio · tiene local con circulación · varios profesionales · catálogo amplio · compra a proveedores · precios que se mueven · administra espacios.

### 4.3 `Necesidad`
Qué le duele.
`id` · `nombre` · `descripcion` · `preguntaConfirmacion` · `estado`.

### 4.4 Relaciones

| Relación | Campos | Para qué |
|---|---|---|
| `ActividadOperacion` | `actividadId` · `operacionId` · `probabilidad: "tipica" \| "frecuente" \| "ocasional"` · `motivo` | Inferir el perfil operativo desde la actividad |
| `OperacionNecesidad` | `operacionId` · `necesidadId` · `probabilidad` · `motivo` | Inferir dolores desde la operación |
| `NecesidadProducto` | `necesidadId` · `productoId` · `encaje` · `adaptacionRequerida` · `argumento` | Ordenar los 13 y explicar el encaje |

`encaje: "directo" | "cercano" | "adaptable" | "no_recomendado"`.

**Invariante:** toda relación guarda su `motivo`. Es lo que permite responder *"¿por qué éste primero?"*. Una relación sin motivo no se guarda.

---

## 5. El plan

### 5.1 `Plan`
`id` · `eje: "empresa" | "profesional" | "rubro"` · `objetivoId` · `vendedorId` · `entrada: EntradaPlan` · `perfilOperativo` · `doloresInferidos` · `ranking` · `combos` · `estrategiaEntrada` · `argumentos` · `preguntasConfirmacion` · `versionTaxonomia` · `versionCatalogo` · `creadoEn`.

⛔ **Un solo eje.** `eje === "rubro"` ⇒ no puede referenciar un `clienteId`.

### 5.2 `EntradaPlan`
`tipo: "conocido" | "rubro"` · `nombre` · `queHace` (texto libre, obligatorio) · `ciudad` · `tamanoAproximado` · `relacionConVendedor` · `loQueYaSabe`.

⛔ Sólo `nombre` y `queHace` son obligatorios.

### 5.3 `PerfilOperativo`
`operaciones: { operacionId, presente: boolean | null, origen: "inferido" | "confirmado_por_vendedor", motivo }[]`

`presente: null` = todavía sin confirmar. El vendedor puede corregir cualquier operación y el plan se recalcula mostrando **qué cambió**.

### 5.4 `DolorInferido`
`necesidadId` · `probabilidad` · `motivo` · `esHipotesis: true` · `preguntaConfirmacion` · `confirmadoPorVendedor: boolean | null`.

⛔ `esHipotesis` es literalmente `true`: el motor nunca presenta una inferencia como hecho verificado.

### 5.5 `PosicionRanking`
`posicion: 1..13` · `productoId` · `encaje` · `puntaje` · `motivo` · `necesidadesQueAtiende` · `adaptacionRequerida: string | null` · `enTop10: boolean`.

**Invariantes:** el ranking contiene **exactamente 13** posiciones, sin repetir producto; `posicion ≤ 10 ⇒ enTop10`; `encaje !== "no_recomendado"` en las posiciones 1, 2 y 3, salvo que ningún producto encaje —y entonces el plan ofrece registrar una sugerencia.

### 5.6 `Combo`
`productoIds: ProductoId[]` (2 o 3) · `motivo` · `argumentoUnificado` · `ordenDeEntrada`.

### 5.7 `PlanDeRubro` (extiende `Plan` con `eje: "rubro"`)
`periodoDesde` · `periodoHasta` · `metaGuaranies: Dinero` · `objetivosSugeridos: ObjetivoSugerido[]` · `estado` · `motivoCierre`.

`ObjetivoSugerido`: `id` · `planId` · `clienteId` · `estado: "sugerido" | "aceptado" | "descartado"`.
⛔ Aceptar genera una tarea, **no** un cliente ni un registro comercial.

---

## 6. Clientes

### 6.1 `Cliente`
`id` · `tipo: "empresa" | "profesional"` · `nombre` · `actividadId` · `operacionesConfirmadas` · `vendedorId` · `etapa` · `ciudad` · `ultimaInteraccionEn` · `proximoPasoEn` · `motivoPerdida` · `planId` · `archivadoEn`.

`etapa`: `"sin_contactar" | "contactado" | "diagnostico" | "presentacion" | "cotizacion" | "negociacion" | "ganado" | "perdido" | "cliente_activo"`.

### 6.2 `Contacto`
`id` · `clienteId` · `nombre` · `cargo` · `telefono` · `email` · `esDecisor` · `canalPreferido`.

### 6.3 `Seguimiento`
`id` · `clienteId` · `vendedorId` · `origen: "voz" | "texto"` · `ocurridoEn` · `registradoEn` · `texto` · `audio: AudioSeguimiento | null` · `productosMencionados: ProductoId[]` · `pasos` · `confirmadoPorUsuario: true`.

⛔ `confirmadoPorUsuario` es literalmente `true`. Un seguimiento sin confirmación humana **no se persiste**.

### 6.4 `AudioSeguimiento`
`id` · `duracionSegundos` · `formato` · `almacenamientoRef` · `retencionHasta` · `borradoEn` · `borradoPor`.
**La transcripción sobrevive al audio.**

### 6.5 `PasoSugerido`
`id` · `seguimientoId` · `titulo` · `venceEn` · `estado: "propuesto" | "aceptado" | "descartado" | "resuelto"`.
Sólo un paso `aceptado` aparece en los próximos seguimientos de Inicio.

### 6.6 `EventoLineaTiempo`
`id` · `clienteId` · `tipo: "seguimiento" | "presentacion" | "cotizacion" | "cambio_etapa" | "acceso_enlace" | "mensualidad"` · `ocurridoEn` · `titulo` · `detalle` · `referenciaId`.

---

## 7. Presentación y cotización

### 7.1 `Presentacion`
`id` · `clienteId` · `vendedorId` · `titulo` · `productosIncluidos` · `casosDeUsoIncluidos` · `planId` · `version` · `creadoEn`.

⛔ **Sin precio definitivo.** Un rango documentado, si se incluye, va marcado como referencia.
⛔ **No requiere aprobación.**

### 7.2 `Cotizacion`
`id` · `clienteId` · `vendedorId` · `presentacionId: Id | null` · `folio` · `version` · `estado` · `items` · `condiciones` · `totalesPorMoneda` · `vigenteHasta` · `versionCatalogo` · `motivoPerdida`.

`estado`: `"borrador" | "en_revision" | "aprobada" | "corregida" | "rechazada" | "enviada_al_cliente" | "aceptada" | "perdida" | "vencida"`.

### 7.3 `ItemCotizacion`
`id` · `productoId` · `plan` · `precioListaSetup: Dinero | null` · `precioListaMensualidad: Dinero | null` · **`setupPropuesto: Dinero`** · **`mensualidadPropuesta: Dinero`** · `descuentoImplementacionPorcentaje` · `alcance` · `notas`.

**Invariantes:** `setupPropuesto.moneda === mensualidadPropuesta.moneda` · un producto aparece una sola vez · el precio de lista se guarda **junto** al propuesto, para poder explicar la desviación meses después.

### 7.4 `CondicionesCotizacion`
`debitoAutomatico: boolean` · `compromisoDoceMeses: boolean` · `pagoAnualAnticipado: boolean` · `alcance: string` · `cronograma: EtapaCronograma[]` · `condicionesComerciales: string` · `tratamientoIva: string`.

`EtapaCronograma`: `orden` · `titulo` · `duracionDias` · `entregable`.

### 7.5 `VersionCotizacion`
`version` · `estado` · `creadaEn` · `creadaPor` · `totalesPorMoneda` · `motivoCambio`.
**Inmutable.**

### 7.6 `EventoRevision` *(append-only)*
`id` · `cotizacionId` · `version` · `actorId` · `accion: "enviar" | "aprobar" | "corregir" | "rechazar"` · `comentario` · `ocurridoEn`.

**Invariantes:** `comentario` no vacío en `aprobar`, `corregir` y `rechazar` · `actorId !== vendedorId` en `aprobar` · ⛔ **no existe ninguna transición que lleve a `enviada_al_cliente` sin pasar por `aprobada`**.

---

## 8. Documentos y enlaces

### 8.1 `DocumentoEmitido`
`id` · `propuestaId` · `tipoPropuesta: "presentacion" | "cotizacion"` · `versionPropuesta` · `folio` · `hashContenido` · `emitidoEn` · `emitidoPor` · `validoHasta` · `almacenamientoRef`.

⛔ **Inmutable.** Mismo insumo ⇒ mismo hash. Para una cotización, ⛔ **sólo se emite si el estado es `aprobada`**.

### 8.2 `EnlaceCompartido`
`id` · `propuestaId` · `versionPropuesta` · `token` · `creadoEn` · `creadoPor` · `venceEn` · `topeAperturas` · `aperturas` · `requiereCodigo` · `revocadoEn` · `revocadoPor`.

⛔ El `token` **nunca** deriva de `clienteId`, `propuestaId` ni de dato alguno del cliente.

### 8.3 `AccesoEnlace` *(append-only)*
`id` · `enlaceId` · `documentoId` · `tipoDocumento` · `ocurridoEn` · `tipoDispositivo` · `paisAproximado` · `duracionSegundos` · `resultado: "ok" | "vencido" | "revocado" | "tope_superado" | "codigo_invalido"`.

⛔ **Prohibido almacenar:** IP completa, user-agent crudo, identificador de dispositivo, cookie persistente, datos de contacto del visitante, correlación entre enlaces. Granularidad geográfica máxima: **país**.

---

## 9. Dinero

### 9.1 `Dinero`
`{ monto: number; moneda: "PYG" | "USD" }`. Entero en unidad mínima.
⛔ La suma entre monedas distintas está **prohibida por tipos**.

### 9.2 `ParticipacionProducto`
`id` · `productoId` · `porcentajeLabIA` · `porcentajeVendedor` · `aplicaASetup` · `aplicaAMensualidad` · `mesesParticipacionVendedor: number | null` · `version` · `vigenteDesde` · `publicadaPor` · `publicadaEn`.

| # | Invariante |
|---|---|
| PA1 | `porcentajeLabIA + porcentajeVendedor === 100`. Cualquier otra suma se rechaza. |
| PA2 | Por defecto: **50 / 50**, `aplicaASetup` y `aplicaAMensualidad` en `true`, `mesesParticipacionVendedor: null` (sin límite). |
| PA3 | Una versión publicada es **inmutable**. Cambiar = publicar `version + 1`. |
| PA4 | Toda `LineaParticipacion` guarda `participacionId` **y** `participacionVersion`. |

### 9.3 `Mensualidad`
`id` · `clienteId` · `productoId` · `plan` · `importe: Dinero` · `vendedorId` · `cotizacionId` · `altaEn` · `bajaEn` · `motivoBaja` · `estado: "activa" | "suspendida" | "baja"` · `diaCobro`.

`importe` es **el aprobado en la cotización**, ⛔ no el de lista.

### 9.4 `CobroMensualidad`
`id` · `mensualidadId` · `periodo: "YYYY-MM"` · `importe: Dinero` · `estado: "pendiente" | "cobrado" | "atrasado" | "incobrable"` · `cobradoEn` · `mesDeParticipacion: number`.

`mesDeParticipacion` se cuenta desde el alta: permite aplicar `mesesParticipacionVendedor`.

### 9.5 `LineaParticipacion`
`id` · `vendedorId` · `clienteId` · `productoId` · `origen: "setup" | "mensualidad" | "unica_vez" | "prueba"` · `referenciaId` · `baseCobrada: Dinero` · `participacionId` · `participacionVersion` · `porcentajeVendedorAplicado` · `parteLabIA: Dinero` · `parteVendedor: Dinero` · `periodo` · `estado: "devengada" | "liquidada" | "ajustada" | "anulada"` · `liquidacionId`.

| # | Invariante |
|---|---|
| LP1 | `parteLabIA.moneda === parteVendedor.moneda === baseCobrada.moneda`. |
| LP2 | `parteLabIA.monto + parteVendedor.monto === baseCobrada.monto`. |
| LP3 | Se genera **sólo** contra un cobro confirmado. ⛔ Nunca contra una venta no cobrada. |
| LP4 | Fuera del plazo `mesesParticipacionVendedor`: `parteVendedor = 0` y `parteLabIA = baseCobrada`. |
| LP5 | Emitida, **no se recalcula**. Corregir = `Ajuste`. |

### 9.6 `Liquidacion`
`id` · `vendedorId` · `periodo` · `totalesPorMoneda` · `estado: "borrador" | "cerrada"` · `cerradaEn` · `cerradaPor` · `comprobanteDocumentoId`.
⛔ `cerrada` es **terminal**.

### 9.7 `Ajuste`
`id` · `liquidacionOrigenId` · `periodoAplicacion` · `vendedorId` · `importe: Dinero` (con signo) · `motivo` (obligatorio) · `observacionId` · `creadoPor` · `creadoEn`.

### 9.8 `Observacion`
`id` · `lineaParticipacionId` · `abiertaPor` · `descripcion` · `estado: "abierta" | "procede" | "no_procede" | "parcial"` · `resolucion` · `resueltaPor` · `resueltaEn`.
⛔ Abrirla **no modifica ningún importe**.

### 9.9 `Presupuesto`
`id` · `vendedorId` · `periodo` · `metaVendido: Dinero` · `metaCobrado: Dinero | null` · `definidoPor` · `definidoEn` · `version`.
⛔ Siempre **en guaraníes** para el ranking; el ranking ordena **por monto**.

### 9.10 `ResumenDinero`
Las ocho cifras, cada una como `TotalesPorMoneda`: `vendido` · `cobrado` · `porCobrar` · `parteLabIA` · `parteVendedor` · `comisionPendiente` · `comisionPagada` · más `mensualidadesVigentes: { cantidad, importe: TotalesPorMoneda }`.

⛔ **No existe ningún campo `totalConsolidado`.**

---

## 10. Sugerencias de producto

`SugerenciaProducto`: `id` · `titulo` · `problemaCliente` · `clienteId` · `actividadId` · `frecuenciaObservada` · `productosQueNoAlcanzan` · `porQueNoAlcanzan` · `adjuntos` · `creadaPor` · `creadaEn` · `estado` · `resolucion` · `productoQueLoCubre` · `duplicadaDe` · `resueltaPor` · `resueltaEn`.

| # | Invariante |
|---|---|
| SP1 | `estado === "ya_cubierta_por_producto_existente"` ⇒ `productoQueLoCubre !== null` y `resolucion` no vacía. |
| SP2 | `estado === "duplicada"` ⇒ `duplicadaDe !== null`. |
| SP3 | ⛔ **Ninguna sugerencia crea un `Producto`.** No hay camino de escritura hacia el catálogo. |

---

## 11. Registro de accesos

### 11.1 `RegistroAcceso` *(append-only)*
`id` · `actorId` · `rol` · `accion` · `entidadTipo` · `entidadId` · `valorAnterior` · `valorPosterior` · `ocurridoEn` · `origenSesion: { tipoDispositivo, paisAproximado }`.

**Acciones mínimas:** ingreso · cierre de sesión · intento fallido · alta/baja de vendedor · cambio de participación · cambio de presupuesto · cambio de taxonomía · aprobación · corrección · rechazo · cierre de período · ajuste · emisión de PDF · emisión de enlace · revocación de enlace · borrado de audio · reasignación de cartera.

### 11.2 `UsoPorVendedor` *(derivado)*
`vendedorId` · `ultimoIngresoEn` · `ingresosEnPeriodo` · `diasSinEntrar` · `planesCreados` · `seguimientosRegistrados` · `cotizacionesEnviadas`.

Es la sección **Accesos y frecuencia de uso** de Administración: sirve para saber quién está trabajando.

### 11.3 Distinción que no se pierde
`AccesoEnlace` responde *"¿el cliente abrió lo que le mandé?"*. `RegistroAcceso` responde *"¿quién usa el sistema y qué tocó?"*.
⛔ La interfaz **nunca** los mezcla en una misma lista.

---

## 12. Invariantes globales

| # | Invariante | Por qué importa |
|---|---|---|
| G1 | `Producto` tiene exactamente 13 filas. | Portafolio cerrado. |
| G2 | Ningún `productoId` fuera de los 13 se persiste en ninguna tabla. | Impide que un producto de la web entre por una referencia suelta. |
| G3 | Sólo dos roles: `vendedor` y `administrador`. | Un rol fantasma es un agujero de permisos. |
| G4 | Todo importe lleva moneda; no hay suma entre monedas distintas. | Portafolio bimonetario sin tipo de cambio definido. |
| G5 | `porcentajeLabIA + porcentajeVendedor === 100`. | Una participación que no cierra es plata que se pierde o se duplica. |
| G6 | Toda `LineaParticipacion` referencia `participacionId + participacionVersion`. | Reconstruible a años vista. |
| G7 | La participación se devenga **sólo contra cobro confirmado**. | No se paga comisión por plata que no entró. |
| G8 | ⛔ No existe transición a `enviada_al_cliente` sin `aprobada`. | Es la regla comercial central. |
| G9 | El PDF definitivo de una cotización sólo se emite en estado `aprobada`. | Un PDF es un compromiso. |
| G10 | `Liquidacion` cerrada es terminal. | La contabilidad no se reescribe. |
| G11 | Nada derivado de voz o texto se persiste sin `confirmadoPorUsuario`. | El sistema propone; la persona guarda. |
| G12 | Los registros de acceso son append-only. | Un registro editable no es un registro. |
| G13 | `EnlaceCompartido.token` no deriva de ningún dato del cliente. | Un token adivinable es una fuga. |
| G14 | Un `Plan` tiene un solo eje. | Un plan de dos ejes no se mide ni se cierra. |
| G15 | Un ranking tiene exactamente 13 posiciones, sin repetidos. | Es el contrato del motor. |
| G16 | Toda relación de taxonomía guarda su `motivo`. | Sin motivo no se puede explicar un ranking. |
| G17 | Una actividad desconocida se crea `pendiente_de_revision`, nunca se rechaza. | El motor no puede frenar al vendedor. |
| G18 | El copy vive sólo en `content/copy/`. | Duplicarlo garantiza divergencia. |

---

## 13. Índices y volumetría

| Tabla | Índices | Volumen (año 1) |
|---|---|---|
| `Cliente` | `(vendedorId, etapa)`, `(actividadId)` | miles |
| `Plan` | `(vendedorId, creadoEn desc)`, `(eje, objetivoId)` | miles |
| `Seguimiento` | `(clienteId, ocurridoEn desc)` | decenas de miles |
| `Cotizacion` | `(estado)`, `(vendedorId, estado)`, `folio` único | miles |
| `CobroMensualidad` | `(mensualidadId, periodo)`, `(estado)` | decenas de miles |
| `LineaParticipacion` | `(vendedorId, periodo)`, `(liquidacionId)` | decenas de miles |
| `AccesoEnlace` | `(enlaceId, ocurridoEn desc)` | decenas de miles |
| `RegistroAcceso` | `(actorId, ocurridoEn desc)`, `(entidadTipo, entidadId)` | cientos de miles |

La volumetría es baja: **el diseño prioriza trazabilidad y reconstrucción sobre rendimiento.**
