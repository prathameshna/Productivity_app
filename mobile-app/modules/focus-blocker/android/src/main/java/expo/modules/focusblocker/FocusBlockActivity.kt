package expo.modules.focusblocker

import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.os.Bundle
import android.view.Gravity
import android.view.ViewGroup
import android.widget.Button
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView

/** Native block screen: available even when the React Native process is stopped. */
class FocusBlockActivity : Activity() {
  private var blockedPackage = ""
  private var blockedLabel = "App"

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    blockedPackage = intent.getStringExtra(EXTRA_PACKAGE).orEmpty()
    blockedLabel = intent.getStringExtra(EXTRA_LABEL).orEmpty().ifBlank { blockedPackage }
    val strict = intent.getBooleanExtra(EXTRA_STRICT, false)
    val canPass = !strict && RulesStore.emergencyUsed(this, blockedPackage) <
      (RulesStore.appRule(this, blockedPackage)?.emergencyTotal ?: 0)

    val page = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER
      setPadding(dp(28), dp(32), dp(28), dp(32))
      setBackgroundColor(Color.rgb(248, 247, 244))
    }
    val icon = ImageView(this).apply {
      val drawable = try { packageManager.getApplicationIcon(blockedPackage) } catch (_: Exception) { null }
      setImageDrawable(drawable)
      scaleType = ImageView.ScaleType.FIT_CENTER
    }
    page.addView(icon, LinearLayout.LayoutParams(dp(72), dp(72)).apply { bottomMargin = dp(20) })
    page.addView(text(blockedLabel, 24, Color.rgb(32, 31, 28), true))
    page.addView(text("Daily limit reached", 16, Color.rgb(100, 98, 92), false).apply {
      val params = LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT)
      params.topMargin = dp(8)
      layoutParams = params
    })

    if (canPass) {
      page.addView(button("Use 5-minute pass") {
        val used = RulesStore.useEmergencyPass(this, blockedPackage)
        val allowed = RulesStore.appRule(this, blockedPackage)
        if (allowed != null && used <= allowed.emergencyTotal) {
          RulesStore.setGrace(this, blockedPackage, PASS_DURATION_MS)
          packageManager.getLaunchIntentForPackage(blockedPackage)?.let { launch ->
            launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            startActivity(launch)
          }
        }
        finish()
      })
    }
    page.addView(button("Close app") {
      performCloseApp()
    })
    setContentView(page)
  }

  private fun performCloseApp() {
    performGlobalHome()
    finish()
  }

  private fun performGlobalHome() {
    startActivity(Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
  }

  private fun text(value: String, size: Int, color: Int, bold: Boolean) = TextView(this).apply {
    text = value
    textSize = size.toFloat()
    setTextColor(color)
    gravity = Gravity.CENTER
    if (bold) setTypeface(typeface, Typeface.BOLD)
  }

  private fun button(label: String, action: () -> Unit) = Button(this).apply {
    text = label
    setOnClickListener { action() }
    layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(54)).apply {
      topMargin = dp(18)
    }
  }

  private fun dp(value: Int) = (value * resources.displayMetrics.density).toInt()

  companion object {
    const val EXTRA_PACKAGE = "focus.package"
    const val EXTRA_LABEL = "focus.label"
    const val EXTRA_STRICT = "focus.strict"
    const val PASS_DURATION_MS = 5 * 60 * 1000L
  }
}
