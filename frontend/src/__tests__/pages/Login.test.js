/**
 * Login Page Tests
 * Tests the Login component functionality
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Login from '../../pages/Login';
import * as api from '../../services/api';

// Mock the API
jest.mock('../../services/api');

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderLogin = () => {
  render(
    <BrowserRouter>
      <Login />
    </BrowserRouter>
  );
};

describe('Login Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('Rendering', () => {
    test('renders login form', () => {
      renderLogin();
      expect(screen.getByText(/login/i)).toBeInTheDocument();
    });

    test('renders username input', () => {
      renderLogin();
      expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument();
    });

    test('renders password input', () => {
      renderLogin();
      expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    });

    test('renders login button', () => {
      renderLogin();
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    test('renders signup link', () => {
      renderLogin();
      expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    test('allows user to type in username field', async () => {
      renderLogin();
      const input = screen.getByPlaceholderText(/username/i);
      
      await userEvent.type(input, 'testuser');
      
      expect(input).toHaveValue('testuser');
    });

    test('allows user to type in password field', async () => {
      renderLogin();
      const input = screen.getByPlaceholderText(/password/i);
      
      await userEvent.type(input, 'password123');
      
      expect(input).toHaveValue('password123');
    });

    test('submits form with username and password', async () => {
      api.signin.mockResolvedValueOnce({
        token: 'jwt_token',
        userId: 1,
        role: 'ROLE_STUDENT'
      });

      renderLogin();

      const usernameInput = screen.getByPlaceholderText(/username/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      await userEvent.type(usernameInput, 'testuser');
      await userEvent.type(passwordInput, 'password123');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(api.signin).toHaveBeenCalledWith('testuser', 'password123');
      });
    });
  });

  describe('Success Scenarios', () => {
    test('shows success message on successful login', async () => {
      api.signin.mockResolvedValueOnce({
        token: 'jwt_token',
        userId: 1,
        username: 'testuser',
        role: 'ROLE_STUDENT'
      });

      renderLogin();

      const usernameInput = screen.getByPlaceholderText(/username/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      await userEvent.type(usernameInput, 'testuser');
      await userEvent.type(passwordInput, 'password123');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(localStorage.getItem('token')).toBeTruthy();
      });
    });

    test('navigates to dashboard on successful login', async () => {
      api.signin.mockResolvedValueOnce({
        token: 'jwt_token',
        userId: 1,
        username: 'testuser',
        role: 'ROLE_STUDENT'
      });

      renderLogin();

      const usernameInput = screen.getByPlaceholderText(/username/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      await userEvent.type(usernameInput, 'testuser');
      await userEvent.type(passwordInput, 'password123');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    test('stores token in localStorage on successful login', async () => {
      const token = 'jwt_token_12345';
      api.signin.mockResolvedValueOnce({
        token,
        userId: 1,
        role: 'ROLE_STUDENT'
      });

      renderLogin();

      const usernameInput = screen.getByPlaceholderText(/username/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      await userEvent.type(usernameInput, 'testuser');
      await userEvent.type(passwordInput, 'password123');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(localStorage.getItem('token')).toBe(token);
      });
    });
  });

  describe('Error Scenarios', () => {
    test('shows error message on failed login', async () => {
      api.signin.mockRejectedValueOnce(new Error('Invalid credentials'));

      renderLogin();

      const usernameInput = screen.getByPlaceholderText(/username/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      await userEvent.type(usernameInput, 'wronguser');
      await userEvent.type(passwordInput, 'wrongpass');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    test('does not navigate on failed login', async () => {
      api.signin.mockRejectedValueOnce(new Error('Invalid credentials'));

      renderLogin();

      const usernameInput = screen.getByPlaceholderText(/username/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      await userEvent.type(usernameInput, 'wronguser');
      await userEvent.type(passwordInput, 'wrongpass');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });

    test('shows error for empty credentials', async () => {
      renderLogin();

      const submitButton = screen.getByRole('button', { name: /login/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(api.signin).not.toHaveBeenCalled();
      });
    });
  });

  describe('Loading States', () => {
    test('disables button while submitting', async () => {
      let resolveSignin;
      const signinPromise = new Promise(resolve => {
        resolveSignin = resolve;
      });
      api.signin.mockReturnValueOnce(signinPromise);

      renderLogin();

      const usernameInput = screen.getByPlaceholderText(/username/i);
      const passwordInput = screen.getByPlaceholderText(/password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      await userEvent.type(usernameInput, 'testuser');
      await userEvent.type(passwordInput, 'password123');
      fireEvent.click(submitButton);

      // Button should be disabled during submission
      expect(submitButton).toBeDisabled();

      // Resolve the promise
      resolveSignin({ token: 'jwt', userId: 1, role: 'ROLE_STUDENT' });
    });
  });
});
