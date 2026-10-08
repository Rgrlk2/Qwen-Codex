# PARALLEL_SESSIONS — Seis sesiones, seis ramas, cero esperas

> **Versión 3.0.** Paralelismo real: las seis sesiones arrancan **desde el mismo commit base**, cada una en **su propia rama**, y abren PR contra una **rama de integración**.
> ⛔ **Ninguna sesión espera a otra.** Todo lo que se necesita para trabajar está congelado en la base.
> ⛔ Ninguna sesión implementa una especificación anterior. Las vistas `dia`, `cartera`, `portafolio`, `seguimiento` y la app `apps/admin` **no existen**.

---

## 1. Lo que está congelado en la base

**El commit base contiene todo lo que las seis sesiones necesitan para no depender unas de otras.** Ésta es la única razón por la que el paralelismo funciona.

| # | Congelado en la base | Dónde | Por qué elimina una espera |
|---|---|---|---|
| 1 | **Contratos** | `packages/compartido/src/api.ts` | Cada sesión programa contra el tipo, aunque el dato todavía no exista. |
| 2 | **Tipos compartidos** | `packages/compartido/src/*.ts` | Nadie define dos veces la misma entidad. |
| 3 | **Registro de rutas** | `apps/escritorio/src/nucleo/rutas.ts` | Las siete rutas y sus roles ya están. Nadie lo edita. |
| 4 | **Catálogo de 13 productos** | `packages/compartido/src/catalogo.ts` | Los ids son estables desde el minuto cero. |
| 5 | **Referencias del copy** | `content/copy/` + `COPY_LOCK.md` | Congelado por hash. Se lee, no se toca. |
| 6 | **Identidad oficial** | `packages/ui/src/marca-labia.css` | Los ocho colores y Inter ya están cargados. ⛔ **S2 ya no es un cuello de botella de color.** |
| 7 | **Inventario de activos** | `docs/INVENTARIO_ACTIVOS.md` | Cada sesión sabe qué logo usar y de dónde bajarlo. |
| 8 | **Interfaces del motor de investigación** | `packages/compartido/src/investigacion.ts` | S4 y S5 conocen la forma de una investigación sin esperar a S3. |
| 9 | **Taxonomía semilla** | `content/taxonomia/` | S4 tiene actividades con las que trabajar desde el día uno. |
| 10 | **Tokens y estados base** | `packages/ui/src/tokens.css`, `base.css` | Las clases y los cuatro estados están declarados. |

⛔ **Si una sesión necesita algo que no está en esta lista y no es suyo, es un defecto de la base, no una espera legítima.** Se abre pedido (§6) y se sigue trabajando.

---

## 2. Ramas

```
main
 └── claude/escritorio-vendedores-spec-cy64y2      ← COMMIT BASE (este PR)
      │
      └── integracion/escritorio                   ← rama de integración
           ├── sesion/1-nucleo-autenticacion
           ├── sesion/2-interfaz-inicio
           ├── sesion/3-motor-investigacion
           ├── sesion/4-clientes-agenda
           ├── sesion/5-propuestas-cotizaciones
           └── sesion/6-finanzas-administracion
```

### 2.1 Las ramas ya existen

**Las siete ramas están creadas y empujadas**, todas apuntando al mismo commit base. Cada sesión sólo tiene que hacer `git checkout` de la suya y empezar.

```bash
git fetch origin
git checkout sesion/3-motor-investigacion     # la que le toque
```

⛔ **El punto de referencia es `integracion/escritorio`, no un SHA.** Si hay que rebasar, se rebasa contra esa rama.

| # | Regla |
|---|---|
| R1 | Las seis ramas salen **del mismo commit base**, al mismo tiempo. Ya están creadas (§2.1). |
| R2 | Cada sesión trabaja **sólo** en su rama. |
| R3 | Cada sesión abre **un PR contra `integracion/escritorio`**, nunca contra `main`. |
| R4 | ⛔ **Ninguna sesión hace merge de la rama de otra.** |
| R5 | ⛔ **Ninguna sesión espera a otra para empezar.** |
| R6 | La integración a `main` es una decisión posterior, con las seis ramas mergeadas y QA §7 en verde. |

### 2.2 Por qué ya no hay esperas

En la versión anterior decía *"S4 y S5 esperan a S3"* y *"S2 publica tokens temprano"*. **Eso no era paralelismo: era una fila.** Se eliminó así:

