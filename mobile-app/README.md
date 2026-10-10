# Productivity mobile app

Native React Native + Expo Router implementation of the supplied dashboard reference.

## Development

```bash
npm install
npm run start
```

Use the Expo CLI prompt to open Android, iOS, or a development web preview. The screen currently uses local mock data only; no authentication, integrations, alarm engine, AI provider, or backend calls are implemented.

## Architecture

- `app/` contains Expo Router routes.
- `src/features/dashboard/` contains dashboard composition and local preview data.
- `src/components/` contains reusable presentation components.
- `src/theme/` is the centralized Serene Cadence token layer.
- `src/services/`, `src/store/`, and `src/types/` are reserved for future integration boundaries as features are added.

The approved stack remains React Native, Expo, TypeScript, Expo Router, `lucide-react-native`, and centralized `StyleSheet` tokens. Native capabilities such as alarms and app blocking are intentionally out of scope for this UI-only milestone.
