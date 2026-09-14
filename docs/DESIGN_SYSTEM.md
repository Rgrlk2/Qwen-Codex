# DESIGN_SYSTEM — Escritorio Vendedores Lab.IA

> **Versión 2.0.** Identidad **Lab.IA**. ⛔ Se descarta la identidad dorada con serif de la referencia operativa.
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

Fuente: skills de marca del usuario (`headerproductos`, `masivoslabia`, `rgrlk-brand-guardian`).

| Elemento | Definición |
|---|---|
| **Fondo** | Dark / **navy** |
| **Acentos** | **Azul** y **cyan** |
| **Tipografía** | **Inter** |
| **Sistema** | dark · navy · cyan · azul · glass · profundidad · premium |
| **Logos** | Archivos oficiales. ⛔ No redibujar, no recolorear, no deformar. `object-fit: contain`. |
| **Imágenes** | ⛔ Ninguna inventada. |

### 1.1 Valor documentado

El header Lab.IA usa fondo **`rgba(3, 10, 28, .94)`**, borde cian sutil y desenfoque de 18 px. De ahí sale la base navy del Escritorio: **`#030A1C`**.

### 1.2 Valores que faltan y cómo se resuelven

Los hex exactos de azul y cyan viven en el design-system oficial de Lab.IA (`masivoslabia/references/design-system.md`). ⛔ **No se inventan.**

**Mecanismo:** `packages/ui/src/marca-labia.css` es el archivo donde se copian los valores oficiales. `tokens.css` los consume con respaldo a la familia navy:

```css
--azul:  var(--labia-azul,  #16305C);   /* respaldo navy mientras falta el oficial */
--cian:  var(--labia-cian,  #1E4C74);
```

Mientras `marca-labia.css` esté sin completar, la interfaz se ve **monocromática navy**: funciona, es legible, y **se nota que le falta la marca**. Es deliberado — un respaldo que pareciera la marca real sería peor que uno que no lo parece.

`--marca-pendiente` vale `1` hasta que se carguen los valores oficiales; QA lo verifica (`QA_CHECKLIST.md` §7).

---

## 2. Tokens

```css
:root {
  /* Fondos — navy */
  --bg:            #030A1C;   /* documentado: rgba(3,10,28,.94) */
  --bg-2:          #071328;
  --superficie:    #0B1A33;
  --superficie-2:  #112445;
  --glass:         rgba(11, 26, 51, .72);

  /* Líneas */
  --linea:    rgba(226, 235, 245, .12);
  --linea-2:  rgba(226, 235, 245, .22);
  --linea-cian: var(--labia-cian-linea, rgba(126, 200, 227, .28));

  /* Texto */
  --texto:    #EAF2FB;
  --texto-2:  #B8C7DA;
  --texto-3:  #8497AF;
  --mudo:     #6B7E96;

  /* Acentos — de marca-labia.css */
  --azul:        var(--labia-azul,       #16305C);
  --azul-claro:  var(--labia-azul-claro, #1D4374);
  --cian:        var(--labia-cian,       #1E4C74);
  --cian-claro:  var(--labia-cian-claro, #2A6B9E);
  --acento-suave: var(--labia-acento-suave, rgba(30, 76, 116, .18));

  /* Estado */
  --ok:            #6FCF97;
  --peligro:       #F0857A;
  --peligro-suave: rgba(240, 133, 122, .12);
  --aviso:         #F2C94C;

  /* Tipografía */
  --fuente: Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --fuente-mono: ui-monospace, SFMono-Regular, Menlo, monospace;

  /* Estructura */
  --lateral: 248px;
  --inferior: 64px;

  /* Movimiento */
  --suave: cubic-bezier(.16, .8, .24, 1);

  /* Bandera de marca: 1 = faltan los valores oficiales */
  --marca-pendiente: 1;
}
```

### 2.1 Uso semántico

| Token | Para qué | ⛔ Nunca para |
|---|---|---|
| `--bg` | Fondo de la aplicación | Texto |
| `--superficie`, `--glass` | Tarjetas, campos, barras | Fondo de pantalla completo |
| `--cian` | Acento principal: ruta activa, foco, cifras destacadas, las dos acciones protagonistas | Fondos amplios |
| `--azul` | Acento secundario, superficies elevadas, bordes activos | Texto pequeño |
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
| CO5 | ⛔ Sin neón excesivo. El sistema es premium y sobrio, no fluorescente. |

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
