import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <div className="container-fluid">
          <div className="row">
            <Sidebar />
            <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4">
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
            </main>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;