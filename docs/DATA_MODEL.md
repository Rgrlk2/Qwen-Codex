# DATA_MODEL — Escritorio Vendedores Lab.IA

> Modelo conceptual y lógico. La expresión ejecutable son las interfaces de `packages/compartido/src/`.
> Si este documento y el código difieren, **manda el código** y este documento se corrige.

---

## 0. Convenciones

| Convención | Regla |
|---|---|
| Identificadores | `string` opaco. Nunca se deriva significado del id, salvo `productoId`, que es un slug estable del catálogo cerrado. |
| Fechas | ISO-8601 con zona (`2026-09-14T09:30:00-03:00`). Zona de negocio: `America/Asuncion`. |
| Dinero | Siempre el par `{ monto, moneda }`. **No existe ningún campo numérico de dinero sin moneda al lado.** |
| Montos | Enteros en la **unidad mínima** de la moneda: PYG sin decimales, USD en centavos. Evita el error de punto flotante en cálculo de comisiones. |
| Texto de copy | **No se almacena en base ni en código.** Se referencia por `productoId` y se resuelve contra `content/copy/`. |
| Borrado | Lógico (`archivadoEn`) en entidades de negocio. **Físico prohibido** en auditoría y accesos. |
| Auditoría | `RegistroAuditoria` y `AccesoEnlace` son *append-only*. Sin `UPDATE`, sin `DELETE` desde la aplicación. |

---

## 1. Mapa de entidades

```
Usuario ──< Cuenta >── Rubro
   │          │
   │          ├──< Contacto
   │          ├──< PlanDeAccion ──(eje: empresa|profesional|rubro)
   │          ├──< Seguimiento ──< PasoSugerido
   │          ├──< Propuesta ──┬── Presentacion
   │          │                └── Cotizacion ──< ItemCotizacion ──> Producto
   │          │                        │
   │          │                        └──< SolicitudAprobacion ──< EventoAprobacion
   │          └──< Mensualidad ──> Producto
   │
   ├──< LineaComision ──> ReglaComision(version)
   ├──< Liquidacion ──< LineaComision
   ├──< Discrepancia
   └──< SugerenciaProducto

Propuesta ──< DocumentoEmitido (pdf) ──< AccesoEnlace
          └──< EnlaceCompartido      ──< AccesoEnlace

Producto (13, cerrado) ──< PrecioCatalogo ──> Moneda
                        └──< ProductoRubro ──> Rubro | Calificador

RegistroAuditoria  (transversal, append-only)
```

---

## 2. Catálogo

### 2.1 `Producto`
Conjunto **cerrado de 13 filas**. El sistema nunca ofrece alta de producto.

| Campo | Tipo | Nota |
|---|---|---|
| `id` | `ProductoId` | Slug estable: uno de los 13 de MASTER_SPEC §4.1. |
| `nombre` | `string` | Nombre comercial exacto. |
| `familia` | `"especifica" \| "integral"` | 9 / 4. |
| `orden` | `number` | Orden de presentación del copy aprobado (1–9, 10–13). |
| `claveCopy` | `string` | Ancla para resolver el copy en `content/copy/`. |
| `aliasHistoricos` | `string[]` | Sólo `faro-digital` tiene uno: `"FARO Inteligente"`. Nunca es un producto aparte. |
| `publicado` | `boolean` | Control de administración. Despublicar oculta, no borra. |

⛔ **Sentinela no existe como fila.** No hay estado, bandera ni registro archivado que lo represente.

### 2.2 `PrecioCatalogo`
Un producto tiene **N** precios (uno por modalidad, a veces por plan). Transcriben el copy; no lo interpretan.

