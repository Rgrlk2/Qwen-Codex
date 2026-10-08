# QA_CHECKLIST — Escritorio Vendedores Lab.IA

> **Versión 3.0.** ⛔ Un ítem marcado ⛔ es **bloqueante**: si falla, no se entrega.
> Cada sesión pasa §1 a §6 sobre lo suyo. §7 lo corre quien integra, sobre el repositorio completo.

---

## 1. Un sistema, dos roles ⛔

| # | Verificación | Cómo |
|---|---|---|
| 1.1 ⛔ | **Una sola aplicación.** No existe `apps/admin` ni ningún segundo `index.html` de app | `ls apps/` ⇒ sólo `escritorio` |
| 1.2 ⛔ | **Un solo login.** Una sola pantalla de ingreso, usuario y contraseña | Inspección |
| 1.3 ⛔ | **Sólo dos roles**: `vendedor` y `administrador` | `grep -rn "supervisor\|auditor" apps/ packages/` ⇒ sin resultados |
| 1.4 ⛔ | El administrador ve **las mismas cinco vistas** del vendedor, más Administración | Ingreso con cada rol |
| 1.5 ⛔ | `#/administracion` bloqueada para el vendedor **en el ruteo y en la capa de datos** | Navegar a la URL directa con rol vendedor ⇒ rechazo, no pantalla en blanco |
| 1.6 ⛔ | Ningún método de administración responde a un vendedor | Llamada directa ⇒ `sin_permiso` |
| 1.7 | Administración es **una vista con secciones**, no nueve pantallas sueltas | Inspección |

---

## 2. Inicio: la planificación es el comienzo ⛔

| # | Verificación |
|---|---|
| 2.1 ⛔ | Muestra las **cuatro cifras**: dinero vendido · dinero cobrado · comisión acumulada · comisión pendiente. |
| 2.2 ⛔ | Muestra **próximos seguimientos**. |
| 2.3 ⛔ | Muestra **las dos acciones protagonistas**: *Investigar una empresa o un profesional que conozco* y *Explorar oportunidades por rubro*. |
| 2.4 ⛔ | Las dos acciones son el **elemento visual dominante**: más superficie que las cuatro cifras juntas. |
| 2.5 ⛔ | Con la cuenta vacía, las dos acciones quedan como **lo único accionable**; las cifras muestran su estado vacío con texto honesto. |
| 2.6 ⛔ | **Sin gráficos decorativos, sin embudos, sin tasas de conversión, sin mezcla de productos.** |
| 2.7 | Las dos acciones son `<a>` o `<button>` reales, enfocables. ⛔ No un `div` con `onclick`. |

---

## 3. Motor de planificación ⛔

| # | Verificación |
|---|---|
| 3.1 ⛔ | **Acepta cualquier rubro escrito.** Probar con: "motel", "gomería", "vivero", "kiosco de barrio", "estudio de arquitectura", "criadero de pollos". ⛔ Ninguna devuelve "no encontrado". |
| 3.2 ⛔ | Un término desconocido se crea como `pendiente_de_revision` y **el motor sigue funcionando**. |
| 3.3 ⛔ | Entrada por **conocido** (nombre + qué hace) funciona con sólo esos dos campos. |
| 3.4 ⛔ | El plan devuelve **los 13 productos ordenados**, exactamente 13 posiciones, sin repetidos. |
| 3.5 ⛔ | Destaca **producto 1, 2 y 3**. |
| 3.6 ⛔ | Marca el **top 10**. |
| 3.7 ⛔ | Cada posición trae su **motivo** no vacío. |
| 3.8 ⛔ | Clasifica el **encaje** en los cuatro niveles: `directo`, `cercano`, `adaptable`, `no_recomendado`. |
| 3.9 ⛔ | En `cercano` y `adaptable`, **explica la adaptación necesaria**. |
| 3.10 ⛔ | Sugiere **combos** con su argumento unificado. |
| 3.11 ⛔ | Entrega **estrategia de entrada**, **argumentos** y **preguntas de confirmación**. |
| 3.12 ⛔ | Los dolores se muestran **como hipótesis**, con su motivo. ⛔ Nunca como hecho verificado. |
| 3.13 ⛔ | ⛔ **Nunca propone un producto fuera de los 13.** |
| 3.14 ⛔ | ⛔ **Nunca inventa un precio.** |
| 3.15 ⛔ | ⛔ **No se limita al mapeo literal** de "Dónde tiene más sentido": razona por operación y por necesidad. |
| 3.16 | El vendedor puede corregir el perfil operativo y el plan se recalcula **mostrando qué cambió**. |
| 3.17 | La taxonomía es **editable y ampliable** desde Configuración comercial. |

