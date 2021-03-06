import { configureScope } from '@sentry/browser';
import { MessageBox } from 'element-react';
import { action, computed, observable, reaction, when, runInAction } from 'mobx';
import uuid from 'uuid';

import Communicator from '../services/Communicator';
import { reorder } from './../utils/array';
import Channel from './models/Channel';
import { ItemSource } from './models/Item';
import { PlaylistItem, PlaylistItemSource, PlaylistItemState } from './models/PlaylistItem';
import User from './models/User';
import RootStore from './RootStore';

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

  public get playerStore() {
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
  public role: 'admin' | 'staff' | 'user' = 'user';

  @computed
  public get hasAdminPermission() {
    return this.role === 'admin';
  }

  public get hasStaffPermission() {
    return this.role === 'staff';
  }

  @observable
  public channel: Channel;

  @observable
  public playlist: PlaylistItem[] = [];

  @computed
  public get availablePlaylist() {
    return this.playlist.filter(({ isDeleted }) => !isDeleted);
  }

  @observable
  public isLoading = false;

  @observable
  public isUpdatingPlaylist = false;

  @action
  public updatePlaylist(sources: PlaylistItemSource[]) {
    this.playlist = sources.map((source) => {
      const item = this.playlist.find(x => x.id === source.id);
      if (item) {
        item.update(source);
        return item;
      } else {
        return new PlaylistItem(source.id, source);
      }
    });
  }

  @action
  public async authenticate() {
    const result = await this.communicator.authenticate(this.token);
    if (!result?.ok) {
      this.setIsAuthenticated(false);

      let content = result?.content;
      if (result?.content === 'jwt must be provided') {
        content = '/bgmplayer로 접근해주세요! (인증 토큰 없음)';
      } else if (result?.content === 'invalid signature') {
        content = '/bgmplayer로 다시 접근해주세요! (인증 토큰 만료)';
      } else if (result?.content === 'jwt expired') {
        content = '/bgmplayer로 다시 접근해주세요! (인증 토큰 만료)';
      }

      MessageBox.alert(content, '로그인 오류', { type: 'error' });
      return;
    }

    const { user, channel, isChannelOwner, isPlayer } = result?.content;


    runInAction(() => {
      this.user = new User(user.id, user);
      this.channel = new Channel(channel.id, channel);

      this.role = isPlayer ? 'admin' : isChannelOwner ? 'staff' : 'user';
      this.isAuthenticated = true;
    });

    configureScope((scope) => {
      scope.setUser({
        id: this.user.id as string,
        username: this.user.name,
      });
      scope.setTag('bgm:channel', channel);
      scope.setExtra('role', this.role);
      scope.setExtra('isChannelOwner', isChannelOwner);
      scope.setExtra('isPlayer', isPlayer);
      scope.setTag('isAuthenticated', 'true');
    });

    switch (this.role) {
      case 'admin':
        this.pageStore.showToast('플레이어로 로그인되었습니다.', {
          appearance: 'info',
          autoDismiss: true,
        });
        break;

      case 'staff':
        this.pageStore.showToast('이미 다른 곳에서 플레이어가 동작하고 있어 수정 전용 모드로 동작합니다.', {
          appearance: 'info',
          autoDismiss: true,
        });
        break;

      case 'user':
        this.pageStore.showToast('안녕하세요! :)', {
          appearance: 'info',
          autoDismiss: true,
        });
        break;
    }
  }

  @action
  public async fetchAndUpdatePlaylist() {
    await when(() => !this.isUpdatingPlaylist);

    this.setIsLoading(true);
      runInAction(() => {
        this.isUpdatingPlaylist = true;
      });

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

      console.info(this.availablePlaylist.length, this.nowPlaying);
      if (this.availablePlaylist.length === 1 && this.nowPlaying === null) {
        await this.setIsPlaying(this.availablePlaylist[0].id as number);
      }
    } catch (e) {
      return this.pageStore.showToast(e.message, {
        appearance: 'error',
        autoDismiss: true,
      });
    } finally {
      this.setIsLoading(false);
      runInAction(() => {
        this.isUpdatingPlaylist = false;
      });
    }
  }

  @action
  public async addRelatedVideos(itemId: string, count = 1, excludingVideoIdCandidates?: string[]) {
    await when(() => !this.isLoading);
    this.setIsLoading(true);

    try {
      const result = await this.communicator.addRelatedVideos(itemId, count, excludingVideoIdCandidates);
      if (!result?.ok) {
        return this.pageStore.showToast(result?.content, {
          appearance: 'error',
          autoDismiss: true,
        });
      }

      const addeds = result.content;
      if (Array.isArray(addeds) && addeds.length > 0) {
        this.pageStore.showToast(`연관 음악 ${addeds.length}개가 추가되었습니다.`, {
          appearance: 'info',
          autoDismiss: true,
        });

        this.setIsLoading(false);
        this.fetchAndUpdatePlaylist();
      }
    } catch (e) {
      return this.pageStore.showToast(e.message, {
        appearance: 'error',
        autoDismiss: true,
      });
    } finally {
      this.setIsLoading(false);
    }
  }

  @action
  public async movePlaylistItem(id: number, moveBefore: number | null) {
    this.setIsLoading(true);

    const aIndex = this.playlist.findIndex(x => x.id === id);
    let bIndex = moveBefore === null ? this.playlist.length - 1 : this.playlist.findIndex(x => x.id === moveBefore);
    if (bIndex === -1) {
      bIndex = 0;
    } else if (moveBefore && bIndex > aIndex) {
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
      this.setIsLoading(false);
    }
  }

  @computed
  public get nowPlayingIndex() {
    return this.availablePlaylist.findIndex(x => x.isPlaying);
  }

  @computed
  public get nowPlaying() {
    return this.availablePlaylist.find(x => x.isPlaying) ?? null;
  }

  public playNextPlaylistItem() {
    const next = this.getNextPlaylistItem();

    if (next) {
      this.setIsPlaying(next.id as number);
    }
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
        this.pageStore.showToast(`"${next.title}" 곡은 재생목록에서 삭제된 곡입니다. 다음 곡을 재생합니다.`, {
          appearance: 'warning',
          autoDismiss: true,
        });
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
  public setIsAuthenticated(value: boolean) {
    this.isAuthenticated = value;
  }

  @action
  public setIsReady(itemId: string) {
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
    const item = this.availablePlaylist.find(x => x.id === id);
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
      this.setIsLoading(true);

      const result = await this.communicator.setIsPlaying(item.id as number);
      if (!result?.ok) {
        return this.pageStore.showToast(result?.content, {
          appearance: 'error',
          autoDismiss: true,
        });
      }
    } catch (e) {
      this.pageStore.showToast(e.message, {
        appearance: 'error',
        autoDismiss: true,
      });
    } finally {
      this.setIsLoading(false);
    }

    try {
      await this.fetchAndUpdatePlaylist();

      const itemIndex = this.availablePlaylist.findIndex(({ id }) => id === item.id);
      if (itemIndex > -1 && itemIndex >= this.availablePlaylist.length - 2) {
        const playlistItemIndex = this.playlist.findIndex(({ id }) => id === item.id);
        const targetFromIndex = Math.max(0, playlistItemIndex - 6);
        const targetToIndex = Math.min(this.playlist.length - 1, targetFromIndex + 5);
        const excludingVideoIdCandidates = this.playlist.slice(targetFromIndex, targetToIndex).map(x => x.item.videoId);

        console.info('addRelatedVideos called w/', item.id);
        this.addRelatedVideos(item.itemId, 1, excludingVideoIdCandidates);
      }
    } catch { }
  }

  @action
  public async deletePlaylistItem(id: number) {
    this.setIsLoading(true);

    try {
      const result = await this.communicator.deletePlaylistItem(id);
      if (!result?.ok) {
        return this.pageStore.showToast(result?.content, {
          appearance: 'error',
          autoDismiss: true,
        });
      }
      if (result?.content === true) {
        await this.fetchAndUpdatePlaylist();
        return this.pageStore.showToast('곡이 삭제되었습니다.', {
          appearance: 'success',
          autoDismiss: true,
        });
      }
    } catch (e) {
      return this.pageStore.showToast(e.message, {
        appearance: 'error',
        autoDismiss: true,
      });
    } finally {
      this.setIsLoading(false);
    }
  }

  @action
  public async addPlaylistItem(link: string) {
    this.setIsLoading(true);

    try {
      const result = await this.communicator.addPlaylistItem(link);
      if (!result?.ok) {
        return this.pageStore.showToast(result?.content, {
          appearance: 'error',
          autoDismiss: true,
        });
      }

      if (result?.content) {
        const {
          item,
        } = result?.content as {
            item: ItemSource;
            playlistItem: PlaylistItemSource;
        };

        await this.fetchAndUpdatePlaylist();
        return this.pageStore.showToast(`"${item.title}" 곡이 플레이리스트에 추가되었습니다.`, {
          appearance: 'success',
          autoDismiss: true,
        });
      }
    } catch (e) {
      return this.pageStore.showToast(e.message, {
        appearance: 'error',
        autoDismiss: true,
      });
    } finally {
      this.setIsLoading(false);
    }
  }
}