| Campo | Tipo | Nota |
|---|---|---|
| `id` | `string` | |
| `productoId` | `ProductoId` | |
| `modalidad` | `"implementacion" \| "mensualidad" \| "unica_vez" \| "prueba"` | |
| `plan` | `string \| null` | Sólo donde el copy nombra planes (Park.IA: Base / Control / Control Plus / Piloto Control; Ruta IA: por tramos de repartidores). |
| `estado` | `"documentado_exacto" \| "documentado_rango" \| "documentado_desde" \| "no_documentado"` | |
| `moneda` | `"PYG" \| "USD"` | |
| `montoDesde` | `number \| null` | Unidad mínima. |
| `montoHasta` | `number \| null` | Sólo en rangos. |
| `ivaIncluido` | `boolean \| null` | **`null` = no documentado.** Sólo Cotiza Fácil documenta `+ IVA` ⇒ `false`. |
| `textoDocumentado` | `string` | Transcripción literal del copy. Es lo que se muestra. |
| `condicion` | `string \| null` | Condición literal del copy (p. ej. tramo de repartidores). |
| `vigenteDesde` / `vigenteHasta` | `ISODate \| null` | |
| `versionCatalogo` | `number` | |

**Regla:** `textoDocumentado` es la verdad mostrada al usuario; los campos numéricos existen para calcular y validar, **nunca para reemplazar el texto aprobado**.

### 2.3 `Rubro` y `Calificador`
Derivados término a término de *"Dónde tiene más sentido"*. Ver `content/taxonomia/rubros.md`.

| Campo | Tipo |
|---|---|
| `id` | `string` (slug) |
| `nombre` | `string` — literal del copy |
| `clase` | `"rubro" \| "calificador"` |
| `fuente` | `ProductoId[]` — en qué productos aparece el término |

⛔ No se agrega ningún término que no esté en el copy aprobado.

### 2.4 `ProductoRubro`
Relación N:N `productoId × (rubroId | calificadorId)`. Es la **única** base de la recomendación (MASTER_SPEC §5.3). Mapeo literal, sin pesos.

---

## 3. Identidad y organización

### 3.1 `Usuario`
`id` · `nombre` · `email` · `rol: "vendedor" | "supervisor" | "administrador" | "auditor"` · `supervisorId` · `activo` · `limiteDescuentoAutonomo: Dinero | null` (**null = pendiente de definición comercial**, no "cero" ni "ilimitado") · `rubrosAsignados: string[]` · `creadoEn` · `ultimoIngresoEn`.

### 3.2 `Equipo`
`id` · `nombre` · `supervisorId` · `integrantes: string[]`.

---

## 4. Cartera

### 4.1 `Cuenta`
Unifica empresa y profesional en una entidad con discriminante. Dos tablas separadas duplicarían todo el resto del modelo sin ganar nada.

| Campo | Tipo | Nota |
|---|---|---|
| `id` | `string` | |
| `tipo` | `"empresa" \| "profesional"` | Define ficha, discurso y ciclo. |
| `nombre` | `string` | |
| `rubroPrincipalId` | `string` | Obligatorio. Dispara la recomendación. |
| `calificadoresIds` | `string[]` | Opcional. |
| `vendedorId` | `string` | Dueño actual de la cuenta. |
| `etapa` | `EtapaCuenta` | Ver 4.3. |
| `ciudad` | `string \| null` | |
| `ultimaInteraccionEn` | `ISODate \| null` | Calculado desde `Seguimiento` y `Propuesta`. |
| `proximoPasoEn` | `ISODate \| null` | |
| `archivadoEn` | `ISODate \| null` | Borrado lógico. |

### 4.2 `Contacto`
`id` · `cuentaId` · `nombre` · `cargo` · `telefono` · `email` · `esDecisor: boolean` · `preferenciaCanal`.

### 4.3 `EtapaCuenta`
`"sin_contactar" | "contactada" | "diagnostico" | "propuesta" | "negociacion" | "cerrada_ganada" | "cerrada_perdida" | "cliente_activo"`.
Salir a `cerrada_perdida` exige `motivoPerdida`.

### 4.4 `PlanDeAccion`

