# MASTER_SPEC — Escritorio Vendedores Lab.IA

> **Versión 2.0 — corrección definitiva.** Reemplaza a la v1.0 en todo lo que la contradice.
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
| R10 | **En esta etapa no se construyen las vistas finales.** | Especificación + esqueleto + contratos. La implementación arranca con `docs/PARALLEL_SESSIONS.md`. |

---

## 1. Un solo sistema, dos roles

### 1.1 Una aplicación

**Una sola aplicación web. Un solo login por usuario y contraseña.**

```
apps/escritorio/                 ← la única aplicación
  #/inicio            vendedor + administrador
  #/planificar        vendedor + administrador
  #/clientes          vendedor + administrador
  #/propuestas        vendedor + administrador
  #/dinero            vendedor + administrador
  #/administracion    SÓLO administrador  ← ruta protegida
```

⛔ **No existe una app de administración separada.** El administrador entra por el mismo login, ve exactamente las mismas cinco vistas del vendedor, y además ve `#/administracion`.

### 1.2 Dos roles

| Rol | Qué ve | Qué puede |
|---|---|---|
| `vendedor` | Las 5 vistas operativas | Su cartera, sus propuestas, su dinero. Propone precios. **No aprueba nada.** |
| `administrador` | Las 5 vistas operativas **+** `#/administracion` | Todo lo del vendedor sobre toda la operación, más aprobación de cotizaciones, configuración comercial y control financiero. |

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
| 04 | `#/propuestas` | **Propuestas** | ambos | ¿Qué le presenté y qué le cotizo? |
| 05 | `#/dinero` | **Dinero** | ambos | ¿Cuánto vendí, cuánto se cobró y cuánto me toca? |
| 06 | `#/administracion` | **Administración** | **sólo admin** | ¿Cómo va toda la operación y qué tengo que aprobar? |

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

**Bloque B — Próximos seguimientos.** Lista corta y accionable: con quién, cuándo, qué quedó pendiente. Un toque lleva al cliente.

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

#### Entrada A — Investigar empresa o profesional conocido
Campos: nombre · **qué hace** (texto libre, en las palabras del vendedor) · ciudad · tamaño aproximado · relación del vendedor con esa persona · lo que ya sabe del negocio.

#### Entrada B — Explorar oportunidades por rubro
Un campo de texto libre. **Acepta cualquier rubro escrito.** "Motel", "veterinaria", "gomería", "vivero", "kiosco de barrio", "estudio de arquitectura". Si el término no existe en la taxonomía, **se crea** y queda marcado para revisión del administrador. ⛔ El motor **nunca** responde "rubro no encontrado".

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

7. **Adaptación necesaria.** En `cercano` y `adaptable`, texto concreto: qué hay que ajustar y qué hay que confirmar antes de prometerlo.
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

### 2.3 Vista 03 — Clientes

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

### 2.4 Vista 04 — Propuestas

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

**Campos de una cotización:**

- **Precio personalizado** propuesto por el vendedor (§8).
- **Setup** (implementación).
- **Mensualidad.**
- **Descuento de implementación.**
- **Débito automático** (sí/no).
- **Compromiso de doce meses** (sí/no).
- **Pago anual anticipado** (sí/no).
- **Alcance**: qué incluye y qué no.
- **Vigencia** de la oferta.
- **Cronograma** de implementación.
- **Condiciones** comerciales.

---

### 2.5 Vista 05 — Dinero

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

## 3. Vista 06 — Administración

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

## 4. Planificación por empresa, profesional y rubro

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

## 5. Los 13 productos

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

## 6. Taxonomía editable

La taxonomía derivada literalmente del copy fue la **semilla inicial**. Ya no es el techo.

### 6.1 Tres capas

| Capa | Qué es | Ejemplos |
|---|---|---|
| **Actividad** | A qué se dedica el negocio | Repuestera · Restaurante · Odontología · Peluquería · Hotel · Motel · Veterinaria · Gomería |
| **Operación** | Cómo funciona por dentro | Maneja stock · Trabaja con turnos · Atiende por WhatsApp · Reparte a domicilio · Tiene local con circulación · Varios profesionales · Catálogo amplio · Compra a proveedores · Precios que se mueven · Administra espacios |
| **Necesidad** | Qué le duele | Pierde ventas fuera de horario · No sabe qué reponer · Se le pierde mercadería · Agenda desordenada · Precios desactualizados · Reparto ineficiente · No sabe qué pasa en el local |

