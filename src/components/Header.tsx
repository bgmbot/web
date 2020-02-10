import React from 'react';
import styled from '@emotion/styled';
import User from '../stores/models/User';
import Channel from '../stores/models/Channel';
import { TEAM_ID } from '../constants';
import { css } from '@emotion/core';
import { useStoreObserver } from '../utils/mobx';

const HeaderWrap = styled.div`
height: 50px;
display: flex;
flex-direction: column;
line-height: 25px;
`;

const UserWrap = styled.div`
`;

const ChannelWrap = styled.div`
margin-left: auto;
`;

const ChannelLink = styled.a`
text-decoration: none;
color: #333;
font-size: 12px;
`;

interface ConnectionIndicatorProps {
  online: boolean;
}

const ConnectionIndicator = styled.div<ConnectionIndicatorProps>`
display: inline-block;
width: 9px;
height: 9px;
border-radius: 50%;
background-color: ${props => props.online ? '#59d05d' : '#f7ba2a'};
`;

const Connection = styled.div`
display: flex;
align-items: center;
justify-content: flex-end;
text-align: right;
font-size: 11px;
color: #333;
line-height: 16px;

${ConnectionIndicator} {
  margin-right: 3px;
}
`;

interface HeaderProps {
  user: User;
  channel: Channel;
  isChannelOwner?: boolean;
}

const Header: React.FC<HeaderProps> = (props) => {
  const { user, channel } = props;

  const { isOnline, ping } = useStoreObserver('commonStore', (store) => ({
    isOnline: store.isOnline,
    ping: store.ping,
  }));

  return (
    <HeaderWrap>
      <div css={css`
        display: flex;
        align-items: center;
      `}>
        <UserWrap>
          <strong>{user.name}</strong>님
          {props.isChannelOwner ? ' (플레이어)' : ' (보기 전용)'}
      </UserWrap>
        <ChannelWrap>
          <ChannelLink href={`slack://channel?team=${TEAM_ID}&id=${channel.id}`} target="_blank">#{channel.realname}</ChannelLink>
        </ChannelWrap>
      </div>
      <Connection>
        <ConnectionIndicator online={isOnline} /> {isOnline ? `ONLINE (${ping}ms)` : 'OFFLINE'}
      </Connection>
    </HeaderWrap>
  );
};

export default Header;
