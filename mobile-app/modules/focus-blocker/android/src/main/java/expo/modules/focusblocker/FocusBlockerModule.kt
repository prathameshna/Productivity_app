package expo.modules.focusblocker

import android.os.Handler
import android.os.Looper
import android.content.Intent
import android.os.Build
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.json.JSONArray

/**
 * JS <-> native surface for the Focus feature.
 * Every function degrades to an empty/no-op result when the React context is gone,
 * so nothing in JS can crash when the app is backgrounded.
 */
class FocusBlockerModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("FocusBlocker")

    AsyncFunction("getInstalledApps") {
      val context = appContext.reactContext ?: return@AsyncFunction "[]"
      AppRepository.installedAppsJson(context)
    }

    AsyncFunction("getAppIcon") { packageName: String ->
      val context = appContext.reactContext ?: return@AsyncFunction ""
      if (packageName.isBlank()) "" else AppRepository.iconBase64(context, packageName) ?: ""
    }

    AsyncFunction("getUsageToday") { packagesJson: String ->
      val context = appContext.reactContext ?: return@AsyncFunction "{}"
      UsageRepository.todaySecondsJson(context, parsePackages(packagesJson))
    }

    AsyncFunction("getUsageTodayMs") { packagesJson: String ->
      val context = appContext.reactContext ?: return@AsyncFunction "{}"
      UsageRepository.todayMillisJson(context, parsePackages(packagesJson))
    }

    AsyncFunction("hasUsageAccess") {
      val context = appContext.reactContext ?: return@AsyncFunction false
      Permissions.hasUsageAccess(context)
    }

    AsyncFunction("openUsageAccessSettings") {
      val context = appContext.reactContext ?: return@AsyncFunction null
      Permissions.openSettings(context, Permissions.KIND_USAGE)
    }

    AsyncFunction("getUsage7dAverages") { packagesJson: String ->
      val context = appContext.reactContext ?: return@AsyncFunction "{}"
      UsageRepository.previous7DayAverageSecondsJson(context, parsePackages(packagesJson))
    }

    AsyncFunction("getPermissionStates") {
      val context = appContext.reactContext ?: return@AsyncFunction "{}"
      Permissions.statesJson(context)
    }

    AsyncFunction("openPermissionSettings") { kind: String ->
      val context = appContext.reactContext ?: return@AsyncFunction null
      Handler(Looper.getMainLooper()).post {
        Permissions.openSettings(context, kind)
      }
    }

    AsyncFunction("getNativeCounters") {
      val context = appContext.reactContext ?: return@AsyncFunction "{}"
      RulesStore.countersJson(context)
    }

    AsyncFunction("clearIconCache") {
      val context = appContext.reactContext ?: return@AsyncFunction null
      AppRepository.clearIconCache(context)
    }

    // Synchronous on purpose: rules must be committed to memory before JS continues,
    // even if the process is killed right after a state change.
    Function("syncRules") { json: String ->
      val context = appContext.reactContext
      if (context != null && json.isNotBlank()) {
        try {
          RulesStore.writeRules(context, json)
        } catch (_: Exception) {
          return@Function false
        }
        val hasEnabledApps = RulesStore.rules(context)?.apps?.any { it.enabled } == true
        if (hasEnabledApps) FocusWatcherService.start(context)
        else context.stopService(Intent(context, FocusWatcherService::class.java))
      }
      context != null
    }
  }

  private fun parsePackages(packagesJson: String): List<String> {
    return try {
      val array = JSONArray(packagesJson)
      val out = mutableListOf<String>()
      for (index in 0 until array.length()) {
        val pkg = array.optString(index)
        if (!pkg.isNullOrEmpty()) out.add(pkg)
      }
      out
    } catch (_: Exception) {
      emptyList()
    }
  }
}
