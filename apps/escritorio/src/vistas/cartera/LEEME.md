# Mi Cartera — vista 02

| | |
|---|---|
| **Dueño** | **Sesión 3** |
| Ruta | `#/cartera` |
| Ámbito de archivos | `apps/escritorio/src/vistas/cartera/**` |
| Datos de ejemplo | `packages/mock/src/datos-*.ts` de la sesión dueña |

## Qué cubre

empresas, profesionales y rubros; ficha de cuenta con línea de tiempo; planificación por los tres ejes (MASTER_SPEC §2.2 y §3, USER_FLOWS F2 y F3).

## Prohibido en esta vista

declarar rubros propios — se consumen de `content/taxonomia/rubros.md` (dueño: Sesión 4); crear un plan con más de un eje; crear cuentas desde un plan de rubro.

## Antes de entregar

1. Los cuatro estados implementados y probados (`docs/QA_CHECKLIST.md` §2).
2. Accesibilidad completa a 360px y a 1440px (`docs/QA_CHECKLIST.md` §4).
3. Sin colores ni fuentes literales: sólo tokens de `@labia/ui`.
4. `git diff --name-only` sin una sola ruta fuera del ámbito.
5. Compila sin advertencias y sin `any`.
