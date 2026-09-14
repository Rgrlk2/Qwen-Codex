# Taxonomía del motor comercial

> **Dueña: Sesión 3.** Ningún otro archivo del repositorio declara taxonomía.
> **Editable y ampliable.** Esto no es una lista cerrada: es el punto de partida de algo que crece con el uso.

---

## Tres capas

```
Actividad ──tiene──► Operaciones típicas
Operación ──genera─► Necesidades probables
Necesidad ──la atiende──► Producto (de los 13), con su nivel de encaje
```

| Archivo | Capa | Qué contiene |
|---|---|---|
| `actividades.md` | 1 | A qué se dedica el negocio. Repuestera, restaurante, odontología, peluquería, hotel, motel, veterinaria, gomería… |
| `operaciones.md` | 2 | Cómo funciona por dentro. Maneja stock, trabaja con turnos, atiende por WhatsApp, reparte a domicilio… |
| `necesidades.md` | 3 | Qué le duele. Pierde ventas fuera de horario, no sabe qué reponer, se le pierde mercadería… |
| `relaciones.md` | — | Actividad→Operación, Operación→Necesidad, Necesidad→Producto, cada una con su **motivo** |
| `semilla-copy.md` | — | Los 71 términos derivados literalmente del copy aprobado: **el punto de partida, no el techo** |

---

## Reglas

| # | Regla |
|---|---|
| T1 | ⛔ **No se limita a los textos literales de "Dónde tiene más sentido".** Esa lista es semilla. |
| T2 | ⛔ **No se usa únicamente mapeo literal.** El motor razona por actividad → operación → necesidad → producto. |
| T3 | **Es editable y ampliable** desde Configuración comercial, en Administración. |
| T4 | Un término escrito por un vendedor que no existe **se crea** como `pendiente_de_revision` y queda usable de inmediato. ⛔ El motor **nunca** responde "rubro no encontrado". |
| T5 | El administrador confirma, fusiona o corrige los términos pendientes. |
| T6 | ⛔ **Cada relación guarda su motivo.** Sin motivo no se guarda: es lo que permite responder *"¿por qué éste primero?"*. |
| T7 | ⛔ La taxonomía crece en **rubros y adaptaciones**. **Nunca** en productos: siguen siendo 13. |

---

## Niveles de encaje

Cada relación `Necesidad → Producto` lleva uno de estos cuatro. Se muestra **siempre en texto**, no sólo por color.

| Encaje | Significa | Exige |
|---|---|---|
| `directo` | Resuelve el dolor sin ninguna adaptación | — |
| `cercano` | Lo resuelve con un ajuste menor de configuración o discurso | Explicar el ajuste |
| `adaptable` | Sirve, pero requiere una adaptación real | **Explicar la adaptación** |
| `no_recomendado` | No corresponde a este negocio | Decir por qué |

---

## Por qué la semilla no alcanza

El copy aprobado nombra rubros donde cada producto "tiene más sentido". Eso sirve para escribir una landing, no para que un vendedor llegue con *"mi amigo tiene una repuestera"* y salga con un plan.

Un ejemplo concreto: **motel**. No aparece en ninguno de los 13 bloques de *"Dónde tiene más sentido"*. Con mapeo literal, el motor diría "no encontrado" y el vendedor se quedaría sin nada. Razonando por capas:

```
Actividad: motel
  → Operaciones: administra espacios · trabaja con turnos · maneja insumos ·
                 tiene local con circulación · precios que se mueven por temporada
  → Necesidades: no sabe qué habitaciones rinden · pierde reservas fuera de horario ·
                 se le pierden insumos · precios desactualizados frente al vecino
  → Productos:   Agendar.IA (directo) · Vendedor 24/7 (directo) ·
                 Merma IA (cercano) · Precio Vivo (adaptable) · Ojo Digital (cercano)
```

Mismos 13 productos. Un rubro que el copy no nombra. Un plan que se sostiene, con su motivo en cada paso.

**Ahí está la amplitud del sistema: en los rubros y las adaptaciones, nunca en productos nuevos.**
