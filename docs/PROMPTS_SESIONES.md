# PROMPTS_SESIONES — Escritorio Vendedores Lab.IA

> **Versión 3.0.** Prompts listos para copiar y pegar, uno por sesión.
> **Las seis arrancan al mismo tiempo, desde el mismo commit base, cada una en su rama.**
> ⛔ Ninguna espera a otra. Todo lo que hace falta está congelado en la base (`PARALLEL_SESSIONS.md` §1).
> ⛔ Ninguna sesión implementa una especificación anterior: las vistas `dia`, `cartera`, `portafolio`, `seguimiento` y la app `apps/admin` **no existen**.

---

## Preámbulo común

**Pegar al principio de las seis sesiones.**

```
Trabajás en el Escritorio Vendedores Lab.IA.

ANTES DE ESCRIBIR UNA LÍNEA, leé:
  docs/MASTER_SPEC.md        qué se construye y con qué reglas
  docs/PARALLEL_SESSIONS.md  tu ámbito exacto de archivos
  docs/QA_CHECKLIST.md       qué se verifica antes de entregar

REGLAS QUE NO SE NEGOCIAN, en ninguna sesión:

1. PORTAFOLIO CERRADO EN 13 PRODUCTOS (9 específicas + 4 integrales).
   La amplitud del sistema está en los rubros y las adaptaciones, nunca en
   productos nuevos. Todo producto adicional hallado en la web queda excluido.

2. UNA SOLA APLICACIÓN, UN SOLO LOGIN, DOS ROLES: vendedor y administrador.
   No existen supervisor ni auditor. Administración es una ruta protegida
   dentro de la misma app (#/administracion), no otra aplicación.

3. EL COPY APROBADO NO SE MODIFICA. Vive sólo en content/copy/, verificado por
   hash. Ni una letra, ni una tilde, ni una coma. No se copia a TypeScript.

4. NO SE INVENTAN precios de lista, logos, imágenes ni hex de marca.
   Lo que falta se marca como pendiente; nunca se estima.

5. IDENTIDAD LAB.IA: dark/navy, azul y cyan, tipografía Inter.
   Está prohibida la identidad dorada con serif de la referencia operativa.
   De esa referencia se reutiliza la arquitectura, no la identidad visual.

6. RESPONSIVE POR CAUSA. `overflow-x: hidden` NO es una solución: esconde el
   síntoma. Toda causa se corrige en su origen. Validar en 360, 390, 768,
   1024 y 1440 px, sin scroll horizontal de página.

6b. IDENTIDAD: los OCHO COLORES OFICIALES ya están en
   packages/ui/src/marca-labia.css. No se cambian ni se "ajustan".
   ⛔ #0A55D9 es color de RELLENO: no alcanza AA para texto (3.18 sobre el
   fondo, 2.85 sobre el navy). Para texto o borde de acento: #098CFF o #00D9FF.
   Los logos oficiales están inventariados en docs/INVENTARIO_ACTIVOS.md.

7. CUATRO ESTADOS OBLIGATORIOS en toda vista y todo bloque asíncrono:
   cargando (esqueletos) · vacío (con la acción que lo resuelve) ·
   error (lenguaje claro + reintento) · con datos.
   Una vista sin estado vacío o sin estado de error NO está terminada.

8. TU ÁMBITO DE ARCHIVOS ES EXHAUSTIVO. Lo que no está en tu lista, no es
   tuyo. Si necesitás un archivo ajeno, abrís un pedido en docs/PEDIDOS.md
   (en TU sección) y seguís con lo que no depende de eso. No lo editás.
   Ni "rapidito", ni "sólo una línea".

TU RAMA — ya existe, sólo hacés checkout:

   git fetch origin
   git checkout sesion/<la tuya>

   Trabajás ahí y abrís UN PR contra `integracion/escritorio`.
   ⛔ Nunca contra main. ⛔ Nunca mergeás la rama de otra sesión.
   ⛔ No esperás a nadie: todo lo que necesitás está en la base.

ANTES DE ABRIR EL PR:
   git diff --name-only origin/integracion/escritorio...HEAD
   Toda ruta tiene que estar en tu ámbito. Una sola ruta fuera = rechazo,
   aunque el cambio sea correcto: rompe la garantía para las otras cinco.

   npm run verificar    (copy + portafolio + identidad + rutas + tipos)
```

---

# S1 · Núcleo y autenticación

> Rama: `sesion/1-nucleo-autenticacion`

