# USER_FLOWS — Escritorio Vendedores Lab.IA

> Complementa `docs/MASTER_SPEC.md`. Define recorridos, decisiones y estados de cada flujo.
> Convención: **A** = acción del usuario · **S** = respuesta del sistema · **◆** = decisión · **⛔** = bloqueo duro.

---

## 0. Índice

| # | Flujo | Vista principal | Perfil |
|---|---|---|---|
| F1 | Ingreso y apertura del día | Mi Día | vendedor |
| F2 | Alta y planificación de cuenta | Mi Cartera | vendedor |
| F3 | Planificación por rubro | Mi Cartera | vendedor / supervisor |
| F4 | Consulta de portafolio y recomendación | Mi Portafolio | vendedor |
| F5 | Armado de presentación | Mis Propuestas | vendedor |
| F6 | Cotización y aprobación | Mis Propuestas + Admin | vendedor + aprobador |
| F7 | Envío por PDF y enlace | Mis Propuestas | vendedor |
| F8 | Lectura del registro de accesos | Mis Propuestas / Mi Día | vendedor |
| F9 | Seguimiento por voz | Mi Seguimiento | vendedor |
| F10 | Seguimiento por texto | Mi Seguimiento | vendedor |
| F11 | Consulta de dinero y comisiones | Mi Dinero | vendedor |
| F12 | Discrepancia de comisión | Mi Dinero + Admin | vendedor + administrador |
| F13 | Sugerencia de producto nuevo | Mi Portafolio + Admin | vendedor + administrador |
| F14 | Cierre de período y liquidación | Admin | administrador |
| F15 | Publicación de regla de comisión | Admin | administrador |
| F16 | Consulta de auditoría | Admin | administrador / auditor |
| F17 | Apertura del enlace público | Vista pública | cliente final |
| F18 | Reasignación de cartera | Admin | administrador |

---

## F1 · Ingreso y apertura del día

1. **A** El vendedor abre el Escritorio y se autentica.
2. **S** Se registra el ingreso en `RegistroAuditoria` (§12.2 del MASTER_SPEC).
3. **S** Ruta por defecto `#/dia`. Se renderiza el estado **cargando** (esqueletos, nunca pantalla en blanco).
4. **S** Se resuelven en paralelo: indicadores, agenda, pendientes, señales de atención, gráficos.
5. ◆ **¿Hay datos?**
   - **Sí** → render normal.
   - **No** → estado **vacío** con texto útil y una acción concreta (*"Agregá tu primera cuenta"* → F2).
   - **Error** → estado **error** con causa en lenguaje claro y botón *Volver a intentar*; el resto de la pantalla sigue funcionando (un bloque que falla no tumba la vista).
6. **A** El vendedor resuelve un pendiente con un toque.
7. **S** Confirmación breve (aviso al pie), actualización optimista y reversión visible si el servidor rechaza.
8. **A** Opcional: pregunta en el compositor de conversación.
9. **S** Responde **sólo lectura**, citando la fuente del dato. ⛔ No ejecuta acciones ni escribe datos.

---

## F2 · Alta y planificación de cuenta

1. **A** Mi Cartera → *Nueva cuenta*.
2. ◆ **Tipo de cuenta**: `empresa` o `profesional`. Decisión obligatoria, define ficha y discurso.
3. **A** Datos básicos: nombre, contacto, ciudad.
4. **A** **Rubro principal** (obligatorio, de la taxonomía derivada del copy) + calificadores (opcional).
5. **S** Al fijar el rubro, se muestran los **productos recomendados** por mapeo literal contra *"Dónde tiene más sentido"*. Sin scoring.
6. **A** Crear plan de acción para la cuenta:
   - eje = `empresa` o `profesional` (queda fijado por el tipo de cuenta);
   - objetivo en texto;
   - productos objetivo (de los 13);
   - período;
   - meta en dinero **con moneda**, compuesta sólo de precios documentados.