---

## 3b. Investigación automática ⛔

| # | Verificación |
|---|---|
| 3b.1 ⛔ | La entrada de **empresa** funciona con **sólo el RUC**. Y con sólo la razón social. Y con sólo el nombre comercial. |
| 3b.2 ⛔ | La entrada de **profesional** funciona con **sólo nombre + profesión**. ⛔ No se piden matrícula ni ciudad. |
| 3b.3 ⛔ | ⛔ **Al vendedor no se le pide que describa el negocio.** No hay formulario de perfil en la entrada. |
| 3b.4 ⛔ | Devuelve los trece datos: actividad · ubicación · canales · sitio web · redes · productos · señales operativas · decisores · tamaño · dolores · productos recomendados · fuentes · fecha. |
| 3b.5 ⛔ | Cada dato trae su **nivel de confianza**. |
| 3b.6 ⛔ | Cada dato se ve como **verificado**, **inferido** o **no encontrado** — ⛔ **en texto**, no sólo por color. |
| 3b.7 ⛔ | `inferido` muestra **el razonamiento**. |
| 3b.8 ⛔ | `no_encontrado` deja el valor **vacío**. ⛔ No se rellena, no se estima. |
| 3b.9 ⛔ | **Tamaño aproximado** sólo aparece con evidencia. |
| 3b.10 ⛔ | Se listan las fuentes consultadas, **incluidas las que fallaron**, con su motivo. |
| 3b.11 ⛔ | **Con las fuentes caídas**: devuelve un plan usable por taxonomía y pide **uno a tres campos**. ⛔ **Nunca un formulario largo vacío.** |
| 3b.12 ⛔ | El vendedor sólo **confirma, corrige o agrega**. |
| 3b.13 ⛔ | Cada corrección **recalcula el plan y muestra qué cambió**. |
| 3b.14 ⛔ | ⛔ **Ninguna clave, token ni endpoint de proveedor en el código del cliente.** `grep -riE "apiKey\|secret\|sk-\|bearer" apps/` ⇒ vacío. |
| 3b.15 ⛔ | La entrada **independiente por rubro** sigue funcionando. |
| 3b.16 | El progreso es visible desde el primer segundo, con las fuentes que se van consultando. |

---

## 3c. Agenda operativa ⛔

| # | Verificación |
|---|---|
| 3c.1 ⛔ | La ruta `#/agenda` existe y está disponible para **vendedor y administrador**. |
| 3c.2 ⛔ | Están las cinco vistas: **Hoy · Semana · Mes · Cronograma · Atrasados**. |
| 3c.3 ⛔ | Hoy muestra **visitas, llamadas, próximos pasos, vencimientos y atrasados**. |
| 3c.4 ⛔ | **La agenda se pobló sola**: hay entradas derivadas de planes, objetivos aceptados, seguimientos, presentaciones, cotizaciones, vencimientos y aperturas de enlace, **sin que nadie las cargue**. |
| 3c.5 ⛔ | Una **apertura de enlace** genera una entrada que dice por qué está. |
| 3c.6 ⛔ | Ajustar una fecha **exige motivo**. |
| 3c.7 ⛔ | ⛔ **No existe borrar.** Se descarta con motivo y queda en la historia. |
| 3c.8 ⛔ | Un atraso **no se oculta ni se reprograma solo**; muestra sus días de atraso. |
| 3c.9 ⛔ | Crear a mano sólo admite **visita, llamada o próximo paso**. |
| 3c.10 ⛔ | **Inicio conserva sólo la lista corta** (3 a 5) y el acceso a Agenda con dos contadores. ⛔ No duplica la agenda. |
| 3c.11 ⛔ | El **cronograma** va en su propio contenedor con `overflow-x: auto`. ⛔ La página no hace scroll horizontal. |
| 3c.12 ⛔ | El cronograma tiene **alternativa en lista** para lector de pantalla. |
| 3c.13 | El calendario mensual es navegable por teclado. |

