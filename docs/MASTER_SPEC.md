# MASTER_SPEC — Escritorio Vendedores Lab.IA

> **Estado:** Especificación congelada v1.0 · 2026-09-14
> **Alcance de este documento:** define *qué* se construye y con *qué reglas*. No contiene implementación.
> **Portafolio:** cerrado en **13 productos** (9 soluciones específicas + 4 soluciones integrales).

---

## 0. Reglas no negociables

Estas reglas gobiernan todos los documentos, todas las sesiones de trabajo y todo el código.

| # | Regla | Consecuencia práctica |
|---|---|---|
| R1 | **El portafolio está cerrado en 13 productos.** | No se agrega, renombra ni deriva ningún producto. Ver §4. |
| R2 | **Sentinela queda excluido.** | No aparece en catálogo, taxonomía, mocks, capturas, fixtures ni menús. Cualquier producto adicional hallado en la web queda igualmente excluido. |
| R3 | **El copy aprobado no se modifica.** | `content/copy/*.md` es de sólo lectura. Nada de reescribir, resumir, "mejorar", traducir ni corregir ortografía. Ver §4.3 y `content/copy/COPY_LOCK.md`. |
| R4 | **No se inventan precios.** | Sólo se usan los importes documentados en el copy aprobado, transcriptos literalmente. Lo no documentado se marca `NO_DOCUMENTADO`, nunca se estima. Ver `docs/COMMERCIAL_RULES.md`. |
| R5 | **No se inventan logos ni imágenes.** | Ningún asset generado, ningún placeholder que simule una marca real. Ver `docs/ASSET_SOURCES.md`. |
| R6 | **No se construyen funciones finales en esta etapa.** | Esta entrega es especificación + esqueleto + contratos de tipos. La implementación arranca después, con los límites de `docs/PARALLEL_SESSIONS.md`. |
| R7 | **Todo importe lleva moneda explícita.** | El portafolio opera en **PYG** y **USD** simultáneamente (Precio Vivo está documentado en USD). No existe importe sin moneda. |
| R8 | **Todo dato sensible de cliente queda auditado.** | Cada apertura de cotización, presentación, PDF o enlace público genera registro. Ver §11 y §12. |

---

## 1. Producto: qué es el Escritorio Vendedores

El **Escritorio Vendedores Lab.IA** es la herramienta de trabajo diaria del vendedor de Lab.IA. Reemplaza la dispersión actual — mensajes sueltos, planillas, PDFs en el celular, precios de memoria — por un único lugar donde el vendedor:

1. ve su día y sus pendientes;
2. gestiona su cartera de empresas, profesionales y rubros;
3. consulta el portafolio de 13 productos con el copy aprobado y los precios documentados;
4. arma presentaciones y cotizaciones, las manda a aprobación y las comparte por PDF o enlace;
5. deja seguimiento por voz o por texto de cada conversación;
6. ve cuánto dinero generó, cuánto se le liquida y en qué estado están sus comisiones.

El **Administrador** ve todo lo anterior de todos los vendedores, y además controla catálogo, límites de descuento, cola de aprobaciones, reglas de comisión, liquidaciones, registro de accesos y el backlog de sugerencias de nuevos productos.

### 1.1 Qué NO es

- No es un CRM genérico: el modelo de datos está atado al portafolio cerrado de 13 productos y a la taxonomía de rubros derivada del copy aprobado.
- No es un configurador de precios: el vendedor **no fija precios**, los toma del catálogo y pide aprobación cuando se sale de los límites.
- No es una landing ni material público: es una herramienta interna (`robots: noindex, nofollow`), salvo las vistas públicas de enlace compartido (§10.4).

### 1.2 Perfiles

| Perfil | Rol | Alcance |
|---|---|---|
| `vendedor` | Vendedor de Lab.IA | Sólo su cartera, sus propuestas, su dinero. |
| `supervisor` | Jefe de equipo | Cartera de los vendedores a su cargo. Aprueba dentro de su límite. |
| `administrador` | Administración comercial | Todo. Catálogo, reglas, aprobaciones, liquidaciones, auditoría. |
| `auditor` | Lectura de cumplimiento | Sólo lectura sobre registro de accesos y liquidaciones. Sin edición. |

> La matriz de permisos completa está en §12.3.

---

## 2. Las seis vistas del vendedor

El Escritorio del vendedor tiene **exactamente seis vistas**, navegables por barra lateral en escritorio y barra inferior en celular (patrón heredado de `docs/referencia/escritorio-referencia.html`).

| # | Ruta | Vista | Responde a |
|---|---|---|---|
| 01 | `#/dia` | **Mi Día** | "¿Qué tengo que hacer hoy?" |
| 02 | `#/cartera` | **Mi Cartera** | "¿A quién le vendo y cómo voy con cada uno?" |
| 03 | `#/portafolio` | **Mi Portafolio** | "¿Qué vendo, a quién le sirve y cuánto cuesta?" |
| 04 | `#/propuestas` | **Mis Propuestas** | "¿Qué le mandé, en qué estado está y quién lo abrió?" |
| 05 | `#/seguimiento` | **Mi Seguimiento** | "¿Qué se habló y qué quedó pendiente?" |
| 06 | `#/dinero` | **Mi Dinero** | "¿Cuánto generé, cuánto cobro y cuándo?" |