7. ⛔ Si la meta incluye un producto con precio `no_documentado`, el sistema **no calcula el importe**: lo deja marcado *a cotizar* y la meta queda parcial, indicada como tal.
8. **S** Guardado con confirmación. La cuenta aparece en la lista y en la pestaña de su rubro.

---

## F3 · Planificación por rubro

1. **A** Mi Cartera → pestaña **Rubros** → elegir rubro.
2. **S** Muestra: cuentas propias en ese rubro · productos recomendados para el rubro · planes de rubro vigentes.
3. **A** *Nuevo plan de rubro*: objetivo, productos objetivo, período, meta con moneda.
4. **S** Genera **objetivos sugeridos**: cuentas del rubro sin propuesta vigente.
5. ⛔ El plan **no crea cuentas**. El vendedor acepta objetivos de a uno; cada aceptación genera una tarea, no un registro comercial.
6. **A** Cerrar el plan al terminar el período.
7. ◆ **Motivo de cierre obligatorio**: `cumplido` · `parcial` · `descartado` · `reemplazado`.

---

## F4 · Consulta de portafolio y recomendación

1. **A** Mi Portafolio.
2. **S** 13 productos. Filtros: familia (Específicas 9 / Integrales 4 / Todas 13) y rubro.
3. **A** Abrir una ficha.
4. **S** Render del copy aprobado, en el orden del documento fuente, sin una palabra cambiada. Secciones inexistentes en ese producto no se muestran (no se rellenan).
5. **S** Bloque de precio: transcripción literal + etiqueta de estado (`documentado_exacto` / `documentado_rango` / `documentado_desde` / `no_documentado`).
6. ◆ **Si `no_documentado`** → muestra el texto documentado *"Precio oficial no encontrado."* y el camino a cotización personalizada (F6 con ítem *a cotizar*).
7. **A** Acciones: agregar a presentación (F5) · agregar a cotización (F6) · copiar el *"En una frase"*.
8. ⛔ No hay edición de copy ni de precio en ninguna vista del vendedor.

---

## F5 · Armado de presentación

1. **A** Mis Propuestas → **Presentaciones** → *Nueva*.
2. **A** Elegir cuenta destino. **S** Precarga rubro y productos recomendados.
3. **A** Seleccionar productos de los 13 y los casos de uso pertinentes al rubro.
4. **S** Arma las secciones con copy aprobado. Portada con datos de cuenta y vendedor.
5. ◆ **¿Incluir precios?**
   - **No** (por defecto) → material de venta, **sin aprobación**.
   - **Sí** → ⛔ deja de ser presentación a los efectos del control: entra al mismo flujo de aprobación que una cotización (F6). El sistema lo advierte antes de continuar.
6. **A** *Generar salida* → F7.

---

## F6 · Cotización y aprobación

### Parte A — Armado (vendedor)

1. **A** Mis Propuestas → **Cotizaciones** → *Nueva* → elegir cuenta.
2. **A** Agregar ítems: producto (de los 13) + modalidad (`implementacion` / `mensualidad` / `unica_vez` / `prueba`) + cantidad.
3. **S** Trae el precio de lista del catálogo con su moneda y su estado.
4. ◆ **Estado del precio del ítem:**
   - `documentado_exacto` → importe fijo, editable sólo vía descuento.
   - `documentado_rango` → el vendedor elige dentro del rango; fuera del rango ⇒ aprobación obligatoria.
   - `documentado_desde` → piso obligatorio; por debajo ⇒ aprobación obligatoria.
   - `no_documentado` → ítem marcado **a cotizar**, sin importe. ⛔ No se puede enviar al cliente sin aprobación.
5. **S** Totaliza **por moneda**. ⛔ Nunca suma PYG con USD.
6. ◆ **¿El descuento supera el límite autónomo del vendedor?**
   - **No** → puede pasar directo a `aprobada` según parámetro de administración.
   - **Sí** → aprobación obligatoria.
