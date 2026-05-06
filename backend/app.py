"""
VisionLab - Backend Flask
Mini-Projet Virtualisation et Cloud | Université de Gabes 2025-2026
Pipeline traitement d'images (PIL) + MongoDB pour l'historique
"""

from flask import Flask, request, jsonify, make_response
from PIL import Image, ImageFilter
from pymongo import MongoClient
from datetime import datetime
import io, base64, os

app = Flask(__name__)

# ── CORS ──────────────────────────────────────────────────────────────────────
def add_cors(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "POST, GET, DELETE, OPTIONS"
    return response

app.after_request(add_cors)

@app.route("/detect",  methods=["OPTIONS"])
@app.route("/health",  methods=["OPTIONS"])
@app.route("/history", methods=["OPTIONS"])
@app.route("/history/<id>", methods=["OPTIONS"])
def options_handler(**kwargs):
    return make_response("", 204)

# ── MongoDB ───────────────────────────────────────────────────────────────────
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://db:27017/visionlab")
try:
    client  = MongoClient(MONGO_URI, serverSelectionTimeoutMS=3000)
    client.server_info()
    db      = client["visionlab"]
    col     = db["detections"]
    MONGO_OK = True
    print(f"[DB] Connected to MongoDB : {MONGO_URI}")
except Exception as e:
    MONGO_OK = False
    col = None
    print(f"[DB] MongoDB unavailable : {e}")

# ─────────────────────────────────────────────────────────────────────────────
# PIPELINE DE TRAITEMENT D'IMAGES 
# ─────────────────────────────────────────────────────────────────────────────

def image_to_b64(img):
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()

def clamp(v): return max(0, min(255, v))

# Niveaux de gris
def to_grayscale(img):
    img = img.convert("RGB")
    dim_x, dim_y = img.size
    gray = Image.new("L", (dim_x, dim_y))
    for y in range(dim_y):
        for x in range(dim_x):
            r, g, b = img.getpixel((x, y))
            gray.putpixel((x, y), int(0.299*r + 0.587*g + 0.114*b))
    return gray

# Lissage gaussien
"""
Atténue le bruit avant le seuillage. 
Sans ce lissage, les pixels bruités créent de fausses régions binaires. 
Le radius=1.5 est un compromis : assez fort pour lisser le bruit, 
assez faible pour ne pas fusionner les objets proches.
"""
def gaussian_blur(img, radius=1.5):
    return img.filter(ImageFilter.GaussianBlur(radius=radius))

# Seuillage Otsu
"""
Otsu teste les 256 valeurs de seuil possibles et choisit celle qui maximise 
la séparation entre les pixels du fond et ceux des objets. 
C'est automatique, sans paramètre utilisateur.
"""
def otsu_threshold(gray):
    dim_x, dim_y = gray.size
    total = dim_x * dim_y
    hist = [0] * 256
    for y in range(dim_y):
        for x in range(dim_x):
            hist[gray.getpixel((x, y))] += 1
    best_t, best_v = 0, 0.0
    sum_all = sum(i * hist[i] for i in range(256))
    sum_bg = w_bg = 0
    for t in range(256):
        w_bg += hist[t]
        if w_bg == 0: continue
        w_fg = total - w_bg
        if w_fg == 0: break
        sum_bg += t * hist[t]
        mb = sum_bg / w_bg
        mf = (sum_all - sum_bg) / w_fg
        v = w_bg * w_fg * (mb - mf) ** 2
        if v > best_v:
            best_v, best_t = v, t
    return best_t

# Seuillage binaire
#Le mode manuel utilise directement la valeur choisie 
def threshold(gray, seuil):
    dim_x, dim_y = gray.size
    bin_img = Image.new("L", (dim_x, dim_y))
    for y in range(dim_y):
        for x in range(dim_x):
            bin_img.putpixel((x, y), 255 if gray.getpixel((x, y)) > seuil else 0)
    return bin_img

# Inversion (négatif)
"""
Le fond occupe généralement plus de 50% de l'image. 
Si après seuillage il y a plus de blanc que de noir, on inverse pour que les objets 
soient blancs (255) et le fond noir (0). 
C'est nécessaire pour que l'étiquetage fonctionne correctement.
"""
def invert(img):
    dim_x, dim_y = img.size
    inv = Image.new("L", (dim_x, dim_y))
    for y in range(dim_y):
        for x in range(dim_x):
            inv.putpixel((x, y), 255 - img.getpixel((x, y)))
    return inv
"""
┌───┬───┬───┐
│ 1 │ 1 │ 1 │   dx = [-1, 0, 1]
├───┼───┼───┤   dy = [-1, 0, 1]
│ 1 │ X │ 1 │   
├───┼───┼───┤   9 voisins au total
│ 1 │ 1 │ 1 │   (incluant le pixel central X)
└───┴───┴───┘
"""
#  Érosion 3x3
#Si un seul voisin est noir (0) → le pixel devient noir
#min(nb)
def erode(img):
    dim_x, dim_y = img.size
    res = Image.new("L", (dim_x, dim_y), 0)
    for y in range(1, dim_y-1):
        for x in range(1, dim_x-1):
            nb = [img.getpixel((x+dx, y+dy)) for dy in [-1,0,1] for dx in [-1,0,1]]
            res.putpixel((x, y), min(nb))
    return res

#  Dilatation 3x3
#Si un seul voisin est blanc (1) → le pixel devient blanc
#max(nb)
def dilate(img):
    dim_x, dim_y = img.size
    res = Image.new("L", (dim_x, dim_y), 0)
    for y in range(1, dim_y-1):
        for x in range(1, dim_x-1):
            nb = [img.getpixel((x+dx, y+dy)) for dy in [-1,0,1] for dx in [-1,0,1]]
            res.putpixel((x, y), max(nb))
    return res
"""
Ouverture : supprime les petits points isolés (bruit binaire)   # érosion → dilatation
Fermeture : rebouche les trous à l'intérieur des objets         # dilatation → érosion

Chaque itération applique le noyau 3×3 une fois de plus, élargissant l'effet.
"""
#  Ouverture + Fermeture
def morphology(img, n=1):
    for _ in range(n): img = erode(img)
    for _ in range(n): img = dilate(img)
    for _ in range(n): img = dilate(img)
    for _ in range(n): img = erode(img)
    return img

# Sobel
"""
Calcule le gradient horizontal (Gx) et vertical (Gy) pour chaque pixel. 
L'amplitude √(Gx²+Gy²) mesure la force d'un contour. 
C'est affiché comme visualisation mais n'intervient pas dans le comptage final.
"""
def sobel(gray):
    dim_x, dim_y = gray.size
    px = gray.load()
    mx = [[-1,0,1],[-2,0,2],[-1,0,1]]
    my = [[-1,-2,-1],[0,0,0],[1,2,1]]
    dst = Image.new("L", (dim_x, dim_y), 0)
    for y in range(1, dim_y-1):
        for x in range(1, dim_x-1):
            gx = gy = 0
            for i in range(3):
                for j in range(3):
                    v = px[x+j-1, y+i-1]
                    gx += mx[i][j] * v
                    gy += my[i][j] * v
            dst.putpixel((x, y), min(255, int((gx**2+gy**2)**0.5)))
    return dst

# BFS — Étiquetage composantes connexes
"""
Parcours en largeur (Breadth-First Search) : pour chaque pixel blanc non visité, 
on explore tous ses voisins connexes pour former une région. 
Chaque région isolée = un objet. On calcule ensuite pour chaque région sa bounding box, 
son centroïde, sa surface et sa compacité.
"""
def label_bfs(binary, min_area=50):
    dim_x, dim_y = binary.size
    visited = [[False]*dim_y for _ in range(dim_x)]
    regions = []
    def bfs(sx, sy):
        px_list = []
        q = [(sx, sy)]; visited[sx][sy] = True
        while q:
            cx, cy = q.pop(0)
            px_list.append((cx, cy))
            for dx, dy in [(-1,0),(1,0),(0,-1),(0,1)]:
                nx, ny = cx+dx, cy+dy
                if 0<=nx<dim_x and 0<=ny<dim_y and not visited[nx][ny] and binary.getpixel((nx,ny))==255:
                    visited[nx][ny] = True
                    q.append((nx,ny))
        return px_list
    for y in range(dim_y):
        for x in range(dim_x):
            if binary.getpixel((x,y))==255 and not visited[x][y]:
                pxs = bfs(x, y)
                if len(pxs) >= min_area:
                    xs = [p[0] for p in pxs]; ys = [p[1] for p in pxs]
                    x1,x2,y1,y2 = min(xs),max(xs),min(ys),max(ys)
                    w,h = x2-x1+1, y2-y1+1
                    area = len(pxs)
                    regions.append({
                        "bbox":[x1,y1,x2,y2],
                        "centroid":[int(sum(xs)/area), int(sum(ys)/area)],
                        "area": area, "width": w, "height": h,
                        "compactness": round(area/(w*h), 3)
                    })
    return regions

# Dessin des bounding boxes
# Dessin manuel des rectangles avec putpixel(), sans bibliothèque de dessin
COLORS = [(255,80,80),(80,200,120),(80,150,255),(255,200,0),(200,80,255),
          (0,220,220),(255,130,0),(180,255,80),(255,80,180),(80,255,210)]

def draw_boxes(img, regions):
    res = img.convert("RGB").copy()
    dim_x, dim_y = res.size
    for i, r in enumerate(regions):
        c = COLORS[i % len(COLORS)]
        x1,y1,x2,y2 = r["bbox"]; cx,cy = r["centroid"]
        for t in range(3):
            for x in range(max(0,x1-t), min(dim_x,x2+t+1)):
                if 0<=y1-t<dim_y: res.putpixel((x,y1-t), c)
                if 0<=y2+t<dim_y: res.putpixel((x,y2+t), c)
            for y in range(max(0,y1-t), min(dim_y,y2+t+1)):
                if 0<=x1-t<dim_x: res.putpixel((x1-t,y), c)
                if 0<=x2+t<dim_x: res.putpixel((x2+t,y), c)
        for d in range(-5,6):
            if 0<=cx+d<dim_x: res.putpixel((cx+d,cy),(255,255,255))
            if 0<=cy+d<dim_y: res.putpixel((cx,cy+d),(255,255,255))
    return res

# ─────────────────────────────────────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────────────────────────────────────

@app.route("/health")
def health():
    return jsonify({
        "status": "ok",
        "service": "VisionLab Backend",
        "mongodb": "connected" if MONGO_OK else "unavailable"
    })

@app.route("/detect", methods=["POST"])
def detect():
    if "image" not in request.files:
        return jsonify({"error": "Aucune image fournie"}), 400

    f = request.files["image"]
    threshold_mode   = request.form.get("threshold_mode", "auto")
    manual_threshold = int(request.form.get("manual_threshold", 120))
    min_area         = int(request.form.get("min_area", 100))
    morph_iter       = int(request.form.get("morph_iterations", 1))
    filename         = f.filename or "image.png"

    try:
        img = Image.open(f.stream).convert("RGB")
    except Exception as e:
        return jsonify({"error": str(e)}), 400

    # Resize
    MAX = 400
    dx, dy = img.size
    if max(dx,dy) > MAX:
        s = MAX / max(dx,dy)
        img = img.resize((int(dx*s), int(dy*s)), Image.LANCZOS)

    steps = {}
    steps["original"] = image_to_b64(img)

    # Pipeline
    gray    = to_grayscale(img);           steps["grayscale"]  = image_to_b64(gray)
    blurred = gaussian_blur(gray);          steps["blurred"]    = image_to_b64(blurred)
    seuil   = otsu_threshold(blurred) if threshold_mode == "auto" else manual_threshold
    binary  = threshold(blurred, seuil);    steps["binary"]     = image_to_b64(binary)

    whites = sum(1 for y in range(binary.size[1]) for x in range(binary.size[0]) if binary.getpixel((x,y))==255)
    if whites > binary.size[0]*binary.size[1]*0.5:
        binary = invert(binary)

    cleaned = morphology(binary, morph_iter); steps["morphology"] = image_to_b64(cleaned)
    sob     = sobel(gray);                    steps["sobel"]      = image_to_b64(sob)

    regions = label_bfs(cleaned, min_area)
    result_img = draw_boxes(img, regions);    steps["result"]     = image_to_b64(result_img)

    objects = [{"id":i+1, **r} for i,r in enumerate(regions)]

    payload = {
        "count":          len(regions),
        "threshold":      seuil,
        "threshold_mode": threshold_mode,
        "image_size":     list(img.size),
        "objects":        objects,
        "steps":          steps,
    }

    # Sauvegarde MongoDB
    if MONGO_OK and col is not None:
        try:
            doc = {
                "filename":       filename,
                "date":           datetime.utcnow().isoformat(),
                "count":          len(regions),
                "threshold":      seuil,
                "threshold_mode": threshold_mode,
                "min_area":       min_area,
                "morph_iter":     morph_iter,
                "image_size":     list(img.size),
                "objects": [{
                    "id":          o["id"],
                    "area":        o["area"],
                    "width":       o["width"],
                    "height":      o["height"],
                    "centroid":    o["centroid"],
                    "compactness": o["compactness"],
                } for o in objects],
            }
            inserted = col.insert_one(doc)
            payload["saved_id"] = str(inserted.inserted_id)
        except Exception as e:
            payload["db_error"] = str(e)

    return jsonify(payload)

# ── Historique ────────────────────────────────────────────────────────────────

@app.route("/history")
def history():
    if not MONGO_OK or col is None:
        return jsonify({"error": "MongoDB non disponible"}), 503
    try:
        docs = list(col.find({}, {"_id":1,"filename":1,"date":1,"count":1,
                                   "threshold":1,"image_size":1}).sort("date",-1).limit(20))
        for d in docs:
            d["_id"] = str(d["_id"])
        return jsonify(docs)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/history/<doc_id>", methods=["DELETE"])
def delete_history(doc_id):
    if not MONGO_OK or col is None:
        return jsonify({"error": "MongoDB non disponible"}), 503
    try:
        from bson import ObjectId
        col.delete_one({"_id": ObjectId(doc_id)})
        return jsonify({"deleted": doc_id})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)