Cada vista debe implementar los cuatro estados obligatorios: **cargando**, **vacío**, **error con reintento**, **con datos** (`docs/QA_CHECKLIST.md` §2).

---

### 2.1 Vista 01 — Mi Día

**Propósito.** Pantalla de aterrizaje. Concentra lo que vence, lo que se pactó y lo que se está por perder.

**Bloques (orden fijo):**

1. **Encabezado** — índice `01`, saludo según hora, fecha larga `es-PY`.
2. **Indicadores del día** (4 celdas): compromisos de hoy · pendientes vencidos · cotizaciones esperando aprobación · cotizaciones esperando respuesta del cliente.
3. **Agenda del día** — compromisos con hora, cuenta asociada y canal.
4. **Pendientes sin resolver** — ordenados por vencimiento; los vencidos en color de peligro; acción de resolver en un toque.
5. **Requiere atención** — señales calculadas, nunca inventadas. Reglas de disparo:
   - cuenta sin contacto hace más de N días (N configurable por administrador);
   - cotización enviada sin apertura registrada;
   - cotización aprobada y no enviada;
   - vencimiento de precio o de validez de cotización;
   - mensualidad con cobro atrasado en una cuenta propia.
6. **Gráficos** (4): propuestas por estado · cotizaciones por etapa · seguimientos registrados por semana · mezcla de productos cotizados.
7. **Conversación** — compositor fijo al pie. Pregunta en lenguaje natural sobre la propia cartera. **Sólo lectura**: no ejecuta acciones, no modifica datos, siempre cita la fuente (cuenta, cotización, seguimiento) de donde salió el dato.

**Prohibido en esta vista:** crear cotizaciones, cambiar precios, aprobar nada. Mi Día enlaza; no ejecuta.

---

### 2.2 Vista 02 — Mi Cartera

**Propósito.** Gestión y **planificación por empresa, profesional y rubro**.

Tres pestañas, un mismo modelo debajo (§3):

- **Empresas** — cuentas de tipo `empresa`.
- **Profesionales** — cuentas de tipo `profesional` (consultorio, estudio, taller, salón: el titular es el decisor).
- **Rubros** — agregación por rubro de la taxonomía derivada del copy (§5).

**Lista de cuentas.** Columnas: nombre · tipo · rubro · etapa · última interacción · próximo paso · valor mensual potencial (sumatoria de mensualidades documentadas de los productos en la propuesta vigente, nunca estimado).

**Ficha de cuenta.** Secciones:
1. Datos de identificación y contactos.
2. **Rubro asignado** → dispara la recomendación de productos (§5.3).
3. Productos vigentes (contratados) y productos propuestos.
4. Línea de tiempo unificada: seguimientos, propuestas, cotizaciones, accesos a enlaces.
5. Plan de acción de la cuenta.

**Planificación.** Un `PlanDeAccion` se define sobre **uno de los tres ejes** y nunca sobre dos a la vez:

| Eje | Objeto del plan | Ejemplo de uso |
|---|---|---|
| `empresa` | Una cuenta empresa concreta | "Cerrar Radar Stock + Merma IA en esta cadena antes del cierre de trimestre." |
| `profesional` | Una cuenta profesional concreta | "Instalar Agendar.IA en el consultorio y sumar Pulso Digital a los 60 días." |
| `rubro` | Un rubro completo de la taxonomía | "Barrer Farmacias con Merma IA como puerta de entrada." |

Campos de un plan: eje · objetivo · productos objetivo (del catálogo cerrado) · período · meta en dinero (con moneda) · hitos · estado. Los planes de rubro generan **cuentas objetivo sugeridas** dentro de ese rubro; no crean cuentas automáticamente.

**Cobertura obligatoria del requerimiento:** esta vista es la única dueña de `planificación por empresa, profesional y rubro`.

---

### 2.3 Vista 03 — Mi Portafolio

**Propósito.** El catálogo cerrado de **13 productos**, con el copy aprobado servido tal cual, y la puerta de entrada a **sugerencias de nuevos productos**.

**Estructura:**

1. **Filtro por familia** — `Específicas (9)` / `Integrales (4)` / `Todas (13)`.
2. **Filtro por rubro** — taxonomía de §5. Al elegir un rubro se listan los productos cuyo bloque *"Dónde tiene más sentido"* incluye ese rubro. Sin inferencias propias.
3. **Ficha de producto.** Renderiza las secciones del copy aprobado **en el orden del documento fuente y sin reescribir una palabra**: Slogan · Definición · ¿Qué hace? · Ejemplo · Beneficios · 5 casos de uso · Dónde tiene más sentido · Precio de referencia · En una frase. Las secciones que un producto no tiene (p. ej. *¿Qué datos necesita?* sólo existe en Merma IA) simplemente no se muestran.
4. **Bloque de precio.** Transcripción literal del copy + etiqueta de estado del precio (§8.2). Los dos productos sin precio oficial muestran el texto documentado **"Precio oficial no encontrado."** y el camino a cotización personalizada.
5. **Acciones desde la ficha:** agregar a presentación · agregar a cotización · copiar el "En una frase" · abrir el material de apoyo disponible (§ASSET_SOURCES).
6. **Sugerir un producto nuevo** — formulario al pie del portafolio (§13).

