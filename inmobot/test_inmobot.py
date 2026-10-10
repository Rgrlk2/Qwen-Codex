import os, io, sys, json, sqlite3, subprocess, tempfile, importlib
from datetime import datetime, timezone, timedelta
from unittest import mock

import pytest
from bs4 import BeautifulSoup
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
_tmp = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp}/t.db"
os.environ["METRICAS_AUTO"] = "0"
os.environ["TELEGRAM_BOT_TOKEN"] = "123:test"
os.environ["PERFILES_JSON"] = json.dumps([{"telegram_id": "PENDIENTE", "nombre": "Elvio Brun", "whatsapp": "0985825989"}])
sys.path.insert(0, HERE)

import copywriter as cw
import scraper
import server
from fastapi.testclient import TestClient

from seguridad import bot_key
c = TestClient(server.app, headers={"X-Bot-Key": bot_key()})   # como el bot
web = TestClient(server.app)                                      # como un navegador (sin clave del bot)


def tk(tid):
    db = server.SessionLocal(); t = db.query(server.Profile).filter_by(telegram_id=str(tid)).first().token; db.close(); return t
def _foto(w=1600, h=900, modo="RGB", formato="PNG"):
    b = io.BytesIO(); Image.new(modo, (w, h), (200, 120, 50)).save(b, formato); return b.getvalue()


class MetaFalsa:
    """Simula la Graph API de Meta y guarda cada llamada."""
    def __init__(self, ig_vinculado=True):
        self.posts, self.gets, self.n, self.ig = [], [], 0, ig_vinculado

    def post(self, url, data=None, timeout=None, **kw):
        self.n += 1; data = dict(data or {}); self.posts.append((url, data)); r = mock.Mock()
        if url.endswith("/photos"):
            r.json.return_value = {"id": f"foto{self.n}"} if data.get("published") == "false" else {"id": f"foto{self.n}", "post_id": "P_1foto"}
        elif url.endswith("/feed"):
            r.json.return_value = {"id": "P_varias"}
        elif url.endswith("/media_publish"):
            r.json.return_value = {"id": "IG_post"}
        elif url.endswith("/media"):
            r.json.return_value = {"id": f"cont{self.n}"}
        return r

    def get(self, url, params=None, timeout=None, **kw):
        self.gets.append((url, dict(params or {}))); r = mock.Mock()
        r.json.return_value = {"status_code": "FINISHED"} if self.ig else {"id": "P"}
        return r


RAW = {"title": "Casa en Venta en Luque | Century 21 Paraguay",
       "description": "Hermosa casa, 3 dormitorios, 2 baños, 180 m2, piscina y quincho. Llamá a Juan Pérez 0981 123 456 o juan@c21.com www.c21.com.py",
       "price": "USD 120.000", "images": ["https://x.test/1.jpg", "https://x.test/2.jpg"]}


def test_no_pasa_contacto_original():
    d = cw.extraer_datos(RAW)
    assert d["zona"] == "Luque" and d["dormitorios"] == "3" and d["precio"] == "USD 120.000"
    for v in cw.generar_variantes(d, "Elvio Brun", "+595985825989").values():
        for t in v.values():
            assert "0981" not in t and "juan" not in t.lower() and "c21" not in t.lower() and "Century" not in t
            assert "+595985825989" in t


def test_wa():
    assert cw.normalizar_wa("0985 825 989") == "+595985825989"
    assert cw.normalizar_wa("+595 985 825 989") == "+595985825989"
    assert cw.normalizar_wa("123") == ""


def test_registro_y_preset():
    assert c.post("/api/registro", json={"telegram_id": 11, "first_name": "Tele"}).json()["tiene_wa"] is False
    r = c.post("/api/perfil", json={"telegram_id": 11, "whatsapp": "0985825989"}).json()
    assert r["nombre"] == "Elvio Brun" and r["whatsapp"] == "+595985825989"
    assert c.post("/api/perfil", json={"telegram_id": 12, "whatsapp": "abc"}).status_code == 400


def _draft(tid):
    r = c.post("/api/drafts", json={"telegram_id": tid, "source_url": "https://x.test/a", "raw_data": RAW}).json()
    return r


