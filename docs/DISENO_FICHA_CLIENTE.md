# La ficha que ve el cliente — hoja para diseñar

Para diseñar en Claude Design la **única** pantalla que ve un prospecto: la
ficha que el vendedor le comparte por WhatsApp o correo.

Con esto alcanza para diseñar sin adivinar. Después la conecto sin rehacer nada.

---

## Qué es esto, y qué no

Es una **página suelta**. No tiene menú, no lleva a ninguna otra pantalla y no
pide datos. El prospecto la abre desde un enlace, la lee, y toca un botón.

⛔ **No es la cotización.** La ficha ayuda a entender y elegir. La cotización
—con precios, alternativas de pago y firma— viene después y es otra pantalla.

⛔ **No entra al Escritorio.** Quien la abre no es usuario del sistema.

---

## Los datos exactos que recibe

```
nombreProducto      "Merma IA"
logo                imagen cuadrada del producto
slogan              "Lo que se pierde, ahora se ve."

bloques[]           entre 3 y 8, en el orden que eligió el vendedor
  titulo            "¿Qué hace?"
  contenido         texto: párrafos y viñetas
  destacado         verdadero en 0, 1 o 2 bloques

loQueConversamos    texto libre del vendedor, o nada
notaDelVendedor     texto libre del vendedor, o nada
nombreVendedor      "Juan Pablo"

llamadoALaAccion    siempre "Hablemos"
```

**Eso es todo.** No llega nada más: ni precios de otros productos, ni el plan
interno, ni por qué el sistema recomendó este producto, ni datos del vendedor
más allá de su nombre de pila.

---

## Los bloques posibles

Salen del copy aprobado y **no se pueden editar**. El vendedor sólo decide
cuáles se ven, en qué orden y cuál se destaca.

| Bloque | Qué trae |
|---|---|
| Slogan | Una frase. Va aparte del resto, como titular. |
| Qué es | Un párrafo. |
| ¿Qué datos necesita? | Viñetas. **Sólo aparece en Merma IA.** |
| ¿Qué hace? | Viñetas, entre 3 y 6. |
| Ejemplo | Uno o dos párrafos, caso concreto. |
| Beneficios | Viñetas. |
| Casos de uso | Cinco viñetas. |
| Dónde tiene más sentido | Una línea con rubros separados por puntos. |
| Precio de referencia | Uno o dos párrafos con importes. **El vendedor suele ocultarlo.** |

**Diseñá para el caso peor:** un bloque puede traer una viñeta o seis, y una
línea puede ser larga. Que no rompa.

---

## Lo que hay que resolver bien

**1. Que se distinga quién habla.** El copy es de Lab.IA; "Lo que conversamos"
y la nota son del vendedor, con sus palabras. El cliente tiene que verlo de un
vistazo. Hoy lo resolví con un borde cian a la izquierda y la firma
`— Juan Pablo`, pero es exactamente lo que conviene que mejores.

**2. Cómo se ve un bloque destacado.** Hasta dos por ficha. Tiene que notarse
sin gritar, y sin que los demás parezcan apagados.

**3. El botón "Hablemos".** Es la única acción de toda la página. Que se vea
siempre, sin perseguir al lector.

**4. Que entre bien en celular.** La mayoría la va a abrir desde WhatsApp, en
la calle, con una mano. Ese es el caso principal, no el de escritorio.

---

## Reglas que no se mueven

| | |
|---|---|
| **Colores** | Los ocho oficiales: `#020711` `#06162F` `#0A55D9` `#098CFF` `#00D9FF` `#12D9FF` `#F2F7FF` `#AEB8C8` |
| **Tipografía** | Inter |
| **`#0A55D9`** | ⛔ Sólo relleno, nunca texto ni bordes finos: no alcanza el contraste mínimo. Para texto de acento usá `#098CFF` o `#00D9FF`. |
| **Logo** | `object-fit: contain`, proporción cuadrada. ⛔ No se recorta, no se deforma, no se le quita el fondo. |
| **Áreas táctiles** | Mínimo 44 px. |
| **Anchos** | Tiene que funcionar en 360, 390, 768, 1024 y 1440 px. ⛔ `overflow-x: hidden` no es solución: tapa el síntoma. |
| **Texto** | El copy va **tal cual**. ⛔ No se reescribe, no se resume, no se le cambia el tono. |

---

## Qué necesito de vuelta

Una página HTML con su CSS. No hace falta que funcione nada: los textos pueden
ser de ejemplo y el botón puede no hacer nada.

Lo que sí necesito es que los bloques estén **separados y reconocibles** —una
clase por tipo de bloque alcanza— para enchufar el contenido real sin
rearmar la maqueta.

Útil si podés: cómo se ve con el mínimo (tres bloques, sin textos del vendedor)
y con el máximo (ocho bloques, dos destacados, los dos textos largos).

---

Ver `packages/compartido/src/fichas.ts` → `FichaPublica`, y
`docs/MASTER_SPEC.md` §2.3 cara B.
