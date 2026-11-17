package fr.pauseecran

import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import java.util.Calendar

/**
 * Calcule le temps passé dans chaque appli depuis minuit,
 * à partir de l'historique d'Android (UsageStatsManager).
 */
object UsageTracker {
    // Codes d'événements Android (valeurs fixes de UsageEvents.Event)
    private const val RESUMED = 1               // appli au premier plan
    private const val PAUSED = 2                // appli en arrière-plan
    private const val STOPPED = 23              // activité arrêtée
    private const val SCREEN_OFF = 16           // écran éteint
    private const val SHUTDOWN = 26             // téléphone éteint

    fun startOfToday(): Long = Calendar.getInstance().apply {
        set(Calendar.HOUR_OF_DAY, 0)
        set(Calendar.MINUTE, 0)
        set(Calendar.SECOND, 0)
        set(Calendar.MILLISECOND, 0)
    }.timeInMillis

    /** Temps (en millisecondes) par nom de paquet, depuis minuit. */
    fun todayUsage(c: Context): Map<String, Long> {
        val usm = c.getSystemService(UsageStatsManager::class.java) ?: return emptyMap()
        val start = startOfToday()
        val now = System.currentTimeMillis()
        val result = HashMap<String, Long>()
        fun add(pkg: String, ms: Long) {
            if (ms > 0) result[pkg] = (result[pkg] ?: 0L) + ms
        }

        val events = try {
            usm.queryEvents(start, now)
        } catch (_: Exception) {
            return emptyMap()
        } ?: return emptyMap()
        val ev = UsageEvents.Event()
        var current: String? = null
        var currentStart = 0L
        var sawActivity = false

        while (events.hasNextEvent()) {
            events.getNextEvent(ev)
            val pkg = ev.packageName ?: continue
            val t = ev.timeStamp
            when (ev.eventType) {
                RESUMED -> {
                    current?.let { add(it, t - currentStart) }
                    current = pkg
                    currentStart = t
                    sawActivity = true
                }
                PAUSED, STOPPED -> {
                    if (current == pkg) {
                        add(pkg, t - currentStart)
                        current = null
                    } else if (!sawActivity && ev.eventType == PAUSED) {
                        // Appli déjà ouverte avant minuit : on compte depuis minuit.
                        add(pkg, t - start)
                    }
                    sawActivity = true
                }
                SCREEN_OFF, SHUTDOWN -> {
                    current?.let { add(it, t - currentStart) }
                    current = null
                }
            }
        }
        current?.let { add(it, now - currentStart) }
        return result
    }
}
