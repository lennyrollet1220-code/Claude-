package fr.pauseecran

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.LayoutInflater
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.button.MaterialButton
import com.google.android.material.progressindicator.LinearProgressIndicator

/** Écran principal : temps restant, barre de progression, applis les plus utilisées. */
class MainActivity : AppCompatActivity() {

    private val handler = Handler(Looper.getMainLooper())
    private val refresher = object : Runnable {
        override fun run() {
            refresh()
            handler.postDelayed(this, 30_000L)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (!Prefs.isSetupDone(this)) {
            startActivity(Intent(this, SetupActivity::class.java))
            finish()
            return
        }
        setContentView(R.layout.activity_main)
        findViewById<MaterialButton>(R.id.btnSettings).setOnClickListener {
            startActivity(Intent(this, SettingsActivity::class.java))
        }
    }

    override fun onResume() {
        super.onResume()
        if (!Prefs.isSetupDone(this)) return
        handler.post(refresher)
    }

    override fun onPause() {
        super.onPause()
        handler.removeCallbacks(refresher)
    }

    /** Si la protection tourne, ouvrir une page protégée demande le PIN. */
    private fun guarded(action: () -> Unit) {
        if (Prefs.protectionOn(this) && Perms.isAccessibilityEnabled(this)) {
            PinDialog.ask(this) {
                Prefs.unlockFor(this, 10)
                action()
            }
        } else {
            action()
        }
    }

    private fun refresh() {
        Checks.render(findViewById(R.id.checks), Checks.standard(this, ::guarded))
        Thread {
            val s = Limits.status(this)
            val top = s.perApp.take(5).map { (pkg, ms) ->
                Triple(AppRules.label(this, pkg), AppRules.icon(this, pkg), ms)
            }
            runOnUiThread { if (!isDestroyed) show(s, top) }
        }.start()
    }

    private fun show(s: DayStatus, top: List<Triple<String, android.graphics.drawable.Drawable?, Long>>) {
        val tvRemaining = findViewById<TextView>(R.id.tvRemaining)
        val tvUsed = findViewById<TextView>(R.id.tvUsed)
        val tvBadge = findViewById<TextView>(R.id.tvBadge)
        val progress = findViewById<LinearProgressIndicator>(R.id.progress)

        tvBadge.text = when {
            !Prefs.protectionOn(this) -> "Protection désactivée"
            s.freeDayActive -> "🎉 Jour libre : pas de limite aujourd'hui"
            s.isFreeDay -> "Jour libre suspendu (heure automatique désactivée)"
            else -> "Limite : ${Format.duration(s.limitMs)} par jour"
        }

        if (s.freeDayActive) {
            tvRemaining.text = "Illimité"
            progress.setProgressCompat(0, true)
        } else {
            tvRemaining.text = if (s.remainingMs > 0) Format.duration(s.remainingMs) else "Temps écoulé"
            val ratio = if (s.limitMs > 0) s.usedMs.toDouble() / s.limitMs else 1.0
            progress.setProgressCompat((ratio.coerceIn(0.0, 1.0) * 1000).toInt(), true)
        }
        tvUsed.text = if (s.usageAccess) {
            "${Format.duration(s.usedMs)} utilisées sur ${Format.duration(s.limitMs)}"
        } else {
            "Active l'accès aux données d'utilisation pour mesurer ton temps."
        }

        val container = findViewById<LinearLayout>(R.id.topApps)
        container.removeAllViews()
        if (top.isEmpty()) {
            val empty = TextView(this)
            empty.text = "Aucune appli comptée pour l'instant aujourd'hui."
            empty.setTextColor(getColor(R.color.text_secondary))
            empty.setPadding(0, 16, 0, 8)
            container.addView(empty)
        }
        val inflater = LayoutInflater.from(this)
        for ((label, icon, ms) in top) {
            val row = inflater.inflate(R.layout.item_app_usage, container, false)
            row.findViewById<ImageView>(R.id.icon).setImageDrawable(icon)
            row.findViewById<TextView>(R.id.name).text = label
            row.findViewById<TextView>(R.id.time).text = Format.duration(ms)
            container.addView(row)
        }
    }
}
