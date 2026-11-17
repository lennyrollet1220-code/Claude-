package fr.pauseecran

import android.app.admin.DevicePolicyManager
import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import android.view.View
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.material.materialswitch.MaterialSwitch

/** Réglages : accessibles uniquement avec le code PIN. */
class SettingsActivity : AppCompatActivity() {

    private var openingChild = false
    private lateinit var switch: MaterialSwitch

    private val pickApps = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) {
        refresh()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_settings)
        switch = findViewById(R.id.switchProtection)

        PinDialog.ask(this, onCancel = { finish() }) {
            findViewById<View>(R.id.content).visibility = View.VISIBLE
            refresh()
        }

        findViewById<View>(R.id.rowLimit).setOnClickListener {
            Pickers.limit(this, Prefs.limitMinutes(this)) {
                Prefs.setLimitMinutes(this, it)
                refresh()
            }
        }
        findViewById<View>(R.id.rowAllowed).setOnClickListener {
            openingChild = true
            pickApps.launch(Intent(this, AppPickerActivity::class.java))
        }
        findViewById<View>(R.id.rowFreeDay).setOnClickListener {
            Pickers.day(this, Prefs.freeDay(this)) {
                Prefs.setFreeDay(this, it)
                refresh()
            }
        }
        findViewById<View>(R.id.rowPin).setOnClickListener {
            PinDialog.askNew(this) {
                Prefs.setPin(this, it)
                Toast.makeText(this, "Nouveau code enregistré", Toast.LENGTH_SHORT).show()
            }
        }
        findViewById<View>(R.id.rowUnlock).setOnClickListener {
            Prefs.unlockFor(this, 10)
            Toast.makeText(this, "Paramètres déverrouillés pendant 10 minutes", Toast.LENGTH_LONG).show()
            startActivity(Intent(Settings.ACTION_SETTINGS))
        }
        findViewById<View>(R.id.rowUninstall).setOnClickListener { confirmUninstall() }
    }

    override fun onResume() {
        super.onResume()
        openingChild = false
    }

    override fun onStop() {
        super.onStop()
        // Si on quitte les réglages, il faudra redonner le PIN.
        if (!isChangingConfigurations && !openingChild) finish()
    }

    private fun refresh() {
        findViewById<TextView>(R.id.tvLimit).text = Format.duration(Prefs.limitMinutes(this) * 60_000L) + " par jour"
        findViewById<TextView>(R.id.tvAllowed).text = "${Prefs.allowed(this).size} appli(s)"
        findViewById<TextView>(R.id.tvFreeDay).text = Format.dayName(Prefs.freeDay(this))
        switch.setOnCheckedChangeListener(null)
        switch.isChecked = Prefs.protectionOn(this)
        switch.setOnCheckedChangeListener { _, checked -> Prefs.setProtection(this, checked) }
    }

    private fun confirmUninstall() {
        MaterialAlertDialogBuilder(this)
            .setTitle("Préparer la désinstallation ?")
            .setMessage("La protection sera coupée et l'administrateur retiré. La page de l'appli va s'ouvrir : touche « Désinstaller ».")
            .setPositiveButton("Continuer") { _, _ ->
                try {
                    getSystemService(DevicePolicyManager::class.java)
                        ?.removeActiveAdmin(Perms.adminComponent(this))
                } catch (_: Exception) { }
                Prefs.setProtection(this, false)
                Prefs.unlockFor(this, 30)
                refresh()
                Perms.openAppDetails(this)
            }
            .setNegativeButton("Annuler", null)
            .show()
    }
}
