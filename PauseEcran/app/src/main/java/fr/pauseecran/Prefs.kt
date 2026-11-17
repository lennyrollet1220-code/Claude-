package fr.pauseecran

import android.content.Context
import android.util.Base64
import java.security.MessageDigest
import java.security.SecureRandom
import java.util.Calendar

/** Résultat d'une vérification de code PIN. */
sealed class PinResult {
    object Ok : PinResult()
    data class Wrong(val attemptsLeft: Int) : PinResult()
    data class Locked(val seconds: Long) : PinResult()
}

/** Tous les réglages de l'appli, enregistrés sur le téléphone. */
object Prefs {
    private const val MAX_ATTEMPTS = 5
    private const val LOCK_MS = 5 * 60_000L

    private fun sp(c: Context) = c.getSharedPreferences("pause_ecran", Context.MODE_PRIVATE)

    // --- Premier lancement ---
    fun isSetupDone(c: Context) = sp(c).getBoolean("setup_done", false)
    fun setSetupDone(c: Context, v: Boolean) = sp(c).edit().putBoolean("setup_done", v).apply()

    // --- Limite quotidienne (en minutes), 90 = 1 h 30 ---
    fun limitMinutes(c: Context) = sp(c).getInt("limit_minutes", 90)
    fun setLimitMinutes(c: Context, v: Int) = sp(c).edit().putInt("limit_minutes", v).apply()

    // --- Applis toujours autorisées ---
    fun hasAllowedList(c: Context) = sp(c).contains("allowed")
    fun allowed(c: Context): Set<String> = sp(c).getStringSet("allowed", null)?.toSet() ?: emptySet()
    fun setAllowed(c: Context, v: Set<String>) = sp(c).edit().putStringSet("allowed", HashSet(v)).apply()

    // --- Jour libre (Calendar.MONDAY..SUNDAY, 0 = aucun), samedi par défaut ---
    fun freeDay(c: Context) = sp(c).getInt("free_day", Calendar.SATURDAY)
    fun setFreeDay(c: Context, v: Int) = sp(c).edit().putInt("free_day", v).apply()

    // --- Protection active ---
    fun protectionOn(c: Context) = sp(c).getBoolean("protection", false)
    fun setProtection(c: Context, v: Boolean) = sp(c).edit().putBoolean("protection", v).apply()

    // --- Déverrouillage temporaire des pages protégées des Paramètres ---
    fun unlockFor(c: Context, minutes: Int) =
        sp(c).edit().putLong("unlock_until", System.currentTimeMillis() + minutes * 60_000L).apply()
    fun isUnlocked(c: Context) = System.currentTimeMillis() < sp(c).getLong("unlock_until", 0L)

    // --- Alerte « plus que 5 minutes » (une fois par jour) ---
    fun warnedDay(c: Context) = sp(c).getInt("warned_day", -1)
    fun setWarnedDay(c: Context, v: Int) = sp(c).edit().putInt("warned_day", v).apply()

    // --- Code PIN (jamais stocké en clair, seulement son empreinte) ---
    fun hasPin(c: Context) = sp(c).contains("pin_hash")

    fun setPin(c: Context, pin: String) {
        val saltBytes = ByteArray(16).also { SecureRandom().nextBytes(it) }
        val salt = Base64.encodeToString(saltBytes, Base64.NO_WRAP)
        sp(c).edit()
            .putString("pin_salt", salt)
            .putString("pin_hash", hash(salt, pin))
            .putInt("pin_fails", 0)
            .putLong("pin_lock_until", 0L)
            .apply()
    }

    fun checkPin(c: Context, pin: String): PinResult {
        val p = sp(c)
        val now = System.currentTimeMillis()
        val lockUntil = p.getLong("pin_lock_until", 0L)
        if (now < lockUntil) return PinResult.Locked((lockUntil - now + 999) / 1000)

        val salt = p.getString("pin_salt", "") ?: ""
        if (hash(salt, pin) == p.getString("pin_hash", null)) {
            p.edit().putInt("pin_fails", 0).apply()
            return PinResult.Ok
        }
        val fails = p.getInt("pin_fails", 0) + 1
        return if (fails >= MAX_ATTEMPTS) {
            p.edit().putInt("pin_fails", 0).putLong("pin_lock_until", now + LOCK_MS).apply()
            PinResult.Locked(LOCK_MS / 1000)
        } else {
            p.edit().putInt("pin_fails", fails).apply()
            PinResult.Wrong(MAX_ATTEMPTS - fails)
        }
    }

    private fun hash(salt: String, pin: String): String =
        MessageDigest.getInstance("SHA-256")
            .digest((salt + pin).toByteArray())
            .joinToString("") { "%02x".format(it) }
}
