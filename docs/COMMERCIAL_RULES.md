# COMMERCIAL_RULES — Escritorio Vendedores Lab.IA

> **Versión 2.0.** Fuente única para todo cálculo de dinero. Si otro documento contradice a éste en materia comercial, manda éste.
> **Regla cero:** los **precios de lista** están transcriptos literalmente del copy aprobado. Los **precios de una cotización** los propone el vendedor y los aprueba el administrador. Nunca se estima un precio de lista.

---

## 1. Monedas

| Moneda | Código | Uso documentado | Unidad mínima |
|---|---|---|---|
| Guaraní | `PYG` | 12 de los 13 productos | 1 (sin decimales) |
| Dólar | `USD` | **Precio Vivo** | centavo |

| # | Regla |
|---|---|
| M1 | Todo importe lleva moneda. |
| M2 | ⛔ **No hay conversión automática PYG ⇄ USD.** |
| M3 | Totales, metas, participaciones y comisiones se presentan **por moneda**: una línea por moneda. |
| M4 | Una cotización con ítems en dos monedas muestra **dos subtotales**. |

---

## 2. Precios de lista documentados

Transcripción literal del copy aprobado. La columna **"Texto documentado"** es lo que se muestra en pantalla.

### 2.1 Soluciones específicas (9)

| Producto | Modalidad | Moneda | Estado | Texto documentado |
|---|---|---|---|---|
| **Ojo Digital** | setup | PYG | `documentado_desde` | desde aproximadamente **Gs. 700.000** |
| **Ojo Digital** | mensualidad | PYG | `documentado_rango` | aproximadamente **Gs. 350.000 a Gs. 1.100.000** |
| **Pulso Digital** | mensualidad | PYG | `documentado_rango` | **Gs. 270.000 a Gs. 960.000 por mes**, según plan |
| **Vendedor 24/7** | mensualidad | PYG | `documentado_rango` | Aproximadamente **Gs. 590.000 a Gs. 1.500.000 por mes**, según cantidad de conversaciones y funciones |
| **Radar Stock** | mensualidad | PYG | `documentado_rango` | Aproximadamente **Gs. 270.000 a Gs. 900.000 por mes**, según cantidad de productos y plan |
| **Faro Digital** | mensualidad | PYG | `documentado_rango` | **Gs. 108.000 a Gs. 630.000 por mes**, según alcance |
| **Faro Digital** | setup | PYG | `documentado_rango` | La implementación observada va desde aproximadamente **Gs. 600.000 a Gs. 2.700.000** |
| **Merma IA** | mensualidad | PYG | `documentado_desde` | **Desde Gs. 80.000 por mes** para un rubro. El valor sube si se analizan varios rubros o un alcance mayor |
| **Cotiza Fácil** | prueba (30 días) | PYG | `documentado_exacto` | **Prueba de 30 días:** Gs. 3.900.000 + IVA |
| **Cotiza Fácil** | setup | PYG | `documentado_desde` | **Implementación:** desde Gs. 4.900.000 + IVA |
| **Cotiza Fácil** | mensualidad | PYG | `documentado_desde` | **Mensual:** desde Gs. 690.000 + IVA |
| **Cotiza Fácil** | mensualidad (alcance mayor) | PYG | `documentado_desde` | Planes de mayor alcance llegan a **Gs. 5.900.000/mes o más** |
| **Precio Vivo** | setup | **USD** | `documentado_rango` | **Implementación:** USD 300 a USD 800 |
| **Precio Vivo** | mensualidad | **USD** | `documentado_rango` | **Mensual:** USD 150 a USD 400 |
| **Precio Vivo** | mensualidad (alcance grande) | **USD** | `documentado_desde` | Alcances grandes: desde **USD 600/mes** |
| **Ruta IA** | mensualidad · 1 repartidor | PYG | `documentado_exacto` | **1 repartidor:** Gs. 90.000/mes |
| **Ruta IA** | mensualidad · 2 a 4 | PYG | `documentado_exacto` | **2 a 4 repartidores:** Gs. 180.000/mes |
| **Ruta IA** | mensualidad · 5 o más | PYG | `documentado_exacto` | **5 o más:** Gs. 320.000/mes |

