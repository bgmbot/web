import './App.css';

import React, { useEffect } from 'react';

import { useStore, useStoreObserver } from './utils/mobx';
import MainPage from './pages/MainPage';
import LoadingPage from './pages/LoadingPage';

const App = () => {
  const commonStore = useStore('commonStore');

  useEffect(() => {
    if (window.location.hash.startsWith('#token=')) {
      commonStore.setToken(window.location.hash.replace('#token=', ''));
      window.location.hash = '';
    }

    commonStore.authenticate();
  }, [commonStore]);

  const { isAuthenticated } = useStoreObserver('commonStore', (store) => ({
    isAuthenticated: store.isAuthenticated,
  }));

  if (!isAuthenticated) {
    return <LoadingPage />;
  }

  return <MainPage />;
};

export default App;
