# MASTER_SPEC — Escritorio Vendedores Lab.IA

> **Versión 3.0.** Reemplaza a la v2.0 en todo lo que la contradice.
> **Alcance:** define *qué* se construye y con *qué reglas*. No contiene implementación.
> **Portafolio:** cerrado en **13 productos** (9 soluciones específicas + 4 integrales).

---

## 0. Reglas no negociables

| # | Regla | Consecuencia práctica |
|---|---|---|
| R1 | **El portafolio está cerrado en 13 productos.** | No se agrega, renombra ni deriva ningún producto. La amplitud del sistema está en los **rubros y las adaptaciones**, nunca en productos nuevos. Ver §5. |
| R2 | **Todo producto adicional hallado en la web queda excluido.** | No aparece en catálogo, motor, mocks ni menús. |
| R3 | **El copy aprobado no se modifica.** | `content/copy/*.md` es de sólo lectura, verificado por hash. |
| R4 | **No se inventan precios de lista.** | El catálogo transcribe literalmente el copy. Lo que el vendedor propone en una cotización es **precio personalizado**, no un precio de lista inventado. Ver §8. |
| R5 | **No se inventan logos ni imágenes.** | Se usan los archivos oficiales de Lab.IA. Ningún logo se redibuja, recolorea ni deforma. Ver `docs/ASSET_SOURCES.md`. |
| R6 | **Una sola aplicación, un solo login.** | Administración es una **ruta protegida** dentro de la misma app, no otra aplicación. Ver §1. |
| R7 | **Dos roles: `vendedor` y `administrador`.** | No existen supervisor ni auditor. Ver §1.2. |
| R8 | **Toda cotización pasa por aprobación del administrador.** | Sin excepción. Ver §9. |
| R9 | **Todo importe lleva moneda.** | El portafolio opera en **PYG** y **USD** (Precio Vivo está documentado en USD). Sin conversión automática. |
| R10 | **El vendedor no investiga a mano.** | Escribe el dato mínimo; el sistema investiga fuentes públicas y devuelve el perfil armado. El vendedor confirma, corrige o agrega. Ver §3. |
| R11 | **La agenda se puebla sola.** | Se alimenta de planes, seguimientos, propuestas y vencimientos. El vendedor ajusta fechas; no reconstruye. Ver §5. |
| R12 | **Investigación y modelo de lenguaje viven en el servidor.** | Proveedores intercambiables. ⛔ Ninguna clave ni llamada sensible en el navegador. Ver §3.5. |
| R13 | **En esta etapa no se construyen las vistas finales.** | Especificación + esqueleto + contratos. La implementación arranca con `docs/PARALLEL_SESSIONS.md`. |

---

## 1. Un solo sistema, dos roles

### 1.1 Una aplicación

**Una sola aplicación web. Un solo login por usuario y contraseña.**

```
apps/escritorio/                 ← la única aplicación
  #/ingreso           público
  #/inicio            vendedor + administrador
  #/planificar        vendedor + administrador
  #/clientes          vendedor + administrador
  #/agenda            vendedor + administrador
  #/propuestas        vendedor + administrador
  #/dinero            vendedor + administrador
  #/administracion    SÓLO administrador  ← ruta protegida
```

⛔ **No existe una app de administración separada.** El administrador entra por el mismo login, ve exactamente las mismas cinco vistas del vendedor, y además ve `#/administracion`.

### 1.2 Dos roles

| Rol | Qué ve | Qué puede |
|---|---|---|
| `vendedor` | Las 6 vistas operativas | Su cartera, sus propuestas, su dinero. Propone precios. **No aprueba nada.** |
| `administrador` | Las 6 vistas operativas **+** `#/administracion` | Todo lo del vendedor sobre toda la operación, más aprobación de cotizaciones, configuración comercial y control financiero. |

⛔ Eliminados: `supervisor`, `auditor`. No existen en tipos, permisos, interfaz ni datos.

### 1.3 Autenticación

- Usuario y contraseña. Una sesión por usuario.
- La sesión trae el rol; la ruta `#/administracion` se bloquea en el ruteo **y** en la capa de datos. Ocultar el enlace no es proteger.
- Cada ingreso queda registrado (§10).

---

## 2. Las vistas

| # | Ruta | Vista | Quién | Responde a |
|---|---|---|---|---|
| 01 | `#/inicio` | **Inicio** | ambos | ¿Cómo voy y qué hago ahora? |
| 02 | `#/planificar` | **Planificar** | ambos | ¿Qué le vendo a este negocio y por qué? |
| 03 | `#/clientes` | **Clientes** | ambos | ¿Con quién estoy hablando y qué se dijo? |
| 04 | `#/agenda` | **Agenda** | ambos | ¿Qué tengo que hacer, cuándo, y qué se me pasó? |
| 05 | `#/propuestas` | **Propuestas** | ambos | ¿Qué le presenté y qué le cotizo? |
| 06 | `#/dinero` | **Dinero** | ambos | ¿Cuánto vendí, cuánto se cobró y cuánto me toca? |
| 07 | `#/administracion` | **Administración** | **sólo admin** | ¿Cómo va toda la operación y qué tengo que aprobar? |

Cada vista implementa los cuatro estados obligatorios: **cargando**, **vacío**, **error con reintento**, **con datos**.

---

### 2.1 Vista 01 — Inicio · *la planificación es el comienzo*

Esta es la pantalla de arranque. **No es un tablero de analítica: es un punto de partida.** Muestra plata y acción, nada más.

**Bloque A — Dinero (cuatro cifras, sin adorno):**

| Cifra | Qué es |
|---|---|
| **Dinero vendido** | Lo cerrado en el período, con moneda. |
| **Dinero cobrado** | De lo vendido, lo que efectivamente entró. |
| **Comisión acumulada** | Lo que le corresponde al vendedor por lo cobrado. |
| **Comisión pendiente** | Lo devengado y todavía no pagado. |

Definiciones exactas y reglas de cálculo: `docs/COMMERCIAL_RULES.md`.

**Bloque B — Próximos seguimientos.** **Lista corta**, de tres a cinco entradas: con quién, cuándo, qué quedó pendiente. Un toque lleva al cliente.
Al pie, el **acceso a Agenda** con dos contadores: pendientes de hoy y atrasados.
⛔ Inicio **no** es la agenda. El detalle, el calendario y el cronograma viven en §5.

**Bloque C — Dos acciones protagonistas.** Son el elemento visual dominante de la pantalla: dos tarjetas grandes, no dos botones en una barra.

