# Escritorio Vendedores Lab.IA

Una sola aplicación para el equipo comercial de Lab.IA. Un login, dos roles.
La planificación es el comienzo: el vendedor abre el sistema y lo primero que ve es su plata y dos formas de empezar a vender.

**Estado: especificación v3.0 y esqueleto.** Define *qué* se construye y *con qué reglas*. Las vistas finales todavía no se construyen — arrancan con los límites de `docs/PARALLEL_SESSIONS.md`.

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
| R8 | **Identidad Lab.IA**: ocho colores oficiales + Inter. ⛔ `#0A55D9` es relleno, no texto. |
| R9 | **Responsive por causa.** `overflow-x: hidden` no es una solución. |
| R10 | **El vendedor no investiga a mano.** Escribe un RUC o un nombre; el sistema investiga y devuelve el perfil. |
| R11 | **La agenda se puebla sola.** El vendedor ajusta fechas; no reconstruye. |
| R12 | **Investigación y modelo de lenguaje viven en el servidor.** ⛔ Sin claves en el navegador. |

---

## Las vistas

| # | Ruta | Vista | Quién | Responde a |
|---|---|---|---|---|
| 01 | `#/inicio` | **Inicio** | ambos | ¿Cómo voy y qué hago ahora? |
| 02 | `#/planificar` | **Planificar** | ambos | ¿Qué le vendo a este negocio y por qué? |
| 03 | `#/clientes` | **Clientes** | ambos | ¿Con quién hablo y qué se dijo? |
| 04 | `#/agenda` | **Agenda** | ambos | ¿Qué tengo que hacer, cuándo, y qué se me pasó? |
| 05 | `#/propuestas` | **Propuestas** | ambos | ¿Qué le presenté y qué le cotizo? |
| 06 | `#/dinero` | **Dinero** | ambos | ¿Cuánto vendí, cuánto se cobró y cuánto me toca? |
| 07 | `#/administracion` | **Administración** | **sólo admin** | ¿Cómo va la operación y qué tengo que aprobar? |

### Inicio: la planificación es el comienzo

Cuatro cifras — dinero vendido · dinero cobrado · comisión acumulada · comisión pendiente —, los próximos seguimientos, y **dos acciones protagonistas**:

> 🔍 **Investigar una empresa o un profesional que conozco**
> *"Mi amigo tiene una repuestera", "mi primo tiene un restaurante", "mi odontóloga".*

> 🧭 **Explorar oportunidades por rubro**
> *"Quiero ver qué le puedo vender a las peluquerías."*

⛔ Sin gráficos decorativos, sin embudos, sin tasas de conversión.

### Planificar: investigación automática + motor comercial

**El vendedor escribe el dato mínimo. El sistema investiga. El vendedor confirma, corrige o agrega.**

| Entrada | Con qué alcanza |
|---|---|
| **Empresa** | RUC · razón social · nombre comercial — **uno solo** |
| **Profesional** | Nombre + profesión. Matrícula y ciudad ⛔ sólo si están a mano |
| **Rubro** | Texto libre: "motel", "gomería", "vivero" |

Devuelve: actividad · ubicación · canales digitales · sitio web y redes · productos observables · señales operativas · posibles decisores · tamaño (⛔ sólo con evidencia) · dolores probables · **los 13 ordenados** con encaje y motivo · fuentes consultadas · fecha · **nivel de confianza de cada dato**.

Cada dato viene marcado como **verificado**, **inferido** o **no encontrado**. ⛔ Un dato inferido nunca se presenta como verificado.

⛔ Si las fuentes fallan, cae a la taxonomía y pide **uno a tres campos**, nunca un formulario vacío.
⛔ Nunca responde "rubro no encontrado". ⛔ Nunca propone un producto fuera de los 13.

### Agenda: se puebla sola

Hoy · Semana · Mes · Cronograma comercial · Atrasados.

Se alimenta de planes, objetivos aceptados, seguimientos, presentaciones, cotizaciones, vencimientos y **aperturas de enlace** — cuando el cliente abre lo que se le mandó, es el momento de llamar.

El vendedor ajusta fechas (con motivo) y completa acciones. ⛔ No reconstruye nada.

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
| [`docs/PARALLEL_SESSIONS.md`](docs/PARALLEL_SESSIONS.md) | Seis ramas, cero esperas, límites exactos de archivos |
| [`docs/INVENTARIO_ACTIVOS.md`](docs/INVENTARIO_ACTIVOS.md) | **Activos oficiales localizados en Drive**, con enlace, versión y estado |
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
│                                agenda · propuestas · dinero · administracion
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

## Cotizaciones: estructuradas, y con un solo circuito

La estructura sale de la **Carta Oferta real de Agendar.IA**: hitos de pago del setup (*"50 % al aceptar · 50 % con versión conectada"*), meses incluidos, período de congelamiento del precio, descuento de setup, débito automático, compromiso de doce meses, pago anual anticipado, alcance, exclusiones, vigencia, cronograma, y **la condición que habilita cada beneficio**.

⛔ Los hitos de pago tienen que cerrar. ⛔ Un beneficio sin condición escrita no se aprueba.

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
| `npm run verificar:portafolio` | 13 productos · una sola app · dos roles · siete rutas con `#/administracion` restringida · ocho colores oficiales + Inter · investigación declarada · **sin credenciales en el cliente** · agenda y cotización estructurada · sin términos prohibidos · sin copy duplicado · sin métodos prohibidos · sin `overflow-x: hidden` de parche |
| `npm run typecheck` | Tipos compartidos sin `any` y sin advertencias |

---

## Seis sesiones paralelas

**Las seis arrancan al mismo tiempo, desde el mismo commit base, cada una en su rama.**

| Sesión | Rama | Alcance |
|---|---|---|
| **S1** | `sesion/1-nucleo-autenticacion` | Núcleo y autenticación |
| **S2** | `sesion/2-interfaz-inicio` | Interfaz e inicio |
| **S3** | `sesion/3-motor-investigacion` | Motor de planificación e **investigación automática** |
| **S4** | `sesion/4-clientes-agenda` | Clientes, voz, seguimiento y **agenda** |
| **S5** | `sesion/5-propuestas-cotizaciones` | Presentaciones y cotizaciones |
| **S6** | `sesion/6-finanzas-administracion` | Finanzas y administración |

Cada una abre PR contra `integracion/escritorio`. ⛔ **Ninguna espera a otra**: contratos, tipos, rutas, catálogo, copy, identidad, inventario de activos e interfaces de investigación están congelados en la base.

**Un archivo tiene un solo dueño.** Ámbitos exactos: [`docs/PARALLEL_SESSIONS.md`](docs/PARALLEL_SESSIONS.md). Prompts listos: [`docs/PROMPTS_SESIONES.md`](docs/PROMPTS_SESIONES.md).

---

## Lo que falta

Se buscó en Google Drive: el acceso funciona y los activos están inventariados en [`docs/INVENTARIO_ACTIVOS.md`](docs/INVENTARIO_ACTIVOS.md).

| Falta | Estado |
|---|---|
| **Logo de Park.IA** | ⚠️ No existe en Drive. Es el único de los 13 sin logo. |
| Versiones SVG de los logos | Todo es PNG de 1 a 2 MB. Se optimizan o se piden. |
| Renders y mockups de producto | No existen como categoría. |
| Datos societarios y términos comerciales | Para el encabezado legal de cotizaciones. |

⛔ Nada de esto se genera ni se reconstruye.
