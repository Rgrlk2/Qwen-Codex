# COMMERCIAL_RULES — Escritorio Vendedores Lab.IA

> **Fuente única para todo cálculo de dinero.** Si otro documento contradice a éste en materia comercial, manda éste.
> **Regla cero:** todo importe de este documento está **transcripto literalmente** del copy maestro aprobado (`content/copy/`). **No hay un solo número estimado, redondeado, proyectado ni inferido.** Lo que no está documentado figura como `NO_DOCUMENTADO` y queda en §6 como pendiente de definición comercial.

---

## 1. Monedas

| Moneda | Código | Uso documentado | Unidad mínima |
|---|---|---|---|
| Guaraní | `PYG` | 12 de los 13 productos | 1 (sin decimales) |
| Dólar estadounidense | `USD` | **Precio Vivo** | centavo |

| # | Regla |
|---|---|
| M1 | Todo importe lleva moneda. No existe importe sin moneda. |
| M2 | **No hay conversión automática PYG ⇄ USD.** No se asume ningún tipo de cambio. |
| M3 | Totales, metas, comisiones y liquidaciones se presentan **agrupados por moneda**: una línea por moneda. |
| M4 | Una cotización con ítems en dos monedas muestra **dos subtotales**, nunca uno consolidado. |
| M5 | Si el negocio decidiera consolidar, será con un tipo de cambio institucional explícito, con fecha y fuente registradas. Hoy **no existe** y el sistema no lo simula. |

---

## 2. Lista de precios documentada

Transcripción literal del copy aprobado. La columna **"Texto documentado"** es exactamente lo que se muestra en pantalla.

### 2.1 Soluciones específicas (9)

| Producto | Modalidad | Moneda | Estado | Texto documentado |
|---|---|---|---|---|
| **Ojo Digital** | implementación | PYG | `documentado_desde` | desde aproximadamente **Gs. 700.000** |
| **Ojo Digital** | mensualidad | PYG | `documentado_rango` | aproximadamente **Gs. 350.000 a Gs. 1.100.000** |
| **Pulso Digital** | mensualidad | PYG | `documentado_rango` | **Gs. 270.000 a Gs. 960.000 por mes**, según plan |
| **Vendedor 24/7** | mensualidad | PYG | `documentado_rango` | Aproximadamente **Gs. 590.000 a Gs. 1.500.000 por mes**, según cantidad de conversaciones y funciones |
| **Radar Stock** | mensualidad | PYG | `documentado_rango` | Aproximadamente **Gs. 270.000 a Gs. 900.000 por mes**, según cantidad de productos y plan |
| **Faro Digital** | mensualidad | PYG | `documentado_rango` | **Gs. 108.000 a Gs. 630.000 por mes**, según alcance |
| **Faro Digital** | implementación | PYG | `documentado_rango` | La implementación observada va desde aproximadamente **Gs. 600.000 a Gs. 2.700.000** |
| **Merma IA** | mensualidad | PYG | `documentado_desde` | **Desde Gs. 80.000 por mes** para un rubro. El valor sube si se analizan varios rubros o un alcance mayor |
| **Cotiza Fácil** | prueba (30 días) | PYG | `documentado_exacto` | **Prueba de 30 días:** Gs. 3.900.000 + IVA |
| **Cotiza Fácil** | implementación | PYG | `documentado_desde` | **Implementación:** desde Gs. 4.900.000 + IVA |
| **Cotiza Fácil** | mensualidad | PYG | `documentado_desde` | **Mensual:** desde Gs. 690.000 + IVA |
| **Cotiza Fácil** | mensualidad (alcance mayor) | PYG | `documentado_desde` | Planes de mayor alcance llegan a **Gs. 5.900.000/mes o más**, según usuarios, productos e integraciones |
| **Precio Vivo** | implementación | **USD** | `documentado_rango` | **Implementación:** USD 300 a USD 800 |
| **Precio Vivo** | mensualidad | **USD** | `documentado_rango` | **Mensual:** USD 150 a USD 400 |
| **Precio Vivo** | mensualidad (alcance grande) | **USD** | `documentado_desde` | Alcances grandes: desde **USD 600/mes** |
| **Ruta IA** | mensualidad · 1 repartidor | PYG | `documentado_exacto` | **1 repartidor:** Gs. 90.000/mes |
| **Ruta IA** | mensualidad · 2 a 4 repartidores | PYG | `documentado_exacto` | **2 a 4 repartidores:** Gs. 180.000/mes |
| **Ruta IA** | mensualidad · 5 o más | PYG | `documentado_exacto` | **5 o más:** Gs. 320.000/mes |

