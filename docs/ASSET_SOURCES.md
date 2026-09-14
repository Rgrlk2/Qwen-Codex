# ASSET_SOURCES — Escritorio Vendedores Lab.IA

> **Regla cero: no se inventa ningún activo.** Ni logos, ni íconos de producto, ni ilustraciones, ni fotografías, ni capturas, ni mockups, ni paletas de marca.
> Todo lo que aparece en pantalla tiene que poder señalarse en esta tabla con su origen. Lo que no está acá, **no se usa**.

---

## 1. Inventario de activos disponibles

### 1.1 Copy aprobado — **disponible, congelado**

| Activo | Ruta | Origen | Licencia de uso | Estado |
|---|---|---|---|---|
| Copy 9 soluciones específicas | `content/copy/LabIA_9_Soluciones_Especificas_Copy_Maestro.md` | Entregado por Lab.IA (`/inputs`) | Interno Lab.IA | **Congelado.** Sólo lectura. |
| Copy 4 soluciones integrales | `content/copy/LabIA_4_Soluciones_Integrales_Copy_Maestro.md` | Entregado por Lab.IA (`/inputs`) | Interno Lab.IA | **Congelado.** Sólo lectura. |

Copiados **byte a byte** desde los insumos. Verificación en `content/copy/COPY_LOCK.md`.

### 1.2 Referencia visual — **disponible, sólo lectura**

| Activo | Ruta | Origen | Uso permitido |
|---|---|---|---|
| Escritorio de referencia | `docs/referencia/escritorio-referencia.html` | Entregado en `/inputs` | Referencia de sistema visual y de patrones de interacción. |
| Referencia secundaria | `index.html` en `/inputs` (no incorporado al repositorio) | Entregado en `/inputs` | Consulta de convenciones de `<head>`, manifest e integración con formularios. |

⚠️ La referencia pertenece a un **proyecto y una marca distintos** (escritorio privado de otra persona, dominio real estate). Se hereda **el sistema visual**; no se heredan marca, contenido, dominio ni datos. Ver §2.

### 1.3 Tipografías — **disponibles**

| Fuente | Origen | Cortes usados | Licencia | Notas |
|---|---|---|---|---|
| **Newsreader** | Google Fonts | 300 / 400 / 500, eje óptico 6–72 | SIL Open Font License 1.1 | Títulos. |
| **Archivo** | Google Fonts | 400 / 500 / 600 | SIL Open Font License 1.1 | Cuerpo e interfaz. |
| Pila mono del sistema | Sistema operativo | — | — | `ui-monospace, SFMono-Regular, Menlo, monospace`. Sin descarga. |

Carga igual que la referencia: `fonts.googleapis.com` con `preconnect` a `fonts.gstatic.com` y `display=swap`. **Toda familia declara su pila de respaldo completa**: si la fuente no carga, la pantalla sigue siendo legible.

### 1.4 Íconos — **disponibles, limitados**

SVG en línea, definidos como `<symbol>` en la referencia. Sin biblioteca externa, sin descarga, sin dependencia.

| `id` | Qué representa | Reutilizable |
|---|---|---|
| `i-dia` | Sol / día | ✓ |
| `i-secretaria` | Documento con lista | ✓ |
| `i-consejeria` | Documento con lupa | ✓ |
| `i-asesoria` | Globo de diálogo | ✓ |
| `i-check` | Confirmación | ✓ |
| `i-copiar` | Copiar | ✓ |
| `i-guardar` | Guardar | ✓ |
| `i-mic` | Micrófono / dictado | ✓ |
| `i-enviar` | Enviar | ✓ |
| `i-subir` | Subir archivo | ✓ |
| `i-alerta` | Alerta / error | ✓ |
| `i-monograma` | **Monograma EBA** | ⛔ **NO** — ver §2 |

**Íconos que el Escritorio necesita y la referencia no tiene:** cartera, portafolio, propuestas, dinero, PDF, enlace, aprobación, registro de accesos, sugerencia.
⛔ **No se generan.** Se pide el juego completo a diseño (§4). Hasta entonces, la vista usa el ícono existente más cercano o **texto sin ícono** — nunca un ícono improvisado.

---

## 2. Activos explícitamente prohibidos

| # | Activo | Motivo |
|---|---|---|
| P1 | **Monograma `i-monograma` (EBA)** | Marca personal de otra persona, presente en la referencia. Reutilizarla en un producto de Lab.IA es apropiación de marca ajena. |
| P2 | Nombre, rol y datos de la persona de la referencia | Contenido de ejemplo de otro proyecto. |
| P3 | Cualquier logo de Lab.IA reconstruido, redibujado, vectorizado desde una captura o generado | Regla cero. |
| P4 | Íconos o marcas de los 13 productos generados por nosotros | Regla cero. |
| P5 | Fotografías de comercios, personas o locales | Regla cero. Además, derechos de imagen. |
| P6 | Logos de clientes o de empresas citadas en los ejemplos del copy | Los ejemplos del copy son ilustrativos y algunos nombran empresas reales. No se representan gráficamente. |
| P7 | Capturas de producto simuladas | Un mockup de un panel que no existe es una promesa falsa en material comercial. |
| P8 | Iconografía de terceros no licenciada | Riesgo legal. |
| P9 | Paletas o tipografías "de marca Lab.IA" deducidas de una landing | Deducir no es documentar. Se pide el manual. |
| P10 | **Sentinela** y cualquier producto adicional hallado en la web, en cualquier forma | Portafolio cerrado en 13 (MASTER_SPEC §0 R2). |

