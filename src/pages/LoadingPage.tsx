import React from 'react';
import styled from '@emotion/styled';
import LoaderBase from '../components/Loader';

const Layout = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Loader = styled(LoaderBase)`
`;

const LoadingPage = () => (
  <Layout>
    <Loader />
  </Layout>
);

export default LoadingPage;
