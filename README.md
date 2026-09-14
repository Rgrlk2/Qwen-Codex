# Escritorio Vendedores Lab.IA

Herramienta de trabajo diaria del vendedor de Lab.IA, con su contraparte de administración comercial.

**Estado: especificación y esqueleto.** Esta entrega define *qué* se construye y *con qué reglas*.
Las funciones finales todavía no se construyen — arrancan con los límites de `docs/PARALLEL_SESSIONS.md`.

---

## Reglas no negociables

| # | Regla |
|---|---|
| R1 | **Portafolio cerrado en 13 productos**: 9 soluciones específicas + 4 integrales. |
| R2 | **Todo producto adicional hallado en la web queda excluido** (`docs/MASTER_SPEC.md` §4.2). |
| R3 | **El copy aprobado no se modifica.** `content/copy/` es de sólo lectura, con verificación por hash. |
| R4 | **No se inventan precios.** Sólo los importes documentados, transcriptos literalmente. |
| R5 | **No se inventan logos ni imágenes.** Todo activo tiene fila en `docs/ASSET_SOURCES.md`. |
| R6 | **Todo importe lleva moneda.** El portafolio opera en PYG y USD; sin conversión automática. |

---

## Documentación

| Documento | Qué resuelve |
|---|---|
| [`docs/MASTER_SPEC.md`](docs/MASTER_SPEC.md) | Especificación maestra: seis vistas del vendedor, vista completa del administrador, planificación por empresa/profesional/rubro, los 13 productos, dinero, seguimiento por voz y texto, presentaciones, aprobación, PDF y enlaces, registro de accesos, sugerencias |
| [`docs/USER_FLOWS.md`](docs/USER_FLOWS.md) | 18 recorridos con decisiones, bloqueos y estados |
| [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) | Entidades, relaciones e invariantes |
| [`docs/API_CONTRACTS.md`](docs/API_CONTRACTS.md) | Contrato `CapaDatos` entre vistas y datos |
| [`docs/COMMERCIAL_RULES.md`](docs/COMMERCIAL_RULES.md) | **Fuente única de dinero**: precios documentados, IVA, descuentos, aprobación, comisiones, pendientes |
| [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) | Tokens, componentes, movimiento, accesibilidad |
| [`docs/ASSET_SOURCES.md`](docs/ASSET_SOURCES.md) | Qué activos existen, cuáles están prohibidos, cuáles faltan |
| [`docs/QA_CHECKLIST.md`](docs/QA_CHECKLIST.md) | Verificaciones de entrega, con bloqueantes marcados |
| [`docs/PARALLEL_SESSIONS.md`](docs/PARALLEL_SESSIONS.md) | **Límites exactos de archivos para seis sesiones paralelas** |
| [`docs/PEDIDOS.md`](docs/PEDIDOS.md) | Canal de pedidos entre sesiones |
| [`content/taxonomia/rubros.md`](content/taxonomia/rubros.md) | 71 términos derivados del copy: 60 rubros + 11 calificadores |
| [`content/copy/COPY_LOCK.md`](content/copy/COPY_LOCK.md) | Congelamiento del copy aprobado y sus huellas |

---

## Estructura

```
.
├── docs/                        Especificación completa (arriba)
│   └── referencia/              Referencia visual entregada, sin modificar
├── content/
│   ├── copy/                    ⛔ Copy maestro aprobado — CONGELADO
│   └── taxonomia/               Rubros y calificadores derivados del copy
├── packages/
│   ├── compartido/              Interfaces TypeScript compartidas
│   ├── ui/                      Tokens y estilos base
│   └── mock/                    CapaDatos sin backend, un archivo por dominio
├── apps/
│   ├── escritorio/              Las seis vistas del vendedor
│   └── admin/                   Las nueve vistas del administrador
└── scripts/
    └── verificar-portafolio.mjs Verificaciones bloqueantes
```