7. **A** *Enviar a aprobación*. **S** Estado `enviada_a_aprobacion`, versión congelada, aprobador asignado, entrada en auditoría.

### Parte B — Resolución (aprobador)

8. **A** Admin → cola de aprobación → abrir la cotización.
9. **S** Muestra: comparación contra lista, descuento pedido, historial del cliente, versiones anteriores, tiempo en cola.
10. ◆ **Decisión** (las tres exigen comentario):
    - `aprobar` → `aprobada`.
    - `rechazar` → `rechazada` (terminal; el vendedor puede clonar para reintentar).
    - `solicitar_cambios` → vuelve a `borrador`, versión +1, historial intacto.
11. ⛔ **Nadie aprueba su propia cotización**, cualquiera sea su rol.
12. ⛔ Vencido el SLA, escala al suplente. **Nunca autoaprueba por tiempo.**
13. **S** Notificación al vendedor + registro en auditoría.

### Parte C — Envío y desenlace

14. **A** Vendedor: *Enviar al cliente* → F7. **S** Estado `enviada_al_cliente`.
15. ◆ Desenlace: `aceptada` · `perdida` (motivo obligatorio) · `vencida` (automática al pasar la vigencia; el enlace deja de mostrar importes).
16. ⛔ Editar una cotización `aprobada` crea versión nueva en `borrador` y **caduca la aprobación anterior**.

---

## F7 · Envío por PDF y enlace

1. **A** Desde una presentación o cotización: *Generar salida*.
2. ◆ **Formato**: PDF · enlace · ambos.
3. **S · PDF**: generación en servidor, determinística, con folio, versión, fecha de emisión y validez embebidos. Inmutable.
4. **S · Enlace**: token opaco. Parámetros: vencimiento, tope de aperturas, revocación, código de acceso opcional.
5. ⛔ El enlace nunca lleva datos personales en la URL.
6. **A** Compartir por el canal que el vendedor use. El sistema entrega el enlace; no envía por sí mismo en esta etapa.
7. **S** Cada emisión queda en auditoría (`RegistroAuditoria`) y habilita el conteo de accesos (`AccesoEnlace`).
8. **A** *Revocar enlace* en cualquier momento. **S** Corte inmediato + registro de quién y cuándo.

---

## F8 · Lectura del registro de accesos

1. **A** Mis Propuestas → ficha de la propuesta → **Accesos**.
2. **S** Lista de aperturas: fecha/hora, tipo de dispositivo, país aproximado, duración si está disponible, resultado (`ok` / `vencido` / `revocado` / `tope_superado`).
3. ⛔ **No se identifica a la persona.** Sin IP completa, sin fingerprinting, sin cruce entre enlaces.
4. **S** Si pasaron N días del envío sin ninguna apertura, se levanta la señal *"enviada sin apertura registrada"* en Mi Día (F1).
5. **A** Desde la señal, el vendedor crea un seguimiento (F9/F10) o una tarea.

---

## F9 · Seguimiento por voz

1. **A** Mi Seguimiento → *Nuevo* → **Dictar**.
2. ◆ **¿El dispositivo soporta dictado?**
   - **No** → ⛔ se informa con texto claro y se ofrece el camino de texto (F10). Nunca un botón inerte.
   - **Sí** → sigue.
3. **S** Pide permiso de micrófono y **avisa explícitamente que está grabando**.
4. **A** Dicta. **S** Muestra la transcripción en vivo y la deja **editable**.
5. **A** *Procesar*.
6. **S** Propone: nota estructurada · pasos con vencimiento · cambio de etapa sugerido · productos mencionados (validados contra los 13) · borrador de respuesta.
7. ◆ **Productos mencionados fuera del catálogo** → se descartan o se ofrecen como **sugerencia de producto nuevo** (F13). ⛔ Nunca se crean como producto.
8. **A** Confirmar qué se guarda, ítem por ítem.
9. ⛔ **Nada se persiste sin esa confirmación.** El sistema propone; la persona guarda.
10. **S** Guarda `Seguimiento` con `origen: "voz"`, audio, transcripción y derivados aceptados. Actualiza la línea de tiempo de la cuenta.
11. **S** El audio queda sujeto a la política de retención; la transcripción le sobrevive.

