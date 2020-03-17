import Entity from './Entity';
import { computed } from 'mobx';

export enum ItemState {
  JustAdded = 'JUST_ADDED',
  Downloading = 'DOWNLOADING',
  Prepared = 'PREPARED',
}

export interface ItemSource {
  id: number;
  state: ItemState;
  link: string;
  title: string;
  info: any;
  videoId: string;
  thumbnailUrl: string;
  filename: string;
  duration: number;
  downloadStartedAt: string;
  downloadEndedAt: string;
  createdAt: string;
  updatedAt: string;
}

export class Item extends Entity<ItemSource> {
  @computed
  public get title() {
    return this.source.title || '';
  }

  @computed
  public get link() {
    return this.source.link;
  }

  @computed
  public get thumbnailUrl() {
    return this.source.thumbnailUrl;
  }

  @computed
  public get videoId() {
    return this.source.videoId;
  }

  @computed
  public get state() {
    return this.source.state;
  }

  @computed
  public get duration() {
    return this.source.duration || Number(this.source.info?.length_seconds) || null;
  }
}