### 2.2 Soluciones integrales (4)

| Producto | Modalidad / plan | Moneda | Estado | Texto documentado |
|---|---|---|---|---|
| **Park.IA** | única vez · Piloto Control | PYG | `documentado_exacto` | **Piloto Control:** Gs. 1.500.000 por única vez |
| **Park.IA** | implementación · Base | PYG | `documentado_exacto` | **Park.IA Base:** instalación Gs. 2.900.000 |
| **Park.IA** | mensualidad · Base | PYG | `documentado_exacto` | mensualidad Gs. 490.000 |
| **Park.IA** | implementación · Control | PYG | `documentado_exacto` | **Park.IA Control:** instalación Gs. 4.900.000 |
| **Park.IA** | mensualidad · Control | PYG | `documentado_exacto` | mensualidad Gs. 790.000 |
| **Park.IA** | implementación · Control Plus | PYG | `documentado_exacto` | **Park.IA Control Plus:** instalación Gs. 7.900.000 |
| **Park.IA** | mensualidad · Control Plus | PYG | `documentado_exacto` | mensualidad Gs. 1.290.000 |
| **Smart Commerce** | — | — | `no_documentado` | **Precio oficial no encontrado.** |
| **Agendar.IA** | implementación | PYG | `documentado_exacto` | **Implementación: Gs. 3.000.000** |
| **Agendar.IA** | mensualidad | PYG | `documentado_exacto` | **Mensualidad: Gs. 790.000** |
| **Exeq.IA** | — | — | `no_documentado` | **Precio oficial no encontrado.** |

### 2.3 Condicionantes documentados del precio final

Transcriptos del copy; se muestran junto al precio y **no se convierten en fórmula**:

- **Park.IA:** *"El valor final depende de la cantidad de lugares, usuarios, informes, dispositivos e integraciones necesarias."*
- **Agendar.IA:** *"El valor final depende de la cantidad de usuarios, servicios, canales, reservas mensuales e integraciones requeridas."*
- **Smart Commerce:** se cotiza según tamaño de la tienda, cantidad de productos, forma de compra, funciones especiales, integraciones y Dashboard Gerencial requerido.
- **Exeq.IA:** se cotiza de forma personalizada según las salas, sedes, recursos y herramientas que deban integrarse.

### 2.4 Cobertura de modalidades

| Producto | implementación | mensualidad | única vez | prueba |
|---|:--:|:--:|:--:|:--:|
| Ojo Digital | ✓ | ✓ | — | — |
| Pulso Digital | — | ✓ | — | — |
| Vendedor 24/7 | — | ✓ | — | — |
| Radar Stock | — | ✓ | — | — |
| Faro Digital | ✓ | ✓ | — | — |
| Merma IA | — | ✓ | — | — |
| Cotiza Fácil | ✓ | ✓ | — | ✓ |
| Precio Vivo | ✓ | ✓ | — | — |
| Ruta IA | — | ✓ | — | — |
| Park.IA | ✓ | ✓ | ✓ | — |
| Smart Commerce | `NO_DOCUMENTADO` | `NO_DOCUMENTADO` | — | — |
| Agendar.IA | ✓ | ✓ | — | — |
| Exeq.IA | `NO_DOCUMENTADO` | `NO_DOCUMENTADO` | — | — |

Un guion significa **que el copy no documenta esa modalidad**, no que el producto no pueda tenerla. Habilitarla requiere que administración cargue el precio.

---

## 3. IVA

| # | Regla |
|---|---|
| I1 | El copy documenta `+ IVA` **explícitamente sólo en Cotiza Fácil** (los tres importes). Esos precios son `ivaIncluido: false`. |
| I2 | Para los otros 12 productos el copy **no aclara** el régimen ⇒ `ivaIncluido: null` (**no documentado**). |
| I3 | La interfaz muestra el estado tal cual: *"IVA no especificado en la lista vigente"*. ⛔ **No se asume incluido ni excluido.** |
| I4 | Un `null` en IVA **bloquea el cálculo automático de total con impuestos**: la cotización muestra el subtotal y una nota de que el IVA se confirma con administración. |
| I5 | Resolver el régimen de esos 12 productos es tarea de administración (§6, pendiente 5). No es un problema que el software pueda resolver solo. |

