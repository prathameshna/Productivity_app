package expo.modules.focusblocker

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class FocusResetReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    if (intent?.action == Intent.ACTION_PACKAGE_FULLY_REMOVED &&
      !intent.getBooleanExtra(Intent.EXTRA_REPLACING, false) && intent.data?.schemeSpecificPart != null) {
      RulesStore.removeUninstalledApp(context, intent.data!!.schemeSpecificPart!!)
      FocusWatcherService.start(context)
      return
    }
    RulesStore.ensureToday(context)
  }
}