### 2.2 Soluciones integrales (4)

| Producto | Modalidad / plan | Moneda | Estado | Texto documentado |
|---|---|---|---|---|
| **Park.IA** | única vez · Piloto Control | PYG | `documentado_exacto` | **Piloto Control:** Gs. 1.500.000 por única vez |
| **Park.IA** | setup · Base | PYG | `documentado_exacto` | **Park.IA Base:** instalación Gs. 2.900.000 |
| **Park.IA** | mensualidad · Base | PYG | `documentado_exacto` | mensualidad Gs. 490.000 |
| **Park.IA** | setup · Control | PYG | `documentado_exacto` | **Park.IA Control:** instalación Gs. 4.900.000 |
| **Park.IA** | mensualidad · Control | PYG | `documentado_exacto` | mensualidad Gs. 790.000 |
| **Park.IA** | setup · Control Plus | PYG | `documentado_exacto` | **Park.IA Control Plus:** instalación Gs. 7.900.000 |
| **Park.IA** | mensualidad · Control Plus | PYG | `documentado_exacto` | mensualidad Gs. 1.290.000 |
| **Smart Commerce** | — | — | `no_documentado` | **Precio oficial no encontrado.** Se cotiza personalizado |
| **Agendar.IA** | setup | PYG | `documentado_exacto` | **Implementación: Gs. 3.000.000** |
| **Agendar.IA** | mensualidad | PYG | `documentado_exacto` | **Mensualidad: Gs. 790.000** |
| **Exeq.IA** | — | — | `no_documentado` | **Precio oficial no encontrado.** Se cotiza personalizado |

### 2.3 Condicionantes documentados

Se muestran junto al precio y ⛔ **no se convierten en fórmula**:

- **Park.IA:** *"El valor final depende de la cantidad de lugares, usuarios, informes, dispositivos e integraciones necesarias."*
- **Agendar.IA:** *"El valor final depende de la cantidad de usuarios, servicios, canales, reservas mensuales e integraciones requeridas."*
- **Smart Commerce:** tamaño de la tienda, cantidad de productos, forma de compra, funciones especiales, integraciones y Dashboard Gerencial requerido.
- **Exeq.IA:** salas, sedes, recursos y herramientas a integrar.

### 2.4 IVA

El copy documenta `+ IVA` **sólo en Cotiza Fácil**. Para el resto no lo aclara ⇒ `ivaIncluido: null` y la interfaz lo muestra como *"IVA no especificado en la lista vigente"*. ⛔ No se asume ningún régimen. En la cotización, el vendedor indica el tratamiento del IVA y el administrador lo aprueba.

---

## 3. Participación: 50 % Lab.IA / 50 % vendedor

> **Regla comercial vigente.** No es un pendiente.

### 3.1 La regla

| Concepto | Valor por defecto |
|---|---|
| Parte de **Lab.IA** | **50 %** |
| Parte del **vendedor** | **50 %** |
| Aplica a **setup** | **Sí** |
| Aplica a **mensualidades** | **Sí** |
| Meses de participación del vendedor en la mensualidad | **Sin límite** mientras la mensualidad esté activa |
| Configurable | **Por producto**, desde Configuración comercial |

### 3.2 Qué es configurable por producto

```
ParticipacionProducto {
  productoId
  porcentajeLabIA        // por defecto 50
  porcentajeVendedor     // por defecto 50
  aplicaASetup           // por defecto true
  aplicaAMensualidad     // por defecto true
  mesesParticipacionVendedor  // null = sin límite (por defecto)
  vigenteDesde
  version
}
```

