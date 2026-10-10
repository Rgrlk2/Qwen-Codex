"""Fotos del aviso de origen: hasta 10 por propiedad, sin logos, iconos ni avisos relacionados.

Se buscan en este orden (cada fuente suma fotos nuevas, sin repetir):
1. Etiquetas para redes (og:image, twitter:image).
2. Datos estructurados del portal (JSON-LD y JSON de la pagina).
3. Galerias, carruseles y sliders de la pagina.
4. Si todavia hay menos de 3: el resto de las imagenes del contenido y, al final,
   direcciones de fotos escritas dentro del codigo de la pagina.
"""
import json, re
from urllib.parse import urljoin, urlparse, parse_qsl, urlencode

MAX_FOTOS = 10
MIN_FOTOS_SIN_RESPALDO = 3

CABECERAS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/126.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "es-PY,es;q=0.9,en;q=0.6",
}

EXT_FOTO = (".jpg", ".jpeg", ".png", ".webp", ".avif")
EXT_NO = (".svg", ".gif", ".ico", ".bmp", ".html", ".htm", ".php", ".asp", ".aspx", ".js", ".css",
          ".json", ".mp4", ".mov", ".webm", ".pdf")
# En el nombre del archivo o en el alt/clase de la imagen: no es una foto de la propiedad
NOMBRE_NO = re.compile(
    r"logo|icon|favicon|sprite|avatar|placeholder|spacer|loader|loading|badge|emoji|"
    r"whatsapp|facebook|instagram|twitter|youtube|tiktok|linkedin|watermark|marca-?agua|no-?image|"
    r"sin-?foto|default|banner|app-?store|google-?play|agente|asesor|perfil|profile|"
    r"(?<![a-z])(?:qr|flag|pixel|blank)(?![a-z])", re.I)
DOMINIOS_NO = ("maps.googleapis.com", "maps.gstatic.com", "google-analytics.com", "googletagmanager.com",
               "doubleclick.net", "facebook.com", "facebook.net", "gravatar.com")
# Contenedores de la galeria de la propiedad
GALERIA = re.compile(r"galer|gallery|carous|carrus|slide|swiper|slick|owl|fotorama|lightbox|fancybox|"
                     r"photo|foto|imagen|images|splide|glide|pswp|lightgallery", re.I)
# Contenedores que no son de la propiedad (menu, pie, otras propiedades, agente, publicidad...)
EXCLUIR = re.compile(r"footer|navbar|menu|logo|related|similar|relacionad|recomend|sugerid|otras|"
                     r"agent|agente|asesor|broker|corredor|avatar|profile|perfil|banner|publicidad|"
                     r"sponsor|cookie|share|social|compartir|brand", re.I)
ETIQUETAS_EXCLUIR = {"footer", "nav", "aside"}      # <header> solo se usa si tiene la galeria
ATRIBUTOS_IMG = ("data-zoom-image", "data-full", "data-full-url", "data-large", "data-large_image",
                 "data-big", "data-hi-res", "data-original", "data-lazy-src", "data-lazy", "data-src",
                 "data-image", "data-img", "data-url", "src")
ATRIBUTOS_SRCSET = ("data-srcset", "data-lazy-srcset", "srcset")
PARAMS_TAMANO = {"w", "h", "width", "height", "q", "quality", "fit", "crop", "auto", "fm", "format", "dpr",
                 "s", "size", "resize", "rs", "mode", "scale", "v", "ver", "version", "ts", "t", "cache",
                 "cb", "itok", "sharp", "blur"}
# JSON de la pagina: claves con fotos de la propiedad y claves que se saltean
CLAVES_FOTOS = re.compile(r"image|imagen|photo|foto|picture|gallery|galeria|media", re.I)
CLAVES_NO = re.compile(r"related|similar|recomend|agent|agente|user|usuario|broker|advertiser|anunciante|"
                       r"publisher|seller|author|provider|brand|logo|avatar|profile|perfil|banner|"
                       r"thumbnail|icon", re.I)
TIPOS_LD_NO = {"organization", "realestateagent", "person", "website", "localbusiness", "brand",
               "breadcrumblist", "searchaction", "corporation", "sitenavigationelement"}
_C = r"(?:[^\s\"'<>()\\]|\\/)"     # caracter de una direccion, tambien dentro de JSON escapado (\/)
URL_EN_TEXTO = re.compile(r"https?:\\?/\\?/" + _C + r"+?\.(?:jpe?g|webp)(?![\w-])(?:\?" + _C + r"*)?", re.I)


