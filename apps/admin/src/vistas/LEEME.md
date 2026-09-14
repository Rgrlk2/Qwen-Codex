# Administración — vistas

| | |
|---|---|
| **Dueño** | **Sesión 6** |
| Ámbito | `apps/admin/src/vistas/**` |
| Datos de ejemplo | `packages/mock/src/datos-admin.ts` |

## Las nueve vistas

| Vista | Qué resuelve | MASTER_SPEC |
|---|---|---|
| `panel` | Indicadores de toda la operación | §6.1 |
| `vendedores` | Usuarios, equipos, límites de descuento, reasignación de cartera | §6.2 |
| `catalogo` | Publicación de los 13, carga de precios transcriptos, versiones | §6.3 |
| `aprobaciones` | Cola priorizada, aprobar / rechazar / pedir cambios, delegación | §6.4 |
| `dinero` | Reglas de comisión versionadas, mensualidades, cierre, ajustes, discrepancias | §6.5 |
| `plantillas` | Biblioteca de presentaciones aprobadas | §6.6 |
| `accesos` | Los **dos** registros, siempre por separado | §6.7, §12 |
| `sugerencias` | Backlog y resolución de sugerencias de producto | §6.8, §13 |
| `parametros` | Umbrales, vigencias, SLA, retención, monedas | §6.9 |

## Prohibiciones que se defienden en el contrato, no en una validación

- ⛔ No hay alta ni baja de producto: el portafolio está cerrado en 13.
- ⛔ No hay edición de regla de comisión: sólo se publica una versión nueva.
- ⛔ No hay reapertura de período: sólo se crea un ajuste.
- ⛔ No hay escritura ni borrado sobre los registros de auditoría y de accesos.
- ⛔ Nadie aprueba su propia cotización.
- ⛔ No se autoaprueba por vencimiento de SLA.
