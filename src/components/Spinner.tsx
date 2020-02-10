import React from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/core';

const spinner = keyframes`
0% {
  transform: rotate(0deg);
}

100% {
  transform: rotate(360deg);
}
`;

const fade = keyframes`
0% {
  opacity: 0;
}

100% {
  opacity: 1;
}
`;


const InnerSpinner = styled.div`
opacity: 0;
animation: 400ms linear infinite ${spinner}, 150ms linear 1 ${fade};
border-left: 2px solid #29d;
border-bottom: 2px solid transparent;
border-radius: 50%;
border-right: 2px solid transparent;
border-top: 2px solid #29d;
width: 18px;
height: 18px;
`;

const Spinner = (props: any) => <div {...props}><InnerSpinner /></div>;

export default Spinner;
