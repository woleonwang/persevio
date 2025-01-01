import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { BrowserRouter, Route, Routes } from 'react-router';
import Home from './pages/home/index.tsx';
import Agent from './pages/agent/index.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Home />}></Route>
        <Route path='/app' element={<App />}></Route>
        <Route path='/agent' element={<Agent />}></Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
