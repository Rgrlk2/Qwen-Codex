# Taxonomía — necesidades

> **Dueña: Sesión 3.** Editable y ampliable desde Configuración comercial.
> Arranca desde `semilla-copy.md` y crece con el uso.
> Reglas: `LEEME.md`.

Capa 3: **qué le duele** al negocio. Trece necesidades canónicas, una por
cada producto que la resuelve `directo` como mínimo — así los 13 productos
tienen, cada uno, al menos una puerta de entrada explicable.

Espejo en código: `packages/mock/src/datos-motor.ts` → `NECESIDADES_SEMILLA`.

| id | Necesidad | Qué es | Pregunta de confirmación |
|---|---|---|---|
| `nec-fuera-horario` | Pierde ventas fuera de horario | Consultas que llegan cuando no hay nadie para responder. | ¿Le llegan consultas fuera del horario de atención que hoy quedan sin responder? |
| `nec-agenda-desordenada` | Agenda desordenada | Turnos, citas o reservas coordinados a mano, con choques y olvidos. | ¿Coordina turnos o reservas a mano, por mensajes sueltos? |
| `nec-no-sabe-reponer` | No sabe qué reponer | Compra por costumbre, sin cruzar lo que realmente se vende. | ¿Decide qué comprar más por costumbre que por datos de venta? |
| `nec-pierde-mercaderia` | Se le pierde mercadería | Diferencias entre lo comprado, lo vendido y lo que queda, sin explicación. | ¿Nota diferencias entre lo que compra, lo que vende y lo que queda en stock? |
| `nec-reparto-ineficiente` | Reparto ineficiente | Rutas armadas por orden de llegada del pedido, no por cercanía. | ¿El repartidor arma la ruta a criterio propio, sin optimizarla? |
| `nec-no-sabe-que-pasa-en-el-local` | No sabe qué pasa en el local | Sin forma de saber cuándo hay más movimiento o dónde se pierden clientes. | ¿Tiene forma de saber en qué horarios y zonas del local hay más movimiento? |
| `nec-precios-desactualizados` | Precios desactualizados frente al mercado | El precio queda fijo mientras la demanda, el stock o la competencia cambian. | ¿Hace cuánto no revisa precios frente a la competencia o la rotación real? |
| `nec-sin-memoria-del-negocio` | No tiene memoria del negocio | Sin historial propio para comparar un día, una semana o un mes con otro. | ¿Lleva un registro diario de ventas que le permita comparar períodos? |
| `nec-no-cotiza-rapido` | Tarda en armar una cotización | Cada cotización se arma desde cero, sin una guía de preguntas. | ¿Cada cotización nueva la arma desde cero, sin una guía previa? |
| `nec-no-vende-online` | No tiene canal de venta online | Todo lo que se vende depende de que el cliente pase por el local. | ¿Hoy vende exclusivamente en el local, sin canal online? |
| `nec-no-ve-el-mercado` | No sabe qué hace la competencia | Decide precios y compras sin mirar qué mueve el mercado. | ¿Sigue de cerca lo que hacen sus competidores directos? |
| `nec-no-controla-espacios` | No controla sus espacios en tiempo real | No sabe, en el momento, qué lugares están libres y cuáles ocupados. | ¿Sabe en todo momento qué lugares o espacios están libres y cuáles ocupados? |
| `nec-no-coordina-recursos-simultaneos` | No coordina recursos entre eventos simultáneos | Personal e insumos repartidos parejo aunque la demanda de cada sala sea distinta. | ¿Cuando hay varios eventos o salas al mismo tiempo, reparte personal e insumos a ojo? |

Cada necesidad nace de una o más operaciones (`relaciones.md`, sección
Operación→Necesidad) y se atiende con uno o más de los 13 productos, en uno
de los cuatro niveles de encaje (`relaciones.md`, sección
Necesidad→Producto). Un dolor inferido **siempre** se muestra como
hipótesis (`esHipotesis: true`), con su motivo y su pregunta de
confirmación — nunca como hecho verificado.