---

## F10 · Seguimiento por texto

Idéntico a F9 desde el paso 5, con `origen: "texto"`, sin pasos 2–4 y sin audio. **Misma entidad, mismo procesamiento, mismas confirmaciones.** La paridad es un requisito, no una coincidencia.

---

## F11 · Consulta de dinero y comisiones

1. **A** Mi Dinero.
2. **S** Resumen del período, **una fila por moneda**. ⛔ Sin conversión automática.
3. **S** Mensualidades: cuenta, producto, importe documentado, moneda, alta, estado de cobro, meses acumulados.
4. **S** Comisiones línea por línea: origen, base, `reglaId` + `reglaVersion`, factor, importe, estado.
5. **A** Abrir una liquidación cerrada → detalle + comprobante PDF.
6. ⛔ El vendedor **no edita** comisiones, reglas ni liquidaciones.
7. ◆ ¿Hay una línea que no cierra? → F12.

---

## F12 · Discrepancia de comisión

1. **A** Mi Dinero → línea → *Observar*.
2. **A** Motivo y evidencia.
3. **S** Crea una discrepancia `abierta` en la cola del administrador. ⛔ No modifica ningún importe.
4. **A** Admin resuelve: `procede` · `no_procede` · `parcial`. Comentario obligatorio.
5. ◆ **Si procede** → se emite un **ajuste** con motivo y traza. ⛔ **Nunca** se recalcula un período cerrado.
6. **S** El vendedor recibe la resolución y la ve en su detalle.

---

## F13 · Sugerencia de producto nuevo

1. **A** Mi Portafolio → *Sugerir un producto* (o promoción desde F9/F10 paso 7).
2. **A** Título · problema en palabras del cliente · cuenta y rubro · frecuencia observada · qué producto actual se queda corto y por qué · valor percibido (opcional, con moneda, **marcado como estimación del vendedor**) · adjuntos.
3. ⛔ El valor percibido **nunca** se trata como precio ni entra a ninguna cotización.
4. **S** Estado `recibida`. Va al backlog del administrador.
5. **A** Admin evalúa → `en_evaluacion` → resuelve:
   - `aceptada_para_estudio` — sale del alcance del Escritorio, entra al proceso de producto de Lab.IA;
   - `rechazada` — motivo obligatorio;
   - `duplicada` — enlaza con la sugerencia original;
   - `ya_cubierta_por_producto_existente` — ⛔ obliga a nombrar cuál de los 13 y a escribir el argumento comercial, que vuelve al vendedor.
6. ⛔ **Ninguna sugerencia**, en ningún estado, aparece en catálogo, portafolio, presentaciones ni cotizaciones.
7. **S** El administrador ve el backlog agregado por rubro y frecuencia: es el insumo de roadmap.

---

## F14 · Cierre de período y liquidación (administrador)

1. **A** Admin → Dinero → *Cerrar período*.
2. **S** Precondiciones verificadas: sin cotizaciones en cola vencida, sin discrepancias abiertas del período, sin mensualidades con cobro sin confirmar. Si alguna falla, se listan y ⛔ no se cierra.
3. **S** Vista previa de liquidación por vendedor y **por moneda**.
4. ◆ Confirmar cierre (acción irreversible, doble confirmación).
5. **S** Genera liquidaciones, comprobantes PDF y notificaciones. Registro en auditoría.
6. ⛔ Un período cerrado **no se reabre**. Toda corrección posterior es un ajuste en el período siguiente.

---

