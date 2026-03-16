[English](README.md) · [Deutsch](README.de.md) · [中文](README.zh.md) · [日本語](README.ja.md) · [Español](README.es.md) · **Français**

# Obsidian Health Sync

Synchronisez automatiquement les pas, le sommeil, la fréquence cardiaque, le stress, les activités et plus encore depuis votre tracker de fitness vers Obsidian Daily Notes — sous forme de propriétés frontmatter interrogeables avec Dataview.

> **Bureau uniquement.** Ce plugin utilise le BrowserWindow d'Electron pour l'authentification et ne fonctionne pas sur mobile.

## Fournisseurs pris en charge

- **Garmin Connect** — connectez-vous avec vos identifiants Garmin habituels, aucune clé API requise

D'autres fournisseurs (Fitbit, Oura, Whoop) sont prévus.

## Fonctionnalités

- **Synchronisation automatique au démarrage** — vérifie les 7 derniers jours et complète les données de santé manquantes
- **Synchronisation manuelle** — synchronisez n'importe quelle Daily Note ouverte via la palette de commandes
- **Remplissage rétroactif** — synchronisation en masse d'une plage de dates (par ex. les 3 derniers mois)
- **Plus de 20 métriques** — pas, score de sommeil, HRV, stress, Body Battery, SpO2, poids, et plus
- **Suivi des activités** — chaque entraînement apparaît sous forme de résumé lisible
- **Lieu d'entraînement** — nom du lieu obtenu par géocodage inverse de votre première activité GPS
- **Détection intelligente** — détecte automatiquement le chemin et le format de vos Daily Notes depuis Periodic Notes ou le plugin natif Daily Notes
- **Support des sous-dossiers** — trouve les Daily Notes existantes dans les dossiers imbriqués (par ex. `Journal/2024-07/`)
- **Détection automatique de la langue** — la langue de l'interface est définie selon la langue de votre Obsidian (EN, DE, ZH, JA, ES, FR)
- **Données structurées optionnelles** — champ `trainings` lisible par machine pour des requêtes Dataview avancées

## Sortie Frontmatter

### Métriques

```yaml
---
steps: 15185
resting_hr: 69
sleep_score: 81
sleep_duration: 7h 43min
hrv: 39
stress: 30
workout_location: Bad Honnef, Deutschland
---
```

### Activités

Chaque entraînement est écrit comme une clé frontmatter avec une chaîne de résumé :

```yaml
---
hiking: 8.2 km · 157min · Ø105 bpm · 696 kcal
e_bike: 22.1 km · 65min · Ø112 bpm · 420 kcal
---
```

Seuls les jours avec des entraînements réels reçoivent des clés d'activité — le plugin n'écrase jamais le contenu existant de vos notes.

### Entraînements (optionnel, lisible par machine)

Activez « Entraînements lisibles par machine » dans les paramètres pour ajouter un champ `trainings` structuré pour les requêtes Dataview :

```yaml
---
trainings:
  - type: hiking
    category: outdoor
    distance_km: 8.2
    duration_min: 157
    avg_hr: 105
    calories: 696
  - type: e_bike
    category: cycling
    distance_km: 22.1
    duration_min: 65
    avg_hr: 112
    calories: 420
---
```

## Installation

### Depuis Community Plugins (recommandé)

1. Ouvrez les Paramètres Obsidian → Community Plugins → Parcourir
2. Recherchez "Health Sync"
3. Installez et activez le plugin
4. Connectez-vous à Garmin Connect dans les paramètres du plugin

### Manuelle

1. Téléchargez `main.js` et `manifest.json` depuis la [dernière version](https://github.com/fcandi/obsidian-health-sync/releases)
2. Créez un dossier `.obsidian/plugins/obsidian-health-sync/` dans votre vault
3. Copiez les deux fichiers dans ce dossier
4. Activez le plugin dans Paramètres → Community Plugins

## Normalisation des clés d'activité

Les noms d'activité spécifiques à chaque fournisseur sont normalisés en clés canoniques. Les valeurs `typeKey` de Garmin servent de standard de base, avec un léger nettoyage pour les clés trop verbeuses :

| Clé du fournisseur | Clé canonique | Catégorie |
|---|---|---|
| `e_bike_fitness` | `e_bike` | cycling |
| `e_bike_mountain` | `e_mtb` | cycling |
| `resort_skiing_snowboarding` | `skiing` | winter |
| `backcountry_skiing_snowboarding` | `backcountry_skiing` | winter |
| `stand_up_paddleboarding` | `sup` | water |
| `fitness_equipment` | `gym_equipment` | gym |

Toutes les autres clés Garmin sont conservées telles quelles (par ex. `hiking`, `running`, `cycling`, `swimming`, `strength_training`, `yoga`, ...).

### Catégories d'activité

Chaque activité se voit attribuer une catégorie pour la compatibilité entre fournisseurs :

| Catégorie | Exemples |
|---|---|
| `cycling` | cycling, e_bike, e_mtb, mountain_biking, indoor_cycling, road_biking |
| `running` | running, trail_running, treadmill, ultra_run |
| `walking` | walking, indoor_walking |
| `outdoor` | hiking, mountaineering, rock_climbing, bouldering |
| `swimming` | swimming, pool_swimming, open_water_swimming |
| `winter` | skiing, backcountry_skiing, cross_country_skiing, snowboarding |
| `water` | sup, rowing, kayaking, surfing, sailing |
| `gym` | strength_training, gym_equipment, elliptical, yoga, pilates, hiit |
| `racket` | tennis, badminton, squash, table_tennis, pickleball |
| `team` | soccer, basketball, volleyball, rugby |
| `other` | golf, meditation, multi_sport |

Les futurs fournisseurs (Fitbit, Oura, etc.) mapperont leurs noms d'activité sur ces mêmes clés canoniques.

## Développement

```bash
npm install
npm run dev    # mode surveillance
npm run build  # build de production
```
