import { observable, action } from 'mobx';
import RootStore from './RootStore';

interface PlayerProgress {
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
  }

  @action
  public setVolume(volume: number) {
    console.info('volume updated', volume);
    this.volume = volume;
  }
}
