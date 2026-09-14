# Mi Dinero — vista 06

| | |
|---|---|
| **Dueño** | **Sesión 6** |
| Ruta | `#/dinero` |
| Ámbito de archivos | `apps/escritorio/src/vistas/dinero/**` |
| Datos de ejemplo | `packages/mock/src/datos-*.ts` de la sesión dueña |

## Qué cubre

resumen por moneda, mensualidades, comisiones línea por línea, liquidaciones y apertura de discrepancias (MASTER_SPEC §2.6 y §7; USER_FLOWS F11 y F12).

## Prohibido en esta vista

⛔ cualquier ruta de escritura sobre comisiones, reglas o liquidaciones; aplicar un porcentaje de comisión por defecto; consolidar PYG con USD.

## Antes de entregar

1. Los cuatro estados implementados y probados (`docs/QA_CHECKLIST.md` §2).
2. Accesibilidad completa a 360px y a 1440px (`docs/QA_CHECKLIST.md` §4).
3. Sin colores ni fuentes literales: sólo tokens de `@labia/ui`.
4. `git diff --name-only` sin una sola ruta fuera del ámbito.
5. Compila sin advertencias y sin `any`.
