package expo.modules.focusblocker

import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.AdaptiveIconDrawable
import android.graphics.drawable.Drawable
import android.util.Base64
import org.json.JSONArray
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.io.File
import java.security.MessageDigest
import java.util.concurrent.ConcurrentHashMap

/**
 * Installed launchable apps and their real launcher icons.
 * Icons are rendered to a 96px PNG, then cached in memory and on disk so the
 * picker only has to rasterize each icon once.
 */
object AppRepository {
  private const val ICON_SIZE = 96

  private val iconMemory = ConcurrentHashMap<String, String>()

  /** JSON array of { packageName, label } for apps with a launcher entry, excluding our own. */
  fun installedAppsJson(context: Context): String {
    val packageManager = context.packageManager
    val launchIntent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
    val resolveInfos = try {
      packageManager.queryIntentActivities(launchIntent, 0)
    } catch (_: Exception) {
      emptyList()
    }

    val seen = HashSet<String>()
    val entries = mutableListOf<Pair<String, String>>()
    for (info in resolveInfos) {
      val pkg = info.activityInfo?.packageName ?: continue
      if (pkg == context.packageName || !seen.add(pkg)) continue
      val applicationInfo = info.activityInfo.applicationInfo
      val label = applicationInfo.loadLabel(packageManager)?.toString()?.trim().orEmpty()
        .ifEmpty { pkg }
      entries.add(pkg to label)
    }
    entries.sortBy { it.second.lowercase() }

    val array = JSONArray()
    for ((pkg, label) in entries) {
      val item = JSONObject()
      item.put("packageName", pkg)
      item.put("label", label)
      array.put(item)
    }
    return array.toString()
  }

  /** Base64 of a 96px PNG of the app's real icon, or null if it cannot be loaded. */
  fun iconBase64(context: Context, packageName: String): String? {
    iconMemory[packageName]?.let { return it }

    val file = iconFile(context, packageName)
    if (file.exists()) {
      try {
        val encoded = Base64.encodeToString(file.readBytes(), Base64.NO_WRAP)
        iconMemory[packageName] = encoded
        return encoded
      } catch (_: Exception) {
        // Corrupted cache entry: fall through and regenerate.
      }
    }

    val drawable = try {
      context.packageManager.getApplicationIcon(packageName)
    } catch (_: Exception) {
      return null
    }
    val bitmap = try {
      drawableToBitmap(drawable)
    } catch (_: Exception) {
      return null
    }

    val output = ByteArrayOutputStream()
    if (!bitmap.compress(Bitmap.CompressFormat.PNG, 100, output)) return null
    val bytes = output.toByteArray()
    try {
      file.parentFile?.mkdirs()
      file.writeBytes(bytes)
    } catch (_: Exception) {
      // Disk cache is best effort; memory cache still works.
    }

    val encoded = Base64.encodeToString(bytes, Base64.NO_WRAP)
    iconMemory[packageName] = encoded
    return encoded
  }

  fun clearIconCache(context: Context) {
    iconMemory.clear()
    try {
      File(context.cacheDir, "focus_icons").listFiles()?.forEach { it.delete() }
    } catch (_: Exception) {
      // Best effort.
    }
  }

  private fun iconFile(context: Context, packageName: String): File {
    val digest = MessageDigest.getInstance("SHA-1").digest(packageName.toByteArray())
    val name = digest.joinToString("") { byte -> "%02x".format(byte) }
    return File(File(context.cacheDir, "focus_icons"), "$name.png")
  }

  private fun drawableToBitmap(drawable: Drawable): Bitmap {
    val bitmap = Bitmap.createBitmap(ICON_SIZE, ICON_SIZE, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    if (drawable is AdaptiveIconDrawable) {
      // Background fills the tile; foreground is inset like the launcher safe zone.
      drawable.setBounds(0, 0, ICON_SIZE, ICON_SIZE)
      drawable.background?.draw(canvas) ?: drawable.draw(canvas)
      val inset = (ICON_SIZE * 0.14f).toInt()
      drawable.foreground?.let { foreground ->
        foreground.setBounds(inset, inset, ICON_SIZE - inset, ICON_SIZE - inset)
        foreground.draw(canvas)
      }
    } else {
      drawable.setBounds(0, 0, ICON_SIZE, ICON_SIZE)
      drawable.draw(canvas)
    }
    return bitmap
  }
}