> ### 🔍 Investigar una empresa o un profesional que conozco
> *"Mi amigo tiene una repuestera", "mi primo tiene un restaurante", "mi odontóloga", "el hotel de la esquina".*
> → Abre el motor de planificación con entrada por **conocido**.

> ### 🧭 Explorar oportunidades por rubro
> *"Quiero ver qué le puedo vender a las farmacias", "peluquerías", "moteles".*
> → Abre el motor de planificación con entrada por **rubro**.

**Por qué el vendedor arranca por conocidos.** La cartera real de un vendedor nuevo no empieza en una base de datos: empieza en su agenda personal. El amigo con la repuestera, el pariente con el restaurante, el médico, el abogado, el odontólogo, la peluquería, el hotel, el motel. El sistema tiene que **recibir ese nombre y devolver un plan**, no pedirle primero que cargue un CRM.

⛔ **Prohibido en Inicio:** gráficos decorativos, embudos de conversión, mezcla de productos, tasas de cierre. Cuatro cifras, una lista y dos acciones.

---

### 2.2 Vista 02 — Planificar · *el motor comercial*

El corazón del sistema. Dos entradas, un mismo motor, una misma salida.

#### Entrada A — Empresa

El vendedor escribe **lo mínimo que tiene**. Basta con uno de estos tres:

| Campo | Ejemplo |
|---|---|
| **RUC** | `80012345-6` |
| **Razón social** | *Comercial San Miguel S.A.* |
| **Nombre comercial** | *Repuestera del Este* |

Opcional: ciudad.

#### Entrada B — Profesional

| Campo | Obligatorio | Ejemplo |
|---|---|---|
| **Nombre** | sí | *Dra. Marta Ayala* |
| **Profesión o especialidad** | sí | *Pediatría* |
| **Matrícula** | **sólo si la tiene a mano** | — |
| **Ciudad** | **sólo si la tiene a mano** | *Asunción* |

⛔ **La matrícula y la ciudad no se le piden al vendedor.** Si las sabe, ayudan. Si no, el sistema sigue.

#### Entrada C — Rubro

Un campo de texto libre. **Acepta cualquier rubro escrito.** "Motel", "veterinaria", "gomería", "vivero", "kiosco de barrio", "estudio de arquitectura". Si el término no existe en la taxonomía, **se crea** y queda marcado para revisión del administrador. ⛔ El motor **nunca** responde "rubro no encontrado".

> Se conserva tal cual estaba: es la puerta de entrada cuando el vendedor todavía no tiene un nombre, sólo un mercado.

#### Lo que hace el sistema: investigar

⛔ **El vendedor no investiga ni completa manualmente el perfil del negocio.** Eso lo hace el sistema. Ver §3.

#### Salida — el plan (siempre la misma estructura)

1. **Cómo funciona ese negocio.** Perfil operativo inferido: si vende productos o servicios, si tiene stock, si trabaja con turnos, si atiende por WhatsApp, si reparte, si tiene local con circulación de gente, si tiene varios profesionales, si maneja mucha o poca variedad, si compra a proveedores, si sus precios se mueven, si tiene competencia visible, si administra espacios.
2. **Dolores probables.** Qué suele doler en un negocio así. Cada dolor se muestra **como hipótesis**, con su motivo.
3. **Los 13 productos ordenados.** Ranking completo del 1.º al 13.º, con el **top 10** como lista de trabajo. Cada posición lleva su "por qué".
4. **Producto 1, 2 y 3.** Destacados: con cuál entrar, cuál sigue y cuál es el tercero.
5. **Combos sugeridos.** Qué dos o tres productos se potencian en ese negocio y qué argumento los une.
6. **Encaje por producto**, en cuatro niveles:

   | Encaje | Significa |
   |---|---|
   | `directo` | El producto resuelve el dolor sin ninguna adaptación. |
   | `cercano` | Resuelve el dolor con un ajuste menor de configuración o discurso. |
   | `adaptable` | Sirve, pero requiere una adaptación real, que se explica. |
   | `no_recomendado` | No corresponde a este negocio. Se dice por qué. |

   ⛔ **Qué se ofrece, y en qué orden.** Decisión del CEO, 18/09/2026:

   > Se ofrece **sólo lo directamente útil o lo que necesita un ajuste chico**.
   > De fácil a difícil.

   | Encaje | ¿Se ofrece? |
   |---|---|
   | `directo` | **Sí**, primero |
   | `cercano` | **Sí**, después |
   | `adaptable` | ⛔ **No.** Queda fuera de la propuesta |
   | `no_recomendado` | ⛔ Nunca |

   El motor **evalúa los trece** por dentro y los ordena, pero el plan que ve el
   vendedor sale sólo con `directo` y `cercano`, en ese orden. Nadie abre una
   relación comercial vendiendo lo difícil.

   Caso resuelto de referencia: a un **motel** no se le ofrece Merma IA, porque
   quedó clasificado como `adaptable` (CEO, 18/09/2026).

7. **Adaptación necesaria.** En `cercano`, texto concreto: qué hay que ajustar y qué hay que confirmar antes de prometerlo.
8. **Estrategia de entrada.** Por dónde empezar la conversación, con qué producto, con qué gancho.
9. **Argumentos.** Apoyados en el copy aprobado del producto, citando de dónde salen.
10. **Preguntas de confirmación.** Qué preguntarle al cliente para validar o descartar cada dolor inferido.

**Acciones desde el plan:** guardar como cliente (→ vista 03) · armar presentación (→ vista 04) · registrar seguimiento (→ vista 03) · sugerir un producto nuevo, cuando ninguno de los 13 encaja.

#### Reglas del motor

| # | Regla |
|---|---|
| M1 | **Acepta cualquier rubro escrito.** Nunca rechaza una entrada. |
| M2 | **Infiere, y lo dice.** Cada dolor y cada posición del ranking muestran el supuesto en que se apoyan. El motor nunca presenta una inferencia como un hecho verificado. |
| M3 | ⛔ **Nunca propone un producto fuera de los 13.** Cuando ninguno encaja, ofrece registrar una sugerencia (§11). |
| M4 | ⛔ **Nunca inventa un precio.** Muestra el precio de lista documentado o dice que se cotiza. |
| M5 | **El ranking es explicable.** Si el vendedor pregunta "¿por qué éste primero?", hay respuesta. |
| M6 | **La taxonomía crece.** Términos nuevos entran como pendientes de revisión; el motor sigue funcionando mientras tanto. |
| M7 | **Trazable.** Un plan guardado conserva qué taxonomía y qué versión de catálogo usó. |

