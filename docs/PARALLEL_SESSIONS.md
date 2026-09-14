# PARALLEL_SESSIONS — Límites exactos de archivos para seis sesiones

> **Versión 2.0.** Reorganizada alrededor del sistema corregido: **una sola aplicación**, dos roles, el motor de planificación como corazón.
> **Regla de oro:** un archivo tiene **un solo dueño**. Lo que no está en tu lista, no es tuyo: se pide (§6).
> ⛔ **Ninguna sesión implementa la especificación anterior.** Las vistas `dia`, `cartera`, `portafolio`, `seguimiento` y la app `apps/admin` **ya no existen**.

---

## 1. Las tres fases

| Fase | Quién | Qué pasa |
|---|---|---|
| **Fase 0 — Andamiaje** | **Sólo S1** | Crea el esqueleto completo, congela contratos y tokens, y deja **creados y vacíos** todos los archivos que después serán de otros. Nadie más arranca antes. |
| **Fase 1 — Construcción** | **S1 a S6 en paralelo** | Cada sesión trabaja **sólo** dentro de su ámbito. Cero intersección. |
| **Fase 2 — Integración** | **S1** | Integra, corre `QA_CHECKLIST.md` §7 y cierra pendientes. |

**Por qué Fase 0 es secuencial.** Casi todos los conflictos de trabajo paralelo nacen en tres archivos: el registro de rutas, el índice de tipos y los tokens. Si existen y están completos **antes** de empezar, nadie necesita editarlos.

---

## 2. Reparto

| Sesión | Nombre | Entrega |
|---|---|---|
| **S1** | **Núcleo y autenticación** | Login, sesión, guardia de rol, ruteo, tipos compartidos, capa HTTP, configuración del monorepo |
| **S2** | **Interfaz e inicio** | Sistema visual Lab.IA, cáscara, los cuatro estados, y la vista **Inicio** con sus cuatro cifras, próximos seguimientos y las dos acciones protagonistas |
| **S3** | **Motor de planificación** | Taxonomía de tres capas, inferencia de perfil y dolores, ranking de los 13, combos, encaje, adaptaciones, estrategia, argumentos, preguntas, portafolio y sugerencias |
| **S4** | **Clientes, voz y seguimiento** | Cartera, ficha, línea de tiempo, captura por voz y por texto con confirmación humana |
| **S5** | **Presentaciones y cotizaciones** | Presentación sin precio, cotización con precio propuesto, envío a revisión, PDF definitivo, enlaces y aperturas |
| **S6** | **Finanzas y administración** | Las ocho cifras, participación 50/50, mensualidades, liquidaciones, y la vista **Administración** completa con sus diez secciones |

**Por qué este reparto.** S2 hace interfaz **e** inicio porque Inicio es la pantalla donde el sistema visual se define de hecho: quien fija los tokens y los estados es quien mejor construye la primera pantalla. S6 une dinero del vendedor y administración porque el panel del vendedor es el espejo exacto del panel del administrador: si los hacen dos personas, la regla 50/50 se implementa dos veces y diverge.

---

## 3. Ámbitos exactos

### S1 · Núcleo y autenticación

**Crea y edita — exclusivo:**
```
package.json
tsconfig.base.json
.gitignore  .editorconfig  .nvmrc
README.md

packages/compartido/**                    (todos los tipos compartidos)

packages/mock/package.json
packages/mock/tsconfig.json
packages/mock/src/index.ts
packages/mock/src/nucleo.ts               (latencia, falla forzada, paginación)
packages/mock/src/datos-sesion.ts

apps/escritorio/package.json
apps/escritorio/tsconfig.json
apps/escritorio/vite.config.ts
apps/escritorio/src/main.ts
apps/escritorio/src/nucleo/rutas.ts
apps/escritorio/src/nucleo/guardia-rol.ts
apps/escritorio/src/nucleo/contrato-vista.ts
apps/escritorio/src/nucleo/formato.ts
apps/escritorio/src/datos/**              (proveedor.ts, http.ts)
apps/escritorio/src/vistas/ingreso/**     (pantalla de login)

scripts/**
```

**Crea en Fase 0 y NO vuelve a tocar** (pasan a otra sesión):
```
apps/escritorio/index.html
apps/escritorio/public/**
packages/ui/**
apps/escritorio/src/vistas/{inicio,planificar,clientes,propuestas,dinero,administracion}/**
packages/mock/src/datos-{inicio,motor,clientes,propuestas,finanzas}.ts
content/taxonomia/**
```

**Lee, nunca edita:** `docs/**`, `content/copy/**`.

---

### S2 · Interfaz e inicio

**Edita — exclusivo:**
```
packages/ui/**                            (tokens.css, marca-labia.css, base.css, componentes.css)
apps/escritorio/index.html
apps/escritorio/public/**
apps/escritorio/src/nucleo/disposicion.ts (lateral, barra inferior, cabecera)
apps/escritorio/src/nucleo/estados.ts     (cargando, vacío, error)
apps/escritorio/src/vistas/inicio/**
packages/mock/src/datos-inicio.ts
```

