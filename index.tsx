import '@telegram-apps/telegram-ui/dist/styles.css';

import ReactDOM from 'react-dom/client';
import { StrictMode, useMemo } from 'react';
import { retrieveLaunchParams, useSignal, isMiniAppDark } from '@telegram-apps/sdk-react';
import { AppRoot } from '@telegram-apps/telegram-ui';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { MainPage } from '@/app/MainPage.tsx';
import { EnvUnsupported } from '@/components/EnvUnsupported.tsx';
import { init } from '@/lib/init.ts';

import './index.css';
import '@/lib/mock.ts';

const MIN_WEBAPP_VERSION = '6.7';

const App = () => {
  const lp = useMemo(() => retrieveLaunchParams(), []);
  const isDark = useSignal(isMiniAppDark);

  return (
    <AppRoot
      appearance={isDark ? 'dark' : 'light'}
      platform={['macos', 'ios'].includes(lp.tgWebAppPlatform) ? 'ios' : 'base'}
    >
      <HashRouter>
        <div className="page-container">
          <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="*" element={<MainPage />} />
          </Routes>
        </div>
      </HashRouter>
    </AppRoot>
  );
};

const isWebAppVersionSupported = () => {
  if (!window.Telegram?.WebApp?.version) return false;
  
  return window.Telegram.WebApp.isVersionAtLeast(MIN_WEBAPP_VERSION);
};

// Create unsupported version error component
const UnsupportedVersion = () => (
  <div className="error-container">
    <h1>Unsupported Telegram Version</h1>
    <p>Please update your Telegram app to the latest version to use this Mini App.</p>
    <p>Minimum required version: {MIN_WEBAPP_VERSION}</p>
    <p>Your version: {window.Telegram?.WebApp?.version || 'Unknown'}</p>
  </div>
);

const root = ReactDOM.createRoot(document.getElementById('root')!);

try {
  const launchParams = retrieveLaunchParams();
  const { tgWebAppPlatform: platform } = launchParams;
  const debug = (launchParams.tgWebAppStartParam || '').includes('platformer_debug')
    || import.meta.env.DEV;

  // Check if WebApp version is supported
  if (!isWebAppVersionSupported()) {
    root.render(<UnsupportedVersion />);
  } else {
    init({
      debug,
      eruda: debug && ['ios', 'android'].includes(platform),
      mockForMacOS: platform === 'macos',
    })
      .then(() => {
        root.render(
          <StrictMode>
            <App />
          </StrictMode>,
        );
      });
  }
} catch (e) {
  root.render(<EnvUnsupported/>);
}