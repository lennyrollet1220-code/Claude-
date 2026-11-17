package fr.pauseecran

import android.app.admin.DeviceAdminReceiver
import android.content.Context
import android.content.Intent

/** Administrateur de l'appareil : tant qu'il est actif, Android refuse la désinstallation. */
class AdminReceiver : DeviceAdminReceiver() {
    override fun onDisableRequested(context: Context, intent: Intent): CharSequence =
        "Désactiver l'administrateur permet de désinstaller Pause Écran. Utilise plutôt « Préparer la désinstallation » dans les réglages (code PIN)."
}
