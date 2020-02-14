import React, { useEffect } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/core';
import { Duration } from 'luxon';
import { ItemSource } from '../stores/models/Item';

interface SearchResultItemStyleProps {
  cursor?: any;
  visible?: boolean;
  index?: number;
}

const animation = keyframes`
0% {
  opacity: 0;
}

100% {
  opacity: 1;
}
`;

const SearchResultItemStyle = styled.div<SearchResultItemStyleProps>`
display: flex;
margin: 5px;
padding: 8px;
cursor: ${props => props.cursor};
visibility: ${props => props.visible ? 'visible' : 'hidden'};
animation: ${props => props.visible ? animation : null} ease-out .15s;

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
  index: number;
  visible?: boolean;
  onClick?: () => void;
  onLoad?: () => void;
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({ visible, item, onClick, onLoad, index }) => {
  const duration = Duration.fromMillis(item.duration * 1000).toFormat('mm:ss');
  const imageRef = React.createRef<HTMLImageElement>();

  useEffect(() => {
    if (imageRef.current) {
      if (imageRef.current.complete) {
        onLoad && onLoad();
      }
    }
  }, [imageRef, onLoad]);

  return (
    <SearchResultItemStyle index={index} visible={visible ?? true} cursor={onClick && 'pointer'} title={item.title} onClick={onClick}>
      <img src={item.thumbnailUrl} alt="" height={40} width={54} onLoad={onLoad} onError={onLoad} />
      <div>
        <h3>{item.title}</h3>
        <time>{duration}</time>
      </div>
    </SearchResultItemStyle>
  );
};

export default SearchResultItem;