---

## 4. Portafolio y copy ⛔

| # | Verificación | Cómo |
|---|---|---|
| 4.1 ⛔ | El catálogo tiene **exactamente 13** productos: 9 específicas + 4 integrales | Conteo |
| 4.2 ⛔ | Los 13 ids son los de `MASTER_SPEC.md` §5 | Comparación literal |
| 4.3 ⛔ | Hash del copy intacto | `sha256sum -c content/copy/copy.sha256` |
| 4.4 ⛔ | Ningún slogan, definición, beneficio ni precio hardcodeado en TypeScript | `grep` de frases del copy |
| 4.5 ⛔ | El copy se renderiza **sin cambios**: sin resumir, sin corregir ortografía ni acentuación | Comparación visual |
| 4.6 ⛔ | Precio Vivo **no muestra un eslogan inventado** | Inspección |
| 4.7 ⛔ | No existe método de alta de producto | `grep -rn "crearProducto" packages/compartido` ⇒ vacío |
| 4.8 ⛔ | Ninguna sugerencia aparece en catálogo, motor, presentaciones ni cotizaciones | Prueba de extremo a extremo |
| 4.9 | Las secciones que un producto no tiene **no se muestran**, no se rellenan | Merma IA vs. los demás |

---

## 5. Dinero ⛔

| # | Verificación |
|---|---|
| 5.1 ⛔ | **Ningún importe sin moneda**, en ninguna pantalla, PDF ni exportación. |
| 5.2 ⛔ | **Ninguna suma entre PYG y USD.** Totales agrupados por moneda. |
| 5.3 ⛔ | Ningún **precio de lista** fuera de `COMMERCIAL_RULES.md` §2. |
| 5.4 ⛔ | Un rango se muestra como rango. ⛔ Nunca promediado ni redondeado. |
| 5.5 ⛔ | **Las ocho cifras** están: vendido · cobrado · por cobrar · parte Lab.IA · parte del vendedor · comisión pendiente · comisión pagada · mensualidades vigentes. |
| 5.6 ⛔ | La participación por defecto es **50 / 50**, sobre setup y sobre mensualidad. |
| 5.7 ⛔ | `porcentajeLabIA + porcentajeVendedor === 100` siempre. Publicar otra suma ⇒ rechazo. |
| 5.8 ⛔ | La participación se devenga **sólo contra cobro confirmado**. |
| 5.9 ⛔ | `parteLabIA + parteVendedor === baseCobrada`, misma moneda. |
| 5.10 ⛔ | `mesesParticipacionVendedor` se respeta: pasado el plazo, la mensualidad va 100 % a Lab.IA. |
| 5.11 ⛔ | Toda línea guarda `participacionId` + `participacionVersion`. |
| 5.12 ⛔ | Un período cerrado **no se puede reabrir** desde ninguna ruta. |
| 5.13 ⛔ | El vendedor **no tiene ninguna** ruta de escritura sobre participaciones, líneas ni liquidaciones. |
| 5.14 ⛔ | El **ranking de vendedores es en guaraníes**, no en porcentajes ni puntajes. |
| 5.15 | Los montos se calculan en unidad mínima entera. Sin flotantes en dinero. |
| 5.16 | Los importes usan `tabular-nums`: las columnas alinean. |

