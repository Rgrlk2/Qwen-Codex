# QA_CHECKLIST — Escritorio Vendedores Lab.IA

> Lista de verificación de entrega. **Un ítem marcado ⛔ es bloqueante: si falla, no se entrega.**
> Cada sesión pasa §1 a §6 sobre lo suyo. §7 lo corre quien integra, sobre el repositorio completo.

---

## 1. Integridad del portafolio ⛔

| # | Verificación | Cómo |
|---|---|---|
| 1.1 ⛔ | El catálogo tiene **exactamente 13** productos | `listarProductos()` devuelve 13; el mock también |
| 1.2 ⛔ | 9 con `familia: "especifica"`, 4 con `familia: "integral"` | Conteo por familia |
| 1.3 ⛔ | Los 13 ids son exactamente los de MASTER_SPEC §4.1 | Comparación literal contra la lista |
| 1.4 ⛔ | **"Sentinela" no aparece en ningún archivo** | `grep -ri "sentinela" .` ⇒ sólo en documentación, como exclusión |
| 1.5 ⛔ | Ningún producto fuera de los 13 en mocks, fixtures, capturas ni menús | Revisión de `packages/mock` |
| 1.6 | `FARO Inteligente` figura como alias histórico de `faro-digital`, nunca como producto | Inspección del catálogo |
| 1.7 ⛔ | No existe método de alta de producto en la API | `grep -r "crearProducto\|nuevoProducto" packages/compartido` ⇒ sin resultados |
| 1.8 ⛔ | Ninguna sugerencia de producto aparece en catálogo, portafolio, presentaciones ni cotizaciones | Prueba de extremo a extremo |

---

## 2. Estados de interfaz ⛔

Para **cada vista** y **cada bloque asíncrono**:

| # | Verificación |
|---|---|
| 2.1 ⛔ | Estado **cargando** con esqueletos de la forma del contenido real. Nunca pantalla en blanco. |
| 2.2 ⛔ | Estado **vacío** que explica qué falta **y** ofrece la acción que lo resuelve. |
| 2.3 ⛔ | Estado **error** con causa en lenguaje claro y botón *Volver a intentar* que funciona. |
| 2.4 ⛔ | Un bloque que falla **no tumba la vista**: el resto sigue usable. |
| 2.5 | El estado de carga aparece antes de los 100 ms; nada de parpadeo entre estados. |
| 2.6 ⛔ | Ningún mensaje de error muestra código HTTP, nombre de tabla, traza ni jerga técnica. |
| 2.7 | Las acciones optimistas revierten visiblemente si el servidor rechaza. |

**Cómo probarlo:** el mock (`packages/mock`) expone modo de **falla forzada** y **latencia alta**. Los tres estados se prueban sin backend.

---

## 3. Copy aprobado ⛔

| # | Verificación | Cómo |
|---|---|---|
| 3.1 ⛔ | Los dos archivos de copy conservan su hash original | `sha256sum -c` contra `content/copy/COPY_LOCK.md` |
| 3.2 ⛔ | Ningún slogan, definición, beneficio ni caso de uso está hardcodeado en TypeScript | `grep` de frases del copy en `packages/` y `apps/` |
| 3.3 ⛔ | El copy se renderiza **sin cambios**: sin resumir, sin reescribir, sin corregir ortografía ni acentuación | Comparación visual contra el fuente |
| 3.4 ⛔ | Los eslóganes de Smart Commerce y Agendar.IA se muestran **tal cual están escritos**, sin corrección | Inspección literal |
| 3.5 ⛔ | Precio Vivo **no muestra un eslogan inventado**: muestra su propuesta de valor documentada | Inspección de la ficha |
| 3.6 | Las secciones que un producto no tiene **no se muestran**, no se rellenan | Ficha de Merma IA (tiene *¿Qué datos necesita?*) vs. las demás |
| 3.7 | El orden de secciones respeta el documento fuente | Comparación ficha por ficha |

---

## 4. Accesibilidad ⛔

