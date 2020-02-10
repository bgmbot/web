import { reorder } from './../utils/array';
import { MessageBox } from 'element-react';
import { PlaylistItem, PlaylistItemSource, PlaylistItemState } from './models/PlaylistItem';
import RootStore from './RootStore';
import Communicator from '../services/Communicator';

import { observable, action, reaction, computed } from 'mobx';
import User from './models/User';
import Channel from './models/Channel';
import uuid from 'uuid';

export default class CommonStore {
  public readonly communicator = new Communicator(this);

  public constructor(
    public readonly rootStore: RootStore,
  ) {
    reaction(() => this.sessionId, (sessionId) => this.communicator.sessionId = sessionId);

    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = uuid.v4();
      sessionStorage.setItem('sessionId', sessionId);
    }

    this.sessionId = sessionId;
  }

  private get playerStore() {
    return this.rootStore.playerStore;
  }

  private get pageStore() {
    return this.rootStore.pageStore;
  }

  @computed
  public get ping() {
    return this.communicator.ping;
  }

  @computed
  public get isOnline() {
    return this.communicator.isReady;
  }

  @observable
  public token: string = localStorage.getItem('token') || '';

  @observable
  public sessionId: string;

  @action
  public setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  @observable
  public isAuthenticated = false;

  @observable
  public user: User;

  @observable
  public channel: Channel;

  @observable
  public playlist: PlaylistItem[] = [];

  @observable
  public isLoading = false;

  // TODO: try to find a item with id and update
  @action
  public async updatePlaylist(sources: PlaylistItemSource[]) {
    this.playlist = sources.map(source => new PlaylistItem(source.id, source));
  }

  @action
  public async authenticate() {
    const result = await this.communicator.authenticate(this.token);
    if (!result?.ok) {
      this.isAuthenticated = false;
      MessageBox.alert(result?.content, '인증 오류', { type: 'error' });
      return;
    }

    const { user, channel } = result?.content;

    this.user = new User(user.id, user);
    this.channel = new Channel(channel.id, channel);

    this.isAuthenticated = true;
  }

  @action
  public async fetchAndUpdatePlaylist() {
    this.isLoading = true;

    try {
      const result = await this.communicator.getPlaylist();
      if (!result?.ok) {
        return this.pageStore.showToast(result?.content, {
          appearance: 'error',
          autoDismiss: true,
        });
      }

      const data = result?.content as {
        previousPlaylistItems: PlaylistItemSource[];
        nowPlaying: PlaylistItemSource | null;
        nextPlaylistItems: PlaylistItemSource[];
      };

      const playlist = [
        ...data.previousPlaylistItems,
        data.nowPlaying,
        ...data.nextPlaylistItems,
      ].filter(x => x !== null) as PlaylistItemSource[];
      this.updatePlaylist(playlist);
    } catch (e) {
      return this.pageStore.showToast(e.message, {
        appearance: 'error',
        autoDismiss: true,
      });
    } finally {
      this.isLoading = false;
    }
  }

  @action
  public async movePlaylistItem(id: number, moveBefore: number | null) {
    this.isLoading = true;

    const aIndex = this.playlist.findIndex(x => x.id === id);
    let bIndex = moveBefore === null ? this.playlist.length - 1 : this.playlist.findIndex(x => x.id === moveBefore);
    if (bIndex === -1) {
      bIndex = 0;
    } else if (bIndex > aIndex) {
      bIndex -= 1;
    }
    const back = () => {
      this.playlist = reorder(this.playlist, bIndex, aIndex);
    };
    try {
      // this.playlist = moveArrayElement(this.playlist, aIndex, bIndex);
      this.playlist = reorder(this.playlist, aIndex, bIndex);

      const result = await this.communicator.movePlaylistItem(id, moveBefore);
      if (!result?.ok) {
        back();
        return this.pageStore.showToast(result?.content, {
          appearance: 'error',
          autoDismiss: true,
        });
      }

      if (result?.content === true) {
        await this.fetchAndUpdatePlaylist();
        return this.pageStore.showToast('플레이리스트 순서가 변경되었습니다.', {
          appearance: 'success',
          autoDismiss: true,
        });
      } else {
        back();
        return this.pageStore.showToast('플레이리스트 순서가 변경에 실패했습니다.', {
          appearance: 'warning',
          autoDismiss: true,
        });
      }
    } catch (e) {
      return this.pageStore.showToast(e.message, {
        appearance: 'error',
        autoDismiss: true,
      });
    } finally {
      this.isLoading = false;
    }
  }

  @computed
  public get nowPlayingIndex() {
    return this.playlist.findIndex(x => x.isPlaying);
  }

  @computed
  public get nowPlaying() {
    return this.playlist.find(x => x.isPlaying);
  }

  public getNextPlaylistItem() {
    const { nowPlaying } = this;
    if (!nowPlaying) {
      return null;
    }

    let next: PlaylistItem | undefined = nowPlaying;
    // eslint-disable-next-line no-loop-func
    while ((next = this.playlist.find(x => x.id === next?.nextId)) !== undefined) {
      if (!next.isReady) {
        this.pageStore.showToast(`"${next.title}" 곡이 아직 다운로드되지 않아 다음 곡을 재생합니다.`, {
          appearance: 'warning',
          autoDismiss: true,
        });
        continue;
      }
      if (next.isDeleted) {
        continue;
      }

      return next;
    }

    return null;
  }

  @action
  public setIsLoading(value = true) {
    this.isLoading = value;
  }

  @action
  public setIsReady(itemId: number) {
    const targets = this.playlist.filter(({ itemId: id }) => id === itemId);
    // const indicies = targets.map((x) => this.playlist.findIndex((y) => x === y));

    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      target.updatePartial({
        isReady: true,
      });
      console.info('setIsReady', target.isReady);
    }
  }

  @action
  public async setIsPlaying(id: number) {
    const item = this.playlist.find(x => x.id === id);
    if (!item) {
      return this.pageStore.showToast(`재생 설정에 실패했습니다. (존재하지 않는 항목: ${id})`, {
        appearance: 'warning',
        autoDismiss: true,
      });
    }

    const { nowPlaying } = this;
    nowPlaying?.setState(PlaylistItemState.Played);
    item.setState(PlaylistItemState.NowPlaying);

    // TODO: request
    try {
      this.isLoading = true;

      await this.communicator.setIsPlaying(item.id as number);
    } catch (e) {
      this.pageStore.showToast(e.message, {
        appearance: 'error',
        autoDismiss: true,
      });
    } finally {
      this.isLoading = false;
    }

    this.fetchAndUpdatePlaylist();
  }
}
