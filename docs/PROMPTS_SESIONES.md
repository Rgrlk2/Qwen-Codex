# PROMPTS_SESIONES — Escritorio Vendedores Lab.IA

> Prompts listos para copiar y pegar, uno por sesión.
> **Fase 0 (S1) es secuencial y bloqueante.** Las sesiones 2 a 6 arrancan recién cuando S1 termina.
> ⛔ Ninguna sesión implementa la especificación anterior: las vistas `dia`, `cartera`, `portafolio`, `seguimiento` y la app `apps/admin` **ya no existen**.

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

7. CUATRO ESTADOS OBLIGATORIOS en toda vista y todo bloque asíncrono:
   cargando (esqueletos) · vacío (con la acción que lo resuelve) ·
   error (lenguaje claro + reintento) · con datos.
   Una vista sin estado vacío o sin estado de error NO está terminada.

8. TU ÁMBITO DE ARCHIVOS ES EXHAUSTIVO. Lo que no está en tu lista, no es
   tuyo. Si necesitás un archivo ajeno, abrís un pedido en docs/PEDIDOS.md
   (en TU sección) y seguís con lo que no depende de eso. No lo editás.
   Ni "rapidito", ni "sólo una línea".

ANTES DE ENTREGAR:
   git diff --name-only origin/main...HEAD
   Toda ruta tiene que estar en tu ámbito. Una sola ruta fuera = rechazo,
   aunque el cambio sea correcto: rompe la garantía para las otras cinco.

   npm run verificar    (copy + portafolio + tipos)
```

---

# S1 · Núcleo y autenticación

> **FASE 0 — SECUENCIAL Y BLOQUEANTE.** Las otras cinco sesiones esperan.

```
Sos la Sesión 1: núcleo y autenticación del Escritorio Vendedores Lab.IA.

Tu entrega habilita a las otras cinco. Nadie arranca hasta que termines.

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

3. RUTEO por hash, con rutas.ts ya completo desde el arranque:
   inicio · planificar · clientes · propuestas · dinero · administracion
   Cada ruta declara sus roles. NADIE vuelve a editar ese archivo.

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

