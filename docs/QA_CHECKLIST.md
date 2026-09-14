# QA_CHECKLIST — Escritorio Vendedores Lab.IA

> **Versión 2.0.** ⛔ Un ítem marcado ⛔ es **bloqueante**: si falla, no se entrega.
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

### 6.2 Cotización
| # | Verificación |
|---|---|
| 6.2.1 ⛔ | Están **todos** los campos: setup · mensualidad · descuento de implementación · débito automático · compromiso de doce meses · pago anual anticipado · alcance · vigencia · cronograma · condiciones. |
| 6.2.2 ⛔ | El vendedor **propone** el precio; el sistema muestra al lado el de lista y la desviación. |
| 6.2.3 ⛔ | Totales **por moneda**. |

### 6.3 Aprobación — el circuito
| # | Verificación |
|---|---|
| 6.3.1 ⛔ | El circuito es: **borrador → revisión del administrador → aprobada o corregida → PDF definitivo → envío al cliente**. |
| 6.3.2 ⛔ | ⛔ **Ningún vendedor puede enviar una cotización final sin aprobación.** Probar todos los caminos: botón, URL directa, llamada a la capa de datos. |
| 6.3.3 ⛔ | `emitirPdfDefinitivo` sobre una cotización no aprobada ⇒ `requiere_aprobacion`. |
| 6.3.4 ⛔ | `enviarAlCliente` sobre una cotización no aprobada ⇒ `requiere_aprobacion`. |
| 6.3.5 ⛔ | **No hay autoaprobación** por tiempo, monto ni antigüedad. |
| 6.3.6 ⛔ | Aprobar, corregir y rechazar **exigen comentario**. |
| 6.3.7 ⛔ | Nadie aprueba su propia cotización. |
| 6.3.8 ⛔ | Una cotización aprobada es inmutable: editarla crea versión nueva y **caduca la aprobación**. |
| 6.3.9 | El historial de versiones es completo e inmutable. |

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
| 7.1.8 ⛔ | Ninguna sesión modificó archivos fuera de su ámbito | `git diff --name-only` contra `PARALLEL_SESSIONS.md` §5 |

### 7.2 Identidad Lab.IA
| # | Verificación | Comando |
|---|---|---|
| 7.2.1 ⛔ | **Sin serif.** Ni Newsreader, ni Georgia, ni `serif` | `grep -rn "Newsreader\|Georgia\|serif" apps/ packages/` |
| 7.2.2 ⛔ | **Sin la paleta dorada** de la referencia | `grep -rni "E1B864\|EFD293\|C79A46\|--oro" apps/ packages/` |
| 7.2.3 ⛔ | **Sin marcas de terceros** | `grep -rni "i-monograma" apps/ packages/ content/` |
| 7.2.4 ⛔ | Tipografía **Inter** en el token de fuente | `grep -n "Inter" packages/ui/src/tokens.css` |
| 7.2.5 ⛔ | Sin colores literales en CSS de vista | `grep -rEn "#[0-9a-fA-F]{3,8}\|rgba?\(" apps/escritorio/src` ⇒ vacío |
| 7.2.6 ⛔ | Ningún logo redibujado, recoloreado ni deformado | Inspección + `object-fit: contain` |
| 7.2.7 | `--marca-pendiente` vale `0` sólo cuando los hex oficiales están en `marca-labia.css` | `grep -n "marca-pendiente" packages/ui/src/*.css` |
| 7.2.8 ⛔ | Todo activo binario tiene fila en `ASSET_SOURCES.md` §1 | Revisión de `apps/escritorio/public/` |

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

| Verificación | Ingreso | Inicio | Planificar | Clientes | Propuestas | Dinero | Admin |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| §7.5 Cuatro estados | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| §7.4 Accesibilidad | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| §7.3 Cinco anchos sin scroll | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| §7.2 Identidad Lab.IA | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| §5 Dinero con moneda | — | ☐ | ☐ | — | ☐ | ☐ | ☐ |
| §4 Copy sin alterar | — | — | ☐ | — | ☐ | — | ☐ |
| §1 Guardia de rol | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Teclado completo | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Lector de pantalla | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |

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