---

## 3. Activos pendientes de entrega

Lo que el Escritorio necesita y **hoy no existe en los insumos**. Hasta que llegue, cada fila tiene un comportamiento provisional definido — **ninguno inventa un activo**.

| # | Activo | Para qué | Comportamiento hasta que llegue |
|---|---|---|---|
| 1 | **Logotipo Lab.IA** (SVG, versión clara y oscura) | Barra lateral, cabecera móvil, portada de presentaciones, membrete de PDF | Nombre **Lab.IA** en texto, con `--fuente-titulo`. Espacio reservado con las proporciones finales. |
| 2 | **Isotipo / marca reducida** | Favicon, ícono de aplicación, manifest | Favicon del mismo tipo que usa la referencia: SVG en línea con la inicial sobre el fondo del tema. Sin forma de marca. |
| 3 | **Manual de marca** (paleta, tipografías, usos) | Confirmar o reemplazar los tokens de `DESIGN_SYSTEM.md` | Se usan los tokens de la referencia. El cambio, si viene, es un reemplazo en `packages/ui/src/tokens.css`. |
| 4 | **Juego de íconos faltantes** (§1.4) | Navegación de las seis vistas y del administrador | Ícono existente más cercano o texto sin ícono. |
| 5 | **Plantilla de presentación aprobada** | Presentaciones de venta | Composición tipográfica con el copy aprobado, sin elementos gráficos. |
| 6 | **Membrete y pie legal para PDF** | Cotizaciones y comprobantes | PDF tipográfico con folio, versión y fecha. Sin logo. |
| 7 | **Material de apoyo por producto** (fichas, one-pagers existentes) | Adjuntar desde el portafolio | La ficha muestra sólo el copy aprobado. Sin adjuntos. |
| 8 | **Términos y condiciones comerciales** | Pie de cotización | Bloque ausente, marcado como pendiente en el documento generado. |
| 9 | **Datos societarios de Lab.IA** (razón social, RUC, domicilio) | Encabezado legal de cotizaciones | Campo vacío, marcado como pendiente. ⛔ No se completa con un dato supuesto. |

### 3.1 Cómo pedirlos

Cada activo se solicita con: **formato** (SVG preferido para marca e íconos), **variantes** (claro/oscuro, horizontal/reducido), **usos permitidos**, **quién lo aprueba** y **fecha de entrega**. Un activo sin origen documentado no entra al repositorio.

---

## 4. Reglas de incorporación

| # | Regla |
|---|---|
| I1 | Todo activo que entre al repositorio **se agrega a la tabla §1** con origen, licencia y quién lo aprobó. Sin fila en la tabla, no entra. |
| I2 | ⛔ **Prohibido generar** logos, íconos de marca, ilustraciones, fotografías y capturas simuladas. |
| I3 | ⛔ **Prohibido descargar** activos de landings, redes o buscadores para "usarlos mientras tanto". |
| I4 | Un marcador de posición **se ve como marcador de posición**: espacio reservado o texto. Nunca algo que pueda confundirse con la marca real. |
| I5 | Los activos binarios (imágenes, fuentes locales) van en `apps/*/public/`, nunca embebidos en base64 dentro del código. |
| I6 | Las fuentes se cargan desde Google Fonts como en la referencia. Alojarlas localmente exige verificar la licencia y dejarlo asentado acá. |
| I7 | El copy aprobado **no se edita nunca**, ni para corregir ortografía, puntuación o acentuación. Ver `content/copy/COPY_LOCK.md`. |
| I8 | Los datos de ejemplo se marcan siempre con el chip **"Datos de ejemplo"** de la referencia, mientras la aplicación corra con mock. |

---

## 5. Verificación

Antes de cada entrega:

1. `grep` de rutas de imagen en el código ⇒ **toda ruta tiene fila en §1**.
2. Ningún `<img>`, `background-image` ni `data:image` fuera de lo listado.
3. Ningún archivo binario sin origen documentado.
4. El monograma `i-monograma` **no aparece** en `apps/`.
5. Las cadenas "Sentinela", "Elvio", "Brun Ayala" y "EBA" **no aparecen** en `apps/`, `packages/` ni `content/`.
6. Los dos archivos de copy conservan su hash original (`content/copy/COPY_LOCK.md`).

Los seis controles están en `docs/QA_CHECKLIST.md` §7 como bloqueantes de entrega.
