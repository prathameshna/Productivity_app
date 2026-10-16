/**
 * THE single mapping file for feature- and website-blocking identifiers.
 *
 * These identifiers are mirrored to native (SharedPreferences) through focusState,
 * so when an app updates and detection breaks, you only edit this file.
 *
 * Fragility, honestly:
 * - `resourceIds` are Android view IDs chosen to exist only inside the target
 *   surface (Shorts player, Reels viewer, Spotlight, browser URL bar). Google,
 *   Meta, Snap and Facebook change them between releases; a miss fails OPEN
 *   (the feature simply is not blocked) rather than blocking too much.
 * - `texts` are a fallback and are only matched on nodes without a view ID, so
 *   the "Shorts"/"Reels" labels in bottom navigation toolbars do not trigger a
 *   block. They break under non-English system locales.
 * - Browser URL bars only work for the exact package + view ID listed. Custom
 *   tabs, other browsers and search engines are out of scope.
 */

export interface BlockableFeature {
  id: string;
  label: string;
  description: string;
  /** View-ID hints (viewIdResourceName contains one of these, case-insensitive). */
  resourceIds: string[];
  /** Text hints, only matched on nodes without a view ID. */
  texts: string[];
}

export const FEATURE_BLOCKS: Record<string, BlockableFeature[]> = {
  'com.google.android.youtube': [
    {
      id: 'shorts',
      label: 'Shorts',
      description: 'Block the short-form video feed only',
      resourceIds: [
        'com.google.android.youtube:id/reel_player',
        'com.google.android.youtube:id/reel_',
        'com.google.android.youtube:id/shorts_',
      ],
      texts: ['Shorts'],
    },
  ],
  'com.instagram.android': [
    {
      id: 'reels',
      label: 'Reels',
      description: 'Block the vertical video feed only',
      resourceIds: [
        'com.instagram.android:id/reel_',
        'com.instagram.android:id/reels_',
        'com.instagram.android:id/video_grid_',
      ],
      texts: ['Reels'],
    },
  ],
  'com.snapchat.android': [
    {
      id: 'spotlight',
      label: 'Spotlight',
      description: 'Block the short-form video feed only',
      resourceIds: [
        'com.snapchat.android:id/spotlight_',
        'com.snapchat.android:id/spotlight',
      ],
      texts: ['Spotlight'],
    },
  ],
  'com.facebook.katana': [
    {
      id: 'reels',
      label: 'Reels',
      description: 'Block the vertical video feed only',
      resourceIds: [
        'com.facebook.katana:id/reel_',
        'com.facebook.katana:id/reels_',
        'com.facebook.katana:id/video_',
      ],
      texts: ['Reels'],
    },
  ],
};

/** Browser package -> view IDs that hold the address bar text. */
export const BROWSER_URL_BAR_IDS: Record<string, string[]> = {
  'com.android.chrome': ['com.android.chrome:id/url_bar'],
  'com.brave.browser': ['com.brave.browser:id/url_bar'],
  'com.microsoft.emmx': ['com.microsoft.emmx:id/url_bar'],
  'org.mozilla.firefox': [
    'org.mozilla.firefox:id/mozac_browser_toolbar_url_view',
    'org.mozilla.firefox:id/url_bar',
  ],
  'com.sec.android.app.sbrowser': [
    'com.sec.android.app.sbrowser:id/location_bar_edit_text',
    'com.sec.android.app.sbrowser:id/url_bar',
  ],
};

export function featuresForPackage(packageName: string): BlockableFeature[] {
  return FEATURE_BLOCKS[packageName] ?? [];
}

export function isFeatureSupported(packageName: string): boolean {
  return featuresForPackage(packageName).length > 0;
}

/** "Shorts blocked" / "Reels blocked" tag text for the Focus home cards. */
export function blockedFeatureTags(
  packageName: string,
  blockedFeatureIds: string[]
): string[] {
  if (!blockedFeatureIds.length) return [];
  return featuresForPackage(packageName)
    .filter((feature) => blockedFeatureIds.includes(feature.id))
    .map((feature) => `${feature.label} blocked`);
}
