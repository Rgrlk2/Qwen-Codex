# DESIGN_SYSTEM — Escritorio Vendedores Lab.IA

> **Fuente:** `docs/referencia/escritorio-referencia.html`, incluida sin modificar.
> Todos los valores de este documento están **transcriptos de esa referencia**. No hay un solo color, tipografía, espaciado ni curva de animación inventado.
> Implementación de los tokens: `packages/ui/src/tokens.css` — **dueño: Sesión 1**. Ninguna otra sesión escribe valores literales.

---

## 0. Qué se hereda y qué no

| Se hereda de la referencia | No se hereda |
|---|---|
| Paleta, tipografías, escala, espaciados, curvas de animación | **El monograma EBA** — es la marca de otra persona (ver `ASSET_SOURCES.md`) |
| Estructura: lateral en escritorio, barra inferior en celular | Los nombres de las vistas de la referencia |
| Patrones de componente: tarjeta, indicador, lista, pestañas, segmentos, zona de carga, compositor | El dominio (real estate) y sus datos |
| Los cuatro estados obligatorios: cargando / vacío / error / con datos | El chip "Datos de ejemplo" **sólo se retira cuando hay datos reales** |
| Accesibilidad: foco visible, saltar al contenido, `aria-live`, área táctil mínima | — |

⚠️ **Decisión abierta.** La paleta de la referencia (azul profundo + oro) es la que se adopta como base de trabajo por ser el insumo entregado. Si la identidad visual de Lab.IA exige otra paleta, **el cambio es un reemplazo de tokens en un solo archivo** y no toca ninguna vista. No se anticipa ese cambio inventando colores de marca. Ver `ASSET_SOURCES.md` §3.

---

## 1. Tokens de color

Transcripción literal de la referencia.

```css
:root{
  /* Fondos */
  --bg:         #040D19;
  --bg-2:       #071322;
  --superficie: #0B1727;
  --superficie-2:#10203A;

  /* Líneas */
  --linea:      rgba(226,235,245,.12);
  --linea-2:    rgba(226,235,245,.22);

  /* Texto */
  --texto:      #F4F1EA;
  --texto-2:    #C6CCD5;
  --texto-3:    #96A0AD;
  --mudo:       #7C8694;

  /* Acento */
  --oro:        #E1B864;
  --oro-claro:  #EFD293;
  --oro-linea:  #C79A46;
  --oro-suave:  rgba(225,184,100,.12);

  /* Estado */
  --ok:             #8FD3A6;
  --peligro:        #F0857A;
  --peligro-suave:  rgba(240,133,122,.12);
}
```

### 1.1 Uso semántico

| Token | Para qué | Nunca para |
|---|---|---|
| `--bg` | Fondo de la aplicación, celdas de indicador | Texto |
| `--superficie` | Tarjetas, campos, mensajes recibidos | Fondo de pantalla |
| `--oro` | Acento, ruta activa, acción principal, cifras destacadas, horas | Fondos amplios |
| `--texto` / `--texto-2` / `--texto-3` / `--mudo` | Jerarquía descendente de texto | Bordes |
| `--peligro` | Vencidos, errores, acciones destructivas | Cualquier estado neutro |
| `--ok` | Confirmación | Acción principal (ésa es `--oro`) |

### 1.2 Reglas

| # | Regla |
|---|---|
| CO1 | **Ningún color literal en código de vista.** Sólo tokens. |
| CO2 | No se agregan tokens de color sin acuerdo de Sesión 1 y registro en este documento. |
| CO3 | El color **nunca** es el único portador de información: todo estado lleva además texto o ícono (ver `QA_CHECKLIST.md` §4). |
| CO4 | Contraste mínimo AA: 4.5:1 en texto normal, 3:1 en texto grande y en bordes de control. |

---

## 2. Tipografía

```css
--fuente-titulo: Newsreader, Georgia, serif;
--fuente-texto:  Archivo, system-ui, -apple-system, sans-serif;
--fuente-mono:   ui-monospace, SFMono-Regular, Menlo, monospace;
```

Fuentes de Google Fonts, cargadas como en la referencia:
`Newsreader` (300, 400, 500, eje óptico 6–72) · `Archivo` (400, 500, 600). Ambas con `display=swap` y con la pila de respaldo completa: **si la fuente no carga, la pantalla sigue siendo legible**.

| Uso | Familia | Notas |
|---|---|---|
| `h1`, `h2`, `h3`, cifras de indicador, título de estado vacío | `--fuente-titulo` | peso 400, `letter-spacing:-.015em`, `line-height:1.1` |
| Cuerpo, controles, listas | `--fuente-texto` | base 17px, `line-height:1.6` |
| Horas, índices de pantalla, numeraciones | `--fuente-mono` | 13px, `letter-spacing:.1em–.16em` |

