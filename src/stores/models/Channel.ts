import Entity from './Entity';
import { computed } from 'mobx';

export interface ChannelSource {
  id: string;
  name: string;
  alias: string;
  superuser: string;
}

export default class Channel extends Entity<ChannelSource> {
  @computed
  public get name() {
    return this.source.alias;
  }

  @computed
  public get realname() {
    return this.source.name;
  }

  @computed
  public get channelId() {
    return this.source.id;
  }

  @computed
  public get link() {
    return `https://slack.com/app_redirect?channel=${this.channelId}`;
  }
}
