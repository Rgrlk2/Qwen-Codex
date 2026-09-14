# ASSET_SOURCES — Escritorio Vendedores Lab.IA

> **Versión 2.0.** Identidad **Lab.IA**.
> **Regla cero:** ⛔ no se inventa ningún activo. Ni logos, ni íconos de marca, ni ilustraciones, ni fotografías, ni capturas, ni paletas.
> Todo lo que aparece en pantalla tiene que poder señalarse en esta tabla. Lo que no está acá, **no se usa**.

---

## 1. Activos disponibles

### 1.1 Copy aprobado — **congelado**

| Activo | Ruta | Origen | Estado |
|---|---|---|---|
| Copy 9 soluciones específicas | `content/copy/LabIA_9_Soluciones_Especificas_Copy_Maestro.md` | Entregado por Lab.IA | **Congelado.** Sólo lectura. |
| Copy 4 soluciones integrales | `content/copy/LabIA_4_Soluciones_Integrales_Copy_Maestro.md` | Entregado por Lab.IA | **Congelado.** Sólo lectura. |

Copiados byte a byte. Verificación por hash en `content/copy/COPY_LOCK.md`.

### 1.2 Referencia **operativa** — sólo lectura

| Activo | Ruta | Uso permitido | ⛔ Uso prohibido |
|---|---|---|---|
| Escritorio de referencia | `docs/referencia/escritorio-referencia.html` | **Arquitectura operativa**: estructura de navegación, patrones de componente, los cuatro estados, criterios de accesibilidad, ruteo por hash | **Toda su identidad visual**: paleta dorada, tipografías serif, monograma, dominio y datos |

⚠️ Esta referencia pertenece a **otra marca y otro proyecto**. Se mira cómo está armada, no cómo se ve.

### 1.3 Identidad Lab.IA — parcialmente disponible

| Elemento | Estado | Fuente |
|---|---|---|
| Sistema: dark · navy · cyan · azul · glass · profundidad · premium | **Documentado** | `rgrlk-brand-guardian` |
| Tipografía **Inter** | **Documentado** | `rgrlk-brand-guardian` → "Lab.IA UI: Inter" |
| Fondo navy `rgba(3, 10, 28, .94)` | **Documentado** | `headerproductos` |
| Borde cian sutil, desenfoque 18 px | **Documentado** | `headerproductos` |
| Hex exactos de azul y cyan | **PENDIENTE** | `masivoslabia/references/design-system.md` |
| Logo Lab.IA (archivo) | **PENDIENTE** | Archivo oficial de marca |

### 1.4 Tipografía

| Fuente | Origen | Cortes | Licencia |
|---|---|---|---|
| **Inter** | Google Fonts | 400 / 500 / 600 / 700 | SIL Open Font License 1.1 |
| Pila mono del sistema | Sistema operativo | — | — |

Carga con `display=swap` y pila de respaldo completa: si Inter no carga, la pantalla sigue siendo legible.
⛔ **Sin serif.** Ni Newsreader, ni Georgia, ni ninguna otra.

### 1.5 Íconos

SVG en línea. Sin biblioteca externa, sin descarga, sin dependencia.

**Reutilizables de la referencia operativa** (son formas genéricas, no marca): check, copiar, guardar, micrófono, enviar, subir, alerta, documento con lista, documento con lupa, globo de diálogo.

⛔ **NO reutilizable:** el monograma. Es marca de otra persona (§2 P1).

**Íconos que el Escritorio necesita y no existen:** inicio, planificar/brújula, lupa de investigar, clientes, propuestas, dinero, administración, PDF, enlace, aprobación, ranking.
⛔ **No se generan.** Se piden a diseño. Mientras tanto: el ícono genérico más cercano, o **texto sin ícono**. Nunca un ícono improvisado que parezca de marca.

---

## 2. Activos prohibidos

| # | Activo | Motivo |
|---|---|---|
| P1 | Monograma de la referencia operativa | Marca personal de otra persona. |
| P2 | Nombre, rol y datos de la persona de la referencia | Contenido de otro proyecto. |
| P3 | **La paleta dorada y la tipografía serif de la referencia** | La identidad es Lab.IA: dark/navy, azul y cyan, Inter. |
| P4 | Logo de Lab.IA reconstruido, redibujado, vectorizado desde captura o generado | Regla cero y regla de marca: se usa el archivo. |
| P5 | Logo de Lab.IA recoloreado, deformado o con efectos nuevos | `rgrlk-brand-guardian`: no recolorear, no deformar, `object-fit: contain`. |
| P6 | Íconos o marcas de los 13 productos generados por nosotros | Regla cero. |
| P7 | Fotografías de comercios, personas o locales | Regla cero + derechos de imagen. |
| P8 | Logos de clientes o de empresas citadas en los ejemplos del copy | Los ejemplos son ilustrativos. |
| P9 | Capturas de producto simuladas | Un panel que no existe es una promesa falsa. |
| P10 | Hex de marca "deducidos" de una landing o de una captura | Deducir no es documentar. Se copian del design-system oficial. |
| P11 | Fondo blanco corporativo convencional · neón excesivo | `rgrlk-brand-guardian`, prohibiciones explícitas. |
| P12 | Productos adicionales hallados en la web, en cualquier forma | Portafolio cerrado en 13. |

