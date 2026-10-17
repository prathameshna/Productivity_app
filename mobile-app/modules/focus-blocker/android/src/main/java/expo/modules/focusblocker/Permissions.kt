package expo.modules.focusblocker

import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import androidx.core.app.NotificationManagerCompat
import org.json.JSONObject

/** Permission states the JS permission gate renders, plus deep links to each settings page. */
object Permissions {

  const val ACCESSIBILITY_SERVICE_FLATTENED = "expo.modules.focusblocker.FocusAccessibilityService"
  const val KIND_USAGE = "usage"
  const val KIND_ACCESSIBILITY = "accessibility"
  const val KIND_OVERLAY = "overlay"
  const val KIND_NOTIFICATIONS = "notifications"
  const val KIND_BATTERY = "battery"

  val orderedKinds = listOf(
    KIND_USAGE,
    KIND_ACCESSIBILITY,
    KIND_OVERLAY,
    KIND_NOTIFICATIONS,
    KIND_BATTERY
  )

  fun statesJson(context: Context): String {
    val json = JSONObject()
    json.put(KIND_USAGE, hasUsageAccess(context))
    json.put(KIND_ACCESSIBILITY, isAccessibilityEnabled(context))
    json.put(KIND_OVERLAY, Settings.canDrawOverlays(context))
    json.put(KIND_NOTIFICATIONS, NotificationManagerCompat.from(context).areNotificationsEnabled())
    json.put(KIND_BATTERY, isIgnoringBatteryOptimizations(context))
    return json.toString()
  }

  fun hasUsageAccess(context: Context): Boolean = try {
    val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
    val mode = appOps.checkOpNoThrow(
      AppOpsManager.OPSTR_GET_USAGE_STATS,
      android.os.Process.myUid(),
      context.packageName
    )
    mode == AppOpsManager.MODE_ALLOWED
  } catch (_: Exception) {
    false
  }

  fun isAccessibilityEnabled(context: Context): Boolean {
    val enabled = Settings.Secure.getString(
      context.contentResolver,
      Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
    ) ?: return false
    val expected = "${context.packageName}/$ACCESSIBILITY_SERVICE_FLATTENED"
    return enabled.split(':').any { component ->
      component.equals(expected, ignoreCase = true) ||
        component.substringAfter('/', "").endsWith("FocusAccessibilityService", ignoreCase = true)
    }
  }

  fun isIgnoringBatteryOptimizations(context: Context): Boolean = try {
    val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
    powerManager.isIgnoringBatteryOptimizations(context.packageName)
  } catch (_: Exception) {
    false
  }

  fun allGranted(context: Context): Boolean = orderedKinds.all { kind ->
    when (kind) {
      KIND_USAGE -> hasUsageAccess(context)
      KIND_ACCESSIBILITY -> isAccessibilityEnabled(context)
      KIND_OVERLAY -> Settings.canDrawOverlays(context)
      KIND_NOTIFICATIONS -> NotificationManagerCompat.from(context).areNotificationsEnabled()
      else -> isIgnoringBatteryOptimizations(context)
    }
  }

  fun firstMissing(context: Context): String? = orderedKinds.firstOrNull { kind ->
    when (kind) {
      KIND_USAGE -> !hasUsageAccess(context)
      KIND_ACCESSIBILITY -> !isAccessibilityEnabled(context)
      KIND_OVERLAY -> !Settings.canDrawOverlays(context)
      KIND_NOTIFICATIONS -> !NotificationManagerCompat.from(context).areNotificationsEnabled()
      else -> !isIgnoringBatteryOptimizations(context)
    }
  }

  /** Opens the exact system settings page for the given permission. */
  fun openSettings(context: Context, kind: String) {
    val packageName = context.packageName
    val primary = when (kind) {
      KIND_USAGE -> Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
      KIND_ACCESSIBILITY -> Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
      KIND_OVERLAY -> Intent(
        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
        Uri.parse("package:$packageName")
      )
      KIND_NOTIFICATIONS ->
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
            .putExtra(Settings.EXTRA_APP_PACKAGE, packageName)
        } else {
          Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:$packageName"))
        }
      KIND_BATTERY -> Intent(
        Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
        Uri.parse("package:$packageName")
      )
      else -> Intent(
        Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
        Uri.parse("package:$packageName")
      )
    }
    startOrFallback(context, primary) {
      when (kind) {
        // Some OEMs refuse the direct battery-exemption request: open the list instead.
        KIND_BATTERY -> Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
        else -> Intent(
          Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
          Uri.parse("package:$packageName")
        )
      }
    }
  }

  private fun startOrFallback(context: Context, primary: Intent, fallback: () -> Intent) {
    primary.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    try {
      context.startActivity(primary)
    } catch (_: Exception) {
      try {
        context.startActivity(fallback().addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
      } catch (_: Exception) {
        // No settings page available on this device; the UI keeps the row unchecked.
      }
    }
  }
}
