import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import LoginForm from './LoginForm';
import authReducer from '../../store/authSlice';

const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: {
      auth: {
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null,
        ...initialState.auth
      }
    }
  });
};

const renderWithProviders = (component, initialState = {}) => {
  const store = createTestStore(initialState);
  return render(
    <Provider store={store}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </Provider>
  );
};

test('renders login form', () => {
  renderWithProviders(<LoginForm />);
  
  const heading = screen.getByText('Вход в систему');
  const emailInput = screen.getByLabelText(/Email/i);
  const passwordInput = screen.getByLabelText(/Пароль/i);
  const submitButton = screen.getByText('Войти');
  
  expect(heading).toBeInTheDocument();
  expect(emailInput).toBeInTheDocument();
  expect(passwordInput).toBeInTheDocument();
  expect(submitButton).toBeInTheDocument();
});

test('shows register link', () => {
  renderWithProviders(<LoginForm />);
  
  const registerLink = screen.getByText('Зарегистрироваться');
  expect(registerLink).toBeInTheDocument();
});

test('allows input in form fields', () => {
  renderWithProviders(<LoginForm />);
  
  const emailInput = screen.getByLabelText(/Email/i);
  const passwordInput = screen.getByLabelText(/Пароль/i);
  
  fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
  fireEvent.change(passwordInput, { target: { value: 'password123' } });
  
  expect(emailInput.value).toBe('test@example.com');
  expect(passwordInput.value).toBe('password123');
});

test('shows loading state when submitting', () => {
  const initialState = {
    auth: {
      loading: true
    }
  };
  renderWithProviders(<LoginForm />, initialState);
  
  const submitButton = screen.getByText('Вход...');
  expect(submitButton).toBeDisabled();
});

test('displays error message when login fails', () => {
  const initialState = {
    auth: {
      error: { detail: 'Неверные учетные данные' }
    }
  };
  renderWithProviders(<LoginForm />, initialState);
  
  const errorMessage = screen.getByText('Неверные учетные данные');
  expect(errorMessage).toBeInTheDocument();
});