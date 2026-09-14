# PARALLEL_SESSIONS — Límites exactos de archivos para seis sesiones

> **Objetivo:** que seis sesiones trabajen al mismo tiempo **sin tocar jamás el mismo archivo**.
> **Regla de oro:** un archivo tiene **un solo dueño**. Si una sesión necesita cambiar un archivo que no es suyo, **no lo cambia**: lo pide (§6).
> Los ámbitos de abajo son **exhaustivos**. Lo que no está en tu lista, no es tuyo.

---

## 1. Las tres fases

| Fase | Quién trabaja | Qué pasa |
|---|---|---|
| **Fase 0 — Andamiaje** | **Sólo Sesión 1** | Crea el esqueleto completo, congela contratos de tipos y tokens, y deja **creados y vacíos** todos los archivos que después serán de otros. Ninguna otra sesión arranca antes de que termine. |
| **Fase 1 — Construcción** | **S1 a S6 en paralelo** | Cada sesión trabaja **sólo** dentro de su ámbito. Cero intersección. |
| **Fase 2 — Integración** | **Sesión 1** | Integra, corre `QA_CHECKLIST.md` §7 y resuelve lo que quedó pendiente. |

**Por qué Fase 0 es secuencial.** El 90 % de los conflictos en trabajo paralelo nacen de tres archivos: el registro de rutas, el índice de tipos y el archivo de tokens. Si **todos existen y están completos antes de empezar**, nadie necesita editarlos y el conflicto desaparece por construcción.

---

## 2. Reparto de responsabilidades

| Sesión | Nombre | Entrega |
|---|---|---|
| **S1** | Núcleo, contratos y andamiaje | Tipos compartidos, tokens, cáscara de la app, ruteo, estados base, capa HTTP, configuración del monorepo |
| **S2** | Mi Día + Mi Seguimiento | Vistas 01 y 05: panel diario, señales de atención, seguimiento por voz y texto |
| **S3** | Mi Cartera | Vista 02: empresas, profesionales, rubros y planificación por los tres ejes |
| **S4** | Mi Portafolio | Vista 03: los 13 productos, taxonomía de rubros, recomendación, sugerencias de producto |
| **S5** | Mis Propuestas | Vista 04: presentaciones, cotizaciones, aprobación, PDF, enlaces y accesos |
| **S6** | Mi Dinero + Administración | Vista 06 y la app de administración completa |

**Por qué este reparto.** S2 une Día y Seguimiento porque Mi Día es, en los hechos, la bandeja de lo que sale del seguimiento. S6 une Dinero y Administración porque el panel del vendedor es el espejo exacto del panel del administrador: si los construyen dos personas distintas, las reglas de comisión se implementan dos veces y divergen.

---

## 3. Ámbitos exactos

### S1 · Núcleo, contratos y andamiaje

**Crea y edita — exclusivo:**
```
package.json
tsconfig.base.json
.gitignore
.editorconfig
.nvmrc
README.md

packages/compartido/**                    (todos los tipos compartidos)
packages/ui/**                            (tokens.css, base.css, componentes.css)

packages/mock/package.json
packages/mock/tsconfig.json
packages/mock/src/index.ts
packages/mock/src/nucleo.ts               (latencia, falla forzada, paginación)

apps/escritorio/index.html
apps/escritorio/package.json
apps/escritorio/tsconfig.json
apps/escritorio/vite.config.ts
apps/escritorio/public/**
apps/escritorio/src/main.ts
apps/escritorio/src/nucleo/**             (ruteo, disposición, estados, registro-vistas, formato)
apps/escritorio/src/datos/**              (proveedor.ts, http.ts)

apps/admin/index.html
apps/admin/package.json
apps/admin/tsconfig.json
apps/admin/vite.config.ts
apps/admin/public/**
apps/admin/src/main.ts
apps/admin/src/nucleo/**
apps/admin/src/datos/**
```

**Crea en Fase 0 y NO vuelve a tocar** (pasan a ser de otra sesión):
```
apps/escritorio/src/vistas/{dia,seguimiento,cartera,portafolio,propuestas,dinero}/vista.ts
apps/admin/src/vistas/*.ts
packages/mock/src/datos-*.ts
content/taxonomia/rubros.md
```

**Lee, nunca edita:** `docs/**`, `content/copy/**`.

---

### S2 · Mi Día + Mi Seguimiento

**Edita — exclusivo:**
```
apps/escritorio/src/vistas/dia/**
apps/escritorio/src/vistas/seguimiento/**
packages/mock/src/datos-dia.ts
packages/mock/src/datos-seguimiento.ts
```

**Lee, nunca edita:** `packages/compartido/**`, `packages/ui/**`, `apps/escritorio/src/nucleo/**`, `docs/**`, `content/**`.

