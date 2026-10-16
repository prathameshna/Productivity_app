package expo.modules.focusblocker

import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.Looper
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

    AsyncFunction("getUsage7dAverages") { packagesJson: String ->
      val context = appContext.reactContext ?: return@AsyncFunction "{}"
      UsageRepository.previous7DayAverageSecondsJson(context, parsePackages(packagesJson))
    }

    AsyncFunction("getPermissionStates") {
      val context = appContext.reactContext ?: return@AsyncFunction "{}"
      Permissions.statesJson(context)
    }

    AsyncFunction("openPermissionSettings") { kind: String ->
      val context = appContext.reactContext ?: return@AsyncFunction
      Handler(Looper.getMainLooper()).post {
        Permissions.openSettings(context, kind)
      }
    }

    AsyncFunction("getNativeCounters") {
      val context = appContext.reactContext ?: return@AsyncFunction "{}"
      RulesStore.countersJson(context)
    }

    AsyncFunction("clearIconCache") {
      val context = appContext.reactContext ?: return@AsyncFunction
      AppRepository.clearIconCache(context)
    }

    // Synchronous on purpose: rules must be committed to memory before JS continues,
    // even if the process is killed right after a state change.
    Function("syncRules") { json: String ->
      val context = appContext.reactContext
      if (context != null && json.isNotBlank()) {
        RulesStore.writeRules(context, json)
        val watcherIntent = Intent(context, FocusWatcherService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          context.startForegroundService(watcherIntent)
        } else {
          context.startService(watcherIntent)
        }
      }
      true
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