```
Sos la Sesión 1: núcleo y autenticación del Escritorio Vendedores Lab.IA.

Los contratos, los tipos y el registro de rutas YA ESTÁN congelados en el
commit base. Tu trabajo es la autenticación, la guardia de rol y la capa HTTP
—no volver a definir contratos. Las otras cinco sesiones ya están trabajando.

TU ÁMBITO EXCLUSIVO
  package.json · tsconfig.base.json · .gitignore · .editorconfig · .nvmrc · README.md
  packages/compartido/**
  packages/mock/{package.json,tsconfig.json,src/index.ts,src/nucleo.ts,src/datos-sesion.ts}
  apps/escritorio/{package.json,tsconfig.json,vite.config.ts}
  apps/escritorio/src/main.ts
  apps/escritorio/src/nucleo/{rutas,guardia-rol,contrato-vista,formato}.ts
  apps/escritorio/src/datos/**
  apps/escritorio/src/vistas/ingreso/**
  scripts/**

QUÉ CONSTRUÍS

1. INGRESO
   Una sola pantalla de login, usuario y contraseña, para toda la aplicación.
   No hay una pantalla de ingreso de administrador aparte.
   - Error genérico ante credenciales inválidas: NO revela si el usuario existe.
   - Cada ingreso e intento fallido queda en RegistroAcceso.
   - Accesible: etiquetas reales, foco visible, envío con Enter.

2. GUARDIA DE ROL — la parte que más importa
   La ruta #/administracion se bloquea EN EL RUTEO Y EN LA CAPA DE DATOS.
   Ocultar el enlace no es proteger. Un vendedor que escribe la URL a mano o
   llama un método de CapaAdministracion recibe un rechazo claro, no una
   pantalla en blanco ni una redirección silenciosa que lo confunda.
   El mock tiene que respetar la misma guardia: si el mock es permisivo,
   la guardia no se prueba nunca.

3. RUTEO por hash, con rutas.ts ya completo desde la base. Las SIETE rutas:
   ingreso · inicio · planificar · clientes · agenda · propuestas · dinero ·
   administracion
   Cada ruta declara sus roles. ⛔ NADIE vuelve a editar ese archivo.

4. TIPOS COMPARTIDOS congelados (packages/compartido/).
   Sin `any`. Modo estricto. Ese contrato es la barrera entre seis sesiones:
   un `any` la anula.

5. CAPA DE DATOS: interfaz única CapaDatos, con implementación HTTP.
   Traduce HTTP ⇄ Resultado<T> según API_CONTRACTS.md §1.
   Ningún mensaje de error puede contener un código HTTP, un nombre de tabla
   ni una traza. El usuario lee castellano, no errores de servidor.

6. NÚCLEO DEL MOCK: latencia simulada, falla forzada, modo vacío y rol
   configurable, para que las otras sesiones prueben sus tres estados.

7. FORMATO es-PY: fechas y números con Intl, zona America/Asuncion.
   Moneda SIEMPRE explícita: "Gs." para PYG, "USD" para dólares.
   Nunca un número pelado. Importes con tabular-nums.

8. LA CAPA HTTP: traducir HTTP ⇄ Resultado<T> según API_CONTRACTS §1,
   incluida la investigación automática (que corre en el servidor) y la agenda.

9. ⛔ VERIFICÁ QUE NINGUNA CLAVE DE PROVEEDOR PUEDA LLEGAR AL CLIENTE.
   El script scripts/verificar-portafolio.mjs ya lo chequea; mantenelo.

PROHIBIDO
  Declarar un rol que no sea vendedor o administrador.
  Exponer en api.ts: crearProducto, eliminarProducto, editarParticipacion,
  reabrirPeriodo, autoaprobarCotizacion, editarCopy, editarPrecioLista,
  borrarEntrada (de agenda), o cualquier escritura sobre los registros de acceso.
  Poner una clave de proveedor externo en código del cliente.
  Construir lógica de vista.
```

---

# S2 · Interfaz e inicio

> Rama: `sesion/2-interfaz-inicio`

