/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AdminDashboard from '../AdminDashboard';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock dependencies
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {
    ...actual,
    useQuery: vi.fn(),
  };
});

vi.mock('../utils/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Admin' },
    activeRole: 'SYSTEM_ADMIN'
  })
}));

import { useQuery } from '@tanstack/react-query';

const renderWithProviders = (component) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{component}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('AdminDashboard', () => {
  it('renders skeleton loader when data is loading', () => {
    useQuery.mockReturnValue({ isLoading: true });
    renderWithProviders(<AdminDashboard />);
    // Check for some pulse animation divs
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders dashboard stats when data is loaded', async () => {
    useQuery.mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'dashboard-kpis') {
        return { 
          data: { 
            todayRevenue: 5000, 
            totalSkus: 10, 
            lowStockAlerts: 5, 
            expiringIn30Days: 2, 
            activePatientsToday: 3
          }, 
          isLoading: false 
        };
      }
      if (queryKey[0] === 'dashboard-chart') return { data: [], isLoading: false };
      if (queryKey[0] === 'dashboard-alerts') return { data: [], isLoading: false };
      if (queryKey[0] === 'dashboard-revenue') return { data: { todayRevenue: 5000 }, isLoading: false };
      return { data: null, isLoading: false };
    });

    renderWithProviders(<AdminDashboard />);
    expect(screen.getAllByText('₹5,000').length).toBeGreaterThan(0);
    // Use getAllByText if it might be duplicated, or just check the first one
    expect(screen.getByText('10')).toBeDefined();
    // For "5", let's check it's there
    const elementsWith5 = screen.getAllByText('5');
    expect(elementsWith5.length).toBeGreaterThan(0);
  });
});
