import { useEffect, useState } from 'react';

interface Props {
  end: number;
  duration?: number;
  className?: string;
}

export function CountUp({ end, duration = 1000, className }: Props) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (end <= 0) { setValue(0); return; }
    const stepTime = Math.max(duration / end, 16);
    let current = 0;
    const timer = setInterval(() => {
      current += 1;
      if (current >= end) { setValue(end); clearInterval(timer); }
      else { setValue(current); }
    }, stepTime);
    return () => clearInterval(timer);
  }, [end, duration]);

  return <span className={className}>{value}</span>;
}