### 6.2 Cómo se relacionan

```
Actividad ──tiene──► Operaciones típicas
Operación ──genera─► Necesidades probables
Necesidad ──la atiende──► Producto (de los 13), con su nivel de encaje
```

### 6.3 Reglas

| # | Regla |
|---|---|
| T1 | ⛔ **No se limita a los textos literales de "Dónde tiene más sentido".** Esa lista es semilla, no límite. |
| T2 | ⛔ **No se usa únicamente mapeo literal.** El motor razona por operación y por necesidad. |
| T3 | Es **editable y ampliable** desde Configuración comercial. |
| T4 | Un término escrito por un vendedor y no reconocido **se crea** como `pendiente_de_revision` y el motor sigue funcionando. |
| T5 | El administrador confirma, fusiona o corrige términos pendientes. |
| T6 | Cada relación guarda **por qué** existe: es lo que permite explicar un ranking. |

---

## 7. Dinero, mensualidades y comisiones

Resumen. La norma completa está en **`docs/COMMERCIAL_RULES.md`**.

### 7.1 Regla de participación

> **50 % Lab.IA / 50 % vendedor**, sobre **setup** y sobre **mensualidades**.
> Configurable por producto. Los meses de participación del vendedor en la mensualidad son configurables por producto.

Es una regla **vigente y operativa**, no un pendiente.

### 7.2 Sobre qué se calcula

La participación se calcula sobre lo **cobrado**, no sobre lo vendido. Plata que no entró no genera comisión pagable.

### 7.3 Moneda

PYG y USD conviven. Todo importe lleva moneda. ⛔ Sin conversión automática: los totales van **por moneda**.

---

## 8. Precios

| # | Regla |
|---|---|
| 8.1 | El catálogo muestra el **precio de lista documentado**, transcripto literalmente del copy. |
| 8.2 | En una cotización, el vendedor **propone un precio personalizado**: setup, mensualidad, descuento de implementación y condiciones. |
| 8.3 | Ese precio propuesto **no es un precio de lista**: es una propuesta que el administrador aprueba o corrige. |
| 8.4 | ⛔ Ninguna cotización llega al cliente sin aprobación. |
| 8.5 | Smart Commerce y Exeq.IA no tienen precio de lista documentado: se cotizan íntegramente personalizados. |
| 8.6 | Los totales se presentan **agrupados por moneda**. Nunca se suma PYG con USD. |
| 8.7 | ⛔ Cotizar un producto fuera de los 13 es imposible por construcción. |

---

## 9. Aprobación de cotizaciones

**El circuito es uno solo y no tiene desvíos:**

```
borrador del vendedor
      ↓  enviar
revisión del administrador
      ↓                    ↓
  aprobada            corregida  ──► vuelve a borrador, versión +1
      ↓
PDF definitivo (inmutable, con folio y versión)
      ↓
envío al cliente
```

| # | Regla |
|---|---|
| A1 | ⛔ **Ningún vendedor puede enviar una cotización final sin aprobación del administrador.** |
| A2 | Aprobar, corregir y rechazar **exigen comentario**. |
| A3 | Una cotización aprobada es **inmutable**. Editarla crea una versión nueva y **caduca la aprobación anterior**. |
| A4 | El PDF definitivo se emite **después** de aprobar, nunca antes. |
| A5 | ⛔ **No hay autoaprobación** por tiempo, por monto ni por antigüedad del vendedor. |
| A6 | Nadie aprueba su propia cotización, ni siquiera el administrador si la cargó él. |
| A7 | Todo el historial de versiones es inmutable y consultable. |

---

## 10. Registro de accesos

Dos registros distintos, ambos **append-only**, nunca mezclados en una misma lista.

### 10.1 Aperturas de material compartido (`AccesoEnlace`)
Cada apertura de un enlace público y cada descarga de PDF: fecha/hora, tipo de dispositivo, país aproximado, duración si está disponible, resultado.
**Para qué:** el vendedor sabe si el cliente abrió lo que le mandó, y cuándo llamar.
⛔ **No identifica a la persona.** Sin IP completa, sin huella de dispositivo, sin cruce entre enlaces. Granularidad geográfica: país.

