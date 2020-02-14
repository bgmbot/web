import React from 'react';
import ReactDOM from 'react-dom';
import * as Sentry from '@sentry/browser';
import { i18n } from 'element-react';
import locale from 'element-react/src/locale/lang/ko';
import 'element-theme-default';
import './index.css';
import * as serviceWorker from './serviceWorker';
import { createBrowserHistory } from 'history';
import { syncHistoryWithStore } from 'mobx-react-router';
import RootStore from './stores/RootStore';
import { Provider } from 'mobx-react';
import { Router } from 'react-router';
import App from './App';
import { CacheProvider } from '@emotion/core';
import createCache from '@emotion/cache';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import '@fortawesome/fontawesome-svg-core/styles.css';
import { ToastProvider } from 'react-toast-notifications';

library.add(fas);
i18n.use(locale);

Sentry.init({ dsn: 'https://1496aefc64a6450a8d184cb07b5ac859@sentry.io/2371563' });

const myCache = createCache();
myCache.compat = true;

const browserHistory = createBrowserHistory();
const rootStore = new RootStore();

const history = syncHistoryWithStore(browserHistory, rootStore.routerStore);

rootStore.pageStore.setToastRef(React.createRef());

ReactDOM.render(
  <CacheProvider value={myCache}>
    <Provider {...rootStore} rootStore={rootStore}>
      {/*
      // @ts-ignore */}
      <ToastProvider ref={rootStore.pageStore.toastRef}>
        <Router history={history}>
          <App />
        </Router>
      </ToastProvider>
    </Provider>
  </CacheProvider>
  , document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