---

## Las seis vistas del vendedor

| # | Ruta | Vista | Responde a |
|---|---|---|---|
| 01 | `#/dia` | Mi Día | ¿Qué tengo que hacer hoy? |
| 02 | `#/cartera` | Mi Cartera | ¿A quién le vendo y cómo voy con cada uno? |
| 03 | `#/portafolio` | Mi Portafolio | ¿Qué vendo, a quién le sirve y cuánto cuesta? |
| 04 | `#/propuestas` | Mis Propuestas | ¿Qué le mandé, en qué estado está y quién lo abrió? |
| 05 | `#/seguimiento` | Mi Seguimiento | ¿Qué se habló y qué quedó pendiente? |
| 06 | `#/dinero` | Mi Dinero | ¿Cuánto generé, cuánto cobro y cuándo? |

---

## Los 13 productos

**Específicas (9):** Ojo Digital · Pulso Digital · Vendedor 24/7 · Radar Stock · Faro Digital · Merma IA · Cotiza Fácil · Precio Vivo · Ruta IA

**Integrales (4):** Park.IA · Smart Commerce · Agendar.IA · Exeq.IA

El copy de los 13 vive **únicamente** en `content/copy/`. El código sólo conoce identificadores.

---

## Verificación

```bash
npm install
npm run verificar        # copy intacto + portafolio cerrado + compilación
```

| Comando | Verifica |
|---|---|
| `npm run verificar:copy` | Que los dos archivos de copy conserven su hash original |
| `npm run verificar:portafolio` | 13 productos, sin términos prohibidos, sin copy duplicado en código, sin métodos prohibidos en la API |
| `npm run typecheck` | Que los tipos compartidos compilen sin `any` y sin advertencias |

---

## Seis sesiones paralelas

| Sesión | Alcance | Ámbito de archivos |
|---|---|---|
| **S1** | Núcleo, contratos y andamiaje | `packages/compartido/`, `packages/ui/`, `apps/*/src/nucleo/`, `apps/*/src/datos/`, configuración |
| **S2** | Mi Día + Mi Seguimiento | `apps/escritorio/src/vistas/{dia,seguimiento}/`, `packages/mock/src/datos-{dia,seguimiento}.ts` |
| **S3** | Mi Cartera | `apps/escritorio/src/vistas/cartera/`, `packages/mock/src/datos-cartera.ts` |
| **S4** | Mi Portafolio | `apps/escritorio/src/vistas/portafolio/`, `packages/mock/src/datos-portafolio.ts`, `content/taxonomia/rubros.md` |
| **S5** | Mis Propuestas | `apps/escritorio/src/vistas/propuestas/`, `packages/mock/src/datos-propuestas.ts` |
| **S6** | Mi Dinero + Administración | `apps/escritorio/src/vistas/dinero/`, `apps/admin/src/vistas/`, `packages/mock/src/datos-{dinero,admin}.ts` |

**Un archivo tiene un solo dueño.** Lo que no está en tu ámbito, no es tuyo: se pide en `docs/PEDIDOS.md`.
Detalle completo, fases y protocolo: [`docs/PARALLEL_SESSIONS.md`](docs/PARALLEL_SESSIONS.md).

---

## Pendientes de definición comercial

Once parámetros no están en los insumos recibidos y **no se inventan**: porcentajes de comisión, base de devengamiento, calendario de liquidación, límites de descuento, régimen de IVA de 12 productos, precio de Smart Commerce y Exeq.IA, tipo de cambio, vigencias por defecto, SLA de aprobación, políticas de retención y la marca gráfica de Lab.IA.

Cada uno tiene un comportamiento conservador definido mientras esté pendiente.
Lista completa: [`docs/COMMERCIAL_RULES.md`](docs/COMMERCIAL_RULES.md) §6 y [`docs/MASTER_SPEC.md`](docs/MASTER_SPEC.md) §16.
