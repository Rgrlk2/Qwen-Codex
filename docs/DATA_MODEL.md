# DATA_MODEL — Escritorio Vendedores Lab.IA

> **Versión 3.0.** Modelo conceptual y lógico. La expresión ejecutable son las interfaces de `packages/compartido/src/`.
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
   ├──< InvestigacionObjetivo ──< DatoInvestigado ──> FuenteInvestigacion
   │            │
   │            └──► Plan
   │
   ├──< EntradaAgenda   (derivada de plan, seguimiento, propuesta, vencimiento…)
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
`id` · `folio` · `version` · `estado` · `destinatario` · `objeto` · `vendedorId` · `nombreVendedor` · `fechaEmision` · `fechaValidez` · `precios` · `alternativas` · `condiciones` · `logos` · `totalesPorMoneda` · `presentacionId: Id | null` · `versionCatalogo` · `motivoPerdida`.

`estado`: `"borrador" | "en_revision" | "aprobada" | "corregida" | "rechazada" | "enviada_al_cliente" | "aceptada" | "perdida" | "vencida"`.

⛔ **Plantilla genérica.** Se genera para cualquiera de los 13 productos, cualquier variante y cualquier cliente. Ningún importe está fijado en el código.

### 7.3 Encabezado

`DestinatarioCotizacion`: `clienteId` · `tipo: "empresa" | "profesional"` · `nombreCliente` · `nombreEmpresaOProfesional` · `profesion` · `ruc` · `ciudad`.

`ObjetoCotizado`: `productoId` · `nombreProducto` · `variante: string | null`.

⛔ Una cotización = **un producto** y, cuando corresponde, **una variante**. Los combos se cotizan como cotizaciones vinculadas, no mezcladas.

`LogosDocumento`: `labIa` · `rgrlkGroup` · `producto` · `variante: string | null`.

⛔ Son referencias a activos **oficiales** del inventario. No se generan, no se redibujan, no se recolorean, no se recortan y no se deforman: `object-fit: contain`, proporción original. Si la variante no tiene logo oficial, `null`.

### 7.4 `PreciosCotizacion`

Los seis importes obligatorios:

| Campo | Qué es |
|---|---|
| `setupLista` | Precio de lista del setup |
| `setupEspecial` | **S** — internamente "precio efectivo"; en el PDF del cliente, **"Precio especial"** |
| `ahorroSetup` · `ahorroSetupPorcentaje` | Calculados: `setupLista − setupEspecial` |
| `mensualLista` | Precio mensual de lista |
| `mensualEspecial` | **M** — internamente "precio efectivo"; en el PDF del cliente, **"Precio especial"** |
| `ahorroMensual` · `ahorroMensualPorcentaje` | Calculados: `mensualLista − mensualEspecial` |

| # | Invariante |
|---|---|
| PC1 | ⛔ Las cuatro monedas son **la misma**. Distintas ⇒ `monedas_mezcladas`. |
| PC2 | ⛔ Los ahorros **no se escriben**: se calculan y se recalculan en el servidor. |
| PC3 | ⛔ El documento del cliente dice **"Precio especial"**, nunca "precio efectivo" ni "precio verdadero". |

`PreciosEntrada` es lo único que manda el vendedor: `setupEspecial` · `mensualEspecial`.

### 7.5 `CondicionesCotizacion`

`permanenciaMinimaMeses` (por defecto **12**) · `instalacion` · `alcance` · `basesYCondiciones` · `tratamientoIva` · `notasInternas`.

`CondicionesInstalacion`: `descripcion` · `tiempoEstimadoDiasHabiles` · `tiempoEstimadoTexto` · `aportesDelCliente: AporteDelCliente[]`.

`AporteDelCliente`: `tipo: "insumo" | "acceso" | "cuenta" | "informacion" | "equipo"` · `descripcion` · `bloqueante: boolean`.

`AlcanceCotizacion`: `queIncluye: string[]` · `queNoIncluye: string[]` · `limitesIncluidos: string[]`.

