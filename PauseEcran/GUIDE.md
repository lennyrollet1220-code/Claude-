# ⏸️ Pause Écran : guide d'installation (débutant)

Pause Écran limite ton temps d'écran à **1 h 30 par jour** (sauf le jour libre). Quand le temps est écoulé, les applis non autorisées affichent un écran gris.

Sans ordinateur : 5 minutes. Avec un ordinateur : environ 45 minutes la première fois.

---

## 📲 Méthode la plus simple : sans ordinateur

1. Sur ton téléphone, ouvre ce lien dans Chrome :
   **https://github.com/lennyrollet1220-code/Claude-/releases/download/pause-ecran/PauseEcran.apk**
2. Le fichier se télécharge. Si Chrome affiche « Ce type de fichier peut être dangereux », touche **Télécharger quand même**.
3. Touche la notification **PauseEcran.apk** (ou ouvre-le depuis l'appli *Fichiers → Téléchargements*).
4. Android affiche « Pour votre sécurité, l'installation d'applis inconnues est bloquée » : touche **Paramètres**, active **Autoriser cette source**, puis reviens en arrière.
5. Touche **Installer**. Si Play Protect affiche « Appli non sécurisée » ou « bloquée », touche **Plus de détails → Installer quand même**. C'est normal : l'appli ne vient pas du Play Store et utilise l'accessibilité.
6. Touche **Ouvrir**, puis suis l'**étape 5** plus bas (PIN avec ta personne de confiance, applis, jour libre, autorisations).
7. ⚠️ Avec cette méthode, l'accessibilité est presque toujours grisée (« Paramètre restreint ») : va dans *Paramètres → Applis → Pause Écran*, touche **⋮** en haut à droite, puis **Autoriser les paramètres restreints**, puis réactive l'accessibilité.

Ensuite, tu peux ignorer les étapes 1 à 4 ci-dessous : elles ne servent qu'à installer avec un ordinateur.

---

## Étape 1 : installer Android Studio (sur ton ordinateur)

1. Va sur **https://developer.android.com/studio** et clique sur **Download Android Studio**.
2. Installe-le en gardant **toutes les options par défaut** (clique « Next » jusqu'au bout).
3. Au premier lancement, choisis **Standard**, accepte les licences (**Accept**), puis **Finish**. Android Studio télécharge environ 1 à 3 Go.

## Étape 2 : récupérer le projet

1. Sur la page GitHub de ton dépôt, choisis la branche `claude/android-screen-time-limiter-qttbke`.
2. Bouton vert **Code** → **Download ZIP**.
3. Décompresse le ZIP (clic droit → « Extraire tout »).
4. Dans Android Studio : **File → Open** (ou « Open » sur l'écran d'accueil), puis sélectionne le dossier **`PauseEcran`** (celui qui contient `settings.gradle.kts`). Ne sélectionne pas le dossier parent.
5. Si on te demande « Trust project? », clique **Trust Project**.
6. Attends la fin de la synchronisation (barre en bas à droite, « Gradle sync »), ce qui peut prendre 5 à 10 minutes la première fois.
   - Si Android Studio propose de mettre à jour l'« Android Gradle Plugin » : clique **Remind me later** (ne mets pas à jour).
   - S'il manque un « SDK Platform 35 », clique sur le lien bleu **Install…** qui apparaît.

## Étape 3 : préparer ton téléphone

1. **Activer le mode développeur** : *Paramètres → À propos du téléphone* → touche **7 fois** sur **Numéro de build**.
   (Samsung : *À propos du téléphone → Informations sur le logiciel → Numéro de version*. Xiaomi : *Version de MIUI/HyperOS*.)
   Le message « Vous êtes maintenant développeur » s'affiche.
2. **Activer le débogage USB** : *Paramètres → Système → Options pour les développeurs* (Samsung : en bas des Paramètres) → active **Débogage USB**.
3. Branche le téléphone à l'ordinateur avec le **câble USB**. Une fenêtre « Autoriser le débogage USB ? » s'affiche sur le téléphone : coche **Toujours autoriser** et touche **Autoriser**.
   - Si rien ne s'affiche : déroule les notifications, touche « USB » et choisis **Transfert de fichiers**.
   - Sous Windows avec certains téléphones (Samsung, Xiaomi), il faut installer le pilote USB du fabricant.

## Étape 4 : installer l'appli

1. En haut d'Android Studio, le nom de ton téléphone doit apparaître dans la liste des appareils.
2. Clique sur le **triangle vert ▶ (Run 'app')**.
3. Attends 1 à 3 minutes. L'appli s'ouvre toute seule sur le téléphone. ✅

Tu peux ensuite débrancher le câble : l'appli reste installée.

## Étape 5 : premier lancement (avec ta personne de confiance)

1. **Code PIN** : donne le téléphone à ta personne de confiance. Elle choisit un code de 4 à 8 chiffres et le tape deux fois. **Tu ne dois pas le voir.**
2. **Applis autorisées** : vérifie la liste présélectionnée (WhatsApp, École Directe, Gmail, Téléphone, Messages, Horloge, Appareil photo) et coche ou décoche des applis si besoin.
3. **Jour libre** : samedi par défaut, tu peux le changer.
4. **Autorisations** : touche chaque bouton **Activer** (voir le tableau ci-dessous), puis reviens dans l'appli avec le bouton Retour. Quand tout est coché ✓, touche **Terminer**.

> Tu ne peux pas activer l'accessibilité (« Paramètre restreint ») ? Va dans *Paramètres → Applis → Pause Écran*, touche les **3 points ⋮** en haut à droite, puis **Autoriser les paramètres restreints**. Réessaie ensuite.

---

## Les autorisations, et pourquoi

| Autorisation | Où | À quoi elle sert |
|---|---|---|
| **Accès aux données d'utilisation** | Paramètres → Applis → Accès spécial → Accès aux données d'utilisation | Mesurer combien de temps tu passes dans chaque appli depuis minuit. |
| **Service d'accessibilité** | Paramètres → Accessibilité → (Applis installées) → Pause Écran | Savoir instantanément quelle appli est ouverte, afficher l'écran gris et protéger les pages des Paramètres. Android le relance tout seul après un redémarrage. |
| **Administrateur de l'appareil** | La fenêtre s'ouvre depuis l'appli → « Activer » | Android refuse la désinstallation tant que l'administrateur est actif. |
| **Date et heure automatiques** | Paramètres → Système → Date et heure | Empêcher de tricher en changeant la date. Si l'heure est en manuel, l'appli bloque par sécurité. |
| **Notifications** | Fenêtre « Autoriser » | Te prévenir 5 minutes avant la fin, et signaler si la protection est coupée. |

Pause Écran n'utilise **pas Internet** : aucune donnée ne quitte ton téléphone.

---

## Utilisation au quotidien

- L'**écran principal** affiche le temps restant, une barre de progression et tes applis les plus utilisées.
- Les **réglages** (bouton « Réglages (code PIN) ») permettent de changer la limite, les applis autorisées, le jour libre, de couper la protection ou de changer le code. Ils demandent tous le PIN.
- Après 5 codes faux, la saisie est bloquée pendant 5 minutes.
- **Pour désinstaller** : Réglages (PIN) → **Préparer la désinstallation** → Désinstaller.

## Mettre à jour l'appli après une modification du code

Rebranche le téléphone et clique de nouveau sur ▶. Tes réglages sont conservés.

---

## Limites : ce qui reste contournable

Une appli normale ne peut pas verrouiller totalement un téléphone (seule une appli « propriétaire de l'appareil » installée sur un téléphone remis à zéro le peut). Voici ce qui reste possible, en toute honnêteté :

1. **Mode sans échec** : en redémarrant en mode sans échec, les applis téléchargées (dont Pause Écran) sont désactivées. Les applis préinstallées (YouTube, Chrome…) restent alors utilisables.
2. **Réinitialisation d'usine** : elle efface tout, Pause Écran compris.
3. **Ordinateur et ADB** : avec le débogage USB activé, on peut désinstaller l'appli depuis un ordinateur. 👉 Après l'installation, **désactive le débogage USB** (et idéalement les Options pour les développeurs). Ces menus ne sont pas protégés par le PIN.
4. **Pages des Paramètres** : la protection repère les pages qui affichent le nom « Pause Écran ». Une version d'Android très personnalisée peut avoir une page qui y échappe.
5. **Arrêt par le système** : certains téléphones (Xiaomi, Huawei, certains Samsung) coupent parfois les services d'accessibilité pour économiser la batterie. Mets Pause Écran en batterie **« Non restreinte »** (Paramètres → Applis → Pause Écran → Batterie). Si le service est coupé, une notification te prévient au redémarrage.
6. **Précision du temps** : le calcul s'appuie sur l'historique d'Android. Il peut y avoir quelques secondes d'écart, et la vidéo en mode « image dans l'image » n'est pas toujours comptée.
7. **Autres appareils** : une tablette, un ordinateur ou une console ne sont évidemment pas concernés.
8. **Le PIN** : s'il est trop simple (1234, date de naissance), il se devine. La personne de confiance doit en choisir un vrai.

Le but n'est pas d'être incontournable, mais de rendre la triche assez pénible pour que faire ta séance de sport soit plus simple 💪.
