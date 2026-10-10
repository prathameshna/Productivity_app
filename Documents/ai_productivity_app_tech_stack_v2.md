# AI Productivity App — Recommended Technology Stack

**Version:** 1.0  
**Reviewed:** 9 October 2026  
**Scope:** Android + iOS; Alarm, Tasks, Calendar, Focus/App Blocking, Workspace, Sticky Notes, News, AI voice/text command, subscriptions, and admin panel.

## 1. Executive decision

Use **React Native + Expo + TypeScript** for the shared mobile application, backed by **Supabase/PostgreSQL**, with carefully scoped **native Swift and Kotlin modules** for OS-dependent capabilities. Put all AI credentials and privileged actions behind a server-side AI Action Engine. Keep the AI provider replaceable behind an adapter.

This is a strong fit for a small team that wants to build quickly, reuse UI and product logic across iOS and Android, and still integrate with native platform APIs. Expo supports custom Swift/Kotlin modules; this app must use development builds rather than relying only on Expo Go for advanced native features. [Expo Modules API](https://docs.expo.dev/modules/overview/)

## 2. Recommended stack at a glance

| Layer | Recommendation | Purpose |
|---|---|---|
| Mobile | React Native + Expo + TypeScript | Shared iOS/Android application |
| Navigation | Expo Router | Typed, file-based routes and deep links |
| UI system | React Native StyleSheet + centralized design tokens | Keep the Stitch/Figma design consistent in native components |
| Icons | lucide-react-native | One consistent outline icon family |
| Motion/gestures | React Native Reanimated + Gesture Handler | Smooth, accessible UI interactions |
| Client state | Zustand | Lightweight transient UI state |
| Server state | TanStack Query | Fetching, caching, retries and mutation state |
| Validation/forms | Zod + React Hook Form | Runtime validation and predictable forms |
| Local storage | Expo SQLite | Local cache, drafts and queued offline actions |
| Backend | Supabase: PostgreSQL, Auth, Storage, Edge Functions; Realtime only where needed | Accounts, synchronized data and server-side operations |
| AI command engine | TypeScript server-side service using a provider adapter; start with OpenAI Responses API tool/function calling + Structured Outputs | Parse natural language into typed proposed actions |
| Voice | Expo audio capture + server-side speech-to-text adapter; text-to-speech optional | Cross-platform voice input without coupling product logic to one transcription vendor |
| Native alarms | iOS AlarmKit where available; Android AlarmManager with exact-alarm permission/policy handling | OS-managed alarms, not JavaScript timers |
| App blocking | iOS FamilyControls / ManagedSettings / DeviceActivity; Android platform-specific prototype and policy review | Focus enforcement, subject to OS/API and store restrictions |
| Ordinary notifications | Expo Notifications with APNs/FCM; alarm delivery remains native/platform-specific | Reminders and updates |
| Subscriptions | RevenueCat | StoreKit / Google Play Billing entitlement management |
| Product analytics | PostHog (privacy-reviewed events) | Activation and feature-use analysis |
| Crash reporting | Sentry | Errors, crashes and release health |
| Admin panel | Next.js + TypeScript + Supabase, separate protected web app | Remote configuration, content and support tools |
| Builds/releases | EAS Build + EAS Submit + EAS Update; GitHub Actions for CI | Build, distribute and test app releases |
| Testing | Jest + React Native Testing Library + Maestro; native-device tests | Unit, UI and end-to-end reliability |

## 3. Mobile application architecture

### Core choices
- Use TypeScript throughout the app and backend action layer.
- Use Expo Router for screen routes and deep links.
- Use centralized design tokens for the current warm-neutral palette, typography, feature accents, radii and spacing. The UI generated in Stitch/Figma is the design reference; implement the product UI as reusable React Native components rather than shipping exported HTML as the mobile app.
- Keep platform-specific code behind small interfaces, for example `AlarmService`, `FocusBlockingService`, `NotificationService` and `SpeechToTextProvider`.
- Start with a modular monolith, not microservices. Split services only when scale, latency, deployment or team boundaries justify it.

### State and offline behavior
- Zustand is for temporary UI state, not the authoritative database.
- TanStack Query is for remote data fetching, caching and mutation state.
- Use SQLite for local drafts, cached task/note data, and a durable pending-action/outbox queue for offline operation.
- Supabase/PostgreSQL is the cloud source of truth. Define conflict handling and retry/idempotency rules before adding broad offline editing.
- Alarms must be registered locally with the operating system; a cloud record or a JavaScript timer alone is not a reliable alarm.

## 4. Native capabilities: build and validate early

### Alarms
- **Android:** implement a native Kotlin module using `AlarmManager` and the appropriate exact-alarm capability. Check permission state at scheduling time; explain recovery if permission is revoked or unavailable. Android documents special permissions and policy limits for exact alarms. [Android exact alarms](https://developer.android.com/develop/background-work/services/alarms)
- **iOS:** investigate AlarmKit for supported OS versions; it supports scheduled and repeating alarms, snooze and system-managed presentations. Confirm the app's minimum supported iOS version and fallback UX before promising parity. [Apple AlarmKit](https://developer.apple.com/documentation/alarmkit)
- Test screen locked, app terminated, device reboot, daylight-saving/time-zone changes, permission changes, battery-saving modes, and one-time/repeating schedules on real devices.

### Focus and app blocking
- **iOS:** FamilyControls, ManagedSettings and DeviceActivity are the relevant Screen Time frameworks. Distribution requires Apple approval for the Family Controls entitlement, including applicable extensions. Start the entitlement request and a minimal technical prototype early. [Apple Family Controls entitlement](https://developer.apple.com/documentation/familycontrols/requesting-the-family-controls-entitlement)
- **Android:** app blocking is not a generic cross-platform feature. Choose APIs only after a proof of concept and Google Play policy review. Do not promise reliable hard blocking on all devices until permissions, enforcement behavior, and review requirements are validated.
- If a platform cannot provide the promised behavior, show the exact limitation and offer a supported alternative rather than silently presenting a timer as a blocker.

### Expo workflow
Use Expo development builds and Continuous Native Generation when custom native modules are required. Expo's Modules API supports Swift and Kotlin modules. [Expo Modules API](https://docs.expo.dev/modules/overview/)

EAS Update can ship compatible JavaScript, styling and asset updates, but native code, permissions or native dependencies require a new native build. [EAS Update limitations](https://docs.expo.dev/eas-update/introduction/)

## 5. AI architecture

### Recommended command pipeline

`Voice or text → transcription (if voice) → intent/action planning → schema validation → permission/conflict checks → user preview/confirmation → controlled executor → per-action result log`

### Rules
1. Keep model API keys and provider credentials on the server only.
2. Use a provider adapter (`AIProvider`) so models can be changed without rewriting product features.
3. Start with one provider. OpenAI Responses API function calling and Structured Outputs are suitable patterns for mapping requests to typed application actions. [Function calling](https://developers.openai.com/api/docs/guides/function-calling) · [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses)
4. Define an allowlist of typed tools such as `create_task`, `create_note`, `schedule_alarm`, `create_calendar_event`, `start_focus_session` and `search_connected_items`.
5. Validate every proposed action with Zod on the server; never let a model execute arbitrary SQL, shell commands or application code.
6. Ask a clarifying question when the date, time, target or intent is ambiguous. For destructive, external, shared or otherwise consequential actions, require explicit confirmation.
7. Use idempotency keys and command/action IDs so retries do not create duplicate alarms, tasks or events.
8. Record action status (`proposed`, `confirmed`, `running`, `succeeded`, `failed`, `cancelled`) and show results for each action in a multi-action command.
9. Store only the minimum conversation and audio data needed. Default to deleting raw audio after transcription unless the user explicitly opts into retention.
10. Add rate limits, usage budgets, abuse controls, provider timeouts and graceful fallback responses.

### Voice
Capture audio only after a clear user action and permission. Route it through a speech-to-text adapter, then pass the transcript through the same action pipeline as typed input. Keep voice transcription, intent extraction and action execution as separate components so each can be changed independently.

## 6. Backend, data and integrations

### Supabase
Use PostgreSQL for users, tasks, projects, events, notes, focus sessions, integrations, AI commands, action logs and subscription entitlements. Use Supabase Auth, Storage and Edge Functions as needed, and enable Row Level Security (RLS) for user-owned records. Use Realtime selectively rather than broadcasting all data by default. Supabase documents a React Native/Expo path with Postgres and RLS. [Supabase + Expo](https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native)

Keep a migration history in version control. Separate development, staging and production environments. Never use a service-role secret in the mobile app.

### Integration order
1. Google Calendar and Gmail, with minimal OAuth scopes and clear consent.
2. Outlook/Microsoft 365 mail and calendar.
3. Notion or Google Drive based on early user demand.
4. Other integrations only after measuring usage and support cost.

OAuth callbacks, refresh tokens, webhook verification and sync jobs should run server-side. Encrypt provider tokens at rest, allow disconnect/revoke, and delete stored tokens on disconnect. Never claim access to content an API does not expose.

### Subscription, analytics and errors
- RevenueCat for subscription entitlements and store billing integration. Expo support requires a development build for native testing. [RevenueCat Expo setup](https://www.revenuecat.com/docs/getting-started/installation/expo)
- PostHog for product events; do not send email bodies, raw audio, passwords, tokens or other sensitive content to analytics.
- Sentry for crashes and performance/error diagnostics. Strip personal content from logs by default.

## 7. Admin panel and deployment

Build the admin panel as a separate Next.js + TypeScript app using role-based access. Admin capabilities may include remote configuration, feature flags, managed content/news sources, subscription-plan settings, support diagnostics and safe announcement controls. Do not allow the admin panel to execute arbitrary code inside user devices.

Use EAS Build for native binaries, EAS Submit for store submission and EAS Update only for compatible JS/assets/UI changes. Use development, preview/staging and production channels; test native permission and alarm changes in internal builds before release. [EAS Build](https://docs.expo.dev/build/) · [EAS Update](https://docs.expo.dev/eas-update/introduction/)

## 8. Suggested repository structure

```text
app/
  src/app/                 # Expo Router screens and layouts
  src/components/          # Reusable UI components
  src/design-system/       # Color, typography, spacing and component tokens
  src/features/
    alarm/
    tasks/
    calendar/
    focus/
    workspace/
    notes/
    news/
    ai-command/
  src/services/            # Typed interfaces to backend/native capabilities
  src/state/               # Zustand stores
  src/data/                # TanStack Query, SQLite and sync logic
  src/schemas/              # Shared Zod schemas
  src/lib/                  # Supabase client and utilities
  modules/                  # Custom Expo native modules
  supabase/
    migrations/
    functions/
  admin/                    # Separate Next.js admin app (or separate repository)
  tests/
  docs/
```

## 9. Required proof-of-concept gates

Do not commit to a production launch date until these are tested:

1. **Alarm spike:** schedule, fire, snooze and cancel on real iOS and Android devices while locked; test permission denial and reboot behavior.
2. **App-blocking spike:** verify actual enforcement on supported OS versions, distribution entitlements, Play policies and user consent.
3. **AI action spike:** one voice command creates two or more distinct actions; test ambiguity, cancellation, retries, duplicate prevention and partial failure.
4. **OAuth spike:** connect and disconnect a provider, renew credentials, process a sync update, handle revoked access, and delete credentials safely.
5. **Offline spike:** create a task/note offline, restart the app, reconnect, and verify conflict and retry behavior.

## 10. Key risks and decisions still open

- Minimum supported iOS and Android versions.
- Whether full app blocking can be approved and implemented on both platforms.
- Exact alarm behavior and fallback by OS version and permission state.
- Initial AI model/provider and monthly AI usage budget.
- First Workspace integration set and OAuth verification requirements.
- News licensing/source strategy.
- Data retention policy, privacy policy and deletion/export flows.

These are product/market and platform decisions, not problems solved merely by choosing a framework.

## 11. Final recommendation

**Use Expo + React Native + TypeScript, Supabase/PostgreSQL, native Swift/Kotlin modules, a server-side provider-agnostic AI Action Engine, and SQLite for local reliability.** This balances development speed with room to support the app's OS-dependent features. The long-term robustness will come from clear service boundaries, validation, native-device testing, privacy controls, schema migrations and observability—not from adding more technologies early.

## Official documentation consulted

- [Expo Router](https://docs.expo.dev/router/introduction/)
- [Expo Modules API](https://docs.expo.dev/modules/overview/)
- [Supabase with Expo React Native](https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native)
- [Android alarm scheduling](https://developer.android.com/develop/background-work/services/alarms)
- [Apple AlarmKit](https://developer.apple.com/documentation/alarmkit)
- [Apple Family Controls entitlement](https://developer.apple.com/documentation/familycontrols/requesting-the-family-controls-entitlement)
- [OpenAI function calling](https://developers.openai.com/api/docs/guides/function-calling)
- [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses)
- [RevenueCat + Expo](https://www.revenuecat.com/docs/getting-started/installation/expo)
- [EAS Build](https://docs.expo.dev/build/)
- [EAS Update](https://docs.expo.dev/eas-update/introduction/)