#### Referencia del portafolio
Dentro de Planificar vive la consulta de los 13 productos: ficha con el copy aprobado servido tal cual, en el orden del documento fuente, con su precio documentado. ⛔ No se edita copy ni precio desde ninguna vista del vendedor.

---

### 2.3 La ficha de producto — el eslabón que faltaba

> Decisión del CEO, 18/09/2026. **La ficha no es una página informativa: es la
> pieza central de la experiencia comercial.**

La cadena completa, sin saltos:

```
Planificar → Cliente → Producto recomendado → FICHA → Presentación
→ Cotización → Seguimiento
```

El motor identifica los dolores y ordena los productos. El vendedor **abre la
ficha que corresponde**, en vez de buscarla a mano.

#### La regla que sostiene todo

⛔ **La ficha oficial queda intacta como fuente maestra. La personalización es
una capa encima. Nunca modifica el copy aprobado.**

No se defiende con una validación: se defiende porque `PersonalizacionBloque`
**no tiene ningún campo de texto** y no existe método para escribir el
contenido de un bloque. Ver `packages/compartido/src/fichas.ts`.

#### Los bloques

Son exactamente las secciones del copy maestro, ni una más:

`slogan` · `definicion` · `datosQueNecesita` · `queHace` · `ejemplo` ·
`beneficios` · `casosDeUso` · `dondeTieneMasSentido` · `precioDeReferencia`

⛔ `datosQueNecesita` existe **sólo en Merma IA** (`COPY_LOCK.md`). No se
agrega a las demás para emparejar.

#### Cara A · Para el vendedor

Parte de la ficha oficial y prepara una versión para **ese** prospecto:

- **mostrar, ocultar, mover y destacar** bloques;
- agregar **"Lo que conversamos"** — lo que escuchó en la reunión, con sus palabras;
- agregar una **nota del vendedor** en el cierre;
- compartirla como **enlace responsive** por WhatsApp o correo.

Durante la reunión la ficha sirve de **apoyo visual de venta consultiva**.

⛔ Los dos textos propios van **visualmente separados** del copy oficial: el
cliente tiene que distinguir qué dice Lab.IA y qué dice su vendedor.

#### Cara B · Para el cliente

Recibe una presentación limpia y fácil de recorrer: qué es, qué problema
resuelve, qué hace, beneficios, casos de uso, posicionamiento y —cuando
corresponda— precio de referencia o planes.

Un solo llamado a la acción: **"Hablemos"**.

| # | Regla |
|---|---|
| FC1 | ⛔ **No entra al Escritorio interno.** |
| FC2 | ⛔ **No ve información operativa del vendedor:** ni comisiones, ni el plan interno, ni el ranking de productos, ni por qué se eligió éste. |
| FC3 | ⛔ Nunca se revela cuántas veces se abrió el enlace. |
| FC4 | El enlace lleva **token opaco**, igual que presentaciones y cotizaciones. |
| FC5 | ⛔ El enlace sirve **el copy vigente**, nunca una copia vieja. Si cambió desde que el vendedor la armó, se le avisa **a él**, antes de compartir. |

#### Cara C · Para la propuesta

⛔ **La ficha no reemplaza la cotización.**

Primero ayuda a que el cliente **entienda y elija** la solución. Después, desde
Propuestas, el vendedor arma la presentación. Y la cotización formal viene
**después, y con aprobación del CEO** (§11). El orden no se saltea.

#### Cara D · Como portafolio público

El índice **Soluciones Lab.IA**, dividido en **nueve específicas** y **cuatro
integrales**, donde cada logo lleva a su ficha oficial.

Y una segunda puerta de entrada: ⛔ **por dolor, no por nombre de producto.**
El cliente muchas veces no sabe qué producto quiere; sabe qué le duele. Esa
navegación usa la misma taxonomía del motor, y muestra **sólo `directo` y
`cercano`**, en ese orden (§2.2).

#### Los archivos

Las trece fichas oficiales y el índice viven en
`apps/escritorio/public/fichas/`, con la huella de cada una en `fichas.sha256`.
Origen y detalle: el `LEEME.md` de esa carpeta.

---

### 2.3b Vista 03 — Clientes

Cartera, historial y seguimiento.

- **Lista de clientes**: nombre · tipo (`empresa` / `profesional`) · rubro · etapa · última interacción · próximo paso.
- **Ficha**: datos, contactos, rubro, plan de planificación asociado, productos propuestos y contratados, y **línea de tiempo unificada** (seguimientos, presentaciones, cotizaciones, aperturas de enlaces).
- **Seguimiento por voz y por texto**: misma entidad, mismo procesamiento.
  - Voz: pide permiso de micrófono, **avisa que está grabando**, guarda audio + transcripción editable.
  - Sin soporte de dictado: lo informa y ofrece el camino de texto. ⛔ Nunca un botón inerte.
  - Del texto o del dictado se proponen: nota, pasos con vencimiento, cambio de etapa, productos mencionados (validados contra los 13).
  - ⛔ **Nada se guarda sin que el vendedor lo confirme.** El sistema propone; la persona guarda.

**Planificación por empresa, profesional y rubro.** Un plan tiene **un solo eje**: la empresa, el profesional, o el rubro completo. Un plan de rubro genera objetivos sugeridos; ⛔ no crea clientes solo.

---

### 2.4 Vista 04 — Agenda

**Propósito.** Todo lo que hay que hacer, cuándo, y qué se pasó de fecha.

⛔ **La agenda se puebla sola.** El vendedor ajusta fechas y completa acciones; no reconstruye nada a mano. Detalle en §4.

Cinco vistas internas:

| Vista | Qué muestra |
|---|---|
| **Hoy** | Visitas · llamadas · próximos pasos · vencimientos · seguimientos atrasados |
| **Semana** | Los siete días con su carga |
| **Mes** | Calendario mensual con la densidad de cada día |
| **Cronograma** | Gantt comercial: la vida de cada cliente y cada plan, con sus hitos |
| **Atrasados** | Lo que se pasó de fecha y sigue pendiente, con los días de atraso |

**Lo que el vendedor puede hacer:** ajustar una fecha (con motivo obligatorio), completar una acción, descartar una entrada, y crear una entrada a mano — **la excepción**, porque casi todo llega derivado.

---

### 2.5 Vista 05 — Propuestas

