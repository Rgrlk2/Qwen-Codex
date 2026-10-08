# COMMERCIAL_RULES — Escritorio Vendedores Lab.IA

> **Versión 3.0.** Fuente única para todo cálculo de dinero. Si otro documento contradice a éste en materia comercial, manda éste.
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

## 6. Cotización estructurada

El vendedor **propone**; el administrador (CEO) **aprueba o corrige**.

> **Plantilla genérica.** Esta estructura se genera para **cualquiera de los 13
> productos, cualquier variante y cualquier cliente**. No hay ningún cliente de
> referencia, ninguna condición particular heredada y ningún importe fijado en
> el código: todo precio entra por datos.

**Nombres.** Internamente el importe negociado se llama **precio efectivo**.
⛔ En el PDF que recibe el cliente se muestra **siempre** como **"Precio especial"**
(`propuestas.ts` → `ETIQUETA_PRECIO_ESPECIAL`).

### 6.1 Campos obligatorios

Los 25 campos de abajo son **obligatorios**. Una cotización a la que le falte
uno no se envía a revisión.

| # | Campo | Dónde vive |
|---|---|---|
| 1 | Número o folio | `Cotizacion.folio` |
| 2 | Cliente | `destinatario.nombreCliente` |
| 3 | Empresa o profesional | `destinatario.nombreEmpresaOProfesional` + `destinatario.tipo` |
| 4 | Nombre del producto | `objeto.nombreProducto` |
| 5 | Variante o plan, cuando exista | `objeto.variante` (`null` si el producto no tiene) |
| 6 | Nombre del vendedor | `nombreVendedor` |
| 7 | Fecha de emisión | `fechaEmision` |
| 8 | Fecha de validez | `fechaValidez` |
| 9 | Precio de lista del setup | `precios.setupLista` |
| 10 | Precio especial del setup (**S**) | `precios.setupEspecial` |
| 11 | Ahorro en el setup | `precios.ahorroSetup` · calculado |
| 12 | Precio mensual de lista | `precios.mensualLista` |
| 13 | Precio mensual especial (**M**) | `precios.mensualEspecial` |
| 14 | Ahorro mensual | `precios.ahorroMensual` · calculado |
| 15 | Permanencia mínima de 12 meses | `condiciones.permanenciaMinimaMeses` |
| 16 | Condiciones de instalación | `condiciones.instalacion.descripcion` |
| 17 | Tiempo estimado de instalación | `condiciones.instalacion.tiempoEstimadoDiasHabiles` y su texto |
| 18 | Insumos, accesos, cuentas, información y equipos que aporta el cliente | `condiciones.instalacion.aportesDelCliente` |
| 19 | Qué incluye | `condiciones.alcance.queIncluye` |
| 20 | Qué no incluye | `condiciones.alcance.queNoIncluye` |
| 21 | Bases y condiciones | `condiciones.basesYCondiciones` |
| 22 | Firma del vendedor | `firmas[]` con `rol: 'vendedor'` |
| 23 | Firma del CEO | `firmas[]` con `rol: 'ceo'` |
| 24 | Logos oficiales de Lab.IA, RGrlk Group y del producto | `logos` |
| 25 | Logo de la variante, si existe oficialmente | `logos.variante` (`null` si no existe) |

⛔ Los ahorros (11 y 14) **no se escriben**: se calculan como `lista − especial` y
se vuelven a calcular en el servidor antes de aprobar.

⛔ Los logos (24 y 25) son **activos oficiales del inventario**
(`INVENTARIO_ACTIVOS.md`). No se generan, no se redibujan, no se recolorean, no
se recortan y no se deforman: se muestran con `object-fit: contain` respetando su
proporción original. Si la variante no tiene logo oficial, va `null`: no se
fabrica uno.

### 6.2 Qué aporta el cliente

`aportesDelCliente` clasifica cada requisito en uno de cinco tipos, y marca si
es bloqueante:

