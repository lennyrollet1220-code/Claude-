package fr.pauseecran

import java.util.Calendar

object Format {
    /** 4 500 000 ms -> « 1 h 15 min » */
    fun duration(ms: Long): String {
        val totalMin = ms / 60_000L
        if (totalMin < 1) return "moins d'1 min"
        val h = totalMin / 60
        val m = totalMin % 60
        return when {
            h == 0L -> "$m min"
            m == 0L -> "$h h"
            else -> "$h h ${"%02d".format(m)}"
        }
    }

    /** Valeurs Calendar dans l'ordre affiché (0 = aucun jour libre). */
    val DAY_VALUES = intArrayOf(
        Calendar.MONDAY, Calendar.TUESDAY, Calendar.WEDNESDAY, Calendar.THURSDAY,
        Calendar.FRIDAY, Calendar.SATURDAY, Calendar.SUNDAY, 0,
    )
    val DAY_NAMES = arrayOf("Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche", "Aucun")

    fun dayName(value: Int): String {
        val i = DAY_VALUES.indexOf(value)
        return if (i >= 0) DAY_NAMES[i] else "Aucun"
    }
}
