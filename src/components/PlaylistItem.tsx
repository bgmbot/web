import React, { useCallback } from 'react';
import { PlaylistItem as Item } from '../stores/models/PlaylistItem';
import { DraggableProvided } from 'react-beautiful-dnd';
import { keyframes, css } from '@emotion/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faSpinner, faEllipsisH, faSearch, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useStore } from '../utils/mobx';
import styled from '@emotion/styled';
import { Duration } from 'luxon';
import { observer } from 'mobx-react';
import { useToasts } from 'react-toast-notifications';
import SearchOptions, { SearchOptionsMode } from '../stores/models/SearchOptions';
import { MessageBox } from 'element-react';

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

const MenuItem = styled.li`
background-color: #fefefe;
padding: 2px 6px 2px 12px;
font-size: 14px;
color: #222;

&:hover {
  background-color: #dfdfdf;
}

& > .icon {
  font-size: 12px;
  margin-right: 4px;
}
`;

const MenuContent = styled.ul`
position: absolute;
list-style: none;
background-color: #fefefe;
margin: 0;
padding: 0;
top: 30px;
right: 0;
display: none;
min-width: 140px;
box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
z-index: 2;
`;

const Menu = styled.div`
position: relative;
cursor: pointer;

.icon {
  transition: color .2s;
}

&:hover {
  & > .icon {
    color: rgba(0, 0, 0, .8);
  }

  ${MenuContent} {
    display: block;
  }
}
`;

const MenuWrap = styled.div`
display: inline-block;
position: absolute;
width: 20px;
height: 100%;
right: 15px;
display: none;
`;

const Length = styled.time`
margin-left: auto;
font-size: 12px;
color: #777;
letter-spacing: -1px;
`;

const ItemStyle = styled.div<ItemStyleProps>`
position: relative;
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

  ${MenuWrap} {
    display: block;
  }

  ${Length} {
    visibility: hidden;
  }
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

interface PlaylistItemProps {
  provided?: DraggableProvided;
  item: Item;
  readonly?: boolean;
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
  const { addToast } = useToasts();

  const play = useCallback(() => {
    if (!item.isReady) {

      addToast('아직 준비되지 않은 곡입니다. (다운로드 중)', {
        appearance: 'warning',
        autoDismiss: true,
      });
      return;
    } else if (item.isPlaying) {
      return;
    }

    console.info('isPlaying', item.id);
    commonStore.setIsPlaying(item.id as any);
  }, [addToast, commonStore, item]);

  const pageStore = useStore('pageStore');
  const searchRelatedVideos = useCallback(() => {
    const searchOptions = new SearchOptions();
    searchOptions.by = SearchOptionsMode.ItemId;
    searchOptions.itemId = item.itemId as number;

    pageStore.setSearchOptions(searchOptions);
    pageStore.setSearchModalVisibility(true);
  }, [pageStore, item]);

  const deletePlaylistItem = useCallback(() => {
    MessageBox.confirm(`정말로 "${item.title}" 곡을 삭제할까요?`, '삭제 확인', {
      type: 'info',
      showClose: true,
    }).then(() => commonStore.deletePlaylistItem(item.id as any)).catch(() => { });
  }, [commonStore, item.id, item.title]);

  const duration = item.item.duration ? Duration.fromMillis(item.item.duration * 1000) : null;

  return (
    <ItemStyle
      {...provided?.draggableProps}
      {...provided?.dragHandleProps}
      ref={setRef}
      isPlaying={item.isPlaying}
      isReady={item.isReady}
    >
      {!props.readonly && <Icon isReady={item.isReady} isPlaying={item.isPlaying} onClick={play} />}
      <img src={item.item.thumbnailUrl} width="16" height="16" alt="" />
      <Title title={item.title}>{item.title.replace(/ {1,}/g, ' ')}</Title>
      {duration && <Length>{duration.toFormat('mm:ss')}</Length>}
      <MenuWrap>
        <Menu>
          <FontAwesomeIcon icon={faEllipsisH} className="icon" color="rgba(0, 0, 0, .6)" />
          <MenuContent>
            <MenuItem onClick={searchRelatedVideos}><FontAwesomeIcon icon={faSearch} className="icon" /> 연관곡 검색</MenuItem>
            {!props.readonly && <MenuItem onClick={deletePlaylistItem}><FontAwesomeIcon icon={faTrash} className="icon" /> 삭제</MenuItem>}
          </MenuContent>
        </Menu>
      </MenuWrap>
    </ItemStyle>
  );
});

export default PlaylistItem;