| # | Regla |
|---|---|
| PA1 | `porcentajeLabIA + porcentajeVendedor` debe ser exactamente **100**. El sistema lo valida y rechaza cualquier otra suma. |
| PA2 | Toda operación arranca con la regla por defecto **50/50** si el producto no tiene una propia. |
| PA3 | Cambiar la participación **publica una versión nueva**; ⛔ no se edita la vigente. |
| PA4 | Una comisión ya devengada **conserva la versión con la que se calculó**. Cambiar la regla no reescribe el pasado. |
| PA5 | `mesesParticipacionVendedor` se cuenta desde el **alta de la mensualidad**. Pasado ese plazo, el 100 % de esa mensualidad queda para Lab.IA. |
| PA6 | `null` significa **sin límite**, no cero. |

### 3.3 Sobre qué se calcula

> **La participación se calcula sobre lo COBRADO, no sobre lo vendido.**

Plata que no entró no genera comisión pagable. Una venta cerrada y no cobrada aparece en **Por cobrar** y en **Comisión estimada**, nunca en **Comisión pendiente de pago**.

### 3.4 Ejemplo

Agendar.IA vendido con setup Gs. 3.000.000 y mensualidad Gs. 790.000, participación por defecto:

| Momento | Cobrado | Parte Lab.IA | Parte vendedor |
|---|---|---|---|
| Setup cobrado | Gs. 3.000.000 | Gs. 1.500.000 | Gs. 1.500.000 |
| Mes 1 cobrado | Gs. 790.000 | Gs. 395.000 | Gs. 395.000 |
| Mes 2 cobrado | Gs. 790.000 | Gs. 395.000 | Gs. 395.000 |
| … mientras la mensualidad siga activa y dentro del plazo configurado | | | |

Si el administrador configurara `mesesParticipacionVendedor = 12` para ese producto, a partir del mes 13 la mensualidad iría 100 % a Lab.IA.

---

## 4. Las ocho cifras

Definiciones exactas. Todas **por moneda**.

| Cifra | Definición |
|---|---|
| **Vendido** | Suma de cotizaciones **aceptadas** en el período: setup + mensualidades contratadas. |
| **Cobrado** | De lo vendido, lo efectivamente ingresado y confirmado. |
| **Por cobrar** | `Vendido − Cobrado`, con antigüedad en días. |
| **Parte de Lab.IA** | Sobre lo **cobrado**, aplicando la participación vigente al hecho generador. |
| **Parte del vendedor** | Ídem. Es la comisión **devengada**. |
| **Comisión pendiente** | Parte del vendedor devengada y **todavía no pagada**. |
| **Comisión pagada** | Parte del vendedor ya liquidada, con su comprobante. |
| **Mensualidades vigentes** | Cantidad e importe del recurrente activo, cliente por cliente. |

**Invariantes:** `Cobrado ≤ Vendido` · `ParteLabIA + ParteVendedor = Cobrado` (dentro del plazo de participación) · `ComisiónPendiente + ComisiónPagada = ParteVendedor`.

---

## 5. Presupuesto de ventas

| # | Regla |
|---|---|
| B1 | Se define **por vendedor y por período**, en guaraníes. |
| B2 | Se compara contra **vendido** y contra **cobrado**, por separado. |
| B3 | El cumplimiento se expresa **en guaraníes** y también en porcentaje del presupuesto. |
| B4 | El **ranking de vendedores es en guaraníes**. ⛔ No en puntajes, medallas ni índices compuestos. |
| B5 | Un presupuesto es editable hasta que arranca el período; después, cambiarlo deja registro. |

---

## 6. Cotización: precio personalizado

El vendedor **propone**; el administrador **aprueba o corrige**.

### 6.1 Qué propone el vendedor

