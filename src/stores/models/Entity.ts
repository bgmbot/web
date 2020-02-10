import { observable, action, toJS } from 'mobx';
import * as _ from 'lodash';

abstract class Entity<T> {
  @observable public id: string | number;
  @observable protected source: T;

  public constructor(id: string | number, source: T) {
    this.id = id;
    this.source = source;
  }

  @action
  public update(source: T) {
    this.source = source;
  }

  @action
  public updatePartial(source: Partial<T>) {
    const newSource = _.cloneDeep(this.source);
    this.source = _.mergeWith(newSource, source);
  }

  public getSource(): T {
    return toJS(this.source);
  }
}

export default Entity;
