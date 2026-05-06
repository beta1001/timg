# Mini-Projet : Détection et Comptage d'Objets

# VisionLab — Docker Compose

Application de détection et comptage d'objets dans une image — conteneurisée avec Docker Compose.

---

## Structure du projet

```
timg/
├── docker-compose.yml
├── backend/
│   ├── app.py              ← Flask + pipeline PIL + MongoDB
│   ├── requirements.txt    ← flask, pillow, pymongo
│   └── Dockerfile
├── frontend/
│    ├── public/
│    │   └──index.html
│    ├── src/
│    │   ├──api.js
│    │   ├──App.js
│    │   ├──index.js
│    │   ├──styles.js
│    │   ├──...
│    │   ├──components/
│    │   │  ├──ObjectDetector.jsx   ← state + layout
│    │   │  ├── DropZone.jsx        ← image selection
│    │   │  ├── ParamsPanel.jsx     ← 4 sliders + analyze button
│    │   │  ├── MetricsPanel.jsx    ← count/threshold/size cards
│    │   │  ├── ObjectList.jsx          ← per-object rows
│    │   │  ├── HistoryPanel.jsx        ← MongoDB history
│    │   └  └── PipelineViewer.jsx
└    └── Dockerfile          ← nginx:alpine

```

## Architecture (3 services)

```
┌─────────────────────────────────────────────────────────┐
│                    docker-compose.yml                   │
│                                                         │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐    │
│  │  frontend   │   │   backend   │   │     db      │    │
│  │  nginx:alp  │──►│ python:3.11 │──►│    mongo    │    │
│  │  port 8080  │   │  port 5000  │   │  port 27017 │    │
│  └─────────────┘   └─────────────┘   └─────────────┘    │
│         └──────────────────────────────────────┘        │
│                       appnet                            │
└─────────────────────────────────────────────────────────┘
```

## Lancer l'application

```bash
# 1. Construire et démarrer tous les services
# lancer cette commande dans le fichier root du projet (timg)
docker compose up --build

# 2. Vérifier les conteneurs actifs
docker compose ps

# 3. Accéder à l'application
#    Frontend  → http://localhost:8080
#    Backend   → http://localhost:5000/health

# Arrêter
docker compose down
```

## Rôle des paramètres et comment les régler

### 1. Mode de seuillage

Mode        | Quand l'utiliser
────────────────────────────────────────────────────────────────────────────────────
Otsu (auto) | Images avec bon contraste fond/objet. Première approche recommandée.
────────────────────────────────────────────────────────────────────────────────────
Manuel      | Quand Otsu échoue : objets très clairs sur fond clair,
            | ou très sombres sur fond sombre.
────────────────────────────────────────────────────────────────────────────────────

### 2. Seuil manuel (0 → 255)

C'est le niveau de gris frontière entre fond et objet.

Valeur          | Effet
───────────────────────────────────────────────────────────────────────────────────────────
Bas (40–80)     | Seuls les pixels très sombres deviennent objets. Utile si les objets sont
                | sombres.
───────────────────────────────────────────────────────────────────────────────────────────
Moyen (100–140) | Valeur par défaut, bon équilibre.
───────────────────────────────────────────────────────────────────────────────────────────
Haut (180–220)  | Presque tous les pixels deviennent objets, sauf les très blancs. Utile si
                | les objets sont clairs.
───────────────────────────────────────────────────────────────────────────────────────────

Astuce : regarder l'image "Seuillage binaire" dans le pipeline — les objets doivent apparaître en blanc bien distincts. Si tout est blanc ou tout est noir, ajustez.

### 3. Surface minimale (10 → 500 px²)

Filtre les régions trop petites pour être des objets réels.

Valeur           |Effet
───────────────────────────────────────────────────────────────────────────────────────────
Petite (10–30)   | Détecte même les tout petits objets, mais aussi le bruit résiduel.
Moyenne (80–150) | Équilibre recommandé pour la plupart des images.
Grande (200–500) | Ne garde que les grands objets, ignore les petits détails.

Astuce : si vous obtenez trop d'objets parasites, augmentez cette valeur. Si des vrais objets disparaissent, diminuez-la.

### 4. Itérations morphologiques (1 → 4)

Contrôle l'intensité du nettoyage binaire.

Valeur | Effet
───────────────────────────────────────────────────────────────────────────────────────────
1      | Nettoyage léger, préserve les détails fins.
2      | Recommandé pour images légèrement bruitées.
3–4    | Nettoyage agressif. Fusionne les objets proches et supprime les formes fines.

Attention : trop d'itérations peut fusionner deux objets voisins en un seul, ou faire disparaître des petits objets.
