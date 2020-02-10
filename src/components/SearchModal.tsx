import styled from '@emotion/styled';
import { Loading, MessageBox } from 'element-react';
import { Duration } from 'luxon';
import React, { useCallback, useEffect, useState } from 'react';
import ReactModal from 'react-modal';

import { ItemSource } from '../stores/models/Item';
import { useStore, useStoreObserver } from '../utils/mobx';

const StyledModal = styled(ReactModal)`
display: flex;
flex-direction: column;
position: absolute;
width: 500px;
height: 400px;
top:0;
left: 0;
right:0;
bottom: 0;
margin: auto;
background-color: #fefefe;
box-shadow: 0 0 10px rgba(0,0,0,.1);
padding: 20px;
z-index: 5;
`;

const Title = styled.h1`
  margin: 0 0 10px;
  padding: 0;
`;

const SearchResultArea = styled.div`
width: 100%;
height: 100%;
margin-top: auto;
overflow-y: scroll;
`;

interface SearchResultItemStyleProps {
  cursor?: any;
  visible?: boolean;
}

const SearchResultItemStyle = styled.div<SearchResultItemStyleProps>`
display: flex;
margin: 5px;
padding: 8px;
cursor: ${props => props.cursor};
visibility: ${props => props.visible ? 'visible' : 'hidden'};

h3 {
  margin: 0;
  font-size: 14px;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  color: #222;
}
time {
  font-size: 12px;
  color: #444;
}

& > img {
  object-fit: contain;
  align-self: flex-start;
  margin-right: 10px;
}
& > div {
  flex: 1 0 auto;
  width: calc(100% - 80px);
}

&:hover {
  background-color: rgba(0,0,0,.05);
}
`;

interface SearchResultItemProps {
  item: ItemSource;
  visible?: boolean;
  onClick?: () => void;
  onLoad?: () => void;
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({ visible, item, onClick, onLoad }) => {
  const duration = Duration.fromMillis(item.duration * 1000).toFormat('mm:ss');

  return (
    <SearchResultItemStyle visible={visible ?? true} cursor={onClick && 'pointer'} title={item.title} onClick={onClick}>
      <img src={item.thumbnailUrl} onLoad={onLoad} onError={onLoad} alt="" height={40} />
      <div>
          <h3>{item.title}</h3>
          <time>{duration}</time>
      </div>
    </SearchResultItemStyle>
  );
};

const SearchModal = () => {
  const {
    showSearchModal,
    options,
  } = useStoreObserver('pageStore', (store) => ({
    showSearchModal: store.showSearchModal,
    options: store.searchOptions,
  }));

  const commonStore = useStore('commonStore');
  const pageStore = useStore('pageStore');
  const handleCloseModal = useCallback(() => {
    pageStore.setSearchModalVisibility(false);
  }, [pageStore]);

  const [searchResult, setSearchResult] = useState<ItemSource[] | null>([]);
  const [isSearching, setIsSearching] = useState(true);

  useEffect(() => {
    if (options) {
      setIsSearching(true);
      pageStore.communicator
        .searchRelatedVideos(options.itemId)
        .then((result) => {
          if (!result?.ok) {
            throw new Error(result?.content);
          }

          setSearchResult(result.content);
        })
        .catch(async (e) => {
          await MessageBox.alert(e?.message, {
            type: 'error',
          });
          pageStore.setSearchModalVisibility(false);
        })
        .finally(() => {
          setIsSearching(false);
        });
    }
  }, [options, showSearchModal, pageStore, setSearchResult, setIsSearching]);

  const addPlaylistItemFromBasicInfo = useCallback(async (result: ItemSource) => {
    try {
      await MessageBox.confirm(`"${result.title}" 곡을 플레이리스트에 추가할까요?`, '플레이리스트 추가');
      pageStore.setSearchModalVisibility(false);
      commonStore.addPlaylistItem(result.link);
    }
    catch { }
  }, [pageStore, commonStore]);

  const [loadedCount, setLoadedCount] = useState(0);
  const onLoad = useCallback(() => {
    setLoadedCount(loadedCount => loadedCount + 1);
  }, [setLoadedCount]);

  return (
    <StyledModal isOpen={showSearchModal} shouldCloseOnOverlayClick={true} onRequestClose={handleCloseModal} ariaHideApp={false}>
      <Title>{options.title}</Title>
      {isSearching || (searchResult && loadedCount < searchResult.length)
        ? <Loading style={{ marginTop: 150 }} />
        : null
      }
      <SearchResultArea>
        {searchResult?.map((result) => {
          return (
            <SearchResultItem key={result.link} item={result} visible={loadedCount === searchResult.length} onClick={() => addPlaylistItemFromBasicInfo(result)} onLoad={onLoad} />
          );
        })}
      </SearchResultArea>
    </StyledModal>
  );
};

export default SearchModal;