**Prohibido:** tocar `registro-vistas.ts` (ya trae sus dos rutas), agregar tokens, editar `api.ts`, tocar archivos de otra vista.

---

### S3 · Mi Cartera

**Edita — exclusivo:**
```
apps/escritorio/src/vistas/cartera/**
packages/mock/src/datos-cartera.ts
```

**Lee, nunca edita:** igual que S2, más `content/taxonomia/rubros.md` (propiedad de S4).

**Prohibido:** definir rubros propios — los consume de la taxonomía de S4. Si falta un rubro, lo pide (§6).

---

### S4 · Mi Portafolio

**Edita — exclusivo:**
```
apps/escritorio/src/vistas/portafolio/**
packages/mock/src/datos-portafolio.ts
content/taxonomia/rubros.md               (ÚNICO dueño de la taxonomía)
```

**Lee, nunca edita:** `content/copy/**` — **congelado, sólo lectura**.

**Prohibido:** ⛔ **editar una sola letra del copy aprobado**; hardcodear slogans o precios en TypeScript; agregar un producto 14.°; incluir Sentinela en cualquier forma.

---

### S5 · Mis Propuestas

**Edita — exclusivo:**
```
apps/escritorio/src/vistas/propuestas/**
packages/mock/src/datos-propuestas.ts
```

Incluye las cuatro pestañas: presentaciones, cotizaciones, aprobación (lado vendedor) y accesos.

**Lee, nunca edita:** `docs/COMMERCIAL_RULES.md` es su norma de cálculo.

**Prohibido:** implementar reglas de comisión (son de S6); inventar un precio; sumar monedas distintas; permitir el envío al cliente de una cotización que requiere aprobación sin tenerla.

---

### S6 · Mi Dinero + Administración

**Edita — exclusivo:**
```
apps/escritorio/src/vistas/dinero/**
apps/admin/src/vistas/**
packages/mock/src/datos-dinero.ts
packages/mock/src/datos-admin.ts
```

**Lee, nunca edita:** `docs/COMMERCIAL_RULES.md` — es su especificación literal.

**Prohibido:** ⛔ dejar un porcentaje de comisión por defecto en el código; dar al vendedor cualquier ruta de escritura sobre comisiones; implementar `reabrirPeriodo`, `editarReglaComision`, `crearProducto` ni escritura sobre auditoría.

---

## 4. Zonas congeladas

| Zona | Estado | Quién puede cambiarla |
|---|---|---|
| `content/copy/**` | ⛔ **Congelado permanente** | **Nadie.** Sólo Lab.IA, entregando un copy aprobado nuevo. |
| `docs/**` | 🔒 Congelado en Fase 1 | Sólo S1, y sólo con acuerdo previo (§6). |
| `packages/compartido/src/api.ts` | 🔒 Congelado tras Fase 0 | Sólo S1, por pedido formal. |
| `packages/ui/src/tokens.css` | 🔒 Congelado tras Fase 0 | Sólo S1, por pedido formal. |
| `apps/*/src/nucleo/registro-vistas.ts` | 🔒 Completo desde Fase 0 | Nadie. Ya trae las seis rutas. |
| `docs/referencia/escritorio-referencia.html` | ⛔ Congelado permanente | Nadie. Es el insumo original. |

---

## 5. Verificación de límites

Antes de entregar, **cada sesión** corre esto y adjunta la salida:

```bash
git diff --name-only origin/main...HEAD
```

**Toda ruta listada tiene que estar en el ámbito de la sesión.** Una sola ruta fuera del ámbito es un rechazo de la entrega, aunque el cambio sea correcto: el problema no es el cambio, es que rompe la garantía de no-conflicto para las otras cinco.

Comprobación por sesión:

| Sesión | Prefijos permitidos |
|---|---|
| S1 | `package.json`, `tsconfig.base.json`, `.gitignore`, `.editorconfig`, `.nvmrc`, `README.md`, `packages/compartido/`, `packages/ui/`, `packages/mock/src/index.ts`, `packages/mock/src/nucleo.ts`, `packages/mock/package.json`, `packages/mock/tsconfig.json`, `apps/*/index.html`, `apps/*/package.json`, `apps/*/tsconfig.json`, `apps/*/vite.config.ts`, `apps/*/public/`, `apps/*/src/main.ts`, `apps/*/src/nucleo/`, `apps/*/src/datos/` |
| S2 | `apps/escritorio/src/vistas/dia/`, `apps/escritorio/src/vistas/seguimiento/`, `packages/mock/src/datos-dia.ts`, `packages/mock/src/datos-seguimiento.ts` |
| S3 | `apps/escritorio/src/vistas/cartera/`, `packages/mock/src/datos-cartera.ts` |
| S4 | `apps/escritorio/src/vistas/portafolio/`, `packages/mock/src/datos-portafolio.ts`, `content/taxonomia/rubros.md` |
| S5 | `apps/escritorio/src/vistas/propuestas/`, `packages/mock/src/datos-propuestas.ts` |
| S6 | `apps/escritorio/src/vistas/dinero/`, `apps/admin/src/vistas/`, `packages/mock/src/datos-dinero.ts`, `packages/mock/src/datos-admin.ts` |

