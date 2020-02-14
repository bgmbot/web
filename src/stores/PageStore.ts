import React from 'react';
import RootStore from './RootStore';
import { observable, action, when, computed } from 'mobx';
import SearchOptions from './models/SearchOptions';
import { useToasts } from 'react-toast-notifications';
import { withScope, captureEvent, Severity } from '@sentry/browser';

type AddToast = ReturnType<typeof useToasts>['addToast'];

export default class PageStore {
  public constructor(
    public readonly rootStore: RootStore,
  ) { }

  public get communicator() {
    return this.rootStore.commonStore.communicator;
  }

  @observable
  public toastRef: React.RefObject<any>;

  @observable
  public showSearchModal = false;

  @observable
  public searchOptions = new SearchOptions();

  @action
  public setToastRef(ref: any) {
    this.toastRef = ref;
  }

  @action
  public setSearchModalVisibility(visible = true) {
    this.showSearchModal = visible;
  }

  @action
  public setSearchOptions(searchOptions: SearchOptions) {
    this.searchOptions = searchOptions;
  }

  @computed
  public get isToastRefSet() {
    return !!this.toastRef;
  }

  public async showToast(...args: Parameters<AddToast>) {
    await when(() => this.isToastRefSet);

    if (args.length > 2 && args[1]) {
      const options = args[1];
      if (options.appearance === 'error') {
        withScope(scope => {
          scope.setFingerprint(['TOAST', 'ERROR']);

          const eventId = captureEvent({
            message: args[0] as any as string,
            level: Severity.Log,
          });
          console.warn('event', eventId);
        });
      }
    }

    this.toastRef.current?.add(...args);
  }
}