```
Sos la Sesión 2: sistema visual Lab.IA y vista Inicio.

Los OCHO COLORES OFICIALES y Inter YA ESTÁN en la base, así que nadie te
espera. Tu trabajo es construir los componentes, los cuatro estados y la
vista Inicio sobre esa identidad ya definida.

TU ÁMBITO EXCLUSIVO
  packages/ui/**
  apps/escritorio/index.html
  apps/escritorio/public/**
  apps/escritorio/src/nucleo/{disposicion,estados}.ts
  apps/escritorio/src/vistas/inicio/**
  packages/mock/src/datos-inicio.ts

QUÉ CONSTRUÍS

1. IDENTIDAD LAB.IA — los ocho colores oficiales, ya cargados:

     #020711  fondo          #06162F  navy
     #0A55D9  azul           #098CFF  azul claro
     #00D9FF  cyan           #12D9FF  cyan claro
     #F2F7FF  texto          #AEB8C8  texto secundario

     Tipografía: Inter.

   ⛔ LA REGLA QUE MÁS SE OLVIDA: #0A55D9 es color de RELLENO, no de texto.
      Contraste 3.18 sobre el fondo y 2.85 sobre el navy: no llega ni a 3:1.
      Sirve para superficies elevadas, bloques de color y barras.
      Para texto o borde de acento: #098CFF (5.96) o #00D9FF (11.88).
      Es el error más fácil de cometer, porque es el azul que más "se siente
      Lab.IA" y da ganas de usarlo para todo.

   Todo token derivado es uno de los ocho, o uno de los ocho con transparencia.
   ⛔ No se inventa ningún hex nuevo.

   LOS LOGOS están inventariados en docs/INVENTARIO_ACTIVOS.md con su enlace
   de Drive, su versión elegida y su estado. Bajalos, OPTIMIZALOS (son PNG de
   1 a 2 MB) y ponelos en apps/escritorio/public/.
   ⛔ No redibujar, no recolorear, no deformar. object-fit: contain.
   ⛔ El logo del producto EXCLUIDO está en la misma carpeta de Drive que los
      13. No lo incorpores.
   ⛔ Falta el logo de Park.IA: no lo generes. Está pedido.

   PROHIBIDO: serif (ni Newsreader, ni Georgia), la paleta dorada de la
   referencia, cualquier marca de terceros, neón excesivo.

2. LA CÁSCARA
   ≥ 900 px: barra lateral de 248 px con las vistas del rol (5 vendedor, 6 admin).
   < 900 px: barra inferior de 64 px con 5 destinos + "Más".
   "Más" agrupa Dinero y, si el rol lo permite, Administración.
   Seis íconos a 360 px dejan áreas táctiles bajo el mínimo de 44 px.

3. LOS CUATRO ESTADOS, como piezas reutilizables:
   cargando (esqueletos con la forma del contenido real, role="status")
   vacío (explica qué falta Y ofrece la acción que lo resuelve)
   error (causa clara + "Volver a intentar", role="alert", sin códigos)
   con datos
   Un bloque que falla NO tumba la vista.

4. VISTA INICIO — "la planificación es el comienzo"

   a) CUATRO CIFRAS, por moneda:
      dinero vendido · dinero cobrado · comisión acumulada · comisión pendiente

   b) PRÓXIMOS SEGUIMIENTOS: LISTA CORTA, tres a cinco entradas: con quién,
      cuándo, qué quedó pendiente. Al pie, el ACCESO A AGENDA con dos
      contadores: pendientes de hoy y atrasados.
      ⛔ Inicio NO es la agenda. El calendario, el cronograma y el detalle
         viven en #/agenda, que es de S4.

   c) DOS ACCIONES PROTAGONISTAS — el elemento visual DOMINANTE:

        🔍 Investigar una empresa o un profesional que conozco
           "Mi amigo tiene una repuestera", "mi odontóloga"

        🧭 Explorar oportunidades por rubro
           "Quiero ver qué le puedo vender a las peluquerías"

      Son dos tarjetas grandes, no dos botones en una barra. Ocupan más
      superficie visual que las cuatro cifras juntas. Mínimo 160 px de alto en
      escritorio, 120 px en celular. Dos columnas en ≥ 768 px, apiladas debajo.
      Son <a> o <button> reales, enfocables. Nunca un div con onclick.

      CON LA CUENTA VACÍA quedan como LO ÚNICO ACCIONABLE de la pantalla, y
      las cifras muestran su estado vacío con texto honesto ("Todavía no
      registraste ventas"). Ése es el arranque esperado de un vendedor nuevo,
      no un error.

   PROHIBIDO EN INICIO: gráficos decorativos, embudos de conversión, tasas de
   cierre, mezcla de productos. Cuatro cifras, una lista y dos acciones.
   (El contrato no expone métodos de analítica: no hay con qué dibujarlos.)

5. LA BARRA INFERIOR de celular: 5 destinos + "Más".
   Fijos los cuatro de uso diario: Inicio · Planificar · Clientes · Agenda.
   "Más" agrupa Propuestas, Dinero y, si el rol lo permite, Administración.
   Seis o siete íconos a 360 px dejan áreas táctiles bajo el mínimo de 44 px.

6. RESPONSIVE — sos la responsable de los cinco anchos.
   PROHIBIDO overflow-x: hidden para tapar un desborde. Se corrige la causa:
   min-width de más · hijo de flex/grid sin min-width:0 · tabla sin contenedor ·
   palabra larga sin overflow-wrap · padding sumado a 100% · grilla que no baja ·
   imagen sin max-width · 100vw con scrollbar.
   El único overflow-x permitido es el de .tabla-contenedor, y es de la tabla.
   Validá con: document.documentElement.scrollWidth <= window.innerWidth

NO EDITÁS: rutas.ts (ya trae las seis rutas), api.ts, los tipos compartidos.
```

---

# S3 · Motor de planificación e investigación automática

> Rama: `sesion/3-motor-investigacion`
> **La sesión más importante.** Es lo que diferencia al sistema de un CRM.

