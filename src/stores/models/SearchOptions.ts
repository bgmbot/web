import { observable, computed } from 'mobx';

export enum SearchOptionsMode {
  ItemId,
  Keyword,
}

export enum SearchFor {
  RelatedVideos,
  Videos,
}

export default class SearchOptions {
  @observable
  public by = SearchOptionsMode.Keyword;

  @observable
  public for = SearchFor.Videos;

  @observable
  public itemId: number;

  @computed
  public get title() {
    if (this.by === SearchOptionsMode.ItemId && this.for === SearchFor.RelatedVideos) {
      return '연관곡 추가하기';
    } else if (this.by === SearchOptionsMode.Keyword && this.for === SearchFor.Videos) {
      return '곡 추가하기';
    }

    return '';
  }
}