| Espera anterior | Cómo se eliminó |
|---|---|
| S4, S5, S6 esperaban los tokens de S2 | Los ocho colores oficiales y Inter **ya están en la base**. |
| S4 esperaba la taxonomía de S3 | La **taxonomía semilla** está en la base, con 71 términos. |
| S5 esperaba el catálogo de S3 | El **catálogo de 13 ids** está en la base. |
| S2 esperaba las cifras de S6 y los seguimientos de S4 | Cada sesión trabaja **contra su mock propio**; la integración cablea los reales. |
| S4 y S5 esperaban la forma de una investigación | `investigacion.ts` está en la base. |

**El mock es lo que hace posible el paralelismo.** Cada sesión tiene su archivo de datos de ejemplo y no toca el de nadie.

---

## 3. Reparto

| Sesión | Rama | Alcance | Rutas |
|---|---|---|---|
| **S1** | `sesion/1-nucleo-autenticacion` | Núcleo y autenticación | `#/ingreso` |
| **S2** | `sesion/2-interfaz-inicio` | Interfaz e inicio | `#/inicio` |
| **S3** | `sesion/3-motor-investigacion` | **Motor de planificación e investigación automática** | `#/planificar` |
| **S4** | `sesion/4-clientes-agenda` | **Clientes, voz, seguimiento y agenda** | `#/clientes` · `#/agenda` |
| **S5** | `sesion/5-propuestas-cotizaciones` | Presentaciones y cotizaciones estructuradas | `#/propuestas` |
| **S6** | `sesion/6-finanzas-administracion` | Finanzas y administración | `#/dinero` · `#/administracion` |

---

## 4. Ámbitos exactos

⛔ **Un archivo tiene un solo dueño.** Lo que no está en tu lista, no es tuyo.

### S1 · Núcleo y autenticación
```
package.json · tsconfig.base.json · .gitignore · .editorconfig · .nvmrc · README.md
packages/compartido/**
packages/mock/{package.json,tsconfig.json,src/index.ts,src/nucleo.ts,src/datos-sesion.ts}
apps/escritorio/{package.json,tsconfig.json,vite.config.ts}
apps/escritorio/src/main.ts
apps/escritorio/src/nucleo/{rutas,guardia-rol,contrato-vista,formato}.ts
apps/escritorio/src/datos/**
apps/escritorio/src/vistas/ingreso/**
scripts/**
```

### S2 · Interfaz e inicio
```
packages/ui/**
apps/escritorio/index.html
apps/escritorio/public/**
apps/escritorio/src/nucleo/{disposicion,estados}.ts
apps/escritorio/src/vistas/inicio/**
packages/mock/src/datos-inicio.ts
```

### S3 · Motor de planificación e investigación
```
apps/escritorio/src/vistas/planificar/**
packages/mock/src/datos-motor.ts
packages/mock/src/datos-investigacion.ts
content/taxonomia/**
```

### S4 · Clientes, voz, seguimiento y agenda
```
apps/escritorio/src/vistas/clientes/**
apps/escritorio/src/vistas/agenda/**
packages/mock/src/datos-clientes.ts
packages/mock/src/datos-agenda.ts
```

### S5 · Presentaciones y cotizaciones
```
apps/escritorio/src/vistas/propuestas/**
packages/mock/src/datos-propuestas.ts
```

### S6 · Finanzas y administración
```
apps/escritorio/src/vistas/dinero/**
apps/escritorio/src/vistas/administracion/**
packages/mock/src/datos-finanzas.ts
```

---

## 5. Zonas congeladas

| Zona | Estado | Quién puede cambiarla |
|---|---|---|
| `content/copy/**` | ⛔ **Congelado permanente** | **Nadie.** Sólo Lab.IA con un copy aprobado nuevo. |
| `packages/compartido/src/**` | 🔒 Congelado en la base | Sólo S1, por pedido formal. |
| `apps/escritorio/src/nucleo/rutas.ts` | 🔒 Completo desde la base | Nadie. Ya trae las siete rutas y sus roles. |
| `packages/ui/src/marca-labia.css` | 🔒 Colores oficiales | Sólo S2, y sólo si la marca cambia. |
| `docs/**` | 🔒 Congelado | Sólo S1, con acuerdo previo. |
| `docs/INVENTARIO_ACTIVOS.md` | 🔒 | Sólo S2, al incorporar activos. |
| `docs/referencia/escritorio-referencia.html` | ⛔ Congelado permanente | Nadie. Es el insumo original. |

