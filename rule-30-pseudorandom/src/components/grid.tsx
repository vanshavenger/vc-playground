import { useEffect, useRef } from 'react';

interface GridProps {
  grid: boolean[][];
}

export const Grid = ({ grid }: GridProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [grid]);
  return <div>Grid</div>;
};