---

## 6. Presentación, cotización y aprobación ⛔

### 6.1 Presentación
| # | Verificación |
|---|---|
| 6.1.1 ⛔ | **Sin precio definitivo.** Un rango documentado, si aparece, va marcado como referencia. |
| 6.1.2 ⛔ | **No requiere aprobación.** |
| 6.1.3 | Es personalizada, visual y compartible por PDF y enlace. |

### 6.2 Cotización estructurada
| # | Verificación |
|---|---|
| 6.2.1 ⛔ | **Plantilla genérica.** Se genera para cualquiera de los 13 productos, cualquier variante y cualquier cliente. ⛔ Ningún importe fijado en el código, ninguna propuesta anterior usada como modelo, ningún nombre de cliente en el repositorio. |
| 6.2.2 ⛔ | **Los 25 campos obligatorios de `COMMERCIAL_RULES.md` §6.1 están**: folio · cliente · empresa o profesional · producto · variante · vendedor · emisión · validez · setup de lista · setup especial · ahorro de setup · mensual de lista · mensual especial · ahorro mensual · permanencia mínima · condiciones de instalación · tiempo estimado · aportes del cliente · qué incluye · qué no incluye · bases y condiciones · firma del vendedor · firma del CEO · logos oficiales · logo de la variante. |
| 6.2.3 ⛔ | Falta alguno de los 25 ⇒ ⛔ **no se puede enviar a revisión**, y la interfaz nombra cuáles faltan. |
| 6.2.4 ⛔ | El vendedor escribe **sólo dos importes**: setup especial y mensual especial. ⛔ Los ahorros **no se piden en un formulario**: se calculan. |
| 6.2.5 ⛔ | **Permanencia mínima 12 meses** presente y visible. |
| 6.2.6 ⛔ | **Qué no incluye** ⛔ no puede quedar vacío. |
| 6.2.7 ⛔ | Los **aportes del cliente** (insumo, acceso, cuenta, información, equipo) están, cada uno marcado como bloqueante o no. |
| 6.2.8 ⛔ | En la vista interna puede decir "precio efectivo"; ⛔ **en el PDF del cliente dice "Precio especial"**, nunca "precio verdadero" ni "precio efectivo". |
| 6.2.9 ⛔ | El vendedor **propone** el precio; el sistema muestra al lado el de lista y la desviación en guaraníes y en porcentaje. |
| 6.2.10 ⛔ | Totales **por moneda**. ⛔ Monedas distintas ⇒ error, no total. |
| 6.2.11 ⛔ | **Logos oficiales** de Lab.IA, RGrlk Group y del producto, y el de la variante si existe. ⛔ No generados, no redibujados, no recoloreados, no recortados, sin quitarles el fondo, no deformados: `object-fit: contain`, proporción original. |

### 6.2b Las cuatro alternativas financieras
| # | Verificación |
|---|---|
| 6.2b.1 ⛔ | Las **cuatro** están, con estos cálculos exactos — S = setup especial, M = mensual especial: `A: S + (M × 12)` · `B: S + (M × 12 × 0,90)` · `C: S + (M × 24 × 0,80)` · `D: S + (M × 11 × 0,90)`. |
| 6.2b.2 ⛔ | **B, C y D NO son acumulables.** El cliente elige **una sola**. Probar que no haya forma de combinar dos. |
| 6.2b.3 ⛔ | El descuento se calcula **sobre la mensualidad especial**. ⛔ `setupAPagar === setupEspecial` en las cuatro. |
| 6.2b.4 ⛔ | En **D** el cliente recibe **12 meses de servicio** y paga **11 mensualidades**. |
| 6.2b.5 ⛔ | De cada alternativa se muestran las **diez cifras**: precio total de lista · precio especial sin promoción · descuento adicional · ahorro total · setup a pagar · mensualidades a pagar · meses de servicio · total final · valor mensual efectivo · forma y calendario de pago. |
| 6.2b.6 ⛔ | **Nunca se suman monedas diferentes.** Una base con PYG y USD ⇒ error, no un total. |
| 6.2b.7 ⛔ | **Todos los cálculos se ejecutan de nuevo en el servidor antes de aprobar**, y el resultado del servidor prevalece sobre el del navegador. |
| 6.2b.8 ⛔ | Las cuotas del calendario **suman exactamente** el total final. |
| 6.2b.9 ⛔ | `npm run verificar:calculos` pasa en verde. Probarlo también **rompiendo una fórmula a propósito**: tiene que fallar. |

