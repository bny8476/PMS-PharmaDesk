import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ReportCard from '../../pages/reports/ReportCard';

// Sample report fixture
const report = {
  id: 'daily-summary',
  name: 'Daily Sales Summary',
  desc: 'Total bills, cash vs credit split, GST collected, net revenue',
  category: 'sales',
  hasDateRange: true,
  isRestricted: false,
  isNarcotic: false,
};

describe('ReportCard', () => {
  it('renders report name and description', () => {
    render(
      <ReportCard
        report={report}
        isFav={false}
        onToggleFav={vi.fn()}
        onOpen={vi.fn()}
        onSchedule={vi.fn()}
      />
    );
    expect(screen.getByText('Daily Sales Summary')).toBeInTheDocument();
    expect(screen.getByText(/Total bills/)).toBeInTheDocument();
  });

  it('calls onOpen when Generate button is clicked', () => {
    const onOpen = vi.fn();
    render(
      <ReportCard
        report={report}
        isFav={false}
        onToggleFav={vi.fn()}
        onOpen={onOpen}
        onSchedule={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText('Generate'));
    expect(onOpen).toHaveBeenCalledWith(report);
  });

  it('calls onToggleFav when star button is clicked', () => {
    const onToggleFav = vi.fn();
    render(
      <ReportCard
        report={report}
        isFav={false}
        onToggleFav={onToggleFav}
        onOpen={vi.fn()}
        onSchedule={vi.fn()}
      />
    );
    fireEvent.click(screen.getByLabelText('Add to favourites'));
    expect(onToggleFav).toHaveBeenCalledWith('daily-summary');
  });

  it('shows NDPS Mandatory badge for narcotic reports', () => {
    render(
      <ReportCard
        report={{ ...report, isNarcotic: true }}
        isFav={false}
        onToggleFav={vi.fn()}
        onOpen={vi.fn()}
        onSchedule={vi.fn()}
      />
    );
    expect(screen.getByText('NDPS Mandatory')).toBeInTheDocument();
  });

  it('calls onSchedule when schedule button is clicked', () => {
    const onSchedule = vi.fn();
    render(
      <ReportCard
        report={report}
        isFav={false}
        onToggleFav={vi.fn()}
        onOpen={vi.fn()}
        onSchedule={onSchedule}
      />
    );
    fireEvent.click(screen.getByLabelText('Schedule report'));
    expect(onSchedule).toHaveBeenCalledWith(report);
  });
});