Dos cosas distintas que nunca se mezclan.

#### A · Presentación para dejar al cliente

| | |
|---|---|
| Cuándo | **Primero.** Antes de hablar de plata. |
| Qué es | Material de venta personalizado y visual. |
| Contenido | Copy aprobado de los productos elegidos, casos de uso del rubro del cliente, el plan de la vista 02 traducido a lenguaje de cliente. |
| Precio | **Sin precio definitivo.** Puede mostrar el rango documentado si corresponde, siempre marcado como referencia. |
| Aprobación | **No requiere.** |
| Salida | PDF y enlace compartible. |

#### B · Cotización

| | |
|---|---|
| Cuándo | **Después**, cuando el cliente ya vio la presentación. |
| Qué es | Documento comercial con precio personalizado propuesto por el vendedor. |
| Aprobación | **Obligatoria, sin excepción.** |

**Campos de una cotización.** ⛔ **Plantilla genérica**: se genera para cualquiera de los 13 productos, cualquier variante y cualquier cliente. Ningún importe está fijado en el código.

**Encabezado**
- **Número o folio** y **versión.**
- **Cliente**, y **empresa o profesional** al que pertenece.
- **Nombre del producto** y **variante o plan**, cuando exista.
- **Nombre del vendedor.**
- **Fecha de emisión** y **fecha de validez.**

**Precios** — internamente "precio efectivo"; ⛔ en el PDF del cliente, **"Precio especial"**
- **Setup:** precio de lista · precio especial (**S**) · **ahorro**.
- **Mensualidad:** precio de lista · precio especial (**M**) · **ahorro**.
- ⛔ Los ahorros se calculan, no se escriben.

**Compromiso e instalación**
- **Permanencia mínima: 12 meses.**
- **Condiciones de instalación** y **tiempo estimado**.
- ⛔ **Insumos, accesos, cuentas, información y equipos que debe proporcionar el cliente**, cada uno marcado como bloqueante o no.

**Alcance**
- **Qué incluye.**
- ⛔ **Qué no incluye.** Obligatorio y no vacío.
- **Límites incluidos**: consultas por mes, usuarios, canales.
- **Bases y condiciones.**

**Alternativas financieras** — las cuatro, ⛔ **no acumulables** (§10).

**Firmas y logos**
- **Firma del vendedor** — antes de enviar a revisión.
- **Firma del CEO** — al aprobar.
- **Logos oficiales** de Lab.IA, RGrlk Group y del producto; **logo de la variante** si existe oficialmente.
- ⛔ Los logos no se generan, no se redibujan, no se recolorean, no se recortan y no se deforman.

Detalle y reglas de validación: `docs/COMMERCIAL_RULES.md` §6.

---

### 2.6 Vista 06 — Dinero

Lo que el vendedor necesita saber sobre su plata. Ocho cifras, separadas por moneda:

| Cifra | Qué es |
|---|---|
| **Vendido** | Cerrado en el período. |
| **Cobrado** | Efectivamente ingresado. |
| **Por cobrar** | Vendido y no cobrado, con antigüedad. |
| **Parte de Lab.IA** | Sobre lo cobrado, según la regla de participación. |
| **Parte del vendedor** | Ídem. |
| **Comisión pendiente** | Del vendedor, devengada y no pagada. |
| **Comisión pagada** | Ya liquidada. |
| **Mensualidades vigentes** | Recurrente activo, cliente por cliente. |

**Regla base: 50 % Lab.IA / 50 % vendedor**, sobre setup y sobre mensualidades. Configurable por producto. Ver `docs/COMMERCIAL_RULES.md` §3.

⛔ El vendedor **no edita** comisiones ni reglas. Puede abrir una observación sobre una línea; la resuelve el administrador.

---

## 3. Investigación automática

### 3.1 El principio

**El vendedor escribe el dato mínimo. El sistema investiga. El vendedor confirma, corrige o agrega.**

⛔ Lo que **no** pasa: que el vendedor abra un formulario de veinte campos vacíos y tenga que salir a googlear a su propio prospecto. Si ya sabe todo del negocio, no necesita el sistema; y si no lo sabe, pedírselo es trasladarle el trabajo.

### 3.2 Qué devuelve

| Dato | Nota |
|---|---|
| **Actividad / rubro** | Resuelto contra la taxonomía; si el término es nuevo, se crea. |
| **Ubicación** | Ciudad, barrio, dirección si es pública. |
| **Canales digitales** | Dónde se lo puede contactar. |
| **Sitio web y redes encontrados** | Con su URL y si están activos. |
| **Productos o servicios observables** | Lo que se ve que vende. |
| **Señales operativas** | Indicios de cómo funciona: si tiene turnos, si reparte, si maneja stock. |
| **Posibles decisores** | Nombre y cargo, con su fuente. |
| **Tamaño aproximado** | ⛔ **Sólo si hay evidencia.** Sin evidencia, `no_encontrado`. |
| **Dolores probables** | Inferidos del perfil, siempre como hipótesis. |
| **Productos Lab.IA recomendados** | Los 13 ordenados, con encaje y motivo. |
| **Fuentes consultadas** | Cuáles, cuándo, y si respondieron. |
| **Fecha de investigación** | |
| **Nivel de confianza de cada dato** | `alta`, `media` o `baja`. |

### 3.3 Las tres clasificaciones

⛔ **Obligatorias y visibles en pantalla.** Un dato inferido nunca se presenta como verificado.

| Clasificación | Significa | Exige |
|---|---|---|
| **verificado** | Aparece en una fuente pública identificable | Al menos una fuente y un nivel de confianza |
| **inferido** | Lo dedujo el sistema | El razonamiento escrito y un nivel de confianza |
| **no encontrado** | No se halló | Valor en blanco. ⛔ No se rellena, no se estima |

### 3.4 Qué hace el vendedor

Sólo tres cosas, sobre lo que ya vino armado:

- **confirmar** — el dato está bien;
- **corregir** — el dato está mal y lo cambia;
- **agregar** — sabe algo que el sistema no encontró.

Cada corrección **recalcula el plan y muestra qué cambió**: qué producto subió, cuál bajó, y por qué.

### 3.5 Dónde corre

⛔ **La investigación y todo uso de modelo de lenguaje ocurren en el servidor, detrás de proveedores intercambiables.**

