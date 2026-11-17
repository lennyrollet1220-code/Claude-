package fr.pauseecran

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Au démarrage du téléphone, Android relance automatiquement le service d'accessibilité.
 * Ici on vérifie simplement qu'il est bien actif, sinon on affiche une notification.
 */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (!Prefs.isSetupDone(context) || !Prefs.protectionOn(context)) return
        if (!Perms.isAccessibilityEnabled(context)) Notif.protectionOff(context)
    }
}
