package expo.modules.focusblocker

import android.annotation.SuppressLint
import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

/** A single blocked app configuration, mirrored from the JavaScript focusState. */
data class AppRule(
  val packageName: String,
  val label: String,
  val dailyLimitMin: Int,
  val emergencyTotal: Int,
  val enabled: Boolean,
  val strict: Boolean,
  val blockedFeatures: List<String>,
  val remindEnabled: Boolean,
  val remindMin: Int
)

data class SiteRule(
  val domain: String,
  val dailyLimitMin: Int,
  val strict: Boolean,
  val enabled: Boolean
)

/** Detection hints for one blockable in-app feature (e.g. YouTube Shorts). */
data class FeatureHint(
  val id: String,
  val label: String,
  val resourceIds: List<String>,
  val texts: List<String>
)

data class FocusRules(
  val apps: List<AppRule>,
  val sites: List<SiteRule>,
  val features: Map<String, List<FeatureHint>>,
  val browsers: Map<String, List<String>>
)

/**
 * Native source of truth while the JavaScript bundle is not running.
 * The JS focusState mirrors itself into here (SharedPreferences) on every change;
 * the accessibility service and watcher only ever read from here.
 */
object RulesStore {
  private const val FILE = "focus_blocker"
  private const val KEY_RULES = "rules_json"
  private const val KEY_DATE = "counters_date"
  private const val KEY_BLOCKS = "blocks_fired"
  private const val KEY_EMERGENCY = "emergency_used"
  private const val KEY_GRACE_PREFIX = "grace_"
  private const val KEY_REMINDED_PREFIX = "reminded_"

  @Volatile
  private var cachedRaw: String? = null
  @Volatile
  private var cachedRules: FocusRules? = null

  fun prefs(context: Context): SharedPreferences =
    context.applicationContext.getSharedPreferences(FILE, Context.MODE_PRIVATE)

  fun today(): String {
    val format = SimpleDateFormat("yyyy-MM-dd", Locale.US)
    format.timeZone = TimeZone.getDefault()
    return format.format(Date())
  }

  /**
   * Rolls the daily counters over at local midnight. Called on every read/write, from
   * BOOT_COMPLETED, TIMEZONE_CHANGED and TIME_SET, so restarts and clock changes are covered.
   */
  @Synchronized
  fun ensureToday(context: Context) {
    val prefs = prefs(context)
    val today = today()
    if (prefs.getString(KEY_DATE, null) == today) return
    val editor = prefs.edit()
      .putString(KEY_DATE, today)
      .putInt(KEY_BLOCKS, 0)
      .putString(KEY_EMERGENCY, "{}")
    for (key in prefs.all.keys) {
      if (key.startsWith(KEY_GRACE_PREFIX) || key.startsWith(KEY_REMINDED_PREFIX)) {
        editor.remove(key)
      }
    }
    check(editor.commit()) { "Unable to durably write Focus rules." }
  }

  /** Persists the rules JSON written by JS. Never drops native counters for the same day. */
  @Synchronized
  fun writeRules(context: Context, json: String) {
    ensureToday(context)
    val prefs = prefs(context)
    val editor = prefs.edit().putString(KEY_RULES, json)
    try {
      val root = JSONObject(json)
      val counters = root.optJSONObject("counters")
      if (counters != null && counters.optString("date") == today()) {
        val nativeEmergency = JSONObject(prefs.getString(KEY_EMERGENCY, "{}") ?: "{}")
        val jsBlocks = counters.optInt("blocksFiredToday", 0)
        editor.putInt(KEY_BLOCKS, maxOf(prefs.getInt(KEY_BLOCKS, 0), jsBlocks))
        val apps = root.optJSONArray("apps")
        if (apps != null) {
          for (index in 0 until apps.length()) {
            val app = apps.optJSONObject(index) ?: continue
            val pkg = app.optString("packageName")
            if (pkg.isNullOrEmpty()) continue
            val jsUsed = app.optInt("emergencyUsedToday", 0)
            nativeEmergency.put(pkg, maxOf(nativeEmergency.optInt(pkg, 0), jsUsed))
          }
          editor.putString(KEY_EMERGENCY, nativeEmergency.toString())
        }
      }
    } catch (_: Exception) {
      // Malformed payload: keep whatever counters native already has.
    }
    editor.commit()
    cachedRaw = null
    cachedRules = null
  }

  fun readRaw(context: Context): String? = prefs(context).getString(KEY_RULES, null)

  @Synchronized
  fun removeUninstalledApp(context: Context, packageName: String) {
    val raw = readRaw(context) ?: return
    try {
      val root = JSONObject(raw)
      val apps = root.optJSONArray("apps") ?: return
      val remaining = JSONArray()
      for (index in 0 until apps.length()) {
        val app = apps.optJSONObject(index) ?: continue
        if (app.optString("packageName") != packageName) remaining.put(app)
      }
      root.put("apps", remaining)
      writeRules(context, root.toString())
    } catch (_: Exception) {
      // Invalid saved data is left for the next successful JS rule sync to replace.
    }
  }

  fun rules(context: Context): FocusRules? {
    ensureToday(context)
    val raw = readRaw(context) ?: return null
    val cached = cachedRules
    if (cached != null && cachedRaw == raw) return cached
    val parsed = parse(raw) ?: return null
    cachedRaw = raw
    cachedRules = parsed
    return parsed
  }

  fun appRule(context: Context, packageName: String): AppRule? =
    rules(context)?.apps?.firstOrNull { it.packageName == packageName }

  // --- Daily counters -------------------------------------------------------

  fun blocksFired(context: Context): Int {
    ensureToday(context)
    return prefs(context).getInt(KEY_BLOCKS, 0)
  }