| Campo | Detalle |
|---|---|
| **Setup** | Importe de implementación, con moneda. |
| **Mensualidad** | Importe recurrente, con moneda. |
| **Descuento de implementación** | Porcentaje o importe sobre el setup. |
| **Débito automático** | Sí / No. |
| **Compromiso de doce meses** | Sí / No. |
| **Pago anual anticipado** | Sí / No. |
| **Alcance** | Qué incluye y qué no. |
| **Vigencia** | Hasta cuándo vale la oferta. |
| **Cronograma** | Etapas y plazos de implementación. |
| **Condiciones** | Condiciones comerciales adicionales. |

### 6.2 Qué ve el administrador al revisar

Precio de lista documentado vs. precio propuesto · desviación en guaraníes y en porcentaje · impacto en la parte de Lab.IA · las tres condiciones (débito, compromiso, anual anticipado) · historial del cliente · versiones anteriores de la cotización.

### 6.3 Reglas

| # | Regla |
|---|---|
| C1 | ⛔ **Toda** cotización pasa por aprobación. Sin umbral, sin excepción, sin autoaprobación. |
| C2 | Aprobar, corregir y rechazar **exigen comentario**. |
| C3 | Una cotización aprobada es **inmutable**; editarla crea versión nueva y caduca la aprobación. |
| C4 | El **PDF definitivo** se emite después de aprobar. ⛔ Nunca antes. |
| C5 | Nadie aprueba su propia cotización. |
| C6 | Los productos sin precio de lista (Smart Commerce, Exeq.IA) se cotizan íntegramente personalizados. |
| C7 | Los totales van **por moneda**. |

---

## 7. Mensualidades

| # | Regla |
|---|---|
| ME1 | Nace de una cotización **aceptada** con importe de mensualidad. |
| ME2 | Su importe es el **aprobado en la cotización**, no el de lista. |
| ME3 | Cada mes genera un cobro con estado: `pendiente`, `cobrado`, `atrasado`, `incobrable`. |
| ME4 | La participación se devenga contra **cobro confirmado**. |
| ME5 | Suspensión y baja exigen motivo. |
| ME6 | Una baja no borra cobros ni comisiones ya devengadas. |
| ME7 | Un cambio de plan es **baja + alta**, no una edición de importe: preserva la historia. |

---

## 8. Liquidación y ajustes

| # | Regla |
|---|---|
| L1 | El cierre de período es **manual y explícito**, hecho por el administrador. |
| L2 | Antes de cerrar se verifican: cotizaciones sin resolver, cobros sin confirmar, observaciones abiertas. Si hay bloqueos, se listan y ⛔ no se cierra. |
| L3 | Un período cerrado **no se reabre**. Toda corrección es un **ajuste** en el período siguiente, con motivo obligatorio. |
| L4 | ⛔ Una comisión emitida **no se recalcula**. |
| L5 | Cada línea guarda la **versión de la regla de participación** con que se calculó. |
| L6 | El vendedor puede abrir una **observación** sobre una línea; ⛔ no modifica ningún importe. La resuelve el administrador: `procede`, `no_procede` o `parcial`, siempre con comentario. |

---

## 9. Qué está prohibido, explícitamente

| # | Prohibición |
|---|---|
| X1 | Mostrar un **precio de lista** que no esté en §2. |
| X2 | Redondear, promediar o estimar un precio de lista a partir de un rango. |
| X3 | Convertir PYG ⇄ USD. |
| X4 | Sumar importes de monedas distintas. |
| X5 | Asumir un régimen de IVA donde el copy no lo documenta. |
| X6 | Una participación cuyos porcentajes no sumen 100. |
| X7 | Enviar una cotización al cliente sin aprobación del administrador. |
| X8 | Autoaprobar una cotización por tiempo, monto o antigüedad. |
| X9 | Emitir el PDF definitivo antes de la aprobación. |
| X10 | Recalcular un período cerrado. |
| X11 | Devengar comisión sobre plata no cobrada. |
| X12 | Cotizar un producto fuera de los 13. |
| X13 | Editar el texto documentado de un precio "para aclararlo". |
| X14 | Dar al vendedor cualquier ruta de escritura sobre comisiones, participaciones o liquidaciones. |
