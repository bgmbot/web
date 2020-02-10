import { observable, computed } from 'mobx';

export enum SearchOptionsMode {
  ItemId,
}

export enum SearchFor {
  RelatedVideos,
}

export default class SearchOptions {
  @observable
  public by = SearchOptionsMode.ItemId;

  @observable
  public for = SearchFor.RelatedVideos;

  @observable
  public itemId: number;

  @computed
  public get title() {
    if (this.by === SearchOptionsMode.ItemId && this.for === SearchFor.RelatedVideos) {
      return '연관곡 추가하기';
    }

    return '';
  }
}