  fun incrementBlocksFired(context: Context): Int {
    ensureToday(context)
    val prefs = prefs(context)
    val next = prefs.getInt(KEY_BLOCKS, 0) + 1
      prefs.edit().putInt(KEY_BLOCKS, next).apply()
    return next
  }

  fun emergencyUsed(context: Context, packageName: String): Int {
    ensureToday(context)
    val value = try {
      JSONObject(prefs(context).getString(KEY_EMERGENCY, "{}") ?: "{}").optInt(packageName, 0)
    } catch (_: Exception) {
      0
    }
    return value
  }

  fun useEmergencyPass(context: Context, packageName: String): Int {
    ensureToday(context)
    val prefs = prefs(context)
    val used = emergencyUsed(context, packageName) + 1
    try {
      val json = JSONObject(prefs.getString(KEY_EMERGENCY, "{}") ?: "{}")
      json.put(packageName, used)
      check(prefs.edit().putString(KEY_EMERGENCY, json.toString()).commit())
    } catch (_: Exception) {
      // Ignore: counter stays at previous value.
    }
    return used
  }

  /** How many milliseconds of the 5 minute emergency window are left (0 when inactive). */
  fun graceRemaining(context: Context, packageName: String): Long {
    ensureToday(context)
    val deadline = prefs(context).getLong(KEY_GRACE_PREFIX + packageName, 0L)
    return maxOf(0L, deadline - System.currentTimeMillis())
  }

  fun setGrace(context: Context, packageName: String, durationMs: Long) {
    ensureToday(context)
    prefs(context).edit()
      .putLong(KEY_GRACE_PREFIX + packageName, System.currentTimeMillis() + durationMs)
      .commit()
  }

  /** Returns true the first time a reminder key is claimed for the given day. */
  fun claimReminder(context: Context, packageName: String): Boolean {
    ensureToday(context)
    val key = KEY_REMINDED_PREFIX + today() + "_" + packageName
    val prefs = prefs(context)
    if (prefs.getBoolean(key, false)) return false
    prefs.edit().putBoolean(key, true).commit()
    return true
  }

  fun releaseReminder(context: Context, packageName: String) {
    val key = KEY_REMINDED_PREFIX + today() + "_" + packageName
    prefs(context).edit().remove(key).commit()
  }

  /** Counters the JS layer needs so its UI matches what happened while it was closed. */
  fun countersJson(context: Context): String {
    ensureToday(context)
    val root = JSONObject()
    root.put("date", today())
    root.put("blocksFired", blocksFired(context))
    root.put("emergencyUsed", JSONObject(prefs(context).getString(KEY_EMERGENCY, "{}") ?: "{}"))
    return root.toString()
  }

  // --- Parsing --------------------------------------------------------------

  private fun parse(raw: String): FocusRules? = try {
    val root = JSONObject(raw)
    val apps = mutableListOf<AppRule>()
    val appsArray = root.optJSONArray("apps") ?: JSONArray()
    for (index in 0 until appsArray.length()) {
      val item = appsArray.optJSONObject(index) ?: continue
      val pkg = item.optString("packageName")
      if (pkg.isNullOrEmpty()) continue
      apps.add(
        AppRule(
          packageName = pkg,
          label = item.optString("label", pkg),
          dailyLimitMin = item.optInt("dailyLimitMin", 60),
          emergencyTotal = item.optInt("emergencyTotal", 2),
          enabled = item.optBoolean("enabled", true),
          strict = item.optBoolean("strict", false),
          blockedFeatures = stringList(item.optJSONArray("blockedFeatures")),
          remindEnabled = item.optBoolean("remindEnabled", false),
          remindMin = item.optInt("remindMin", 10)
        )
      )
    }

    val sites = mutableListOf<SiteRule>()
    val sitesArray = root.optJSONArray("sites") ?: JSONArray()
    for (index in 0 until sitesArray.length()) {
      val item = sitesArray.optJSONObject(index) ?: continue
      val domain = item.optString("domain")
      if (domain.isNullOrEmpty()) continue
      sites.add(
        SiteRule(
          domain = domain,
          dailyLimitMin = item.optInt("dailyLimitMin", 60),
          strict = item.optBoolean("strict", false),
          enabled = item.optBoolean("enabled", true)
        )
      )
    }

    val features = mutableMapOf<String, List<FeatureHint>>()
    val featuresObject = root.optJSONObject("features")
    if (featuresObject != null) {
      for (pkg in featuresObject.keys()) {
        val list = featuresObject.optJSONArray(pkg) ?: continue
        val hints = mutableListOf<FeatureHint>()
        for (index in 0 until list.length()) {
          val hint = list.optJSONObject(index) ?: continue
          hints.add(
            FeatureHint(
              id = hint.optString("id"),
              label = hint.optString("label"),
              resourceIds = stringList(hint.optJSONArray("resourceIds")),
              texts = stringList(hint.optJSONArray("texts"))
            )
          )
        }
        features[pkg] = hints
      }
    }

    val browsers = mutableMapOf<String, List<String>>()
    val browsersObject = root.optJSONObject("browsers")
    if (browsersObject != null) {
      for (pkg in browsersObject.keys()) {
        browsers[pkg] = stringList(browsersObject.optJSONArray(pkg))
      }
    }

    FocusRules(apps = apps, sites = sites, features = features, browsers = browsers)
  } catch (_: Exception) {
    null
  }

  private fun stringList(array: JSONArray?): List<String> {
    if (array == null) return emptyList()
    val out = mutableListOf<String>()
    for (index in 0 until array.length()) {
      val value = array.optString(index)
      if (!value.isNullOrEmpty()) out.add(value)
    }
    return out
  }
}