**Responsabilidad especial:** S2 es la dueña del **sistema visual Lab.IA** y de los **cinco anchos de validación**. Todo lo que las demás sesiones consumen en materia de estilo sale de acá.

⛔ **Prohibido:** usar `overflow-x: hidden` para tapar un desbordamiento · usar serif · inventar hex de marca (van en `marca-labia.css`, copiados del design-system oficial) · poner gráficos, embudos o tasas de conversión en Inicio · editar `rutas.ts`.

---

### S3 · Motor de planificación

**Edita — exclusivo:**
```
apps/escritorio/src/vistas/planificar/**
packages/mock/src/datos-motor.ts
content/taxonomia/**                      (ÚNICA dueña de la taxonomía)
```

Incluye: entrada por conocido y por rubro · perfil operativo · dolores inferidos · ranking de los 13 · productos 1-2-3 · combos · encaje y adaptaciones · estrategia, argumentos y preguntas · ficha de producto con el copy aprobado · formulario de sugerencia.

⛔ **Prohibido:** editar una sola letra del copy aprobado · hardcodear slogans o precios en TypeScript · proponer un producto fuera de los 13 · inventar un precio · rechazar un rubro escrito por el vendedor · limitarse al mapeo literal de *"Dónde tiene más sentido"*.

---

### S4 · Clientes, voz y seguimiento

**Edita — exclusivo:**
```
apps/escritorio/src/vistas/clientes/**
packages/mock/src/datos-clientes.ts
```

⛔ **Prohibido:** persistir algo derivado de voz o texto sin confirmación explícita · dejar un botón de dictado inerte cuando el dispositivo no lo soporta · grabar sin avisar · crear productos desde menciones fuera del catálogo · declarar actividades propias (se consumen de la taxonomía de S3).

---

### S5 · Presentaciones y cotizaciones

**Edita — exclusivo:**
```
apps/escritorio/src/vistas/propuestas/**
packages/mock/src/datos-propuestas.ts
```

⛔ **Prohibido:** ⛔ **cualquier camino que lleve una cotización al cliente sin aprobación del administrador** · emitir el PDF definitivo antes de aprobar · poner precio definitivo en una presentación · implementar la aprobación (es de S6) · implementar reglas de participación (son de S6) · sumar monedas distintas · derivar el token del enlace de un dato del cliente.

---

### S6 · Finanzas y administración

**Edita — exclusivo:**
```
apps/escritorio/src/vistas/dinero/**
apps/escritorio/src/vistas/administracion/**
packages/mock/src/datos-finanzas.ts
```

Incluye la vista Dinero del vendedor **y** la vista Administración con sus diez secciones: control financiero · presupuesto de ventas · vendido/cobrado/por cobrar · comisiones · ranking en guaraníes · accesos y frecuencia de uso · todos los clientes e historiales · aprobación de cotizaciones · configuración comercial · sugerencias.

⛔ **Prohibido:** dar al vendedor cualquier ruta de escritura sobre participaciones, líneas o liquidaciones · publicar una participación cuyos porcentajes no sumen 100 · devengar sobre plata no cobrada · implementar `reabrirPeriodo`, `editarParticipacion` o `crearProducto` · escribir sobre los registros de acceso · poner analítica genérica, embudos, tasas de conversión, mezcla de productos o gráficos decorativos · cualquier forma de autoaprobación.

---

## 4. Zonas congeladas

| Zona | Estado | Quién puede cambiarla |
|---|---|---|
| `content/copy/**` | ⛔ **Congelado permanente** | **Nadie.** Sólo Lab.IA, con un copy aprobado nuevo. |
| `docs/**` | 🔒 Congelado en Fase 1 | Sólo S1, con acuerdo previo. |
| `packages/compartido/src/api.ts` | 🔒 Congelado tras Fase 0 | Sólo S1, por pedido formal. |
| `apps/escritorio/src/nucleo/rutas.ts` | 🔒 Completo desde Fase 0 | Nadie. Ya trae las seis rutas y sus roles. |
| `apps/escritorio/src/nucleo/guardia-rol.ts` | 🔒 | Sólo S1. |
| `docs/referencia/escritorio-referencia.html` | ⛔ Congelado permanente | Nadie. Es el insumo original. |

---

## 5. Verificación de límites

Antes de entregar, **cada sesión** corre esto y adjunta la salida:

```bash
git diff --name-only origin/main...HEAD
```

**Toda ruta listada tiene que estar en el ámbito de la sesión.** Una sola ruta fuera del ámbito es un rechazo de la entrega, aunque el cambio sea correcto: rompe la garantía de no-conflicto para las otras cinco.

