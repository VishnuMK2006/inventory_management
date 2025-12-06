import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './pages/Dashboard';
import Vendors from './pages/Vendors';
import Buyers from './pages/Buyers';
import Categories from './pages/Categories';
import Products from './pages/Products';
import Purchases from './pages/Purchases';
import Sales from './pages/Sales';
import Inventory from './pages/Inventory';
import Combos from './pages/Combos';
import Reports from './pages/Reports';
import ProfitLoss from './pages/ProfitLoss';
import RTOProducts from './pages/RTOProducts';
import UploadedDataManagement from './pages/UploadedDataManagement';

// Create MUI Theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#000000',
    },
    secondary: {
      main: '#ffffff',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar />
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              bgcolor: 'background.default',
              minHeight: '100vh',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Header />
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/vendors" element={<Vendors />} />
              <Route path="/buyers" element={<Buyers />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/products" element={<Products />} />
              <Route path="/combos" element={<Combos />} />
              <Route path="/purchases" element={<Purchases />} />
              <Route path="/sales" element={<Sales />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/profit-loss" element={<ProfitLoss />} />
              <Route path="/rto-products" element={<RTOProducts />} />
              <Route path="/uploaded-data" element={<UploadedDataManagement />} />
            </Routes>
          </Box>
        </Box>
      
      </Router>
    </ThemeProvider>
  );
}

export default App;