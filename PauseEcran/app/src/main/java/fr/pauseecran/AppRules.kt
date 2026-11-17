package fr.pauseecran

import android.content.Context
import android.content.Intent
import android.graphics.drawable.Drawable
import android.provider.Telephony
import android.telecom.TelecomManager
import java.text.Normalizer

data class AppEntry(val pkg: String, val label: String)

/** Quelles applis sont autorisées, protégées, etc. */
object AppRules {

    /** Paramètres Android et écrans de désinstallation : jamais comptés, mais certaines pages sont protégées. */
    val PROTECTED_PACKAGES = setOf(
        "com.android.settings",
        "com.google.android.packageinstaller",
        "com.android.packageinstaller",
        "com.samsung.android.packageinstaller",
        "com.google.android.permissioncontroller",
        "com.android.permissioncontroller",
        "com.miui.securitycenter",
    )

    /** Éléments du système qui ne doivent jamais être bloqués (appels d'urgence, barre système…). */
    private val SYSTEM_EXEMPT = setOf(
        "android",
        "com.android.systemui",
        "com.android.phone",
        "com.android.server.telecom",
        "com.android.emergency",
        "com.google.android.apps.safetyhub",
    )

    /** Paquets connus des applis demandées (présélection au premier lancement). */
    private val KNOWN_DEFAULTS = setOf(
        "com.whatsapp", "com.whatsapp.w4b",
        "com.google.android.gm",
        "com.google.android.dialer", "com.android.dialer", "com.samsung.android.dialer",
        "com.google.android.apps.messaging", "com.samsung.android.messaging",
        "com.android.mms", "com.android.messaging",
        "com.google.android.deskclock", "com.android.deskclock", "com.sec.android.app.clockpackage",
        "com.google.android.GoogleCamera", "com.android.camera", "com.android.camera2",
        "com.sec.android.app.camera",
    )
    private val DEFAULT_EXACT_LABELS = setOf(
        "telephone", "phone", "messages", "horloge", "clock",
        "appareil photo", "camera", "gmail", "whatsapp",
    )
    private val DEFAULT_LABEL_PARTS = listOf("whatsapp", "ecole directe", "ecoledirecte", "ecole-directe")

    @Volatile private var launchersCache: Set<String>? = null

    /** Les écrans d'accueil (launchers) installés. */
    fun launchers(c: Context): Set<String> {
        launchersCache?.let { return it }
        val intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME)
        @Suppress("DEPRECATION")
        val set = c.packageManager.queryIntentActivities(intent, 0)
            .map { it.activityInfo.packageName }.toSet()
        launchersCache = set
        return set
    }

    /** true si cette appli n'est jamais bloquée et ne compte pas dans le temps. */
    fun isExempt(c: Context, pkg: String): Boolean =
        pkg == c.packageName ||
            pkg in SYSTEM_EXEMPT ||
            pkg in PROTECTED_PACKAGES ||
            pkg in launchers(c) ||
            pkg in Prefs.allowed(c)

    /** Toutes les applis visibles dans le tiroir d'applis. */
    fun launchableApps(c: Context): List<AppEntry> {
        val pm = c.packageManager
        val intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
        @Suppress("DEPRECATION")
        return pm.queryIntentActivities(intent, 0)
            .map { AppEntry(it.activityInfo.packageName, it.loadLabel(pm).toString()) }
            .filter { it.pkg != c.packageName }
            .distinctBy { it.pkg }
            .sortedBy { normalize(it.label) }
    }

    /** Présélection : WhatsApp, École Directe, Gmail, Téléphone, Messages, Horloge, Appareil photo. */
    fun defaultAllowed(c: Context, apps: List<AppEntry>): Set<String> {
        val result = HashSet<String>()
        for (app in apps) {
            val l = normalize(app.label)
            if (app.pkg in KNOWN_DEFAULTS || l in DEFAULT_EXACT_LABELS || DEFAULT_LABEL_PARTS.any { l.contains(it) }) {
                result += app.pkg
            }
        }
        try {
            c.getSystemService(TelecomManager::class.java)?.defaultDialerPackage?.let { result += it }
        } catch (_: Exception) { }
        try {
            Telephony.Sms.getDefaultSmsPackage(c)?.let { result += it }
        } catch (_: Exception) { }
        return result
    }

    fun label(c: Context, pkg: String): String = try {
        val pm = c.packageManager
        pm.getApplicationLabel(pm.getApplicationInfo(pkg, 0)).toString()
    } catch (_: Exception) {
        pkg
    }

    fun icon(c: Context, pkg: String): Drawable? = try {
        c.packageManager.getApplicationIcon(pkg)
    } catch (_: Exception) {
        null
    }

    fun normalize(s: String): String =
        Normalizer.normalize(s, Normalizer.Form.NFD)
            .replace(Regex("\\p{M}+"), "")
            .lowercase()
            .trim()
}
