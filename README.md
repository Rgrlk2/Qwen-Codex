# Escritorio Vendedores Lab.IA

Una sola aplicación para el equipo comercial de Lab.IA. Un login, dos roles.
La planificación es el comienzo: el vendedor abre el sistema y lo primero que ve es su plata y dos formas de empezar a vender.

**Estado: especificación v2.0 y esqueleto.** Define *qué* se construye y *con qué reglas*. Las vistas finales todavía no se construyen — arrancan con los límites de `docs/PARALLEL_SESSIONS.md`.

---

## Reglas no negociables

| # | Regla |
|---|---|
| R1 | **Portafolio cerrado en 13 productos**: 9 específicas + 4 integrales. La amplitud está en los **rubros y adaptaciones**, nunca en productos nuevos. |
| R2 | **Una sola aplicación, un solo login.** Administración es una ruta protegida, no otra app. |
| R3 | **Dos roles**: `vendedor` y `administrador`. No existen supervisor ni auditor. |
| R4 | **El copy aprobado no se modifica.** Verificado por hash. |
| R5 | **No se inventan precios de lista, logos ni imágenes.** |
| R6 | **Toda cotización pasa por aprobación del administrador.** Sin excepción. |
| R7 | **50 % Lab.IA / 50 % vendedor**, sobre setup y mensualidades. Configurable por producto. |
| R8 | **Identidad Lab.IA**: dark/navy, azul y cyan, Inter. |
| R9 | **Responsive por causa.** `overflow-x: hidden` no es una solución. |

---

## Las vistas

| # | Ruta | Vista | Quién | Responde a |
|---|---|---|---|---|
| 01 | `#/inicio` | **Inicio** | ambos | ¿Cómo voy y qué hago ahora? |
| 02 | `#/planificar` | **Planificar** | ambos | ¿Qué le vendo a este negocio y por qué? |
| 03 | `#/clientes` | **Clientes** | ambos | ¿Con quién hablo y qué se dijo? |
| 04 | `#/propuestas` | **Propuestas** | ambos | ¿Qué le presenté y qué le cotizo? |
| 05 | `#/dinero` | **Dinero** | ambos | ¿Cuánto vendí, cuánto se cobró y cuánto me toca? |
| 06 | `#/administracion` | **Administración** | **sólo admin** | ¿Cómo va la operación y qué tengo que aprobar? |

### Inicio: la planificación es el comienzo

Cuatro cifras — dinero vendido · dinero cobrado · comisión acumulada · comisión pendiente —, los próximos seguimientos, y **dos acciones protagonistas**:

> 🔍 **Investigar una empresa o un profesional que conozco**
> *"Mi amigo tiene una repuestera", "mi primo tiene un restaurante", "mi odontóloga".*

> 🧭 **Explorar oportunidades por rubro**
> *"Quiero ver qué le puedo vender a las peluquerías."*

⛔ Sin gráficos decorativos, sin embudos, sin tasas de conversión.

### Planificar: el motor comercial

Acepta **cualquier rubro escrito** — "motel", "gomería", "vivero" — y devuelve: cómo funciona ese negocio · dolores probables (como hipótesis, con su motivo) · **los 13 productos ordenados** · producto 1, 2 y 3 · combos · encaje (`directo` / `cercano` / `adaptable` / `no_recomendado`) · la adaptación necesaria · estrategia de entrada · argumentos · preguntas de confirmación.

⛔ Nunca responde "rubro no encontrado". ⛔ Nunca propone un producto fuera de los 13.

---

## Documentación

| Documento | Qué resuelve |
|---|---|
| [`docs/MASTER_SPEC.md`](docs/MASTER_SPEC.md) | Especificación maestra |
| [`docs/USER_FLOWS.md`](docs/USER_FLOWS.md) | 19 recorridos con decisiones y bloqueos |
| [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) | Entidades, relaciones e invariantes |
| [`docs/API_CONTRACTS.md`](docs/API_CONTRACTS.md) | Contrato `CapaDatos` |
| [`docs/COMMERCIAL_RULES.md`](docs/COMMERCIAL_RULES.md) | **Fuente única de dinero**: precios, 50/50, aprobación |
| [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) | Identidad Lab.IA, componentes, responsive |
| [`docs/ASSET_SOURCES.md`](docs/ASSET_SOURCES.md) | Activos disponibles, prohibidos y pendientes |
| [`docs/QA_CHECKLIST.md`](docs/QA_CHECKLIST.md) | Verificaciones de entrega |
| [`docs/PARALLEL_SESSIONS.md`](docs/PARALLEL_SESSIONS.md) | Límites exactos de archivos |
| [`docs/PROMPTS_SESIONES.md`](docs/PROMPTS_SESIONES.md) | **Prompts listos para las seis sesiones** |
| [`content/taxonomia/LEEME.md`](content/taxonomia/LEEME.md) | Taxonomía editable de tres capas |
| [`content/copy/COPY_LOCK.md`](content/copy/COPY_LOCK.md) | Copy congelado y sus huellas |

