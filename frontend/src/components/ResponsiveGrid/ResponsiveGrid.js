import React from 'react';
import { getResponsiveColumns } from '../../utils/responsive';
import useResponsive from '../../hooks/useResponsive';
import './ResponsiveGrid.css';

const ResponsiveGrid = ({
  children,
  columns = { xs: 1, sm: 2, md: 3, lg: 4, xl: 4 },
  gap = 'md',
  className = '',
  minItemWidth = '250px',
  autoFit = true,
  ...props
}) => {
  const { screenSize } = useResponsive();
  
  const currentColumns = typeof columns === 'object' 
    ? columns[screenSize] || columns.xl || 4
    : columns;

  const gridClasses = [
    'responsive-grid',
    `gap-${gap}`,
    className
  ].filter(Boolean).join(' ');

  const gridStyle = {
    '--grid-columns': currentColumns,
    '--min-item-width': minItemWidth,
    ...props.style
  };

  // Use auto-fit if enabled, otherwise use fixed columns
  const gridTemplateColumns = autoFit 
    ? `repeat(auto-fit, minmax(min(${minItemWidth}, 100%), 1fr))`
    : `repeat(${currentColumns}, 1fr)`;

  return (
    <div 
      className={gridClasses}
      style={{
        ...gridStyle,
        gridTemplateColumns
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export default ResponsiveGrid;