---

## 6. Verificación de límites

Antes de abrir el PR, **cada sesión** corre esto y adjunta la salida:

```bash
git diff --name-only origin/integracion/escritorio...HEAD
npm run verificar
```

**Toda ruta listada tiene que estar en el ámbito de la sesión.** Una sola ruta fuera del ámbito es un rechazo del PR, aunque el cambio sea correcto: rompe la garantía de no-conflicto para las otras cinco.

| Sesión | Prefijos permitidos |
|---|---|
| S1 | `package.json`, `tsconfig.base.json`, `.gitignore`, `.editorconfig`, `.nvmrc`, `README.md`, `packages/compartido/`, `packages/mock/{package.json,tsconfig.json,src/index.ts,src/nucleo.ts,src/datos-sesion.ts}`, `apps/escritorio/{package.json,tsconfig.json,vite.config.ts}`, `apps/escritorio/src/main.ts`, `apps/escritorio/src/nucleo/{rutas,guardia-rol,contrato-vista,formato}.ts`, `apps/escritorio/src/datos/`, `apps/escritorio/src/vistas/ingreso/`, `scripts/` |
| S2 | `packages/ui/`, `apps/escritorio/index.html`, `apps/escritorio/public/`, `apps/escritorio/src/nucleo/{disposicion,estados}.ts`, `apps/escritorio/src/vistas/inicio/`, `packages/mock/src/datos-inicio.ts` |
| S3 | `apps/escritorio/src/vistas/planificar/`, `packages/mock/src/datos-motor.ts`, `packages/mock/src/datos-investigacion.ts`, `content/taxonomia/` |
| S4 | `apps/escritorio/src/vistas/clientes/`, `apps/escritorio/src/vistas/agenda/`, `packages/mock/src/datos-clientes.ts`, `packages/mock/src/datos-agenda.ts` |
| S5 | `apps/escritorio/src/vistas/propuestas/`, `packages/mock/src/datos-propuestas.ts` |
| S6 | `apps/escritorio/src/vistas/dinero/`, `apps/escritorio/src/vistas/administracion/`, `packages/mock/src/datos-finanzas.ts` |

---

## 7. Protocolo de pedido de cambio

1. ⛔ **No se edita** un archivo ajeno. Ni "rapidito", ni "sólo una línea".
2. Se abre un pedido en `docs/PEDIDOS.md`, cada sesión en **su propia sección**:

```
### [S4] 2026-09-20 — Falta la operación "atiende por WhatsApp"
Archivo: content/taxonomia/operaciones.md   (dueña: S3)
Necesito: la ficha de cliente muestra las operaciones confirmadas y ésa no existe.
Bloqueante: no
```

3. **Mientras tanto se sigue con lo que no depende del pedido.**
4. El dueño resuelve en su rama y avisa.
5. Un cambio de contrato lo aplica **siempre S1**, en su rama, y avisa a las seis.

| Tipo | Ejemplo | Trámite |
|---|---|---|
| **Aditivo** | campo opcional, método nuevo, token nuevo | Pedido a S1, sin ceremonia. No rompe a nadie. |
| **Rompiente** | renombrar un campo, cambiar un tipo, quitar un método | Acuerdo de las seis **antes** de aplicarlo. |

---

## 8. Definición de terminado

Una sesión abre su PR cuando:

1. Sus vistas implementan los **cuatro estados**.
2. Pasan **accesibilidad** y **los cinco anchos** (360, 390, 768, 1024, 1440) sin scroll horizontal de página.
3. No incumple ningún ⛔ de `QA_CHECKLIST.md` que le corresponda.
4. `git diff --name-only` **no muestra una sola ruta fuera de su ámbito**.
5. `npm run verificar` pasa.
6. Compila sin advertencias y sin `any`.
7. Su mock expone **con datos, vacío y error**.

---

## 9. Integración

1. Las seis ramas abren PR contra `integracion/escritorio`.
2. Se mergean **en cualquier orden**: por diseño no hay conflictos de archivo.
3. Sobre `integracion/escritorio` se corre `QA_CHECKLIST.md` §7 completo.
4. Se cablea el mock con los datos reales entre vistas (Inicio consume cifras de S6 y agenda de S4).
5. Recién entonces se evalúa el merge a `main`.

⛔ **Si al mergear aparece un conflicto de archivo, es un defecto de los ámbitos, no del código.** Se corrige el ámbito y se documenta acá.
