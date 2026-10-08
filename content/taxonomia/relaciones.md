# Taxonomía — relaciones

> **Dueña: Sesión 3.** Editable y ampliable desde Configuración comercial.
> Arranca desde `semilla-copy.md` y crece con el uso.
> Reglas: `LEEME.md`.

Las tres tablas que conectan las tres capas. **Cada fila guarda su motivo**
(regla T6): es lo que le permite al motor responder "¿por qué éste
primero?" en lugar de devolver un número sin explicación.

Espejo en código: `packages/mock/src/datos-motor.ts` →
`RELACIONES_OPERACION_NECESIDAD` y `RELACIONES_NECESIDAD_PRODUCTO` (la
relación Actividad→Operación vive junto a cada actividad, en
`ACTIVIDADES_CURADAS`; ver `actividades.md`).

---

## 1. Operación → Necesidad (genérica: no depende de la actividad)

Una operación **siempre** sugiere las mismas necesidades probables, con la
misma probabilidad relativa, sea cual sea el negocio que la tenga.

| Operación | Necesidad | Probabilidad | Motivo |
|---|---|---|---|
| Atiende WhatsApp | Pierde ventas fuera de horario | típica | Un negocio que atiende por WhatsApp recibe mensajes a cualquier hora, incluida la que nadie contesta. |
| Trabaja con turnos | Agenda desordenada | típica | Coordinar turnos a mano es la primera fuente de choques y olvidos. |
| Trabaja con turnos | Pierde ventas fuera de horario | frecuente | Los pedidos de turno también llegan fuera de horario, y hoy quedan sin respuesta hasta el día siguiente. |
| Maneja stock | No sabe qué reponer | típica | Manejar stock sin cruzarlo con lo vendido lleva a comprar por costumbre. |
| Maneja stock | Se le pierde mercadería | frecuente | Todo stock físico acumula diferencias entre lo que entra, lo que sale y lo que queda. |
| Reparte a domicilio | Reparto ineficiente | típica | Repartir sin ordenar las paradas multiplica los kilómetros recorridos. |
| Local con circulación | No sabe qué pasa en el local | típica | Con circulación de gente y sin cámaras que se analicen, el movimiento real del local queda sin medir. |
| Local con circulación | No tiene memoria del negocio | ocasional | Un local con movimiento diario genera datos que, sin registrarlos, se pierden día a día. |
| Varios profesionales | Agenda desordenada | frecuente | Coordinar la agenda de varios profesionales a mano multiplica los choques de horario. |
| Catálogo amplio | No sabe qué reponer | frecuente | Cuanto más amplio el catálogo, más difícil decidir a ojo qué reponer primero. |
| Catálogo amplio | Precios desactualizados | ocasional | Un catálogo amplio es difícil de revisar producto por producto contra el mercado. |
| Catálogo amplio | Tarda en cotizar | frecuente | Con muchas combinaciones posibles, armar una cotización a medida lleva tiempo sin una guía. |
| Catálogo amplio | No vende online | ocasional | Un catálogo amplio que sólo se puede ver en el local limita el alcance del negocio. |
| Compra a proveedores | Se le pierde mercadería | frecuente | Cada compra a proveedores es un punto donde el conteo puede empezar a desviarse. |
| Compra a proveedores | No sabe qué hace la competencia | ocasional | Comprar a proveedores sin mirar el mercado deja pasar cambios de precio y de oferta. |
| Precios que se mueven | Precios desactualizados | típica | Si el precio se mueve por temporada o demanda, un precio fijo queda desactualizado rápido. |
| Precios que se mueven | No sabe qué hace la competencia | frecuente | Ajustar precios sin mirar a la competencia es decidir a ciegas. |
| Administra espacios | No controla sus espacios | típica | Administrar espacios sin verlos en tiempo real es la definición misma de este dolor. |
| Administra espacios | No coordina recursos simultáneos | ocasional | Varios espacios en uso al mismo tiempo exigen repartir recursos, no dividirlos parejo. |