**Prohibido:** editar copy, editar precios, marcar un producto como "próximamente", mostrar productos fuera de los 13.

---

### 2.4 Vista 04 — Mis Propuestas

**Propósito.** Unifica **presentaciones**, **cotizaciones**, **aprobación de cotizaciones**, **PDF y enlaces**, y el **registro de accesos a enlaces**.

Tres pestañas —presentaciones, cotizaciones y aprobación— más una capa transversal de PDF y enlaces:

#### a) Presentaciones
Armado de una presentación a partir de productos del catálogo. La presentación es **material de venta**, no tiene efecto comercial y no requiere aprobación.
- Selección de productos → se arman secciones con el copy aprobado.
- Selección de casos de uso por rubro de la cuenta.
- Portada con datos de la cuenta y del vendedor.
- Salidas: PDF y enlace compartible (§10).
- **Sin precios por defecto.** Incluir precios en una presentación la convierte en propuesta económica y la somete a la misma aprobación que una cotización.

#### b) Cotizaciones
Documento comercial con efecto vinculante hacia el cliente.
- Ítems: producto del catálogo + modalidad (implementación / mensualidad / única vez / prueba) + cantidad + moneda + precio de lista documentado + descuento solicitado.
- Cálculo, impuestos, vigencia y validez: definidos en `docs/COMMERCIAL_RULES.md`.
- Estados: `borrador → enviada_a_aprobacion → aprobada | rechazada | cambios_solicitados → enviada_al_cliente → aceptada | perdida | vencida`.
- Una cotización **no se puede enviar al cliente sin aprobación** cuando cae fuera del límite autónomo del vendedor (§8.4).

#### c) Aprobación de cotizaciones
- El vendedor ve el estado, el aprobador asignado, el tiempo en cola y los comentarios recibidos.
- `cambios_solicitados` devuelve la cotización a `borrador` conservando historial completo de versiones.
- Cada transición de estado queda registrada con actor, fecha y motivo. Inmutable.
- La vista del aprobador vive en la app de Administración (§6.4), no acá.

#### d) PDF y enlaces (transversal a a y b)
- **PDF**: generado en servidor, determinístico, con folio, versión, fecha de emisión y validez. El PDF es una **fotografía inmutable** de la versión: si cambia la cotización, cambia la versión y se emite otro PDF.
- **Enlace**: URL pública con token opaco, sin datos personales en la URL. Configurable: vencimiento, límite de aperturas, revocación inmediata.
- **Registro de accesos al enlace**: cada apertura registra fecha/hora, dispositivo, país aproximado y tiempo de lectura si está disponible. Se muestra en la ficha de la propuesta y alimenta la señal "cotización enviada sin apertura registrada" de Mi Día.

---

### 2.5 Vista 05 — Mi Seguimiento

**Propósito.** **Seguimiento por voz y por texto** de todo lo que pasa con una cuenta.

**Captura.** Dos caminos equivalentes:
- **Texto** — el vendedor escribe qué pasó.
- **Voz** — el vendedor dicta. Se guarda el audio, la transcripción y la marca de tiempo. Si el dispositivo no soporta dictado, la vista lo informa y ofrece el camino de texto (degradación explícita, nunca un botón muerto).

**Procesamiento.** De una captura de voz o texto se derivan, **siempre con confirmación humana antes de guardar**:
- una nota estructurada;
- pasos a seguir (tareas con vencimiento);
- actualización sugerida de la etapa de la cuenta;
- productos del catálogo mencionados (sólo de los 13);
- un borrador de mensaje de respuesta.

**Regla dura:** nada derivado de voz o texto se persiste sin que el vendedor lo confirme en el diálogo de confirmación. El sistema propone; la persona guarda.

**Bandeja.** Listado filtrable por cuenta, por tipo (`voz` / `texto`), por período y por "tiene pasos abiertos".

**Retención.** El audio original tiene política de retención configurable y borrado verificable. La transcripción sobrevive al audio.

---

### 2.6 Vista 06 — Mi Dinero

**Propósito.** **Dinero, mensualidades y comisiones** desde la perspectiva del vendedor.

**Bloques:**

1. **Resumen del período** — vendido en implementaciones · mensualidades activas incorporadas · comisión devengada · comisión liquidada · comisión pendiente. Separado por moneda: **una fila por moneda, sin conversión automática** (§8.6).
2. **Mensualidades** — cartera recurrente atribuida al vendedor: cuenta, producto, importe documentado, moneda, fecha de alta, estado de cobro, meses acumulados. Es la base del cálculo de comisión recurrente.
3. **Comisiones** — detalle por operación: origen (implementación / mensualidad / única vez), base de cálculo, regla aplicada con su versión, importe, estado (`devengada → aprobada → liquidada | ajustada | anulada`).
4. **Liquidaciones** — períodos cerrados, con su comprobante en PDF y su detalle línea por línea.
5. **Discrepancias** — el vendedor puede abrir una observación sobre una línea de comisión. Va a la cola del administrador. No modifica nada por sí sola.

