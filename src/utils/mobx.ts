import React from 'react';
import * as mobxReact from 'mobx-react';
import { MobXProviderContext, useObserver } from 'mobx-react';
import RootStore from '../stores/RootStore';

type Store = typeof RootStore;
type StoreName = keyof RootStore;

export const useStores = () => React.useContext<{ [key in StoreName]: RootStore[key] }>(MobXProviderContext as any);
export const useStore = <S extends StoreName, T = RootStore[S]>(storeName: S): T => {
  const stores = useStores();
  if (!(storeName in stores)) {
    throw new Error();
  }

  return Reflect.get(stores, storeName);
}

type UseObserverParams = Parameters<typeof mobxReact['useObserver']>;

/**
 * @example const { appLoaded } = useStoreObserver('authStore', (authStore) => ({ appLoaded: authStore.appLoaded }));
 */
export function useStoreObserver<S extends StoreName, T = RootStore[S], K = any>(storeName: S, fn: (store: T) => K, baseComponentName?: string, options?: UseObserverParams['2']): K {
  const store = useStore(storeName);

  return useObserver(() => (fn as any)(store), baseComponentName, options);
}