| # | Invariante |
|---|---|
| CC1 | ⛔ `queIncluye` y `queNoIncluye` **no vacíos**. Una cotización sin exclusiones escritas es un reclamo futuro. |
| CC2 | ⛔ `permanenciaMinimaMeses >= 1`. Por defecto `PERMANENCIA_MINIMA_MESES` = 12. |
| CC3 | Un aporte `bloqueante` sin cumplir frena el arranque de la instalación, y eso quedó escrito en el documento que el cliente aceptó. |

### 7.6 Alternativas financieras

`ReglaAlternativa`: `codigo: "estandar" | "adelantado_12" | "adelantado_24" | "diferido"` · `nombre` · `mesesServicio` · `cuotasAPagar` · `factorMensual` · `permanenciaMinimaMeses` · `pagoUnicoAdelantado` · `descripcionPago`.

| Código | `mesesServicio` | `cuotasAPagar` | `factorMensual` | `permanenciaMinimaMeses` | Cálculo |
|---|---|---|---|---|---|
| `estandar` | 12 | 12 | 1 | 12 | `S + (M × 12)` |
| `adelantado_12` | 12 | 12 | 0,90 | 12 | `S + (M × 12 × 0,90)` |
| `adelantado_24` | 24 | 24 | 0,80 | 24 | `S + (M × 24 × 0,80)` |
| `diferido` | 12 | **11** | 0,90 | 12 | `S + (M × 11 × 0,90)` |

`AlternativaCalculada` expone las diez cifras: `precioTotalLista` · `precioEspecialSinPromocion` · `descuentoAdicional` · `ahorroTotal` · `setupAPagar` · `mensualidadesAPagar` · `importeCuota` · `cantidadCuotas` · `mesesServicio` · `permanenciaMinimaMeses` · `totalFinal` · `valorMensualEfectivo` · `formaDePago` · `calendarioPago: CuotaCalendario[]`.

| # | Invariante |
|---|---|
| AF1 | ⛔ `adelantado_12`, `adelantado_24` y `diferido` **no se acumulan**. El cliente elige **una**. |
| AF2 | ⛔ El descuento cae sobre **M**. `setupAPagar === precios.setupEspecial`, siempre. |
| AF3 | ⛔ `totalFinal === setupAPagar + mensualidadesAPagar`. |
| AF4 | ⛔ Las cuotas de `calendarioPago` **suman exactamente** `totalFinal`. |
| AF5 | ⛔ Una sola moneda en toda la alternativa. |
| AF6 | ⛔ El servidor recalcula las cuatro antes de aprobar; su resultado prevalece. |

**Redondeo.** En pago único adelantado (B y C) se redondea **el total** de las mensualidades, una vez. En cuotas (A y D) se redondea **la cuota** y el total es la cuota por la cantidad: si se redondeara el total, las cuotas no lo sumarían.

### 7.7 `Firma`

`id` · `rol: "vendedor" | "ceo"` · `firmanteId` · `nombreFirmante` · `aclaracion` · `referenciaProtegida` · `firmadoEn` · `versionFirmada` · `anulada` · `anuladaEn` · `motivoAnulacion`.

| # | Invariante |
|---|---|
| FI1 | La firma del **vendedor** se registra antes de `enviarARevision`. |
| FI2 | La firma del **CEO** se incorpora al aprobar. |
| FI3 | ⛔ `referenciaProtegida` **no es una URL** ni un nombre de archivo, y sólo el servidor la resuelve. |
| FI4 | ⛔ La imagen original de la firma del CEO **no se expone por ninguna URL pública**. |
| FI5 | ⛔ Una edición posterior pone `anulada: true` en todas las firmas de la versión anterior. |

### 7.8 `VersionCotizacion`
`version` · `estado` · `creadaEn` · `creadaPor` · `totalesPorMoneda` · `motivoCambio`.
**Inmutable.**

### 7.9 `EventoRevision` *(append-only)*
`id` · `cotizacionId` · `version` · `actorId` · `accion: "enviar" | "aprobar" | "corregir" | "rechazar"` · `comentario` · `ocurridoEn`.

**Invariantes:** `comentario` no vacío en `aprobar`, `corregir` y `rechazar` · `actorId !== vendedorId` en `aprobar` · ⛔ **no existe ninguna transición que lleve a `enviada_al_cliente` sin pasar por `aprobada`**.