**Regla dura:** el vendedor **nunca edita** una comisión, una regla ni una liquidación. Sólo observa y reclama. Todo cálculo sale de reglas versionadas del administrador (`docs/COMMERCIAL_RULES.md`).

---

## 3. Planificación por empresa, profesional y rubro

Modelo conceptual (el modelo de datos formal está en `docs/DATA_MODEL.md`).

```
Rubro  ──1:N──  Cuenta ──┬── tipo = "empresa"
                          └── tipo = "profesional"

PlanDeAccion ── eje ∈ { empresa | profesional | rubro }
             ── objetivoId → Cuenta.id  (empresa/profesional)  |  Rubro.id (rubro)
```

**Por qué tres ejes y no dos.** El portafolio está escrito para dos compradores distintos: comercios con estructura (empresa: farmacia, distribuidora, supermercado) y titulares de práctica profesional (profesional: consultorio, estudio jurídico, taller, salón). El discurso, el ticket, el ciclo y el decisor cambian. El rubro es el tercer eje porque **el propio copy aprobado organiza la recomendación por rubro** en su bloque *"Dónde tiene más sentido"*; planificar por rubro es planificar con el mismo criterio con el que está escrito el material.

**Reglas de planificación:**

| Regla | Detalle |
|---|---|
| P1 | Un plan tiene un solo eje. Para cruzar ejes se crean dos planes vinculados por `campañaId`. |
| P2 | Una cuenta pertenece a **un** rubro principal y puede tener rubros secundarios. La recomendación usa el principal. |
| P3 | La meta en dinero de un plan lleva moneda y sólo puede componerse de precios documentados (§8). |
| P4 | Un plan de rubro no crea cuentas. Genera una lista de objetivos sugeridos que el vendedor acepta una por una. |
| P5 | Cerrar un plan exige motivo de cierre: `cumplido`, `parcial`, `descartado`, `reemplazado`. |

---

## 4. Los 13 productos

### 4.1 Portafolio cerrado

**9 Soluciones Específicas**

| # | Producto | `productoId` | Familia |
|---|---|---|---|
| 1 | Ojo Digital | `ojo-digital` | específica |
| 2 | Pulso Digital | `pulso-digital` | específica |
| 3 | Vendedor 24/7 | `vendedor-24-7` | específica |
| 4 | Radar Stock | `radar-stock` | específica |
| 5 | Faro Digital | `faro-digital` | específica |
| 6 | Merma IA | `merma-ia` | específica |
| 7 | Cotiza Fácil | `cotiza-facil` | específica |
| 8 | Precio Vivo | `precio-vivo` | específica |
| 9 | Ruta IA | `ruta-ia` | específica |

**4 Soluciones Integrales**

| # | Producto | `productoId` | Familia |
|---|---|---|---|
| 10 | Park.IA | `park-ia` | integral |
| 11 | Smart Commerce | `smart-commerce` | integral |
| 12 | Agendar.IA | `agendar-ia` | integral |
| 13 | Exeq.IA | `exeq-ia` | integral |

**Total: 13. Cerrado.**

### 4.2 Exclusiones explícitas

- **Sentinela — EXCLUIDO.** No se incorpora en ninguna capa del sistema.
- Cualquier otro producto, marca o variante hallado en la web, en landings antiguas o en material de terceros: **EXCLUIDO**.
- **FARO Inteligente** no es un producto adicional: el copy aprobado documenta que material web anterior usa ese nombre para lo que en este portafolio se llama **Faro Digital**. Se registra como alias histórico de `faro-digital`, nunca como producto separado.

### 4.3 Origen del copy y regla de no-duplicación

| Familia | Archivo fuente (sólo lectura) |
|---|---|
| 9 específicas | `content/copy/LabIA_9_Soluciones_Especificas_Copy_Maestro.md` |
| 4 integrales | `content/copy/LabIA_4_Soluciones_Integrales_Copy_Maestro.md` |

**Regla de no-duplicación de copy.** El texto aprobado vive **en un solo lugar**: los dos archivos de arriba. El código TypeScript sólo contiene **identidad** (id, nombre, familia). Slogans, definiciones, beneficios, casos de uso y precios **no se hardcodean en código**: se leen del contenido. Duplicarlos garantiza que un día diverjan, y una divergencia en precio o en slogan es un error comercial, no un bug estético.

### 4.4 Eslóganes — estado documentado

Transcripción del control interno del copy aprobado. **No se completa ni se inventa lo faltante.**

