package fr.pauseecran

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.view.inputmethod.InputMethodManager
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.ViewFlipper
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.button.MaterialButton
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.material.textfield.TextInputLayout

/** Premier lancement : PIN, applis autorisées, jour libre, autorisations. */
class SetupActivity : AppCompatActivity() {

    private lateinit var flipper: ViewFlipper
    private lateinit var btnNext: MaterialButton
    private lateinit var btnBack: MaterialButton
    private lateinit var tvStep: TextView

    private val pickApps = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) {
        updateAllowedSummary()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_setup)
        flipper = findViewById(R.id.flipper)
        btnNext = findViewById(R.id.btnNext)
        btnBack = findViewById(R.id.btnBack)
        tvStep = findViewById(R.id.tvStep)

        btnNext.setOnClickListener { next() }
        btnBack.setOnClickListener { goTo(flipper.displayedChild - 1) }
        findViewById<MaterialButton>(R.id.btnPickApps).setOnClickListener {
            pickApps.launch(Intent(this, AppPickerActivity::class.java))
        }
        findViewById<MaterialButton>(R.id.btnFreeDay).setOnClickListener {
            Pickers.day(this, Prefs.freeDay(this)) {
                Prefs.setFreeDay(this, it)
                updateFreeDay()
            }
        }
        findViewById<MaterialButton>(R.id.btnAppInfo).setOnClickListener { Perms.openAppDetails(this) }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (flipper.displayedChild > 0) goTo(flipper.displayedChild - 1) else finish()
            }
        })

        // Présélection des applis autorisées.
        if (!Prefs.hasAllowedList(this)) {
            Thread {
                val apps = AppRules.launchableApps(this)
                Prefs.setAllowed(this, AppRules.defaultAllowed(this, apps))
                runOnUiThread { updateAllowedSummary() }
            }.start()
        }
        goTo(0)
    }

    override fun onResume() {
        super.onResume()
        if (flipper.displayedChild == 3) renderChecks()
    }

    private fun goTo(i: Int) {
        if (i < 0 || i > 3) return
        flipper.displayedChild = i
        tvStep.text = "Étape ${i + 1} sur 4"
        btnBack.visibility = if (i > 0) View.VISIBLE else View.INVISIBLE
        btnNext.text = if (i == 3) "Terminer" else "Suivant"
        when (i) {
            1 -> updateAllowedSummary()
            2 -> updateFreeDay()
            3 -> renderChecks()
        }
    }

    private fun next() {
        when (flipper.displayedChild) {
            0 -> {
                val pin = PinDialog.validateNew(
                    findViewById<TextInputLayout>(R.id.pinLayout1),
                    findViewById<TextInputLayout>(R.id.pinLayout2),
                ) ?: return
                Prefs.setPin(this, pin)
                currentFocus?.let {
                    getSystemService(InputMethodManager::class.java)?.hideSoftInputFromWindow(it.windowToken, 0)
                }
                goTo(1)
            }
            1, 2 -> goTo(flipper.displayedChild + 1)
            3 -> finishSetup()
        }
    }

    private fun updateAllowedSummary() {
        val allowed = Prefs.allowed(this)
        val names = allowed.map { AppRules.label(this, it) }.sorted()
        findViewById<TextView>(R.id.tvAllowedSummary).text =
            if (names.isEmpty()) "Aucune appli sélectionnée pour l'instant."
            else "${names.size} appli(s) autorisée(s) :\n" + names.joinToString(", ")
    }

    private fun updateFreeDay() {
        findViewById<TextView>(R.id.tvFreeDay).text = "Jour libre : ${Format.dayName(Prefs.freeDay(this))}"
    }

    private fun renderChecks() {
        Checks.render(findViewById<LinearLayout>(R.id.checks), Checks.standard(this) { it() })
    }

    private fun finishSetup() {
        if (!Perms.hasUsageAccess(this) || !Perms.isAccessibilityEnabled(this)) {
            MaterialAlertDialogBuilder(this)
                .setTitle("Autorisations manquantes")
                .setMessage("Sans l'accès aux données d'utilisation et le service d'accessibilité, Pause Écran ne peut rien bloquer. Terminer quand même ?")
                .setPositiveButton("Terminer") { _, _ -> complete() }
                .setNegativeButton("Revenir", null)
                .show()
        } else {
            complete()
        }
    }

    private fun complete() {
        Prefs.setProtection(this, true)
        Prefs.setSetupDone(this, true)
        startActivity(
            Intent(this, MainActivity::class.java)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
        )
        finish()
    }
}
