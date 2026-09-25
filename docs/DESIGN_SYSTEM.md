# DESIGN_SYSTEM — Escritorio Vendedores Lab.IA

> **Versión 3.0.** Identidad **Lab.IA**. ⛔ Se descarta la identidad dorada con serif de la referencia operativa.
> **De la referencia se reutiliza la arquitectura operativa, no la identidad visual.**

---

## 0. Qué se hereda y qué no

| Se hereda de la referencia operativa | ⛔ NO se hereda |
|---|---|
| Estructura de navegación: lateral en escritorio, barra inferior en celular | La paleta dorada y azul profundo |
| Patrones de componente: tarjeta, indicador, lista, pestañas, chips, diálogo, aviso | La tipografía serif (Newsreader) |
| Los cuatro estados: cargando / vacío / error / con datos | El monograma y toda marca de terceros |
| Criterios de accesibilidad: foco visible, saltar al contenido, `aria-live`, 44 px | El dominio y sus datos |
| Ruteo por hash y módulos de vista sin framework | El registro de voz dorado/editorial |

---

## 1. Identidad Lab.IA

### 1.1 Los ocho colores oficiales

⛔ **Son los oficiales. No se cambian, no se "ajustan", no se derivan variantes nuevas sin autorización.**

| Hex | Token Lab.IA | Rol |
|---|---|---|
| `#020711` | `--labia-negro-azulado` | Negro azulado |
| `#06162F` | `--labia-navy` | Navy |
| `#0A55D9` | `--azul` | **Relleno y superficie** |
| `#098CFF` | `--azul-texto` | Texto y bordes de acento |
| `#00D9FF` | `--cian` | Acento principal |
| `#12D9FF` | `--cian-claro` | Realce, estado activo |
| `#F2F7FF` | `--texto` | Texto principal |
| `#AEB8C8` | `--texto-2` | Texto de apoyo |

**Tipografía: Inter.** ⛔ Sin serif, en ningún elemento.

### 1.1b El campo azul RGrlk Group

Lab.IA es una unidad de RGrlk Group. Desde el diseño **"Escritorio Lab.IA"**
(Claude Design, 2026-09-19), el Escritorio se apoya en el **campo azul oficial
del grupo**: el degradado que sale del logo maestro. Los ocho colores de arriba
**no cambian** —siguen siendo los de texto, acento y relleno—; el campo agrega
los tonos de **fondo**, que antes no existían.

⛔ El ramp sale del sistema de diseño RGrlk Group (proyecto `8fbd17a3`,
`tokens/colors.css`) y se copia tal cual. No se ajusta.

| Hex | Token | Rol |
|---|---|---|
| `#01021C` | `--rg-abismo` | Viñeteado extremo · **`--bg`** |
| `#030535` | `--rg-campo-hondo` | Borde y base · **`--bg-2`** |
| `#001F6E` | `--rg-navy-real` | Transición |
| `#0033A0` | `--rg-real` | Cuerpo central |
| `#0075FF` | `--rg-real-vivo` | Halo |
| `#33A8FF` | `--rg-flor` | Máxima luminancia |

⛔ **Ninguno de los seis es color de texto.** Son fondo. El texto sigue siendo
`--texto`, `--texto-2`, `--cian` y `--azul-texto`.

`--bg` y `--bg-2` pasaron a apuntar al campo; `#020711` y `#06162F` siguen
declarados en `marca-labia.css` como `--labia-negro-azulado` y `--labia-navy`.
La tabla de contraste de §1.2 se midió contra ellos y **sigue valiendo**: el
campo es más oscuro, así que todo contrasta igual o mejor.

**El activo pendiente.** El sistema RGrlk sirve el campo como imagen
(`brand-field.png`, sacada del logo maestro) con los degradados debajo, de
respaldo. El repositorio tiene hoy **sólo los degradados**: la imagen no se
pudo traer entera (el conector corta la lectura en 256 KB y el PNG es de
1600×1600). Falta incorporarla y apuntar `--campo` a ella.
⛔ Mientras tanto **no se genera un reemplazo**: el degradado sostiene el
aspecto y es del mismo ramp.

### 1.2 Contraste medido

WCAG 2.1, contra los dos fondos:

