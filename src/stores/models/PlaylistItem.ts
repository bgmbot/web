import { BASE_URL } from './../../constants';
import { ItemSource, Item } from './Item';
import Entity from './Entity';
import { computed, action } from 'mobx';
import { DateTime } from 'luxon';

export enum PlaylistItemState {
  NotPlayedYet = 'NOT_PLAYED_YET',
  NowPlaying = 'NOW_PLAYING',
  Played = 'PLAYED',
}

export interface PlaylistItemSource {
  id: number;
  nextPlaylistItemId: number;
  channel: String;
  slackNotificationIds: any;
  state: PlaylistItemState;
  isDeleted: boolean;
  isReady: boolean;
  itemId: string;
  userId: string;
  item: ItemSource;
  createdAt: string;
  updatedAt: string;
}

export class PlaylistItem extends Entity<PlaylistItemSource> {
  @computed
  public get state() {
    return this.source.state;
  }

  @computed
  public get isPlaying() {
    return this.source.state === PlaylistItemState.NowPlaying;
  }

  @computed
  public get isDeleted() {
    return this.source.isDeleted;
    }

  @action
  public setState(state: PlaylistItemState) {
    this.source.state = state;
  }

  @computed
  public get createdAt() {
    return DateTime.fromISO(this.source.createdAt);
  }

  @computed
  public get item() {
    return new Item(this.source.item.id, this.source.item);
  }

  @computed
  public get itemId() {
    return this.source.itemId;
  }

  @computed
  public get title() {
    return this.item.title;
  }

  @computed
  public get streamLink() {
    return `${BASE_URL}/items/${this.item.id}`;
  }

  @computed
  public get isReady() {
    return this.source.isReady;
  }

  @computed
  public get nextId() {
    return this.source.nextPlaylistItemId;
  }
}
