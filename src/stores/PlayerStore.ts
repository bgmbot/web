import { observable, action } from 'mobx';
import * as _ from 'lodash';
import RootStore from './RootStore';

export interface PlayerProgress {
  playedSeconds: number;
  played: number;
  loadedSeconds: number;
  loaded: number;
}

export class PlayerStore {
  public constructor(
    public rootStore: RootStore,
  ) { }

  private get commonStore() {
    return this.rootStore.commonStore;
  }

  private get communicator() {
    return this.commonStore.communicator;
  }

  @observable
  public playing = true;

  @observable
  public volume = 1;

  @observable
  public progress: PlayerProgress;

  @action
  public setProgress(progress: any) {
    this.progress = progress;

    if (this.commonStore.hasAdminPermission && this.communicator.isConnected) {
      this.communicator.broadcastProgress(progress).catch(() => { });
    }
  }

  public setVolume = _.debounce(action((volume: number) => {
    if (this.volume === volume) {
      return;
    }

    console.info('volume updated', volume);
    this.volume = volume;

    this.rootStore.pageStore.showToast(`볼륨이 ${Math.round(volume * 100)}%로 설정되었습니다.`, {
      appearance: 'info',
      autoDismiss: true,
    });
  }).bind(this), 500);
}
