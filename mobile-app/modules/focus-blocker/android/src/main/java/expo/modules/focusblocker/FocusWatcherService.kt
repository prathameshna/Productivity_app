package expo.modules.focusblocker

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.os.Handler
import android.os.Looper

class FocusWatcherService : Service() {
  private val handler = Handler(Looper.getMainLooper())
  private var lastBlockedPackage: String? = null
  private var lastBlockedAt = 0L

  private val enforcementTick = object : Runnable {
    override fun run() {
      val pkg = currentForegroundPackage
      if (!pkg.isNullOrBlank() && pkg != packageName) enforceLimit(pkg)
      handler.postDelayed(this, POLL_INTERVAL_MS)
    }
  }

  override fun onCreate() {
    super.onCreate()
    val manager = getSystemService(NotificationManager::class.java)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      manager.createNotificationChannel(
        NotificationChannel(
          "focus_watcher",
          getString(R.string.focus_watcher_channel_name),
          NotificationManager.IMPORTANCE_LOW,
        ),
      )
    }
    val notification = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      Notification.Builder(this, "focus_watcher")
        .setContentTitle(getString(R.string.focus_watcher_notification_title))
        .setContentText(getString(R.string.focus_watcher_notification_text))
        .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
        .setOngoing(true)
        .build()
    } else {
      Notification.Builder(this)
        .setContentTitle(getString(R.string.focus_watcher_notification_title))
        .setContentText(getString(R.string.focus_watcher_notification_text))
        .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
        .setOngoing(true)
        .build()
    }
    startForeground(401, notification)
    handler.post(enforcementTick)
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int =
    START_STICKY

  override fun onDestroy() {
    handler.removeCallbacks(enforcementTick)
    watcherStarted = false
    super.onDestroy()
  }

  override fun onBind(intent: Intent?): IBinder? = null

  private fun enforceLimit(pkg: String) {
    val rule = RulesStore.appRule(this, pkg)?.takeIf { it.enabled } ?: return
    if (UsageRepository.todaySeconds(this, pkg) < rule.dailyLimitMin * 60L) return
    if (RulesStore.graceRemaining(this, pkg) > 0L) return
    val now = android.os.SystemClock.elapsedRealtime()
    if (lastBlockedPackage == pkg && now - lastBlockedAt < REBLOCK_DELAY_MS) return
    lastBlockedPackage = pkg
    lastBlockedAt = now
    RulesStore.incrementBlocksFired(this)
    try {
      startActivity(Intent(this, FocusBlockActivity::class.java).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        putExtra(FocusBlockActivity.EXTRA_PACKAGE, pkg)
        putExtra(FocusBlockActivity.EXTRA_LABEL, rule.label)
        putExtra(FocusBlockActivity.EXTRA_STRICT, rule.strict)
      })
    } catch (_: Exception) {
      // Accessibility handling still sends the user home when the native UI cannot open.
    }
  }

  companion object {
    private const val POLL_INTERVAL_MS = 1000L
    private const val REBLOCK_DELAY_MS = 1500L
    @Volatile private var currentForegroundPackage: String? = null
    @Volatile private var watcherStarted = false

    fun start(context: Context) {
      val shouldRun = RulesStore.rules(context)?.apps?.any { it.enabled } == true
      if (!shouldRun) {
        context.stopService(Intent(context, FocusWatcherService::class.java))
        watcherStarted = false
        return
      }
      if (watcherStarted) return
      try {
        val intent = Intent(context, FocusWatcherService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) context.startForegroundService(intent)
        else context.startService(intent)
        watcherStarted = true
      } catch (_: Exception) {
        // Accessibility service remains the immediate enforcement fallback.
      }
    }

    fun updateForeground(context: Context, packageName: String) {
      currentForegroundPackage = packageName
      start(context)
    }
  }
}
