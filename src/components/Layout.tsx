import React from 'react';
import styled from '@emotion/styled';
import { css } from '@emotion/core';
import Spinner from './Spinner';

const LayoutStyle = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  width: 500px;
  height: 100vh;
  margin: 0 auto;
  padding: 10px;
  background: #fafafa;
  box-shadow: 0px 0px 10px rgba(0,0,0,.1);
`;

interface LayoutProps {
  showLoading?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, showLoading }) => {
  return (
    <LayoutStyle>
      {showLoading &&
        <Spinner css={css`
          position: absolute;
          top: 15px;
          left: 75px;
          z-index: 1;
        `} />}

      {children}
    </LayoutStyle>
  );
};

export default Layout;