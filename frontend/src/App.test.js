import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { store } from './store/store';

const renderWithProviders = (component) => {
  return render(
    <Provider store={store}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </Provider>
  );
};

test('renders Pkubg header', () => {
  renderWithProviders(<App />);
  const headerElement = screen.getByText(/Pkubg/i);
  expect(headerElement).toBeInTheDocument();
});

test('renders catalog page', () => {
  renderWithProviders(<App />);
  const catalogElement = screen.getByText(/Каталог товаров/i);
  expect(catalogElement).toBeInTheDocument();
});