| Producto | Frase | Estado documentado |
|---|---|---|
| Ojo Digital | Tus cámaras ya miran. Ahora también entienden. | Claim confirmado |
| Pulso Digital | Tu negocio, en tu WhatsApp. | Titular vigente de landing; sin slogan maestro separado |
| Vendedor 24/7 | El vendedor que nunca duerme. | Frase comercial recomendada y documentada |
| Radar Stock | Comprá con datos. No con el ojo. | Titular vigente de landing |
| Faro Digital | Tu ventaja competitiva en el mercado. | Frase vigente en material SEO/landing |
| Merma IA | Lo que se pierde, ahora se ve. | Slogan definitivo |
| Cotiza Fácil | La mejor opción, cotizada en segundos. | Slogan estratégico definitivo |
| Precio Vivo | — | **Sin eslogan oficial definido.** Se usa la propuesta de valor documentada |
| Ruta IA | El mismo reparto, la mitad del recorrido. | Slogan documentado para el nombre recomendado |
| Park.IA | Cada vehículo registrado. Cada guaraní controlado. | Copy maestro aprobado |
| Smart Commerce | Vende on line. Decide con datos | Copy maestro aprobado |
| Agendar.IA | Optimiza tu recurso mas valioso... tu tiempo | Copy maestro aprobado |
| Exeq.IA | Capa modular para ordenar operaciones exequiales | Copy maestro aprobado |

> Los eslóganes de Smart Commerce y Agendar.IA se transcriben **exactamente como están en el copy aprobado**, incluida su puntuación y acentuación. La interfaz no los corrige.

---

## 5. Taxonomía de rubros

### 5.1 Principio

La taxonomía **se deriva estrictamente** del bloque *"Dónde tiene más sentido"* de los 13 productos. No se agrega ningún rubro que no aparezca en el copy aprobado.

### 5.2 Dos clases de término

El copy mezcla sectores con condiciones de negocio. Se separan:

- **`rubro`** — sector de actividad. Ej.: Farmacias, Ferreterías, Distribuidoras.
- **`calificador`** — condición que atraviesa rubros. Ej.: *Comercios con varias sucursales*, *Empresas con venta consultiva*, *Negocios con cientos o miles de productos*, *Negocios con varios repartidores*, *Estacionamientos independientes de 10 a 50 lugares*.

Una cuenta tiene **un rubro principal** y **cero o más calificadores**. La recomendación de productos cruza ambos.

### 5.3 Regla de recomendación

```
productosRecomendados(cuenta) =
    productos cuyo "Dónde tiene más sentido" contiene cuenta.rubroPrincipal
  ∪ productos cuyo "Dónde tiene más sentido" contiene alguno de cuenta.calificadores
```

Sin scoring, sin pesos, sin inferencia semántica. Es un mapeo literal y auditable contra el copy. Si el vendedor quiere proponer un producto fuera de la recomendación, puede: la recomendación orienta, no bloquea.

### 5.4 Archivo de taxonomía

`content/taxonomia/rubros.md` — tabla completa rubro/calificador → productos, derivada término por término del copy. **Dueño: Sesión 4.** Ningún otro archivo puede declarar rubros.

---

## 6. Vista completa del administrador

App separada (`apps/admin`), mismo sistema de diseño, mismo modelo de datos, permisos propios.

### 6.1 Panel general
Indicadores de la operación: cotizaciones en cola y tiempo promedio de aprobación · vendido del período por moneda · mensualidades activas y bajas del período · comisiones devengadas vs. liquidadas · cuentas sin actividad · sugerencias de producto sin responder.

### 6.2 Vendedores y equipos
Alta, baja y edición de usuarios · asignación a supervisor · **límite autónomo de descuento por vendedor** · asignación de rubros y territorios · reasignación de cartera con traza (quién reasignó, cuándo, por qué, qué pasa con las comisiones en curso).

### 6.3 Catálogo
Publicación y despublicación de **productos existentes** (los 13; nunca alta de un producto nuevo desde acá) · carga de las **listas de precios** transcriptas del copy · vigencias · modalidades habilitadas por producto · materiales de apoyo asociados · versión de catálogo. Todo cambio de catálogo genera una nueva versión y queda en auditoría.

### 6.4 Cola de aprobación de cotizaciones
Bandeja priorizada por antigüedad y monto. Por cada cotización: comparación contra lista de precios, descuento solicitado, margen resultante si está definido, historial del cliente y versiones anteriores. Acciones: `aprobar`, `rechazar`, `solicitar cambios` — las tres exigen comentario. Delegación y suplencia con vigencia. SLA configurable con alerta por vencimiento.

### 6.5 Dinero
**Reglas de comisión** versionadas (nunca se edita una regla vigente: se publica una versión nueva con fecha de vigencia) · **mensualidades** de toda la cartera con su estado de cobro · **cierre de período** y generación de liquidaciones · **ajustes manuales** con motivo obligatorio y doble registro · resolución de discrepancias abiertas por vendedores.

### 6.6 Presentaciones y plantillas
Biblioteca de plantillas aprobadas · bloques reutilizables construidos sobre el copy aprobado · control de qué plantillas puede usar cada vendedor.

### 6.7 Registro de accesos
Dos registros distintos, ambos consultables acá (§12).

### 6.8 Sugerencias de nuevos productos
Backlog completo con su flujo de resolución (§13).

### 6.9 Parámetros del sistema
Umbrales de "cuenta sin contacto", vigencia por defecto de cotizaciones y enlaces, SLA de aprobación, política de retención de audios, monedas habilitadas, feriados y calendario comercial.

---

## 7. Dinero, mensualidades y comisiones

Resumen ejecutivo. La normativa completa vive en **`docs/COMMERCIAL_RULES.md`**, que es la fuente única para cálculo.

