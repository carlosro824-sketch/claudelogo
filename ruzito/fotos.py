#!/usr/bin/env python3
"""fotos.py — fotos reales de Pexels para video-pizarra (Ruz Inmobiliaria).

Descarga fotos de inmuebles/paisajes, las mejora (recorte al formato, nitidez, contraste suave)
y genera su versión "boceto" (dibujo a lápiz con fondo transparente) para el efecto dibujo→foto.

Uso:
  python3 fotos.py casa                     # 1 foto al azar de la categoría (sin repetir las ya usadas)
  python3 fotos.py casa cocina recamara     # 1 de cada una
  python3 fotos.py casa --n 3               # 3 de la categoría
  python3 fotos.py --id 8134820             # una foto concreta de Pexels por su id
  python3 fotos.py --buscar "casa coyoacan" # API de Pexels (requiere PEXELS_API_KEY y api.pexels.com permitido)
  python3 fotos.py --lista                  # muestra las categorías del catálogo
Opciones: --formato v|h|c (por defecto v = 1080x1920 vertical; h = 1920x1080; c = 1080x1080)
          --sin-boceto   --carpeta fotos   --semilla N

Salida en ./fotos/: <nombre>.jpg (foto mejorada, con margen extra para Ken Burns),
<nombre>-boceto.png (líneas color tinta Ruz sobre transparente) y fotos.json (lista + créditos).
"""
import argparse, json, os, random, sys, urllib.request, urllib.parse, io, datetime
from PIL import Image, ImageFilter, ImageEnhance, ImageOps, ImageChops

AQUI = os.path.dirname(os.path.abspath(__file__))
CAT_URL = 'https://raw.githubusercontent.com/carlosro824-sketch/claudelogo/main/ruzito/pexels-catalogo.json'
IMG = 'https://images.pexels.com/photos/{id}/pexels-photo-{id}.jpeg?auto=compress&cs=tinysrgb&w=3000'
TINTA = (38, 31, 70)          # #261F46 contorno Ruz
FORMATOS = {'v': (1080, 1920), 'h': (1920, 1080), 'c': (1080, 1080)}
HOLGURA = 1.3                 # la foto se guarda 30% más grande para zoom/paneo sin perder nitidez


def bajar(url, headers=None, timeout=60):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0', **(headers or {})})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def catalogo():
    local = os.path.join(AQUI, 'pexels-catalogo.json')
    if os.path.exists(local):
        return json.load(open(local))
    data = json.loads(bajar(CAT_URL))
    json.dump(data, open(local, 'w'), ensure_ascii=False)
    return data


def mejorar(im, formato):
    W, H = FORMATOS[formato]
    W, H = int(W * HOLGURA), int(H * HOLGURA)
    im = ImageOps.exif_transpose(im).convert('RGB')
    im = ImageOps.fit(im, (W, H), Image.LANCZOS, centering=(0.5, 0.45))
    im = ImageEnhance.Contrast(im).enhance(1.06)
    im = ImageEnhance.Color(im).enhance(1.08)
    return im.filter(ImageFilter.UnsharpMask(radius=1.6, percent=70, threshold=2))


def boceto(im):
    """Dibujo a lápiz: color-dodge de la imagen en gris contra su negativo desenfocado → líneas sobre transparente."""
    g = ImageOps.grayscale(im)
    inv = ImageOps.invert(g).filter(ImageFilter.GaussianBlur(10))
    # color dodge: g / (1 - inv)
    import numpy as np
    a = np.asarray(g, dtype=np.float32); b = np.asarray(inv, dtype=np.float32)
    dodge = np.clip(a * 255.0 / np.maximum(255.0 - b, 1), 0, 255)
    linea = 255 - dodge                                   # trazo = oscuro
    linea = np.clip((linea - 24) * 2.1, 0, 255)           # limpia el ruido y refuerza el trazo
    alpha = Image.fromarray(linea.astype('uint8')).filter(ImageFilter.GaussianBlur(0.6))
    out = Image.new('RGBA', im.size, TINTA + (0,))
    out.putalpha(alpha)
    return out


