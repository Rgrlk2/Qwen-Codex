# Las pantallas del Escritorio, para rediseñar

Nueve archivos HTML sueltos. Cada uno es una **foto** de una pantalla del
Escritorio Vendedores Lab.IA, con su contenido real y su CSS adentro.

Se abren con doble clic, sin levantar nada. Se pueden subir a una herramienta
de diseño y rediseñar directamente.

| Archivo | Pantalla | Quién la usa |
|---|---|---|
| `ingreso.html` | Ingreso | Todos. La única sin la cáscara: todavía no hay sesión. |
| `inicio.html` | Inicio | Vendedor |
| `planificar.html` | Planificar — el motor comercial | Vendedor |
| `clientes.html` | Clientes | Vendedor |
| `agenda.html` | Agenda | Vendedor |
| `propuestas.html` | Propuestas y cotizaciones | Vendedor |
| `dinero.html` | Dinero | Vendedor |
| `administracion.html` | Administración | **Sólo administrador** |
| `ficha-taller.html` | Ficha — el taller | Vendedor. A la izquierda arma la ficha, a la derecha ve lo que le llega al cliente. |

## Lo único que hay que respetar al rediseñar

**Las clases.** Cada pieza tiene su clase (`.tarjeta`, `.cifra`, `.chip`,
`.fichas-bloque`…) y es la que el código pone. Si una clase cambia de nombre,
el código deja de encontrar su pieza y hay que rehacer el enganche. El aspecto
—colores, tamaños, espaciado, tipografía, disposición— se cambia libremente.

**Los ocho colores oficiales y la Inter.** Están declarados como variables
arriba del CSS (`--azul`, `--cian`, `--texto`…). Conviene cambiarles el valor
ahí y no escribir colores sueltos en cada regla.

**Nada de `overflow-x: hidden`.** Si algo se desborda, se arregla la causa
(`min-width: 0`, `overflow-wrap`), no se tapa.

**Áreas táctiles de 44 px como mínimo.** Botones, enlaces y campos.

## Qué NO es fiel

- Los botones no hacen nada, y no se navega entre pantallas.
- Donde dice *"Esta parte del Escritorio todavía no está disponible"*, la
  pantalla está bien: lo que falta son los datos de ejemplo de esa sección.
- Los logos se ven mientras el archivo siga en esta carpeta del repositorio
  (apuntan a `apps/escritorio/public/assets/`). Si se copia el HTML a otro
  lado, hay que llevarse también los logos o cambiar esa ruta.

## Cómo se vuelven a generar

```
npm run instantaneas
```

Se rehacen las nueve desde el código actual. ⛔ No se editan a mano para
"arreglarlas": si una sale mal, lo que está mal es la pantalla.
