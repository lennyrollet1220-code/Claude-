# Pause Écran (Android, Kotlin)

Appli Android personnelle pour limiter le temps d'écran : 1 h 30 par jour, applis toujours autorisées, jour libre, écran gris de blocage, code PIN anti-triche.

👉 **Guide d'installation pas à pas : [GUIDE.md](GUIDE.md)**

## Organisation du code (`app/src/main/java/fr/pauseecran/`)

| Fichier | Rôle |
|---|---|
| `GuardService.kt` | Service d'accessibilité : détecte l'appli ouverte, bloque, protège les Paramètres |
| `UsageTracker.kt` | Calcule le temps par appli depuis minuit (UsageStatsManager) |
| `Limits.kt` | Décide s'il faut bloquer (limite, jour libre, anti-triche) |
| `AppRules.kt` | Applis autorisées / système / présélection |
| `Prefs.kt` | Réglages enregistrés + code PIN (haché, 5 essais max) |
| `MainActivity.kt` | Écran principal |
| `SetupActivity.kt` | Premier lancement (PIN, applis, jour libre, autorisations) |
| `SettingsActivity.kt` | Réglages protégés par PIN |
| `AppPickerActivity.kt` | Liste des applis à cocher |
| `BlockActivity.kt` | Écran gris « Temps écoulé » / page protégée |
| `AdminReceiver.kt` | Administrateur de l'appareil (anti-désinstallation) |
| `BootReceiver.kt` | Vérification après redémarrage |

Pour changer la limite par défaut ou le message, voir `Prefs.kt` (`limit_minutes`, 90) et `res/values/strings.xml`.
