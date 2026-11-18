package fr.pauseecran

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.os.Handler
import android.os.HandlerThread
import android.os.Looper
import android.os.PowerManager
import android.os.SystemClock
import android.provider.Settings
import android.view.accessibility.AccessibilityEvent
import android.view.inputmethod.InputMethodManager
import java.util.Calendar

/**
 * Le « gardien » : Android le prévient à chaque changement d'appli à l'écran.
 * - Si le temps est écoulé et que l'appli n'est pas autorisée -> écran gris.
 * - Si on ouvre une page des Paramètres qui concerne Pause Écran -> code PIN demandé.
 * Android relance ce service tout seul après un redémarrage du téléphone.
 */
class GuardService : AccessibilityService() {

    private val main = Handler(Looper.getMainLooper())
    private val workerThread = HandlerThread("pause-ecran-guard")
    private lateinit var worker: Handler

    @Volatile private var currentPkg: String? = null
    @Volatile private var lastBlockAt = 0L
    private var lastSettingsScan = 0L
    private val ignored = HashSet<String>()
    private var appLabel = ""

    private val periodicCheck = Runnable { checkLimit() }

    override fun onCreate() {
        super.onCreate()
        workerThread.start()
        worker = Handler(workerThread.looper)
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        appLabel = getString(R.string.app_name)
        refreshIgnored()
        Notif.cancelProtectionOff(this)
    }

    /** Clavier et barre de notifications : on ne les considère pas comme « l'appli ouverte ». */
    private fun refreshIgnored() {
        ignored.clear()
        ignored += "com.android.systemui"
        try {
            getSystemService(InputMethodManager::class.java)?.enabledInputMethodList?.forEach {
                ignored += it.packageName
            }
        } catch (_: Exception) { }
    }

    /** Le clavier n'est jamais « l'appli ouverte » : on ne le bloque jamais. */
    private fun isKeyboard(pkg: String, e: AccessibilityEvent): Boolean {
        val cls = e.className?.toString().orEmpty()
        if (cls.contains("inputmethod", ignoreCase = true)) return true
        val defaultIme = try {
            Settings.Secure.getString(contentResolver, Settings.Secure.DEFAULT_INPUT_METHOD)
        } catch (_: Exception) {
            null
        }
        if (defaultIme != null && pkg == defaultIme.substringBefore('/')) return true
        return false
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        val e = event ?: return
        val pkg = e.packageName?.toString() ?: return
        when (e.eventType) {
            AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED -> {
                if (pkg in ignored || isKeyboard(pkg, e)) return
                currentPkg = pkg
                if (guardSettings(pkg, force = true)) return
                worker.removeCallbacks(periodicCheck)
                worker.post(periodicCheck)
            }
            AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED -> {
                if (pkg in AppRules.PROTECTED_PACKAGES) guardSettings(pkg, force = false)
            }
        }
    }

    /** Bloque les pages des Paramètres qui affichent « Pause Écran » (infos appli, accessibilité, admin…). */
    private fun guardSettings(pkg: String, force: Boolean): Boolean {
        if (pkg !in AppRules.PROTECTED_PACKAGES) return false
        if (!Prefs.isSetupDone(this) || !Prefs.protectionOn(this) || Prefs.isUnlocked(this)) return false
        // Tant que l'installation n'est pas finie (autorisations manquantes), on laisse les Paramètres libres.
        if (!Perms.hasUsageAccess(this) || !Perms.isAdminActive(this)) return false
        // L'écran PIN est déjà affiché : on ne le relance pas (sinon le code tapé s'efface).
        if (BlockActivity.visibleMode == BlockActivity.MODE_PROTECTED) return true
        val now = SystemClock.uptimeMillis()
        if (!force && now - lastSettingsScan < 400) return false
        lastSettingsScan = now

        val root = rootInActiveWindow ?: return false
        val found = try {
            root.packageName?.toString() == pkg &&
                root.findAccessibilityNodeInfosByText(appLabel).isNotEmpty()
        } catch (_: Exception) {
            false
        }
        if (found) {
            showBlock(BlockActivity.MODE_PROTECTED)
            return true
        }
        return false
    }

    /** Vérifie la limite (exécuté en arrière-plan pour ne pas ralentir le téléphone). */
    private fun checkLimit() {
        worker.removeCallbacks(periodicCheck)
        val pkg = currentPkg ?: return
        if (!Prefs.isSetupDone(this) || !Prefs.protectionOn(this)) return
        if (AppRules.isExempt(this, pkg)) return

        val s = Limits.status(this)
        if (Limits.shouldBlock(this, s)) {
            showBlock(BlockActivity.MODE_LIMIT)
            worker.postDelayed(periodicCheck, 3_000L) // re-vérifie au cas où
            return
        }
        if (s.freeDayActive) return

        maybeWarn(s)
        val interactive = getSystemService(PowerManager::class.java)?.isInteractive ?: true
        val delay = if (!interactive) 60_000L else s.remainingMs.coerceIn(2_000L, 30_000L)
        worker.postDelayed(periodicCheck, delay)
    }

    private fun maybeWarn(s: DayStatus) {
        if (s.remainingMs > 5 * 60_000L || s.remainingMs <= 0L) return
        val today = Calendar.getInstance().get(Calendar.DAY_OF_YEAR)
        if (Prefs.warnedDay(this) == today) return
        Prefs.setWarnedDay(this, today)
        Notif.fiveMinutesLeft(this)
    }

    private fun showBlock(mode: String) {
        val now = SystemClock.uptimeMillis()
        if (now - lastBlockAt < 700) return
        lastBlockAt = now
        val i = Intent(this, BlockActivity::class.java)
            .putExtra(BlockActivity.EXTRA_MODE, mode)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        main.post {
            try {
                startActivity(i)
            } catch (_: Exception) { }
        }
    }

    override fun onInterrupt() {}

    override fun onDestroy() {
        worker.removeCallbacksAndMessages(null)
        workerThread.quitSafely()
        super.onDestroy()
    }
}