### 7.1 Formas de ingreso documentadas
| Forma | Descripción | Presente en |
|---|---|---|
| `implementacion` | Cobro inicial de puesta en marcha | Ojo Digital, Faro Digital, Cotiza Fácil, Precio Vivo, Park.IA, Agendar.IA |
| `mensualidad` | Cobro recurrente mensual | 11 de los 13 productos con precio documentado |
| `unica_vez` | Cobro por única vez | Park.IA (Piloto Control) |
| `prueba` | Período de prueba pago | Cotiza Fácil (30 días) |

> La tabla producto→modalidades documentadas está en `docs/COMMERCIAL_RULES.md` §2, transcripta del copy.

### 7.2 Moneda
El portafolio opera en **dos monedas**: **PYG** (Guaraníes, `Gs.`) para 12 productos y **USD** para **Precio Vivo**, según lo documentado. Consecuencias:
- Todo importe es un par `{ monto, moneda }`. No existe importe sin moneda.
- **No hay conversión automática.** Totales y comisiones se reportan **por moneda**. Si el negocio necesitara consolidar, será con un tipo de cambio explícito, con fecha y fuente, definido por administración — hoy **no está definido y no se asume ninguno**.
- Una cotización puede tener ítems en dos monedas: totaliza dos subtotales, no uno.

### 7.3 IVA
El copy documenta `+ IVA` **explícitamente sólo en Cotiza Fácil**. Para el resto, el copy no lo aclara. Por lo tanto cada precio de catálogo lleva `ivaIncluido: true | false | null`, donde **`null` significa "no documentado"** y la interfaz lo muestra como tal. No se asume un régimen por defecto. Resolverlo es una tarea de administración, no del sistema.

### 7.4 Comisiones
- Se calculan por **regla versionada**, nunca por número suelto en código.
- Cada línea de comisión guarda: base, moneda, `reglaId`, `reglaVersion`, factor aplicado, resultado y actor.
- Recalcular un período cerrado está prohibido: se emite un **ajuste**, con motivo y traza.
- **Los porcentajes, topes, esquemas de clawback y calendarios de liquidación NO están definidos en los insumos recibidos.** Quedan como parámetros pendientes, listados en `docs/COMMERCIAL_RULES.md` §6. El sistema se diseña para recibirlos; no los inventa.

### 7.5 Mensualidades
Alta, suspensión, reactivación y baja con motivo. Estado de cobro por mes. La comisión recurrente se devenga contra **cobro confirmado**, no contra emisión — regla a confirmar por administración junto al resto de §7.4.

---

## 8. Reglas de precio en la interfaz

| # | Regla |
|---|---|
| 8.1 | Todo precio mostrado proviene del catálogo, que a su vez transcribe el copy aprobado. |
| 8.2 | Cada precio lleva estado: `documentado_exacto` (importe único), `documentado_rango` (desde/hasta), `documentado_desde` (piso sin techo), `no_documentado` (los casos "Precio oficial no encontrado"). |
| 8.3 | Un precio `no_documentado` **no se puede cotizar con importe** sin aprobación previa: la cotización nace `enviada_a_aprobacion` con el ítem marcado *a cotizar*. |
| 8.4 | El vendedor puede aplicar descuento hasta su **límite autónomo**. Pasarlo dispara aprobación obligatoria. El límite es un parámetro por vendedor, hoy **pendiente de definición comercial**. |
| 8.5 | Sobre un `documentado_rango` el vendedor elige dentro del rango; salir del rango es aprobación obligatoria. |
| 8.6 | Los totales se presentan **agrupados por moneda**. Ningún total mezcla PYG y USD. |
| 8.7 | Cotizar un producto excluido (Sentinela o cualquier otro) es imposible por construcción: el catálogo sólo contiene 13 ids. |

---

## 9. Seguimiento por voz y texto

| # | Regla |
|---|---|
| 9.1 | Voz y texto producen **la misma entidad** `Seguimiento`, con `origen: "voz" \| "texto"`. Lo derivado se procesa igual. |
| 9.2 | El dictado requiere permiso explícito de micrófono y avisa que se está grabando. |
| 9.3 | Si el navegador no soporta dictado, se informa con texto claro y se ofrece el camino de escritura. Nunca un botón inerte. |
| 9.4 | La transcripción es editable antes de procesar. El audio original no se altera. |
| 9.5 | Nada derivado se guarda sin confirmación humana explícita. |
| 9.6 | Los productos detectados en un seguimiento se validan contra los 13 ids; una mención a algo fuera del catálogo se descarta o se ofrece como **sugerencia de producto nuevo** (§13). |
| 9.7 | Audio y transcripción son dato de cliente: acceso auditado y retención configurable. |

---

## 10. Presentaciones, PDF y enlaces

### 10.1 Presentación
Material de venta armado con copy aprobado. Sin precios por defecto. No requiere aprobación salvo que incluya importes.

### 10.2 Cotización
Documento comercial con folio, versión, vigencia y validez. Sujeta al flujo de aprobación (§2.4c).

### 10.3 PDF
- Generación en servidor. Mismo insumo ⇒ mismo PDF (determinístico).
- Metadatos embebidos: folio, versión, fecha de emisión, validez, vendedor, cuenta.
- Inmutable: un PDF emitido nunca se regenera con otro contenido; un cambio produce una versión nueva.
- La descarga del PDF queda registrada (§12.1).

