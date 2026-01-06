import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Pkubg - Интернет-магазин</h1>
        <p>Низкобелковая и безглютеновая продукция</p>
      </header>
      <Routes>
        <Route path="/" element={<div>Главная страница</div>} />
      </Routes>
    </div>
  );
}

export default App;