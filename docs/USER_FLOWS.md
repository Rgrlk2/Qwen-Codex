# USER_FLOWS — Escritorio Vendedores Lab.IA

> **Versión 3.0.** Complementa `docs/MASTER_SPEC.md`.
> **A** = acción del usuario · **S** = respuesta del sistema · **◆** = decisión · **⛔** = bloqueo duro.

---

## 0. Índice

| # | Flujo | Vista | Rol |
|---|---|---|---|
| F1 | Ingreso y pantalla de arranque | Inicio | ambos |
| F2 | **Investigar una empresa** (RUC · razón social · nombre comercial) | Planificar | ambos |
| F2b | **Investigar un profesional** (nombre · profesión) | Planificar | ambos |
| F3 | Explorar oportunidades por rubro | Planificar | ambos |
| F4 | Consultar un producto del portafolio | Planificar | ambos |
| F5 | Guardar un cliente y su plan | Clientes | ambos |
| F6 | Seguimiento por voz | Clientes | ambos |
| F7 | Seguimiento por texto | Clientes | ambos |
| F8 | **Trabajar la agenda del día** | Agenda | ambos |
| F8b | Armar la presentación | Propuestas | ambos |
| F9 | Armar la cotización | Propuestas | vendedor |
| F10 | Revisión y aprobación | Administración | administrador |
| F11 | PDF definitivo y envío al cliente | Propuestas | vendedor |
| F12 | El cliente abre el enlace | vista pública | cliente |
| F13 | Consultar mi dinero | Dinero | ambos |
| F14 | Observar una línea de comisión | Dinero → Administración | ambos |
| F15 | Control financiero y ranking | Administración | administrador |
| F16 | Configuración comercial | Administración | administrador |
| F17 | Cierre de período | Administración | administrador |
| F18 | Sugerir un producto nuevo | Planificar → Administración | ambos |
| F19 | Accesos y frecuencia de uso | Administración | administrador |

---

## F1 · Ingreso y pantalla de arranque

1. **A** Entra con usuario y contraseña.
2. **S** Registra el ingreso. Resuelve el rol.
3. ◆ **Rol:**
   - `vendedor` → menú con cinco vistas.
   - `administrador` → las mismas cinco **más** Administración.
4. **S** Ruta por defecto `#/inicio`, en estado **cargando** (esqueletos, nunca pantalla en blanco).
5. **S** Muestra, en este orden:
   - cuatro cifras: dinero vendido · dinero cobrado · comisión acumulada · comisión pendiente;
   - próximos seguimientos;
   - **las dos acciones protagonistas**, como bloque visual dominante.
6. ◆ **¿Vendedor nuevo, sin datos?**
   - **S** Las cifras muestran su estado vacío con texto honesto ("Todavía no registraste ventas"), y las dos acciones quedan como **lo único accionable** de la pantalla. Es el arranque esperado, no un error.
7. **A** Elige:
   - **Investigar una empresa o un profesional que conozco** → F2
   - **Explorar oportunidades por rubro** → F3
   - o toca un seguimiento → F6 / F7
8. ⛔ **Prohibido en esta pantalla:** gráficos decorativos, embudos, tasas de conversión, mezcla de productos.

---

## F2 · Investigar una empresa

1. **A** Inicio → *Investigar una empresa o un profesional que conozco*.
2. **A** Escribe **lo que tiene**. Basta con uno de los tres:
   - **RUC** — `80012345-6`
   - **Razón social** — *Comercial San Miguel S.A.*
   - **Nombre comercial** — *Repuestera del Este*

   Opcional: ciudad.