---

## 2. Necesidad → Producto (el encaje)

Explícita para al menos un producto por necesidad (así los 13 tienen
puerta de entrada); cualquier combinación no listada aquí es
`no_recomendado` por defecto, con un motivo generado a partir de la
función central del producto (nunca queda sin motivo).

| Necesidad | Producto | Encaje | Adaptación necesaria |
|---|---|---|---|
| Pierde ventas fuera de horario | Vendedor 24/7 | `directo` | — |
| Pierde ventas fuera de horario | Agendar.IA | `cercano` | Configurarlo como canal de reserva, no de venta consultiva. |
| Pierde ventas fuera de horario | Cotiza Fácil | `adaptable` | Cargar previamente precios, condiciones y descuentos permitidos. |
| Agenda desordenada | Agendar.IA | `directo` | — |
| Agenda desordenada | Vendedor 24/7 | `cercano` | Conectarlo con el flujo de reservas para que derive, no sólo informe. |
| No sabe qué reponer | Radar Stock | `directo` | — |
| No sabe qué reponer | Precio Vivo | `cercano` | — |
| No sabe qué reponer | Merma IA | `adaptable` | Usar sus reportes de diferencias como insumo para la próxima compra, no como reemplazo de Radar Stock. |
| Se le pierde mercadería | Merma IA | `directo` | — |
| Se le pierde mercadería | Radar Stock | `cercano` | — |
| Reparto ineficiente | Ruta IA | `directo` | — |
| No sabe qué pasa en el local | Ojo Digital | `directo` | — |
| Precios desactualizados | Precio Vivo | `directo` | — |
| Precios desactualizados | Faro Digital | `cercano` | — |
| No tiene memoria del negocio | Pulso Digital | `directo` | — |
| No tiene memoria del negocio | Merma IA | `adaptable` | Combinar sus reportes con un registro diario del negocio, no reemplazarlo. |
| Tarda en cotizar | Cotiza Fácil | `directo` | — |
| Tarda en cotizar | Vendedor 24/7 | `cercano` | — |
| No vende online | Smart Commerce | `directo` | — |
| No vende online | Vendedor 24/7 | `cercano` | — |
| No sabe qué hace la competencia | Faro Digital | `directo` | — |
| No sabe qué hace la competencia | Precio Vivo | `cercano` | — |
| No controla sus espacios | Park.IA | `directo` | — |
| No coordina recursos simultáneos | Exeq.IA | `directo` | — |

---

## 3. Ejemplo trabajado: motel

El copy aprobado **no nombra "motel"** en ningún bloque de "Dónde tiene más
sentido". Con mapeo literal, el motor diría "no encontrado". Razonando por
capas (`act-motel` en `actividades.md`):

```
Actividad: motel
  → Operaciones: trabaja con turnos (típica) · precios que se mueven (típica) ·
                 atiende WhatsApp (frecuente) · maneja stock (ocasional) ·
                 local con circulación (ocasional)
  → Necesidades: agenda desordenada · pierde ventas fuera de horario ·
                 precios desactualizados · no sabe qué hace la competencia ·
                 no sabe qué reponer · se le pierde mercadería ·
                 no sabe qué pasa en el local · no tiene memoria del negocio
  → Productos:   Precio Vivo (directo) · Vendedor 24/7 (directo) ·
                 Agendar.IA (directo) · Faro Digital (cercano) ·
                 Radar Stock (directo) · Merma IA (adaptable) ·
                 Ojo Digital (directo)
```

Mismos 13 productos, siempre. Un rubro que el copy no nombra. Un plan que
se sostiene, con su motivo en cada paso — y que cambia si el vendedor
corrige el perfil (por ejemplo, si confirma que ese motel no maneja stock
propio de insumos, `Merma IA` y `Radar Stock` bajan en el ranking y el
cambio queda explicado en `CambioPlan`).

**Ahí está la amplitud del sistema: en los rubros y las adaptaciones, nunca
en productos nuevos.**