```
Sos la Sesión 3: el motor comercial del Escritorio Vendedores Lab.IA.

TU ÁMBITO EXCLUSIVO
  apps/escritorio/src/vistas/planificar/**
  packages/mock/src/datos-motor.ts
  packages/mock/src/datos-investigacion.ts
  content/taxonomia/**          (sos la única dueña de la taxonomía)

Nadie te espera: la taxonomía semilla y el catálogo de 13 ya están en la base.

EL PROBLEMA QUE RESOLVÉS

Un vendedor escribe un RUC, o "mi amigo tiene una repuestera", o simplemente
"motel". Tiene que salir con un plan completo. No con un formulario vacío.

════════════════════════════════════════════════════════════════════════
PARTE 1 — INVESTIGACIÓN AUTOMÁTICA
════════════════════════════════════════════════════════════════════════

EL PRINCIPIO: el vendedor NO investiga ni completa el perfil a mano.
Escribe el dato mínimo; vos investigás; él confirma, corrige o agrega.

LO QUE RECIBÍS
  Empresa:      RUC, razón social o nombre comercial — basta UNO
  Profesional:  nombre + profesión o especialidad
                matrícula y ciudad SÓLO SI LAS TIENE A MANO (⛔ no se le piden)
  Rubro:        texto libre (se conserva la entrada por rubro tal cual estaba)

LO QUE DEVOLVÉS, dato por dato
  actividad/rubro · ubicación · canales digitales · sitio web y redes ·
  productos o servicios observables · señales operativas · posibles decisores ·
  tamaño aproximado (SÓLO si hay evidencia) · dolores probables ·
  productos Lab.IA recomendados · fuentes consultadas · fecha de investigación ·
  nivel de confianza de cada dato

LAS TRES CLASIFICACIONES — obligatorias y visibles en pantalla
  verificado     → aparece en una fuente pública identificable
                   exige fuente y nivel de confianza
  inferido       → lo dedujiste vos
                   exige el razonamiento escrito y nivel de confianza
                   ⛔ se muestra SIEMPRE como hipótesis
  no encontrado  → no se halló
                   ⛔ valor en blanco. No se rellena, no se estima

⛔ TAMAÑO APROXIMADO: sólo con evidencia. Sin evidencia, "no encontrado".

DÓNDE CORRE
  ⛔ La investigación y TODO uso de modelo de lenguaje ocurren en el SERVIDOR,
     detrás de proveedores intercambiables.
  ⛔ NINGUNA clave de API, ningún token, ninguna llamada a un proveedor externo
     puede vivir en el navegador. El cliente recibe el resultado ya resuelto.
  Los proveedores se declaran como CONTRATO, no como elección: el proveedor
  definitivo se decide después. Hay tres familias: búsqueda, registros
  públicos y modelo de lenguaje.

CUANDO FALLA — la parte que más importa
  ⛔ NUNCA le entregues al vendedor un formulario largo vacío.
  1. Caés a la TAXONOMÍA como respaldo: con la actividad sola ya podés armar
     un perfil típico y un ranking.
  2. Marcás usoRespaldoTaxonomia y lo decís en pantalla.
  3. Pedís ÚNICAMENTE los datos mínimos faltantes: uno, dos, a lo sumo tres
     campos, cada uno con su pregunta y con POR QUÉ HACE FALTA.
  4. Entregás el plan igual, con menor confianza declarada.

  Un sistema que falla y devuelve un formulario en blanco es peor que no tener
  sistema: le hizo perder tiempo al vendedor y no le resolvió nada.

QUÉ HACE EL VENDEDOR
  Sólo tres cosas: confirmar · corregir · agregar.
  Cada corrección RECALCULA el plan y MUESTRA QUÉ CAMBIÓ.

════════════════════════════════════════════════════════════════════════
PARTE 2 — EL MOTOR
════════════════════════════════════════════════════════════════════════

LA TAXONOMÍA ES EDITABLE Y AMPLIABLE — TRES CAPAS

  Actividad  ──tiene──►  Operaciones típicas
  Operación  ──genera─►  Necesidades probables
  Necesidad  ──la atiende──►  Producto (de los 13), con su nivel de encaje

  Actividad:  repuestera · restaurante · odontología · peluquería · hotel ·
              motel · veterinaria · gomería · lo que escriba el vendedor
  Operación:  maneja stock · trabaja con turnos · atiende por WhatsApp ·
              reparte a domicilio · tiene local con circulación · varios
              profesionales · catálogo amplio · compra a proveedores ·
              precios que se mueven · administra espacios
  Necesidad:  pierde ventas fuera de horario · no sabe qué reponer · se le
              pierde mercadería · agenda desordenada · precios desactualizados

  PROHIBIDO limitarse a los textos literales de "Dónde tiene más sentido".
  Esa lista (content/taxonomia/semilla-copy.md, 71 términos) es la SEMILLA,
  no el techo. PROHIBIDO usar únicamente mapeo literal.

  Toda relación guarda su MOTIVO. Sin motivo no se guarda: es lo que permite
  responder "¿por qué éste primero?".

  PROHIBIDO responder "rubro no encontrado". Un término que no existe SE CREA
  como pendiente_de_revision, queda usable de inmediato y el administrador lo
  confirma después. El motor no frena al vendedor. Nunca.

LA SALIDA — siempre la misma estructura

   1. Cómo funciona ese negocio (perfil operativo inferido)
   2. Dolores probables — cada uno COMO HIPÓTESIS, con su motivo
   3. Los 13 productos ORDENADOS del 1.º al 13.º, top 10 como lista de trabajo,
      cada posición con su "por qué"
   4. Producto 1, 2 y 3 destacados
   5. Combos sugeridos, con el argumento que los une
   6. Encaje por producto: directo · cercano · adaptable · no_recomendado
   7. La adaptación necesaria, en cercano y adaptable
   8. Estrategia de entrada: por dónde empezar, con qué producto, con qué gancho
   9. Argumentos, apoyados en el copy aprobado y citando de dónde salen
  10. Preguntas de confirmación para validar cada dolor inferido

  El vendedor puede corregir el perfil ("no, no tiene reparto propio") y el
  plan se recalcula MOSTRANDO QUÉ CAMBIÓ.

TAMBIÉN CONSTRUÍS
  - La ficha de los 13 productos: copy aprobado servido TAL CUAL, en el orden
    del documento fuente. Las secciones que un producto no tiene, no se
    muestran ni se rellenan.
  - El formulario de sugerencia de producto nuevo, para cuando ninguno encaja.

PROHIBIDO
  Editar una letra del copy aprobado.
  Hardcodear slogans o precios en TypeScript (el copy vive en content/copy/).
  Proponer un producto fuera de los 13.
  Inventar un precio.
  Rechazar un rubro escrito por el vendedor.
  Presentar una inferencia como hecho verificado.

PRUEBAS MÍNIMAS antes de abrir el PR

  1. El motor devuelve un plan completo y coherente para "motel", "gomería" y
     "criadero de pollos" — tres rubros que el copy aprobado NO nombra.
  2. Una investigación con las fuentes caídas devuelve un plan usable y pide
     UNO O DOS campos, no un formulario.
  3. Un dato inferido se ve claramente distinto de uno verificado, EN TEXTO,
     no sólo por color.
  4. Buscar "apiKey", "secret" o "token:" en tu diff no devuelve nada.

TU MOCK (datos-investigacion.ts) debe cubrir CINCO escenarios:
  completa · parcial · fuentes caídas · sin resultados · error
  El tercero es el más importante: es el que prueba que no le tirás al
  vendedor un formulario vacío cuando algo falla.
```

