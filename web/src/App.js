import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Dashboard from './pages/Dashboard';
import SentimentAnalysis from './pages/SentimentAnalysis';
import TradingSignals from './pages/TradingSignals';
import Wallet from './pages/Wallet';

// Web3 Context
import { Web3Provider } from './utils/Web3Context';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00c9ff',
    },
    secondary: {
      main: '#92fe9d',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
        containedPrimary: {
          background: 'linear-gradient(90deg, #00c9ff 0%, #92fe9d 100%)',
          color: '#000',
          '&:hover': {
            background: 'linear-gradient(90deg, #00b8e6 0%, #83e58c 100%)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Web3Provider>
        <div className="App">
          <Navbar />
          <main className="container" style={{ paddingTop: '80px', paddingBottom: '40px', minHeight: 'calc(100vh - 160px)' }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/sentiment" element={<SentimentAnalysis />} />
              <Route path="/signals" element={<TradingSignals />} />
              <Route path="/wallet" element={<Wallet />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Web3Provider>
    </ThemeProvider>
  );
}

export default App; 