| Campo | Tipo | Nota |
|---|---|---|
| `id` | `string` | |
| `eje` | `"empresa" \| "profesional" \| "rubro"` | **Uno solo.** Cruzar ejes = dos planes con `campanaId` común. |
| `objetivoId` | `string` | `Cuenta.id` para empresa/profesional; `Rubro.id` para rubro. |
| `campanaId` | `string \| null` | Vincula planes de distinto eje. |
| `vendedorId` | `string` | |
| `objetivo` | `string` | |
| `productosObjetivo` | `ProductoId[]` | Sólo de los 13. |
| `periodoDesde` / `periodoHasta` | `ISODate` | |
| `metaDinero` | `Dinero \| null` | Con moneda. Sólo de precios documentados. |
| `metaParcial` | `boolean` | `true` si incluye productos con precio `no_documentado`. |
| `hitos` | `Hito[]` | |
| `estado` | `"abierto" \| "cerrado"` | |
| `motivoCierre` | `"cumplido" \| "parcial" \| "descartado" \| "reemplazado" \| null` | Obligatorio al cerrar. |

**Invariante:** `eje === "rubro"` ⇒ el plan **no puede** referenciar `cuentaId`. Genera `ObjetivoSugerido`, no cuentas.

### 4.5 `ObjetivoSugerido`
`id` · `planId` · `cuentaId` · `estado: "sugerido" | "aceptado" | "descartado"`. Aceptar genera una tarea, nunca un registro comercial.

---

## 5. Seguimiento

### 5.1 `Seguimiento`

| Campo | Tipo | Nota |
|---|---|---|
| `id` | `string` | |
| `cuentaId` | `string` | |
| `vendedorId` | `string` | |
| `origen` | `"voz" \| "texto"` | **Misma entidad para ambos.** |
| `ocurridoEn` | `ISODate` | Cuándo pasó (puede diferir del registro). |
| `registradoEn` | `ISODate` | |
| `texto` | `string` | Transcripción editada o texto escrito. |
| `audio` | `AudioSeguimiento \| null` | Sólo `origen === "voz"`. |
| `productosMencionados` | `ProductoId[]` | Validados contra los 13. Lo que no valida **no entra acá**. |
| `etapaSugerida` | `EtapaCuenta \| null` | Sugerencia; se aplica sólo si el vendedor confirma. |
| `confirmadoPorUsuario` | `true` | **Literalmente `true`.** Un `Seguimiento` sin confirmación humana no se persiste. |

### 5.2 `AudioSeguimiento`
`id` · `duracionSegundos` · `formato` · `almacenamientoRef` · `retencionHasta: ISODate` · `borradoEn: ISODate | null` · `borradoPor: string | null`.
**La transcripción sobrevive al audio.** Borrar el audio no borra el `Seguimiento`.

### 5.3 `PasoSugerido`
`id` · `seguimientoId` · `titulo` · `venceEn` · `estado: "propuesto" | "aceptado" | "descartado" | "resuelto"` · `resueltoEn`.
Sólo un paso `aceptado` aparece en Mi Día.

---

## 6. Propuestas

### 6.1 `Propuesta` (base común)
`id` · `tipo: "presentacion" | "cotizacion"` · `cuentaId` · `vendedorId` · `titulo` · `version: number` · `creadoEn` · `actualizadoEn`.

### 6.2 `Presentacion extends Propuesta`
`productosIncluidos: ProductoId[]` · `casosDeUsoIncluidos: string[]` · `incluyePrecios: boolean` · `plantillaId: string | null`.
**Invariante:** `incluyePrecios === true` ⇒ requiere aprobación como cotización (MASTER_SPEC §2.4a).

### 6.3 `Cotizacion extends Propuesta`

| Campo | Tipo | Nota |
|---|---|---|
| `folio` | `string` | Único, legible, inmutable. |
| `estado` | `EstadoCotizacion` | Ver 6.5. |
| `items` | `ItemCotizacion[]` | |
| `totalesPorMoneda` | `Dinero[]` | **Un total por moneda.** Nunca uno solo. |
| `vigenteHasta` | `ISODate` | |
| `versionCatalogo` | `number` | Con qué versión de precios se armó. Permite explicar una diferencia meses después. |
| `requiereAprobacion` | `boolean` | Derivado de las reglas de §8 del MASTER_SPEC. |
| `motivoRequiereAprobacion` | `string[]` | Ej.: `["descuento_supera_limite", "item_no_documentado"]`. |
| `motivoPerdida` | `string \| null` | Obligatorio al pasar a `perdida`. |

