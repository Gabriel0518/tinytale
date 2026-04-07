import React from 'react';
import ReactDOM from 'react-dom/client';
import { BootNativeApp } from './bootstrap/boot-native-app';
import './theme/tokens.css';
import './theme/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BootNativeApp />
  </React.StrictMode>
);
