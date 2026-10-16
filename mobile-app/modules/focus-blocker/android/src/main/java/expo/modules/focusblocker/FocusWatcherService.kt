package expo.modules.focusblocker

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder

class FocusWatcherService : Service() {
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
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int =
    START_STICKY

  override fun onBind(intent: Intent?): IBinder? = null
}
