# Taxonomía de rubros — derivada del copy aprobado

> **Dueño del archivo: Sesión 4.** Ningún otro archivo del repositorio declara rubros.
> **Origen:** bloque *"Dónde tiene más sentido"* de los 13 productos, en `content/copy/`.
> ⛔ **No se agrega ningún término que no aparezca literalmente en el copy aprobado.**
> ⛔ **No se corrige, traduce, singulariza ni normaliza ningún término.** Se transcribe tal cual.

## Resumen

| | Cantidad |
|---|---|
| Productos analizados | **13** (9 específicas + 4 integrales) |
| Términos extraídos | **71** |
| Clasificados como `rubro` | **60** |
| Clasificados como `calificador` | **11** |

## Regla de clasificación

Un término es **`calificador`** si, y sólo si:

1. describe una **condición de escala, modalidad u operación** que puede atravesar sectores distintos; **o**
2. su parte sectorial **ya existe como término independiente** en esta misma taxonomía.

Todo lo demás es **`rubro`**.

Una cuenta tiene **un rubro principal** y **cero o más calificadores**.

## Regla de recomendación

```
productosRecomendados(cuenta) =
    productos cuyo "Dónde tiene más sentido" contiene cuenta.rubroPrincipal
  ∪ productos cuyo "Dónde tiene más sentido" contiene alguno de cuenta.calificadores
```

⛔ Sin scoring, sin pesos, sin inferencia semántica. Es un mapeo literal y auditable contra el copy.
La recomendación **orienta, no bloquea**: el vendedor puede proponer un producto fuera de ella.

---

## 1. Rubros (60)

