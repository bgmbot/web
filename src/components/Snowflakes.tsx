import React from 'react';
import './Snowflakes.css';

const Snowflake = () => <div className="snowflake">❅</div>

const Snowflakes = () => {
  return (
    <div aria-hidden={true}>
      {Array(12).fill(null).map((_, index) => index).map((i) => <Snowflake key={i} />)}
    </div>
  );
};

export default Snowflakes;