### 10.4 Enlace compartible
- Token opaco, no adivinable, sin datos personales en la URL.
- Parámetros: vencimiento, tope de aperturas, revocación inmediata, requerir código de acceso (opcional).
- La vista pública del enlace es la **única superficie no-interna** del sistema: sin navegación al Escritorio, sin datos de otras cuentas, sin precios de otros clientes.
- Revocar un enlace corta el acceso al instante y deja registro de quién revocó y cuándo.

---

## 11. Aprobación de cotizaciones

**Máquina de estados** (única fuente de verdad; `docs/USER_FLOWS.md` §5 detalla el flujo):

```
borrador
  └─ enviar → enviada_a_aprobacion
                ├─ aprobar           → aprobada → enviar_al_cliente → enviada_al_cliente
                │                                                       ├─ aceptada
                │                                                       ├─ perdida
                │                                                       └─ vencida
                ├─ rechazar          → rechazada  (terminal; se clona para reintentar)
                └─ solicitar_cambios → borrador   (versión + 1, historial intacto)
```

| # | Regla |
|---|---|
| 11.1 | Toda transición exige actor, fecha/hora y motivo; las de rechazo y cambios exigen comentario. |
| 11.2 | El vendedor no puede aprobar su propia cotización, cualquiera sea su rol. |
| 11.3 | Una cotización `aprobada` es inmutable. Editarla crea una versión nueva en `borrador` y **caduca la aprobación anterior**. |
| 11.4 | Vencida la vigencia, pasa a `vencida` automáticamente y el enlace público deja de mostrar importes. |
| 11.5 | El historial de versiones es inmutable y consultable por vendedor, supervisor, administrador y auditor. |
| 11.6 | Sin aprobador disponible, la cola escala al suplente configurado; nunca se autoaprueba por tiempo. |

---

## 12. Registro de accesos

Se distinguen **dos registros**, con propósitos y audiencias distintas. Ambos son **append-only**: no se editan ni se borran desde la aplicación.

### 12.1 Registro de accesos a material compartido (`AccesoEnlace`)
**Qué registra:** cada apertura de un enlace público, cada descarga de PDF, cada visualización de una presentación compartida.
**Campos:** `enlaceId`, `documentoId`, `tipoDocumento`, fecha/hora, tipo de dispositivo, país aproximado, duración de lectura si está disponible, resultado (`ok`, `vencido`, `revocado`, `tope_superado`).
**Quién lo ve:** el vendedor dueño del documento, su supervisor, el administrador y el auditor.
**Para qué sirve:** alimenta la señal *"enviada sin apertura registrada"* de Mi Día y da al vendedor el momento oportuno para llamar.
**Privacidad:** no se identifica a la persona que abre. Sin IP completa, sin fingerprinting, sin correlación entre enlaces. Granularidad geográfica: país.

### 12.2 Registro de auditoría del sistema (`RegistroAuditoria`)
**Qué registra:** ingreso y cierre de sesión, intentos fallidos, cambios de permiso, alta/baja de usuarios, cambios de catálogo y de precios, publicación de reglas de comisión, aprobaciones y rechazos, cierres de período y ajustes, emisión y revocación de enlaces, borrado de audios, exportaciones de datos.
**Campos:** actor, rol vigente, acción, entidad afectada, valor anterior y posterior cuando aplica, fecha/hora, origen de la sesión.
**Quién lo ve:** administrador y auditor. El vendedor ve únicamente **sus propios** eventos.
**Retención:** configurable, con mínimo por definir junto a administración. El borrado requiere doble autorización y se registra a sí mismo.

### 12.3 Matriz de permisos (resumen)

| Capacidad | vendedor | supervisor | administrador | auditor |
|---|:--:|:--:|:--:|:--:|
| Ver su cartera | ✓ | ✓ (su equipo) | ✓ (todas) | — |
| Crear presentaciones y cotizaciones | ✓ | ✓ | ✓ | — |
| Aprobar cotizaciones | — | ✓ (dentro de límite) | ✓ | — |
| Editar catálogo y precios | — | — | ✓ | — |
| Publicar reglas de comisión | — | — | ✓ | — |
| Cerrar período / liquidar | — | — | ✓ | — |
| Ver `AccesoEnlace` | ✓ (propios) | ✓ (equipo) | ✓ | ✓ |
| Ver `RegistroAuditoria` | ✓ (propios) | — | ✓ | ✓ |
| Editar cualquier registro de auditoría | — | — | — | — |
| Resolver sugerencias de producto | — | — | ✓ | — |

---

## 13. Sugerencias de nuevos productos

**Qué es.** Un canal formal para que el vendedor reporte demanda que el portafolio cerrado no cubre. **No abre el portafolio**: los 13 productos siguen siendo 13.

**Origen.** Formulario en Mi Portafolio, o promoción de una mención detectada en un seguimiento (§9.6).

**Campos:** título · problema del cliente en sus palabras · cuenta y rubro donde apareció · frecuencia observada · productos actuales que se quedan cortos y por qué · valor estimado percibido (opcional, con moneda, marcado como *estimación del vendedor* — nunca se trata como precio) · adjuntos.

