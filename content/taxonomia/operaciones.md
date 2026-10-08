# Taxonomía — operaciones

> **Dueña: Sesión 3.** Editable y ampliable desde Configuración comercial.
> Arranca desde `semilla-copy.md` y crece con el uso.
> Reglas: `LEEME.md`.

Capa 2: **cómo funciona el negocio por dentro**. Son las diez operaciones
canónicas de MASTER_SPEC.md §8.1. Cada actividad tiene un subconjunto de
éstas (ver `actividades.md`); cada operación genera necesidades probables
(ver `relaciones.md`).

Espejo en código: `packages/mock/src/datos-motor.ts` → `OPERACIONES_SEMILLA`.
El código es la fuente de ejecución; esta tabla es la de lectura humana —
ambas se actualizan juntas.

| id | Operación | Pregunta de confirmación |
|---|---|---|
| `op-maneja-stock` | Maneja stock o inventario | ¿Maneja stock o inventario propio? |
| `op-trabaja-turnos` | Trabaja con turnos, citas o reservas | ¿Atiende con turnos, citas o reservas? |
| `op-atiende-whatsapp` | Atiende consultas por WhatsApp | ¿Recibe consultas por WhatsApp u otro chat? |
| `op-reparte-domicilio` | Reparte a domicilio | ¿Reparte pedidos a domicilio? |
| `op-local-circulacion` | Tiene local con circulación de gente | ¿Tiene un local físico con circulación de clientes? |
| `op-varios-profesionales` | Trabaja con varios profesionales o técnicos | ¿Trabaja con más de un profesional o técnico? |
| `op-catalogo-amplio` | Maneja catálogo amplio de productos | ¿Maneja una variedad amplia de productos? |
| `op-compra-proveedores` | Compra a proveedores de forma recurrente | ¿Compra mercadería o insumos a proveedores de forma recurrente? |
| `op-precios-mueven` | Sus precios se mueven según demanda o temporada | ¿Sus precios cambian según demanda, temporada o mercado? |
| `op-administra-espacios` | Administra espacios físicos | ¿Administra lugares, salas o mesas que se ocupan y se liberan? |

## Cómo se detecta una operación

1. **Actividad curada** (`actividades.md`): la relación Actividad→Operación ya
   está escrita a mano, con probabilidad (`tipica` · `frecuente` · `ocasional`)
   y motivo.
2. **Actividad nueva** (cualquier texto que no coincide con la semilla
   curada): un heurístico por palabras clave busca en el texto libre
   términos asociados a cada operación (stock/inventario/depósito → maneja
   stock; turno/reserva/cita → trabaja con turnos; etc.). Si ninguna palabra
   clave aparece, se asigna un perfil mínimo por defecto (atiende WhatsApp +
   local con circulación, ambas `ocasional`) para que el motor **nunca**
   quede sin nada que ofrecer.

`presente` en el perfil de un plan concreto es `true` cuando la operación es
`tipica` o `frecuente` para esa actividad, y `null` (sin confirmar) cuando es
`ocasional`. El vendedor lo corrige con `AjustePerfil`; ahí pasa a
`origen: 'confirmado_por_vendedor'`.
