import { ReactNode, CSSProperties } from 'react';
import { Box } from '@mantine/core';

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  duration?: number;
  style?: CSSProperties;
}

export function FadeIn({ children, delay = 0, direction = 'up', duration = 500, style }: FadeInProps) {
  const getTransform = () => {
    switch (direction) {
      case 'up': return 'translateY(20px)';
      case 'down': return 'translateY(-20px)';
      case 'left': return 'translateX(20px)';
      case 'right': return 'translateX(-20px)';
      default: return 'translateY(20px)';
    }
  };

  return (
    <Box
      style={{
        animation: `fadeIn-${direction} ${duration}ms ease-out ${delay}ms forwards`,
        opacity: 0,
        ...style
      }}
    >
      {children}
      <style>{`
        @keyframes fadeIn-${direction} {
          from {
            opacity: 0;
            transform: ${getTransform()};
          }
          to {
            opacity: 1;
            transform: translate(0, 0);
          }
        }
      `}</style>
    </Box>
  );
}
