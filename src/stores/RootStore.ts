import { PlayerStore } from './PlayerStore';
import CommonStore from './CommonStore';
import { RouterStore } from 'mobx-react-router';
import PageStore from './PageStore';

export default class RootStore {
  public readonly routerStore = new RouterStore();
  public readonly pageStore = new PageStore(this);
  public readonly commonStore = new CommonStore(this);
  public readonly playerStore = new PlayerStore(this);
}
