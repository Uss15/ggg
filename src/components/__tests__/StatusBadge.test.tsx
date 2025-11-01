import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { StatusBadge } from '../StatusBadge';

describe('StatusBadge', () => {
  it('renders collected status correctly', () => {
    const { container } = render(<StatusBadge status="collected" />);
    expect(container.textContent).toContain('Collected');
  });

  it('renders in_transport status correctly', () => {
    const { container } = render(<StatusBadge status="in_transport" />);
    expect(container.textContent).toContain('In Transport');
  });

  it('renders in_lab status correctly', () => {
    const { container } = render(<StatusBadge status="in_lab" />);
    expect(container.textContent).toContain('In Lab');
  });

  it('renders analyzed status correctly', () => {
    const { container } = render(<StatusBadge status="analyzed" />);
    expect(container.textContent).toContain('Analyzed');
  });

  it('renders archived status correctly', () => {
    const { container } = render(<StatusBadge status="archived" />);
    expect(container.textContent).toContain('Archived');
  });
});