| # | Regla |
|---|---|
| PR1 | Los proveedores se declaran como **contrato**, no como elección. El proveedor definitivo se decide después. |
| PR2 | Hay tres familias: búsqueda, registros públicos y modelo de lenguaje. Cada una admite varios proveedores. |
| PR3 | ⛔ **Ninguna clave de API, ningún token y ninguna llamada a un proveedor externo viven en el navegador.** El cliente sólo recibe el resultado, ya resuelto y clasificado. |
| PR4 | El administrador ve el estado de los proveedores: cuáles responden y si el sistema está en modo respaldo. |

### 3.6 Cuando la investigación falla

⛔ **Nunca se le entrega al vendedor un formulario largo vacío.**

1. Se cae a la **taxonomía** como respaldo: con la actividad sola, el motor ya puede armar un perfil típico y un ranking.
2. Se marca `usoRespaldoTaxonomia` y se dice en pantalla que las fuentes externas no respondieron.
3. Se le piden **únicamente los datos mínimos faltantes**: uno, dos, a lo sumo tres campos, cada uno con su pregunta y con **por qué hace falta**.
4. El plan se entrega igual, con menor confianza declarada.

Un sistema que falla y devuelve un formulario en blanco es peor que no tener sistema: le hizo perder tiempo al vendedor y además no le resolvió nada.

---

## 4. Agenda operativa

### 4.1 El principio

**La agenda se puebla sola.** El vendedor ajusta fechas y completa acciones. ⛔ No reconstruye nada a mano.

Una agenda que hay que cargar entera es una agenda que nadie carga. Y una agenda vacía no avisa de nada.

### 4.2 De dónde salen las entradas

| Origen | Qué genera |
|---|---|
| **Planes** | Los hitos del plan, con su fecha |
| **Objetivos aceptados** | Una tarea de contacto por cada objetivo que el vendedor acepta |
| **Seguimientos** | Los pasos con vencimiento que el vendedor confirmó |
| **Presentaciones** | Recordatorio de seguimiento tras el envío |
| **Cotizaciones** | Vencimiento de vigencia · espera de revisión · espera de respuesta del cliente |
| **Vencimientos** | Vigencias de cotización y de enlace que están por caer |
| **Aperturas de enlace** | Cuando el cliente abre lo que se le mandó: **es el momento de llamar** |

⛔ `manual` es un origen más, y es la excepción. Si la mayoría de las entradas son manuales, la agenda no está funcionando.

### 4.3 Qué contiene

Visitas · llamadas · próximos pasos · vencimientos · seguimientos atrasados · hitos de plan · objetivos aceptados.

### 4.4 Qué puede hacer el vendedor

| Acción | Regla |
|---|---|
| **Ajustar una fecha** | ⛔ Exige motivo. Queda marcado que la fecha la movió una persona. |
| **Completar una acción** | Marca la entrada como hecha y actualiza la línea de tiempo del cliente. |
| **Descartar una entrada** | Con motivo. No la borra: la deja descartada. |
| **Crear a mano** | Sólo visitas, llamadas y próximos pasos. Es la excepción. |

### 4.5 Atrasados

Una entrada vencida y todavía pendiente se marca **atrasada**, con sus días de atraso. Aparece en Hoy, en su propia vista, y en la lista corta de Inicio.

⛔ Un atraso **no se oculta ni se reprograma solo**. Se ve hasta que alguien lo resuelve o lo descarta con motivo.

### 4.6 Relación con Inicio

Inicio muestra **la lista corta** —tres a cinco próximos seguimientos— y el **acceso a Agenda** con dos contadores: pendientes de hoy y atrasados.
⛔ Inicio no duplica la agenda. El calendario, el cronograma y el detalle viven acá.

---

## 5. Vista 07 — Administración

**Una sola vista adicional, con secciones internas.** No es otra aplicación ni un menú de nueve pantallas: es una vista con secciones.

| Sección | Contenido |
|---|---|
| **Control financiero** | Estado real del negocio: vendido, cobrado, por cobrar, parte Lab.IA, parte de cada vendedor, todo por moneda. |
| **Presupuesto de ventas** | Meta por período y por vendedor, contra lo real. Cumplimiento en guaraníes. |
| **Vendido, cobrado y por cobrar** | Detalle por cliente, producto y vendedor, con antigüedad de lo no cobrado. |
| **Comisiones** | Devengado, pendiente y pagado por vendedor. Cierre de período y ajustes con motivo. |
| **Ranking en guaraníes** | Vendedores ordenados por monto. ⛔ En guaraníes, no en porcentajes ni puntajes. |
| **Accesos y frecuencia de uso** | Quién entra, cada cuánto, desde cuándo no entra. Sirve para saber quién está trabajando. |
| **Todos los clientes e historiales** | Cartera completa de todos los vendedores, con la línea de tiempo entera. |
| **Aprobación de cotizaciones** | Cola de trabajo. Aprobar, corregir o rechazar, siempre con comentario. |
| **Configuración comercial** | Porcentajes de participación por producto, meses de participación del vendedor, presupuestos, vigencias, alta y baja de vendedores. |
| **Sugerencias de nuevos productos** | Backlog con su resolución. |

⛔ **Eliminado de Administración:** analítica genérica de conversión, mezcla de productos, gráficos decorativos, tasas y embudos. Lo que no sirve para decidir hoy, no se muestra.

---

## 6. Planificación por empresa, profesional y rubro

```
Plan ── eje ∈ { empresa | profesional | rubro }  (uno solo)
```

| Eje | Objeto | Ejemplo |
|---|---|---|
| `empresa` | Un negocio concreto | "La repuestera de mi amigo." |
| `profesional` | Un titular de práctica | "Mi odontóloga." |
| `rubro` | Un rubro completo | "Todas las peluquerías de Asunción." |

Reglas: un plan tiene **un solo eje**; un plan de rubro **no crea clientes**, genera objetivos sugeridos que el vendedor acepta de a uno; cerrar un plan exige motivo (`cumplido`, `parcial`, `descartado`, `reemplazado`).

---

## 7. Los 13 productos

**9 Específicas:** `ojo-digital` · `pulso-digital` · `vendedor-24-7` · `radar-stock` · `faro-digital` · `merma-ia` · `cotiza-facil` · `precio-vivo` · `ruta-ia`

**4 Integrales:** `park-ia` · `smart-commerce` · `agendar-ia` · `exeq-ia`

**Total: 13. Cerrado.**

