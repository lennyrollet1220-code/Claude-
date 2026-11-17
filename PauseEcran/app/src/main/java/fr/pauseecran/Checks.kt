package fr.pauseecran

import android.app.Activity
import android.view.LayoutInflater
import android.view.View
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.core.content.ContextCompat
import com.google.android.material.button.MaterialButton

data class Check(
    val title: String,
    val desc: String,
    val ok: Boolean,
    val actionLabel: String,
    val action: () -> Unit,
)

/** Liste « ✓ / ! » des autorisations, utilisée sur l'écran principal et au premier lancement. */
object Checks {

    /**
     * @param guarded enveloppe les actions qui ouvrent une page protégée (demande du PIN si besoin).
     */
    fun standard(a: Activity, guarded: (() -> Unit) -> Unit): List<Check> = listOf(
        Check(
            "Accès aux données d'utilisation",
            "Pour mesurer ton temps d'écran",
            Perms.hasUsageAccess(a), "Activer",
        ) { guarded { Perms.openUsageAccess(a) } },
        Check(
            "Service d'accessibilité",
            "Pour savoir quelle appli est ouverte et la bloquer",
            Perms.isAccessibilityEnabled(a), "Activer",
        ) {
            Toast.makeText(a, "Choisis « Pause Écran » puis active l'interrupteur", Toast.LENGTH_LONG).show()
            Perms.openAccessibility(a)
        },
        Check(
            "Administrateur de l'appareil",
            "Pour empêcher la désinstallation",
            Perms.isAdminActive(a), "Activer",
        ) { guarded { Perms.requestAdmin(a) } },
        Check(
            "Date et heure automatiques",
            "Pour que le compteur et le jour libre soient fiables",
            Perms.isAutoTime(a), "Ouvrir",
        ) { Perms.openDateSettings(a) },
        Check(
            "Notifications",
            "Alerte 5 minutes avant la fin",
            Perms.hasNotifications(a), "Autoriser",
        ) { Perms.requestNotifications(a) },
    )

    fun render(container: LinearLayout, checks: List<Check>) {
        container.removeAllViews()
        val inflater = LayoutInflater.from(container.context)
        for (c in checks) {
            val v = inflater.inflate(R.layout.item_check, container, false)
            v.findViewById<TextView>(R.id.mark).apply {
                text = if (c.ok) "✓" else "!"
                setTextColor(ContextCompat.getColor(context, if (c.ok) R.color.ok else R.color.warn))
            }
            v.findViewById<TextView>(R.id.title).text = c.title
            v.findViewById<TextView>(R.id.desc).text = c.desc
            v.findViewById<MaterialButton>(R.id.action).apply {
                visibility = if (c.ok) View.GONE else View.VISIBLE
                text = c.actionLabel
                setOnClickListener { c.action() }
            }
            container.addView(v)
        }
    }
}