### 6.3 Aprobación, firmas y circuito
| # | Verificación |
|---|---|
| 6.3.1 ⛔ | El circuito es: **borrador → firma del vendedor → revisión del CEO → aprobación o corrección → firma del CEO → PDF definitivo → enlace para el cliente → respuesta → constancia → avisos**. |
| 6.3.2 ⛔ | ⛔ **Ningún vendedor puede enviar una cotización final sin aprobación.** Probar todos los caminos: botón, URL directa, llamada a la capa de datos. |
| 6.3.2b ⛔ | Al revisar se muestran **los cuatro totales recalculados por el servidor**, la permanencia mínima, los **aportes bloqueantes**, qué incluye y qué no, y si la firma del vendedor está vigente. |
| 6.3.3 ⛔ | `emitirPdfDefinitivo` sobre una cotización no aprobada ⇒ `requiere_aprobacion`. |
| 6.3.4 ⛔ | `enviarAlCliente` sobre una cotización no aprobada ⇒ `requiere_aprobacion`. |
| 6.3.5 ⛔ | **No hay autoaprobación** por tiempo, monto ni antigüedad. |
| 6.3.6 ⛔ | Aprobar, corregir y rechazar **exigen comentario**. |
| 6.3.7 ⛔ | Nadie aprueba su propia cotización. |
| 6.3.8 ⛔ | Una cotización aprobada es inmutable: editarla crea versión nueva, **caduca la aprobación y anula las firmas anteriores**. |
| 6.3.9 | El historial de versiones es completo e inmutable. |
| 6.3.10 ⛔ | La **firma del vendedor** se registra **antes** de enviar a revisión. Sin ella ⇒ `requiere_firma`. |
| 6.3.11 ⛔ | La **firma del CEO** se incorpora **al aprobar**, no antes. |
| 6.3.12 ⛔ | `emitirPdfDefinitivo` sin las **dos** firmas vigentes ⇒ `requiere_firma`. |
| 6.3.13 ⛔ | **La imagen original de la firma del CEO no se expone por ninguna URL pública.** Buscar en el HTML, en el CSS, en el JS servido y en el PDF: no hay ruta ni nombre de archivo que la alcance. |
| 6.3.14 ⛔ | `Firma.referenciaProtegida` **no es una URL** ni un nombre de archivo, y no se puede adivinar. |

