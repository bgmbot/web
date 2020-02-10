import React from 'react';
import RootStore from './RootStore';
import { observable, action, when, computed } from 'mobx';
import { useToasts } from 'react-toast-notifications';

type AddToast = ReturnType<typeof useToasts>['addToast'];

export default class PageStore {
  public constructor(
    public readonly rootStore: RootStore,
  ) {}

  @observable
  public toastRef: React.RefObject<any>;

  @action
  public setToastRef(ref: any) {
    this.toastRef = ref;
  }

  @computed
  public get isToastRefSet() {
    return !!this.toastRef;
  }

  public async showToast(...args: Parameters<AddToast>) {
    await when(() => this.isToastRefSet);
    this.toastRef.current?.add(...args);
  }
}
