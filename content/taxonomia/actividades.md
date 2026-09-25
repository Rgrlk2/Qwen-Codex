# Taxonomía — actividades

> **Dueña: Sesión 3.** Editable y ampliable desde Configuración comercial.
> Arranca desde `semilla-copy.md` y crece con el uso.
> Reglas: `LEEME.md`.

Capa 1: **a qué se dedica el negocio**. Semilla ampliada de 26 actividades
curadas —cubre las seis nombradas en MASTER_SPEC.md §8.1 (incluidas motel y
gomería), las tres de prueba obligatoria de QA_CHECKLIST.md §3.1 (motel,
gomería, criadero de pollos) y una muestra representativa de las familias
de `semilla-copy.md`— más un **heurístico genérico** que arma perfil para
cualquier otro texto.

⛔ **Esto es semilla, no techo.** Cualquier actividad que el vendedor
escriba y no esté en esta lista se crea como `pendiente_de_revision`
(regla T4) y el motor le arma un perfil provisorio igual: nunca responde
"rubro no encontrado".

Espejo en código: `packages/mock/src/datos-motor.ts` → `ACTIVIDADES_CURADAS`.

| id | Actividad | Sinónimos | Operaciones típicas |
|---|---|---|---|
| `act-repuestera` | Repuestera | casa de repuestos · repuestos · autopartes | maneja stock (típica) · catálogo amplio (típica) · compra a proveedores (frecuente) · precios que se mueven (ocasional) |
| `act-restaurante` | Restaurante | gastronomía · resto · parrilla · bar · comida | local con circulación (típica) · turnos/reservas (frecuente) · reparte a domicilio (frecuente) · compra a proveedores (frecuente) |
| `act-odontologia` | Odontología | consultorio odontológico · clínica dental · dentista | turnos (típica) · varios profesionales (frecuente) · atiende WhatsApp (frecuente) |
| `act-peluqueria` | Peluquería | salón de belleza · barbería · centro de estética | turnos (típica) · varios profesionales (típica) · atiende WhatsApp (frecuente) |
| `act-hotel` | Hotel | hospedaje · posada · hostería | administra espacios (típica) · turnos (típica) · precios que se mueven (frecuente) · atiende WhatsApp (frecuente) |
| `act-motel` | Motel | albergue transitorio · hotel por horas | turnos (típica) · precios que se mueven (típica) · atiende WhatsApp (frecuente) · maneja stock (ocasional) · local con circulación (ocasional) |
| `act-veterinaria` | Veterinaria | clínica veterinaria · veterinario | turnos (típica) · maneja stock (frecuente) · atiende WhatsApp (frecuente) |
| `act-gomeria` | Gomería | taller de neumáticos · servicio de gomas | local con circulación (típica) · maneja stock (típica) · atiende WhatsApp (frecuente) · compra a proveedores (frecuente) |
| `act-criadero-de-pollos` | Criadero de pollos | granja avícola · avícola · producción avícola | maneja stock (típica) · compra a proveedores (típica) · precios que se mueven (frecuente) · reparte a domicilio (ocasional) |
| `act-farmacia` | Farmacia | botica · droguería | maneja stock (típica) · catálogo amplio (típica) · reparte a domicilio (frecuente) · atiende WhatsApp (frecuente) |
| `act-ferreteria` | Ferretería | ferretería industrial | catálogo amplio (típica) · maneja stock (típica) · compra a proveedores (frecuente) |
| `act-supermercado` | Supermercado | autoservicio · minimarket · almacén grande | maneja stock (típica) · catálogo amplio (típica) · local con circulación (típica) · compra a proveedores (frecuente) |
| `act-panaderia` | Panadería | panificadora | local con circulación (típica) · maneja stock (frecuente) |
| `act-taller-mecanico` | Taller mecánico | mecánica · taller automotor | turnos (típica) · maneja stock (frecuente) · atiende WhatsApp (frecuente) |
| `act-inmobiliaria` | Inmobiliaria | agencia inmobiliaria · corretaje | atiende WhatsApp (típica) · varios profesionales (frecuente) · catálogo amplio (ocasional) |
| `act-distribuidora` | Distribuidora | mayorista · depósito | reparte a domicilio (típica) · maneja stock (típica) · compra a proveedores (típica) · catálogo amplio (frecuente) |
| `act-funeraria` | Empresa funeraria | funeraria · casa velatoria · servicio fúnebre | administra espacios (típica) · varios profesionales (frecuente) · atiende WhatsApp (frecuente) |
| `act-estacionamiento` | Estacionamiento | parking · playa de estacionamiento · garaje | administra espacios (típica) · precios que se mueven (ocasional) |
| `act-boutique` | Boutique de ropa | tienda de ropa · moda · indumentaria | catálogo amplio (típica) · local con circulación (típica) · precios que se mueven (frecuente) |
| `act-electronica` | Tienda de electrónica | celulares y tecnología · tecnología | catálogo amplio (típica) · maneja stock (típica) · precios que se mueven (frecuente) · atiende WhatsApp (frecuente) |
| `act-perfumeria` | Perfumería | cosmética | catálogo amplio (típica) · maneja stock (frecuente) · local con circulación (frecuente) |
| `act-vivero` | Vivero | jardinería · plantas | maneja stock (típica) · local con circulación (frecuente) · precios que se mueven (ocasional) |
| `act-kiosco-de-barrio` | Kiosco de barrio | despensa · almacén de barrio | maneja stock (típica) · catálogo amplio (frecuente) · atiende WhatsApp (ocasional) |
| `act-estudio-de-arquitectura` | Estudio de arquitectura | estudio de diseño · arquitecto/a | varios profesionales (típica) · atiende WhatsApp (frecuente) · turnos (ocasional) |
| `act-concesionaria` | Concesionaria de vehículos | venta de vehículos · agencia de autos | catálogo amplio (típica) · varios profesionales (frecuente) · atiende WhatsApp (frecuente) |
| `act-climatizacion` | Climatización | aire acondicionado · refrigeración | catálogo amplio (frecuente) · atiende WhatsApp (frecuente) · reparte a domicilio (ocasional) · varios profesionales (ocasional) |

## El heurístico para cualquier otro texto

Cuando el texto escrito no coincide con ninguna fila de arriba (ni con su
nombre ni con sus sinónimos), el motor:

1. Crea la actividad como `pendiente_de_revision`, con el texto tal cual lo
   escribió el vendedor.
2. Busca en el texto libre palabras clave asociadas a cada una de las diez
   operaciones (`operaciones.md`): stock/inventario/depósito → maneja
   stock; turno/reserva/cita → turnos; WhatsApp/consulta → atiende
   WhatsApp; reparto/delivery → reparte a domicilio; local/sucursal/salón →
   local con circulación; profesional/técnico/equipo → varios
   profesionales; variedad/catálogo/modelos → catálogo amplio;
   proveedor/compra/importa → compra a proveedores;
   precio/temporada/mercado → precios que se mueven; espacio/sala/lugar →
   administra espacios.
3. Si ninguna palabra clave aparece (texto genérico o sin información),
   asigna un perfil mínimo por defecto —atiende WhatsApp + local con
   circulación, ambas `ocasional`— para que el motor **nunca** quede sin
   nada que ofrecer.

Así "motel", "gomería" y "criadero de pollos" —ninguno nombrado en el copy
aprobado— tienen perfil curado; y cualquier otro término que el vendedor
invente ("vivero de bonsáis", "escuela de buceo") sale con un perfil
provisorio igual de completo, listo para que el administrador lo confirme
después.