## F15 · Publicación de regla de comisión (administrador)

1. **A** Admin → Dinero → Reglas → *Nueva versión*.
2. ⛔ **Una regla vigente no se edita.** Sólo se publica una versión nueva con fecha de vigencia.
3. **A** Definir alcance (producto / familia / modalidad / vendedor), factor y vigencia desde.
4. **S** Simulación sobre el período en curso antes de publicar.
5. ◆ Confirmar publicación → queda en auditoría con actor, fecha y diferencias contra la versión anterior.
6. **S** Las comisiones ya devengadas **conservan la versión con la que fueron calculadas**.

---

## F16 · Consulta de auditoría (administrador / auditor)

1. **A** Admin → Registro de accesos.
2. ◆ **Qué registro:** `AccesoEnlace` (material compartido) o `RegistroAuditoria` (sistema). Son dos cosas distintas y la interfaz lo dice.
3. **A** Filtros: actor, acción, entidad, período.
4. **S** Resultado paginado, **sólo lectura**. ⛔ No hay edición ni borrado desde la aplicación.
5. **A** Exportar → ⛔ la exportación se registra a sí misma en auditoría.

---

## F17 · Apertura del enlace público (cliente final)

1. **A** El cliente abre el enlace recibido.
2. ◆ **Validación del token:**
   - `vencido` → mensaje neutro, sin contenido, sin datos de la cuenta;
   - `revocado` → ídem;
   - `tope_superado` → ídem;
   - `ok` → sigue.
3. ◆ **¿Requiere código de acceso?** → se solicita; tras N intentos fallidos se bloquea y se registra.
4. **S** Render de la presentación o cotización. ⛔ Sin navegación al Escritorio, sin otras cuentas, sin precios de otros clientes.
5. ◆ Si la cotización está `vencida` → se muestra el documento **sin importes** y con aviso de vigencia caducada.
6. **S** Registra el acceso en `AccesoEnlace` (sin identificar a la persona).
7. **A** Descargar PDF → se registra la descarga.

---

## F18 · Reasignación de cartera (administrador)

1. **A** Admin → Vendedores → *Reasignar cartera*.
2. **A** Origen, destino, alcance (cuentas puntuales o cartera completa), fecha efectiva.
3. ◆ **Qué pasa con lo en curso** — decisión explícita y obligatoria, sin default silencioso:
   - cotizaciones en cola de aprobación;
   - mensualidades vigentes y su comisión recurrente;
   - planes de acción abiertos;
   - seguimientos y sus pasos pendientes.
4. ⛔ **Las comisiones ya devengadas no se reasignan.** Pertenecen al vendedor que las generó.
5. **S** Ejecuta con traza completa: quién, cuándo, por qué, qué se movió. Notifica a ambos vendedores.

---

## Estados transversales de interfaz

Toda vista y todo bloque asíncrono implementan los cuatro estados. No hay excepciones.

| Estado | Regla |
|---|---|
| **Cargando** | Esqueletos con la forma del contenido real. Nunca pantalla en blanco. Texto de espera honesto. |
| **Vacío** | Explica qué falta **y** ofrece la acción que lo resuelve. Nunca un vacío mudo. |
| **Error** | Causa en lenguaje claro, sin códigos técnicos crudos, con *Volver a intentar*. Un bloque que falla no tumba la vista. |
| **Con datos** | Contenido real. Los importes siempre con moneda; las fechas siempre en `es-PY`. |

## Reglas transversales de confirmación

| # | Regla |
|---|---|
| C1 | Toda acción que persiste datos derivados de voz o texto pasa por diálogo de confirmación. |
| C2 | Toda acción irreversible (cerrar período, revocar enlace, borrar audio, reasignar cartera) pide doble confirmación y explicita qué se pierde. |
| C3 | Toda acción de aprobación o rechazo exige comentario. |
| C4 | Toda acción sobre dinero deja traza con actor, fecha y motivo. |
