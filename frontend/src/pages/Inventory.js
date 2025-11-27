import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { productsAPI } from '../services/api';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideIn = keyframes`
  from { transform: translateX(-100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% {transform: translateY(0);}
  40% {transform: translateY(-8px);}
  60% {transform: translateY(-4px);}
`;

const shake = keyframes`
  0%, 100% {transform: translateX(0);}
  10%, 30%, 50%, 70%, 90% {transform: translateX(-5px);}
  20%, 40%, 60%, 80% {transform: translateX(5px);}
`;

// Styled Components
const PageContainer = styled.div`
  padding: 2rem;
  animation: ${fadeIn} 0.5s ease-out;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const PageHeader = styled.div`
  margin-bottom: 2rem;
  
  h2 {
    color: #2c3e50;
    font-weight: 700;
    position: relative;
    padding-bottom: 0.5rem;
    
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 60px;
      height: 4px;
      background: linear-gradient(to right, #3498db, #2ecc71);
      border-radius: 2px;
    }
  }
`;

const AlertMessage = styled.div`
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  animation: ${slideIn} 0.3s ease-out;
  
  ${props => props.variant === 'danger' && css`
    background: rgba(231, 76, 60, 0.15);
    color: #e74c3c;
    border-left: 4px solid #e74c3c;
  `}
  
  ${props => props.variant === 'success' && css`
    background: rgba(46, 204, 113, 0.15);
    color: #27ae60;
    border-left: 4px solid #27ae60;
  `}
  
  ${props => props.variant === 'warning' && css`
    background: rgba(241, 196, 15, 0.15);
    color: #f39c12;
    border-left: 4px solid #f39c12;
    animation: ${shake} 0.5s ease-in-out;
  `}
