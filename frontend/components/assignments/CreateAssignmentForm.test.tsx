import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import CreateAssignmentForm from './CreateAssignmentForm';

test('renders form fields correctly', () => {
  render(<CreateAssignmentForm />);
  
  expect(screen.getByLabelText(/class id/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
  expect(screen.getByText(/assignment type/i)).toBeInTheDocument();
});

test('shows file url input when file type is selected', async () => {
  render(<CreateAssignmentForm />);
  
  const fileRadio = screen.getByLabelText(/file upload/i);
  fireEvent.click(fileRadio);
  
  await waitFor(() => {
    expect(screen.getByLabelText(/file url/i)).toBeInTheDocument();
  });
});

test('adds a question when add question button is clicked', async () => {
  render(<CreateAssignmentForm />);
  
  const questionRadio = screen.getByLabelText(/question builder/i);
  fireEvent.click(questionRadio);
  
  const addButton = screen.getByText(/\+ add question/i);
  fireEvent.click(addButton);
  
  await waitFor(() => {
    expect(screen.getByPlaceholderText(/enter your question here/i)).toBeInTheDocument();
  });
});
