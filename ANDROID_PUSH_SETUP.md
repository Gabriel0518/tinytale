# Android Push Setup

TinyTale Android push is wired through Capacitor Push Notifications plus Firebase Cloud Messaging.

## Current status

- Android app package: `top.tinytale.app`
- Firebase project: `tinytale-b7062`
- Firebase Android app config: `android/app/google-services.json`
- Android 13 permission added: `android.permission.POST_NOTIFICATIONS`
- Web/native bridge registration:
  - `src/lib/capacitor-bridge.ts`
  - `src/components/mobile/AppRuntime.tsx`
- Backend register/unregister/test push API:
  - `/api/user/notifications/push/register`
  - `/api/user/notifications/push/unregister`
  - `/api/user/notifications/push/test`

## Local sync

```bash
npx cap sync android
```

## To verify on device

1. Install Java and Android SDK so Gradle can build the app.
2. Start frontend on `http://10.0.2.2:7001` and backend on `http://10.0.2.2:7002` if using the Android emulator.
3. Run the Android app through Capacitor.
4. Log in with a real TinyTale user.
5. Open `/user/notifications`.
6. Confirm the page shows:
   - connected device token
   - `Server ready`
   - device count greater than `0`
7. Tap `Send test push` and verify the notification is received.

## Remaining work before marking the task done

- Build and run the Android app on a device or emulator
- Complete one successful end-to-end push delivery
- Record the result in Notion and switch the task to `Done`
