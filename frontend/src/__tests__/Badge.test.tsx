import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { CategoryBadge, SeverityBadge, StatusBadge } from '../components/common/Badge';

describe('Badge Components', () => {
  it('renders severity badges correctly with count', () => {
    render(<SeverityBadge severity="critical" count={3} />);
    expect(screen.getByText('critical')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders high and medium severity badges', () => {
    const { rerender } = render(<SeverityBadge severity="high" />);
    expect(screen.getByText('high')).toBeInTheDocument();

    rerender(<SeverityBadge severity="medium" />);
    expect(screen.getByText('medium')).toBeInTheDocument();
  });

  it('renders category badges', () => {
    render(<CategoryBadge category="security" />);
    expect(screen.getByText('security')).toBeInTheDocument();
  });

  it('renders status badges', () => {
    render(<StatusBadge status="completed" />);
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });
});
