import React from 'react';
import { keyframes } from '@emotion/core';
import styled from '@emotion/styled';

const Ellipsis1 = keyframes`
  0% {
    transform: scale(0);
  }
  100% {
    transform: scale(1);
  }
`;

const Ellipsis2 = keyframes`
  0% {
    transform: translate(0, 0);
  }
  100% {
    transform: translate(24px, 0);
  }
`;

const Ellipsis3 = keyframes`
  0% {
    transform: scale(1);
  }
  100% {
    transform: scale(0);
  }
`;

const LoaderStyle = styled.span`
  display: inline-block;
  position: relative;
  width: 80px;
  height: 80px;

  & div {
    position: absolute;
    top: 33px;
    width: 13px;
    height: 13px;
    border-radius: 50%;
    background: #333;
    animation-timing-function: cubic-bezier(0, 1, 1, 0);

    &:nth-child(1) /* emotion-disable-server-rendering-unsafe-selector-warning-please-do-not-use-this-
 the-warning-exists-for-a-reason */ {
      left: 8px;
      animation: ${Ellipsis1} 0.6s infinite;
    }
    &:nth-child(2) /* emotion-disable-server-rendering-unsafe-selector-warning-please-do-not-use-this-
 the-warning-exists-for-a-reason */ {
      left: 8px;
      animation: ${Ellipsis2} 0.6s infinite;
    }
    &:nth-child(3) /* emotion-disable-server-rendering-unsafe-selector-warning-please-do-not-use-this-
 the-warning-exists-for-a-reason */ {
      left: 32px;
      animation: ${Ellipsis2} 0.6s infinite;
    }
    &:nth-child(4) /* emotion-disable-server-rendering-unsafe-selector-warning-please-do-not-use-this-
 the-warning-exists-for-a-reason */ {
      left: 56px;
      animation: ${Ellipsis3} 0.6s infinite;
    }
  }
`;

const Loader = () => (
  <LoaderStyle>
    <div />
    <div />
    <div />
    <div />
  </LoaderStyle>
);

export default Loader;