| Color | vs `#020711` | vs `#06162F` | Veredicto |
|---|---:|---:|---|
| `#0A55D9` azul | **3.18** | **2.85** | ⛔ **NO es color de texto** |
| `#098CFF` azul claro | 5.96 | 5.33 | AA texto |
| `#00D9FF` cyan | 11.88 | 10.63 | AA texto |
| `#12D9FF` cyan claro | 11.91 | 10.65 | AA texto |
| `#F2F7FF` texto | 18.75 | 16.78 | AA texto |
| `#AEB8C8` texto-2 | 10.08 | 9.02 | AA texto |

### 1.3 La regla que más se olvida

> ⛔ **`#0A55D9` es color de RELLENO, no de texto.**
>
> No alcanza AA para texto (3.18) y ni siquiera llega a 3:1 sobre el navy (2.85), así que tampoco sirve para bordes finos ni para íconos informativos.
>
> **Para texto o borde de acento: `#098CFF` o `#00D9FF`.**

Es el error más fácil de cometer con esta paleta, porque `#0A55D9` es el azul que más "se siente Lab.IA" y da ganas de usarlo para todo. Sirve para superficies elevadas, para el relleno de una barra, para un bloque de color. No para leer.

### 1.4 Colores derivados

Todo token de color es **uno de los ocho, o uno de los ocho con transparencia**. ⛔ No se inventa ningún hex nuevo.

```
--superficie:   rgba(6, 22, 47, .72)      navy al 72 %
--superficie-2: rgba(10, 85, 217, .10)    azul al 10 %: tarjeta elevada
--linea:        rgba(174, 184, 200, .16)  texto-2 al 16 %
--linea-acento: rgba(0, 217, 255, .32)    cian al 32 %
--cian-suave:   rgba(0, 217, 255, .14)
--azul-suave:   rgba(10, 85, 217, .18)
```

**Única excepción declarada:** `--peligro` (`#FF6B6B`). La paleta oficial no tiene un color de error, y un estado de error que no se distingue del acento es un error que nadie ve. Queda registrado acá para que se reemplace en cuanto la marca defina el suyo.

### 1.5 Logos e imágenes

Se usan los **archivos oficiales** de Google Drive, inventariados en `docs/INVENTARIO_ACTIVOS.md` con su enlace, versión elegida y estado.

| # | Regla |
|---|---|
| B1 | ⛔ No se redibuja, no se recolorea, no se deforma. `object-fit: contain`. |
| B2 | ⛔ No se genera ningún activo. Lo que falta, se pide. |
| B3 | Los logos de producto en Drive son PNG de 1 a 2 MB: **se optimizan antes de usarlos**. Trece logos sin optimizar son medio segundo de carga en 3G. |
| B4 | ⛔ El logo del producto excluido está en la misma carpeta de Drive que los 13. No se incorpora. |

---

## 2. Tokens

Definición completa: `packages/ui/src/marca-labia.css` (los ocho oficiales) y `packages/ui/src/tokens.css` (los derivados).

⛔ **Ninguna vista escribe un color, una fuente ni una curva literal. Sólo tokens.**

### 2.1 Uso semántico

| Token | Para qué | ⛔ Nunca para |
|---|---|---|
| `--bg` | Fondo de la aplicación | Texto |
| `--superficie`, `--glass` | Tarjetas, campos, barras | Fondo de pantalla completo |
| `--cian` | Acento principal: ruta activa, foco, cifras destacadas, las dos acciones protagonistas | Fondos amplios |
| `--azul` | **Relleno**: superficies elevadas, bloques de color, barras de progreso | ⛔ **Texto, bordes finos, íconos informativos** |
| `--azul-texto` | Texto y bordes de acento secundario | Fondos amplios |
| `--texto` → `--mudo` | Jerarquía descendente | Bordes |
| `--peligro` | Vencidos, errores, acciones destructivas | Estados neutros |
| `--ok` | Confirmación | Acción principal (ésa es `--cian`) |

### 2.2 Reglas

| # | Regla |
|---|---|
| CO1 | ⛔ **Ningún color literal en CSS de vista.** Sólo tokens. |
| CO2 | ⛔ Ningún token de color nuevo sin acuerdo de Sesión 1. |
| CO3 | El color **nunca** es el único portador de información: todo estado lleva texto o ícono. |
| CO4 | Contraste mínimo AA: 4.5:1 texto normal, 3:1 texto grande y bordes de control. |
| CO5 | ⛔ Sin neón excesivo. El sistema es premium y sobrio, no fluorescente. El cyan es acento, no fondo. |
| CO6 | ⛔ `--azul` nunca es color de texto ni de borde fino (§1.3). |

