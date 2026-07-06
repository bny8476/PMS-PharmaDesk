import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RoleGuard from '../auth/RoleGuard';
import { MemoryRouter } from 'react-router-dom';
import * as AuthContext from '../../context/AuthContext';

describe('RoleGuard', () => {
  it('renders children when user has required role', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { id: 1 },
      roles: ['SYSTEM_ADMIN'],
      activeRole: 'SYSTEM_ADMIN',
      loading: false
    });

    render(
      <MemoryRouter>
        <RoleGuard allowedRoles={['SYSTEM_ADMIN']}>
          <div data-testid="admin-content">Admin Content</div>
        </RoleGuard>
      </MemoryRouter>
    );

    expect(screen.getByTestId('admin-content')).toBeInTheDocument();
  });

  it('does not render children when user lacks required role', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { id: 1 },
      roles: ['PHARMACY_STAFF'],
      activeRole: 'PHARMACY_STAFF',
      loading: false
    });

    render(
      <MemoryRouter>
        <RoleGuard allowedRoles={['SYSTEM_ADMIN']}>
          <div data-testid="admin-content">Admin Content</div>
        </RoleGuard>
      </MemoryRouter>
    );

    expect(screen.queryByTestId('admin-content')).not.toBeInTheDocument();
  });
});