---

## 8. Documentos y enlaces

### 8.1 `DocumentoEmitido`
`id` · `propuestaId` · `tipoPropuesta: "presentacion" | "cotizacion"` · `versionPropuesta` · `folio` · `hashContenido` · `emitidoEn` · `emitidoPor` · `validoHasta` · `almacenamientoRef`.

⛔ **Inmutable.** Mismo insumo ⇒ mismo hash. Para una cotización, ⛔ **sólo se emite si el estado es `aprobada`**.

### 8.2 `EnlaceCompartido`
`id` · `propuestaId` · `tipoPropuesta` · `versionPropuesta` · `token` · `creadoEn` · `creadoPor` · `venceEn` · `topeAperturas` · `aperturas` · `requiereCodigo` · `revocadoEn` · `revocadoPor` · `respondido`.

⛔ El `token` **nunca** deriva de `clienteId`, `propuestaId` ni de dato alguno del cliente.

### 8.3 `AccesoEnlace` *(append-only)*
`id` · `enlaceId` · `documentoId` · `tipoDocumento` · `ocurridoEn` · `tipoDispositivo` · `paisAproximado` · `duracionSegundos` · `resultado: "ok" | "vencido" | "revocado" | "tope_superado" | "codigo_invalido"`.

⛔ **Prohibido almacenar:** IP completa, user-agent crudo, identificador de dispositivo, cookie persistente, datos de contacto del visitante, correlación entre enlaces. Granularidad geográfica máxima: **país**.

---

### 8.4 `CotizacionPublica`

Lo que el cliente ve en el enlace: `nombreCliente` · `nombreProducto` · `variante` · `folio` · `version` · `emitidaEn` · `venceEn` · `alternativas: AlternativaPublica[]` · `basesYCondiciones` · `pdfDisponible` · `vencida`.

`AlternativaPublica`: `codigo` · `nombre` · `totalFinal` · `setupAPagar` · `importeCuota` · `cantidadCuotas` · `mesesServicio` · `permanenciaMinimaMeses` · `formaDePago`.

⛔ Superficie mínima: sin datos internos, sin otras cotizaciones, sin precios de terceros, y nunca revela cuántas aperturas hubo.

### 8.5 `RespuestaDelCliente`

`opcion: OpcionRespuesta` · `aceptacionMarcada: true`.

`OpcionRespuesta`: `"estandar" | "adelantado_12" | "adelantado_24" | "diferido" | "contactar_antes" | "no_continuar"`.

| Opción | Texto exacto |
|---|---|
| `estandar` | Elijo el plan estándar. |
| `adelantado_12` | Elijo pago adelantado por 12 meses. |
| `adelantado_24` | Elijo pago adelantado por 24 meses. |
| `diferido` | Elijo cheques diferidos o débito automático. |
| `contactar_antes` | Quiero que me contacten antes de elegir. |
| `no_continuar` | No continuar por ahora. |

| # | Invariante |
|---|---|
| RC1 | ⛔ **Una sola opción.** Las alternativas son excluyentes: **botones de opción, no casillas múltiples**. |
| RC2 | ⛔ `aceptacionMarcada` es **literal `true`**. Sin la casilla marcada el código no compila y el servidor devuelve `validacion`. |
| RC3 | Texto de la casilla (`TEXTO_ACEPTACION`): *"He revisado la opción seleccionada y solicito que Lab.IA continúe con los próximos pasos."* |
| RC4 | Botón final (`TEXTO_BOTON_ENVIO`): **"Enviar mi elección"**. |

### 8.6 `ConstanciaRespuesta` *(inmutable)*

`id` · `clienteId` · `nombreCliente` · `cotizacionId` · `folio` · `versionCotizacion` · `opcionSeleccionada` · `importesAceptados` · `respondidaEn` · `venceEn` · `textoAceptacion` · `enlaceId` · `huellaDocumento` · `naturaleza: "constancia_comercial"`.

⛔ **Funciona como constancia comercial o aval de intención. No se presenta como contrato ni como firma electrónica legal.** El campo `naturaleza` lo recuerda en el propio registro.

