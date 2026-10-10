# InmoBot · LLAVE.IA — Alta de agentes

El bot y el servidor son **uno solo para todos**. Un agente nuevo no instala nada.

## Para el agente (1 minuto)
1. Abrir el bot en Telegram y escribir `/start`.
2. El bot pide su WhatsApp: escribirlo (ej. `0981 123 456`). Listo, queda registrado.
3. El bot le entrega **su enlace personal** al tablero (lleva un código secreto: no se comparte). Si lo pierde, escribe `/start` y recibe uno nuevo.
4. Mandar uno o varios links de propiedades. El bot responde con la calidad de cada aviso y el link a su tablero.
5. En el tablero: elegir el estilo del texto (Emocional o Directa), revisar los consejos, editar si quiere y publicar.
6. Opcional: `/conectar` para vincular Facebook e Instagram. `/perfil Nombre | 0981 123 456` cambia sus datos.

## Para el administrador
- **No hay que cargar a nadie a mano.** Cada agente se registra solo con `/start`.
- Para que un nombre salga ya cargado (ej. "Elvio Brun"), agregarlo en `perfiles.json` con su WhatsApp; cuando esa persona escriba ese número, el bot usa ese nombre.
- Para cerrar el acceso solo a personas autorizadas: en Railway > Variables, `ALLOWED_IDS=123456,789012` (IDs de Telegram separados por coma). Vacío = abierto.
- **Seguridad:** cada agente tiene un código secreto en su enlace; sin él no se ve ni se publica nada. Los pasos internos del bot (registro, perfil, crear avisos) exigen una clave que se calcula del `TELEGRAM_BOT_TOKEN` (o de `SECRET_KEY` si la definís). Los enlaces anteriores sin código dejan de funcionar: cada agente debe pedir el nuevo con `/start`.
- **Logo:** reemplazar `static/logo.png` (y los `icon-*.png`).
- Interacciones (me gusta, comentarios, compartidos): se leen de Meta cada 3 horas y con el botón "Actualizar". Requieren que el agente haya conectado su Facebook.
- **Fotos:** el bot toma hasta 10 fotos de cada aviso. En el tablero se eligen cuáles publicar (tocando cada miniatura). Facebook recibe un posteo con todas; Instagram, un carrusel (fotos ajustadas al formato de Instagram sin recortar la propiedad). "Publicar en ambas" hace las dos cosas de una vez.

## Despliegue (una sola vez)
Railway con el repo conectado. Variables: `TELEGRAM_BOT_TOKEN` (obligatoria, protege el servidor), `SECRET_KEY` (opcional), `APP_URL`, `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET` y `DATABASE_URL` (PostgreSQL). Opcionales de Meta: `FACEBOOK_CONFIG_ID` (si la app usa "Inicio de sesión con Facebook para empresas": ID de la configuración con los permisos) y `GRAPH_VERSION` (por defecto `v25.0`). Start command: `uvicorn server:app --host 0.0.0.0 --port $PORT & python bot.py`.
Las tablas nuevas se crean solas al arrancar; los datos anteriores se conservan.

## Probar
`pip install pytest && python -m pytest inmobot/test_inmobot.py`