def test_flujo_publicar_y_metricas():
    c.post("/api/perfil", json={"telegram_id": 21, "nombre": "Ana", "whatsapp": "0981111222"})
    d = _draft(21)
    assert 0 < d["score"] <= 100 and d["titulo"] == "Casa en Venta en Luque"
    db = server.SessionLocal(); db.add(server.FbUser(telegram_id="21", access_token="t", pages_json=json.dumps([{"id": "P", "access_token": "tok"}]))); db.commit(); db.close()
    fake = mock.Mock(); fake.json.return_value = {"id": "123", "post_id": "P_123"}
    with mock.patch.object(server, "_bajar_imagen", return_value=_foto()), \
         mock.patch.object(server.requests, "post", return_value=fake) as post:
        r = web.post("/api/publish", json={"telegram_id": 21, "k": tk(21), "draft_id": d["draft_id"], "destination": "fb_feed", "texto": "texto editado"}).json()
        # 2 fotos: se suben sin publicar y salen juntas en un solo posteo con el texto editado
        assert r["success"] and post.call_args.kwargs["data"]["message"] == "texto editado"
        assert "attached_media[1]" in post.call_args.kwargs["data"]
    # Meta responde error -> no se marca publicado
    d2 = _draft(21); err = mock.Mock(); err.json.return_value = {"error": {"message": "token vencido"}}
    with mock.patch.object(server, "_bajar_imagen", return_value=_foto()), \
         mock.patch.object(server.requests, "post", return_value=err):
        r = web.post("/api/publish", json={"telegram_id": 21, "k": tk(21), "draft_id": d2["draft_id"], "destination": "fb_feed"}).json()
        assert not r["success"] and "token vencido" in r["error"]
    graph = mock.Mock(); graph.json.return_value = {"reactions": {"summary": {"total_count": 7}}, "comments": {"summary": {"total_count": 2}}, "shares": {"count": 1}}
    with mock.patch.object(server.requests, "get", return_value=graph):
        assert web.post("/api/metricas/refresh", json={"telegram_id": 21, "k": tk(21)}).json()["actualizadas"] == 1
    j = web.get(f"/api/dashboard?tid=21&k={tk(21)}").json()
    k = j["kpis"]
    assert k["publicados"] == 1 and k["fb"] == 1 and k["interacciones"] == 10 and k["pendientes"] == 1
    assert j["top"][0]["interacciones"] == 10 and sum(s["fb"] for s in j["semanal"]) == 1
    estados = {a["id"]: a["estado"] for a in j["avisos"]}
    assert estados[d["draft_id"]] == "publicado" and estados[d2["draft_id"]] == "pendiente"


def test_reinicio_mensual():
    c.post("/api/perfil", json={"telegram_id": 31, "nombre": "Bo", "whatsapp": "0981333444"})
    d = _draft(31)["draft_id"]
    db = server.SessionLocal()
    mes_pasado = datetime.now(timezone.utc) - timedelta(days=40)
    db.add(server.Publicacion(draft_id=d, telegram_id="31", destino="ig_feed", published_at=mes_pasado, likes=5))
    db.commit(); db.close()
    j = web.get(f"/api/dashboard?tid=31&k={tk(31)}").json()
    assert j["kpis"]["publicados"] == 0 and j["kpis"]["interacciones"] == 0      # mes actual en cero
    antes = web.get(f"/api/dashboard?tid=31&k={tk(31)}&mes={server.mes_key(mes_pasado)}").json()
    assert antes["kpis"]["publicados"] == 1 and antes["kpis"]["ig"] == 1          # historial intacto


def test_xss_y_validaciones():
    c.post("/api/registro", json={"telegram_id": 999, "first_name": "Z"})
    j = web.get(f"/api/dashboard?tid=999&k={tk(999)}&mes=basura").json()
    assert j["mes"] == j["mes_actual"] and j["avisos"] == []
    assert c.get("/dashboard?tid=1").status_code == 200
    assert c.get("/manifest.json?tid=5&k=abc").json()["start_url"] == "/dashboard?tid=5&k=abc"
    assert c.get("/logo").status_code == 200 and c.get("/icon-32.png").status_code == 200