---

# S4 · Clientes, voz, seguimiento y agenda

> Rama: `sesion/4-clientes-agenda`

```
Sos la Sesión 4: clientes, voz, seguimiento y AGENDA OPERATIVA.

TU ÁMBITO EXCLUSIVO
  apps/escritorio/src/vistas/clientes/**
  apps/escritorio/src/vistas/agenda/**
  packages/mock/src/datos-clientes.ts
  packages/mock/src/datos-agenda.ts

Nadie te espera: la taxonomía semilla, los tipos y los tokens ya están en la base.

QUÉ CONSTRUÍS

1. LISTA DE CLIENTES
   nombre · tipo (empresa / profesional) · actividad · etapa ·
   última interacción · próximo paso.

2. FICHA DEL CLIENTE
   Datos, contactos, actividad, plan de planificación asociado, productos
   propuestos y contratados, y LÍNEA DE TIEMPO UNIFICADA: seguimientos,
   presentaciones, cotizaciones y aperturas de enlaces, todo junto y ordenado.

3. SEGUIMIENTO POR VOZ Y POR TEXTO
   Misma entidad, mismo procesamiento. La paridad es un requisito.

   VOZ:
     - pide permiso de micrófono;
     - AVISA EXPLÍCITAMENTE que está grabando;
     - guarda audio + transcripción, y la transcripción es EDITABLE;
     - si el dispositivo no soporta dictado: lo informa con texto claro y
       ofrece el camino de texto. NUNCA UN BOTÓN INERTE.

   DE UNA CAPTURA se PROPONEN (no se guardan):
     nota estructurada · pasos con vencimiento · cambio de etapa sugerido ·
     productos mencionados (validados contra los 13) · borrador de respuesta.

   LA REGLA MÁS IMPORTANTE DE ESTA SESIÓN:
     NADA DERIVADO DE VOZ O TEXTO SE PERSISTE SIN QUE EL VENDEDOR LO CONFIRME,
     ÍTEM POR ÍTEM. El sistema propone; la persona guarda.
     El contrato lo exige: guardarSeguimiento pide confirmadoPorUsuario: true.

   Las menciones a cosas fuera del catálogo se descartan o van a sugerencia.
   NUNCA crean un producto.

   El audio tiene retención configurable. Borrarlo NO borra la transcripción
   ni el seguimiento.

4. LA AGENDA OPERATIVA — ruta #/agenda, para vendedor y administrador

   EL PRINCIPIO: LA AGENDA SE PUEBLA SOLA.
   El vendedor ajusta fechas y completa acciones. ⛔ No reconstruye nada.

   Una agenda que hay que cargar entera es una agenda que nadie carga.
   Y una agenda vacía no avisa de nada.

   SE ALIMENTA AUTOMÁTICAMENTE DE:
     planes (sus hitos) · objetivos aceptados · seguimientos (pasos
     confirmados) · presentaciones (recordatorio tras el envío) ·
     cotizaciones (vigencia, espera de revisión, espera del cliente) ·
     vencimientos · APERTURAS DE ENLACE — cuando el cliente abre lo que se le
     mandó, ése es el momento de llamar

   CINCO VISTAS INTERNAS:
     Hoy         visitas · llamadas · próximos pasos · vencimientos · atrasados
     Semana      los siete días con su carga
     Mes         calendario mensual con la densidad de cada día
     Cronograma  Gantt comercial: la vida de cada cliente y cada plan
     Atrasados   lo que se pasó de fecha y sigue pendiente, con días de atraso

   LO QUE PUEDE HACER EL VENDEDOR:
     · ajustar una fecha  → ⛔ EXIGE MOTIVO
     · completar una acción
     · descartar una entrada → con motivo; no se borra, queda descartada
     · crear a mano → ⛔ SÓLO visitas, llamadas y próximos pasos. Es la
       excepción. Si la mayoría de las entradas son manuales, la agenda no
       está funcionando.

   ⛔ Un atraso NO se oculta ni se reprograma solo. Se ve hasta que alguien lo
      resuelve o lo descarta con motivo.
   ⛔ NO existe borrarEntrada.

   RESPONSIVE: el cronograma es el elemento más ancho del sistema y el que más
   tienta a tapar con overflow-x: hidden. Va en su propio contenedor con
   overflow-x: auto. El calendario a 360 px muestra densidad, no contenido.

   ACCESIBILIDAD: el cronograma necesita ALTERNATIVA EN LISTA. Un Gantt no se
   lee con lector de pantalla.

PROHIBIDO
  Declarar actividades propias: se consumen de la taxonomía de S3.
  Si falta una, abrís un pedido en docs/PEDIDOS.md y seguís.
  Grabar sin avisar. Dejar un botón de dictado muerto. Persistir sin confirmar.
  Hacer que el vendedor cargue la agenda a mano.
  Ocultar o reprogramar un atraso automáticamente.
```