3. ⛔ **Y eso es todo lo que se le pide.** No hay formulario de perfil. No se le pide que describa el negocio, ni que averigüe el rubro, ni que busque el sitio web.
4. **S** Estado **investigando**, con progreso visible desde el primer segundo y **las fuentes que va consultando**.
5. **S** Devuelve el perfil armado, dato por dato, cada uno con su **clasificación**, su **confianza** y sus **fuentes**:

   | Dato | |
   |---|---|
   | actividad / rubro | resuelto contra la taxonomía |
   | ubicación | |
   | canales digitales | |
   | sitio web y redes encontrados | |
   | productos o servicios observables | |
   | señales operativas | cómo funciona por dentro |
   | posibles decisores | nombre y cargo, con su fuente |
   | tamaño aproximado | ⛔ **sólo si hay evidencia** |
   | dolores probables | siempre como hipótesis |
   | productos Lab.IA recomendados | los 13 ordenados |
   | fuentes consultadas | incluidas **las que fallaron**, con su motivo |
   | fecha de investigación | |

6. **S** Cada dato se ve claramente como **verificado**, **inferido** o **no encontrado**. ⛔ En texto, no sólo por color.
7. ◆ **¿Las fuentes externas respondieron?**
   - **Sí** → sigue.
   - **No** → **S** cae a la **taxonomía**, lo dice en pantalla, y pide **únicamente los datos mínimos faltantes**: uno, dos, a lo sumo tres campos, cada uno con su pregunta y **por qué hace falta**.
     ⛔ **Nunca un formulario largo vacío.** Un sistema que falla y devuelve un formulario en blanco le hizo perder tiempo al vendedor y además no le resolvió nada.
8. **A** El vendedor hace **sólo tres cosas**: **confirmar** · **corregir** · **agregar**.
9. **S** Cada corrección **recalcula el plan y muestra qué cambió**: qué producto subió, cuál bajó, y por qué.
10. **S** El plan completo, con la misma estructura de siempre: perfil · dolores · los 13 ordenados · 1-2-3 · combos · encaje · adaptaciones · estrategia · argumentos · preguntas.
11. ◆ Qué hace con el plan: guardar como cliente (F5) · armar presentación (F8b) · registrar seguimiento (F6/F7) · ninguno encaja (F18).
12. ⛔ Toda la investigación corrió **en el servidor**. Ninguna clave ni llamada sensible tocó el navegador.

---

## F2b · Investigar un profesional

1. **A** Inicio → *Investigar una empresa o un profesional que conozco* → **Profesional**.
2. **A** Escribe:
   - **Nombre** — obligatorio — *Dra. Claudia Leguizamón*
   - **Profesión o especialidad** — obligatorio — *Pediatría*
   - **Matrícula** — ⛔ **sólo si la tiene a mano**
   - **Ciudad** — ⛔ **sólo si la tiene a mano**
3. ⛔ **La matrícula y la ciudad no se le piden.** Si las sabe, mejoran la investigación. Si no, el sistema sigue igual.
4. **S** Desde el paso 4 de F2, idéntico: mismo proceso, misma clasificación, mismo respaldo, mismas tres acciones del vendedor.

---

## F3 · Explorar oportunidades por rubro

1. **A** Inicio → *Explorar oportunidades por rubro*.
2. **A** Escribe el rubro. **Cualquier texto**: "motel", "gomería", "vivero", "estudio de arquitectura".
3. **S** Igual que F2 pasos 4–5: resuelve o crea el término. ⛔ Nunca rechaza.
4. **S** Devuelve el plan del rubro: cómo funciona ese tipo de negocio, dolores típicos, los 13 ordenados, 1-2-3, combos, encaje, adaptaciones, estrategia, argumentos y preguntas.
5. **S** Agrega: **clientes propios ya existentes** en ese rubro, y **qué les falta** del top 3.
6. **A** Puede crear un **plan de rubro** con período y meta en guaraníes.
7. **S** Genera **objetivos sugeridos**.
8. ⛔ El plan de rubro **no crea clientes**. El vendedor acepta objetivos de a uno; cada aceptación genera una tarea.
9. **A** Al cerrar el plan: ◆ motivo obligatorio (`cumplido` · `parcial` · `descartado` · `reemplazado`).