### 6.4 `ItemCotizacion`
`id` · `productoId` · `modalidad` · `plan` · `cantidad` · `precioCatalogoId` · `precioLista: Dinero | null` · `descuentoPorcentaje: number` · `precioFinal: Dinero | null` · `aCotizar: boolean` · `notas`.

**Invariantes:**
- `aCotizar === true` ⇒ `precioLista === null` **y** `precioFinal === null` ⇒ `Cotizacion.requiereAprobacion === true`.
- Todos los ítems de un mismo `productoId + modalidad + plan` se consolidan: no hay líneas duplicadas.
- `precioFinal.moneda === precioLista.moneda`. Un ítem **nunca** cambia de moneda.

### 6.5 `EstadoCotizacion`
`"borrador" | "enviada_a_aprobacion" | "aprobada" | "rechazada" | "cambios_solicitados" | "enviada_al_cliente" | "aceptada" | "perdida" | "vencida"`.

### 6.6 `SolicitudAprobacion`
`id` · `cotizacionId` · `versionCotizacion` · `solicitanteId` · `aprobadorId` · `estado` · `slaVenceEn` · `escaladaA` · `creadoEn` · `resueltoEn`.

### 6.7 `EventoAprobacion` *(append-only)*
`id` · `solicitudId` · `actorId` · `accion: "enviar" | "aprobar" | "rechazar" | "solicitar_cambios" | "escalar"` · `comentario` · `ocurridoEn`.
**Invariante:** `actorId !== solicitanteId` para `aprobar`. Nadie aprueba lo propio.

---

## 7. Documentos y enlaces

### 7.1 `DocumentoEmitido` (PDF)
`id` · `propuestaId` · `versionPropuesta` · `tipo: "pdf"` · `folio` · `hashContenido` · `emitidoEn` · `emitidoPor` · `validoHasta` · `almacenamientoRef`.
**Inmutable.** Mismo insumo ⇒ mismo `hashContenido`. Un cambio produce otro documento, nunca una sobrescritura.

### 7.2 `EnlaceCompartido`
`id` · `propuestaId` · `versionPropuesta` · `token` (opaco, no adivinable) · `creadoEn` · `creadoPor` · `venceEn` · `topeAperturas: number | null` · `aperturas: number` · `requiereCodigo: boolean` · `revocadoEn` · `revocadoPor`.
⛔ El `token` **nunca** se deriva de `propuestaId`, `cuentaId` ni de ningún dato del cliente.

### 7.3 `AccesoEnlace` *(append-only)*
`id` · `enlaceId` · `documentoId | null` · `tipoDocumento` · `ocurridoEn` · `tipoDispositivo: "escritorio" | "celular" | "tablet" | "desconocido"` · `paisAproximado: string | null` · `duracionSegundos: number | null` · `resultado: "ok" | "vencido" | "revocado" | "tope_superado" | "codigo_invalido"`.

⛔ **Prohibido almacenar**: IP completa, user-agent crudo, identificador de dispositivo, cookie persistente, correo o teléfono del visitante, y cualquier correlación entre enlaces distintos. La granularidad geográfica máxima es **país**.

---

## 8. Dinero

### 8.1 `Dinero`
`{ monto: number; moneda: "PYG" | "USD" }`. `monto` en unidad mínima, entero.
⛔ **No existe suma entre monedas distintas.** La operación de suma está tipada para rechazarlo.

### 8.2 `Mensualidad`
`id` · `cuentaId` · `productoId` · `plan` · `importe: Dinero` · `vendedorId` · `altaEn` · `bajaEn` · `motivoBaja` · `estado: "activa" | "suspendida" | "baja"` · `diaCobro`.

