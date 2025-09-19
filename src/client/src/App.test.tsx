import React from 'react';
import { render, screen } from '@testing-library/react';
import TerminalApp from './TerminalApp';

test('renders terminal app', () => {
  render(<TerminalApp />);
  // Test that terminal app renders without crashing
  expect(document.querySelector('.terminal-chat')).toBeTruthy();
});