### 2.1 Escala

| Elemento | Tamaño |
|---|---|
| Título de pantalla (`h1`) | `clamp(34px, 4vw, 56px)` |
| Título de tarjeta (`h2`/`h3`) | `clamp(22px, 1.8vw, 26px)` |
| Subtítulo | `clamp(17px, 1.4vw, 20px)` |
| Cuerpo | `17px` |
| Secundario | `15px` / `14px` |
| Etiqueta (mayúsculas, `letter-spacing:.2em`) | `11px` / `12px` |
| Cifra de indicador | `clamp(40px, 4vw, 54px)` |

**Regla:** los tamaños ya están definidos. No se agregan escalones.

---

## 3. Estructura y espaciado

```css
--lateral:    248px;   /* barra lateral en escritorio */
--inferior:   64px;    /* barra inferior en celular */
--compositor: 96px;    /* compositor fijo de conversación */
--suave: cubic-bezier(.16,.8,.24,1);
```

| Punto de corte | Comportamiento |
|---|---|
| `≥ 900px` | Barra lateral fija a la izquierda; `.principal` con `margin-left: var(--lateral)`; sin barra inferior. |
| `< 900px` | Sin lateral; barra inferior fija de 64px; cabecera móvil con marca y chip de estado. |
| `≤ 480px` | Segmentos en columna; compositor con etiquetas ocultas visualmente; reducción de padding lateral a 16px. |

Padding de contenido: `clamp(28px,4vw,56px)` vertical · `clamp(20px,4vw,56px)` horizontal.
Separación entre bloques de pantalla: `clamp(36px,4vw,56px)`. Dentro de una tarjeta: `14px`.
Ancho máximo de contenido: `1240px`.

### 3.1 Barra inferior y las seis vistas

La referencia usa **4 destinos** en la barra inferior (`grid-template-columns: repeat(4,1fr)`). El Escritorio Vendedores tiene **6**.

**Decisión:** en celular la barra inferior muestra **5 destinos fijos** — Día · Cartera · Portafolio · Propuestas · Más — y "Más" despliega Seguimiento y Dinero. En escritorio la lateral lista las 6 sin agrupar. Motivo: seis íconos en 360px dejan áreas táctiles por debajo del mínimo de 44px, y la referencia es explícita en respetar ese mínimo. **Dueño del cambio: Sesión 1.**

---

## 4. Componentes

Todos existen en la referencia; se reutilizan tal cual. Ninguna sesión inventa un componente nuevo sin acordarlo con Sesión 1.

| Componente | Clase | Uso |
|---|---|---|
| Tarjeta | `.tarjeta` | Contenedor de bloque |
| Rejilla | `.rejilla` + `.rejilla-2/3/4` | Auto-fit con `minmax`; **siempre `min-width:0`** en los hijos |
| Indicadores | `.indicadores` / `.indicador` | Cifras del día; variante `.vacio` cuando no hay dato |
| Lista | `.lista` con `.hora`, `.item-cuerpo`, `.punto`, `.resolver` | Agenda, pendientes, atención |
| Botón | `.btn`, `.btn-borde`, `.btn-texto`, `.btn-chico` | Altura mínima 48px (44px en `chico`) |
| Campo | `.campo` + `.entrada` | Altura mínima 52px; foco con borde `--oro` |
| Pestañas | `.pestanas` / `.pestana` | `role="tablist"`, navegación con flechas |
| Segmentos | `.segmentos` / `.segmento` | Radio group; en `≤480px` pasa a columna |
| Chips | `.chips` / `.chip` | Filtros con `aria-pressed` |
| Zona de carga | `.zona` | Arrastrar y soltar con equivalente por teclado |
| Mensajes | `.mensajes` / `.mensaje` / `.mensaje.mio` | Conversación y seguimiento |
| Compositor | `.compositor` | Fijo al pie; variante `.compositor-local` cuando va en línea |
| Diálogo | `<dialog>` + `.dialogo` | Confirmaciones |
| Aviso | `.aviso` | Mensaje breve, `role="status"`, 3,2 s |
| Definiciones | `.definiciones` | Pares dato/valor |
| Gráfico | `.grafico` | SVG en línea, responsivo, con pie de texto |

### 4.1 Los cuatro estados

Existen como piezas listas en la referencia y son **obligatorios en todo bloque asíncrono**:

| Estado | Pieza | Regla |
|---|---|---|
| Cargando | `.cargando` + `.hueso` + `.rueda` | Esqueletos con la forma del contenido real. `role="status"`. |
| Vacío | `.vacio` | Explica qué falta **y** ofrece la acción que lo resuelve. |
| Error | `.error` | Causa en lenguaje claro + *Volver a intentar*. `role="alert"`. Sin códigos crudos. |
| Con datos | — | Importes con moneda; fechas en `es-PY`. |

---

## 5. Movimiento

```css
.reveal { opacity:0; transform:translateY(18px);
          transition: opacity .6s var(--suave), transform .6s var(--suave); }
.reveal.is-visible { opacity:1; transform:none; }
```

| # | Regla |
|---|---|
| MO1 | Entradas: 600 ms. Micro-interacciones: 180 ms. Aviso: 250 ms. |
| MO2 | `@media (prefers-reduced-motion: reduce)` anula **toda** animación y transición, y desactiva el desplazamiento suave. Ya está en la referencia; **no se debilita**. |
| MO3 | Nada se mueve sin motivo. Sin parallax, sin rebotes, sin animación decorativa. |

---

## 6. Accesibilidad

Criterios de la referencia, obligatorios en las seis vistas y en el administrador.

| # | Criterio |
|---|---|
| AC1 | Área táctil mínima **44×44 px** en todo control. |
| AC2 | Foco visible: `outline: 2px solid var(--oro); outline-offset: 3px`. **No se elimina el outline.** |
| AC3 | Enlace *"Ir al contenido"* (`.saltar`) como primer elemento enfocable. |
| AC4 | Un solo `h1` por pantalla, con `tabindex="-1"`, enfocado al navegar. |
| AC5 | Regiones que cambian: `aria-live="polite"`; errores: `role="alert"`. |
| AC6 | Pestañas y radio groups con navegación completa por teclado. |
| AC7 | `<dialog>` nativo: trampa de foco, `Esc` cierra, foco devuelto al origen. |
| AC8 | Íconos decorativos con `aria-hidden="true"`; íconos informativos con `role="img"` y etiqueta. |
| AC9 | Contraste AA mínimo; el color nunca es el único portador de significado. |
| AC10 | `html,body { max-width:100%; overflow-x:hidden }` y `min-width:0` en hijos de flex/grid: **cero desplazamiento horizontal** a cualquier ancho. |
| AC11 | Texto en `overflow-wrap: anywhere` donde puede entrar contenido del usuario. |

---

## 7. Idioma y formato

| # | Regla |
|---|---|
| L1 | `lang="es-PY"` en el documento. |
| L2 | Fechas y números con `Intl` y locale `es-PY`. Zona `America/Asuncion`. |
| L3 | Voseo y registro de la referencia: *"Preguntá"*, *"Cargá"*, *"Contá qué pasó"*. |
| L4 | Moneda siempre explícita: `Gs.` para PYG, `USD` para dólares. **Nunca un número pelado.** |
| L5 | Mensajes de error en lenguaje claro, sin jerga técnica ni códigos. |
| L6 | El copy de producto **se sirve tal cual** del copy aprobado: ni se corrige, ni se acorta, ni se normaliza. |

---

## 8. Marca

| # | Regla |
|---|---|
| B1 | ⛔ **El monograma de la referencia no se reutiliza.** Es la marca de otra persona. |
| B2 | La marca de Lab.IA para el Escritorio está **pendiente de entrega** (`ASSET_SOURCES.md`). |
| B3 | Mientras tanto: espacio de marca reservado con el nombre en texto, con `--fuente-titulo`. ⛔ Nada de un logo provisional generado. |
| B4 | ⛔ No se generan íconos de producto, ilustraciones ni fotografías. |
| B5 | Los íconos de interfaz son los SVG en línea de la referencia. Si falta uno, se pide; no se inventa una biblioteca. |

---

## 9. Reglas para las seis sesiones

| # | Regla |
|---|---|
| S1 | **Ningún valor literal en CSS de vista**: ni color, ni fuente, ni curva. Sólo tokens. |
| S2 | `packages/ui/src/tokens.css` lo edita **sólo Sesión 1**. |
| S3 | Una sesión que necesita un token nuevo lo pide a Sesión 1; no lo agrega por su cuenta. |
| S4 | Las clases de componente son compartidas y estables. Una variante propia de una vista va con prefijo de vista (`.cartera-…`) en el archivo de esa vista. |
| S5 | Cada vista entrega sus cuatro estados. Una vista sin estado vacío o sin estado de error **no está terminada**. |
| S6 | Antes de cerrar, cada vista pasa `QA_CHECKLIST.md` §2 y §4 a 360px y a 1440px. |
