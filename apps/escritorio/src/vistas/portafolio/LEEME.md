# Mi Portafolio — vista 03

| | |
|---|---|
| **Dueño** | **Sesión 4** |
| Ruta | `#/portafolio` |
| Ámbito de archivos | `apps/escritorio/src/vistas/portafolio/**` |
| Datos de ejemplo | `packages/mock/src/datos-*.ts` de la sesión dueña |

## Qué cubre

los 13 productos con el copy aprobado servido tal cual, filtros por familia y por rubro, precios documentados con su estado, y el formulario de sugerencia de producto nuevo (MASTER_SPEC §2.3, §5 y §13; USER_FLOWS F4 y F13).

## Prohibido en esta vista

⛔ editar una sola letra del copy aprobado; hardcodear slogans o precios en TypeScript; mostrar un producto 14.º; inventar un eslogan para Precio Vivo; estimar el precio de Smart Commerce o de Exeq.IA.

## Antes de entregar

1. Los cuatro estados implementados y probados (`docs/QA_CHECKLIST.md` §2).
2. Accesibilidad completa a 360px y a 1440px (`docs/QA_CHECKLIST.md` §4).
3. Sin colores ni fuentes literales: sólo tokens de `@labia/ui`.
4. `git diff --name-only` sin una sola ruta fuera del ámbito.
5. Compila sin advertencias y sin `any`.