---

## 3. Tipografía — Inter

```css
--fuente: Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
```

Cortes: **400, 500, 600, 700**. Carga con `display=swap` y pila de respaldo completa: si Inter no carga, la pantalla sigue siendo legible.

⛔ **Sin serif.** Ni para títulos, ni para cifras, ni para citas.

| Elemento | Tamaño | Peso |
|---|---|---|
| Título de vista | `clamp(28px, 3.5vw, 44px)` | 600 |
| Clasificación de dato investigado (`verificado` / `inferido` / `no encontrado`) | `11px`, mayúsculas, `letter-spacing: .12em` | 600 |
| Cifra grande (las cuatro de Inicio) | `clamp(32px, 4vw, 48px)` | 600, `font-variant-numeric: tabular-nums` |
| Título de tarjeta | `clamp(18px, 1.6vw, 22px)` | 600 |
| Subtítulo | `clamp(15px, 1.3vw, 18px)` | 400 |
| Cuerpo | `16px` | 400 |
| Secundario | `14px` | 400 |
| Etiqueta (mayúsculas, `letter-spacing: .12em`) | `11px` | 600 |
| Importes en tabla | `15px` mono o `tabular-nums` | 500 |

**Regla de importes:** todo número de dinero usa `font-variant-numeric: tabular-nums` para que las columnas alineen. Un importe que baila entre filas se lee mal y se compara peor.

---

## 4. Las dos acciones protagonistas

Son el elemento visual **dominante** de Inicio. No son botones en una barra: son dos tarjetas grandes.

| Regla | Detalle |
|---|---|
| Tamaño | Mínimo 160 px de alto en escritorio, 120 px en celular. |
| Jerarquía | Ocupan más superficie visual que las cuatro cifras juntas. |
| Contenido | Ícono + título + una línea de ejemplo en lenguaje real (*"Mi amigo tiene una repuestera"*). |
| Acento | Borde y realce en `--cian`; superficie `--glass`. |
| Disposición | Dos columnas en ≥ 768 px; una columna apilada por debajo. |
| Estado vacío | Cuando no hay datos, quedan como **lo único accionable** de la pantalla. |
| Accesibilidad | Son `<a>` o `<button>` reales, enfocables, con área táctil completa. ⛔ No un `div` con `onclick`. |

---

## 5. Componentes

| Componente | Clase | Uso |
|---|---|---|
| Tarjeta | `.tarjeta` | Contenedor de bloque |
| Acción protagonista | `.accion-protagonista` | §4 |
| Cifra | `.cifra` / `.cifra-valor` / `.cifra-pista` | Las cuatro de Inicio, las ocho de Dinero |
| Rejilla | `.rejilla` + modificadores | Auto-fit con `minmax`; ⛔ **siempre `min-width: 0`** en los hijos |
| Lista | `.lista` | Próximos seguimientos, línea de tiempo |
| Ranking | `.ranking` / `.ranking-fila` | Los 13 ordenados, con posición, encaje y motivo |
| Encaje | `.encaje` + `--directo` / `--cercano` / `--adaptable` / `--no-recomendado` | Siempre con **texto**, no sólo color |
| Dato investigado | `.dato` + `--verificado` / `--inferido` / `--no-encontrado` | ⛔ La clasificación se lee **en texto**, nunca sólo por color |
| Confianza | `.confianza` + `--alta` / `--media` / `--baja` | Con texto |
| Calendario | `.calendario` / `.calendario-dia` | Mes de la agenda |
| Cronograma | `.cronograma` dentro de `.cronograma-contenedor` | ⛔ Gantt **siempre** en su contenedor con `overflow-x: auto` propio |
| Entrada de agenda | `.entrada-agenda` + `--atrasada` | El atraso se lee en texto y en días, no sólo en color |
| Botón | `.btn`, `.btn-borde`, `.btn-texto` | Altura mínima 48 px |
| Campo | `.campo` + `.entrada` | Altura mínima 48 px, foco con borde `--cian` |
| Pestañas | `.pestanas` / `.pestana` | `role="tablist"`, navegación con flechas |
| Chips | `.chips` / `.chip` | Filtros con `aria-pressed` |
| Tabla | `.tabla` dentro de `.tabla-contenedor` | ⛔ La tabla **siempre** dentro de un contenedor con `overflow-x: auto` propio |
| Diálogo | `<dialog>` + `.dialogo` | Confirmaciones |
| Aviso | `.aviso` | Mensaje breve, `role="status"` |
| Estados | `.cargando` / `.hueso` · `.vacio` · `.error` | §6 |