def guardar(pid, formato, carpeta, nombre, sin_boceto, meta):
    raw = bajar(IMG.format(id=pid))
    im = mejorar(Image.open(io.BytesIO(raw)), formato)
    os.makedirs(carpeta, exist_ok=True)
    ruta = os.path.join(carpeta, nombre + '.jpg')
    im.save(ruta, quality=90, optimize=True, progressive=True)
    if not sin_boceto:
        boceto(im).save(os.path.join(carpeta, nombre + '-boceto.png'), optimize=True)
    meta.update({'archivo': ruta, 'boceto': None if sin_boceto else os.path.join(carpeta, nombre + '-boceto.png'),
                 'pexels': f'https://www.pexels.com/photo/{pid}/', 'id': pid, 'w': im.width, 'h': im.height})
    print(f'✓ {ruta}  (Pexels {pid}, {im.width}x{im.height})')
    return meta


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('categorias', nargs='*')
    ap.add_argument('--n', type=int, default=1)
    ap.add_argument('--id', type=int, action='append')
    ap.add_argument('--buscar')
    ap.add_argument('--lista', action='store_true')
    ap.add_argument('--formato', default='v', choices=list(FORMATOS))
    ap.add_argument('--carpeta', default='fotos')
    ap.add_argument('--sin-boceto', action='store_true')
    ap.add_argument('--semilla', type=int, default=None)
    a = ap.parse_args()

    cat = catalogo()['categorias']
    if a.lista:
        for k, v in cat.items():
            print(f'{k:14} {len(v["fotos"]):3} fotos · {v["desc"]}')
        return

    # historial global para no repetir fotos entre videos
    hist_path = os.path.expanduser('~/.ruz-fotos-usadas.json')
    usadas = set(json.load(open(hist_path))) if os.path.exists(hist_path) else set()
    rnd = random.Random(a.semilla if a.semilla is not None else int(datetime.datetime.now().timestamp()))
    meta_path = os.path.join(a.carpeta, 'fotos.json')
    salida = json.load(open(meta_path)) if os.path.exists(meta_path) else []
    pedidos = []  # (id, nombre, meta)

    for pid in a.id or []:
        pedidos.append((pid, f'foto-{pid}', {'categoria': 'id'}))

    if a.buscar:
        key = os.environ.get('PEXELS_API_KEY')
        if not key:
            print('⚠ Sin PEXELS_API_KEY: uso el catálogo.', file=sys.stderr)
        else:
            try:
                q = urllib.parse.urlencode({'query': a.buscar, 'per_page': 30, 'orientation': {'v': 'portrait', 'h': 'landscape', 'c': 'square'}[a.formato]})
                res = json.loads(bajar(f'https://api.pexels.com/v1/search?{q}', {'Authorization': key}, 30))
                fotos = [p for p in res.get('photos', []) if p['id'] not in usadas] or res.get('photos', [])
                for p in rnd.sample(fotos, min(a.n, len(fotos))):
                    pedidos.append((p['id'], f'{a.buscar.split()[0]}-{p["id"]}', {'categoria': 'busqueda:' + a.buscar, 'autor': p.get('photographer'), 'alt': p.get('alt')}))
            except Exception as e:
                print(f'⚠ API de Pexels no disponible ({e}); uso el catálogo.', file=sys.stderr)
        if not pedidos and not a.categorias:
            a.categorias = ['casa']

    for c in a.categorias:
        if c not in cat:
            sys.exit(f'Categoría desconocida: {c}. Usa --lista.')
        fotos = cat[c]['fotos']
        pref = [f for f in fotos if f['o'] == a.formato or a.formato == 'c']
        nuevas = [f for f in fotos if f['id'] not in usadas]
        p1 = [f for f in nuevas if f in pref]; p2 = [f for f in nuevas if f not in pref]
        rnd.shuffle(p1); rnd.shuffle(p2)
        pool = (p1 + p2) or fotos[:]           # primero las de la orientación pedida, luego el resto
        if not (p1 + p2): rnd.shuffle(pool)
        for f in pool[:a.n]:
            pedidos.append((f['id'], f'{c}-{f["id"]}', {'categoria': c}))

    if not pedidos:
        ap.print_help(); return
    for pid, nombre, meta in pedidos:
        try:
            salida.append(guardar(pid, a.formato, a.carpeta, nombre, a.sin_boceto, meta))
            usadas.add(pid)
        except Exception as e:
            print(f'✗ {pid}: {e}', file=sys.stderr)
    json.dump(salida, open(meta_path, 'w'), ensure_ascii=False, indent=1)
    json.dump(sorted(usadas), open(hist_path, 'w'))


if __name__ == '__main__':
    main()
