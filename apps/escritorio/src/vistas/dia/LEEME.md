# Mi Día — vista 01

| | |
|---|---|
| **Dueño** | **Sesión 2** |
| Ruta | `#/dia` |
| Ámbito de archivos | `apps/escritorio/src/vistas/dia/**` |
| Datos de ejemplo | `packages/mock/src/datos-*.ts` de la sesión dueña |

## Qué cubre

indicadores del día, agenda, pendientes sin resolver, señales de "requiere atención", cuatro gráficos y la conversación de sólo lectura (MASTER_SPEC §2.1, USER_FLOWS F1).

## Prohibido en esta vista

crear cotizaciones, cambiar precios, aprobar nada. Mi Día enlaza; no ejecuta. La conversación es de sólo lectura y toda respuesta cita su fuente.

## Antes de entregar

1. Los cuatro estados implementados y probados (`docs/QA_CHECKLIST.md` §2).
2. Accesibilidad completa a 360px y a 1440px (`docs/QA_CHECKLIST.md` §4).
3. Sin colores ni fuentes literales: sólo tokens de `@labia/ui`.
4. `git diff --name-only` sin una sola ruta fuera del ámbito.
5. Compila sin advertencias y sin `any`.