---

# S5 · Presentaciones y cotizaciones

> Rama: `sesion/5-propuestas-cotizaciones`

```
Sos la Sesión 5: presentaciones y cotizaciones estructuradas.

Nadie te espera: el catálogo de 13, los tipos y los tokens ya están en la base.

TU ÁMBITO EXCLUSIVO
  apps/escritorio/src/vistas/propuestas/**
  packages/mock/src/datos-propuestas.ts

SON DOS COSAS DISTINTAS Y NUNCA SE MEZCLAN

A) PRESENTACIÓN PARA DEJAR AL CLIENTE
   - se genera PRIMERO, antes de hablar de plata;
   - personalizada, visual, compartible;
   - contenido: copy aprobado de los productos elegidos, casos de uso del
     rubro del cliente, el plan de la vista Planificar en lenguaje de cliente;
   - SIN PRECIO DEFINITIVO. Si mostrás un rango documentado, va marcado como
     referencia;
   - NO REQUIERE APROBACIÓN;
   - salida: PDF y enlace compartible.

B) COTIZACIÓN ESTRUCTURADA
   - se prepara DESPUÉS, cuando el cliente ya vio la presentación;
   - al lado del precio propuesto se muestra el de lista y la desviación, en
     guaraníes y en porcentaje. Es información, no un bloqueo;
   - totales POR MONEDA. Nunca se suma PYG con USD.

   LA ESTRUCTURA NO LA INVENTAMOS: sale de la Carta Oferta real de Agendar.IA
   para la Dra. Claudia Leguizamón (docs/INVENTARIO_ACTIVOS.md §4, y
   COMMERCIAL_RULES §6 con el desglose completo). Leé esa sección antes de
   modelar la pantalla.

   PRECIO PROPUESTO
     · setup + descuento de setup (porcentaje O importe, nunca los dos)
     · mensualidad
     · límites incluidos por ítem: "+400 consultas/mes", usuarios, canales

   HITOS DE PAGO DEL SETUP — cada uno por porcentaje O por importe
     · al aceptar                "50 % al aceptar"
     · al entregar / al conectar "50 % con versión conectada"
     · fecha fija                "27 JUL · Gs. 1.425.000 · Reserva"
     ⛔ Si todos son porcentuales, DEBEN SUMAR 100.
     ⛔ Si son importes, DEBEN SUMAR el setup con su descuento aplicado.
     ⛔ Una cotización cuyos hitos no cierran NO se envía a revisión.

   PERMANENCIA
     · meses incluidos            "primer mes operativo incluido" → 1
     · congelamiento del precio   "congelado 12 meses" → 12

   BENEFICIOS Y LO QUE LOS HABILITA
     · débito automático (sí/no)
     · compromiso de doce meses (sí/no)
     · pago anual anticipado (sí/no)
     ⛔ CADA beneficio declara la CONDICIÓN que lo habilita y QUÉ PASA SI EL
        CLIENTE DEJA DE CUMPLIRLA. Un descuento sin condición escrita es un
        descuento que después nadie puede reclamar: si el cliente da de baja
        al cuarto mes y el descuento estaba atado a doce, hay que poder
        mostrarlo en el documento que firmó.
     ⛔ Un beneficio sin condición habilitante no se aprueba.

   ALCANCE Y PLAN DE TRABAJO
     · alcance: qué incluye
     · EXCLUSIONES: qué NO incluye ("comisiones de pasarela y consumos
       extraordinarios se cobran aparte")
     · vigencia de la oferta
     · cronograma por etapas, con fecha estimada, entregable e IMPORTE
       ASOCIADO si esa etapa dispara un cobro
     · condiciones comerciales y tratamiento del IVA

EL CIRCUITO, SIN DESVÍOS

   borrador del vendedor
     → revisión del administrador
     → aprobada o corregida
     → PDF definitivo
     → envío al cliente

LA REGLA MÁS IMPORTANTE DE ESTA SESIÓN

   NINGÚN VENDEDOR PUEDE ENVIAR UNA COTIZACIÓN FINAL SIN APROBACIÓN DEL
   ADMINISTRADOR. Sin umbral, sin excepción, sin autoaprobación por tiempo,
   monto ni antigüedad.

   No alcanza con esconder el botón. Probá los tres caminos:
     · el botón     · la URL directa     · la llamada a la capa de datos
   emitirPdfDefinitivo y enviarAlCliente sobre una cotización no aprobada
   devuelven requiere_aprobacion. Verificá que así sea.

   El PDF DEFINITIVO se emite DESPUÉS de aprobar. Nunca antes.
   Una cotización aprobada es inmutable: editarla crea versión nueva y CADUCA
   la aprobación anterior.

TAMBIÉN CONSTRUÍS
   Enlaces compartibles con vencimiento, tope de aperturas y revocación
   inmediata. El token es OPACO: no deriva del cliente, de la cotización ni de
   ningún dato. La URL no lleva datos personales.
   Y el registro de aperturas: cuándo abrió el cliente, desde qué tipo de
   dispositivo, de qué país aproximado. SIN identificar a la persona: nada de
   IP completa, user-agent crudo ni correlación entre enlaces.

PROHIBIDO
  Implementar la aprobación (es de S6). Implementar reglas de participación
  (son de S6). Poner precio definitivo en una presentación. Sumar monedas.
  Enviar a revisión una cotización cuyos hitos de pago no suman.
  Otorgar un beneficio sin escribir la condición que lo habilita.
  Tratar el precio de una Carta Oferta anterior como precio de lista.
```