def test_seguridad():
    r = c.post("/api/registro", json={"telegram_id": 41, "first_name": "V"}).json()
    assert f"tid=41&k={tk(41)}" in r["dash"]
    # el bot (clave interna) es el unico que registra, cambia perfil o crea avisos
    for ruta, cuerpo in [("/api/registro", {"telegram_id": 41}), ("/api/perfil", {"telegram_id": 41, "whatsapp": "0981000111"}),
                         ("/api/drafts", {"telegram_id": 41, "source_url": "x", "raw_data": RAW})]:
        assert web.post(ruta, json=cuerpo).status_code == 403
        assert TestClient(server.app, headers={"X-Bot-Key": "mala"}).post(ruta, json=cuerpo).status_code == 403
    # el tablero exige el codigo del agente
    assert web.get("/api/dashboard?tid=41").status_code == 403
    assert web.get("/api/dashboard?tid=41&k=mala").status_code == 403
    assert web.get("/api/dashboard?tid=999999&k=x").status_code == 403
    # el codigo de otro agente no sirve
    assert web.get(f"/api/dashboard?tid=41&k={tk(21)}").status_code == 403
    d = _draft(41)["draft_id"]
    assert web.delete(f"/api/drafts/{d}?telegram_id=41&k=mala").status_code == 403
    assert web.post("/api/publish", json={"telegram_id": 41, "k": "mala", "draft_id": d, "destination": "fb_feed"}).status_code == 403
    assert web.post("/api/metricas/refresh", json={"telegram_id": 41, "k": ""}).status_code == 403
    assert web.delete(f"/api/drafts/{d}?telegram_id=41&k={tk(41)}").status_code == 200
    # OAuth: login exige codigo y el retorno exige estado firmado
    assert web.get("/auth/login?telegram_id=41&k=mala", follow_redirects=False).status_code == 403
    assert web.get("/auth/callback?code=x&state=41|abc|firmafalsa").status_code == 400


def test_migracion_base_vieja():
    ruta = os.path.join(tempfile.mkdtemp(), "old.db")
    con = sqlite3.connect(ruta)
    con.executescript("""
      CREATE TABLE profiles (telegram_id VARCHAR PRIMARY KEY, nombre VARCHAR, whatsapp VARCHAR);
      CREATE TABLE fb_users (telegram_id VARCHAR PRIMARY KEY, access_token TEXT, pages_json TEXT);
      CREATE TABLE drafts (id VARCHAR PRIMARY KEY, telegram_id VARCHAR, source_url TEXT, title TEXT, price VARCHAR,
        images_json TEXT, raw_desc TEXT, copy_ig TEXT, copy_fb TEXT, status VARCHAR, destination VARCHAR, created_at DATETIME, published_at DATETIME);
      INSERT INTO profiles VALUES ('7','Elvio','+595985825989');
      INSERT INTO drafts VALUES ('d1','7','http://x','Casa en Luque','USD 1.000','[]','','ig','fb','publicado FB','fb_feed','2026-10-01 10:00:00','2026-10-02 10:00:00');
    """); con.commit(); con.close()
    env = {**os.environ, "DATABASE_URL": f"sqlite:///{ruta}"}
    code = ("import sys; sys.path.insert(0, %r); import server; from fastapi.testclient import TestClient; "
            "db = server.SessionLocal(); t = db.query(server.Profile).first().token; db.close(); "
            "j = TestClient(server.app).get('/api/dashboard?tid=7&mes=2026-10&k=' + t).json(); "
            "print(j['kpis']['publicados'], j['perfil']['nombre'], j['avisos'][0]['estado'])" % HERE)
    out = subprocess.run([sys.executable, "-c", code], env=env, capture_output=True, text=True)
    assert out.stdout.strip() == "1 Elvio publicado", out.stderr


