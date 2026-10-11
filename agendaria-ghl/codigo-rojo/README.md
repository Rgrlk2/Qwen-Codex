# Código Rojo — botón de la Dra.

Página con PIN y una función Netlify. La Dra. elige motivo y duración (1–4 h desde ahora), ve los turnos
afectados y confirma. Entonces:

1. Se bloquea su agenda en GHL en ese rango (título `Código Rojo — <motivo>`, sirve de registro del recibimiento).
2. Cada turno activo del rango se **cancela sin borrarse** y se agrega una nota con el motivo.
3. Se buscan hasta **3 horarios libres del mismo servicio y sede en las 48 h siguientes**, sin repetir entre pacientes,
   y se guardan en el contacto (`cr_turno_original`, `cr_propuesta_1..3`).
4. Se agrega el tag `codigo-rojo-afectado` → el workflow envía el WhatsApp y el bot gestiona la respuesta:
   si acepta, reserva; si rechaza, otros horarios o lista de espera. Nunca confirma algo que el paciente no eligió.

Decisiones para la demo: apretar el botón es la aprobación humana; el paciente recibe un motivo genérico
("imprevisto médico"); el motivo real queda solo en la nota interna y el bloqueo.

## Despliegue (Netlify)

1. Nuevo sitio con base `agendaria-ghl/codigo-rojo` (o arrastrar la carpeta).
2. Variables de entorno: `GHL_TOKEN`, `GHL_LOCATION_ID=krXZA2jf7PzcNfbcJO9g`,
   `GHL_USER_ID=szEt5JMJQiTra12QG6q4`, `CODIGO_ROJO_PIN` (4–6 dígitos que elige la Dra.).
3. Abrir el sitio en el celular de la Dra. → "Agregar a pantalla de inicio".

## Plantilla de WhatsApp `propuesta_reprogramacion` (aprobar en Meta)

> Hola {{1}}, la Dra. Claudia Leguizamón tuvo un imprevisto médico y debemos mover el turno de {{2}}.
> Opciones: {{3}} · {{4}} · {{5}}. Responda con la opción que prefiera o escríbanos si ninguna le sirve.

Variables: `{{contact.first_name}}`, `{{contact.cr_turno_original}}`, `{{contact.cr_propuesta_1}}`,
`{{contact.cr_propuesta_2}}`, `{{contact.cr_propuesta_3}}`.

## Tests
```bash
node --test test/codigo-rojo.test.mjs
```
