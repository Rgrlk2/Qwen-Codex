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

18 MB en total, y **el 90 % son imágenes incrustadas en base64** — Merma IA,
por ejemplo, pesa 258 KB de los cuales 233 son imagen. El texto real de las
trece no llega a 300 KB.

⚠️ Conviene extraer esas imágenes a archivos y referenciarlas, en vez de
incrustarlas: el navegador las cachearía, varias se repiten entre fichas, y el
paquete bajaría de forma notable. No se hizo todavía porque tocar los archivos
cambia su huella, y la decisión es del CEO.

Ver `packages/compartido/src/fichas.ts` y `docs/MASTER_SPEC.md` §2.3.
