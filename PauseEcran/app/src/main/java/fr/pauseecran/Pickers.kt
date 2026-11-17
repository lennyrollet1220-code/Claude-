package fr.pauseecran

import android.app.Activity
import com.google.android.material.dialog.MaterialAlertDialogBuilder

object Pickers {
    private val LIMITS = intArrayOf(30, 45, 60, 75, 90, 105, 120, 150, 180, 240)

    fun day(a: Activity, current: Int, onPick: (Int) -> Unit) {
        val idx = Format.DAY_VALUES.indexOf(current).coerceAtLeast(0)
        MaterialAlertDialogBuilder(a)
            .setTitle("Jour libre")
            .setSingleChoiceItems(Format.DAY_NAMES, idx) { d, which ->
                onPick(Format.DAY_VALUES[which])
                d.dismiss()
            }
            .setNegativeButton("Annuler", null)
            .show()
    }

    fun limit(a: Activity, current: Int, onPick: (Int) -> Unit) {
        val labels = LIMITS.map { Format.duration(it * 60_000L) }.toTypedArray()
        MaterialAlertDialogBuilder(a)
            .setTitle("Limite quotidienne")
            .setSingleChoiceItems(labels, LIMITS.indexOf(current)) { d, which ->
                onPick(LIMITS[which])
                d.dismiss()
            }
            .setNegativeButton("Annuler", null)
            .show()
    }
}
