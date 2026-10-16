package expo.modules.focusblocker

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class FocusResetReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    RulesStore.ensureToday(context)
  }
}
