package fr.pauseecran

import android.Manifest
import android.app.Activity
import android.app.AppOpsManager
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Process
import android.provider.Settings

/** Vérifie et ouvre les autorisations nécessaires. */
object Perms {

    fun hasUsageAccess(c: Context): Boolean {
        val ops = c.getSystemService(AppOpsManager::class.java) ?: return false
        val mode = if (Build.VERSION.SDK_INT >= 29) {
            ops.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), c.packageName)
        } else {
            @Suppress("DEPRECATION")
            ops.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), c.packageName)
        }
        return if (mode == AppOpsManager.MODE_DEFAULT) {
            c.checkCallingOrSelfPermission(Manifest.permission.PACKAGE_USAGE_STATS) == PackageManager.PERMISSION_GRANTED
        } else {
            mode == AppOpsManager.MODE_ALLOWED
        }
    }

    fun isAccessibilityEnabled(c: Context): Boolean {
        val expected = ComponentName(c, GuardService::class.java)
        val enabled = Settings.Secure.getString(c.contentResolver, Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES)
            ?: return false
        return enabled.split(':').any { ComponentName.unflattenFromString(it) == expected }
    }

    fun adminComponent(c: Context) = ComponentName(c, AdminReceiver::class.java)

    fun isAdminActive(c: Context): Boolean =
        c.getSystemService(DevicePolicyManager::class.java)?.isAdminActive(adminComponent(c)) == true

    fun isAutoTime(c: Context): Boolean =
        Settings.Global.getInt(c.contentResolver, Settings.Global.AUTO_TIME, 1) == 1

    fun hasNotifications(c: Context): Boolean =
        Build.VERSION.SDK_INT < 33 ||
            c.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED

    // --- Ouvrir les bons écrans des Paramètres ---

    fun openUsageAccess(a: Activity) {
        try {
            a.startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS, Uri.parse("package:${a.packageName}")))
        } catch (_: Exception) {
            safeStart(a, Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS))
        }
    }

    fun openAccessibility(a: Activity) = safeStart(a, Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))

    fun requestAdmin(a: Activity) {
        val i = Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN)
            .putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, adminComponent(a))
            .putExtra(DevicePolicyManager.EXTRA_ADD_EXPLANATION, a.getString(R.string.admin_explanation))
        safeStart(a, i)
    }

    fun openDateSettings(a: Activity) = safeStart(a, Intent(Settings.ACTION_DATE_SETTINGS))

    fun openAppDetails(a: Activity) = safeStart(
        a, Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:${a.packageName}"))
    )

    fun requestNotifications(a: Activity) {
        if (Build.VERSION.SDK_INT >= 33) {
            a.requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), 42)
        }
    }

    private fun safeStart(a: Activity, i: Intent) {
        try {
            a.startActivity(i)
        } catch (_: Exception) {
            a.startActivity(Intent(Settings.ACTION_SETTINGS))
        }
    }
}
