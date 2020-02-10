import React, { useCallback, useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { PlaylistItem as Item } from '../stores/models/PlaylistItem';
import PlaylistItem from './PlaylistItem';
import styled from '@emotion/styled';
import { useStoreObserver } from '../utils/mobx';
import uuid from 'uuid';

const PlaylistStyle = styled.div`
height: auto;
overflow-y: auto;

/* Turn on custom 8px wide scrollbar */
::-webkit-scrollbar {
  width: 10px; /* 1px wider than Lion. */
  /* This is more usable for users trying to click it. */
  background-color: rgba(0,0,0,0);
  border-radius: 100px;
}
/* hover effect for both scrollbar area, and scrollbar 'thumb' */
::-webkit-scrollbar:hover {
  background-color: rgba(0, 0, 0, 0.09);
}

/* The scrollbar 'thumb' ...that marque oval shape in a scrollbar */
::-webkit-scrollbar-thumb:vertical {
  /* This is the EXACT color of Mac OS scrollbars.
     Yes, I pulled out digital color meter */
  background: rgba(0,0,0,0.5);
  border-radius: 100px;
  background-clip: padding-box;
  border: 2px solid rgba(0, 0, 0, 0);
  min-height: 10px; /*Prevent it from getting too small */
}
::-webkit-scrollbar-thumb:vertical:active {
  background: rgba(0,0,0,0.61); /* Some darker color when you click it */
  border-radius: 100px;
}
`;

interface PlaylistProps {
  playlist: Item[];
  onItemMove?: (id: number, moveBefore: number | null) => void;
}


const Playlist: React.FC<PlaylistProps> = (props) => {
  const playlistId = uuid.v4();

  const onDragEnd = useCallback((result: DropResult) => {
    if (result.reason === 'CANCEL' || !result.destination || result.source.index === result.destination.index) {
      return;
    }

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    console.info(sourceIndex, destinationIndex);

    const source = props.playlist[sourceIndex];
    let next = props.playlist[destinationIndex + 1];
    if (source === next || sourceIndex - destinationIndex > 1) {
      next = props.playlist[destinationIndex];
    }

    props.onItemMove?.(source.id as number, (next?.id ?? null) as number | null);
  }, [props.playlist, props.onItemMove]);

  const [nowPlayingIndexState, setNowPlayingIndexState] = useState(-1);
  const { nowPlayingIndex } = useStoreObserver('commonStore', (store) => ({
    nowPlayingIndex: store.nowPlayingIndex,
  }));
  useEffect((...args) => {
    const div = document.getElementById(playlistId);
    if (div && nowPlayingIndex !== nowPlayingIndexState) {
      setNowPlayingIndexState(nowPlayingIndex);
      div.scrollTo({
        top: Math.max(0, 35 * nowPlayingIndex - 35),
        behavior: 'smooth',
      });
    }
  }, [nowPlayingIndex, nowPlayingIndexState, playlistId]);

  return (
    <DragDropContext
      onDragEnd={onDragEnd}
    >
      <Droppable
        droppableId="playlist"
      >
        {({ droppableProps, innerRef, placeholder }) => (
          <PlaylistStyle id={playlistId} ref={innerRef} {...droppableProps}>
            {props.playlist.filter(({ isDeleted }) => !isDeleted).map((item, index) => (
              <Draggable key={item.id} draggableId={String(item.id)} index={index}>
                {(provided) => <PlaylistItem item={item} innerRef={provided.innerRef} provided={provided} />}
              </Draggable>
            ))}
            {placeholder}
          </PlaylistStyle>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default Playlist;