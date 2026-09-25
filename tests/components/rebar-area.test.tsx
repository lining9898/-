import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from '../../src/App';

afterEach(cleanup);

describe('rebar area tool', () => {
  it('opens from the menu and updates the total area', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /钢筋公称面积/ }));
    expect(screen.getByRole('heading', { name: '钢筋公称面积' })).not.toBeNull();
    expect(screen.getByText(/1,256\.64 mm²/)).not.toBeNull();
    fireEvent.change(screen.getByRole('spinbutton', { name: '钢筋根数 n (根)' }), { target: { value: '2' } });
    expect(screen.getByText(/628\.32 mm²/)).not.toBeNull();
  });
});
