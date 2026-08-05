import { useCallback, useState } from 'react';
import AppRoutes from './app/AppRoutes';
import StartupSplash from './app/StartupSplash';

const SHOW_DEVELOPMENT_SPLASH = process.env.NODE_ENV === 'development'
  && String(process.env.REACT_APP_USE_MOCK_API || '').toLowerCase() === 'true'
  && process.env.REACT_APP_MOCK_START_LOGGED_OUT === 'true';

export default function App() {
  const [showSplash, setShowSplash] = useState(SHOW_DEVELOPMENT_SPLASH);
  const completeSplash = useCallback(() => setShowSplash(false), []);

  return showSplash
    ? <StartupSplash onComplete={completeSplash} />
    : <AppRoutes />;
}
