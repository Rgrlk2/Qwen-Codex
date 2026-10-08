import os, sys, json, sqlite3, subprocess, tempfile, importlib
from datetime import datetime, timezone, timedelta
from unittest import mock

HERE = os.path.dirname(os.path.abspath(__file__))
_tmp = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp}/t.db"
os.environ["METRICAS_AUTO"] = "0"
os.environ["PERFILES_JSON"] = json.dumps([{"telegram_id": "PENDIENTE", "nombre": "Elvio Brun", "whatsapp": "0985825989"}])
sys.path.insert(0, HERE)

import copywriter as cw
import server
from fastapi.testclient import TestClient

c = TestClient(server.app)
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
    with mock.patch.object(server.requests, "post", return_value=fake) as post:
        r = c.post("/api/publish", json={"telegram_id": 21, "draft_id": d["draft_id"], "destination": "fb_feed", "texto": "texto editado"}).json()
        assert r["success"] and post.call_args.kwargs["data"]["caption"] == "texto editado"
    # Meta responde error -> no se marca publicado
    d2 = _draft(21); err = mock.Mock(); err.json.return_value = {"error": {"message": "token vencido"}}
    with mock.patch.object(server.requests, "post", return_value=err):
        r = c.post("/api/publish", json={"telegram_id": 21, "draft_id": d2["draft_id"], "destination": "fb_feed"}).json()
        assert not r["success"] and "token vencido" in r["error"]
    graph = mock.Mock(); graph.json.return_value = {"reactions": {"summary": {"total_count": 7}}, "comments": {"summary": {"total_count": 2}}, "shares": {"count": 1}}
    with mock.patch.object(server.requests, "get", return_value=graph):
        assert c.post("/api/metricas/refresh", json={"telegram_id": 21}).json()["actualizadas"] == 1
    j = c.get("/api/dashboard?tid=21").json()
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
    j = c.get("/api/dashboard?tid=31").json()
    assert j["kpis"]["publicados"] == 0 and j["kpis"]["interacciones"] == 0      # mes actual en cero
    antes = c.get(f"/api/dashboard?tid=31&mes={server.mes_key(mes_pasado)}").json()
    assert antes["kpis"]["publicados"] == 1 and antes["kpis"]["ig"] == 1          # historial intacto


def test_xss_y_validaciones():
    j = c.get("/api/dashboard?tid=999&mes=basura").json()
    assert j["mes"] == j["mes_actual"] and j["avisos"] == []
    assert c.get("/dashboard?tid=1").status_code == 200
    assert c.get("/manifest.json?tid=5").json()["start_url"] == "/dashboard?tid=5"
    assert c.get("/logo").status_code == 200 and c.get("/icon-32.png").status_code == 200


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
            "j = TestClient(server.app).get('/api/dashboard?tid=7&mes=2026-10').json(); "
            "print(j['kpis']['publicados'], j['perfil']['nombre'], j['avisos'][0]['estado'])" % HERE)
    out = subprocess.run([sys.executable, "-c", code], env=env, capture_output=True, text=True)
    assert out.stdout.strip() == "1 Elvio publicado", out.stderr
