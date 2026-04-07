import { QueryProvider } from '../providers/QueryProvider';
import { NativeAuthProvider } from '../providers/AuthProvider';
import { I18nProvider } from '../providers/I18nProvider';
import { LaunchCoordinator } from '../bootstrap/LaunchCoordinator';
import { AppRuntimeCoordinator } from './AppRuntimeCoordinator';
import { AppShell } from './AppShell';

export function App() {
  return (
    <QueryProvider>
      <I18nProvider>
        <NativeAuthProvider>
          <AppRuntimeCoordinator />
          <LaunchCoordinator>
            <AppShell />
          </LaunchCoordinator>
        </NativeAuthProvider>
      </I18nProvider>
    </QueryProvider>
  );
}