def _extension(ruta: str) -> str:
    m = re.search(r"\.[a-z0-9]{2,5}$", ruta.lower())
    return m.group(0) if m else ""


def _normalizar(u: str, base: str) -> str:
    u = (u or "").strip().replace("\\/", "/").replace("&amp;", "&")
    if not u or u.startswith(("data:", "blob:", "javascript:")):
        return ""
    u = urljoin(base, u)
    p = urlparse(u)
    if p.scheme not in ("http", "https") or not p.netloc:
        return ""
    # WordPress guarda la foto original sin el sufijo de tamano (foto-300x200.jpg -> foto.jpg)
    if "/wp-content/uploads/" in p.path:
        u = re.sub(r"-\d{2,4}x\d{2,4}(?=\.(?:jpe?g|png|webp)(?:\?|$))", "", u, flags=re.I)
    return u


def _valida(u: str, estricta: bool = False) -> bool:
    """estricta: para fuentes de respaldo (sin contexto) solo se aceptan fotos JPG/WEBP con extension."""
    p = urlparse(u)
    host = p.netloc.lower()
    if any(host == d or host.endswith("." + d) for d in DOMINIOS_NO):
        return False
    ext = _extension(p.path)
    if ext in EXT_NO:
        return False
    if estricta and ext not in (".jpg", ".jpeg", ".webp"):
        return False
    archivo = p.path.rsplit("/", 1)[-1]
    if NOMBRE_NO.search(archivo):
        return False
    return _tamano(u) >= 200


def _tamano(u: str) -> int:
    """Ancho aproximado segun la direccion (sin pista: se asume foto grande)."""
    m = re.search(r"(?<![\d])(\d{2,4})x(\d{2,4})(?![\d])", u)
    if m:
        return int(m.group(1))
    q = {k.lower(): v for k, v in parse_qsl(urlparse(u).query)}
    for k in ("w", "width"):
        if q.get(k, "").isdigit():
            return int(q[k])
    if re.search(r"thumb|/small/|/mini/", u, re.I):
        return 300
    return 1000


def _clave(u: str):
    """Misma foto en distintos tamanos -> misma clave."""
    p = urlparse(u)
    q = sorted((k, v) for k, v in parse_qsl(p.query, keep_blank_values=True) if k.lower() not in PARAMS_TAMANO)
    ruta = re.sub(r"[-_]\d{2,4}x\d{2,4}(?=\.\w+$)", "", p.path)
    ruta = re.sub(r"/(?:thumbs?|thumbnails?|small|medium|large|big|xl|lg|md|sm|full|original|\d{2,4}x\d{2,4})/",
                  "/", ruta, flags=re.I)
    return p.netloc.lower().removeprefix("www."), ruta.lower(), urlencode(q)


class _Coleccion:
    def __init__(self, base):
        self.base, self.urls, self.pos = base, [], {}

    def agregar(self, u, estricta=False):
        u = _normalizar(u, self.base)
        if not u or not _valida(u, estricta):
            return
        k = _clave(u)
        if k in self.pos:      # repetida: se queda la version mas grande, en su lugar original
            i = self.pos[k]
            if _tamano(u) > _tamano(self.urls[i]):
                self.urls[i] = u
            return
        if len(self.urls) < MAX_FOTOS:
            self.pos[k] = len(self.urls)
            self.urls.append(u)

    def llena(self):
        return len(self.urls) >= MAX_FOTOS


def _mayor_srcset(valor: str) -> str:
    mejor, ancho = "", -1
    for parte in (valor or "").split(","):
        trozos = parte.strip().split()
        if not trozos:
            continue
        w = 1
        if len(trozos) > 1:
            m = re.match(r"(\d+(?:\.\d+)?)([wx])", trozos[1])
            if m:
                w = float(m.group(1)) * (1 if m.group(2) == "w" else 1000)
        if w > ancho:
            mejor, ancho = trozos[0], w
    return mejor


