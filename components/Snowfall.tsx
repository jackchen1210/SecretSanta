import React, { useEffect, useState } from 'react';

const Snowfall: React.FC = () => {
  const [flakes, setFlakes] = useState<number[]>([]);

  useEffect(() => {
    // Generate static count of snowflakes to avoid re-renders
    setFlakes(Array.from({ length: 30 }, (_, i) => i));
  }, []);

  return (
    <div className="snow-container" aria-hidden="true">
      {flakes.map((i) => {
        const left = Math.random() * 100;
        const duration = 5 + Math.random() * 10;
        const delay = Math.random() * 5;
        const size = 3 + Math.random() * 5;
        
        return (
          <div
            key={i}
            className="snowflake"
            style={{
              left: `${left}%`,
              animationDuration: `${duration}s`,
              animationDelay: `${delay}s`,
              width: `${size}px`,
              height: `${size}px`,
            }}
          />
        );
      })}
    </div>
  );
};

export default Snowfall;