### 8.7 `Notificacion`

`id` · `constanciaId` · `canal` · `destinoProtegido` · `estado` · `intentos` · `ultimoIntentoEn` · `proximoIntentoEn` · `error`.

`CanalNotificacion`: `"celular_vendedor" | "whatsapp_corporativo" | "celular_ceo" | "panel_administracion"`.

`DestinosNotificacion`: `whatsappCorporativo: "+595 984 355775"` · `celularCeoConfigurado: boolean` · `celularVendedorConfigurado: boolean`.

| # | Invariante |
|---|---|
| NO1 | ⛔ El número personal del CEO **nunca** aparece en el enlace, el PDF ni el código del navegador. Se referencia por `destinoProtegido`, que sólo el servidor resuelve. |
| NO2 | ⛔ `DestinosNotificacion` expone **si** el celular del CEO está configurado, **nunca su valor**. |
| NO3 | ⛔ La constancia se guarda **antes** de intentar los avisos. |
| NO4 | ⛔ Si una notificación falla, la respuesta **se conserva** y el aviso se reintenta. `ResultadoNotificaciones.constanciaGuardada` es **literal `true`**: un fallo de aviso no puede representarse como pérdida de la constancia. |

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

## 11. Investigación automática

### 11.1 `InvestigacionObjetivo`
`id` · `entrada: EntradaObjetivo` · `estado` · `investigadoEn` · `vendedorId` · los trece datos (§10b.3) · `perfilOperativo` · `doloresProbables` · `productosRecomendados` · `fuentesConsultadas` · `confianzaGlobal` · `datosMinimosFaltantes` · `usoRespaldoTaxonomia` · `versionTaxonomia` · `versionCatalogo`.

`estado`: `en_curso | completa | parcial | sin_resultados | fuentes_caidas | error`.

### 11.2 `EntradaObjetivo`
| Tipo | Campos | Obligatorio |
|---|---|---|
| `empresa` | `ruc`, `razonSocial`, `nombreComercial`, `ciudad` | **Al menos uno** de los tres primeros |
| `profesional` | `nombre`, `profesionOEspecialidad`, `matricula`, `ciudad` | Los dos primeros. ⛔ `matricula` y `ciudad` **sólo si están** |
| `rubro` | `rubro`, `ciudad` | `rubro` |

### 11.3 `DatoInvestigado<T>`
`campo` · `valor: T | null` · `clasificacion` · `confianza` · `fuentesIds` · `razonamiento` · `confirmadoPorVendedor` · `valorCorregido`.

| # | Invariante |
|---|---|
| DI1 | `clasificacion === 'verificado'` ⇒ `fuentesIds` no vacío **y** `confianza !== null`. |
| DI2 | `clasificacion === 'inferido'` ⇒ `razonamiento` no vacío **y** `confianza !== null`. |
| DI3 | `clasificacion === 'no_encontrado'` ⇒ `valor === null` **y** `confianza === null`. ⛔ No se rellena. |
| DI4 | `tamanoAproximado` sólo se completa con evidencia; si no, `no_encontrado`. |

### 11.4 `FuenteInvestigacion`
`id` · `tipo` · `nombre` · `url` · `consultadaEn` · `exito` · `motivoFallo`.
⛔ Se registran **también las fuentes que fallaron**: el vendedor tiene derecho a saber qué no se pudo mirar.

### 11.5 `CampoFaltante`
`campo` · `pregunta` · `porQueHaceFalta` · `obligatorio` · `opciones`.
⛔ **Uno a tres, nunca más.** Es lo mínimo para seguir, no un formulario.

### 11.6 Proveedores
`ProveedorBusqueda` · `ProveedorRegistroPublico` · `ProveedorModeloLenguaje` · `EstadoProveedores`.
⛔ **Se implementan únicamente en el servidor.** Ninguna clave ni llamada externa vive en el navegador.

---

## 12. Agenda operativa

### 12.1 `EntradaAgenda`
`id` · `vendedorId` · `tipo` · `origen` · `referenciaId` · `clienteId` · `titulo` · `detalle` · `productoId` · `inicioEn` · `finEn` · `venceEn` · `atrasada` · `diasDeAtraso` · `prioridad` · `estado` · `completadaEn` · `motivoReprogramacion` · `fechaAjustadaPorVendedor`.