| Tipo | Qué es |
|---|---|
| `insumo` | Material físico o consumible que provee el cliente |
| `acceso` | Permiso a un sistema, local, red o dispositivo |
| `cuenta` | Cuenta de un servicio de terceros a nombre del cliente |
| `informacion` | Datos, listados, textos o definiciones que hacen falta |
| `equipo` | Hardware que pone el cliente |

**Por qué está en la cotización.** Un proyecto que se atrasa porque el cliente
nunca dio el acceso es un proyecto que se discute. Si el acceso estaba escrito
en el documento que el cliente aceptó, no hay discusión.

### 6.3 Qué ve el administrador al revisar

Precio de lista contra precio especial · desviación en guaraníes y en porcentaje ·
**los cuatro totales recalculados por el servidor** · permanencia mínima ·
aportes bloqueantes del cliente · qué incluye y qué no · impacto en la parte de
Lab.IA · historial del cliente · versiones anteriores · firma del vendedor
presente y vigente.

### 6.4 Reglas

| # | Regla |
|---|---|
| C1 | ⛔ **Toda** cotización pasa por aprobación. Sin umbral, sin excepción, sin autoaprobación. |
| C2 | Aprobar, corregir y rechazar **exigen comentario**. |
| C3 | Una cotización aprobada es **inmutable**; editarla crea versión nueva, caduca la aprobación **y anula las firmas anteriores**. |
| C4 | El **PDF definitivo** se emite después de aprobar y con **las dos firmas** vigentes. ⛔ Nunca antes. |
| C5 | Nadie aprueba su propia cotización. |
| C6 | Los productos sin precio de lista se cotizan íntegramente personalizados. |
| C7 | Los totales van **por moneda**. ⛔ Nunca se suman monedas distintas. |
| C8 | ⛔ Los 25 campos de §6.1 son obligatorios. Falta uno, no se envía a revisión. |
| C9 | ⛔ `queNoIncluye` no puede ir vacío: una cotización sin exclusiones escritas es un reclamo futuro. |
| C10 | ⛔ La permanencia mínima por defecto es **12 meses** (`PERMANENCIA_MINIMA_MESES`). |
| C11 | ⛔ El documento del cliente dice **"Precio especial"**, nunca "precio efectivo" ni "precio verdadero". |

---

## 7. Alternativas financieras

Toda cotización aprobada le ofrece al cliente **cuatro alternativas**.
⛔ **B, C y D NO son acumulables.** El cliente elige **una sola**.

| | Alternativa | Descuento | Permanencia | Meses de servicio | Cuotas |
|---|---|---|---|---|---|
| **A** | Plan estándar | — | 12 meses | 12 | 12 |
| **B** | Pago adelantado 12 meses | 10 % sobre las 12 mensualidades especiales | 12 meses | 12 | 1 pago único |
| **C** | Pago adelantado 24 meses | 20 % sobre las 24 mensualidades especiales | 24 meses | 24 | 1 pago único |
| **D** | Cheques diferidos o débito automático de tarjeta | 10 % sobre la mensualidad especial, **un mes bonificado** | 12 meses | 12 | 11 |

### 7.1 Los cuatro cálculos

Con **S** = precio especial del setup y **M** = precio mensual especial:

| | Fórmula |
|---|---|
| **A** | `S + (M × 12)` |
| **B** | `S + (M × 12 × 0,90)` |
| **C** | `S + (M × 24 × 0,80)` |
| **D** | `S + (M × 11 × 0,90)` |

En **D** el cliente recibe **12 meses de servicio** y paga **11 mensualidades**
con 10 % de descuento: la diferencia es el mes bonificado.

⛔ **El descuento se calcula sobre la mensualidad especial.** El precio especial
del setup **se suma por separado** y nunca recibe el descuento de la alternativa.

⛔ **Nunca se suman monedas diferentes.** Si la base mezcla PYG con USD, el
cálculo falla con `monedas_mezcladas`; no devuelve un total.