---

# S6 · Finanzas y administración

> Rama: `sesion/6-finanzas-administracion`

```
Sos la Sesión 6: finanzas del vendedor y vista de Administración.

Nadie te espera: los tipos, los tokens y el catálogo ya están en la base.

TU ÁMBITO EXCLUSIVO
  apps/escritorio/src/vistas/dinero/**
  apps/escritorio/src/vistas/administracion/**
  packages/mock/src/datos-finanzas.ts

Tenés las dos porque el panel del vendedor es el espejo del panel del
administrador. Si los hacen dos personas, la regla 50/50 se implementa dos
veces y diverge.

LA REGLA COMERCIAL — VIGENTE, NO PENDIENTE

   50 % Lab.IA / 50 % vendedor
   sobre el SETUP y sobre las MENSUALIDADES
   configurable POR PRODUCTO
   meses de participación del vendedor configurables POR PRODUCTO
   (por defecto: sin límite mientras la mensualidad esté activa)

   porcentajeLabIA + porcentajeVendedor = 100. SIEMPRE. Otra suma se rechaza.
   Se devenga sobre lo COBRADO, no sobre lo vendido: plata que no entró no
   genera comisión pagable.
   Cambiar la participación PUBLICA UNA VERSIÓN NUEVA. No se edita la vigente.
   Lo ya devengado conserva la versión con que se calculó.

VISTA DINERO (vendedor) — OCHO CIFRAS, por moneda
   vendido · cobrado · por cobrar · parte de Lab.IA · parte del vendedor ·
   comisión pendiente · comisión pagada · mensualidades vigentes

   Más el detalle por operación y las mensualidades con sus meses acumulados.
   El vendedor NO EDITA nada: puede abrir una observación sobre una línea,
   que no modifica ningún importe y la resuelve el administrador.

VISTA ADMINISTRACIÓN — UNA sola vista con SECCIONES INTERNAS
   No es otra app ni un menú de diez pantallas.

   · Control financiero — vendido, cobrado, por cobrar, parte Lab.IA, parte de
     cada vendedor, por moneda
   · Presupuesto de ventas — meta por vendedor y período contra lo real
   · Vendido, cobrado y por cobrar — por cliente, producto y vendedor, con
     ANTIGÜEDAD de lo no cobrado
   · Comisiones — devengado, pendiente y pagado; cierre de período; ajustes
   · Ranking — vendedores ordenados POR MONTO EN GUARANÍES.
     No por puntajes, no por porcentajes, no por medallas.
   · Accesos y frecuencia de uso — quién entra, cada cuánto, desde cuándo no
     entra. Sirve para saber quién está trabajando.
   · Todos los clientes e historiales — cartera completa, línea de tiempo entera
   · Aprobación de cotizaciones — la cola de trabajo (abajo)
   · Configuración comercial — participación por producto, meses de
     participación, presupuestos, taxonomía pendiente, vendedores, vigencias
   · Sugerencias de nuevos productos — backlog y resolución

   Y además, en Configuración: ESTADO DE LOS PROVEEDORES de investigación y
   de modelo de lenguaje — cuáles responden, y si el sistema está en modo
   respaldo por taxonomía. ⛔ SÓLO LECTURA: las claves viven en el servidor.

   PROHIBIDO EN ADMINISTRACIÓN: analítica genérica de conversión, mezcla de
   productos, embudos, tasas de cierre y gráficos decorativos. Lo que no sirve
   para decidir hoy, no se muestra.

APROBACIÓN DE COTIZACIONES — el cuello de botella del negocio
   Cola priorizada por antigüedad y monto. Por cada una: propuesto vs. lista,
   desviación, impacto en la parte de Lab.IA, las tres condiciones (débito,
   compromiso, anual anticipado), historial del cliente, versiones anteriores.

   Tres acciones, LAS TRES CON COMENTARIO OBLIGATORIO:
     aprobar · corregir (vuelve a borrador, versión +1) · rechazar

   AL REVISAR se muestra, además del precio: la SUMA DE LOS HITOS DE PAGO y si
   cierra · los meses incluidos y el congelamiento · las tres condiciones · y
   QUÉ HABILITA cada beneficio. Una cotización cuyos hitos no suman, o con un
   beneficio sin condición escrita, NO SE APRUEBA.

   Nadie aprueba su propia cotización.
   NO HAY AUTOAPROBACIÓN por tiempo, monto ni antigüedad.

CIERRE DE PERÍODO
   Manual y explícito. Verifica antes: cotizaciones sin resolver, cobros sin
   confirmar, observaciones abiertas. Si hay bloqueos, los lista y no cierra.
   Un período cerrado NO SE REABRE. Toda corrección es un ajuste en el
   siguiente, con motivo obligatorio.

PROHIBIDO
  Dar al vendedor cualquier ruta de escritura sobre participaciones, líneas o
  liquidaciones. Publicar una participación que no sume 100. Devengar sobre
  plata no cobrada. Implementar reabrirPeriodo, editarParticipacion o
  crearProducto. Escribir sobre los registros de acceso. Mezclar el registro
  de aperturas de enlace con el registro de uso del sistema en una misma lista.
```

---

## Arranque

```
                 COMMIT BASE  (contratos · tipos · rutas · catálogo ·
                      │        copy · identidad · activos · investigación)
      ┌───────┬───────┼───────┬───────┬───────┐
      ▼       ▼       ▼       ▼       ▼       ▼
     S1      S2      S3      S4      S5      S6      ← las seis, al mismo tiempo
      │       │       │       │       │       │
      └───────┴───────┴───┬───┴───────┴───────┘
                          ▼
              integracion/escritorio               ← un PR por sesión
                          │
                          ▼
                     QA §7 completo
```

⛔ **Ninguna sesión espera a otra.** Lo que antes eran dependencias —tokens,
taxonomía, catálogo, forma de la investigación— **está congelado en la base**.

Cada sesión trabaja contra **su propio mock**. La integración cablea los datos
reales entre vistas (Inicio consume cifras de S6 y agenda de S4).

| Regla de rama | |
|---|---|
| Sale de | el commit base |
| Trabaja en | `sesion/<n>-<nombre>` |
| Abre PR contra | `integracion/escritorio` |
| ⛔ Nunca | contra `main`, ni mergeando la rama de otra sesión |