### 6.3b Respuesta del cliente, constancia y avisos
| # | Verificación |
|---|---|
| 6.3b.1 ⛔ | El enlace es **privado y único**, y muestra: nombre del cliente · producto y variante · número y versión · alternativas aprobadas con su total · vencimiento · bases y condiciones. |
| 6.3b.2 ⛔ | **Botones de opción (radio), NUNCA casillas múltiples.** Inspeccionar el HTML: `type="radio"`, un solo `name`. Las alternativas son excluyentes. |
| 6.3b.3 ⛔ | Las **seis opciones** están, con su texto exacto (`TEXTOS_OPCION`). |
| 6.3b.4 ⛔ | La **casilla obligatoria** está, con este texto exacto: *"He revisado la opción seleccionada y solicito que Lab.IA continúe con los próximos pasos."* |
| 6.3b.5 ⛔ | Sin la casilla marcada, el botón **Enviar mi elección** queda deshabilitado, y la capa de datos devuelve `validacion`. |
| 6.3b.6 ⛔ | El botón final dice exactamente **"Enviar mi elección"**. |
| 6.3b.7 ⛔ | La **constancia** guarda: cliente · cotización · **versión exacta** · opción · importes aceptados · fecha y hora · vencimiento · texto de aceptación · identificación del enlace · **huella del documento aprobado**. Inmutable. |
| 6.3b.8 ⛔ | La interfaz y el documento dicen que es una **constancia comercial o aval de intención**. ⛔ **Nunca** la palabra "contrato" ni "firma electrónica" para describirla. |
| 6.3b.9 ⛔ | Al recibirla se avisa a los **cuatro destinos**: celular del vendedor · WhatsApp corporativo +595 984 355775 · celular personal del CEO · panel de Administración. |
| 6.3b.10 ⛔ | **El número personal del CEO no aparece** en el enlace, en el PDF ni en el código del navegador. Buscar el número en todo lo servido al cliente: cero coincidencias, ni siquiera en un comentario. |
| 6.3b.11 ⛔ | **Cortar la notificación a propósito**: la constancia queda guardada igual, el aviso queda `pendiente` o `reintentando`, y `constanciaGuardada` sigue en `true`. ⛔ La elección del cliente **no se pierde**. |
| 6.3b.12 ⛔ | Una cotización **vencida** se muestra sin importes y ⛔ **no acepta respuesta**. |
| 6.3b.13 | Doble envío con la misma clave de idempotencia ⇒ **una sola** constancia. |

### 6.4 Seguimiento
| # | Verificación |
|---|---|
| 6.4.1 ⛔ | **Nada derivado de voz o texto se persiste sin confirmación humana.** |
| 6.4.2 ⛔ | Sin soporte de dictado, se informa y se ofrece el camino de texto. ⛔ **Nunca un botón inerte.** |
| 6.4.3 ⛔ | Se avisa explícitamente que se está grabando. |
| 6.4.4 ⛔ | Las menciones fuera de catálogo no generan productos. |
| 6.4.5 | Voz y texto producen la misma entidad y el mismo procesamiento. |
| 6.4.6 | Borrar el audio **no borra** la transcripción ni el seguimiento. |

### 6.5 Enlaces y accesos
| # | Verificación |
|---|---|
| 6.5.1 ⛔ | El token **no deriva** de ningún dato del cliente ni de la propuesta. |
| 6.5.2 ⛔ | La URL pública **no contiene datos personales**. |
| 6.5.3 ⛔ | Revocar corta el acceso al instante. |
| 6.5.4 ⛔ | Enlace vencido, revocado o con tope superado ⇒ **sin contenido alguno**. |
| 6.5.5 ⛔ | Cotización vencida ⇒ se muestra **sin importes**. |
| 6.5.6 ⛔ | `AccesoEnlace` **no guarda** IP completa, user-agent crudo, identificador de dispositivo ni correlación entre enlaces. |
| 6.5.7 ⛔ | Los **dos registros** (aperturas de enlace y uso del sistema) se presentan por separado. ⛔ Nunca en la misma lista. |
| 6.5.8 ⛔ | Ambos registros son append-only: sin edición ni borrado desde la aplicación. |
| 6.5.9 | El PDF es determinístico: mismo insumo ⇒ mismo hash. |

---

## 7. Integración, identidad y responsive ⛔