### 8.3 `CobroMensualidad`
`id` · `mensualidadId` · `periodo: "YYYY-MM"` · `importe: Dinero` · `estado: "pendiente" | "cobrado" | "atrasado" | "incobrable"` · `cobradoEn`.
Es la base del devengamiento recurrente (regla exacta **pendiente**, MASTER_SPEC §16).

### 8.4 `ReglaComision`
`id` · `nombre` · `version: number` · `alcance: { productoIds?, familias?, modalidades?, vendedorIds? }` · `tipo: "porcentaje" | "monto_fijo" | "escalonada"` · `parametros` · `vigenteDesde` · `publicadaPor` · `publicadaEn`.

| # | Invariante |
|---|---|
| RC1 | Una regla publicada **es inmutable**. Cambiar = publicar `version + 1`. |
| RC2 | Una `LineaComision` guarda `reglaId` **y** `reglaVersion`. Reconstruible para siempre. |
| RC3 | `parametros` arranca **vacío**: los factores no están definidos en los insumos y no se inventan. |

### 8.5 `LineaComision`
`id` · `vendedorId` · `origen: "implementacion" | "mensualidad" | "unica_vez" | "prueba"` · `referenciaId` (cotización o cobro) · `base: Dinero` · `reglaId` · `reglaVersion` · `factorAplicado` · `importe: Dinero` · `periodo` · `estado: "devengada" | "aprobada" | "liquidada" | "ajustada" | "anulada"` · `liquidacionId`.
**Invariante:** `importe.moneda === base.moneda`. La comisión no cambia de moneda.

### 8.6 `Liquidacion`
`id` · `vendedorId` · `periodo` · `totalesPorMoneda: Dinero[]` · `estado: "borrador" | "cerrada"` · `cerradaEn` · `cerradaPor` · `comprobanteDocumentoId`.
⛔ `cerrada` es **terminal**. No se reabre. Toda corrección es un `AjusteComision` en el período siguiente.

### 8.7 `AjusteComision`
`id` · `liquidacionOrigenId` · `periodoAplicacion` · `importe: Dinero` (con signo) · `motivo` (obligatorio) · `discrepanciaId` · `creadoPor` · `creadoEn`.

### 8.8 `Discrepancia`
`id` · `lineaComisionId` · `abiertaPor` · `descripcion` · `estado: "abierta" | "procede" | "no_procede" | "parcial"` · `resolucion` · `resueltaPor` · `resueltaEn`.
Abrir una discrepancia **no modifica ningún importe**.

---

## 9. Sugerencias de producto

### 9.1 `SugerenciaProducto`
`id` · `titulo` · `problemaCliente` · `cuentaId` · `rubroId` · `frecuenciaObservada: "unica" | "ocasional" | "frecuente"` · `productosQueNoAlcanzan: ProductoId[]` · `porQueNoAlcanzan: string` · `valorPercibido: Dinero | null` · `adjuntos` · `creadaPor` · `creadaEn` · `estado` · `resolucion` · `productoQueLoCubre: ProductoId | null` · `duplicadaDe: string | null` · `resueltaPor` · `resueltaEn`.

`estado`: `"recibida" | "en_evaluacion" | "aceptada_para_estudio" | "rechazada" | "duplicada" | "ya_cubierta_por_producto_existente"`.

| # | Invariante |
|---|---|
| SP1 | `valorPercibido` se muestra **siempre** etiquetado como estimación del vendedor. Nunca entra a una cotización ni al catálogo. |
| SP2 | `estado === "ya_cubierta_por_producto_existente"` ⇒ `productoQueLoCubre !== null` y `resolucion` no vacía. |
| SP3 | `estado === "duplicada"` ⇒ `duplicadaDe !== null`. |
| SP4 | **Ninguna sugerencia crea un `Producto`.** No hay camino de escritura desde esta tabla al catálogo. |

---

## 10. Auditoría