### 5.1 Los cuatro estados — obligatorios

| Estado | Regla |
|---|---|
| **Cargando** | Esqueletos con la forma del contenido real. `role="status"`. ⛔ Nunca pantalla en blanco. |
| **Vacío** | Explica qué falta **y** ofrece la acción que lo resuelve. |
| **Error** | Causa en lenguaje claro + *Volver a intentar*. `role="alert"`. ⛔ Sin códigos técnicos. |
| **Con datos** | Importes con moneda; fechas en `es-PY`. |

---

## 6. Navegación

| Ancho | Comportamiento |
|---|---|
| ≥ 900 px | Barra lateral fija de 248 px. Lista las vistas del rol: 5 para vendedor, 6 para administrador. |
| < 900 px | Barra inferior fija de 64 px con **5 destinos**: Inicio · Planificar · Clientes · Propuestas · Más. "Más" despliega Dinero y, si el rol lo permite, Administración. |

**Por qué 5 y no 6:** seis íconos a 360 px dejan áreas táctiles por debajo del mínimo de 44 px. El destino que se agrupa es el menos frecuente en el uso diario.

⛔ La entrada a Administración se oculta para el vendedor **y además** la ruta se bloquea en el ruteo y en la capa de datos. Ocultar un enlace no es proteger.

---

## 7. Responsive — por causa, no por parche

> ⛔ **`overflow-x: hidden` no es una solución.** Esconde el síntoma, deja el problema y rompe el `position: sticky`.

### 7.1 Causas reales de desbordamiento y su corrección

| Causa | Corrección |
|---|---|
| `min-width` mayor que el viewport | Quitarlo o pasarlo a `min-width: 0` |
| Hijo de flex/grid que no encoge | `min-width: 0` en el hijo (es el olvido más común) |
| Tabla ancha | Envolver en `.tabla-contenedor { overflow-x: auto }` — el scroll es de la tabla, ⛔ nunca de la página |
| **Cronograma / Gantt** | Igual: `.cronograma-contenedor { overflow-x: auto }`. Es el elemento más ancho del sistema y el que más tienta a taparlo |
| **Calendario mensual** | Siete columnas fijas con `minmax(0, 1fr)`; a 360 px las celdas muestran densidad, no contenido |
| Palabra o URL larga | `overflow-wrap: anywhere` en el contenedor de texto |
| `padding` sumado a `width: 100%` | `box-sizing: border-box` global |
| Grilla que no baja de columnas | `repeat(auto-fit, minmax(min(260px, 100%), 1fr))` |
| Imagen sin límite | `max-width: 100%; height: auto` |
| Elemento posicionado fuera del flujo | Contenerlo en un padre con `position: relative` |
| `100vw` con barra de scroll visible | Usar `100%` o `100dvw` |

### 7.2 Anchos de validación obligatorios

| Ancho | Qué representa |
|---|---|
| **360 px** | Celular chico. El más exigente para áreas táctiles. |
| **390 px** | Celular de referencia. |
| **768 px** | Tablet vertical. Transición de disposición. |
| **1024 px** | Tablet horizontal / notebook chica. Aparece la lateral. |
| **1440 px** | Escritorio. Contenido limitado a 1240 px. |

### 7.3 Criterio

| # | Regla |
|---|---|
| RS1 | En los cinco anchos: **cero scroll horizontal de página**. |
| RS2 | El único scroll horizontal permitido es el de `.tabla-contenedor`, y es **de la tabla**. |
| RS3 | Una vista que sólo funciona porque hay `overflow-x: hidden` **no está terminada**. |
| RS4 | Se valida con la regla de depuración `* { outline: 1px solid red }` y con `document.documentElement.scrollWidth`. |
| RS5 | Áreas táctiles de 44 × 44 px en los cinco anchos, no sólo en el más cómodo. |

---

## 8. Movimiento