| # | Regla |
|---|---|
| P1 | Son los **únicos productos vendibles**. |
| P2 | La amplitud del sistema está en **rubros y adaptaciones**, no en productos nuevos. |
| P3 | `FARO Inteligente` es alias histórico de `faro-digital`, nunca un producto aparte. |
| P4 | El copy vive **sólo** en `content/copy/`. El código conoce identificadores, no textos. |
| P5 | Precio Vivo **no tiene eslogan oficial**: se usa su propuesta de valor documentada. |
| P6 | Los eslóganes se muestran exactamente como están escritos, sin corregir puntuación ni acentuación. |

---

## 8. Taxonomía editable

La taxonomía derivada literalmente del copy fue la **semilla inicial**. Ya no es el techo.

### 8.1 Tres capas

| Capa | Qué es | Ejemplos |
|---|---|---|
| **Actividad** | A qué se dedica el negocio | Repuestera · Restaurante · Odontología · Peluquería · Hotel · Motel · Veterinaria · Gomería |
| **Operación** | Cómo funciona por dentro | Maneja stock · Trabaja con turnos · Atiende por WhatsApp · Reparte a domicilio · Tiene local con circulación · Varios profesionales · Catálogo amplio · Compra a proveedores · Precios que se mueven · Administra espacios |
| **Necesidad** | Qué le duele | Pierde ventas fuera de horario · No sabe qué reponer · Se le pierde mercadería · Agenda desordenada · Precios desactualizados · Reparto ineficiente · No sabe qué pasa en el local |

### 8.2 Cómo se relacionan

```
Actividad ──tiene──► Operaciones típicas
Operación ──genera─► Necesidades probables
Necesidad ──la atiende──► Producto (de los 13), con su nivel de encaje
```

### 8.3 Reglas

| # | Regla |
|---|---|
| T1 | ⛔ **No se limita a los textos literales de "Dónde tiene más sentido".** Esa lista es semilla, no límite. |
| T2 | ⛔ **No se usa únicamente mapeo literal.** El motor razona por operación y por necesidad. |
| T3 | Es **editable y ampliable** desde Configuración comercial. |
| T4 | Un término escrito por un vendedor y no reconocido **se crea** como `pendiente_de_revision` y el motor sigue funcionando. |
| T5 | El administrador confirma, fusiona o corrige términos pendientes. |
| T6 | Cada relación guarda **por qué** existe: es lo que permite explicar un ranking. |

---

## 9. Dinero, mensualidades y comisiones

Resumen. La norma completa está en **`docs/COMMERCIAL_RULES.md`**.

### 9.1 Regla de participación

> **50 % Lab.IA / 50 % vendedor**, sobre **setup** y sobre **mensualidades**.
> Configurable por producto. Los meses de participación del vendedor en la mensualidad son configurables por producto.

Es una regla **vigente y operativa**, no un pendiente.

### 9.2 Sobre qué se calcula

La participación se calcula sobre lo **cobrado**, no sobre lo vendido. Plata que no entró no genera comisión pagable.

### 9.3 Moneda

PYG y USD conviven. Todo importe lleva moneda. ⛔ Sin conversión automática: los totales van **por moneda**.

---

## 10. Precios

| # | Regla |
|---|---|
| 10.1 | El catálogo muestra el **precio de lista documentado**, transcripto literalmente del copy. |
| 10.2 | En una cotización, el vendedor **propone un precio personalizado**: setup, mensualidad, descuento de implementación y condiciones. |
| 10.3 | Ese precio propuesto **no es un precio de lista**: es una propuesta que el administrador aprueba o corrige. |
| 10.4 | ⛔ Ninguna cotización llega al cliente sin aprobación. |
| 10.5 | Smart Commerce y Exeq.IA no tienen precio de lista documentado: se cotizan íntegramente personalizados. |
| 10.6 | Los totales se presentan **agrupados por moneda**. Nunca se suma PYG con USD. |
| 10.7 | ⛔ Cotizar un producto fuera de los 13 es imposible por construcción. |

### 10.8 Las cuatro alternativas financieras

Toda cotización aprobada le ofrece al cliente cuatro alternativas.
⛔ **B, C y D NO son acumulables. El cliente elige una sola.**

| | Alternativa | Cálculo | Permanencia |
|---|---|---|---|
| **A** | Plan estándar | `S + (M × 12)` | 12 meses |
| **B** | Pago adelantado 12 meses, 10 % de descuento | `S + (M × 12 × 0,90)` | 12 meses |
| **C** | Pago adelantado 24 meses, 20 % de descuento | `S + (M × 24 × 0,80)` | 24 meses |
| **D** | Cheques diferidos o débito automático: 10 % de descuento, un mes bonificado | `S + (M × 11 × 0,90)` | 12 meses |

Donde **S** = precio especial del setup y **M** = precio mensual especial.
En **D** el cliente recibe **12 meses de servicio** y paga **11 mensualidades**.

| # | Regla |
|---|---|
| 10.9 | ⛔ El descuento se calcula sobre la **mensualidad especial**. El setup **se suma por separado** y nunca lo recibe. |
| 10.10 | ⛔ **Nunca se suman monedas diferentes.** |
| 10.11 | ⛔ **Todos los cálculos se ejecutan de nuevo en el servidor antes de aprobar.** |
| 10.12 | De cada alternativa se muestran diez cifras: precio total de lista · precio especial sin promoción · descuento adicional · ahorro total · setup a pagar · mensualidades a pagar · meses de servicio · total final · valor mensual efectivo · forma y calendario de pago. |

Detalle: `docs/COMMERCIAL_RULES.md` §7.

---

## 11. Aprobación de cotizaciones

**El circuito es uno solo y no tiene desvíos:**

```
borrador del vendedor
      ↓  firma del vendedor
      ↓  enviar
revisión del CEO
      ↓                    ↓
  aprobación          corrección  ──► vuelve a borrador, versión +1
      ↓  firma del CEO
PDF definitivo (inmutable, con folio, versión y las dos firmas)
      ↓
enlace para el cliente
      ↓
respuesta del cliente → constancia → avisos
```

| # | Regla |
|---|---|
| A1 | ⛔ **Ningún vendedor puede enviar una cotización final sin aprobación del administrador.** |
| A2 | Aprobar, corregir y rechazar **exigen comentario**. |
| A3 | Una cotización aprobada es **inmutable**. Editarla crea una versión nueva, **caduca la aprobación anterior y anula las firmas**. |
| A4 | El PDF definitivo se emite **después** de aprobar y con **las dos firmas vigentes**, nunca antes. |
| A5 | ⛔ **No hay autoaprobación** por tiempo, por monto ni por antigüedad del vendedor. |
| A6 | Nadie aprueba su propia cotización, ni siquiera el administrador si la cargó él. |
| A7 | Todo el historial de versiones es inmutable y consultable. |
| A8 | ⛔ El servidor **vuelve a ejecutar los cuatro cálculos** antes de aprobar. |

