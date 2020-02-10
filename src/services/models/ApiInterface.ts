export enum RequestType {
  Ping = 'Ping',
  Authenticate = 'Authenticate',
  GetPlaylist = 'GetPlaylist',
  GetPlaylistItemsById = 'GetPlaylistItemsById',
  MovePlaylistItem = 'MovePlaylistItem',
  AddRelatedVideos = 'AddRelatedVideos',
  SetIsPlaying = 'SetIsPlaying',
  ReturnVolume = 'ReturnVolume',
}

export enum EventType {
  PlaylistItemCreated = 'PlaylistItemCreated',
  ItemDownloaded = 'ItemDownloaded',
  VolumeRequested = 'VolumeRequested',
  VolumeSetRequested = 'VolumeSetRequested',
}

export interface IRequest {
  sessionId?: string;
  ts?: number;
  type: RequestType;
  token?: string;
  data: any;
}

export interface IReply {
  ts: number;
  ok: boolean;
  content: any;
}
