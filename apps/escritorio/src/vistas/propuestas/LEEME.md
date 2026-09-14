# Mis Propuestas — vista 04

| | |
|---|---|
| **Dueño** | **Sesión 5** |
| Ruta | `#/propuestas` |
| Ámbito de archivos | `apps/escritorio/src/vistas/propuestas/**` |
| Datos de ejemplo | `packages/mock/src/datos-*.ts` de la sesión dueña |

## Qué cubre

presentaciones, cotizaciones, aprobación (lado vendedor), PDF, enlaces compartibles y registro de accesos a enlaces (MASTER_SPEC §2.4, §10 y §11; USER_FLOWS F5 a F8).

## Prohibido en esta vista

implementar reglas de comisión (son de Sesión 6); inventar un precio; sumar monedas distintas; enviar al cliente una cotización que requiere aprobación y no la tiene; derivar el token del enlace de un dato del cliente.

## Antes de entregar

1. Los cuatro estados implementados y probados (`docs/QA_CHECKLIST.md` §2).
2. Accesibilidad completa a 360px y a 1440px (`docs/QA_CHECKLIST.md` §4).
3. Sin colores ni fuentes literales: sólo tokens de `@labia/ui`.
4. `git diff --name-only` sin una sola ruta fuera del ámbito.
5. Compila sin advertencias y sin `any`.