---

## 4. Descuentos y aprobación

### 4.1 Límite autónomo
Cada vendedor tiene un **límite autónomo de descuento** (`Usuario.limiteDescuentoAutonomo`). Su valor **no está definido en los insumos** ⇒ arranca en `null`.

**`null` significa "sin límite definido", y se interpreta como el escenario más conservador: toda cotización con descuento requiere aprobación.** No se interpreta como "ilimitado". Un parámetro faltante nunca abre una puerta.

### 4.2 Disparadores de aprobación obligatoria

Una cotización pasa a `enviada_a_aprobacion` — sin excepción — si se cumple **cualquiera** de estas condiciones:

| # | Disparador |
|---|---|
| D1 | El descuento supera el límite autónomo del vendedor. |
| D2 | El límite autónomo es `null` y hay descuento > 0. |
| D3 | Algún ítem tiene precio `no_documentado` (Smart Commerce, Exeq.IA) ⇒ ítem *a cotizar*. |
| D4 | Un ítem con precio `documentado_rango` queda **fuera** del rango. |
| D5 | Un ítem con precio `documentado_desde` queda **por debajo** del piso. |
| D6 | La cotización incluye una condición comercial no prevista (plazo, financiación, canje). |
| D7 | Una presentación incluye precios (MASTER_SPEC §2.4a). |
| D8 | La cotización usa una versión de catálogo distinta de la vigente. |

### 4.3 Reglas de la aprobación

| # | Regla |
|---|---|
| AP1 | Nadie aprueba su propia cotización, cualquiera sea su rol. |
| AP2 | `aprobar`, `rechazar` y `solicitar_cambios` exigen comentario. |
| AP3 | Una cotización `aprobada` es inmutable; editarla crea versión nueva en `borrador` y **caduca la aprobación anterior**. |
| AP4 | Vencido el SLA, escala al suplente configurado. ⛔ **Nunca se autoaprueba por tiempo.** |
| AP5 | La aprobación se otorga sobre **una versión concreta**. Cambió la versión, cayó la aprobación. |
| AP6 | El supervisor aprueba dentro de su propio límite; por encima, escala al administrador. |

---

## 5. Vigencias

| Concepto | Regla | Valor por defecto |
|---|---|---|
| Vigencia de cotización | Fecha explícita en el documento. Pasada esa fecha ⇒ `vencida` automática y el enlace público deja de mostrar importes. | `NO_DEFINIDO` (§6, pendiente 8) |
| Vigencia de enlace | Independiente de la de la cotización. Puede vencer antes, nunca después. | `NO_DEFINIDO` (§6, pendiente 8) |
| Vigencia de lista de precios | `vigenteDesde` / `vigenteHasta` por versión de catálogo. | Sin vencimiento hasta que se publique otra versión |
| SLA de aprobación | Reloj desde `enviada_a_aprobacion`. | `NO_DEFINIDO` (§6, pendiente 9) |

Mientras un valor esté `NO_DEFINIDO`, la interfaz **exige que el vendedor lo fije a mano** en cada documento. No se inventa un default.

---

## 6. Parámetros pendientes de definición comercial

**Ninguno de estos valores está en los insumos recibidos. Ninguno se inventa.** El sistema los recibe como configuración; hasta entonces, cada uno tiene un comportamiento conservador definido.