### 7.1 Integridad
| # | Verificación | Comando |
|---|---|---|
| 7.1.1 ⛔ | Sin productos excluidos | `node scripts/verificar-portafolio.mjs` |
| 7.1.2 ⛔ | Sin roles eliminados | `grep -rn "supervisor\|auditor" apps/ packages/` |
| 7.1.3 ⛔ | Sin la app de administración separada | `ls apps/` |
| 7.1.4 ⛔ | Hash del copy intacto | `sha256sum -c content/copy/copy.sha256` |
| 7.1.5 ⛔ | Sin `any` en `packages/compartido` | `grep -rn ": any\|<any>" packages/compartido/src` |
| 7.1.6 ⛔ | Compila sin errores ni advertencias | `npm run typecheck` |
| 7.1.7 | Sin `console.log` ni `TODO` sin ticket | `grep -rn "console.log\|TODO" apps/ packages/` |
| 7.1.8 ⛔ | Ninguna sesión modificó archivos fuera de su ámbito | `git diff --name-only` contra `PARALLEL_SESSIONS.md` §6 |
| 7.1.9 ⛔ | Las **siete rutas** existen y `#/administracion` está restringida | `npm run verificar:portafolio` |
| 7.1.10 ⛔ | Cada PR de sesión va contra `integracion/escritorio`, nunca contra `main` | Revisión del PR |

### 7.2 Identidad Lab.IA
| # | Verificación | Comando |
|---|---|---|
| 7.2.1 ⛔ | **Sin serif.** Ni Newsreader, ni Georgia, ni `serif` suelto | `npm run verificar:portafolio` |
| 7.2.2 ⛔ | **Sin la paleta dorada** de la referencia | `grep -rni "E1B864\|EFD293\|C79A46\|--oro" apps/ packages/` |
| 7.2.3 ⛔ | **Sin marcas de terceros** | `grep -rni "i-monograma" apps/ packages/ content/` |
| 7.2.4 ⛔ | **Los ocho colores oficiales** están en `marca-labia.css` | `npm run verificar:portafolio` |
| 7.2.5 ⛔ | **Inter** como `--labia-fuente` y `--fuente` la consume | `grep -n "Inter" packages/ui/src/marca-labia.css` |
| 7.2.6 ⛔ | ⛔ **`#0A55D9` no se usa como color de texto ni de borde fino.** Contraste 3.18 / 2.85 | Inspección + herramienta de contraste |
| 7.2.7 ⛔ | Todo color derivado es uno de los ocho, o uno de los ocho con transparencia | Revisión de `tokens.css` |
| 7.2.8 ⛔ | Sin colores literales en CSS de vista | `grep -rEn "#[0-9a-fA-F]{3,8}\|rgba?\(" apps/escritorio/src` ⇒ vacío |
| 7.2.9 ⛔ | Ningún logo redibujado, recoloreado ni deformado | Inspección + `object-fit: contain` |
| 7.2.10 ⛔ | Todo activo binario tiene fila en `INVENTARIO_ACTIVOS.md` con su enlace de Drive | Revisión de `apps/escritorio/public/` |
| 7.2.11 ⛔ | **El logo del producto excluido no entró** al bajar la carpeta de Drive | `grep -rni "centinala" apps/ packages/` ⇒ vacío |
| 7.2.12 | Los logos están **optimizados**: en Drive son PNG de 1 a 2 MB | Revisión de tamaños en `public/` |

### 7.3 Responsive — por causa, no por parche
| # | Verificación | Cómo |
|---|---|---|
| 7.3.1 ⛔ | **`overflow-x: hidden` no se usa para tapar desbordamientos** | `grep -rn "overflow-x: *hidden\|overflow: *hidden" apps/ packages/ui` ⇒ sólo dentro de `.tabla-contenedor` y justificado por escrito |
| 7.3.2 ⛔ | **Cero scroll horizontal de página** en **360, 390, 768, 1024 y 1440 px** | `document.documentElement.scrollWidth <= window.innerWidth` en cada ancho |
| 7.3.3 ⛔ | Todo desbordamiento encontrado se corrige **en su causa**, no con un `hidden` | Revisión del diff |
| 7.3.4 ⛔ | Las tablas hacen scroll **dentro de su contenedor**, no la página | Inspección a 360 px |
| 7.3.5 ⛔ | Áreas táctiles de 44 × 44 px en **los cinco anchos** | Inspección |
| 7.3.6 | Sin `min-width` mayor que el viewport; `min-width: 0` en hijos de flex y grid | Revisión de CSS |
| 7.3.7 | Depuración con `* { outline: 1px solid red }` sin elementos fuera del marco | Inspección visual |