⛔ **Todos los cálculos se ejecutan de nuevo en el servidor antes de aprobar.**
El navegador puede previsualizar con las funciones puras de
`packages/compartido/src/alternativas.ts`, pero lo que vale es el resultado del
servidor.

**Verificación:** `npm run verificar:calculos` ejecuta las cuatro fórmulas contra
la implementación, en guaraníes y en dólares, y comprueba que las cuotas sumen
exactamente el total.

### 7.2 Qué se muestra de cada alternativa

Las diez cifras, por alternativa:

precio total de lista · precio especial sin promoción · descuento adicional ·
ahorro total · setup a pagar · mensualidades a pagar · cantidad de meses de
servicio · total final · valor mensual efectivo · forma y calendario de pago.

### 7.3 Redondeo

| Caso | Regla |
|---|---|
| **Pago único adelantado (B y C)** | El descuento se aplica al total de las mensualidades y se redondea **una vez**. |
| **En cuotas (A y D)** | Se redondea **la cuota**; el total es la cuota por la cantidad de cuotas. |

**Por qué.** Si en una alternativa en cuotas se redondeara el total, las cuotas
no sumarían el total y el cliente tendría razón al reclamar.

### 7.4 Reglas

| # | Regla |
|---|---|
| AF1 | ⛔ B, C y D **no se acumulan**. Elegir una excluye a las otras. |
| AF2 | ⛔ El descuento cae sobre **M**, nunca sobre **S**. |
| AF3 | ⛔ Nunca se suman monedas distintas. |
| AF4 | ⛔ El servidor recalcula las cuatro antes de aprobar; su resultado prevalece. |
| AF5 | El administrador decide **cuáles** alternativas quedan visibles para el cliente al aprobar. |

---

## 8. Aprobación, firmas y respuesta del cliente

### 8.1 El circuito

```
borrador del vendedor → revisión del CEO → aprobación o corrección
→ incorporación de firmas → PDF definitivo → enlace para el cliente
```

⛔ Sin desvíos. No existe transición que lleve una cotización al cliente sin
pasar por `aprobada`.

### 8.2 Firmas

| # | Regla |
|---|---|
| F1 | La **firma del vendedor** se registra **antes** de enviar a revisión. |
| F2 | La **firma del CEO** se incorpora **cuando aprueba**. |
| F3 | ⛔ Las firmas son **activos protegidos servidos desde el servidor**. |
| F4 | ⛔ La imagen original de la firma del CEO **no se expone por ninguna URL pública**. El PDF la incrusta al generarse, en el servidor; el navegador nunca la descarga por separado. |
| F5 | ⛔ Una **modificación posterior anula** la aprobación y las firmas anteriores. Hay que volver a firmar y volver a aprobar. |

`Firma.referenciaProtegida` es un identificador interno que sólo el servidor
resuelve: no es una URL, no es un nombre de archivo y no se puede adivinar.

### 8.3 La respuesta del cliente

Después de la aprobación, el cliente recibe un **enlace privado y único** que
muestra: nombre del cliente · producto y variante · número y versión ·
las alternativas aprobadas con su total · vencimiento · bases y condiciones.

⛔ **Como las alternativas son excluyentes, la interfaz usa botones de opción,
nunca casillas múltiples.** Seis opciones:

| Opción | Texto exacto |
|---|---|
| `estandar` | Elijo el plan estándar. |
| `adelantado_12` | Elijo pago adelantado por 12 meses. |
| `adelantado_24` | Elijo pago adelantado por 24 meses. |
| `diferido` | Elijo cheques diferidos o débito automático. |
| `contactar_antes` | Quiero que me contacten antes de elegir. |
| `no_continuar` | No continuar por ahora. |

⛔ **Casilla obligatoria**, antes de poder enviar:

> He revisado la opción seleccionada y solicito que Lab.IA continúe con los próximos pasos.

