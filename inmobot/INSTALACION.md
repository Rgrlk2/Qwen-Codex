# InmoBot EBA — Alta de un agente nuevo (5 minutos)

El bot y el servidor son **uno solo para todos**. Cada agente solo necesita ser registrado; no instala nada.

## Para el administrador (por cada agente nuevo)
1. El agente abre Telegram, busca `@eba_inmobot_elvio_989_bot` y envía `/start`. El bot le muestra su enlace de Dashboard, que contiene su ID (`tid=123456789`).
2. Agregá una línea en `perfiles.json` con ese ID:
   ```json
   {"telegram_id": "123456789", "nombre": "Nombre Apellido", "whatsapp": "+595981234567"}
   ```
3. Guardá, `git push` (Railway redespliega solo). Alternativa sin código: en Railway > Variables, pegar el JSON completo en `PERFILES_JSON`.
4. Listo: todos los copies del agente llevan **su** nombre y WhatsApp. Los teléfonos, mails, links y firmas del portal original se eliminan automáticamente.

## Para el agente
1. `/start` en el bot.
2. Enviar uno o varios links de propiedades.
3. Abrir el Dashboard, revisar/editar los copies y publicar.
4. (Opcional) `/conectar` para vincular su Facebook/Instagram.

> El agente también puede cambiar su CTA con `/perfil Nombre | +595981234567`, pero lo fijado en `perfiles.json` prevalece en cada redeploy.

## Logo del Dashboard
Copiar el archivo oficial como `static/logo.png` (o `.svg`/`.jpg`/`.webp`). Si no existe, se muestra un placeholder.

## Despliegue (una sola vez)
Railway: repo conectado, variables `TELEGRAM_BOT_TOKEN`, `APP_URL` (y opcional `DATABASE_URL` de PostgreSQL para no perder datos al redeployar). Start command: `uvicorn server:app --host 0.0.0.0 --port $PORT & python bot.py`.
