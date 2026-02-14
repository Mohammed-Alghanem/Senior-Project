'use client';

import React from 'react';

interface ContainerProps {
  children: React.ReactNode;
  maxWidth?: string;
  padding?: string;
}

export const Container = ({
  children,
  maxWidth = '1400px',
  padding = '24px',
}: ContainerProps) => {
  return (
    <div
      style={{
        maxWidth,
        margin: '0 auto',
        padding,
        width: '100%',
      }}
    >
      {children}
    </div>
  );
};

interface FlexProps {
  children: React.ReactNode;
  direction?: 'row' | 'column';
  gap?: string;
  justifyContent?: string;
  alignItems?: string;
  style?: React.CSSProperties;
}

export const Flex = ({
  children,
  direction = 'row',
  gap = '16px',
  justifyContent = 'flex-start',
  alignItems = 'stretch',
  style = {},
}: FlexProps) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: direction,
        gap,
        justifyContent,
        alignItems,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

interface GridProps {
  children: React.ReactNode;
  columns?: number;
  gap?: string;
  style?: React.CSSProperties;
}

export const Grid = ({ children, columns = 2, gap = '16px', style = {} }: GridProps) => {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