Botón final: **Enviar mi elección**

El tipo `RespuestaDelCliente.aceptacionMarcada` es literal `true`: sin la casilla
marcada, el código no compila y el servidor devuelve `validacion`.

### 8.4 Constancia

Al recibir la respuesta se guarda un **registro inmutable** con:

cliente · cotización · versión exacta · opción seleccionada · importes aceptados ·
fecha y hora · vencimiento · texto de aceptación · identificación del enlace ·
huella del documento aprobado.

⛔ **Esta respuesta funciona como constancia comercial o aval de intención.
No se presenta como contrato ni como firma electrónica legal.** El tipo lo
recuerda en el propio registro: `naturaleza: 'constancia_comercial'`.

### 8.5 Notificaciones

Al recibir la respuesta se avisa automáticamente a cuatro destinos:

| Canal | Destino |
|---|---|
| `celular_vendedor` | Celular del vendedor asignado |
| `whatsapp_corporativo` | **+595 984 355775** |
| `celular_ceo` | Celular personal del CEO — **configurable y almacenado solamente en el servidor** |
| `panel_administracion` | Panel de Administración |

| # | Regla |
|---|---|
| N1 | ⛔ El número personal del CEO **nunca** aparece en el enlace, en el PDF ni en código del navegador. Se referencia por `destinoProtegido`, que sólo el servidor resuelve. |
| N2 | ⛔ La constancia se guarda **antes** de intentar los avisos. |
| N3 | ⛔ Si una notificación falla, la respuesta **se conserva** y el aviso se reintenta. **Nunca se pierde la elección del cliente.** |
| N4 | `ResultadoNotificaciones.constanciaGuardada` es literal `true`: un fallo de aviso no puede representarse como pérdida de la constancia. |

---

## 9. Mensualidades

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

## 10. Liquidación y ajustes

| # | Regla |
|---|---|
| L1 | El cierre de período es **manual y explícito**, hecho por el administrador. |
| L2 | Antes de cerrar se verifican: cotizaciones sin resolver, cobros sin confirmar, observaciones abiertas. Si hay bloqueos, se listan y ⛔ no se cierra. |
| L3 | Un período cerrado **no se reabre**. Toda corrección es un **ajuste** en el período siguiente, con motivo obligatorio. |
| L4 | ⛔ Una comisión emitida **no se recalcula**. |
| L5 | Cada línea guarda la **versión de la regla de participación** con que se calculó. |
| L6 | El vendedor puede abrir una **observación** sobre una línea; ⛔ no modifica ningún importe. La resuelve el administrador: `procede`, `no_procede` o `parcial`, siempre con comentario. |

---

## 11. Qué está prohibido, explícitamente

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
| X15 | Enviar a revisión una cotización a la que le falte alguno de los 25 campos obligatorios de §6.1. |
| X16 | Enviar una cotización sin escribir qué **no** incluye. |
| X17 | Acumular dos o más de las alternativas B, C y D. |
| X18 | Aplicar el descuento de una alternativa sobre el precio especial del **setup**. |
| X19 | Aprobar sin que el servidor haya vuelto a ejecutar los cuatro cálculos. |
| X20 | Emitir el PDF definitivo sin las dos firmas vigentes. |
| X21 | Exponer la imagen de la firma del CEO por una URL pública. |
| X22 | Hacer que el número personal del CEO aparezca en el enlace, el PDF o el código del navegador. |
| X23 | Presentar la respuesta del cliente como contrato o como firma electrónica legal. |
| X24 | Descartar la elección del cliente porque falló una notificación. |
| X25 | Usar casillas múltiples para elegir entre alternativas excluyentes. |
| X26 | Mostrarle al cliente la etiqueta "precio efectivo" o "precio verdadero" en lugar de "Precio especial". |
| X27 | Generar, redibujar, recolorear, recortar o deformar un logo oficial. |
