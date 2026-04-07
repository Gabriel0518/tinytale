import { RouterProvider } from 'react-router-dom';
import { createAppRouter } from '../router/app-routes';

const router = createAppRouter();

export function AppShell() {
  return <RouterProvider router={router} />;
}
