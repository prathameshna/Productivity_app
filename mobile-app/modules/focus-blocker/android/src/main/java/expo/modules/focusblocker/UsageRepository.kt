package expo.modules.focusblocker

import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import org.json.JSONObject
import java.util.Calendar

/**
 * Foreground time from UsageStatsManager.queryEvents (event-level intervals,
 * never the coarse aggregate queryUsageStats API). The JavaScript picker and the
 * native blocker share this one implementation so "spent" always agrees.
 */
object UsageRepository {

  fun todaySeconds(context: Context, packageName: String): Long =
    windowSeconds(context, setOf(packageName), startOfTodayMillis(), System.currentTimeMillis())[packageName] ?: 0L

  fun startOfTodayMillis(): Long {
    val calendar = Calendar.getInstance().apply {
      set(Calendar.HOUR_OF_DAY, 0)
      set(Calendar.MINUTE, 0)
      set(Calendar.SECOND, 0)
      set(Calendar.MILLISECOND, 0)
    }
    return calendar.timeInMillis
  }

  /** Seconds in the foreground today (local midnight -> now), keyed by package. */
  fun todaySecondsJson(context: Context, packages: Collection<String>): String {
    val totals = windowSeconds(context, packages.toSet(), startOfTodayMillis(), System.currentTimeMillis())
    return toJson(totals)
  }

  /** Average daily seconds over the 7 whole days before today, keyed by package. */
  fun previous7DayAverageSecondsJson(context: Context, packages: Collection<String>): String {
    val todayStart = startOfTodayMillis()
    val windowStart = todayStart - 7L * 24 * 60 * 60 * 1000
    val totals = windowSeconds(context, packages.toSet(), windowStart, todayStart)
    return toJson(totals.mapValues { (_, seconds) -> seconds / 7L })
  }

  private fun toJson(totals: Map<String, Long>): String {
    val json = JSONObject()
    for ((pkg, seconds) in totals) {
      json.put(pkg, seconds)
    }
    return json.toString()
  }

  private fun windowSeconds(
    context: Context,
    packages: Set<String>,
    start: Long,
    end: Long
  ): Map<String, Long> {
    if (packages.isEmpty()) return emptyMap()
    val usageStatsManager =
      context.getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager ?: return emptyMap()

    val events = try {
      usageStatsManager.queryEvents(start, end)
    } catch (_: Exception) {
      return emptyMap()
    }

    val openSince = HashMap<String, Long>()
    val totals = HashMap<String, Long>()
    val event = UsageEvents.Event()
    while (events.hasNextEvent()) {
      events.getNextEvent(event)
      val pkg = event.packageName ?: continue
      if (pkg !in packages) continue
      when (event.eventType) {
        UsageEvents.Event.MOVE_TO_FOREGROUND -> openSince[pkg] = event.time
        UsageEvents.Event.MOVE_TO_BACKGROUND -> {
          val began = openSince.remove(pkg)
          if (began != null && event.time > began) {
            totals[pkg] = (totals[pkg] ?: 0L) + (event.time - began)
          }
        }
      }
    }

    // A session still open at the end of the window counts up to now (or the window end).
    val windowEnd = minOf(System.currentTimeMillis(), end)
    for ((pkg, began) in openSince) {
      if (windowEnd > began) {
        totals[pkg] = (totals[pkg] ?: 0L) + (windowEnd - began)
      }
    }
    return totals
  }
}