### 10.2 Uso del sistema (`RegistroAcceso`)
Ingresos, cierres de sesión, intentos fallidos, y las acciones que cambian dinero o permisos: cambios de configuración comercial, aprobaciones, correcciones, cierres de período, ajustes, emisión y revocación de enlaces, alta y baja de vendedores.
**Para qué:** el administrador ve **quién entra y con qué frecuencia** (§3), y puede reconstruir qué pasó.
El vendedor ve únicamente sus propios eventos.

---

## 11. Sugerencias de nuevos productos

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

## 12. Identidad visual

**Se usa la identidad aprobada de Lab.IA.** ⛔ No se adopta la identidad dorada con serif de la referencia operativa.

| Elemento | Definición |
|---|---|
| Fondo | **Dark / navy** |
| Acentos | **Azul y cyan** |
| Tipografía | **Inter** |
| Logos e imágenes | **Archivos oficiales.** ⛔ Sin redibujar, sin recolorear, sin deformar. `object-fit: contain`. |
| Imágenes | ⛔ Ninguna inventada. |

**De la referencia operativa se reutiliza la arquitectura, no la identidad:** estructura de navegación, patrones de componente, los cuatro estados, criterios de accesibilidad. Nada de su paleta, su tipografía ni su monograma.

Detalle: `docs/DESIGN_SYSTEM.md` · Activos: `docs/ASSET_SOURCES.md`.

---

## 13. Responsive

⛔ **`overflow-x: hidden` no es una solución.** Esconde el síntoma y deja el problema.

| # | Regla |
|---|---|
| RS1 | Todo desbordamiento horizontal se corrige **en su causa**: un `min-width` de más, una tabla sin contenedor, una grilla que no baja, una palabra larga sin `overflow-wrap`, un padding que se suma al 100 %. |
| RS2 | Anchos de validación obligatorios: **360, 390, 768, 1024 y 1440 px**. |
| RS3 | Cada uno se valida sin scroll horizontal y con las áreas táctiles completas. |
| RS4 | Una vista que sólo funciona porque hay `overflow-x: hidden` **no está terminada**. |

---

## 14. Decisiones técnicas

| # | Decisión | Motivo |
|---|---|---|
| T1 | **Una sola aplicación** con ruteo por hash y guardia de rol | R6. Un login, un despliegue, un sistema de diseño. |
| T2 | **TypeScript** con tipos compartidos en `packages/compartido` | Seis sesiones paralelas necesitan contratos verificables por compilador. |
| T3 | **Vistas como módulos DOM sin framework** | La arquitectura de referencia es HTML/CSS/JS accesible. Sumar un framework sería una decisión sin respaldo. |
| T4 | **Guardia de rol en ruteo y en capa de datos** | Ocultar un enlace no es proteger una ruta. |
| T5 | **Tokens en un solo archivo**, valores de marca en `marca-labia.css` | La identidad se cambia en un lugar, sin tocar vistas. |
| T6 | **`CapaDatos` como puerto único**, con mock y HTTP | Permite construir las seis áreas en paralelo sin backend. |
| T7 | **`es-PY`** como locale único | El negocio y el copy son de Paraguay. |

---

## 15. Trazabilidad de la corrección

| Decisión de la corrección | Dónde queda |
|---|---|
| Un solo sistema, un login, dos roles | §1, §14 T1/T4 |
| Sin supervisor ni auditor | §1.2 |
| Administración como ruta protegida, no otra app | §1.1, §3 |
| La planificación es el comienzo | §2.1 |
| Cuatro cifras + próximos seguimientos + dos acciones protagonistas | §2.1 |
| Investigar conocido / explorar por rubro | §2.1 B, §2.2 |
| Motor comercial real, no mapeo literal | §2.2, §6 |
| Taxonomía editable y ampliable | §6 |
| Ranking 1.º al 10.º, productos 1-2-3, combos, encaje, adaptación, estrategia, argumentos, preguntas | §2.2 |
| 50/50 configurable por producto y por meses | §7.1, `COMMERCIAL_RULES.md` §3 |
| Ocho cifras financieras separadas | §2.5 |
| Administración en una vista con secciones | §3 |
| Sin analítica genérica ni gráficos decorativos | §2.1, §3 |
| Presentación primero, sin precio, sin aprobación | §2.4 A |
| Cotización después, con todos sus campos | §2.4 B |
| Circuito de aprobación obligatorio | §9 |
| Identidad Lab.IA, no la dorada | §12 |
| Responsive por causa, cinco anchos | §13 |
| Seis sesiones reorganizadas | `docs/PARALLEL_SESSIONS.md` |