---

## F4 · Consultar un producto del portafolio

1. **A** Planificar → *Ver los 13 productos*.
2. **S** Lista filtrable por familia (9 específicas / 4 integrales) y por rubro.
3. **A** Abre una ficha.
4. **S** Renderiza el **copy aprobado tal cual**, en el orden del documento fuente. Las secciones que ese producto no tiene, no se muestran ni se rellenan.
5. **S** Precio de lista con su transcripción literal y su estado.
6. ◆ **Sin precio documentado** (Smart Commerce, Exeq.IA) → muestra *"Precio oficial no encontrado."* y el camino a cotización personalizada.
7. ⛔ Sin edición de copy ni de precio en ninguna vista.

---

## F5 · Guardar un cliente y su plan

1. **A** Desde el plan: *Guardar como cliente*.
2. ◆ **Tipo**: `empresa` o `profesional`.
3. **S** Precarga nombre, actividad, perfil operativo y plan. El vendedor completa contacto.
4. **S** Crea el cliente con su **plan de planificación asociado** y la referencia a la versión de taxonomía y catálogo usada.
5. **S** Aparece en Clientes y en los próximos seguimientos si se fijó un próximo paso.

---

## F6 · Seguimiento por voz

1. **A** Clientes → ficha → *Nuevo seguimiento* → **Dictar**.
2. ◆ **¿El dispositivo soporta dictado?**
   - **No** → ⛔ lo informa con texto claro y ofrece el camino de texto (F7). **Nunca un botón inerte.**
   - **Sí** → sigue.
3. **S** Pide permiso de micrófono y **avisa explícitamente que está grabando**.
4. **A** Dicta. **S** Muestra la transcripción y la deja **editable**.
5. **A** *Procesar*.
6. **S** **Propone** (no guarda): nota estructurada · pasos con vencimiento · cambio de etapa sugerido · productos mencionados (validados contra los 13) · borrador de respuesta.
7. ◆ **Menciones fuera del catálogo** → se descartan o van a sugerencia (F18). ⛔ Nunca crean un producto.
8. **A** Confirma qué guarda, ítem por ítem.
9. ⛔ **Nada se persiste sin esa confirmación.**
10. **S** Guarda el seguimiento con `origen: "voz"`, audio y transcripción, y actualiza la línea de tiempo.
11. **S** El audio tiene retención configurable; **la transcripción le sobrevive**.

---

## F7 · Seguimiento por texto

Idéntico a F6 desde el paso 5, con `origen: "texto"`, sin audio. **Misma entidad, mismo procesamiento, mismas confirmaciones.**

---

## F8 · Trabajar la agenda del día

1. **A** Agenda (o desde el acceso en Inicio).
2. **S** Abre en **Hoy**: visitas · llamadas · próximos pasos · vencimientos · **atrasados**.
3. ⛔ **Todo eso ya está ahí.** Se pobló solo desde planes, objetivos aceptados, seguimientos, presentaciones, cotizaciones, vencimientos y aperturas de enlace.
4. **S** Una entrada de **apertura de enlace** dice explícitamente por qué está: *"El cliente abrió tu cotización ayer a las 19:40"*. Es el momento de llamar.
5. ◆ **Qué hace el vendedor con una entrada:**
   - **completar** → se marca hecha y actualiza la línea de tiempo del cliente;
   - **ajustar la fecha** → ⛔ **exige motivo**; queda marcado que la movió una persona;
   - **descartar** → con motivo. ⛔ No se borra: queda descartada.
6. **A** Cambia de vista: **Semana** · **Mes** · **Cronograma** · **Atrasados**.
7. **S · Cronograma** — Gantt comercial: la vida de cada cliente y de cada plan, con sus hitos y las barras **en riesgo** marcadas.
   ⛔ Con alternativa en lista: un Gantt no se lee con lector de pantalla.
