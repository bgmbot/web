import React, { useCallback } from 'react';
import { PlaylistItem as Item } from '../stores/models/PlaylistItem';
import { DraggableProvided } from 'react-beautiful-dnd';
import { keyframes, css } from '@emotion/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useStore } from '../utils/mobx';
import styled from '@emotion/styled';
import { Duration } from 'luxon';
import { Message } from 'element-react';
import { observer } from 'mobx-react';

interface ItemStyleProps {
  isPlaying: boolean;
  isReady: boolean;
}

const spinner = keyframes`
0% {
  transform: rotate(0deg);
}

100% {
  transform: rotate(360deg);
}
`;

const Title = styled.span`
text-overflow: ellipsis;
white-space: nowrap;
letter-spacing: -.5px;
overflow: hidden;
`;

const playing = keyframes`
0%, 100% {
  color: rgba(0, 0, 0, .2);
}

50% {
  color: rgba(0, 0, 0, .5);
}
`;

const ItemStyle = styled.div<ItemStyleProps>`
display: flex;
align-items: center;
font-size: 15px;
height: 35px;
line-height: 35px;
padding: 5px 15px;
transition: background-color .1s ease-in;
border-radius: 5px;
color: ${props => props.isReady ? 'inherit' : 'rgba(0, 0, 0, .5)'};
cursor: ${props => props.isReady ? 'inherit' : 'not-allowed'};

&:hover {
  background-color: rgba(0, 0, 0, .05);
}

${props => props.isPlaying ? {
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, .15)',
  },
  [`& > ${Title}`]: {
    fontWeight: 600,
  },
  backgroundColor: 'rgba(0, 0, 0, .1)',
} : {}}

& > img {
  margin-right: 5px;
  border-radius: 50%;
}
`;

const Length = styled.time`
margin-left: auto;
font-size: 12px;
color: #777;
letter-spacing: -1px;
`;

interface PlaylistItemProps {
  provided?: DraggableProvided;
  item: Item;
  [key: string]: any;
}

interface IconProps {
  isPlaying: boolean;
  isReady: boolean;
  onClick?: () => void;
}

const Icon: React.FC<IconProps> = (props) => {
  const icon = props.isReady ? faPlay : faSpinner;

  return (
    <FontAwesomeIcon icon={icon} css={css`
    color: rgba(0, 0, 0, .2);
    margin-right: 10px;
      cursor: ${props.isPlaying ? 'not-allowed' : props.isReady ? 'pointer' : 'not-allowed'};
      animation: ${props.isReady ? props.isPlaying ? css`2s ease-in-out infinite ${playing}` : null : css`2s linear infinite ${spinner}`};
    `} onClick={props.onClick} />
  );
};

const PlaylistItem: React.FC<PlaylistItemProps> = observer((props) => {
  const { provided, item } = props;

  const setRef = (ref: any) => {
    provided?.innerRef(ref);
  };

  const commonStore = useStore('commonStore');

  const play = useCallback(() => {
    if (!item.isReady) {
      Message({
        message: '아직 준비되지 않은 곡입니다. (다운로드 중)',
        type: 'warning',
      });
      return;
    } else if (item.isPlaying) {
      return;
    }

    console.info('isPlaying', item.id);
    commonStore.setIsPlaying(item.id as any);
  }, [commonStore, item]);

  const duration = item.item.duration ? Duration.fromMillis(item.item.duration * 1000) : null;

  return (
    <ItemStyle
      {...provided?.draggableProps}
      {...provided?.dragHandleProps}
      ref={setRef}
      isPlaying={item.isPlaying}
      isReady={item.isReady}
    >
      <Icon isReady={item.isReady} isPlaying={item.isPlaying} onClick={play} />
      <img src={item.item.thumbnailUrl} width="16" height="16" alt="" />
      <Title title={item.title}>{item.title.replace(/ {1,}/g, ' ')}</Title>
      {duration && <Length>{duration.toFormat('mm:ss')}</Length>}
    </ItemStyle>
  );
});

export default PlaylistItem;

