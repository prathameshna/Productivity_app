package expo.modules.focusblocker

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.os.SystemClock
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import android.content.Context
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager

/**
 * Fail-open foreground guard. It only acts on rules explicitly saved by JS and
 * sends the user home rather than trying to draw an untrusted overlay.
 */
class FocusAccessibilityService : AccessibilityService() {
  private var lastBlockedPackage: String? = null
  private var lastBlockedAt = 0L

  override fun onServiceConnected() {
    super.onServiceConnected()
    FocusWatcherService.start(this)
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    val currentPackage = event?.packageName?.toString() ?: return
    FocusWatcherService.updateForeground(this, currentPackage)
    if (currentPackage == packageName) return
    val rules = RulesStore.rules(this) ?: return
    val rule = rules.apps.firstOrNull { it.packageName == currentPackage && it.enabled }
    val usageSeconds = UsageRepository.todaySeconds(this, currentPackage)
    if (rule != null && rule.enabled) maybeNotifyBeforeLimit(rule, usageSeconds)
    val featureBlocked = rule != null && featureIsBlocked(event, rules, currentPackage, rule)
    val websiteBlocked = browserDomainIsBlocked(event, rules)
    if ((featureBlocked || websiteBlocked) && shouldBlock(currentPackage)) {
      RulesStore.incrementBlocksFired(this)
      performGlobalAction(GLOBAL_ACTION_HOME)
    }
  }

  override fun onInterrupt() = Unit

  private fun maybeNotifyBeforeLimit(rule: AppRule, usageSeconds: Long) {
    if (!rule.remindEnabled || rule.remindMin <= 0) return
    val limit = rule.dailyLimitMin * 60L
    val reminderAt = limit - rule.remindMin * 60L
    if (usageSeconds < reminderAt || usageSeconds >= limit) return
    try {
      val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      if (!androidx.core.app.NotificationManagerCompat.from(this).areNotificationsEnabled()) return
      val channelId = "focus_reminders"
      if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
        manager.createNotificationChannel(
          NotificationChannel(channelId, getString(R.string.focus_reminder_channel_name), NotificationManager.IMPORTANCE_DEFAULT).apply {
            description = getString(R.string.focus_reminder_channel_description)
          },
        )
      }
      val notification = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
        Notification.Builder(this, channelId)
          .setSmallIcon(android.R.drawable.ic_dialog_info)
          .setContentTitle("Approaching your ${rule.label} limit")
          .setContentText("${rule.remindMin} minutes remain in today's allowance.")
          .setAutoCancel(true)
          .build()
      } else {
        @Suppress("DEPRECATION")
        Notification.Builder(this)
          .setSmallIcon(android.R.drawable.ic_dialog_info)
          .setContentTitle("Approaching your ${rule.label} limit")
          .setContentText("${rule.remindMin} minutes remain in today's allowance.")
          .setAutoCancel(true)
          .build()
      }
      if (!RulesStore.claimReminder(this, rule.packageName)) return
      try {
        manager.notify(rule.packageName.hashCode(), notification)
      } catch (error: Exception) {
        RulesStore.releaseReminder(this, rule.packageName)
        throw error
      }
    } catch (_: Exception) {
      // Notification permission and OEM restrictions are reported by the permission gate.
    }
  }

  private fun shouldBlock(packageName: String): Boolean {
    val now = SystemClock.elapsedRealtime()
    if (lastBlockedPackage == packageName && now - lastBlockedAt < 1500L) return false
    lastBlockedPackage = packageName
    lastBlockedAt = now
    return true
  }

  private fun featureIsBlocked(
    event: AccessibilityEvent,
    rules: FocusRules,
    packageName: String,
    rule: AppRule
  ): Boolean {
    val root = rootInActiveWindow ?: return false
    val blocked = rules.features[packageName].orEmpty().filter { rule.blockedFeatures.contains(it.id) }
    return blocked.any { hint ->
      containsHint(root, hint.resourceIds, hint.texts)
    }
  }

  private fun browserDomainIsBlocked(event: AccessibilityEvent, rules: FocusRules): Boolean {
    val packageName = event.packageName?.toString() ?: return false
    val ids = rules.browsers[packageName].orEmpty()
    if (ids.isEmpty()) return false
    val root = rootInActiveWindow ?: return false
    val url = findUrl(root, ids) ?: return false
    val domain = url.lowercase()
      .replace(Regex("^https?://"), "")
      .removePrefix("www.")
      .substringBefore('/')
      .substringBefore('?')
    return rules.sites.any { it.enabled && domain == it.domain && UsageRepository.todaySeconds(this, packageName) >= it.dailyLimitMin * 60L }
  }

  private fun containsHint(node: AccessibilityNodeInfo, ids: List<String>, texts: List<String>): Boolean {
    val viewId = node.viewIdResourceName.orEmpty().lowercase()
    if (ids.any { viewId.contains(it.lowercase()) }) return true
    if (viewId.isEmpty() && texts.any { node.text?.toString()?.equals(it, true) == true }) return true
    for (index in 0 until node.childCount) {
      if (node.getChild(index)?.let { child ->
          val result = containsHint(child, ids, texts)
          child.recycle()
          result
        } == true) return true
    }
    return false
  }

  private fun findUrl(node: AccessibilityNodeInfo, ids: List<String>): String? {
    if (ids.any { node.viewIdResourceName.orEmpty().contains(it, true) }) {
      return node.text?.toString() ?: node.contentDescription?.toString()
    }
    for (index in 0 until node.childCount) {
      val child = node.getChild(index) ?: continue
      val result = findUrl(child, ids)
      child.recycle()
      if (result != null) return result
    }
    return null
  }
}