8. **S · Atrasados** — lo que se pasó de fecha y sigue pendiente, con los días de atraso.
   ⛔ Un atraso **no se oculta ni se reprograma solo**. Se ve hasta que alguien lo resuelve o lo descarta con motivo.
9. **A** Opcional: *Nueva entrada* → ⛔ **sólo visita, llamada o próximo paso**. Es la excepción: si la mayoría de las entradas son manuales, la agenda no está funcionando.

---

## F8b · Armar la presentación

1. **A** Propuestas → **Presentaciones** → *Nueva* → elegir cliente.
2. **S** Precarga el plan: productos 1-2-3, dolores y argumentos.
3. **A** Elige qué productos y qué casos de uso entran.
4. **S** Arma el material con el **copy aprobado**, traducido a lenguaje de cliente, con la marca oficial de Lab.IA.
5. ⛔ **Sin precio definitivo.** Si se muestra un rango documentado, va marcado como referencia.
6. ⛔ **No requiere aprobación.** Es material de venta.
7. **A** *Generar* → PDF y/o enlace compartible.
8. **S** Registra la emisión y habilita el conteo de aperturas (F12).
9. **A** La deja al cliente por el canal que use.

---

## F9 · Armar la cotización

1. **A** Propuestas → **Cotizaciones** → *Nueva* → elegir cliente y presentación previa.
2. ◆ **¿Existe una presentación entregada a ese cliente?**
   - **No** → **S** advierte que el circuito esperado es presentación primero. No bloquea, pero lo deja asentado.
3. **A** Elige productos de los 13 y **propone el precio personalizado**:
   - **setup** y su **descuento** (porcentaje o importe), **mensualidad**, **límites incluidos**;
   - **hitos de pago del setup**: porcentaje o importe **al aceptar**, **al entregar o conectar**, y los que hagan falta;
   - **meses incluidos** y **período de congelamiento del precio**;
   - **débito automático** · **compromiso de doce meses** · **pago anual anticipado**;
   - ⛔ **la condición que habilita cada beneficio**, y qué pasa si el cliente deja de cumplirla;
   - **alcance**, **exclusiones**, **vigencia**, **cronograma** por etapas con su entregable e importe.
3b. ◆ **¿Los hitos de pago cierran?**
   - **Sí** → sigue.
   - **No** → ⛔ **no se puede enviar a revisión.** Si son porcentuales deben sumar 100; si son importes, el setup con descuento aplicado.
3c. ◆ **¿Cada beneficio tiene su condición escrita?** Si no, ⛔ no se aprueba después.
4. **S** Muestra al lado el **precio de lista documentado** y la desviación, en guaraníes y en porcentaje. Es información, no un bloqueo.
5. **S** Totaliza **por moneda**. ⛔ Nunca suma PYG con USD.
6. **A** *Enviar a revisión*.
7. **S** Estado `en_revision`, versión congelada, entra a la cola del administrador.
8. ⛔ **No hay ningún camino que lleve esta cotización al cliente sin pasar por F10.**

---

## F10 · Revisión y aprobación

1. **A** Administración → **Aprobación de cotizaciones**.
2. **S** Cola por antigüedad y monto. Por cada cotización: propuesto vs. lista, desviación en guaraníes y en porcentaje, **la suma de los hitos de pago y si cierra**, **meses incluidos y congelamiento**, las tres condiciones, **qué habilita cada beneficio**, impacto en la parte de Lab.IA, historial del cliente, versiones anteriores.
3. ◆ **Decisión** — las tres exigen comentario:
   - **aprobar** → `aprobada`;
   - **corregir** → vuelve a `borrador` con versión +1 y los cambios pedidos, historial intacto;
   - **rechazar** → `rechazada`.
4. ⛔ Nadie aprueba su propia cotización.
5. ⛔ **No hay autoaprobación** por tiempo, monto ni antigüedad.
6. **S** Notifica al vendedor y deja registro.