| # | Regla |
|---|---|
| MO1 | Entradas 400 ms, micro-interacciones 180 ms, avisos 250 ms. |
| MO2 | `@media (prefers-reduced-motion: reduce)` anula **toda** animación y transición, y el desplazamiento suave. |
| MO3 | ⛔ Nada se mueve sin motivo. Sin parallax, sin rebotes, sin animación decorativa. |

---

## 9. Accesibilidad

| # | Criterio |
|---|---|
| AC1 | Área táctil mínima **44 × 44 px** en todo control, en los cinco anchos. |
| AC2 | Foco visible: `outline: 2px solid var(--cian); outline-offset: 3px`. ⛔ No se elimina. |
| AC3 | Enlace *"Ir al contenido"* como primer elemento enfocable. |
| AC4 | Un solo `h1` por vista, con `tabindex="-1"`, enfocado al navegar. |
| AC5 | `aria-live="polite"` en regiones que cambian; `role="alert"` en errores. |
| AC6 | Pestañas y radio groups navegables por teclado. |
| AC7 | `<dialog>` nativo: trampa de foco, `Esc` cierra, foco devuelto. |
| AC8 | Íconos decorativos con `aria-hidden`; informativos con etiqueta. |
| AC9 | Contraste AA; el color nunca es el único portador de significado. |
| AC10 | El estado de encaje (`directo` / `cercano` / `adaptable` / `no_recomendado`) se lee **en texto**, no sólo por color. |
| AC11 | Toda la aplicación operable **sólo con teclado**. |
| AC12 | La clasificación de un dato investigado (`verificado` / `inferido` / `no encontrado`) se lee **en texto**. ⛔ Nunca sólo por color. |
| AC13 | El calendario mensual es navegable por teclado, con flechas entre días. |
| AC14 | El cronograma tiene **alternativa en lista**: un Gantt no se lee con lector de pantalla. |

---

## 10. Idioma y formato

| # | Regla |
|---|---|
| L1 | `lang="es-PY"`. |
| L2 | Fechas y números con `Intl`, locale `es-PY`, zona `America/Asuncion`. |
| L3 | Voseo, registro natural paraguayo. |
| L4 | Moneda siempre explícita: `Gs.` para PYG, `USD` para dólares. ⛔ **Nunca un número pelado.** |
| L5 | Mensajes de error en lenguaje claro, sin jerga ni códigos. |
| L6 | El copy de producto se sirve **tal cual**: ni se corrige, ni se acorta, ni se normaliza. |

---

## 11. Marca en la interfaz

| # | Regla |
|---|---|
| B1 | Se usa el **logo oficial de Lab.IA**, desde archivo. |
| B2 | ⛔ No se redibuja, no se recolorea, no se deforma. `object-fit: contain`. |
| B3 | ⛔ No se reutiliza ninguna marca de la referencia operativa. |
| B4 | ⛔ No se generan íconos de producto, ilustraciones ni fotografías. |
| B5 | Mientras el archivo oficial no esté en el repositorio, se muestra **Lab.IA** en texto con Inter 600. ⛔ Nada de un logo provisional generado. |

Detalle de activos: `docs/ASSET_SOURCES.md`.

---

## 12. Reglas para las seis sesiones

| # | Regla |
|---|---|
| S1 | ⛔ Ningún valor literal en CSS de vista: ni color, ni fuente, ni curva. Sólo tokens. |
| S2 | `tokens.css` y `marca-labia.css` los edita **sólo Sesión 1**. |
| S3 | Un token nuevo se pide a Sesión 1; no se agrega por cuenta propia. |
| S4 | Una variante propia de una vista lleva prefijo de vista (`.planificar-…`) y vive en el CSS de esa vista. |
| S5 | Cada vista entrega sus cuatro estados. Sin estado vacío o sin estado de error, **no está terminada**. |
| S6 | Antes de cerrar, cada vista se valida en **360, 390, 768, 1024 y 1440 px**, sin scroll horizontal de página. |
| S7 | ⛔ Prohibido usar `overflow-x: hidden` para tapar un desbordamiento. Se corrige la causa. |
| S8 | ⛔ Prohibido usar `--azul` (`#0A55D9`) como color de texto o de borde fino. |
| S9 | Los logos se toman del inventario (`INVENTARIO_ACTIVOS.md`), optimizados. ⛔ No se generan. |