`;

const CloseAlert = styled.button`
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  margin-left: auto;
  padding: 0.2rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(0, 0, 0, 0.1);
  }
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
  
  h4 {
    color: #2c3e50;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`;

const ActionButton = styled.button`
  background: linear-gradient(to right, #3498db, #2ecc71);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.6rem 1.2rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(52, 152, 219, 0.3);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(52, 152, 219, 0.4);
    animation: ${pulse} 1s;
  }
`;

const TableContainer = styled.div`
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 5px 25px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
  animation: ${fadeIn} 0.6s ease-out;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  thead {
    background: linear-gradient(to right, #4a6fa5, #2c3e50);
    color: white;
  }
  
  th {
    padding: 1.2rem 1rem;
    text-align: left;
    font-weight: 600;
    font-size: 0.95rem;
  }
  
  tbody tr {
    border-bottom: 1px solid #f1f2f6;
    transition: all 0.3s ease;
    
    &:hover {
      background: #f8f9fa;
      transform: translateY(-2px);
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
    }
    
    &:last-child {
      border-bottom: none;
    }
  }
  
  td {
    padding: 1rem;
    color: #2c3e50;
  }
  
  @media (max-width: 992px) {
    th:nth-child(4),
    td:nth-child(4),
    th:nth-child(5),
    td:nth-child(5) {
      display: none;
    }
  }
  
  @media (max-width: 768px) {
    th:nth-child(3),
    td:nth-child(3) {
      display: none;
    }
  }
`;

const StatusBadge = styled.span`
  padding: 0.3rem 0.8rem;
  border-radius: 50px;
  font-size: 0.8rem;
  font-weight: 500;
  
  ${props => {
    switch(props.variant) {
      case 'critical': return css`
        background: rgba(231, 76, 60, 0.15);
        color: #e74c3c;
        animation: ${pulse} 2s infinite;
      `;
      case 'low': return css`
        background: rgba(241, 196, 15, 0.15);
        color: #f39c12;
      `;
      case 'good': return css`
        background: rgba(46, 204, 113, 0.15);
        color: #27ae60;
      `;
      default: return css`
        background: #f1f2f6;
        color: #7f8c8d;
      `;
    }
  }}
`;

const StockIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ProgressBar = styled.div`
  flex: 1;
  height: 6px;
  background: #f1f2f6;
  border-radius: 3px;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
  
  ${props => {
    const percentage = (props.current / props.max) * 100;
    
    if (percentage <= 20) return css`
      background: #e74c3c;
      width: ${percentage}%;
    `;
    if (percentage <= 50) return css`
      background: #f39c12;
      width: ${percentage}%;
    `;
    return css`
      background: #2ecc71;
      width: ${percentage}%;
    `;
  }}
`;

const ActionCell = styled.td`
  display: flex;
  gap: 0.5rem;
  
  @media (max-width: 576px) {
    flex-direction: column;
  }
`;

const IconButton = styled.button`
  background: ${props => props.variant === 'edit' 
    ? 'rgba(52, 152, 219, 0.1)' 
    : 'rgba(231, 76, 60, 0.1)'};
  color: ${props => props.variant === 'edit' 
    ? '#3498db' 
    : '#e74c3c'};
  border: none;
  border-radius: 6px;
  padding: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.variant === 'edit' 
      ? 'rgba(52, 152, 219, 0.2)' 
      : 'rgba(231, 76, 60, 0.2)'};
    transform: translateY(-2px);
    animation: ${bounce} 0.8s ease;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: #7f8c8d;
  
  i {
    font-size: 3rem;
    margin-bottom: 1rem;
    display: block;
    color: #bdc3c7;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  
  &::after {
    content: '';
    width: 40px;
    height: 40px;
    border: 4px solid #f1f2f6;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Column visibility states
  const [lowStockColumns, setLowStockColumns] = useState({
    product: true,
    currentStock: true,
    status: true,
    vendor: true
  });
  
  const [productColumns, setProductColumns] = useState({
    name: true,
    id: true,
    category: true,
    stockLevel: true,
    price: true,
    total: true,
    vendor: true,
    status: true
  });

  useEffect(() => {
    fetchInventory();
    fetchLowStock();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getAll();
      setProducts(response.data);
      setError('');
    } catch (error) {
      setError('Failed to fetch inventory. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLowStock = async () => {
    try {
      const response = await productsAPI.getLowStock();
      setLowStock(response.data);
    } catch (error) {
      console.error('Failed to fetch low stock');
    }
  };

  const clearError = () => {
    setError('');
  };

  const getStockStatus = (quantity, minquantity) => {
    if (quantity <= minquantity) return 'critical';
    return 'good';
  };

  const getStockStatusText = (quantity, minquantity) => {
    if (quantity <= minquantity) return 'CRITICAL';
    return 'GOOD';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const toggleLowStockColumn = (column) => {
    setLowStockColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  const toggleProductColumn = (column) => {
    setProductColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  if (loading) {
    return (
      <PageContainer>
        <LoadingSpinner />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader>
        <h2>Inventory Management</h2>
      </PageHeader>

      {error && (
        <AlertMessage variant="danger">
          <i className="bi bi-exclamation-circle"></i>
          {error}
          <CloseAlert onClick={clearError}>
            <i className="bi bi-x"></i>
          </CloseAlert>
        </AlertMessage>
      )}

      <SectionHeader>
        <h4>
          <i className="bi bi-exclamation-triangle"></i>
          Low Stock Alerts
        </h4>
        <ActionButton onClick={fetchLowStock}>
          <i className="bi bi-arrow-repeat"></i>
          Refresh
        </ActionButton>
      </SectionHeader>

      <TableContainer>
        {lowStock.length > 0 ? (
          <StyledTable>
            <thead>
              <tr>
                <th>
                  <input 
                    type="checkbox" 
                    checked={lowStockColumns.product} 
                    onChange={() => toggleLowStockColumn('product')}
                    style={{ marginRight: '0.5rem', transform: 'scale(1.1)' }}
                  />
                  Product
                </th>
                <th>
                  <input 
                    type="checkbox" 
                    checked={lowStockColumns.currentStock} 
                    onChange={() => toggleLowStockColumn('currentStock')}
                    style={{ marginRight: '0.5rem', transform: 'scale(1.1)' }}
                  />
                  Current Stock
                </th>
                <th>
                  <input 
                    type="checkbox" 
                    checked={lowStockColumns.status} 
                    onChange={() => toggleLowStockColumn('status')}
                    style={{ marginRight: '0.5rem', transform: 'scale(1.1)' }}
                  />
                  Status
                </th>
                <th>
                  <input 
                    type="checkbox" 
                    checked={lowStockColumns.vendor} 
                    onChange={() => toggleLowStockColumn('vendor')}
                    style={{ marginRight: '0.5rem', transform: 'scale(1.1)' }}
                  />
                  Vendor
                </th>
              </tr>
            </thead>
            <tbody>
              {lowStock.map(product => (
                <tr key={product._id}>
                  <td>
                    {lowStockColumns.product ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #3498db, #2980b9)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '0.8rem',
                          fontWeight: 'bold'
                        }}>
                          {product.name.charAt(0)}
                        </div>
                        {product.name}
                      </div>
                    ) : (
                      <span style={{ color: '#ccc' }}>---</span>
                    )}
                  </td>
                  <td>
                    {lowStockColumns.currentStock ? product.quantity : <span style={{ color: '#ccc' }}>---</span>}
                  </td>
                  <td>
                    {lowStockColumns.status ? (
                      <StatusBadge variant={getStockStatus(product.quantity, product.reorderLevel)}>
                        {getStockStatusText(product.quantity, product.reorderLevel)}
                      </StatusBadge>
                    ) : (
                      <span style={{ color: '#ccc' }}>---</span>
                    )}
                  </td>
                  <td>
                    {lowStockColumns.vendor ? (product.vendor?.name || 'N/A') : <span style={{ color: '#ccc' }}>---</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </StyledTable>
        ) : (
          <AlertMessage variant="success">
            <i className="bi bi-check-circle"></i>
            No low stock items. All products are well stocked!
          </AlertMessage>
        )}
      </TableContainer>

      <SectionHeader>
        <h4>
          <i className="bi bi-box"></i>
          All Products
        </h4>
        <ActionButton onClick={fetchInventory}>
          <i className="bi bi-arrow-repeat"></i>
          Refresh
        </ActionButton>
      </SectionHeader>

      <TableContainer>
        {products.length > 0 ? (
          <StyledTable>
            <thead>
              <tr>
                <th>
                  <input 
                    type="checkbox" 
                    checked={productColumns.name} 
                    onChange={() => toggleProductColumn('name')}
                    style={{ marginRight: '0.5rem', transform: 'scale(1.1)' }}
                  />
                  Name
                </th>
                <th>
                  <input 
                    type="checkbox" 
                    checked={productColumns.id} 
                    onChange={() => toggleProductColumn('id')}
                    style={{ marginRight: '0.5rem', transform: 'scale(1.1)' }}
                  />
                  ID
                </th>
                <th>
                  <input 
                    type="checkbox" 
                    checked={productColumns.category} 
                    onChange={() => toggleProductColumn('category')}
                    style={{ marginRight: '0.5rem', transform: 'scale(1.1)' }}
                  />
                  Category
                </th>
                <th>
                  <input 
                    type="checkbox" 
                    checked={productColumns.stockLevel} 
                    onChange={() => toggleProductColumn('stockLevel')}
                    style={{ marginRight: '0.5rem', transform: 'scale(1.1)' }}
                  />
                  Stock Level
                </th>
                <th>
                  <input 
                    type="checkbox" 
                    checked={productColumns.price} 
                    onChange={() => toggleProductColumn('price')}
                    style={{ marginRight: '0.5rem', transform: 'scale(1.1)' }}
                  />
                  Price
                </th>
                <th>
                  <input 
                    type="checkbox" 
                    checked={productColumns.total} 
                    onChange={() => toggleProductColumn('total')}
                    style={{ marginRight: '0.5rem', transform: 'scale(1.1)' }}
                  />
                  Total
                </th>
                <th>
                  <input 
                    type="checkbox" 
                    checked={productColumns.vendor} 
                    onChange={() => toggleProductColumn('vendor')}
                    style={{ marginRight: '0.5rem', transform: 'scale(1.1)' }}
                  />
                  Vendor
                </th>
                <th>
                  <input 
                    type="checkbox" 
                    checked={productColumns.status} 
                    onChange={() => toggleProductColumn('status')}
                    style={{ marginRight: '0.5rem', transform: 'scale(1.1)' }}
                  />
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product._id}>
                  <td>
                    {productColumns.name ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #3498db, #2980b9)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '0.8rem',
                          fontWeight: 'bold'
                        }}>
                          {product.name.charAt(0)}
                        </div>
                        {product.name}
                      </div>
                    ) : (
                      <span style={{ color: '#ccc' }}>---</span>
                    )}
                  </td>
                  <td>
                    {productColumns.id ? product.barcode : <span style={{ color: '#ccc' }}>---</span>}
                  </td>
                  <td>
                    {productColumns.category ? (
                      typeof product.category === 'object' 
                        ? product.category?.name || 'Uncategorized'
                        : product.category || 'Uncategorized'
                    ) : <span style={{ color: '#ccc' }}>---</span>}
                  </td>
                  <td>
                    {productColumns.stockLevel ? (
                      <StockIndicator>
                        <span>{product.quantity}</span>
                        <ProgressBar>
                          <ProgressFill   
                            current={product.quantity} 
                            max={Math.max(product.quantity * 2, 100)} 
                          />
                        </ProgressBar>
                      </StockIndicator>
                    ) : (
                      <span style={{ color: '#ccc' }}>---</span>
                    )}
                  </td>
                  <td>
                    {productColumns.price ? formatCurrency(product.price) : <span style={{ color: '#ccc' }}>---</span>}
                  </td>
                  <td>
                    {productColumns.total ? formatCurrency(product.price * product.quantity) : <span style={{ color: '#ccc' }}>---</span>}
                  </td>
                  <td>
                    {productColumns.vendor ? (product.vendor?.name || 'N/A') : <span style={{ color: '#ccc' }}>---</span>}
                  </td>
                  <td>
                    {productColumns.status ? (
                      <StatusBadge variant={getStockStatus(product.quantity, product.reorderLevel || 10)}>
                        {getStockStatusText(product.quantity, product.reorderLevel || 10)}
                      </StatusBadge>
                    ) : (
                      <span style={{ color: '#ccc' }}>---</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </StyledTable>
        ) : (
          <EmptyState>
            <i className="bi bi-box"></i>
            <h3>No Products Found</h3>
            <p>Get started by adding your first product.</p>
          </EmptyState>
        )}
      </TableContainer>
    </PageContainer>
  );
};

export default Inventory;
