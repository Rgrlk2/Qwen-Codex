# COPY_LOCK — Copy aprobado congelado

> ⛔ **Los archivos de esta carpeta NO se modifican. Por nada.**
> Ni para corregir ortografía, ni acentuación, ni puntuación, ni para "unificar el estilo", ni para acortar.
> El copy aprobado es la fuente única de verdad comercial del portafolio. Una divergencia en un slogan o en un precio no es un error de estilo: es un error comercial.

## Huellas de verificación

Generadas el 2026-09-14 a partir de los archivos entregados en `/inputs`, copiados byte a byte.

| Archivo | SHA-256 |
|---|---|
| `LabIA_9_Soluciones_Especificas_Copy_Maestro.md` | `22b0061ce6fbb468bdaa3b4b2506862f472c93438c65d8a18e33ab088557dbd4` |
| `LabIA_4_Soluciones_Integrales_Copy_Maestro.md` | `7c59f473c1a4333e4bc60999870e39e4a8072f82df9b190fbb65702c4dca2908` |
| `../../docs/referencia/escritorio-referencia.html` | `13b35dc02a546f6b49caf7f1a11f23255b5c002ac71d79d06bfc5e1522bce0e8` |

### Verificar

Desde la raíz del repositorio:

```bash
sha256sum -c content/copy/copy.sha256
```

Si falla, **algo se modificó y hay que revertirlo**. No se actualiza la huella: se restaura el archivo.

## Qué contiene

| Archivo | Contenido | Productos |
|---|---|---|
| `LabIA_9_Soluciones_Especificas_Copy_Maestro.md` | Copy maestro consolidado | Ojo Digital · Pulso Digital · Vendedor 24/7 · Radar Stock · Faro Digital · Merma IA · Cotiza Fácil · Precio Vivo · Ruta IA |
| `LabIA_4_Soluciones_Integrales_Copy_Maestro.md` | Copy maestro aprobado | Park.IA · Smart Commerce · Agendar.IA · Exeq.IA |

**Total: 13 productos. Portafolio cerrado.**

## Reglas de uso

| # | Regla |
|---|---|
| 1 | El copy se **lee** desde estos archivos. Nunca se copia a TypeScript, a JSON ni a una base de datos. |
| 2 | Se renderiza **tal cual**: mismo texto, mismo orden de secciones, misma puntuación. |
| 3 | Las secciones que un producto no tiene **no se muestran**. No se rellenan con texto propio. |
| 4 | Los precios se transcriben literalmente. La transcripción operativa está en `docs/COMMERCIAL_RULES.md` §2 y **no la reemplaza**: la refleja. |
| 5 | Si Lab.IA aprueba un copy nuevo, se reemplaza el archivo **completo** y se actualizan las huellas en el mismo commit, con quién lo aprobó. |
| 6 | **Dueño del render: Sesión 4.** Dueño del contenido: Lab.IA. Ninguna sesión edita este archivo. |

## Particularidades a respetar (no son erratas a corregir)

| Producto | Qué respetar |
|---|---|
| **Precio Vivo** | **No tiene eslogan oficial.** Se muestra su propuesta de valor documentada. ⛔ No se inventa un eslogan. |
| **Smart Commerce** | Eslogan sin punto final y con "on line" separado: *"Vende on line. Decide con datos"*. Se muestra así. |
| **Agendar.IA** | Eslogan sin tilde en "mas" y con puntos suspensivos: *"Optimiza tu recurso mas valioso... tu tiempo"*. Se muestra así. |
| **Smart Commerce / Exeq.IA** | *"Precio oficial no encontrado."* Se muestra así. ⛔ No se estima un precio. |
| **Faro Digital** | El copy aclara que material web anterior usa *FARO Inteligente*. Es un alias histórico, **no un producto aparte**. |
| **Merma IA** | Única ficha con la sección *"¿Qué datos necesita?"*. No se agrega esa sección a los demás. |
| **Exeq.IA** | Sus 5 casos de uso no llevan negrita de encabezado, a diferencia de los otros. Se respeta el formato del fuente. |
