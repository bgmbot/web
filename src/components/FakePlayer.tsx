import React, { useEffect, useState } from 'react';
import { PlayerProgress } from '../stores/PlayerStore';
import { Progress } from 'element-react';
import styled from '@emotion/styled';
import { PlaylistItem } from '../stores/models/PlaylistItem';
import { Duration } from 'luxon';

const FakePlayerStyle = styled.div`
display: flex;
align-items: center;
padding: 5px;

& > time {
  margin-left: auto;
  font-size: 11px;
  color: #555;
}
`;

interface FakePlayerProps {
  progress: PlayerProgress;
  nowPlaying?: PlaylistItem | null;
}

const FakePlayer: React.FC<FakePlayerProps> = (props) => {
  const { progress, nowPlaying } = props;

  const [length, setLength] = useState(-1);
  const [lengthString, setLengthString] = useState('00:00');
  const [percentage, setPercentage] = useState(0);
  const [timePlayed, setTimePlayed] = useState('00:00');

  useEffect(() => {
    const length = nowPlaying?.item.duration ?? -1;
    setLength(length);
    if (length > -1) {
      setLengthString(Duration.fromMillis(length * 1000).toFormat('mm:ss'));
    }
  }, [nowPlaying, setLength]);

  useEffect(() => {
    if (progress && length > -1) {
      setPercentage(Number((progress?.playedSeconds / length * 100).toFixed(2)));
      setTimePlayed(Duration.fromMillis(progress.playedSeconds * 1000).toFormat('mm:ss'));
    } else {
      setPercentage(0);
    }
  }, [length, progress, setPercentage]);

  return (
    <FakePlayerStyle>
      <Progress style={{ flex: 1, marginRight: 5 }} percentage={percentage} showText={false} />
      <time>
        {timePlayed}/{lengthString}
      </time>
    </FakePlayerStyle>
  );
};

export default FakePlayer;
