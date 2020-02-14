import styled from '@emotion/styled';
import * as _ from 'lodash';
import { Loading, MessageBox, Button, AutoComplete } from 'element-react';
import React, { useCallback, useEffect, useState } from 'react';
import ReactModal from 'react-modal';
import SearchResultItem from './SearchResultItem';

import { ItemSource } from '../stores/models/Item';
import { useStore, useStoreObserver } from '../utils/mobx';
import { SearchOptionsMode, SearchFor } from '../stores/models/SearchOptions';
import { IReply } from '../services/models/ApiInterface';
import { keyframes } from '@emotion/core';

const opening = keyframes`
0% {
  transform: translate(0px, -10px);
  opacity: .5;
}
100% {
  transform: none;
  opacity: 1;
}
`;

const StyledModal = styled(ReactModal)`
display: flex;
flex-direction: column;
position: absolute;
width: 600px;
height: 450px;
top: 0;
left: 0;
right:0;
bottom: 0;
margin: auto;
background-color: #fefefe;
box-shadow: 0 0 10px rgba(0,0,0,.1);
padding: 20px;
z-index: 5;
animation: ${opening} ease-out .3s;
`;

const Title = styled.h1`
  margin: 0 0 10px;
  padding: 0;
`;

const SearchResultArea = styled.div`
width: 100%;
height: 100%;
margin-top: auto;
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


interface ISearchInputProps {
  onChange?: () => void;
  onKeyPress?: () => void;
}

type ComponentProps<T> = T extends React.Component<infer Props> ? Props : never;
const SearchInput = AutoComplete as any as React.Component<ComponentProps<AutoComplete> & ISearchInputProps, {}> as any;


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
  const [isSearching, setIsSearching] = useState(false);

  const addPlaylistItemFromBasicInfo = useCallback(async (result: ItemSource) => {
    try {
      await MessageBox.confirm(`"${result.title}" 곡을 플레이리스트에 추가할까요?`, '플레이리스트 추가');
      pageStore.setSearchModalVisibility(false);
      commonStore.addPlaylistItem(result.link);
    }
    catch { }
  }, [pageStore, commonStore]);

  const [lastSearchKeyword, setLastSearchKeyword] = useState('');
  const triggerSearch = useCallback((method: 'related' | 'keyword', keyword: any) => {
    if (lastSearchKeyword === keyword) {
      return;
    }
    setIsSearching(true);

    const fn: any = method === 'related' ? pageStore.communicator.searchRelatedVideos.bind(pageStore.communicator) : pageStore.communicator.search.bind(pageStore.communicator);
    fn(keyword)
      .then((result: IReply) => {
        if (!result?.ok) {
          throw new Error(result?.content);
        }

        setSearchResult(result.content);
      })
      .catch(async (e: any) => {
        await MessageBox.alert(e?.message, {
          type: 'error',
        });
        pageStore.setSearchModalVisibility(false);
      })
      .finally(() => {
        setLastSearchKeyword(keyword);
        setIsSearching(false);
      });
  }, [pageStore, lastSearchKeyword, setLastSearchKeyword]);

  const fetchSuggestions = useCallback(_.debounce((keyword: string, callback: any) => {
    const { communicator } = commonStore;

    communicator.getAutoCompletionKeywords(keyword || '')
      .then((result) => {
        if (result?.ok) {
          callback(result?.content.map((x: string) => ({ value: x })) ?? []);
        }
      });
  }, 100), [commonStore]);

  const [searchKeyword, setSearchKeyword] = useState('');
  const onSelect = useCallback((item: any) => {
    setSearchKeyword(item.value);
  }, [setSearchKeyword]);

  const [loadedCount, setLoadedCount] = useState(0);
  const onLoad = useCallback(() => {
    setLoadedCount(loadedCount => loadedCount + 1);
  }, [setLoadedCount]);

  const onSearchInputChange = useCallback((value: string) => {
    if (value !== searchKeyword) {
      setSearchKeyword(value);
    }
  }, [searchKeyword, setSearchKeyword]);

  useEffect(() => {
    if (options && options.by === SearchOptionsMode.ItemId && options.for === SearchFor.RelatedVideos && options.itemId) {
      triggerSearch('related', options.itemId);
    }
  }, [options, triggerSearch]);

  const handleSearch = useCallback(() => {
    !isSearching && triggerSearch('keyword', searchKeyword);
  }, [triggerSearch, searchKeyword, isSearching]);

  return (
    <StyledModal isOpen={showSearchModal} shouldCloseOnOverlayClick={true} onRequestClose={handleCloseModal} ariaHideApp={false}>
      <Title>{options.title}</Title>
      {options.by === SearchOptionsMode.Keyword &&
        <div>
        <SearchInput placeholder="검색어 입력" onChange={onSearchInputChange} triggerOnFocus={false} fetchSuggestions={fetchSuggestions} value={searchKeyword} onSelect={onSelect} append={<Button type="primary" icon="search" onClick={handleSearch}>검색</Button>} />
        </div>
      }

      {isSearching || (searchResult && loadedCount < searchResult.length)
        ? <Loading style={{ marginTop: 150 }} />
        : null}
      {!isSearching && searchResult && searchResult.length > 0 &&
        <SearchResultArea>
          {searchResult?.map((result, index) => {
            return (
              <SearchResultItem key={result.link} item={result} index={index} visible={loadedCount >= searchResult.length} onClick={() => addPlaylistItemFromBasicInfo(result)} onLoad={onLoad} />
            );
          })}
        </SearchResultArea>
      }
    </StyledModal>
  );
};

export default SearchModal;
