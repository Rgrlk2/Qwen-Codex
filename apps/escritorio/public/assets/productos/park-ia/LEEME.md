# Logo oficial de Park.IA

**Archivo de destino, exacto:**

```
apps/escritorio/public/assets/productos/park-ia/logo-park-ia.png
```

## Estado

⚠️ **El archivo todavía no está en el repositorio.**

El logo oficial **existe** y fue confirmado por el CEO: es el archivo
`Logo ParkIA.png` adjuntado a la conversación del 15/09/2026. Ese adjunto llegó
**incrustado en el mensaje**, no como archivo en disco, y **no está en el Google
Drive conectado**. Sin los bytes originales no se puede escribir acá.

⛔ **No se generó un reemplazo.** Las reglas de abajo lo prohíben, y un logo
inventado es peor que un logo ausente.

**Para completarlo:** copiar el archivo original a la ruta de arriba, con ese
nombre exacto. No hace falta ningún otro cambio: el inventario, la ficha de
producto y el generador de PDF ya apuntan ahí.

## Reglas de manejo — las ocho, sin excepción

| # | Regla |
|---|---|
| 1 | ⛔ Usar **exactamente** el archivo original. |
| 2 | ⛔ **No generar** otro. |
| 3 | ⛔ **No redibujar.** |
| 4 | ⛔ **No recolorear.** |
| 5 | ⛔ **No recortar.** |
| 6 | ⛔ **No eliminar el fondo.** |
| 7 | ⛔ **No deformar.** |
| 8 | Mostrar con `object-fit: contain` y **mantener su proporción cuadrada**. |

## Cómo se muestra

```css
.logo-producto {
  object-fit: contain;   /* ⛔ nunca cover, nunca fill */
  aspect-ratio: 1 / 1;   /* proporción cuadrada del original */
}
```

Ver `docs/INVENTARIO_ACTIVOS.md` §3 y `docs/ASSET_SOURCES.md`.