### 11.1 Firmas

| # | Regla |
|---|---|
| A9 | La **firma del vendedor** se registra **antes** de enviar a revisión. |
| A10 | La **firma del CEO** se incorpora **cuando aprueba**. |
| A11 | ⛔ Las firmas son **activos protegidos servidos desde el servidor**. |
| A12 | ⛔ **La imagen original de la firma del CEO no se expone por ninguna URL pública.** El PDF la incrusta al generarse, en el servidor. |

### 11.2 La respuesta del cliente

Enlace **privado y único**, después de la aprobación. Muestra: nombre del cliente ·
producto y variante · número y versión · las alternativas aprobadas con su total ·
vencimiento · bases y condiciones.

⛔ **Como las alternativas son excluyentes, se usan botones de opción, no casillas múltiples.**

1. Elijo el plan estándar.
2. Elijo pago adelantado por 12 meses.
3. Elijo pago adelantado por 24 meses.
4. Elijo cheques diferidos o débito automático.
5. Quiero que me contacten antes de elegir.
6. No continuar por ahora.

⛔ **Casilla obligatoria:** *"He revisado la opción seleccionada y solicito que Lab.IA continúe con los próximos pasos."*

Botón final: **Enviar mi elección**

### 11.3 Constancia y avisos

Registro inmutable con: cliente · cotización · versión exacta · opción seleccionada ·
importes aceptados · fecha y hora · vencimiento · texto de aceptación ·
identificación del enlace · huella del documento aprobado.

⛔ **Funciona como constancia comercial o aval de intención. No se presenta como
contrato ni como firma electrónica legal.**

Al recibirla se avisa a: **celular del vendedor asignado** · **WhatsApp corporativo
+595 984 355775** · **celular personal del CEO** (configurable y almacenado
**solamente en el servidor**) · **panel de Administración**.

| # | Regla |
|---|---|
| A13 | ⛔ El número personal del CEO **nunca** aparece en el enlace, el PDF ni el código del navegador. |
| A14 | ⛔ Si falla una notificación, la respuesta **se conserva** y el aviso se reintenta. **Nunca se pierde la elección del cliente.** |

---

## 12. Registro de accesos

Dos registros distintos, ambos **append-only**, nunca mezclados en una misma lista.

### 12.1 Aperturas de material compartido (`AccesoEnlace`)
Cada apertura de un enlace público y cada descarga de PDF: fecha/hora, tipo de dispositivo, país aproximado, duración si está disponible, resultado.
**Para qué:** el vendedor sabe si el cliente abrió lo que le mandó, y cuándo llamar.
⛔ **No identifica a la persona.** Sin IP completa, sin huella de dispositivo, sin cruce entre enlaces. Granularidad geográfica: país.

### 12.2 Uso del sistema (`RegistroAcceso`)
Ingresos, cierres de sesión, intentos fallidos, y las acciones que cambian dinero o permisos: cambios de configuración comercial, aprobaciones, correcciones, cierres de período, ajustes, emisión y revocación de enlaces, alta y baja de vendedores.
**Para qué:** el administrador ve **quién entra y con qué frecuencia** (§3), y puede reconstruir qué pasó.
El vendedor ve únicamente sus propios eventos.

---

## 13. Sugerencias de nuevos productos

Canal formal para reportar demanda que los 13 no cubren. ⛔ **No abre el portafolio.**

**Origen:** desde Planificar, cuando ningún producto encaja; o desde un seguimiento.

**Campos:** título · problema en palabras del cliente · cliente y rubro · frecuencia observada · qué producto se queda corto y por qué · adjuntos.

**Flujo:** `recibida → en_evaluacion → { aceptada_para_estudio | rechazada | duplicada | ya_cubierta_por_producto_existente }`

| # | Regla |
|---|---|
| S1 | Toda sugerencia recibe respuesta del administrador, con motivo. El silencio no es resolución. |
| S2 | `ya_cubierta_por_producto_existente` obliga a nombrar cuál de los 13 y a dar el argumento comercial, que vuelve al vendedor. |
| S3 | Una sugerencia aceptada **no crea un producto**: sale del alcance del Escritorio. |
| S4 | ⛔ Ninguna sugerencia aparece en catálogo, motor, presentaciones ni cotizaciones. |

---

## 14. Identidad visual

**Identidad Lab.IA.** ⛔ No se adopta la identidad dorada con serif de la referencia operativa.

### 14.1 Los ocho colores oficiales

| Hex | Rol | Contraste vs `#020711` | Uso |
|---|---|---|---|
| `#020711` | Fondo de la aplicación | — | Fondo base |
| `#06162F` | Navy | — | Superficies, barras |
| `#0A55D9` | Azul | **3.18** | ⛔ **Relleno y superficie. NUNCA texto ni borde fino.** |
| `#098CFF` | Azul claro | 5.96 | Texto de acento, bordes activos |
| `#00D9FF` | Cyan | 11.88 | Acento principal: ruta activa, foco, cifras |
| `#12D9FF` | Cyan claro | 11.91 | Realce, estado activo |
| `#F2F7FF` | Texto | 18.75 | Texto principal |
| `#AEB8C8` | Texto secundario | 10.08 | Texto de apoyo |

**Tipografía: Inter.** ⛔ Sin serif, en ningún elemento.

### 14.2 La regla que hay que recordar

⛔ **`#0A55D9` no alcanza AA para texto** (3.18 sobre el fondo, 2.85 sobre el navy: ni siquiera llega a 3:1). Es color de **relleno**. Para texto o borde de acento se usa `#098CFF` o `#00D9FF`.

Es el error más fácil de cometer con esta paleta, porque es el azul más "de marca" y da ganas de usarlo para todo.

### 14.3 Logos e imágenes

Se usan los **archivos oficiales**. ⛔ **No se genera otro, no se redibuja, no se recolorea, no se recorta, no se elimina el fondo, no se deforma.** Siempre `object-fit: contain`, respetando la proporción original.

Inventario completo con enlaces, versiones y estado: **`docs/INVENTARIO_ACTIVOS.md`**.

**Los 13 productos tienen su logo oficial disponible.** El de Park.IA, aportado por el CEO el 15/09/2026, está en:

