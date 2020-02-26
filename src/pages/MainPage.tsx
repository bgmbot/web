import { css } from '@emotion/core';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useEffect, useState } from 'react';
import Player from 'react-player';

import Header from '../components/Header';
import Layout from '../components/Layout';
import Playlist from '../components/Playlist';
import { useStore, useStoreObserver } from '../utils/mobx';
import Helmet from 'react-helmet';
import SearchModal from '../components/SearchModal';
import FakePlayer from '../components/FakePlayer';


const MainPage = () => {
  const {
    playlist,
    isLoading,
    nowPlaying,
    role,
  } = useStoreObserver('commonStore', (store) => ({
    playlist: store.availablePlaylist,
    isLoading: store.isLoading,
    nowPlaying: store.nowPlaying,
    role: store.role,
  }));

  const {
    showSearchModal,
  } = useStoreObserver('pageStore', (store) => ({
    showSearchModal: store.showSearchModal,
  }));

  const {
    volume,
    progress,
  } = useStoreObserver('playerStore', (store) => ({
    volume: store.volume,
    progress: store.progress,
  }));

  const commonStore = useStore('commonStore');
  useEffect(() => {
    commonStore.fetchAndUpdatePlaylist();
  }, [commonStore]);
  const { user, channel } = commonStore;

  const playerStore = useStore('playerStore');

  const onItemMove = useCallback((id, moveBefore) => {
    commonStore.movePlaylistItem(id, moveBefore);
  }, [commonStore]);

  const onProgress = useCallback((progress) => {
    playerStore.setProgress(progress);
  }, [playerStore]);

  const onEnded = useCallback(() => {
    const next = commonStore.getNextPlaylistItem();

    console.info('next', next);
    if (next) {
      commonStore.setIsPlaying(next.id as number);
    }
  }, [commonStore]);

  const [title, setTitle] = useState('브금냥');
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);

  const playerRef = React.createRef<Player>();
  const onVolumeChange = useCallback(() => {
    playerStore.setVolume(video!.volume);
  }, [playerStore, video]);

  useEffect(() => {
    if (playerRef.current) {
      setVideo(playerRef.current.getInternalPlayer() as any);
    }
  }, [playerRef]);
  useEffect(() => {
    if (video) {
      video.onvolumechange = onVolumeChange;
      try {
        video.src && video.play();
      } catch { }
    }
  }, [video, onVolumeChange]);
  useEffect(() => {
    if (nowPlaying) {
      setTitle(`브금냥 - ${nowPlaying.title}`);
    } else {
      setTitle('브금냥');
    }
  }, [nowPlaying]);

  return (
    <React.Fragment>
      {showSearchModal && <SearchModal />}
      <Layout showLoading={isLoading}>
        <Helmet>
          <title>{title}</title>
        </Helmet>
        <Header user={user} channel={channel} role={role} />
        {role === 'admin'
          ? <Player
            ref={playerRef}
            loop={false}
            width="100%"
            height="30px"
            url={nowPlaying?.streamLink}
            volume={volume}
            playing={true}
            controls={true}
            onProgress={onProgress}
            onEnded={onEnded}
            onSeek={console.log}
            css={css`
          margin: 0 0 10px;
          `} />
          : <FakePlayer progress={progress} nowPlaying={nowPlaying} />
          }
        {playlist.length > 0
          ? <Playlist playlist={playlist} onItemMove={role !== 'user' ? onItemMove : undefined} role={role} />
          : isLoading ? <div /> : <div style={{ textAlign: 'center' }}><FontAwesomeIcon icon={faTrash} /> 플레이리스트가 비어있어요.</div>}
      </Layout>
    </React.Fragment>
  );
}

export default MainPage;