### 10.1 `RegistroAuditoria` *(append-only)*
`id` · `actorId` · `rolVigente` · `accion` · `entidadTipo` · `entidadId` · `valorAnterior: unknown | null` · `valorPosterior: unknown | null` · `ocurridoEn` · `origenSesion: { tipoDispositivo, paisAproximado }`.

**Acciones cubiertas (mínimo):** ingreso, cierre de sesión, intento fallido, cambio de permiso, alta/baja de usuario, cambio de catálogo, cambio de precio, publicación de regla de comisión, aprobación, rechazo, solicitud de cambios, cierre de período, ajuste de comisión, emisión de enlace, revocación de enlace, emisión de PDF, borrado de audio, exportación de datos, reasignación de cartera.

| # | Invariante |
|---|---|
| A1 | Sin `UPDATE` ni `DELETE` desde la aplicación. |
| A2 | La exportación de auditoría **se registra a sí misma**. |
| A3 | El vendedor ve sólo sus propios eventos; administrador y auditor ven todo. |
| A4 | El borrado por retención requiere doble autorización y queda registrado. |

### 10.2 Distinción que no se puede perder
`AccesoEnlace` responde *"¿el cliente abrió lo que le mandé?"*. `RegistroAuditoria` responde *"¿quién tocó qué dentro del sistema?"*. Son tablas distintas, con audiencias, permisos y retenciones distintas. La interfaz nunca las mezcla en una misma lista.

---

## 11. Invariantes globales

| # | Invariante | Por qué importa |
|---|---|---|
| G1 | `Producto` tiene exactamente 13 filas. | Portafolio cerrado. |
| G2 | Ningún `productoId` fuera de los 13 se persiste en ninguna tabla. | Impide que Sentinela o un producto de la web entre por una referencia suelta. |
| G3 | Todo importe lleva moneda. | Portafolio bimonetario (PYG + USD). |
| G4 | No hay suma entre monedas distintas. | Sin tipo de cambio definido, consolidar sería inventar un número. |
| G5 | Todo cálculo de comisión referencia `reglaId + reglaVersion`. | Reconstruible y auditable a años vista. |
| G6 | `Liquidacion` cerrada es terminal. | La contabilidad no se reescribe. |
| G7 | Nada derivado de voz/texto se persiste sin `confirmadoPorUsuario`. | El sistema propone; la persona guarda. |
| G8 | Auditoría y accesos son append-only. | Un registro editable no es un registro. |
| G9 | El copy vive sólo en `content/copy/`. | Duplicarlo garantiza divergencia; divergir en precio o slogan es un error comercial. |
| G10 | `EnlaceCompartido.token` no deriva de ningún dato del cliente. | Un token adivinable es una fuga. |
| G11 | Un `PlanDeAccion` tiene un solo eje. | Un plan de dos ejes no se puede medir ni cerrar. |
| G12 | `precioFinal.moneda === precioLista.moneda` en todo ítem. | Un ítem que cambia de moneda es una pérdida de margen silenciosa. |

---

## 12. Índices y volumetría esperada

| Tabla | Índices sugeridos | Volumen esperado (año 1) |
|---|---|---|
| `Cuenta` | `(vendedorId, etapa)`, `(rubroPrincipalId)` | miles |
| `Seguimiento` | `(cuentaId, ocurridoEn desc)`, `(vendedorId, registradoEn desc)` | decenas de miles |
| `Cotizacion` | `(vendedorId, estado)`, `(cuentaId, creadoEn desc)`, `folio` único | miles |
| `AccesoEnlace` | `(enlaceId, ocurridoEn desc)` | decenas de miles |
| `LineaComision` | `(vendedorId, periodo)`, `(liquidacionId)` | decenas de miles |
| `RegistroAuditoria` | `(actorId, ocurridoEn desc)`, `(entidadTipo, entidadId)` | cientos de miles |

La volumetría es baja: **el diseño prioriza trazabilidad y reconstrucción sobre rendimiento**. No hay razón para desnormalizar dinero ni auditoría.
