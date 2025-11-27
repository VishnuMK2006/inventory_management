import React, { useState, useEffect } from 'react';
import { Table, Alert, Spinner, Badge, Button } from 'react-bootstrap';
import { rtoProductsAPI, returnsAPI, productsAPI } from '../services/api';
import styled from 'styled-components';

const Container = styled.div`
  padding: 0.5rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
`;

const HeaderSection = styled.div`
  background: white;
  padding: 0.75rem;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  margin-bottom: 0.5rem;
`;

const StyledTable = styled(Table)`
  background: white;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 5px 20px rgba(0,0,0,0.1);
  
  thead {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    
    th {
      border: none;
      padding: 0.75rem;
      font-weight: 600;
    }
  }
  
  tbody tr {
    transition: all 0.3s ease;
    
    &:hover {
      background: #f8f9fa;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    td {
      padding: 0.5rem;
      vertical-align: middle;
      border: none;
    }
  }
`;

const RTOProducts = () => {
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [rtoItems, setRtoItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('RTO');

  useEffect(() => {
    fetchProducts();
    fetchRTOItems();
  }, [activeTab]);

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const returnsResponse = await returnsAPI.getAll();
      const returns = returnsResponse.data || [];
      
      // Convert all returns to product format
      const allReturnProducts = returns.flatMap(returnItem => 
        returnItem.items?.map(item => ({
          _id: `${returnItem._id}-${item.product}`,
          rtoId: returnItem.returnId,
          productName: item.productName,
          barcode: item.barcode,
          quantity: item.quantity,
          price: item.unitPrice,
          totalValue: item.total,
          category: returnItem.category,
          customerName: returnItem.customerName,
          reason: returnItem.reason,
          returnDate: returnItem.returnDate
        })) || []
      );
      
      // Filter by active tab
      const filteredProducts = allReturnProducts.filter(product => product.category === activeTab);
      
      setProducts(filteredProducts);
      setAllProducts(allReturnProducts);
    } catch (err) {
      console.error('API Error:', err);
      setError('Failed to fetch products: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRTOItems = async () => {
    try {
      const resp = await rtoProductsAPI.getAll({ category: 'RTO' });
      const items = resp.data || [];
      setRtoItems(items);
    } catch (err) {
      console.error('Failed to fetch RTO items:', err);
      setError('Failed to fetch RTO items: ' + (err.message || err));
    }
  };

  return (
    <Container>
      <HeaderSection>
        <h2 style={{ color: '#333', marginBottom: '0.5rem' }}>RTO/RPU Products</h2>
        <p style={{ color: '#666', marginBottom: 0 }}>Return To Origin and Returned Product Under Process inventory</p>
        <div style={{ float: 'right' }}>
          <Button size="sm" variant="outline-primary" onClick={() => fetchRTOItems()}>🔁 Refresh RTO Inventory</Button>
        </div>
      </HeaderSection>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ background: 'white', padding: '1rem', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <h3 style={{ color: '#f39c12', margin: '0 0 0.5rem 0' }}>{allProducts.filter(p => p.category === 'RTO' || p.rtoStatus === 'RTO').length}</h3>
          <small style={{ color: '#666' }}>RTO Items</small>
        </div>
        <div style={{ background: 'white', padding: '1rem', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <h3 style={{ color: '#3498db', margin: '0 0 0.5rem 0' }}>{allProducts.filter(p => p.category === 'RPU' || p.rtoStatus === 'RPU').length}</h3>
          <small style={{ color: '#666' }}>RPU Items</small>
        </div>
        <div style={{ background: 'white', padding: '1rem', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', textAlign: 'center' }}>
          <h3 style={{ color: '#27ae60', margin: '0 0 0.5rem 0' }}>₹{allProducts.reduce((sum, p) => sum + ((p.quantity || p.rtoQuantity || 0) * (p.price || 0)), 0).toFixed(2)}</h3>
          <small style={{ color: '#666' }}>Total Value</small>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', borderBottom: '2px solid #e0e0e0' }}>
        <button 
          style={{
            padding: '0.8rem 1.5rem',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontWeight: '600',
            color: activeTab === 'RTO' ? '#667eea' : '#666',
            borderBottom: activeTab === 'RTO' ? '2px solid #667eea' : 'none'
          }}
          onClick={() => setActiveTab('RTO')}
        >
          📦 RTO Products
        </button>
        <button 
          style={{
            padding: '0.8rem 1.5rem',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontWeight: '600',
            color: activeTab === 'RPU' ? '#667eea' : '#666',
            borderBottom: activeTab === 'RPU' ? '2px solid #667eea' : 'none'
          }}
          onClick={() => setActiveTab('RPU')}
        >
          🔄 RPU Products
        </button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading products...</p>
        </div>
      ) : products.length === 0 ? (
        <Alert variant="info">No {activeTab} products found. Create {activeTab} entries from the Products page.</Alert>
      ) : (
        <StyledTable responsive>
          <thead>
            <tr>
              <th>Return ID</th>
              <th>Product Name</th>
              <th>Customer</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
              <th>Reason</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product._id}>
                <td>
                  <Badge bg={activeTab === 'RTO' ? 'warning' : 'info'}>
                    {product.rtoId || product.barcode || 'N/A'}
                  </Badge>
                </td>
                <td>{product.productName || product.name}</td>
                <td>{product.customerName || 'N/A'}</td>
                <td>{product.quantity || product.rtoQuantity}</td>
                <td>₹{(product.price || 0).toFixed(2)}</td>
                <td>₹{((product.quantity || product.rtoQuantity || 0) * (product.price || 0)).toFixed(2)}</td>
                <td>
                  <Badge bg="secondary">
                    {product.reason || product.rtoReason || 'N/A'}
                  </Badge>
                </td>
                <td>{product.returnDate ? new Date(product.returnDate).toLocaleDateString() : 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </StyledTable>
      )}

      {/* RTO Inventory Table */}
      <div style={{ marginTop: '1.5rem' }}>
        <h4>RTO Inventory</h4>
        {rtoItems.length === 0 ? (
          <Alert variant="info">No RTO persistent inventory available.</Alert>
        ) : (
          <StyledTable responsive>
            <thead>
              <tr>
                <th>S.No.</th>
                <th>Date</th>
                <th>RTO ID</th>
                <th>Customer Name</th>
                <th>Product ID</th>
                <th>Product Name</th>
                <th>Quantity Added</th>
                <th>Remaining Quantity</th>
                <th>Unit Price</th>
              </tr>
            </thead>
            <tbody>
              {rtoItems.map((r, idx) => (
                <tr key={r._id}>
                  <td>{idx + 1}</td>
                  <td>{r.dateAdded ? new Date(r.dateAdded).toLocaleDateString() : 'N/A'}</td>
                  <td>{r.rtoId}</td>
                  <td>{r.addedBy || r.customerName || '-'}</td>
                  <td>{r.product?._id || r.product || '-'}</td>
                  <td>{r.productName || r.product?.name || '-'}</td>
                  <td>{(r.initialQuantity ?? r.quantity) || 0}</td>
                  <td>{r.quantity || 0}</td>
                  <td>₹{(r.price || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </StyledTable>
        )}
      </div>
    </Container>
  );
};

export default RTOProducts;