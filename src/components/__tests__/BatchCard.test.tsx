import { render, screen, fireEvent } from '@testing-library/react';
import { BatchCard, Batch } from '../BatchCard';

const mockBatch: Batch = {
  id: '1',
  name: 'Test Batch',
  variety: 'Test Variety',
  volume: 100,
  startDate: '2024-01-01',
  currentStage: 'Fermentation',
  progress: 50,
  target_og: 1.05,
  target_ph: 3.5,
  yeast_type: 'Test Yeast',
};

describe('BatchCard', () => {
  it('renders batch information correctly', () => {
    render(<BatchCard batch={mockBatch} />);
    
    expect(screen.getByText('Test Batch')).toBeInTheDocument();
    expect(screen.getByText('Test Variety')).toBeInTheDocument();
    expect(screen.getByText('100L')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('calls onClick when card is clicked', () => {
    const handleClick = vi.fn();
    render(<BatchCard batch={mockBatch} onClick={handleClick} />);
    
    // Click the card itself, not a button
    fireEvent.click(screen.getByText('Test Batch').closest('div')!);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders delete menu button when onDelete is provided', () => {
    const handleDelete = vi.fn();
    render(<BatchCard batch={mockBatch} onDelete={handleDelete} />);
    
    // Check that the menu button is rendered
    const menuButton = screen.getByRole('button', { name: '' });
    expect(menuButton).toBeInTheDocument();
  });

  it('shows target values when provided', () => {
    render(<BatchCard batch={mockBatch} />);
    
    expect(screen.getByText('OG:')).toBeInTheDocument();
    expect(screen.getByText('PH:')).toBeInTheDocument();
    expect(screen.getByText('Yeast:')).toBeInTheDocument();
  });
});