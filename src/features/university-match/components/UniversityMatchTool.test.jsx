import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import UniversityMatchTool from './UniversityMatchTool';

describe('UniversityMatchTool', () => {
  it('renders initial scores, default overall band and destination controls', () => {
    render(<UniversityMatchTool handlePrimaryCta={vi.fn()} />);

    expect(screen.getByText('Enter the scores you got')).toBeInTheDocument();
    expect(screen.getByText('Estimated Overall Band')).toBeInTheDocument();
    expect(screen.getByText('Undergraduate')).toBeInTheDocument();
    expect(screen.getByText('Postgraduate')).toBeInTheDocument();
  });

  it('updates scores and estimated overall band when clicking a preset', () => {
    render(<UniversityMatchTool handlePrimaryCta={vi.fn()} />);

    const preset7 = screen.getByRole('button', { name: /7\.0 High/i });
    fireEvent.click(preset7);

    // After 7.0 preset, the Listening score should be 7.0
    expect(screen.getByLabelText('Listening band score')).toHaveValue('7');
    expect(screen.getByLabelText('Writing band score')).toHaveValue('6.5');
  });

  it('adjusts individual skill bands via increment and decrement buttons', () => {
    render(<UniversityMatchTool handlePrimaryCta={vi.fn()} />);

    // Writing default is 6.0. Let's increment it.
    const incWriting = screen.getByRole('button', { name: /Increase Writing band/i });
    fireEvent.click(incWriting);

    // Writing should now be 6.5
    expect(screen.getByLabelText('Writing band score')).toHaveValue('6.5');
  });

  it('filters universities when search query is entered and supports clearing', () => {
    render(<UniversityMatchTool handlePrimaryCta={vi.fn()} />);

    const searchInput = screen.getByPlaceholderText(/Search university, city or country/i);
    fireEvent.change(searchInput, { target: { value: 'Sheffield' } });

    // Should find University of Sheffield in the card heading
    expect(screen.getByRole('heading', { name: 'University of Sheffield' })).toBeInTheDocument();

    // Clear search
    const clearButton = screen.getByRole('button', { name: /Clear search/i });
    fireEvent.click(clearButton);
    expect(searchInput).toHaveValue('');
  });

  it('navigates and chooses autosuggestions using keyboard', () => {
    render(<UniversityMatchTool handlePrimaryCta={vi.fn()} />);

    const searchInput = screen.getByPlaceholderText(/Search university, city or country/i);
    fireEvent.change(searchInput, { target: { value: 'Sheff' } });

    // Dropdown list should be open
    const suggestionOption = screen.getByRole('option', { name: /University of Sheffield/i });
    expect(suggestionOption).toBeInTheDocument();

    // Select with enter
    fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
    fireEvent.keyDown(searchInput, { key: 'Enter' });

    expect(searchInput).toHaveValue('University of Sheffield');
  });

  it('switches study levels between Undergraduate and Postgraduate', () => {
    render(<UniversityMatchTool handlePrimaryCta={vi.fn()} />);

    const ugButton = screen.getByRole('button', { name: 'Undergraduate' });
    fireEvent.click(ugButton);

    expect(screen.getByText('Undergraduate (UG)')).toBeInTheDocument();
  });

  it('filters list using filter buttons (meets, shortfall, presessional)', () => {
    render(<UniversityMatchTool handlePrimaryCta={vi.fn()} />);

    const shortfallFilter = screen.getByRole('button', { name: /Shortfall/i });
    fireEvent.click(shortfallFilter);

    // Filter should be active
    expect(shortfallFilter).toHaveClass('bg-amber-600');
  });

  it('fires handlePrimaryCta callback when clicking the practice CTA', () => {
    const handlePrimaryCta = vi.fn();
    render(<UniversityMatchTool handlePrimaryCta={handlePrimaryCta} />);

    const ctaButton = screen.getByRole('button', { name: /Start Free Practice/i });
    fireEvent.click(ctaButton);

    expect(handlePrimaryCta).toHaveBeenCalledTimes(1);
  });
});
