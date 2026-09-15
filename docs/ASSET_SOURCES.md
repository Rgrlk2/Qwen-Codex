# ASSET_SOURCES — Escritorio Vendedores Lab.IA

> **Versión 3.0.** Identidad **Lab.IA**.
> 📋 **El inventario real de activos, con enlaces de Drive, versiones y estados, está en [`docs/INVENTARIO_ACTIVOS.md`](INVENTARIO_ACTIVOS.md).**
> Este documento define las **reglas**; aquél, **qué hay y dónde**.
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

### 1.3 Identidad Lab.IA — **completa**

| Elemento | Valor | Estado |
|---|---|---|
| Fondo | `#020711` | **Oficial** |
| Navy | `#06162F` | **Oficial** |
| Azul (⛔ relleno, no texto) | `#0A55D9` | **Oficial** |
| Azul claro | `#098CFF` | **Oficial** |
| Cyan | `#00D9FF` | **Oficial** |
| Cyan claro | `#12D9FF` | **Oficial** |
| Texto | `#F2F7FF` | **Oficial** |
| Texto secundario | `#AEB8C8` | **Oficial** |
| Tipografía | **Inter** | **Oficial** |
| Logo Lab.IA | `Logo_LabIA_T.png` | **Localizado en Drive** |
| Logos de producto | 12 de 13 | **Localizados en Drive** |

Definición: `packages/ui/src/marca-labia.css`. Inventario: `INVENTARIO_ACTIVOS.md`.

⛔ **`#0A55D9` no alcanza AA para texto** (3.18 sobre el fondo, 2.85 sobre el navy). Es color de relleno. Para texto o borde de acento: `#098CFF` o `#00D9FF`.

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
| P10 | Hex de marca "deducidos" de una landing o de una captura | Deducir no es documentar. Los ocho oficiales están en `marca-labia.css`. |
| P10b | Usar `#0A55D9` como color de texto o de borde fino | No alcanza AA (3.18 / 2.85). Es color de relleno. |
| P10c | Incorporar el logo del **producto excluido**, que está en la misma carpeta de Drive que los 13 | Portafolio cerrado. Ver `INVENTARIO_ACTIVOS.md` §3.1. |
| P11 | Fondo blanco corporativo convencional · neón excesivo | `rgrlk-brand-guardian`, prohibiciones explícitas. |
| P12 | Productos adicionales hallados en la web, en cualquier forma | Portafolio cerrado en 13. |

---

## 3. Lo que falta, y por qué no se inventa

**Se buscó en Google Drive.** El acceso funciona y el inventario está en `INVENTARIO_ACTIVOS.md`. ⛔ Nada de esto se marca "pendiente" sin haberlo buscado.

| # | Activo | Estado tras la búsqueda | Mientras no llegue |
|---|---|---|---|
| 1 | **Logo de Park.IA** | ⚠️ **No existe en Drive.** La numeración lo confirma: falta el `3` de las integrales. | El nombre en texto, con Inter 600. ⛔ No se genera. |
| 2 | **Versiones SVG** | No encontradas. Todo es PNG/WebP de 1 a 2 MB. | Se usan los PNG optimizados. ⛔ No se vectoriza a mano. |
| 3 | **Variantes claro/oscuro** de Lab.IA | Hay `Logo_LabIA_T` y `Logo_LabIA_V`; falta confirmar cuál funciona sobre `#020711`. | Se prueba la existente sobre el fondo real. |
| 4 | **Renders y mockups de producto** | No existen como categoría. Lo más cercano: capturas de dashboard. | Composición tipográfica. ⛔ No se generan. |
| 5 | **Datos societarios** (razón social, RUC, domicilio) | No buscados: no son un activo gráfico. | Campo vacío, marcado como pendiente. ⛔ No se supone ninguno. |
| 6 | **Términos y condiciones comerciales** | Idem. | Bloque ausente, marcado. |
| 7 | **Manual de marca completo** (radios, sombras, espaciados) | No encontrado. Los colores y la tipografía ya están. | Se usan los del `DESIGN_SYSTEM.md`. |

### 3.1 Cómo se piden

Formato (SVG para marca e íconos) · variantes (claro/oscuro, horizontal/reducido) · usos permitidos · quién lo aprueba · fecha. ⛔ Un activo sin origen documentado no entra al repositorio.

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
4. Las cadenas `Newsreader`, `Georgia`, `serif` suelto, `i-monograma`, `#E1B864` **no aparecen** en `apps/` ni en `packages/`.
5. Las cadenas de la marca de la referencia **no aparecen** en `apps/`, `packages/` ni `content/`.
6. Los dos archivos de copy conservan su hash original.
7. `--marca-pendiente` vale `0`: los ocho colores oficiales están cargados.
8. Ningún activo de `public/` sin fila en `INVENTARIO_ACTIVOS.md`.
9. El logo del producto excluido **no** está en el repositorio.

Los nueve controles están en `docs/QA_CHECKLIST.md` §7 como bloqueantes de entrega.
