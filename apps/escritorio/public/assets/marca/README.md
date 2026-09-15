# Marca — Lab.IA y RGrlk Group

Bajados el 2026-09-15 desde Drive (`docs/INVENTARIO_ACTIVOS.md` §1 y §2),
cuenta `r.garelik@rgrlk.com`.

| Archivo | Origen | id de Drive | Uso |
|---|---|---|---|
| `logo-labia.webp` | `Logo_LabIA_T.png` (1000×1000, PNG) | `1_SQ7zl5IkxOQEBL2xJwxk8UX5AXkeMZN` | Barra lateral, cabecera |
| `logo-rgrlk-group.webp` | `rgrlk-group-horizontal.webp` | `17PCeZOp-YO_gB90eTjIIShDyzikCfOlp` | Pie de documentos, membrete |
| `logo-rgrlk-group-160.webp` | idem, versión reducida | `1ldsrWZD0TVOq5L1Al-hQFvFYcbk1DCOC` | Uso reducido |
| `favicon-48.png` / `favicon-180.png` | Recorte cuadrado por redimensión de `Logo_LabIA_T.png`, sin recolorear ni redibujar | — | `<link rel="icon">`, `apple-touch-icon` |

`logo-labia.webp` y `logo-rgrlk-group.webp` pasaron por el mismo pipeline
que `../productos/README.md`: redimensión proporcional (`fit: inside`, sin
ampliar) + recompresión WebP calidad 82. Sin redibujar, sin recolorear, sin
recortar el encuadre, sin quitar fondo, sin deformar.

`favicon-48.png` y `favicon-180.png` son el único caso con `fit: contain`
sobre lienzo cuadrado transparente, porque un favicon exige proporción 1:1
y el original de Lab.IA no lo es: el logo se ve completo, sin recortar, con
márgenes transparentes agregados — no removidos — a los lados más cortos.

Mientras no llegue una versión SVG o una variante clara/oscura dedicada
(`docs/ASSET_SOURCES.md` §3), éste es el archivo oficial que se usa.
