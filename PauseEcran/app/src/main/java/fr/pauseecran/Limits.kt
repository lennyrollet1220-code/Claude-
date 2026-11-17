package fr.pauseecran

import android.content.Context
import java.util.Calendar

/** Photo de la journée : temps utilisé, limite, jour libre… */
data class DayStatus(
    val usedMs: Long,
    val limitMs: Long,
    val perApp: List<Pair<String, Long>>,
    val isFreeDay: Boolean,
    val usageAccess: Boolean,
    val autoTime: Boolean,
) {
    val remainingMs: Long get() = (limitMs - usedMs).coerceAtLeast(0L)

    /** Le jour libre ne compte que si la date/heure est automatique (sinon on pourrait tricher). */
    val freeDayActive: Boolean get() = isFreeDay && autoTime
}

object Limits {
    fun isFreeDayToday(c: Context): Boolean {
        val d = Prefs.freeDay(c)
        return d != 0 && Calendar.getInstance().get(Calendar.DAY_OF_WEEK) == d
    }

    fun status(c: Context): DayStatus {
        val access = Perms.hasUsageAccess(c)
        val all = if (access) UsageTracker.todayUsage(c) else emptyMap()
        val counted = all.filterKeys { !AppRules.isExempt(c, it) }
        val sorted = counted.entries.sortedByDescending { it.value }.map { it.key to it.value }
        return DayStatus(
            usedMs = counted.values.sum(),
            limitMs = Prefs.limitMinutes(c) * 60_000L,
            perApp = sorted,
            isFreeDay = isFreeDayToday(c),
            usageAccess = access,
            autoTime = Perms.isAutoTime(c),
        )
    }

    /**
     * Faut-il bloquer les applis non autorisées ?
     * Par sécurité, on bloque aussi si l'appli ne peut plus mesurer le temps
     * (accès aux données d'utilisation retiré) ou si l'heure a été mise en manuel.
     */
    fun shouldBlock(c: Context, s: DayStatus): Boolean {
        if (!Prefs.isSetupDone(c) || !Prefs.protectionOn(c)) return false
        if (s.freeDayActive) return false
        return !s.usageAccess || !s.autoTime || s.usedMs >= s.limitMs
    }
}