`tipo`: `visita | llamada | proximo_paso | vencimiento | seguimiento_atrasado | hito_plan | objetivo_aceptado | presentacion_enviada | cotizacion_en_revision | apertura_enlace`.

`origen`: `plan | objetivo_aceptado | seguimiento | presentacion | cotizacion | vencimiento | apertura_enlace | manual`.

| # | Invariante |
|---|---|
| AG1 | ⛔ La agenda **se deriva**. `origen === 'manual'` es la excepción, y sólo para `visita`, `llamada` y `proximo_paso`. |
| AG2 | Mover una fecha exige `motivoReprogramacion` y marca `fechaAjustadaPorVendedor`. |
| AG3 | `venceEn` pasado y `estado === 'pendiente'` ⇒ `atrasada: true` con `diasDeAtraso`. ⛔ No se reprograma sola. |
| AG4 | ⛔ **No existe borrado.** `descartada` con motivo; queda en la historia. |
| AG5 | Completar una entrada actualiza la línea de tiempo del cliente. |

### 12.2 Vistas derivadas
`AgendaHoy` · `AgendaSemana` · `AgendaMes` · `CronogramaComercial` (con `BarraCronograma` e `HitoCronograma`) · `ResumenAgenda`.

`ResumenAgenda` es lo único que consume Inicio: `pendientesHoy`, `atrasados`, `proximaEntrada`. ⛔ Inicio no duplica la agenda.

---

## 13. Registro de accesos

### 13.1 `RegistroAcceso` *(append-only)*
`id` · `actorId` · `rol` · `accion` · `entidadTipo` · `entidadId` · `valorAnterior` · `valorPosterior` · `ocurridoEn` · `origenSesion: { tipoDispositivo, paisAproximado }`.

**Acciones mínimas:** ingreso · cierre de sesión · intento fallido · alta/baja de vendedor · cambio de participación · cambio de presupuesto · cambio de taxonomía · aprobación · corrección · rechazo · cierre de período · ajuste · emisión de PDF · emisión de enlace · revocación de enlace · borrado de audio · reasignación de cartera.

### 13.2 `UsoPorVendedor` *(derivado)*
`vendedorId` · `ultimoIngresoEn` · `ingresosEnPeriodo` · `diasSinEntrar` · `planesCreados` · `seguimientosRegistrados` · `cotizacionesEnviadas`.

Es la sección **Accesos y frecuencia de uso** de Administración: sirve para saber quién está trabajando.

### 13.3 Distinción que no se pierde
`AccesoEnlace` responde *"¿el cliente abrió lo que le mandé?"*. `RegistroAcceso` responde *"¿quién usa el sistema y qué tocó?"*.
⛔ La interfaz **nunca** los mezcla en una misma lista.

---

## 14. Invariantes globales

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
| G19 | Todo `DatoInvestigado` declara su clasificación, y `no_encontrado` deja el valor vacío. | Un dato inferido presentado como verificado es una mentira con formato de hecho. |
| G20 | La investigación registra también las fuentes que fallaron. | Saber qué no se pudo mirar es parte del resultado. |
| G21 | Ninguna clave de proveedor externo existe en código del cliente. | Una clave en el navegador es una clave publicada. |
| G22 | Una investigación fallida devuelve como mucho tres campos faltantes. | Un formulario vacío tras un fallo es peor que no tener sistema. |
| G23 | `origen === 'manual'` es la excepción en la agenda. | Una agenda que hay que cargar entera queda vacía. |
| G24 | Una entrada de agenda nunca se borra: se descarta con motivo. | El atraso que desaparece solo es el que se repite. |
| G25 | Los hitos de pago de una cotización cierran (100 % o el importe del setup). | Una cotización cuyos hitos no suman es una discusión con el cliente. |
| G26 | Todo beneficio otorgado tiene su condición habilitante escrita. | Sin condición escrita, el beneficio no se puede reclamar ni revertir. |

---

## 15. Índices y volumetría

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