---

## 6. Protocolo de pedido de cambio

Cuando una sesión necesita algo que está fuera de su ámbito:

1. **No lo edita.** Ni "rapidito", ni "sólo una línea".
2. Abre un pedido en `docs/PEDIDOS.md` (archivo de sólo-agregar, cada sesión escribe en su propia sección; el formato de abajo evita el conflicto):

```
## [S3] 2026-09-20 — Falta el rubro "Corralones" en la taxonomía
Archivo: content/taxonomia/rubros.md   (dueño: S4)
Necesito: el término aparece en "Dónde tiene más sentido" de Ruta IA.
Bloqueante: no
```

3. **Mientras tanto, sigue con lo que no depende del pedido.** Un pedido pendiente no detiene una sesión entera.
4. El dueño del archivo resuelve y responde en la misma entrada.
5. Un cambio de contrato (`api.ts`, tipos compartidos) **lo aplica siempre S1** y avisa a las seis.

### Cambios aditivos vs. rompientes

| Tipo | Ejemplo | Trámite |
|---|---|---|
| **Aditivo** | campo opcional nuevo, método nuevo, token nuevo | Pedido a S1, sin ceremonia. No rompe a nadie. |
| **Rompiente** | renombrar un campo, cambiar un tipo, quitar un método | Acuerdo de las seis sesiones **antes** de aplicarlo. S1 lo aplica y avisa. |

---

## 7. Contratos que hacen posible el paralelismo

Cinco decisiones, todas de Fase 0, sin las cuales este reparto no funciona:

| # | Decisión | Qué conflicto evita |
|---|---|---|
| 1 | **`registro-vistas.ts` completo desde Fase 0**, con las seis rutas apuntando a stubs | El clásico: seis sesiones editando el registro de rutas. |
| 2 | **Un archivo de mock por dominio**, nunca uno compartido | Seis sesiones editando el mismo archivo de datos de ejemplo. |
| 3 | **Tokens y componentes CSS congelados en Fase 0** | Seis sesiones agregando colores y variantes que después no combinan. |
| 4 | **`CapaDatos` como interfaz única**, con mock e HTTP | Que cada vista invente su forma de hablar con el servidor. |
| 5 | **Tipos compartidos de sólo lectura para S2–S6** | Que dos sesiones definan la misma entidad con dos formas distintas. |

---

## 8. Definición de terminado por sesión

Una sesión entrega cuando:

1. Sus vistas implementan los **cuatro estados** (`QA_CHECKLIST.md` §2).
2. Pasa **accesibilidad** (`QA_CHECKLIST.md` §4) a 360px y a 1440px.
3. No incumple ningún ⛔ que le corresponda de `QA_CHECKLIST.md`.
4. `git diff --name-only` **no muestra una sola ruta fuera de su ámbito**.
5. Compila sin advertencias y sin `any`.
6. Su mock expone **datos con datos, vacío y error** para poder probar los tres estados.

---

## 9. Orden de arranque sugerido

```
Fase 0   S1 ────────────────────────────────►  (secuencial, bloqueante)
                                             │
Fase 1                                       ├─► S2  Día + Seguimiento
                                             ├─► S3  Cartera
                                             ├─► S4  Portafolio
                                             ├─► S5  Propuestas
                                             ├─► S6  Dinero + Admin
                                             └─► S1  capa HTTP y pulido del núcleo
                                             │
Fase 2   S1 ◄────────────────────────────────┘  integración + QA §7
```

**Dependencias blandas** (no bloquean, pero conviene el orden):
- S3 (Cartera) consume la taxonomía de S4 (Portafolio) ⇒ S4 publica `rubros.md` temprano.
- S5 (Propuestas) consume el catálogo y los precios de S4 ⇒ S4 publica el mock de catálogo temprano.
- S2 (Mi Día) agrega señales de S3, S5 y S6 ⇒ S2 arranca por Seguimiento y cierra por Mi Día.

Ninguna de las tres es bloqueante: los contratos de tipos ya están congelados desde Fase 0, así que cada sesión puede trabajar contra el tipo aunque el dato todavía no exista.
