import { PlayerProgress } from './../stores/PlayerStore';
import { IRequest, IReply, RequestType, EventType } from './models/ApiInterface';
import { SERVICE_URL } from './../constants';
import { observable, action, when, isObservableObject, toJS, computed, reaction, runInAction } from 'mobx';
import bluebird from 'bluebird';
import CommonStore from '../stores/CommonStore';
import { captureException } from '@sentry/browser';

export default class Communicator {
  private connection!: WebSocket;
  private isConnectedOnce = false;

  public constructor(
    private readonly commonStore: CommonStore,
  ) {
    this.connection = new WebSocket(SERVICE_URL);
    this.connection.binaryType = 'blob';
    this.connection.onmessage = this.onMessage.bind(this);
    this.connection.onclose = this.onClose.bind(this);

    let interval: NodeJS.Timeout;
    reaction(() => this.isConnected, (value) => {
      if (value) {
        if (this.isConnectedOnce) {
          this.commonStore.authenticate();
        }

        interval = setInterval(() => {
          const now = Date.now();
          this.request({
            type: RequestType.Ping,
            data: {},
          }).then(() => {
            runInAction(() => {
              this.ping = Date.now() - now;
            });
          });
        }, 5000);

        this.isConnectedOnce = true;
      } else {
        clearInterval(interval);
      }
    });
  }

  @observable
  public ping: number = 0;

  @action
  public async onClose() {
    await bluebird.delay(1000);
    this.isConnected = false;

    this.connection = new WebSocket(SERVICE_URL);
    this.connection.onmessage = this.onMessage.bind(this);
    this.connection.onclose = this.onClose.bind(this);
  }

  @action
  private async send(request: IRequest) {
    await when(() => this.isReady);
    this.connection.send(JSON.stringify(request));
  }

  @observable
  public sessionId: string;

  @action
  public setSessionId(sessionId: string) {
    this.sessionId = sessionId;
  }

  @observable
  public isConnected = false;

  @action
  public setConencted(value = true) {
    this.isConnected = value;
  }

  @computed
  public get isReady() {
    return this.isConnected && this.sessionId?.length > 0;
  }

  @observable
  private readonly messages = new Map<number, IReply>();

  @action
  private async onMessage(ev: MessageEvent) {
    let text: string;
    if (typeof ev.data.text === 'function') {
      text = await ev.data.text();
    } else {
      text = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve(reader.result as string);
        };
        reader.readAsText(ev.data);
      });
    }

    const reply = JSON.parse(text) as IReply;
    if ((reply as any).ready === true) {
      this.setConencted();
      return;
    }

    if (reply.ts === -1) {
      this.handleEvent(reply);
    }

    this.messages.set(reply.ts, reply);
  }

  private async handleEvent(reply: IReply) {
    const { event } = reply.content;

    console.info('event', event);

    switch (event) {
      case EventType.PlaylistItemCreated:
        await bluebird.delay(1000);
        this.commonStore.fetchAndUpdatePlaylist();
        break;

      case EventType.ItemDownloaded:
        this.commonStore.setIsReady(reply.content.id);
        break;

      case EventType.PlaylistUpdated:
        this.commonStore.fetchAndUpdatePlaylist();
        break;

      case EventType.PlayerProgressUpdated:
        this.commonStore.playerStore.setProgress(reply.content.progress);
        break;

      case EventType.VolumeRequested:
        this.request({
          type: RequestType.ReturnVolume,
          data: {
            volume: this.commonStore.playerStore.volume,
            token: reply.content.token,
          },
        }).catch(captureException);
        break;

      case EventType.VolumeSetRequested:
        this.commonStore.playerStore.setVolume(reply.content.volume);
        break;
    }
  }

  @action
  private async request(req: IRequest, timeoutMs = 5000) {
    const request = {
      ...req,
      sessionId: this.sessionId,
      ts: Date.now(),
    };
    const whenPromise = when(() => this.messages.has(request.ts));
    const promise = Promise.race([
      whenPromise.catch((e) => {
        if (String(e).includes('WHEN_CANCELLED')) {
          return Promise.reject(new Error(`${request.ts}(${request.type}) 요청 시간 초과 (${timeoutMs}초)`));
        }
      }),
      bluebird.delay(timeoutMs).then(() => whenPromise.cancel()),
    ]);

    await this.send(request);
    await promise;

    const value = this.messages.get(request.ts);
    this.messages.delete(request.ts);

    return isObservableObject(value) ? toJS(value) : value;
  }

  public async authenticate(token: string) {
    return this.request({
      type: RequestType.Authenticate,
      token,
      data: {},
    });
  }

  @action
  public async getPlaylist() {
    return this.request({
      type: RequestType.GetPlaylist,
      data: {},
    });
  }

  @action
  public async movePlaylistItem(id: number, moveBefore: number | null) {
    return this.request({
      type: RequestType.MovePlaylistItem,
      data: {
        id,
        moveBefore,
      },
    });
  }

  @action
  public async setIsPlaying(id: number) {
    return this.request({
      type: RequestType.SetIsPlaying,
      data: {
        id,
      },
    });
  }

  @action
  public async addRelatedVideos(itemId: number, count = 1) {
    return this.request({
      type: RequestType.AddRelatedVideos,
      data: {
        itemId,
        count,
      },
    });
  }

  public async deletePlaylistItem(playlistItemId: number) {
    return this.request({
      type: RequestType.DeletePlaylistItem,
      data: {
        playlistItemId,
      },
    });
  }

  public async searchRelatedVideos(itemId: number) {
    return this.request({
      type: RequestType.SearchRelatedVideos,
      data: {
        itemId,
      },
    });
  }

  public async addPlaylistItem(link: string) {
    return this.request({
      type: RequestType.AddPlaylistItem,
      data: {
        link,
      },
    });
  }

  public async broadcastProgress(progress: PlayerProgress) {
    return this.request({
      type: RequestType.BroadcastProgress,
      data: {
        progress,
      },
    });
  }

  public async getAutoCompletionKeywords(keyword: string) {
    return this.request({
      type: RequestType.GetAutoCompletionKeywords,
      data: {
        keyword,
      },
    });
  }

  public async search(keyword: string) {
    return this.request({
      type: RequestType.Search,
      data: {
        keyword,
      },
    });
  }
}