| # | Verificación | Cómo |
|---|---|---|
| 4.1 ⛔ | Área táctil mínima 44×44 px en todo control | Inspección a 360px |
| 4.2 ⛔ | Foco visible en todo elemento enfocable; el `outline` no se elimina | Recorrido completo con `Tab` |
| 4.3 ⛔ | Toda la aplicación es operable **sólo con teclado** | Recorrido sin ratón |
| 4.4 ⛔ | Un solo `h1` por pantalla; jerarquía de encabezados sin saltos | Inspección del árbol |
| 4.5 ⛔ | Contraste AA: 4.5:1 texto normal, 3:1 texto grande y bordes de control | Herramienta de contraste sobre cada token |
| 4.6 ⛔ | El color **nunca** es el único portador de información | Revisión de estados y gráficos |
| 4.7 ⛔ | `prefers-reduced-motion` anula toda animación | Con la preferencia activada |
| 4.8 ⛔ | **Cero desplazamiento horizontal** entre 320px y 1920px | Barrido de anchos |
| 4.9 | `aria-live="polite"` en regiones que cambian; `role="alert"` en errores | Inspección |
| 4.10 | `<dialog>` atrapa el foco, `Esc` cierra, el foco vuelve al origen | Prueba manual |
| 4.11 | Pestañas y radio groups navegables con flechas | Prueba manual |
| 4.12 | Íconos decorativos con `aria-hidden`; informativos con etiqueta | Inspección |
| 4.13 | Enlace *"Ir al contenido"* como primer elemento enfocable | `Tab` desde el inicio |

---

## 5. Dinero ⛔

| # | Verificación |
|---|---|
| 5.1 ⛔ | **Ningún importe sin moneda**, en ninguna pantalla, PDF o exportación. |
| 5.2 ⛔ | **Ninguna suma entre PYG y USD.** Los totales van agrupados por moneda. |
| 5.3 ⛔ | Ningún precio fuera de `COMMERCIAL_RULES.md` §2. |
| 5.4 ⛔ | Un rango se muestra como rango. **Nunca promediado ni redondeado.** |
| 5.5 ⛔ | Smart Commerce y Exeq.IA muestran *"Precio oficial no encontrado."* y van a cotización personalizada. |
| 5.6 ⛔ | Ningún IVA asumido donde el copy no lo documenta: se muestra *"no especificado"*. |
| 5.7 ⛔ | Ningún porcentaje de comisión por defecto. Sin regla vigente ⇒ *"pendiente de regla"*. |
| 5.8 ⛔ | Ninguna conversión de moneda en ninguna capa. |
| 5.9 ⛔ | Toda `LineaComision` guarda `reglaId` + `reglaVersion`. |
| 5.10 ⛔ | Un período cerrado **no se puede reabrir** desde ninguna ruta. |
| 5.11 | Los montos se calculan en unidad mínima entera; sin flotantes en dinero. |
| 5.12 | El vendedor no tiene **ninguna** ruta de escritura sobre comisiones, reglas ni liquidaciones. |

---

## 6. Reglas de negocio ⛔

### 6.1 Aprobación
| # | Verificación |
|---|---|
| 6.1.1 ⛔ | Nadie puede aprobar su propia cotización, con ningún rol. |
| 6.1.2 ⛔ | `aprobar`, `rechazar` y `solicitar_cambios` **exigen** comentario. |
| 6.1.3 ⛔ | Una cotización `aprobada` es inmutable; editarla crea versión nueva y caduca la aprobación. |
| 6.1.4 ⛔ | **No hay autoaprobación por vencimiento de SLA.** |
| 6.1.5 ⛔ | Una cotización que requiere aprobación **no se puede enviar al cliente** sin ella. |
| 6.1.6 | El historial de versiones es completo e inmutable. |

### 6.2 Seguimiento
| # | Verificación |
|---|---|
| 6.2.1 ⛔ | **Nada derivado de voz o texto se persiste sin confirmación humana.** |
| 6.2.2 ⛔ | Sin soporte de dictado, se informa y se ofrece el camino de texto. **Nunca un botón inerte.** |
| 6.2.3 ⛔ | Se avisa explícitamente que se está grabando. |
| 6.2.4 ⛔ | Las menciones fuera de catálogo no generan productos: se descartan o van a sugerencia. |
| 6.2.5 | Voz y texto producen la misma entidad y el mismo procesamiento. |
| 6.2.6 | Borrar el audio **no borra** la transcripción ni el seguimiento. |

### 6.3 Enlaces y accesos
| # | Verificación |
|---|---|
| 6.3.1 ⛔ | El token del enlace **no deriva** de ningún dato del cliente ni de la propuesta. |
| 6.3.2 ⛔ | La URL pública **no contiene datos personales**. |
| 6.3.3 ⛔ | Revocar corta el acceso al instante. |
| 6.3.4 ⛔ | Un enlace vencido, revocado o con tope superado **no muestra contenido alguno**. |
| 6.3.5 ⛔ | Una cotización vencida se muestra **sin importes**. |
| 6.3.6 ⛔ | `AccesoEnlace` **no guarda** IP completa, user-agent crudo, identificador de dispositivo ni correlación entre enlaces. |
| 6.3.7 ⛔ | La vista pública no expone navegación al Escritorio ni datos de otras cuentas. |
| 6.3.8 | El PDF es determinístico: mismo insumo ⇒ mismo hash. |

