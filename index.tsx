import '@telegram-apps/telegram-ui/dist/styles.css';

import ReactDOM from 'react-dom/client';
import { StrictMode, useMemo } from 'react';
import { retrieveLaunchParams, useSignal, isMiniAppDark } from '@telegram-apps/sdk-react';
import { AppRoot } from '@telegram-apps/telegram-ui';
import { Navigate, Route, Routes, HashRouter } from 'react-router-dom';
import type { ComponentType, JSX } from 'react';

import { EnvUnsupported } from '@/components/EnvUnsupported.tsx';
import { init } from '@/init.ts';
import { InitDataPage } from '@/app/InitDataPage.tsx';
import { LaunchParamsPage } from '@/app/LaunchParamsPage.tsx';
import { ThemeParamsPage } from '@/app/ThemeParamsPage.tsx';
import { MainPage } from '@/app/MainPage.tsx';
import { Navigation } from '@/components/Navigation.tsx';
import { Page } from './helpers/Page.tsx';

import './index.css';
import './mockEnv.ts';

interface Route {
  path: string;
  Component: ComponentType;
  title?: string;
  icon?: JSX.Element;
}

const routes: Route[] = [
  { path: '/', Component: MainPage, title: 'Reminder' },
  { path: '/init-data', Component: InitDataPage, title: 'Init Data' },
  { path: '/theme-params', Component: ThemeParamsPage, title: 'Theme Params' },
  { path: '/launch-params', Component: LaunchParamsPage, title: 'Launch Params' },
];

const App = () => {
  const lp = useMemo(() => retrieveLaunchParams(), []);
  const isDark = useSignal(isMiniAppDark);

  return (
    <AppRoot
      appearance={isDark ? 'dark' : 'light'}
      platform={['macos', 'ios'].includes(lp.tgWebAppPlatform) ? 'ios' : 'base'}
    >
      <HashRouter>
        <div className="app-container">
          <div className="page-content">
            <Routes>
              {routes.map((route) => (
                <Route 
                  key={route.path} 
                  path={route.path} 
                  element={
                    // For home page, don't show back button
                    route.path === '/' ? 
                      <route.Component /> : 
                      <Page back={true}><route.Component /></Page>
                  } 
                />
              ))}
              <Route path="*" element={<Navigate to="/"/>}/>
            </Routes>
          </div>
          <Navigation routes={routes} />
        </div>
      </HashRouter>
    </AppRoot>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);

try {
  const launchParams = retrieveLaunchParams();
  const { tgWebAppPlatform: platform } = launchParams;
  const debug = (launchParams.tgWebAppStartParam || '').includes('platformer_debug')
    || import.meta.env.DEV;

  await init({
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
} catch (e) {
  root.render(<EnvUnsupported/>);
}