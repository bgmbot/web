import Entity from './Entity';
import { computed } from 'mobx';

export interface UserSource {
  id: string;
  username: string;
  name: string;
  slackImChannelId: string;
  allowedChannels: string[];
  ownedChannels: string[];
  createdAt: string;
  updatedAt: string;
}

export default class User extends Entity<UserSource> {
  @computed
  public get name() {
    return this.source.name.split(' ').reverse().join('');
  }
}