### 6.4 Auditoría
| # | Verificación |
|---|---|
| 6.4.1 ⛔ | `RegistroAuditoria` y `AccesoEnlace` son append-only: sin edición ni borrado desde la aplicación. |
| 6.4.2 ⛔ | El vendedor ve **sólo sus propios** eventos de auditoría. |
| 6.4.3 ⛔ | La exportación de auditoría se registra a sí misma. |
| 6.4.4 ⛔ | Los dos registros se presentan por separado, nunca mezclados en una lista. |

### 6.5 Planificación
| # | Verificación |
|---|---|
| 6.5.1 ⛔ | Un plan tiene **un solo eje**. |
| 6.5.2 ⛔ | Un plan de rubro **no crea cuentas**. |
| 6.5.3 ⛔ | Cerrar un plan exige motivo. |
| 6.5.4 | La recomendación por rubro es un mapeo literal contra el copy, sin scoring. |

---

## 7. Integración y activos ⛔

Se corre sobre el repositorio completo antes de cada entrega.

| # | Verificación | Comando |
|---|---|---|
| 7.1 ⛔ | Sin "Sentinela" fuera de la documentación de exclusión | `grep -ri "sentinela" apps/ packages/ content/` |
| 7.2 ⛔ | Sin rastros de la marca de la referencia | `grep -ri "elvio\|brun ayala\|i-monograma" apps/ packages/ content/` |
| 7.3 ⛔ | Hash del copy intacto | `sha256sum -c content/copy/COPY_LOCK.md` |
| 7.4 ⛔ | Todo activo binario tiene fila en `ASSET_SOURCES.md` §1 | Revisión de `apps/*/public/` |
| 7.5 ⛔ | Sin `any` en `packages/compartido` | `grep -rn ": any\|<any>" packages/compartido/src` |
| 7.6 ⛔ | Compila sin errores ni advertencias | `npm run typecheck` |
| 7.7 ⛔ | Sin colores literales en CSS de vista | `grep -rEn "#[0-9a-fA-F]{3,8}|rgba?\(" apps/*/src` ⇒ sólo en `tokens.css` |
| 7.8 ⛔ | Ninguna sesión modificó archivos fuera de su ámbito | `docs/PARALLEL_SESSIONS.md` §5 |
| 7.9 | Sin dependencias nuevas sin acuerdo de Sesión 1 | Revisión de `package.json` |
| 7.10 | Sin `console.log` ni `TODO` sin ticket en código entregado | `grep -rn "console.log\|TODO" apps/ packages/` |

---

## 8. Matriz de cobertura por vista

Cada celda se marca sólo si el ítem está probado en esa vista.

| Verificación | Día | Cartera | Portafolio | Propuestas | Seguimiento | Dinero | Admin |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| §2 Cuatro estados | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| §4 Accesibilidad completa | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| §4.8 Sin scroll horizontal (320–1920) | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| §5 Dinero con moneda | ☐ | ☐ | ☐ | ☐ | — | ☐ | ☐ |
| §3 Copy sin alterar | — | — | ☐ | ☐ | — | — | ☐ |
| §6 Reglas de negocio | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Teclado completo | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| Lector de pantalla | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |

---

## 9. Anchos y entornos de prueba

| Ancho | Qué verificar |
|---|---|
| **320px** | Sin scroll horizontal; áreas táctiles de 44px; barra inferior legible |
| **360px** | Referencia de celular; barra inferior de 5 destinos con "Más" |
| **768px** | Tablet; transición de lateral a inferior |
| **900px** | Punto de corte exacto: aparece la lateral, desaparece la inferior |
| **1440px** | Escritorio; contenido limitado a 1240px |
| **1920px** | Sin estiramiento; sin líneas de texto excesivamente largas |

| Entorno | Mínimo |
|---|---|
| Navegadores | Chrome, Safari, Firefox — dos versiones mayores atrás |
| Celular | iOS Safari y Android Chrome reales, no sólo emulador |
| Lector de pantalla | VoiceOver (iOS/macOS) y NVDA (Windows) |
| Red | 3G simulada para la vista pública del enlace |
| Preferencias | `prefers-reduced-motion: reduce` activado |

---

## 10. Criterio de "terminado"

Una vista está terminada cuando, y sólo cuando:

1. Los cuatro estados están implementados y probados (§2).
2. Pasa accesibilidad completa (§4) a 360px y a 1440px.
3. No incumple ningún ⛔ de §1, §3, §5, §6 y §7 que le corresponda.
4. Su columna de §8 está completa.
5. No modificó ningún archivo fuera de su ámbito (`PARALLEL_SESSIONS.md` §5).
6. Compila sin advertencias y sin `any`.

**Una vista sin estado vacío o sin estado de error no está terminada.** No importa lo bien que se vea con datos.