HTML_AVISO = r"""<html><head>
<meta property="og:image" content="https://cdn.inmo.test/fotos/casa-1-800x600.jpg">
<meta property="og:image" content="https://inmo.test/static/logo-inmo.png">
<script type="application/ld+json">{"@context":"https://schema.org","@graph":[
 {"@type":"Organization","logo":"https://inmo.test/brand.png","image":"https://inmo.test/agency.jpg"},
 {"@type":"RealEstateListing","name":"Casa","image":["https://cdn.inmo.test/fotos/casa-2.jpg",{"@type":"ImageObject","url":"https://cdn.inmo.test/fotos/casa-3.jpg"}],
  "offers":{"seller":{"@type":"Person","image":"https://cdn.inmo.test/agentes/juan.jpg"}}}]}</script>
<script id="__NEXT_DATA__" type="application/json">{"props":{"pageProps":{"listing":{"photos":[{"url":"https:\/\/cdn.inmo.test\/fotos\/casa-4.jpg"}]},"similarListings":[{"photos":["https://cdn.inmo.test/otras/x.jpg"]}]}}}</script>
</head><body>
<header class="site-header"><img src="/static/marca.png" alt="Inmobiliaria"></header>
<div class="property-gallery swiper">
  <div class="swiper-slide"><img data-src="https://cdn.inmo.test/fotos/casa-1.jpg" src="data:image/gif;base64,AAA"></div>
  <div class="swiper-slide"><img srcset="https://cdn.inmo.test/fotos/casa-5-400.jpg 400w, https://cdn.inmo.test/fotos/casa-5-1200.jpg 1200w"></div>
  <div class="swiper-slide"><a href="/fotos/casa-6.jpg"><img src="/fotos/thumbs/casa-6.jpg"></a></div>
  <div class="swiper-slide" style="background-image:url('https://cdn.inmo.test/fotos/casa-7.webp')"></div>
  <img src="https://inmo.test/icons/cama.svg"><img src="https://cdn.inmo.test/fotos/casa-8.jpg" width="80" height="60">
</div>
<div class="agent-card"><img src="https://cdn.inmo.test/agentes/maria.jpg"></div>
<section class="propiedades-similares"><img src="https://cdn.inmo.test/otras/y.jpg"></section>
<aside><img src="https://cdn.inmo.test/otras/z.jpg"></aside>
<footer><img src="https://cdn.inmo.test/fotos/footer.jpg"></footer>
</body></html>"""


def test_scraper_toma_la_galeria_completa():
    fotos = scraper.extraer_imagenes(BeautifulSoup(HTML_AVISO, "html.parser"), "https://inmo.test/propiedad/1", HTML_AVISO)
    assert fotos == ["https://cdn.inmo.test/fotos/casa-1.jpg", "https://cdn.inmo.test/fotos/casa-2.jpg",
                     "https://cdn.inmo.test/fotos/casa-3.jpg", "https://cdn.inmo.test/fotos/casa-4.jpg",
                     "https://cdn.inmo.test/fotos/casa-5-1200.jpg", "https://inmo.test/fotos/casa-6.jpg",
                     "https://cdn.inmo.test/fotos/casa-7.webp"]
    # pagina armada con JavaScript: se rescatan las fotos escritas en el codigo, hasta 10
    js = "<html><body><script>var g=" + json.dumps([f"https://cdn.x.test/p/{i}.jpg" for i in range(14)]).replace("/", "\\/") + "</script></body></html>"
    assert len(scraper.extraer_imagenes(BeautifulSoup(js, "html.parser"), "https://x.test/", js)) == 10


def test_fotos_formato_instagram():
    def tam(datos, modo):
        return Image.open(io.BytesIO(server._a_jpeg(datos, modo))).size
    assert tam(_foto(1600, 900), "ig") == (1080, 608)        # horizontal dentro del rango: sin relleno
    assert tam(_foto(2000, 500), "ig") == (1080, 565)        # muy ancha -> 1.91:1
    assert tam(_foto(500, 2000), "ig") == (1080, 1350)       # muy alta -> 4:5
    assert tam(_foto(1600, 900), "igc") == (1080, 1080)      # carrusel: todas cuadradas
    jpg = server._a_jpeg(_foto(3000, 2000, "RGBA"), "fb")
    im = Image.open(io.BytesIO(jpg)); assert im.format == "JPEG" and im.mode == "RGB" and max(im.size) == 2048