| Término (literal del copy) | `id` | Productos que lo nombran |
|---|---|---|
| Academias | `academias` | `agendar-ia` |
| Alimentos y bebidas | `alimentos-y-bebidas` | `ruta-ia` |
| Barberías | `barberias` | `agendar-ia` |
| Bazares | `bazares` | `pulso-digital` |
| Boutiques | `boutiques` | `smart-commerce` |
| Casas de muebles | `casas-de-muebles` | `smart-commerce` |
| Casas de repuestos | `casas-de-repuestos` | `radar-stock`, `precio-vivo` |
| Celulares y tecnología | `celulares-y-tecnologia` | `faro-digital` |
| Centros de estética | `centros-de-estetica` | `agendar-ia` |
| Centros deportivos | `centros-deportivos` | `agendar-ia` |
| Centros velatorios con servicios simultáneos | `centros-velatorios-con-servicios-simultaneos` | `exeq-ia` |
| Climatización | `climatizacion` | `vendedor-24-7`, `cotiza-facil` |
| Clínicas | `clinicas` | `agendar-ia` |
| Clínicas privadas | `clinicas-privadas` | `vendedor-24-7` |
| Concesionarias | `concesionarias` | `vendedor-24-7` |
| Construcción | `construccion` | `cotiza-facil` |
| Consultorios | `consultorios` | `agendar-ia` |
| Corralones | `corralones` | `ruta-ia` |
| Depósitos | `depositos` | `ojo-digital`, `merma-ia` |
| Distribuidoras | `distribuidoras` | `radar-stock`, `merma-ia`, `precio-vivo`, `ruta-ia`, `smart-commerce` |
| Edificios corporativos | `edificios-corporativos` | `park-ia` |
| Electrodomésticos | `electrodomesticos` | `faro-digital`, `smart-commerce` |
| Electrónica | `electronica` | `vendedor-24-7`, `radar-stock`, `merma-ia`, `precio-vivo` |
| Empresas de agua | `empresas-de-agua` | `ruta-ia` |
| Empresas funerarias con varias salas | `empresas-funerarias-con-varias-salas` | `exeq-ia` |
| Equipamiento gastronómico | `equipamiento-gastronomico` | `cotiza-facil` |
| Equipos industriales | `equipos-industriales` | `cotiza-facil` |
| Estacionamientos independientes de 10 a 50 lugares | `estacionamientos-independientes-de-10-a-50-lugares` | `park-ia` |
| Estudios jurídicos y contables | `estudios-juridicos-y-contables` | `agendar-ia` |
| Farmacias | `farmacias` | `ojo-digital`, `pulso-digital`, `radar-stock`, `faro-digital`, `merma-ia`, `smart-commerce` |
| Ferreterías | `ferreterias` | `ojo-digital`, `radar-stock`, `faro-digital`, `merma-ia`, `precio-vivo`, `smart-commerce` |
| Galerías comerciales | `galerias-comerciales` | `park-ia` |
| Gastronomía | `gastronomia` | `ojo-digital` |
| Hoteles | `hoteles` | `park-ia` |
| Importadoras | `importadoras` | `faro-digital`, `precio-vivo` |
| Inmobiliarias | `inmobiliarias` | `vendedor-24-7`, `agendar-ia` |
| Librerías | `librerias` | `smart-commerce` |
| Mercados | `mercados` | `park-ia` |
| Moda | `moda` | `precio-vivo` |
| Moda y calzado | `moda-y-calzado` | `faro-digital` |
| Muebles | `muebles` | `vendedor-24-7`, `cotiza-facil` |
| Peluquerías | `peluquerias` | `pulso-digital` |
| Perfumerías | `perfumerias` | `faro-digital`, `merma-ia` |
| Pet shops | `pet-shops` | `smart-commerce` |
| Repuestos | `repuestos` | `smart-commerce` |
| Restaurantes | `restaurantes` | `pulso-digital` |
| Retail | `retail` | `ojo-digital` |
| Salones de belleza | `salones-de-belleza` | `agendar-ia` |
| Salones de eventos | `salones-de-eventos` | `park-ia` |
| Sanatorios y clínicas | `sanatorios-y-clinicas` | `park-ia` |
| Servicios técnicos | `servicios-tecnicos` | `agendar-ia` |
| Supermercados | `supermercados` | `ojo-digital`, `radar-stock`, `merma-ia` |
| Talleres mecánicos | `talleres-mecanicos` | `agendar-ia` |
| Tecnología | `tecnologia` | `cotiza-facil` |
| Tiendas de calzado y accesorios | `tiendas-de-calzado-y-accesorios` | `smart-commerce` |
| Tiendas de electrodomésticos | `tiendas-de-electrodomesticos` | `pulso-digital` |
| Tiendas de ropa y calzado | `tiendas-de-ropa-y-calzado` | `radar-stock` |
| Universidades | `universidades` | `park-ia` |
| Venta de materiales | `venta-de-materiales` | `vendedor-24-7` |
| Veterinarias | `veterinarias` | `agendar-ia` |

---

## 2. Calificadores (11)

| Término (literal del copy) | `id` | Productos que lo nombran |
|---|---|---|
| Cadenas comerciales | `cadenas-comerciales` | `ojo-digital` |
| Comercios con reparto propio | `comercios-con-reparto-propio` | `ruta-ia` |
| Comercios con varias sucursales | `comercios-con-varias-sucursales` | `pulso-digital` |
| Empresas con venta consultiva | `empresas-con-venta-consultiva` | `cotiza-facil` |
| Farmacias con delivery | `farmacias-con-delivery` | `ruta-ia` |
| Marcas con uno o varios locales | `marcas-con-uno-o-varios-locales` | `smart-commerce` |
| Negocios con cientos o miles de productos | `negocios-con-cientos-o-miles-de-productos` | `precio-vivo` |
| Negocios con varios repartidores | `negocios-con-varios-repartidores` | `ruta-ia` |
| Negocios mayoristas | `negocios-mayoristas` | `smart-commerce` |
| Redes funerarias con más de una sede | `redes-funerarias-con-mas-de-una-sede` | `exeq-ia` |
| Restaurantes con valet | `restaurantes-con-valet` | `park-ia` |

### Por qué cada uno es calificador

