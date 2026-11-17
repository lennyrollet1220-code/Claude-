package fr.pauseecran

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.TextView
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.button.MaterialButton
import com.google.android.material.textfield.TextInputEditText
import com.google.android.material.textfield.TextInputLayout

/** L'écran gris plein écran. */
class BlockActivity : AppCompatActivity() {

    companion object {
        const val EXTRA_MODE = "mode"
        const val MODE_LIMIT = "limit"          // temps écoulé
        const val MODE_PROTECTED = "protected"  // page des Paramètres protégée par le PIN
    }

    private lateinit var pinLayout: TextInputLayout
    private lateinit var pinInput: TextInputEditText

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_block)
        pinLayout = findViewById(R.id.pinLayout)
        pinInput = findViewById(R.id.pinInput)

        findViewById<MaterialButton>(R.id.btnHome).setOnClickListener { goHome() }
        findViewById<MaterialButton>(R.id.btnUnlock).setOnClickListener { tryUnlock() }
        // Le bouton Retour du téléphone renvoie aussi à l'accueil.
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() = goHome()
        })
        render(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        render(intent)
    }

    private fun render(i: Intent) {
        val isProtected = i.getStringExtra(EXTRA_MODE) == MODE_PROTECTED
        val emoji = findViewById<TextView>(R.id.emoji)
        val message = findViewById<TextView>(R.id.message)
        val detail = findViewById<TextView>(R.id.detail)
        val pinVisibility = if (isProtected) View.VISIBLE else View.GONE
        pinLayout.visibility = pinVisibility
        findViewById<View>(R.id.btnUnlock).visibility = pinVisibility
        pinLayout.error = null
        pinInput.setText("")

        if (isProtected) {
            emoji.text = "🔒"
            message.text = "Page protégée"
            detail.text = "Cette page des Paramètres concerne Pause Écran.\nLe code PIN de ta personne de confiance est nécessaire."
        } else {
            emoji.text = "⏳"
            message.text = getString(R.string.block_message)
            detail.text = when {
                !Perms.hasUsageAccess(this) ->
                    "L'accès aux données d'utilisation a été retiré : le temps ne peut plus être mesuré."
                !Perms.isAutoTime(this) ->
                    "La date et l'heure automatiques sont désactivées. Réactive-les pour débloquer."
                else -> "Tu as utilisé tes ${Format.duration(Prefs.limitMinutes(this) * 60_000L)} d'aujourd'hui. À demain !"
            }
        }
    }

    private fun tryUnlock() {
        when (val r = Prefs.checkPin(this, pinInput.text?.toString().orEmpty())) {
            is PinResult.Ok -> {
                Prefs.unlockFor(this, 10)
                finish() // on revient sur la page des Paramètres
            }
            is PinResult.Wrong -> {
                pinLayout.error = "Code incorrect (${r.attemptsLeft} essai(s) restant(s))"
                pinInput.setText("")
            }
            is PinResult.Locked -> {
                pinLayout.error = "Trop d'essais. Réessaie dans ${r.seconds} s."
                pinInput.setText("")
            }
        }
    }

    private fun goHome() {
        startActivity(
            Intent(Intent.ACTION_MAIN)
                .addCategory(Intent.CATEGORY_HOME)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        )
        finish()
    }

    override fun onStop() {
        super.onStop()
        if (!isChangingConfigurations) finish()
    }
}