---

## Estructura

```
.
├── docs/                        Especificación completa
│   └── referencia/              Referencia OPERATIVA (no visual), sin modificar
├── content/
│   ├── copy/                    ⛔ Copy maestro aprobado — CONGELADO
│   └── taxonomia/               Actividades, operaciones, necesidades, relaciones
├── packages/
│   ├── compartido/              Interfaces TypeScript compartidas
│   ├── ui/                      Tokens Lab.IA + marca-labia.css
│   └── mock/                    CapaDatos sin backend, un archivo por dominio
├── apps/
│   └── escritorio/              LA ÚNICA APLICACIÓN
│       └── src/vistas/          ingreso · inicio · planificar · clientes
│                                propuestas · dinero · administracion
└── scripts/
    └── verificar-portafolio.mjs Verificaciones bloqueantes
```

---

## Los 13 productos

**Específicas (9):** Ojo Digital · Pulso Digital · Vendedor 24/7 · Radar Stock · Faro Digital · Merma IA · Cotiza Fácil · Precio Vivo · Ruta IA

**Integrales (4):** Park.IA · Smart Commerce · Agendar.IA · Exeq.IA

El copy vive **únicamente** en `content/copy/`. El código conoce identificadores, no textos.

---

## Dinero: 50 / 50

Regla vigente: **50 % Lab.IA, 50 % vendedor**, sobre **setup** y sobre **mensualidades**. Configurable por producto, con meses de participación configurables.

Se devenga sobre lo **cobrado**, no sobre lo vendido: plata que no entró no genera comisión pagable.

Ocho cifras, siempre por moneda: vendido · cobrado · por cobrar · parte de Lab.IA · parte del vendedor · comisión pendiente · comisión pagada · mensualidades vigentes.

---

## Cotizaciones: el circuito

```
borrador del vendedor → revisión del administrador → aprobada o corregida
→ PDF definitivo → envío al cliente
```

⛔ **Ningún vendedor puede enviar una cotización final sin aprobación.** No hay botón, ni URL, ni llamada que lo permita: el contrato de la capa de datos lo rechaza.

La **presentación** es otra cosa: se genera primero, es personalizada y visual, **no lleva precio definitivo** y **no requiere aprobación**.

---

## Verificación

```bash
npm install
npm run verificar
```

| Comando | Verifica |
|---|---|
| `npm run verificar:copy` | Hash original de los dos archivos de copy |
| `npm run verificar:portafolio` | 13 productos · una sola app · dos roles · sin términos prohibidos · sin copy duplicado · sin métodos prohibidos · identidad Lab.IA · sin `overflow-x: hidden` de parche |
| `npm run typecheck` | Tipos compartidos sin `any` y sin advertencias |

---

## Seis sesiones paralelas

| Sesión | Alcance |
|---|---|
| **S1** | Núcleo y autenticación |
| **S2** | Interfaz e inicio |
| **S3** | Motor de planificación |
| **S4** | Clientes, voz y seguimiento |
| **S5** | Presentaciones y cotizaciones |
| **S6** | Finanzas y administración |

**Un archivo tiene un solo dueño.** Ámbitos exactos y protocolo: [`docs/PARALLEL_SESSIONS.md`](docs/PARALLEL_SESSIONS.md). Prompts listos: [`docs/PROMPTS_SESIONES.md`](docs/PROMPTS_SESIONES.md).

---

## Lo único pendiente de entrega

Los **hex oficiales de azul y cyan** y el **archivo del logotipo** de Lab.IA. Hasta que lleguen, la interfaz se ve monocromática navy y la marca aparece en texto: funciona, es legible, y se nota que le falta la marca. ⛔ No se inventan.
