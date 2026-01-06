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
  const headerElement = screen.getByText(/Pkubg - Интернет-магазин/i);
  expect(headerElement).toBeInTheDocument();
});

test('renders product description', () => {
  renderWithProviders(<App />);
  const descriptionElement = screen.getByText(/Низкобелковая и безглютеновая продукция/i);
  expect(descriptionElement).toBeInTheDocument();
});