| # | Parámetro | Comportamiento mientras esté pendiente |
|---|---|---|
| 1 | **Porcentajes de comisión** por producto, familia y modalidad | `ReglaComision.parametros` vacío. Mi Dinero muestra la operación y la base, y la comisión como *"pendiente de regla"*. ⛔ No se calcula ningún importe. |
| 2 | **Base de devengamiento recurrente**: ¿emisión o cobro confirmado? | Se registra el cobro y se marca la comisión como `devengada` recién con **cobro confirmado** (criterio conservador, revisable). |
| 3 | **Calendario de liquidación** y **clawback** por baja temprana | Sin cierre automático. El cierre es manual y explícito (F14). Sin clawback implementado. |
| 4 | **Límite autónomo de descuento** por vendedor y por rol | `null` ⇒ todo descuento requiere aprobación (§4.1). |
| 5 | **Régimen de IVA** de los 12 productos sin `+ IVA` documentado | `ivaIncluido: null`, sin cálculo automático de impuestos (§3). |
| 6 | **Precio de Smart Commerce y de Exeq.IA** | `no_documentado`. Ítem *a cotizar*, aprobación obligatoria (D3). |
| 7 | **Tipo de cambio institucional PYG/USD** | Sin conversión. Todo por moneda (§1 M2). |
| 8 | **Vigencia por defecto** de cotizaciones y enlaces | El vendedor la fija a mano, obligatoriamente, en cada documento. |
| 9 | **SLA de aprobación** y cadena de suplencia | Sin reloj. La cola se ordena por antigüedad y monto; sin escalado automático. |
| 10 | **Retención** de audios de seguimiento y de auditoría | Sin borrado automático. El borrado es manual, con motivo y doble autorización. |

### 6.1 Formato de entrega de los parámetros

Para no volver a pasar por una interpretación, administración entrega cada parámetro con: **valor**, **moneda cuando aplique**, **alcance** (producto / familia / modalidad / vendedor / rol), **fecha de vigencia desde** y **responsable que lo aprueba**. Sin esos cinco campos, el parámetro no se carga.

---

## 7. Cálculo de comisiones — mecánica

La mecánica está definida; **los factores no**. El sistema queda listo para recibirlos.

```
Para cada operación comisionable:
  1. Determinar origen        → implementacion | mensualidad | unica_vez | prueba
  2. Determinar base          → Dinero { monto, moneda }   (importe efectivo, post-descuento)
  3. Seleccionar ReglaComision vigente a la fecha del hecho generador
  4. Aplicar factor           → según regla.tipo
  5. Emitir LineaComision con reglaId + reglaVersion + factorAplicado
  6. Estado inicial: "devengada"
```

| # | Regla |
|---|---|
| C1 | `importe.moneda === base.moneda`. La comisión no cambia de moneda. |
| C2 | La regla se selecciona por **fecha del hecho generador**, no por fecha de cálculo. |
| C3 | Una `LineaComision` emitida **no se recalcula jamás**. Corregir = `AjusteComision`. |
| C4 | Un período cerrado no se reabre. |
| C5 | Sin regla vigente aplicable, la línea queda `pendiente de regla` y **se muestra como tal**. ⛔ No se aplica un factor por defecto. |
| C6 | Todo ajuste manual exige motivo y queda en auditoría con actor y fecha. |

---

## 8. Mensualidades

| # | Regla |
|---|---|
| ME1 | Una mensualidad nace de una cotización `aceptada` con ítem de modalidad `mensualidad`. |
| ME2 | Su importe es el `precioFinal` del ítem, con su moneda. No se re-deriva del catálogo. |
| ME3 | Suspensión y baja exigen motivo. |
| ME4 | Una baja **no borra** el historial de cobros ni las comisiones ya devengadas. |
| ME5 | La reasignación de cartera **no reasigna comisiones ya devengadas** (MASTER_SPEC F18). Qué pasa con las futuras es decisión explícita del administrador al reasignar. |
| ME6 | Un cambio de plan (p. ej. Park.IA Base → Control) es **baja + alta**, no una edición del importe. Preserva la historia. |

---

## 9. Qué está prohibido, explícitamente

| # | Prohibición |
|---|---|
| X1 | Mostrar, sugerir o calcular un precio que no esté en §2. |
| X2 | Redondear, promediar o "estimar" un precio a partir de un rango. Un rango se muestra como rango. |
| X3 | Convertir PYG ⇄ USD con cualquier tipo de cambio. |
| X4 | Sumar importes de monedas distintas. |
| X5 | Asumir un régimen de IVA donde el copy no lo documenta. |
| X6 | Aplicar un porcentaje de comisión por defecto. |
| X7 | Autoaprobar una cotización por vencimiento de SLA. |
| X8 | Recalcular un período cerrado. |
| X9 | Cotizar un producto fuera de los 13 — **incluido Sentinela**. |
| X10 | Tratar el "valor percibido" de una sugerencia de producto como un precio. |
| X11 | Editar el texto documentado de un precio para "aclararlo". Se muestra tal cual. |
| X12 | Emitir un PDF o un enlace con importes de una cotización sin aprobación cuando ésta era obligatoria. |
