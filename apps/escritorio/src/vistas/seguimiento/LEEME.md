# Mi Seguimiento — vista 05

| | |
|---|---|
| **Dueño** | **Sesión 2** |
| Ruta | `#/seguimiento` |
| Ámbito de archivos | `apps/escritorio/src/vistas/seguimiento/**` |
| Datos de ejemplo | `packages/mock/src/datos-*.ts` de la sesión dueña |

## Qué cubre

captura por voz y por texto, procesamiento con confirmación humana, pasos sugeridos y bandeja filtrable (MASTER_SPEC §2.5 y §9; USER_FLOWS F9 y F10).

## Prohibido en esta vista

⛔ persistir cualquier cosa derivada de voz o texto sin confirmación explícita del vendedor; dejar un botón de dictado inerte cuando el dispositivo no lo soporta; crear productos a partir de menciones fuera del catálogo.

## Antes de entregar

1. Los cuatro estados implementados y probados (`docs/QA_CHECKLIST.md` §2).
2. Accesibilidad completa a 360px y a 1440px (`docs/QA_CHECKLIST.md` §4).
3. Sin colores ni fuentes literales: sólo tokens de `@labia/ui`.
4. `git diff --name-only` sin una sola ruta fuera del ámbito.
5. Compila sin advertencias y sin `any`.
