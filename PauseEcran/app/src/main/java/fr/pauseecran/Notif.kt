package fr.pauseecran

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat

object Notif {
    private const val CHANNEL = "pause_ecran"
    private const val ID_PROTECTION_OFF = 1
    private const val ID_FIVE_MIN = 2

    private fun manager(c: Context): NotificationManager {
        val nm = c.getSystemService(NotificationManager::class.java)
        nm.createNotificationChannel(
            NotificationChannel(CHANNEL, "Pause Écran", NotificationManager.IMPORTANCE_HIGH)
        )
        return nm
    }

    private fun show(c: Context, id: Int, title: String, text: String) {
        if (!Perms.hasNotifications(c)) return
        val pi = PendingIntent.getActivity(
            c, id,
            Intent(c, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
        )
        val n = NotificationCompat.Builder(c, CHANNEL)
            .setSmallIcon(R.drawable.ic_notif)
            .setContentTitle(title)
            .setContentText(text)
            .setStyle(NotificationCompat.BigTextStyle().bigText(text))
            .setContentIntent(pi)
            .setAutoCancel(true)
            .build()
        try {
            manager(c).notify(id, n)
        } catch (_: SecurityException) { }
    }

    fun protectionOff(c: Context) = show(
        c, ID_PROTECTION_OFF, "Pause Écran est inactif",
        "Le service d'accessibilité est désactivé. Ouvre l'appli pour le réactiver."
    )

    fun cancelProtectionOff(c: Context) = manager(c).cancel(ID_PROTECTION_OFF)

    fun fiveMinutesLeft(c: Context) = show(
        c, ID_FIVE_MIN, "Plus que 5 minutes ⏳",
        "Ton temps d'écran d'aujourd'hui est presque écoulé. Prépare-toi pour ta séance de sport !"
    )
}