---

## F11 · PDF definitivo y envío al cliente

1. ◆ **¿La cotización está `aprobada`?**
   - **No** → ⛔ la acción no existe en la interfaz y la capa de datos la rechaza.
   - **Sí** → sigue.
2. **A** *Emitir PDF definitivo*.
3. **S** Genera el PDF en servidor, determinístico, con folio, versión, fecha, vigencia y la marca oficial. **Inmutable.**
4. **A** *Generar enlace* con vencimiento, tope de aperturas y revocación disponible.
5. ⛔ El enlace lleva **token opaco**: no deriva de ningún dato del cliente ni de la cotización.
6. **A** Envía por su canal. **S** Estado `enviada_al_cliente`.
7. ◆ Desenlace: `aceptada` · `perdida` (motivo obligatorio) · `vencida` (automática; el enlace deja de mostrar importes).
8. ◆ **`aceptada`** → **S** crea la mensualidad y habilita el cómputo de participación (F13).
9. **A** *Revocar enlace* en cualquier momento → corte inmediato, con registro.

---

## F12 · El cliente abre el enlace

1. **A** El cliente abre el enlace recibido.
2. ◆ **Token:** `vencido` / `revocado` / `tope_superado` → mensaje neutro, ⛔ sin contenido ni datos del cliente. `ok` → sigue.
3. ◆ **¿Requiere código?** → se pide; tras N intentos se bloquea y se registra.
4. **S** Muestra la presentación o la cotización aprobada. ⛔ Sin navegación al Escritorio, sin otros clientes, sin precios de terceros.
5. ◆ Cotización `vencida` → se muestra **sin importes**, con aviso de vigencia caducada.
6. **S** Registra la apertura (§10.1 del MASTER_SPEC). ⛔ Sin identificar a la persona.
7. **S** El vendedor ve la apertura en la ficha del cliente y en sus próximos seguimientos.

---

## F13 · Consultar mi dinero

1. **A** Dinero.
2. **S** Ocho cifras, **una fila por moneda**: vendido · cobrado · por cobrar · parte de Lab.IA · parte del vendedor · comisión pendiente · comisión pagada · mensualidades vigentes.
3. **S** Detalle por operación: cliente, producto, setup y mensualidad, participación aplicada con su versión, estado de cobro.
4. **S** Mensualidades vigentes: cliente, producto, importe, alta, meses acumulados, meses de participación restantes si el producto tiene plazo.
5. ⛔ El vendedor **no edita** nada acá.
6. ◆ ¿Una línea no cierra? → F14.

---

## F14 · Observar una línea de comisión

1. **A** Dinero → línea → *Observar*.
2. **A** Motivo y evidencia.
3. **S** Crea una observación `abierta` para el administrador. ⛔ No modifica ningún importe.
4. **A** Administración resuelve: `procede` · `no_procede` · `parcial`, con comentario obligatorio.
5. ◆ **Si procede** → se emite un **ajuste** con motivo y traza. ⛔ **Nunca** se recalcula un período cerrado.
6. **S** El vendedor ve la resolución en su detalle.

---

## F15 · Control financiero y ranking

1. **A** Administración → **Control financiero**.
2. **S** Vendido, cobrado, por cobrar, parte de Lab.IA y parte de cada vendedor, **por moneda**.
3. **S** **Por cobrar** con antigüedad: qué se vendió y no entró, desde cuándo, de quién.
4. **A** → **Presupuesto de ventas**: meta por vendedor y período contra lo real, cumplimiento **en guaraníes**.
5. **A** → **Ranking**: vendedores ordenados **por monto en guaraníes**.
6. ⛔ Sin embudos, sin tasas de conversión, sin mezcla de productos, sin gráficos decorativos.

---

## F16 · Configuración comercial