| Término | Motivo |
|---|---|
| Cadenas comerciales | Condición de escala. Atraviesa retail, farmacias, supermercados. |
| Comercios con varias sucursales | Condición de escala. |
| Empresas con venta consultiva | Modalidad de venta, no sector. |
| Negocios con cientos o miles de productos | Condición de volumen de catálogo. |
| Negocios con varios repartidores | Condición operativa de logística. |
| Comercios con reparto propio | Condición operativa de logística. |
| Negocios mayoristas | Modalidad comercial. |
| Marcas con uno o varios locales | Condición de escala. |
| Farmacias con delivery | *Farmacias* ya existe como rubro independiente. |
| Restaurantes con valet | *Restaurantes* ya existe como rubro independiente. |
| Redes funerarias con más de una sede | Condición de escala sobre un sector ya cubierto por dos rubros funerarios. |

---

## 3. Términos cercanos que el copy mantiene separados

⛔ **No se fusionan.** El copy los escribe distinto y eso se respeta. Se listan acá para que **administración decida** si corresponde consolidarlos; hasta entonces conviven como términos independientes y la recomendación los trata por separado.

| Familia | Términos que el copy mantiene distintos |
|---|---|
| Electrodomésticos | `Electrodomésticos` · `Tiendas de electrodomésticos` |
| Moda y calzado | `Moda` · `Moda y calzado` · `Tiendas de ropa y calzado` · `Tiendas de calzado y accesorios` · `Boutiques` |
| Repuestos | `Casas de repuestos` · `Repuestos` |
| Muebles | `Muebles` · `Casas de muebles` |
| Tecnología | `Electrónica` · `Tecnología` · `Celulares y tecnología` |
| Salud privada | `Clínicas` · `Clínicas privadas` · `Sanatorios y clínicas` · `Consultorios` |
| Gastronomía | `Gastronomía` · `Restaurantes` · `Equipamiento gastronómico` (este último es proveedor, no gastronómico) |
| Belleza | `Peluquerías` · `Salones de belleza` · `Barberías` · `Centros de estética` |

**Advertencia de producto:** consolidar reduce el ruido en la ficha de cuenta, pero **cambia qué productos se recomiendan**. Por ejemplo, fusionar `Moda` con `Tiendas de ropa y calzado` haría que una boutique reciba también Radar Stock. Puede ser correcto — pero es una decisión comercial, no una limpieza de datos.

---

## 4. Cobertura por producto

Cantidad de términos que nombra cada producto:

| Producto | Rubros | Calificadores | Total |
|---|:--:|:--:|:--:|
| `ojo-digital` | 6 | 1 | 7 |
| `pulso-digital` | 5 | 1 | 6 |
| `vendedor-24-7` | 7 | 0 | 7 |
| `radar-stock` | 7 | 0 | 7 |
| `faro-digital` | 7 | 0 | 7 |
| `merma-ia` | 7 | 0 | 7 |
| `cotiza-facil` | 6 | 1 | 7 |
| `precio-vivo` | 6 | 1 | 7 |
| `ruta-ia` | 4 | 3 | 7 |
| `park-ia` | 8 | 1 | 9 |
| `smart-commerce` | 10 | 2 | 12 |
| `agendar-ia` | 12 | 0 | 12 |
| `exeq-ia` | 2 | 1 | 3 |

---

## 5. Mantenimiento

| # | Regla |
|---|---|
| 1 | Este archivo se regenera **sólo** cuando Lab.IA aprueba un copy nuevo. |
| 2 | Agregar un término que no esté en el copy es una violación de `MASTER_SPEC.md` §0 R3. |
| 3 | Una cuenta sin rubro principal **no se puede crear**: el campo es obligatorio. |
| 4 | Si un vendedor necesita un rubro que no existe acá, abre un pedido en `docs/PEDIDOS.md`. No lo agrega por su cuenta. |
| 5 | La verificación automática está en `scripts/verificar-portafolio.mjs`. |