def test_fotos_nunca_de_la_red_interna():
    for u in ["http://127.0.0.1/a.jpg", "http://169.254.169.254/latest/meta-data", "http://localhost/x.jpg",
              "http://10.0.0.5/a.jpg", "file:///etc/passwd", "ftp://x.test/a.jpg"]:
        with pytest.raises(ValueError):
            server._bajar_imagen(u)
    # tampoco a traves de una redireccion
    red = mock.MagicMock(is_redirect=True, headers={"location": "http://127.0.0.1/secreto.jpg"}); red.__enter__.return_value = red
    with mock.patch.object(server, "_host_publico", side_effect=lambda h: h == "fotos.test"), \
         mock.patch.object(server.requests, "get", return_value=red):
        with pytest.raises(ValueError):
            server._bajar_imagen("http://fotos.test/a.jpg")


def _conectar(tid, paginas):
    db = server.SessionLocal(); db.add(server.FbUser(telegram_id=str(tid), access_token="t", pages_json=json.dumps(paginas))); db.commit(); db.close()


def test_publicar_en_ambas_con_varias_fotos():
    c.post("/api/perfil", json={"telegram_id": 51, "nombre": "Rodrigo", "whatsapp": "0981467259"})
    raw = dict(RAW, images=[f"https://x.test/{i}.jpg" for i in range(12)])
    d = c.post("/api/drafts", json={"telegram_id": 51, "source_url": "https://x.test/a", "raw_data": raw}).json()
    assert d["n_fotos"] == 10
    _conectar(51, [{"id": "P1", "name": "Personal", "access_token": "tok1"},
                   {"id": "P2", "name": "EBA", "access_token": "tok2", "instagram_business_account": {"id": "IG2", "username": "eba"}}])
    meta = MetaFalsa()
    with mock.patch.object(server, "_bajar_imagen", return_value=_foto()) as bajar, \
         mock.patch.object(server.requests, "post", side_effect=meta.post), \
         mock.patch.object(server.requests, "get", side_effect=meta.get):
        r = web.post("/api/publish", json={"telegram_id": 51, "k": tk(51), "draft_id": d["draft_id"], "destination": "ambas",
                                           "fotos": [0, 2, 4], "texto_fb": "texto fb", "texto_ig": "texto ig"}).json()
    assert r["success"] and not r["parcial"], r
    assert bajar.call_count == 3                                    # cada foto se baja una sola vez para las dos redes
    # Facebook: la pagina que tiene Instagram, 3 fotos sin publicar + un posteo con las 3
    fb = [(u, x) for u, x in meta.posts if "/P2/" in u]
    assert sum(1 for u, x in fb if u.endswith("/photos") and x["published"] == "false") == 3
    feed = [x for u, x in fb if u.endswith("/feed")][0]
    assert feed["message"] == "texto fb" and json.loads(feed["attached_media[2]"])["media_fbid"]
    # Instagram: carrusel de 3 fotos cuadradas
    ig = [x for u, x in meta.posts if u.endswith("/IG2/media")]
    hijos = [x for x in ig if x.get("is_carousel_item") == "true"]
    carrusel = [x for x in ig if x.get("media_type") == "CAROUSEL"][0]
    assert len(hijos) == 3 and carrusel["caption"] == "texto ig" and len(carrusel["children"].split(",")) == 3
    assert any(u.endswith("/IG2/media_publish") for u, x in meta.posts)
    # Meta descarga las fotos desde el servidor (firmadas, en JPEG)
    ruta = hijos[0]["image_url"].replace(server.APP_URL, "")
    foto = web.get(ruta)
    assert foto.status_code == 200 and foto.headers["content-type"] == "image/jpeg"
    assert Image.open(io.BytesIO(foto.content)).size == (1080, 1080)
    assert web.get(ruta.replace("?s=", "?s=0")).status_code == 403
    assert web.get(ruta.replace("/igc.jpg", "/xx.jpg")).status_code == 403
    j = web.get(f"/api/dashboard?tid=51&k={tk(51)}").json()
    assert j["kpis"]["fb"] == 1 and j["kpis"]["ig"] == 1 and len(j["avisos"][0]["fotos"]) == 10
    assert j["perfil"]["ig"] == "eba" and j["perfil"]["pagina"] == "EBA" and j["perfil"]["fb_conectado"]
    assert j["perfil"]["login_url"].endswith(f"k={tk(51)}")         # el boton del tablero lleva el codigo correcto