```
apps/escritorio/public/assets/productos/park-ia/logo-park-ia.webp
```

1188 × 1188, **proporción cuadrada**, guardado sin modificar un solo byte. Se muestra con `object-fit: contain`. Ver `INVENTARIO_ACTIVOS.md` §3.2.

**De la referencia operativa se reutiliza la arquitectura, no la identidad:** estructura de navegación, patrones de componente, los cuatro estados, criterios de accesibilidad.

Detalle: `docs/DESIGN_SYSTEM.md` · Activos: `docs/ASSET_SOURCES.md` e `INVENTARIO_ACTIVOS.md`.

---

## 15. Responsive

⛔ **`overflow-x: hidden` no es una solución.** Esconde el síntoma y deja el problema.

| # | Regla |
|---|---|
| RS1 | Todo desbordamiento horizontal se corrige **en su causa**: un `min-width` de más, una tabla sin contenedor, una grilla que no baja, una palabra larga sin `overflow-wrap`, un padding que se suma al 100 %. |
| RS2 | Anchos de validación obligatorios: **360, 390, 768, 1024 y 1440 px**. |
| RS3 | Cada uno se valida sin scroll horizontal y con las áreas táctiles completas. |
| RS4 | Una vista que sólo funciona porque hay `overflow-x: hidden` **no está terminada**. |

---

## 16. Decisiones técnicas

| # | Decisión | Motivo |
|---|---|---|
| T1 | **Una sola aplicación** con ruteo por hash y guardia de rol | R6. Un login, un despliegue, un sistema de diseño. |
| T2 | **TypeScript** con tipos compartidos en `packages/compartido` | Seis sesiones paralelas necesitan contratos verificables por compilador. |
| T3 | **Vistas como módulos DOM sin framework** | La arquitectura de referencia es HTML/CSS/JS accesible. Sumar un framework sería una decisión sin respaldo. |
| T4 | **Guardia de rol en ruteo y en capa de datos** | Ocultar un enlace no es proteger una ruta. |
| T5 | **Tokens en un solo archivo**, valores de marca en `marca-labia.css` | La identidad se cambia en un lugar, sin tocar vistas. |
| T6 | **`CapaDatos` como puerto único**, con mock y HTTP | Permite construir las seis áreas en paralelo sin backend. |
| T7 | **`es-PY`** como locale único | El negocio y el copy son de Paraguay. |
| T8 | **Investigación y modelo de lenguaje, sólo en el servidor**, detrás de proveedores intercambiables | Una clave de API en el navegador es una clave publicada. Y atarse a un proveedor antes de probarlo es decidir a ciegas. |
| T9 | **La agenda se deriva, no se carga** | Una agenda que hay que llenar a mano queda vacía, y una agenda vacía no avisa de nada. |

---

## 17. Trazabilidad

| Decisión | Dónde queda |
|---|---|
| **Investigación automática real** | §3 completo |
| RUC · razón social · nombre comercial para empresa | §2.2 Entrada A, §3 |
| Nombre · profesión; matrícula y ciudad sólo si están | §2.2 Entrada B |
| El vendedor no investiga ni completa a mano | §0 R10, §3.1, §3.4 |
| Trece campos devueltos, con fuentes, fecha y confianza | §3.2 |
| Verificado · inferido · no encontrado | §3.3 |
| Proveedores intercambiables del servidor, sin claves en el navegador | §0 R12, §3.5, §16 T8 |
| Respaldo por taxonomía y dato mínimo faltante | §3.6 |
| Entrada independiente por rubro conservada | §2.2 Entrada C |
| **Agenda operativa** en `#/agenda`, protegida para ambos roles | §2.4, §4 |
| Hoy · Semana · Mes · Cronograma · Atrasados | §2.4 |
| Visitas, llamadas, próximos pasos, vencimientos, atrasados | §4.3 |
| La agenda se puebla sola desde siete orígenes | §0 R11, §4.2 |
| Ajustar fechas y completar, sin reconstruir | §4.4 |
| Inicio conserva sólo la lista corta y el acceso | §2.1 Bloque B, §4.6 |
| Agenda asignada a S4 | `PARALLEL_SESSIONS.md` §3 y §4 |
| **Ocho colores oficiales + Inter** | §14.1 |
| `#0A55D9` no es color de texto | §14.2 |
| **Inventario de activos de Drive** | `INVENTARIO_ACTIVOS.md` |
| Sin inventar, reconstruir ni generar activos | §14.3, `ASSET_SOURCES.md` |
| **Cotización estructurada**, plantilla genérica de 25 campos | §2.5, `COMMERCIAL_RULES.md` §6.1 |
| Setup y mensualidad: lista, especial y ahorro | §2.5 |
| "Precio especial" en el documento del cliente | §2.5, `COMMERCIAL_RULES.md` §6.4 C11 |
| Permanencia mínima de 12 meses | §2.5 |
| Insumos, accesos, cuentas, información y equipos del cliente | §2.5 |
| Qué incluye y qué no incluye | §2.5 |
| **Las cuatro alternativas, no acumulables** | §10.8, `COMMERCIAL_RULES.md` §7 |
| El descuento cae sobre M; el setup se suma aparte | §10.9 |
| Nunca se suman monedas distintas | §10.10 |
| El servidor recalcula antes de aprobar | §10.11, §11 A8 |
| Presentación primero sin precio; cotización después; aprobación obligatoria | §2.5, §11 |
| PDF definitivo sólo después de aprobar y con las dos firmas | §11 A4 |
| **Firmas como activos protegidos**, sin URL pública de la del CEO | §11.1 A11, A12 |
| Una modificación posterior anula aprobación y firmas | §11 A3 |
| **Respuesta del cliente con botones de opción**, no casillas | §11.2 |
| Casilla obligatoria y botón "Enviar mi elección" | §11.2 |
| **Constancia comercial**, no contrato ni firma electrónica legal | §11.3 |
| Cuatro destinos de aviso; el celular del CEO sólo en el servidor | §11.3 A13 |
| Si falla un aviso, la elección del cliente no se pierde | §11.3 A14 |
| **Logo oficial de Park.IA** | §14.3, `INVENTARIO_ACTIVOS.md` §3.2 |
| **Seis sesiones desde el mismo commit base, en ramas separadas** | `PARALLEL_SESSIONS.md` |
| Un solo sistema, dos roles | §1 |
| Los 13 productos | §7 |
| 50/50 configurable | §9.1 |
| Responsive por causa, cinco anchos | §15 |