### 7.4 Accesibilidad
| # | Verificación |
|---|---|
| 7.4.1 ⛔ | Toda la aplicación operable **sólo con teclado**. |
| 7.4.2 ⛔ | Foco visible en todo elemento enfocable; el `outline` no se elimina. |
| 7.4.3 ⛔ | Contraste AA: 4.5:1 texto normal, 3:1 texto grande y bordes de control. |
| 7.4.4 ⛔ | El color **nunca** es el único portador de información. El encaje se lee en texto. |
| 7.4.5 ⛔ | `prefers-reduced-motion` anula toda animación. |
| 7.4.6 | Un solo `h1` por vista; jerarquía sin saltos. |
| 7.4.7 | `aria-live="polite"` en regiones que cambian; `role="alert"` en errores. |
| 7.4.8 | `<dialog>` atrapa el foco, `Esc` cierra, el foco vuelve al origen. |

### 7.5 Estados
| # | Verificación |
|---|---|
| 7.5.1 ⛔ | Cada vista y cada bloque asíncrono tiene **cargando**, **vacío** y **error con reintento**. |
| 7.5.2 ⛔ | Un bloque que falla **no tumba la vista**. |
| 7.5.3 ⛔ | Ningún mensaje de error muestra código HTTP, nombre de tabla ni traza. |
| 7.5.4 | El estado de carga aparece antes de los 100 ms; sin parpadeo entre estados. |

---

## 8. Matriz de cobertura por vista

| Verificación | Ingreso | Inicio | Planificar | Clientes | Agenda | Propuestas | Dinero | Admin |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| §7.5 Cuatro estados | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| §7.4 Accesibilidad | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| §7.3 Cinco anchos sin scroll | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| §7.2 Identidad Lab.IA | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| §5 Dinero con moneda | — | ☐ | ☐ | — | — | ☐ | ☐ | ☐ |
| §4 Copy sin alterar | — | — | ☐ | — | — | ☐ | — | ☐ |
| §1 Guardia de rol | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Teclado completo | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Lector de pantalla | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |

---

## 9. Entornos

| Ancho | Qué verificar |
|---|---|
| **360 px** | El más exigente: áreas táctiles, barra inferior de 5 destinos, tablas en su contenedor |
| **390 px** | Celular de referencia |
| **768 px** | Tablet vertical: las dos acciones protagonistas pasan a dos columnas |
| **1024 px** | Aparece la barra lateral |
| **1440 px** | Escritorio: contenido limitado a 1240 px, sin líneas de texto excesivas |

| Entorno | Mínimo |
|---|---|
| Navegadores | Chrome, Safari, Firefox — dos versiones mayores atrás |
| Celular | iOS Safari y Android Chrome reales, no sólo emulador |
| Lector de pantalla | VoiceOver y NVDA |
| Red | 3G simulada para la vista pública del enlace |
| Preferencias | `prefers-reduced-motion: reduce` activado |

---

## 10. Criterio de "terminado"

Una vista está terminada cuando, y sólo cuando:

1. Tiene los cuatro estados, probados (§7.5).
2. Pasa accesibilidad (§7.4) y **los cinco anchos** (§7.3) sin scroll horizontal de página.
3. No incumple ningún ⛔ que le corresponda.
4. Su columna de §8 está completa.
5. No modificó ningún archivo fuera de su ámbito.
6. Compila sin advertencias y sin `any`.

**Una vista sin estado vacío, sin estado de error, o que sólo funciona porque hay `overflow-x: hidden`, no está terminada.** No importa lo bien que se vea con datos en 1440 px.