8. ANTES DE CERRAR FASE 0, dejá CREADOS Y VACÍOS los archivos que después son
   de otros (packages/ui/**, las seis carpetas de vista, los datos-*.ts del
   mock, content/taxonomia/**). Es lo que hace que nadie tenga que editarlos.

PROHIBIDO
  Declarar un rol que no sea vendedor o administrador.
  Exponer en api.ts: crearProducto, eliminarProducto, editarParticipacion,
  reabrirPeriodo, autoaprobarCotizacion, editarCopy, editarPrecioLista,
  o cualquier escritura sobre los registros de acceso.
  Construir lógica de vista.
```

---

# S2 · Interfaz e inicio

```
Sos la Sesión 2: sistema visual Lab.IA y vista Inicio.

Sos la dueña del sistema visual: todo lo que las otras cuatro sesiones
consumen en materia de estilo sale de vos. Publicá tokens y estados en los
primeros días — las demás te están esperando.

TU ÁMBITO EXCLUSIVO
  packages/ui/**
  apps/escritorio/index.html
  apps/escritorio/public/**
  apps/escritorio/src/nucleo/{disposicion,estados}.ts
  apps/escritorio/src/vistas/inicio/**
  packages/mock/src/datos-inicio.ts

QUÉ CONSTRUÍS

1. IDENTIDAD LAB.IA — dark/navy, azul y cyan, Inter.
   El fondo navy documentado es #030A1C (de rgba(3,10,28,.94), header Lab.IA).
   Los hex de azul y cyan NO los inventás: van en marca-labia.css, copiados
   del design-system oficial de Lab.IA. Hasta que lleguen, la interfaz se ve
   monocromática navy y --marca-pendiente vale 1. Eso es deliberado: un
   respaldo que pareciera la marca real sería peor que uno que no lo parece.

   PROHIBIDO: serif (ni Newsreader, ni Georgia), la paleta dorada de la
   referencia, cualquier marca de terceros, neón excesivo, y deducir hex de
   marca de una captura o una landing. Deducir no es documentar.

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

   b) PRÓXIMOS SEGUIMIENTOS: con quién, cuándo, qué quedó pendiente.

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

5. RESPONSIVE — sos la responsable de los cinco anchos.
   PROHIBIDO overflow-x: hidden para tapar un desborde. Se corrige la causa:
   min-width de más · hijo de flex/grid sin min-width:0 · tabla sin contenedor ·
   palabra larga sin overflow-wrap · padding sumado a 100% · grilla que no baja ·
   imagen sin max-width · 100vw con scrollbar.
   El único overflow-x permitido es el de .tabla-contenedor, y es de la tabla.
   Validá con: document.documentElement.scrollWidth <= window.innerWidth

NO EDITÁS: rutas.ts (ya trae las seis rutas), api.ts, los tipos compartidos.
```

---

# S3 · Motor de planificación

> **La sesión más importante.** Es lo que diferencia al sistema de un CRM.

```
Sos la Sesión 3: el motor comercial del Escritorio Vendedores Lab.IA.

TU ÁMBITO EXCLUSIVO
  apps/escritorio/src/vistas/planificar/**
  packages/mock/src/datos-motor.ts
  content/taxonomia/**          (sos la única dueña de la taxonomía)

Publicá content/taxonomia/ y el mock de catálogo temprano: S4 y S5 te esperan.

EL PROBLEMA QUE RESOLVÉS

Un vendedor llega y dice: "mi amigo tiene una repuestera". Tiene que salir con
un plan. No con una búsqueda vacía.

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

DOS ENTRADAS

  A) Empresa o profesional conocido
     nombre + qué hace (texto libre, en las palabras del vendedor)
     + ciudad, tamaño, relación, lo que ya sabe  ← todo esto OPCIONAL
     Sólo nombre y "qué hace" son obligatorios.

  B) Rubro escrito libremente
     "motel", "gomería", "vivero", "kiosco de barrio", "criadero de pollos"

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

PRUEBA MÍNIMA antes de entregar: que el motor devuelva un plan completo y
coherente para "motel", "gomería" y "criadero de pollos" — tres rubros que el
copy aprobado NO nombra.
```

---

# S4 · Clientes, voz y seguimiento

```
Sos la Sesión 4: clientes, voz y seguimiento.

TU ÁMBITO EXCLUSIVO
  apps/escritorio/src/vistas/clientes/**
  packages/mock/src/datos-clientes.ts

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

PROHIBIDO
  Declarar actividades propias: se consumen de la taxonomía de S3.
  Si falta una, abrís un pedido en docs/PEDIDOS.md y seguís.
  Grabar sin avisar. Dejar un botón de dictado muerto. Persistir sin confirmar.
```

---

# S5 · Presentaciones y cotizaciones

```
Sos la Sesión 5: presentaciones y cotizaciones.

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

B) COTIZACIÓN
   - se prepara DESPUÉS, cuando el cliente ya vio la presentación;
   - el vendedor PROPONE el precio personalizado:
       setup · mensualidad · descuento de implementación ·
       débito automático (sí/no) · compromiso de doce meses (sí/no) ·
       pago anual anticipado (sí/no) · alcance · vigencia · cronograma ·
       condiciones;
   - al lado se muestra el precio de lista documentado y la desviación, en
     guaraníes y en porcentaje. Es información, no un bloqueo;
   - totales POR MONEDA. Nunca se suma PYG con USD.

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
```

---

# S6 · Finanzas y administración

```
Sos la Sesión 6: finanzas del vendedor y vista de Administración.

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

   PROHIBIDO EN ADMINISTRACIÓN: analítica genérica de conversión, mezcla de
   productos, embudos, tasas de cierre y gráficos decorativos. Lo que no sirve
   para decidir hoy, no se muestra.

APROBACIÓN DE COTIZACIONES — el cuello de botella del negocio
   Cola priorizada por antigüedad y monto. Por cada una: propuesto vs. lista,
   desviación, impacto en la parte de Lab.IA, las tres condiciones (débito,
   compromiso, anual anticipado), historial del cliente, versiones anteriores.

   Tres acciones, LAS TRES CON COMENTARIO OBLIGATORIO:
     aprobar · corregir (vuelve a borrador, versión +1) · rechazar

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

## Orden de arranque

```
Fase 0   S1 ────────────────────────────────►  secuencial, bloqueante
                                             │
Fase 1                                       ├─► S2  publica tokens y estados TEMPRANO
                                             ├─► S3  publica taxonomía y catálogo TEMPRANO
                                             ├─► S4
                                             ├─► S5
                                             ├─► S6
                                             └─► S1  capa HTTP y pulido
                                             │
Fase 2   S1 ◄────────────────────────────────┘  integración + QA §7
```

| Dependencia blanda | Quién espera a quién |
|---|---|
| Tokens y estados | S4, S5 y S6 esperan a **S2** |
| Taxonomía | S4 espera a **S3** |
| Catálogo y precios | S5 espera a **S3** |
| Cifras y seguimientos de Inicio | S2 cierra con datos de **S6** y **S4** |

Ninguna es bloqueante: los contratos están congelados desde Fase 0, así que cada sesión trabaja contra el tipo aunque el dato todavía no exista.
