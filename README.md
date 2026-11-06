# ⚡ FORGE : ton coach sportif perso

Application web installable (PWA) qui crée **un programme sportif 100 % personnalisé** à partir d'un questionnaire d'une quarantaine de questions.

## Ce que fait l'appli

- **Questionnaire complet** (~40 questions, 8 thèmes) : profil, objectifs, niveau (pompes, gainage, tractions, cardio, souplesse), jours dispo, durée des séances, lieu et matériel, blessures, sommeil, stress, sports préférés, style de coach, alimentation, allergies…
- **Programme sur-mesure de 1 à 52 semaines** (tu choisis la durée) :
  - répartition adaptée à l'objectif et au nombre de jours (full body, haut/bas, push/pull/jambes, HIIT, circuits, cardio, mobilité) ;
  - exercices filtrés selon ton matériel, ton niveau **et tes blessures** ;
  - progression par blocs de 4 semaines (fondations → progression → intensification → récupération), semaine finale de test ;
  - exercices renouvelés toutes les 2 semaines ;
  - suivi des séries avec **minuteur de repos**, validation des séances, série de jours (streak).
- **Objectifs** : profil (Bâtisseur, Brûleur, Sculpteur…), poids visé, pompes, planche, tractions, cardio, pas, eau, sommeil, étapes clés, courbe de poids et carnet de tests.
- **Coach alimentaire** : calories et macros calculées (Mifflin-St Jeor), menu du jour adapté à ton régime, à tes allergies et aux aliments que tu détestes, bouton « autre idée », 40 recettes et goûters avec photos, liste de courses, conseils.
- **Notifications de motivation** quotidiennes (style bienveillant, motivant ou militaire) + **export agenda (.ics)** de toutes les séances avec alarme.
- **Bouton « Ajouter à l'écran d'accueil »** : installation en un geste sur Android et ordinateur ; sur iPhone, un guide en 3 étapes (Apple n'autorise pas l'installation automatique).
- Fonctionne **hors-ligne** une fois installée. Les données restent sur ton téléphone (localStorage).

## Mettre l'appli en ligne (GitHub Pages, gratuit)

1. Sur GitHub : **Settings → Pages**.
2. *Source* : **Deploy from a branch** → choisis la branche de l'appli, dossier **/ (root)** → **Save**.
3. Une minute plus tard, l'appli est disponible à `https://<ton-pseudo>.github.io/<nom-du-repo>/`.
4. Ouvre ce lien sur ton téléphone (Chrome sur Android, **Safari** sur iPhone) et appuie sur **« Ajouter à l'écran d'accueil »**.

> Le HTTPS est obligatoire pour l'installation et les notifications : GitHub Pages le fournit automatiquement.

## Les notifications, concrètement

| Appareil | Ce qui marche |
|---|---|
| Android (Chrome), appli installée | Notification à l'heure choisie quand tu ouvres l'appli, et en arrière-plan via *Periodic Background Sync* (Chrome décide de la fréquence exacte). |
| iPhone (iOS 16.4+), appli installée depuis Safari | Notification quand l'appli est ouverte ou revient au premier plan. |
| Partout | **📅 Rappels dans mon agenda** (Profil) : toutes tes séances dans ton calendrier avec alarme. C'est la méthode la plus fiable, même appli fermée. |

Des notifications « push » garanties à heure fixe, appli fermée, demanderaient un petit serveur Web Push. Le service worker (`sw.js`) gère déjà l'événement `push`, il suffirait d'y brancher un serveur.

## Tester en local

```bash
python3 -m http.server 8000
# puis ouvre http://localhost:8000
```

Astuce test : `?today=2026-11-20` simule une autre date.

## Structure

```
index.html            page unique
css/style.css         design (thème sombre, mobile d'abord)
js/data.js            photos, ~60 exercices, ~40 recettes, messages du coach
js/engine.js          génération du programme, objectifs, nutrition, export .ics
js/app.js             interface, questionnaire, notifications, installation
sw.js                 service worker (hors-ligne + notifications)
manifest.webmanifest  manifeste PWA
icons/                icônes de l'appli
```

Photos : [Unsplash](https://unsplash.com). FORGE ne remplace pas un avis médical.
