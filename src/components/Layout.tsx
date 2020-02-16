import React, { useCallback } from 'react';
import styled from '@emotion/styled';
import Spinner from './Spinner';
import { observer } from 'mobx-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { Tooltip } from 'element-react';
import { useStore, useStoreObserver } from '../utils/mobx';
import SearchOptions, { SearchOptionsMode, SearchFor } from '../stores/models/SearchOptions';
import Snowflakes from './Snowflakes';

const LayoutStyle = styled.div`
position: relative;
display: flex;
flex-direction: column;
width: 500px;
height: 100vh;
margin: 0 auto;
padding: 10px;
background: #fafafa;
box-shadow: 0px 0px 10px rgba(0,0,0,.18);
z-index: 1;
`;

const Button = styled.button`
appearance: none;
border: 0;
border-radius: 50%;
width: 50px;
height: 50px;
box-shadow: 0 0 10px rgba(0,0,0,.08);
cursor: pointer;
color: #333;
font-size: 14px;
font-weight: 100;

&:hover {
  background-color: rgb(200,200,200);
  box-shadow: 0 0 10px rgba(0,0,0,.2);
  color: #111;
}
`;

const FloatingArea = styled.div`
position: absolute;
bottom: 0;
right: 0;
margin: 0 20px 20px;
z-index: 1;
`;

interface LayoutProps {
  showLoading?: boolean;
}

const LayoutSpinner = styled(Spinner)`
position: absolute;
top: 14px;
left: 150px;
z-index: 1;
`;

const Layout: React.FC<LayoutProps> = observer(({ children, showLoading }) => {
  const pageStore = useStore('pageStore');
  const { buttonDisabled } = useStoreObserver('pageStore', (store) => ({
    buttonDisabled: store.showSearchModal,
  }));

  const addPlaylistItem = useCallback(() => {
    const searchOptions = new SearchOptions();
    searchOptions.by = SearchOptionsMode.Keyword;
    searchOptions.for = SearchFor.Videos;

    pageStore.setSearchOptions(searchOptions);
    pageStore.setSearchModalVisibility(true);
  }, [pageStore]);

  return (
    <React.Fragment>
      <Snowflakes />
      <LayoutStyle>
        {showLoading && <LayoutSpinner />}
        {children}
      </LayoutStyle>
      <FloatingArea>
        <Tooltip content="곡 추가하기" placement="left">
          <Button onClick={addPlaylistItem} disabled={buttonDisabled}>
            <FontAwesomeIcon icon={faPlus} />
          </Button>
        </Tooltip>
      </FloatingArea>
    </React.Fragment>
  );
});

export default Layout;