1. **A** Administración → **Configuración comercial**.
2. ◆ Qué configura:
   - **Participación por producto**: porcentaje Lab.IA / vendedor, si aplica a setup y a mensualidad, meses de participación del vendedor.
   - **Presupuestos** por vendedor y período.
   - **Taxonomía**: confirmar, fusionar o corregir términos `pendiente_de_revision`; agregar actividades, operaciones y necesidades; ajustar el encaje de un producto con una necesidad.
   - **Vendedores**: alta, baja, reasignación de cartera.
   - **Vigencias** por defecto de cotizaciones y enlaces.
3. ⛔ `porcentajeLabIA + porcentajeVendedor` debe dar **exactamente 100**. El sistema lo rechaza si no.
4. **S** Cada cambio **publica una versión nueva**. ⛔ No se edita la vigente.
5. **S** Lo ya devengado conserva la versión con que se calculó.
6. **S** Todo cambio queda registrado con actor, fecha y motivo.

---

## F17 · Cierre de período

1. **A** Administración → **Comisiones** → *Cerrar período*.
2. **S** Verifica: cotizaciones sin resolver, cobros sin confirmar, observaciones abiertas. ◆ Si hay bloqueos, los lista y ⛔ no cierra.
3. **S** Vista previa por vendedor y **por moneda**.
4. ◆ Confirmar (doble confirmación: es irreversible).
5. **S** Genera liquidaciones y comprobantes. Registra.
6. ⛔ Un período cerrado **no se reabre**. Toda corrección es un ajuste en el siguiente.

---

## F18 · Sugerir un producto nuevo

1. **A** Desde Planificar, cuando ninguno de los 13 encaja; o desde un seguimiento.
2. **A** Título · problema en palabras del cliente · cliente y rubro · frecuencia observada · qué producto se queda corto y por qué · adjuntos.
3. **S** Estado `recibida`. Va al backlog del administrador.
4. **A** Administración evalúa y resuelve:
   - `aceptada_para_estudio` — sale del alcance del Escritorio;
   - `rechazada` — motivo obligatorio;
   - `duplicada` — enlaza con la original;
   - `ya_cubierta_por_producto_existente` — ⛔ obliga a nombrar cuál de los 13 y a escribir el argumento, que vuelve al vendedor.
5. ⛔ **Ninguna sugerencia**, en ningún estado, aparece en catálogo, motor, presentaciones ni cotizaciones.

---

## F19 · Accesos y frecuencia de uso

1. **A** Administración → **Accesos y frecuencia de uso**.
2. **S** Por vendedor: último ingreso, ingresos en el período, días sin entrar, planes creados, seguimientos, cotizaciones enviadas.
3. **S** Marca a quien **no entra hace más de N días**.
4. ⛔ Este registro es **sólo lectura**. No se edita ni se borra desde la aplicación.
5. **S** El registro de aperturas de enlaces (§10.1) se consulta **por separado**. ⛔ Nunca se mezclan en una misma lista.

---

## Estados transversales

| Estado | Regla |
|---|---|
| **Cargando** | Esqueletos con la forma del contenido real. Nunca pantalla en blanco. |
| **Vacío** | Explica qué falta **y** ofrece la acción que lo resuelve. En Inicio, el vacío deja las dos acciones protagonistas como lo único accionable. |
| **Error** | Causa en lenguaje claro, sin códigos técnicos, con *Volver a intentar*. Un bloque que falla no tumba la vista. |
| **Con datos** | Importes con moneda; fechas en `es-PY`. |

## Confirmaciones

| # | Regla |
|---|---|
| C1 | Todo lo derivado de voz o texto pasa por confirmación antes de guardarse. |
| C2 | Toda acción irreversible (cerrar período, revocar enlace, borrar audio, reasignar cartera) pide doble confirmación y dice qué se pierde. |
| C3 | Aprobar, corregir y rechazar exigen comentario. |
| C4 | Toda acción sobre dinero deja traza con actor, fecha y motivo. |