def test_publicar_ambas_parcial_y_una_sola_foto():
    c.post("/api/perfil", json={"telegram_id": 52, "nombre": "Elvio", "whatsapp": "0985825989"})
    d = _draft(52)["draft_id"]
    _conectar(52, [{"id": "P", "name": "EBA", "access_token": "tok"}])     # sin Instagram vinculado
    meta = MetaFalsa(ig_vinculado=False)
    with mock.patch.object(server, "_bajar_imagen", return_value=_foto()), \
         mock.patch.object(server.requests, "post", side_effect=meta.post), \
         mock.patch.object(server.requests, "get", side_effect=meta.get):
        r = web.post("/api/publish", json={"telegram_id": 52, "k": tk(52), "draft_id": d, "destination": "ambas", "fotos": [1]}).json()
        assert r["success"] and r["parcial"] and r["resultados"]["fb_feed"]["success"]
        assert "Instagram profesional" in r["resultados"]["ig_feed"]["error"]
        sola = [x for u, x in meta.posts if u.endswith("/photos")][0]       # una foto: posteo directo con texto
        assert sola["url"].endswith(".jpg?s=" + server.firmar(f"img|{d}|1|fb")) and sola["caption"]
        # Instagram sin fotos elegidas: aviso claro, sin llamar a Meta
        r = web.post("/api/publish", json={"telegram_id": 52, "k": tk(52), "draft_id": d, "destination": "ig_feed", "fotos": []}).json()
        assert not r["success"] and "al menos una foto" in r["error"]
    # Fotos que no se pueden descargar: no se publica a medias
    with mock.patch.object(server, "_bajar_imagen", side_effect=ValueError("403")), \
         mock.patch.object(server.requests, "post", side_effect=meta.post):
        r = web.post("/api/publish", json={"telegram_id": 52, "k": tk(52), "draft_id": _draft(52)["draft_id"], "destination": "fb_feed"}).json()
        assert not r["success"] and "descargar" in r["error"]


def test_conexion_meta_no_vence():
    c.post("/api/registro", json={"telegram_id": 61, "first_name": "E"})
    state = server.firmar_state("61", "n1")
    respuestas = iter([{"access_token": "corto"}, {"access_token": "largo"},
                       {"data": [{"id": "P", "name": "EBA", "access_token": "ptok", "instagram_business_account": {"id": "IG", "username": "eba"}}]}])
    llamadas = []

    def get(url, params=None, timeout=None, **kw):
        llamadas.append(params); r = mock.Mock(); r.json.return_value = next(respuestas); return r
    with mock.patch.object(server.requests, "get", side_effect=get):
        r = web.get(f"/auth/callback?code=abc&state={state}")
    assert r.status_code == 200 and "@eba" in r.text and "EBA" in r.text
    assert llamadas[1]["grant_type"] == "fb_exchange_token" and llamadas[1]["fb_exchange_token"] == "corto"
    assert llamadas[2]["access_token"] == "largo" and "instagram_business_account" in llamadas[2]["fields"]
    db = server.SessionLocal(); u = db.query(server.FbUser).filter_by(telegram_id="61").first(); db.close()
    assert u.access_token == "largo"
    # Si la persona cancela en Meta, se le explica (no un error tecnico)
    assert "No se conectó" in web.get(f"/auth/callback?state={state}&error=access_denied").text


def test_login_meta_permisos_o_configuracion():
    c.post("/api/registro", json={"telegram_id": 71, "first_name": "L"})
    url = f"/auth/login?telegram_id=71&k={tk(71)}"
    with mock.patch.object(server, "FB_APP_ID", "123"), mock.patch.object(server, "FB_CONFIG_ID", ""):
        loc = web.get(url, follow_redirects=False).headers["location"]
        assert "scope=pages_show_list" in loc and "config_id" not in loc and f"/{server.GRAPH_VERSION}/dialog/oauth" in loc
    with mock.patch.object(server, "FB_APP_ID", "123"), mock.patch.object(server, "FB_CONFIG_ID", "999"):
        loc = web.get(url, follow_redirects=False).headers["location"]
        assert "config_id=999" in loc and "scope=" not in loc
