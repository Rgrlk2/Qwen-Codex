# Logos de producto — origen y optimización

Doce de los trece logos (todos salvo Park.IA, ver `park-ia/LEEME.md`) se
bajaron el 2026-09-15 desde la carpeta canónica de Drive inventariada en
`docs/INVENTARIO_ACTIVOS.md` §3, cuenta `r.garelik@rgrlk.com`.

## Qué se hizo

Los originales de Drive son PNG de 1 a 2 MB, 1000–1063 px de lado. Se
redujeron a WebP calidad 82, máximo 480 px de lado, **sin superar nunca el
tamaño original** (`fit: inside`, sin ampliar). Eso es todo:

- ⛔ No se redibujó ningún trazo.
- ⛔ No se recoloreó ningún píxel.
- ⛔ No se recortó el encuadre.
- ⛔ No se quitó el fondo (los originales no tienen transparencia: el fondo
  que traen — blanco u opaco de color, según el archivo — se conserva tal cual).
- ⛔ No se deformó la proporción: el redimensionado es uniforme (mismo
  factor en ancho y alto).

Se muestran siempre con `object-fit: contain`, igual que Park.IA.

## Origen (id de Drive) y resultado

| Producto | Archivo de Drive | id | SHA-256 del `.webp` final |
|---|---|---|---|
| Ojo Digital | `1 OJO Digital Logo.png` | `1ywCtCL95vA0c5uQt21nU44ILvH9BfqRG` | `a7b641a4011b1774cf1072ac089924b03b12e8080a4de9fac91397113ef1a385` |
| Pulso Digital | `2 PULSO Digital Logo.png` | `16SnyoWcy_Ka_iLXfTM-L2PN5k0CTvdhJ` | `a78a8a717f05d30d68a84e2543ac6a1e6b04ca4fd53986a290c505d3dda5915c` |
| Vendedor 24/7 | `4 Vendedor 247 Logo.png` | `1Jb6E88YcAKf6D7RnaPIsR2nDuFIHIUeI` | `8ace6c1eab3ed7751c3e0bd3763a65aff38124abe3d0cc4457d0f8e9625cbd8b` |
| Radar Stock | `3 RADAR Stock Logo.png` | `1cQll56DRlBCh84AgIXZuQWFX7D3hc6bm` | `6a97276b40f22c07b006d3e829fb6a7c881d9e404f17f6ba2774a96f3f2721c2` |
| Faro Digital | `7 FARO Digital Logo.png` | `1cEGeXFxmj7rnuJl8lms46XCkUB5uu3qX` | `50e698df427f68d12e2aeb6223eefb57a9a949b307c797b513e5836c7b5c4a6a` |
| Merma IA | `8 MERMA IA Logo.png` | `13NH3sEzXAgy34cMk-MMFEhLEl0OytHNW` | `fb578a4c58a9f440e1e79e6fa5a4ee2fd90544edc075e42211e2a37072276e6c` |
| Cotiza Fácil | `5 COTIZA Facil Logo.png` | `1Hw7UMAmyiQmYIod3mZ0gO72Y0jxFiieY` | `6b4397616fd8d494b268315a6dd5d81523b09746bec6797597ebc6062f8b2b41` |
| Precio Vivo | `6 PRECIO Vivo Logo.png` | `1cOiJUc1xu0832bhEm4I2FkcgbJVgW3SX` | `258f6d40ed816c8a001a4405f640b00d140e5b11b81a90ebc78f8cd52bfbe4ff` |
| Ruta IA | `10 RUTA IA Logo.png` | `1H834XnOWZ9_3GLtiR2iaDVKm5bdekF21` | `8d457b2fb14e37291d7b55141ab019d2f3def6b11e270b2fa68d533c78e3d11f` |
| Smart Commerce | `2 SMARTH Commerce Logo.png` | `1RXjgRuJeen7yXp_2nwav_Luc-efyluZV` | `0f1ed7a56c310d352a8404348945d6169ab83b62552e37230cdfe5d4456a73c2` |
| Agendar.IA | `1 AgendarIA Logo.png` | `1_cWcGTnfjPNfMVoSo-VZbfOvVNCmio7k` | `c2f40c38d98ef1a2ffa09c72a416c7f37cea1090d16dfa2312e22a00521230e1` |
| Exeq.IA | `4 ExequIA Logos.png` | `1OjDs4QGjDLg8YjoJ3mvH2lbkTJaJJkcK` | `8f442bdec2bd91e154d2c06916ec9bfb58c70c30ecdcf0b797d7954b9ec44693` |

⛔ El logo del producto excluido (`9 Centinala Logo.png`) no se descargó.

## Cómo se muestra

```css
.logo-producto {
  object-fit: contain;   /* nunca cover, nunca fill */
  max-width: 100%;
}
```
