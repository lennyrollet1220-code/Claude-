package fr.pauseecran

import android.app.Activity
import androidx.appcompat.app.AlertDialog
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import com.google.android.material.textfield.TextInputEditText
import com.google.android.material.textfield.TextInputLayout

object PinDialog {

    /** Demande le code PIN. onOk est appelé seulement si le code est bon. */
    fun ask(
        a: Activity,
        message: String = "Demande à ta personne de confiance de saisir le code.",
        onCancel: () -> Unit = {},
        onOk: () -> Unit,
    ) {
        val view = a.layoutInflater.inflate(R.layout.dialog_pin, null)
        val input = view.findViewById<TextInputEditText>(R.id.pinInput)
        val layout = view.findViewById<TextInputLayout>(R.id.pinLayout)
        val d = MaterialAlertDialogBuilder(a)
            .setTitle("Code PIN")
            .setMessage(message)
            .setView(view)
            .setPositiveButton("Valider", null)
            .setNegativeButton("Annuler") { _, _ -> onCancel() }
            .setOnCancelListener { onCancel() }
            .create()
        d.setOnShowListener {
            d.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener {
                when (val r = Prefs.checkPin(a, input.text?.toString().orEmpty())) {
                    is PinResult.Ok -> {
                        d.dismiss()
                        onOk()
                    }
                    is PinResult.Wrong -> {
                        layout.error = "Code incorrect (${r.attemptsLeft} essai(s) restant(s))"
                        input.setText("")
                    }
                    is PinResult.Locked -> {
                        layout.error = "Trop d'essais. Réessaie dans ${r.seconds} s."
                        input.setText("")
                    }
                }
            }
        }
        d.show()
    }

    /** Vérifie un nouveau code saisi deux fois. Renvoie le code, ou null (avec message d'erreur affiché). */
    fun validateNew(l1: TextInputLayout, l2: TextInputLayout): String? {
        val p1 = l1.editText?.text?.toString().orEmpty()
        val p2 = l2.editText?.text?.toString().orEmpty()
        l1.error = null
        l2.error = null
        if (p1.length !in 4..8 || !p1.all { it.isDigit() }) {
            l1.error = "4 à 8 chiffres"
            return null
        }
        if (p1 != p2) {
            l2.error = "Les deux codes sont différents"
            return null
        }
        return p1
    }

    /** Choisir un nouveau code (deux fois). */
    fun askNew(a: Activity, onDone: (String) -> Unit) {
        val view = a.layoutInflater.inflate(R.layout.dialog_new_pin, null)
        val l1 = view.findViewById<TextInputLayout>(R.id.pinLayout1)
        val l2 = view.findViewById<TextInputLayout>(R.id.pinLayout2)
        val d = MaterialAlertDialogBuilder(a)
            .setTitle("Nouveau code PIN")
            .setView(view)
            .setPositiveButton("Enregistrer", null)
            .setNegativeButton("Annuler", null)
            .create()
        d.setOnShowListener {
            d.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener {
                validateNew(l1, l2)?.let {
                    d.dismiss()
                    onDone(it)
                }
            }
        }
        d.show()
    }
}
