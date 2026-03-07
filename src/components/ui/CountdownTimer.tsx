'use client';

import { useEffect, useState } from 'react';

interface CountdownTimerProps {
  initialSeconds: number;
  onExpire?: () => void;
  onReset?: number; // Trigger to reset timer
}

export default function CountdownTimer({
  initialSeconds,
  onExpire,
  onReset,
}: CountdownTimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    setSeconds(initialSeconds);
  }, [onReset, initialSeconds]);

  useEffect(() => {
    if (seconds <= 0) {
      onExpire?.();
      return;
    }

    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [seconds, onExpire]);

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return (
    <div className="flex items-center justify-center gap-4">
      <div className="flex flex-col items-center">
        <div className="flex h-12 w-14 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(58, 51, 24, 0.6)', border: '1px solid rgba(242, 185, 13, 0.2)' }}>
          <p className="font-bold text-xl" style={{ color: '#f2b90d' }}>
            {minutes.toString().padStart(2, '0')}
          </p>
        </div>
        <p className="text-[10px] uppercase tracking-wider mt-1" style={{ color: '#9ca3af' }}>
          MIN
        </p>
      </div>
      <span className="font-bold self-start mt-2 text-xl" style={{ color: '#f2b90d' }}>:</span>
      <div className="flex flex-col items-center">
        <div className="flex h-12 w-14 items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(58, 51, 24, 0.6)', border: '1px solid rgba(242, 185, 13, 0.2)' }}>
          <p className="font-bold text-xl" style={{ color: '#f2b90d' }}>
            {remainingSeconds.toString().padStart(2, '0')}
          </p>
        </div>
        <p className="text-[10px] uppercase tracking-wider mt-1" style={{ color: '#9ca3af' }}>
          SEC
        </p>
      </div>
    </div>
  );
}
