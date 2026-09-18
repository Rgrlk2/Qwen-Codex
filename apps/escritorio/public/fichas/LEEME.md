# Fichas oficiales de producto

Las trece fichas oficiales, más el índice **Soluciones Lab.IA**.

⛔ **Fuente maestra. Ninguna se edita desde el Escritorio.**

La personalización que arma el vendedor para un prospecto es una **capa
encima**: decide qué bloques se ven, en qué orden y cuál se destaca, y agrega
"Lo que conversamos" y una nota propia. **Nunca toca el copy aprobado.**

## Los archivos

| Archivo | Producto |
|---|---|
| `ojo-digital.html` · `pulso-digital.html` · `vendedor-24-7.html` · `radar-stock.html` · `faro-digital.html` · `merma-ia.html` · `cotiza-facil.html` · `precio-vivo.html` · `ruta-ia.html` | Las nueve específicas |
| `park-ia.html` · `smart-commerce.html` · `agendar-ia.html` · `exeq-ia.html` | Las cuatro integrales |
| `indice-soluciones.html` | El índice del portafolio |

Origen: entregadas por el CEO el 18/09/2026. `fichas.sha256` guarda la huella
de cada una: si alguna cambia, la verificación lo detecta.

## Los bloques coinciden con el copy maestro

Cada ficha está armada en `<section>`, y esas secciones **son exactamente** las
del copy aprobado:

```
slogan · definicion · datosQueNecesita · queHace · ejemplo
beneficios · casosDeUso · dondeTieneMasSentido · precioDeReferencia
```

`datosQueNecesita` existe **sólo en Merma IA**, tal como fija `COPY_LOCK.md`.
⛔ No se agrega a las demás para emparejar.

Esa coincidencia es la que permite que la personalización sea puro dato: el
texto sale siempre de `content/copy/`, congelado por hash, y la capa sólo
guarda `visible`, `orden` y `destacado` por bloque.

## Peso

Las imágenes **ya no viajan incrustadas**: viven como archivos en
`apps/escritorio/public/assets/fichas/`, y las de marca en `assets/marca/`.
Las fichas las referencian.

| | Antes | Ahora |
|---|---|---|
| Cada ficha de producto | 200 KB a 1,8 MB | **17 a 25 KB** |
| Imágenes | incrustadas, repetidas en cada archivo | 3 MB aparte, se cargan una vez y quedan en caché |

Seis imágenes se repetían entre fichas y otras cinco dentro de una misma
ficha. Ahora hay **una sola copia de cada una**, así que la identidad no puede
desalinearse: si se cambia el logo, se cambia un archivo, no catorce.

### Logos de marca

Decisión del CEO, 18/09/2026: **valen los cuadrados, no los alargados.**

| Archivo | Qué es |
|---|---|
| `assets/marca/logo-labia.webp` | Lab.IA 640×640, con la bajada *"AI applied for business"*. **Principal.** |
| `assets/marca/logo-labia-compacto.webp` | Lab.IA 420×420 sin bajada. Variante para usos chicos. |
| `assets/marca/logo-rgrlk-group-cuadrado.webp` | RGrlk Group 420×420 con la bajada *"Strategic Leadership"*. **El que usan las fichas.** |
| `assets/marca/logo-rgrlk-group.webp` | Versión alargada. ⛔ Descartada por decisión del CEO. |

### Lo que falta, y es tuyo

Dos archivos siguen pesados, y **no se arreglan desde acá**:

| Archivo | Peso | Problema |
|---|---|---|
| `agendar-ia.html` | 2,1 MB | ⛔ **No es una página: es un paquete que se arma con JavaScript.** Un buscador la ve en blanco. Es la única de las trece en ese formato. |
| `indice-soluciones.html` | 8,4 MB | 8,4 MB de JavaScript incrustado. |

Los dos hay que **reexportarlos en HTML plano**, como las otras doce.