**Flujo:** `recibida → en_evaluacion → { aceptada_para_estudio | rechazada | duplicada | ya_cubierta_por_producto_existente }`.

| # | Regla |
|---|---|
| 13.1 | Toda sugerencia recibe respuesta del administrador con motivo. El silencio no es una resolución válida. |
| 13.2 | `ya_cubierta_por_producto_existente` obliga a nombrar cuál de los 13 y a dejar el argumento comercial, que se le devuelve al vendedor. |
| 13.3 | Una sugerencia aceptada **no crea un producto**. Sale del alcance del Escritorio y entra al proceso de producto de Lab.IA. |
| 13.4 | Las sugerencias se agregan por rubro y por frecuencia en el panel del administrador: es el insumo de roadmap. |
| 13.5 | Ninguna sugerencia — en ningún estado — aparece en catálogo, portafolio, presentaciones ni cotizaciones. |

---

## 14. Decisiones técnicas

| # | Decisión | Motivo |
|---|---|---|
| T1 | **TypeScript** en todo el repositorio; tipos compartidos en `packages/compartido`. | Los contratos entre 6 sesiones paralelas tienen que ser verificables por compilador, no por acuerdo verbal. |
| T2 | **Monorepo con workspaces npm**: `apps/escritorio`, `apps/admin`, `packages/compartido`, `packages/ui`, `packages/mock`. | Permite fronteras de archivo limpias entre sesiones (`docs/PARALLEL_SESSIONS.md`). |
| T3 | **Vistas como módulos DOM sin framework**, siguiendo el patrón de `docs/referencia/escritorio-referencia.html`. | La referencia aprobada es HTML/CSS/JS plano y accesible. Introducir un framework sería una decisión de arquitectura sin respaldo en los insumos. Revisable, pero no por default. |
| T4 | **Ruteo por hash** (`#/dia`, `#/cartera`, …). | Igual que la referencia. Sirve en hosting estático y no rompe el enlace público. |
| T5 | **Estilos con custom properties**, tokens en `packages/ui/src/tokens.css`. | Un solo lugar para el tema; ninguna sesión escribe colores literales. |
| T6 | **La capa de datos es una interfaz** (`docs/API_CONTRACTS.md`), con dos implementaciones: `mock` y `http`. Las vistas nunca hablan con `fetch` directo. | Permite construir las 6 vistas en paralelo sin backend y cambiar a HTTP sin tocar vistas. |
| T7 | **Sin dependencias de UI de terceros** en esta etapa. | R5: nada de assets, iconos o marcas que no vengan de los insumos. |
| T8 | **`es-PY`** como locale único para fechas, números y moneda. | El negocio y el copy son de Paraguay. |

---

## 15. Trazabilidad del requerimiento

| Requerimiento obligatorio | Dónde queda cubierto |
|---|---|
| Las seis vistas del vendedor | §2 (2.1 a 2.6) |
| La vista completa del administrador | §6 |
| Planificación por empresa, profesional y rubro | §2.2, §3, §5 |
| Los 13 productos | §4, §5 |
| Dinero, mensualidades y comisiones | §2.6, §7, §8, `COMMERCIAL_RULES.md` |
| Seguimiento por voz y texto | §2.5, §9 |
| Presentaciones | §2.4a, §10.1 |
| Aprobación de cotizaciones | §2.4b/c, §11 |
| PDF y enlaces | §2.4d, §10.3, §10.4 |
| Registro de accesos | §12 (dos registros distintos) |
| Sugerencias de nuevos productos | §2.3, §13 |
| Sentinela excluido | §0 R2, §4.2 |
| Copy aprobado sin cambios | §0 R3, §4.3, `content/copy/COPY_LOCK.md` |
| Sin precios/logos/productos/imágenes inventados | §0 R4/R5, §7.3, §8, `ASSET_SOURCES.md` |
| Límites de archivo para 6 sesiones paralelas | `docs/PARALLEL_SESSIONS.md` |

---

## 16. Pendientes de definición comercial

Lo siguiente **no está en los insumos recibidos** y por lo tanto **no se inventa**. El sistema se diseña para recibirlo como parámetro. Lista completa y formato de entrega en `docs/COMMERCIAL_RULES.md` §6.

1. Porcentajes de comisión por producto, familia y modalidad.
2. Base de devengamiento de la comisión recurrente (emisión vs. cobro).
3. Calendario de liquidación y reglas de clawback ante baja temprana.
4. Límite autónomo de descuento por vendedor y por rol.
5. Régimen de IVA para los 12 productos donde el copy no lo explicita.
6. Precio de Smart Commerce y de Exeq.IA (hoy: *"Precio oficial no encontrado."*).
7. Tipo de cambio institucional PYG/USD, si se decidiera consolidar monedas.
8. Vigencia por defecto de cotizaciones y de enlaces públicos.
9. SLA de aprobación y cadena de suplencia.
10. Política de retención de audios de seguimiento y del registro de auditoría.
11. Marca gráfica de Lab.IA para el Escritorio (ver `ASSET_SOURCES.md`).