---

## 3. Activos pendientes

Lo que el Escritorio necesita y hoy no está. Cada fila tiene un comportamiento provisional que ⛔ **no inventa nada**.

| # | Activo | Para qué | Mientras no llegue |
|---|---|---|---|
| 1 | **Hex oficiales de azul y cyan** | `packages/ui/src/marca-labia.css` | La interfaz se ve **monocromática navy**, con respaldo desde la familia `--bg`. Funciona, es legible y **se nota que le falta la marca**. `--marca-pendiente: 1`. |
| 2 | **Logotipo Lab.IA** (SVG, claro y oscuro) | Barra lateral, cabecera, portada de presentaciones, membrete de PDF | **Lab.IA** en texto, Inter 600, con el espacio reservado en las proporciones finales. |
| 3 | **Isotipo / marca reducida** | Favicon, ícono de aplicación | Favicon SVG en línea con la inicial sobre el fondo navy. Sin forma de marca. |
| 4 | **Design-system completo de Lab.IA** | Confirmar radios, sombras, espaciados y breakpoints | Se usan los del sistema definido en `DESIGN_SYSTEM.md`. |
| 5 | **Juego de íconos faltantes** (§1.5) | Navegación de las seis vistas | Ícono genérico más cercano o texto sin ícono. |
| 6 | **Plantilla de presentación aprobada** | Presentaciones para dejar al cliente | Composición tipográfica con el copy aprobado, sin elementos gráficos. |
| 7 | **Membrete y pie legal para PDF** | Cotizaciones y comprobantes | PDF tipográfico con folio, versión y fecha. Sin logo. |
| 8 | **Datos societarios de Lab.IA** (razón social, RUC, domicilio) | Encabezado legal de cotizaciones | Campo vacío, marcado como pendiente. ⛔ No se completa con un dato supuesto. |
| 9 | **Términos y condiciones comerciales** | Pie de cotización | Bloque ausente, marcado como pendiente. |

### 3.1 Cómo se piden

Cada activo se solicita con: **formato** (SVG para marca e íconos), **variantes** (claro/oscuro, horizontal/reducido), **usos permitidos**, **quién lo aprueba** y **fecha**. Un activo sin origen documentado no entra al repositorio.

---

## 4. Reglas de incorporación

| # | Regla |
|---|---|
| I1 | Todo activo que entre **se agrega a la tabla §1** con origen y quién lo aprobó. Sin fila, no entra. |
| I2 | ⛔ **Prohibido generar** logos, íconos de marca, ilustraciones, fotografías y capturas simuladas. |
| I3 | ⛔ **Prohibido descargar** activos de landings, redes o buscadores "para usarlos mientras tanto". |
| I4 | Un marcador de posición **se ve como marcador de posición**. Nunca algo que pueda confundirse con la marca real. |
| I5 | Los binarios van en `apps/escritorio/public/`, ⛔ nunca embebidos en base64 en el código. |
| I6 | Inter se carga desde Google Fonts. Alojarla localmente exige verificar la licencia y asentarlo acá. |
| I7 | ⛔ El copy aprobado **no se edita nunca**, ni para corregir ortografía o acentuación. |
| I8 | Los datos de ejemplo se marcan siempre con el chip **"Datos de ejemplo"** mientras la app corra con mock. |
| I9 | Los logos se usan **desde archivo**, con `object-fit: contain`. ⛔ Sin redibujar, recolorear ni deformar. |

---

## 5. Verificación

Antes de cada entrega:

1. Toda ruta de imagen del código tiene fila en §1.
2. Ningún `<img>`, `background-image` ni `data:image` fuera de lo listado.
3. Ningún binario sin origen documentado.
4. Las cadenas `Newsreader`, `Georgia`, `serif`, `i-monograma`, `#E1B864` **no aparecen** en `apps/` ni en `packages/`.
5. Las cadenas de la marca de la referencia **no aparecen** en `apps/`, `packages/` ni `content/`.
6. Los dos archivos de copy conservan su hash original.
7. Cuando llegue la marca oficial: `--marca-pendiente` pasa a `0` y §3 filas 1 y 2 se mueven a §1.

Los siete controles están en `docs/QA_CHECKLIST.md` §7 como bloqueantes de entrega.
