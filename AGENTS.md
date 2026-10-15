# Project instructions

- Preserve `Documents/` and `Dashboard UI/`; they are source-of-truth inputs.
- Keep the mobile client native: React Native, Expo, TypeScript, and Expo Router.
- Use centralized tokens in `mobile-app/src/theme/` for visual changes.
- Keep credentials and privileged backend keys out of the mobile app.
- UI preview data must remain local until an explicit data integration task is requested.

## Engineering workflow

- Inspect the relevant routes, components, navigation, dependencies, tokens, tests, and documentation before changing code.
- Follow `INSPECT -> IDENTIFY -> PRIORITIZE -> FIX -> TEST -> VERIFY`; make the smallest complete change and repeat when verification reveals a regression.
- Preserve working behavior, saved state, navigation, source documents, visual references, and the approved technology stack. Do not perform unrelated refactors or add dependencies without a demonstrated need.
- Surface errors explicitly with the repository's established error, loading, empty, success, and disabled-state patterns. Do not silently swallow failures or show false success.

## Mobile architecture and design

- Implement UI with native React Native components, Expo Router routes, TypeScript, `StyleSheet`, `lucide-react-native`, and reusable components. Do not ship exported HTML as the mobile UI.
- Keep visual changes in the centralized tokens under `mobile-app/src/theme/`. Preserve Plus Jakarta Sans typography, warm-neutral surfaces, feature accent colors, outline icons, spacing, radii, shadows, safe areas, and light/dark-mode consistency.
- Keep feature boundaries clear: routes belong in `mobile-app/app/`, reusable presentation belongs in `mobile-app/src/components/`, and dashboard composition/local preview data belongs in `mobile-app/src/features/dashboard/`.
- Keep preview data local. Put future integrations behind explicit service/store/type boundaries; never place authentication secrets, AI provider keys, or privileged backend credentials in the client.
- Preserve responsive layouts and accessible interactions: readable hierarchy, predictable navigation, platform-safe touch targets, labels for meaningful controls, and clear recovery paths for permission denial or unavailable native capabilities.

## Performance and reliability

- Diagnose before optimizing. Prioritize dropped frames, slow transitions, unnecessary rerenders, repeated fetching/remounting, blocking JavaScript, excessive effects, and expensive images, lists, blur, shadows, or animations.
- Prefer native navigation and efficient, interruptible animations. Defer nonessential work without delaying essential UI, and prevent duplicate submissions or actions.
- Treat alarms, notifications, background work, and app blocking as platform-specific capabilities. Validate permissions and failure states at runtime; do not assume Expo Go, timers, or cross-platform parity are sufficient.
- Validate AI-generated actions before execution, use typed allowlists and confirmation for consequential actions, and keep execution server-side where privileged access is required.

## Validation

- After meaningful changes, run the smallest relevant checks from `mobile-app/`: `npm run typecheck` and focused tests/linting when configured. Use the development app to verify the affected screen, navigation, scrolling, gestures, loading/error states, and important interaction scenarios.
- For rendering, navigation, animation, alarms, notifications, background tasks, or app-blocking changes, verify on physical Android/iOS devices or clearly report when device validation is unavailable. Do not claim performance gains without measurement.
- Before finishing, report problems identified, changes implemented, checks and device validation actually completed, measured performance results when relevant, and remaining limitations.

## Reference documentation

- Start with [`mobile-app/README.md`](mobile-app/README.md) for current app boundaries and commands.
- Use [`Documents/ai_productivity_app_tech_stack_v2.md`](Documents/ai_productivity_app_tech_stack_v2.md) for approved architecture and native-capability guidance.
- Treat the UI design references under `UI_design/` and the preserved source documents under `Documents/` as inputs; update them only when explicitly requested.