def _contexto(tag):
    """'galeria', 'excluir' o '' segun los contenedores de la imagen."""
    en_galeria = en_encabezado = False
    for padre in tag.parents:
        if padre.name in (None, "body", "html", "[document]"):
            break
        if padre.name in ETIQUETAS_EXCLUIR:
            return "excluir"
        marca = " ".join(padre.get("class") or []) + " " + (padre.get("id") or "")
        if EXCLUIR.search(marca):
            return "excluir"
        if GALERIA.search(marca):
            en_galeria = True
        en_encabezado = en_encabezado or padre.name == "header"
    if en_galeria:
        return "galeria"
    return "excluir" if en_encabezado else ""


def _fuentes_de_tag(tag):
    """Direcciones de foto de una etiqueta img/a/source/div (de la version mas grande a la mas chica)."""
    out = []
    if tag.name == "a":
        href = tag.get("href") or ""
        if _extension(urlparse(href).path) in EXT_FOTO:
            out.append(href)
        return out
    for a in ATRIBUTOS_IMG:
        if tag.get(a):
            out.append(tag[a])
    for a in ATRIBUTOS_SRCSET:
        if tag.get(a):
            out.insert(0, _mayor_srcset(tag[a]))
    estilo = tag.get("style") or ""
    m = re.search(r"background(?:-image)?\s*:[^;]*url\(\s*['\"]?([^'\")]+)", estilo, re.I)
    if m:
        out.append(m.group(1))
    return out


def _chica(tag) -> bool:
    try:
        w, h = int(tag.get("width") or 0), int(tag.get("height") or 0)
    except ValueError:
        return False
    return (w and w < 150) or (h and h < 150)


def _desde_json(obj, col, en_fotos=False, prof=0):
    if prof > 14 or col.llena():
        return
    if isinstance(obj, dict):
        tipo = obj.get("@type")
        tipos = {str(t).lower() for t in (tipo if isinstance(tipo, list) else [tipo]) if t}
        if tipos & TIPOS_LD_NO:
            return
        en_fotos = en_fotos or "imageobject" in tipos
        for k, v in obj.items():
            if CLAVES_NO.search(str(k)):
                continue
            _desde_json(v, col, en_fotos or bool(CLAVES_FOTOS.search(str(k))), prof + 1)
    elif isinstance(obj, list):
        for v in obj:
            _desde_json(v, col, en_fotos, prof + 1)
    elif isinstance(obj, str) and en_fotos and re.match(r"^(https?:)?//", obj.strip()):
        col.agregar(obj)


def extraer_imagenes(soup, base_url: str, html: str = "") -> list:
    col = _Coleccion(base_url)

    # 1. Etiquetas para redes
    for meta in soup.find_all("meta"):
        nombre = (meta.get("property") or meta.get("name") or meta.get("itemprop") or "").lower()
        if nombre in ("og:image", "og:image:url", "og:image:secure_url", "twitter:image", "twitter:image:src", "image"):
            col.agregar(meta.get("content") or "")
    for link in soup.find_all("link", rel=lambda r: r and "image_src" in r):
        col.agregar(link.get("href") or "")

    # 2. Datos estructurados
    for s in soup.find_all("script", type=re.compile(r"json", re.I)):
        try:
            datos = json.loads(s.string or s.get_text() or "")
        except (ValueError, TypeError):
            continue
        _desde_json(datos, col)

    # 3. Galerias de la pagina / 4a. resto del contenido
    resto = []
    for tag in soup.find_all(["img", "source", "a", "div", "li", "figure", "span"]):
        if col.llena():
            break
        if tag.name in ("div", "li", "figure", "span") and "background" not in (tag.get("style") or ""):
            continue
        if tag.name == "img":
            pistas = " ".join([tag.get("alt") or "", " ".join(tag.get("class") or []), tag.get("id") or ""])
            if NOMBRE_NO.search(pistas) or _chica(tag):
                continue
        fuentes = _fuentes_de_tag(tag)
        if not fuentes:
            continue
        ctx = _contexto(tag)
        if ctx == "excluir":
            continue
        if ctx == "galeria":
            col.agregar(fuentes[0])
        elif tag.name in ("img", "source"):
            resto.append(fuentes[0])

    if len(col.urls) < MIN_FOTOS_SIN_RESPALDO:
        for u in resto:
            col.agregar(u, estricta=True)

    # 4b. Direcciones de fotos dentro del codigo (paginas que cargan la galeria con JavaScript)
    if len(col.urls) < MIN_FOTOS_SIN_RESPALDO and html:
        for m in URL_EN_TEXTO.finditer(html):
            col.agregar(m.group(0), estricta=True)
            if col.llena():
                break

    return col.urls