| Sesión | Prefijos permitidos |
|---|---|
| S1 | `package.json`, `tsconfig.base.json`, `.gitignore`, `.editorconfig`, `.nvmrc`, `README.md`, `packages/compartido/`, `packages/mock/{package.json,tsconfig.json,src/index.ts,src/nucleo.ts,src/datos-sesion.ts}`, `apps/escritorio/{package.json,tsconfig.json,vite.config.ts}`, `apps/escritorio/src/main.ts`, `apps/escritorio/src/nucleo/{rutas,guardia-rol,contrato-vista,formato}.ts`, `apps/escritorio/src/datos/`, `apps/escritorio/src/vistas/ingreso/`, `scripts/` |
| S2 | `packages/ui/`, `apps/escritorio/index.html`, `apps/escritorio/public/`, `apps/escritorio/src/nucleo/{disposicion,estados}.ts`, `apps/escritorio/src/vistas/inicio/`, `packages/mock/src/datos-inicio.ts` |
| S3 | `apps/escritorio/src/vistas/planificar/`, `packages/mock/src/datos-motor.ts`, `content/taxonomia/` |
| S4 | `apps/escritorio/src/vistas/clientes/`, `packages/mock/src/datos-clientes.ts` |
| S5 | `apps/escritorio/src/vistas/propuestas/`, `packages/mock/src/datos-propuestas.ts` |
| S6 | `apps/escritorio/src/vistas/dinero/`, `apps/escritorio/src/vistas/administracion/`, `packages/mock/src/datos-finanzas.ts` |

---

## 6. Protocolo de pedido de cambio

1. ⛔ **No se edita** un archivo ajeno. Ni "rapidito", ni "sólo una línea".
2. Se abre un pedido en `docs/PEDIDOS.md`, cada sesión en **su propia sección** (así el archivo no genera conflictos):

```
### [S4] 2026-09-20 — Falta la operación "atiende por WhatsApp"
Archivo: content/taxonomia/operaciones.md   (dueña: S3)
Necesito: la ficha de cliente muestra las operaciones confirmadas y ésa no existe.
Bloqueante: no
```

3. **Mientras tanto se sigue con lo que no depende del pedido.**
4. El dueño resuelve y responde en la misma entrada.
5. Un cambio de contrato lo aplica **siempre S1** y avisa a las seis.

| Tipo | Ejemplo | Trámite |
|---|---|---|
| **Aditivo** | campo opcional, método nuevo, token nuevo | Pedido a S1, sin ceremonia |
| **Rompiente** | renombrar un campo, cambiar un tipo, quitar un método | Acuerdo de las seis antes de aplicarlo |

---

## 7. Lo que hace posible el paralelismo

| # | Decisión de Fase 0 | Conflicto que evita |
|---|---|---|
| 1 | `rutas.ts` completo, con las seis rutas y su rol | Seis sesiones editando el registro de rutas |
| 2 | Un archivo de mock por dominio | Seis sesiones editando el mismo archivo de datos |
| 3 | Tokens y componentes CSS congelados por S2 en Fase 0 | Seis paletas que después no combinan |
| 4 | `CapaDatos` como puerto único | Que cada vista invente cómo hablar con el servidor |
| 5 | Tipos compartidos de sólo lectura para S2–S6 | Dos sesiones definiendo la misma entidad distinto |
| 6 | Guardia de rol en el núcleo, no en cada vista | Seis implementaciones del mismo permiso, cinco mal |

---

## 8. Definición de terminado

Una sesión entrega cuando:

1. Sus vistas implementan los **cuatro estados**.
2. Pasan **accesibilidad** y **los cinco anchos** (360, 390, 768, 1024, 1440) sin scroll horizontal de página.
3. No incumple ningún ⛔ que le corresponda de `QA_CHECKLIST.md`.
4. `git diff --name-only` **no muestra una sola ruta fuera de su ámbito**.
5. Compila sin advertencias y sin `any`.
6. Su mock expone **con datos, vacío y error** para poder probar los tres estados.

---

## 9. Orden de arranque

```
Fase 0   S1 ──────────────────────────────►  (secuencial, bloqueante)
                                           │
Fase 1                                     ├─► S2  Interfaz e inicio      ← publica tokens temprano
                                           ├─► S3  Motor de planificación ← publica taxonomía temprano
                                           ├─► S4  Clientes, voz y seguimiento
                                           ├─► S5  Presentaciones y cotizaciones
                                           ├─► S6  Finanzas y administración
                                           └─► S1  capa HTTP y pulido
                                           │
Fase 2   S1 ◄──────────────────────────────┘  integración + QA §7
```

**Dependencias blandas** (no bloquean, pero conviene el orden):
- S4, S5 y S6 consumen los tokens y los estados de S2 ⇒ **S2 publica `tokens.css`, `marca-labia.css` y los tres estados en los primeros días.**
- S4 consume la taxonomía de S3 ⇒ **S3 publica `content/taxonomia/` temprano.**
- S5 consume catálogo y precios de S3 ⇒ **S3 publica el mock de catálogo temprano.**
- S2 (Inicio) agrega cifras de S6 y seguimientos de S4 ⇒ **S2 arranca por el sistema visual y cierra por las cifras.**

Ninguna es bloqueante: los contratos están congelados desde Fase 0, así que cada sesión trabaja contra el tipo aunque el dato todavía no exista.
