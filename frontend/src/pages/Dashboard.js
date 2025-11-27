import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { productsAPI, purchasesAPI, salesAPI } from '../services/api';

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

const progressBar = keyframes`
  from { width: 0%; }
  to { width: 100%; }
`;

// Styled Components
const DashboardContainer = styled.div`
  padding: 2rem;
  animation: ${fadeIn} 0.5s ease-out;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const DashboardHeader = styled.div`
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
  
  p {
    color: #7f8c8d;
    margin-top: 0.5rem;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
  
  @media (max-width: 576px) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s ease;
  animation: ${fadeIn} 0.5s ease-out;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
  }
  
  ${props => props.highlight && css`
    border-left: 4px solid #e74c3c;
  `}
`;

const StatIcon = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: white;
  
  ${props => {
    switch(props.variant) {
      case 'products': return css`background: linear-gradient(135deg, #3498db, #2980b9);`;
      case 'purchases': return css`background: linear-gradient(135deg, #9b59b6, #8e44ad);`;
      case 'sales': return css`background: linear-gradient(135deg, #2ecc71, #27ae60);`;
      case 'lowstock': return css`background: linear-gradient(135deg, #e74c3c, #c0392b);`;
      default: return css`background: linear-gradient(135deg, #3498db, #2980b9);`;
    }
  }}
`;

const StatContent = styled.div`
  flex: 1;
`;

const StatValue = styled.h3`
  margin: 0;
  font-size: 1.8rem;
  font-weight: 700;
  color: #2c3e50;
`;

const StatLabel = styled.p`
  margin: 0.3rem 0 0;
  color: #7f8c8d;
  font-weight: 500;
`;

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
  
  @media (max-width: 992px) {
    grid-template-columns: 1fr;
  }
`;

const DashboardCard = styled.div`
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
  animation: ${slideIn} 0.5s ease-out;
`;

const CardHeader = styled.div`
  padding: 1.2rem 1.5rem;
  border-bottom: 1px solid #f1f2f6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  h3 {
    margin: 0;
    color: #2c3e50;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
`;

const ViewAllLink = styled.a`
  color: #3498db;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover {
    color: #2980b9;
    text-decoration: underline;
  }
`;

const CardBody = styled.div`
  padding: 1.5rem;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  thead {
    background: #f8f9fa;
  }
  
  th {
    padding: 0.8rem;
    text-align: left;
    font-weight: 600;
    color: #7f8c8d;
    font-size: 0.9rem;
    border-bottom: 2px solid #f1f2f6;
  }
  
  tbody tr {
    border-bottom: 1px solid #f1f2f6;
    transition: all 0.2s ease;
    
    &:hover {
      background: #f8f9fa;
    }
    
    &:last-child {
      border-bottom: none;
    }
  }
  
  td {
    padding: 1rem 0.8rem;
    color: #2c3e50;
  }
`;

const StatusBadge = styled.span`
  padding: 0.3rem 0.8rem;
  border-radius: 50px;
  font-size: 0.8rem;
  font-weight: 500;
  
  ${props => {
    switch(props.variant) {
      case 'low': return css`
        background: rgba(231, 76, 60, 0.15);
        color: #e74c3c;
      `;
      case 'medium': return css`
        background: rgba(241, 196, 15, 0.15);
        color: #f39c12;
      `;
      case 'high': return css`
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

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  color: #7f8c8d;
  
  i {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    display: block;
    color: #bdc3c7;
  }
  
  p {
    margin: 0.5rem 0 0;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem;
  
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

const ProgressBar = styled.div`
  height: 6px;
  background: #f1f2f6;
  border-radius: 3px;
  overflow: hidden;
  margin-top: 0.5rem;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(to right, #3498db, #2ecc71);
  border-radius: 3px;
  animation: ${progressBar} 1.5s ease-out;
  width: ${props => props.percentage}%;
`;

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalPurchases: 0,
    totalSales: 0,
    lowStockCount: 0
  });
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [recentPurchases, setRecentPurchases] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          productsRes,
          lowStockRes,
          purchasesRes,
          salesRes
        ] = await Promise.all([
          productsAPI.getAll(),
          productsAPI.getLowStock(),
          purchasesAPI.getAll(),
          salesAPI.getAll()
        ]);

        setStats({
          totalProducts: productsRes.data.length,
          totalPurchases: purchasesRes.data.length,
          totalSales: salesRes.data.length,
          lowStockCount: lowStockRes.data.length
        });

        setLowStockProducts(lowStockRes.data.slice(0, 5));
        setRecentPurchases(purchasesRes.data.slice(0, 5));
        setRecentSales(salesRes.data.slice(0, 5));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStockStatus = (quantity) => {
    if (quantity <= 10) return 'low';
    if (quantity <= 25) return 'medium';
    return 'high';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <DashboardContainer>
        <LoadingSpinner />
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <DashboardHeader>
        <h2>Dashboard</h2>
        <p>Welcome to your Inventory Management System</p>
      </DashboardHeader>

      <StatsGrid>
        <StatCard>
          <StatIcon variant="products">
            <i className="bi bi-box"></i>
          </StatIcon>
          <StatContent>
            <StatValue>{stats.totalProducts}</StatValue>
            <StatLabel>Total Products</StatLabel>
            <ProgressBar>
              <ProgressFill percentage={Math.min((stats.totalProducts / 100) * 100, 100)} />
            </ProgressBar>
          </StatContent>
        </StatCard>

        <StatCard>
          <StatIcon variant="purchases">
            <i className="bi bi-cart-plus"></i>
          </StatIcon>
          <StatContent>
            <StatValue>{stats.totalPurchases}</StatValue>
            <StatLabel>Total Purchases</StatLabel>
            <ProgressBar>
              <ProgressFill percentage={Math.min((stats.totalPurchases / 50) * 100, 100)} />
            </ProgressBar>
          </StatContent>
        </StatCard>

        <StatCard>
          <StatIcon variant="sales">
            <i className="bi bi-cart-check"></i>
          </StatIcon>
          <StatContent>
            <StatValue>{stats.totalSales}</StatValue>
            <StatLabel>Total Sales</StatLabel>
            <ProgressBar>
              <ProgressFill percentage={Math.min((stats.totalSales / 50) * 100, 100)} />
            </ProgressBar>
          </StatContent>
        </StatCard>

        <StatCard highlight={stats.lowStockCount > 0}>
          <StatIcon variant="lowstock">
            <i className="bi bi-exclamation-triangle"></i>
          </StatIcon>
          <StatContent>
            <StatValue>{stats.lowStockCount}</StatValue>
            <StatLabel>Low Stock Items</StatLabel>
            <ProgressBar>
              <ProgressFill percentage={Math.min((stats.lowStockCount / 10) * 100, 100)} />
            </ProgressBar>
          </StatContent>
        </StatCard>
      </StatsGrid>

      <DashboardGrid>
        <DashboardCard>
          <CardHeader>
            <h3><i className="bi bi-exclamation-triangle"></i> Low Stock Products</h3>
            <ViewAllLink href="/products">View All</ViewAllLink>
          </CardHeader>
          <CardBody>
            {lowStockProducts.length > 0 ? (
              <StyledTable>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockProducts.map(product => (
                    <tr key={product._id}>
                      <td>{product.name}</td>
                      <td>{product.quantity}</td>
                      <td>
                        <StatusBadge variant={getStockStatus(product.quantity)}>
                          {getStockStatus(product.quantity).toUpperCase()}
                        </StatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </StyledTable>
            ) : (
              <EmptyState>
                <i className="bi bi-check-circle"></i>
                <p>No low stock products</p>
                <small>All products are well stocked</small>
              </EmptyState>
            )}
          </CardBody>
        </DashboardCard>

        <DashboardCard>
          <CardHeader>
            <h3><i className="bi bi-cart-plus"></i> Recent Purchases</h3>
            <ViewAllLink href="/purchases">View All</ViewAllLink>
          </CardHeader>
          <CardBody>
            {recentPurchases.length > 0 ? (
              <StyledTable>
                <thead>
                  <tr>
                    <th>Vendor</th>
                    <th>Amount</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPurchases.map(purchase => (
                    <tr key={purchase._id}>
                      <td>{purchase.vendor?.name || 'Unknown Vendor'}</td>
                      <td>{formatCurrency(purchase.totalAmount)}</td>
                      <td>{new Date(purchase.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </StyledTable>
            ) : (
              <EmptyState>
                <i className="bi bi-cart"></i>
                <p>No recent purchases</p>
                <small>Purchases will appear here</small>
              </EmptyState>
            )}
          </CardBody>
        </DashboardCard>
      </DashboardGrid>

      <DashboardGrid>
        <DashboardCard>
          <CardHeader>
            <h3><i className="bi bi-cart-check"></i> Recent Sales</h3>
            <ViewAllLink href="/sales">View All</ViewAllLink>
          </CardHeader>
          <CardBody>
            {recentSales.length > 0 ? (
              <StyledTable>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.map(sale => (
                    <tr key={sale._id}>
                      <td>{sale.buyer?.name || 'Unknown Buyer'}</td>
                      <td>{formatCurrency(sale.totalAmount)}</td>
                      <td>{new Date(sale.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </StyledTable>
            ) : (
              <EmptyState>
                <i className="bi bi-receipt"></i>
                <p>No recent sales</p>
                <small>Sales will appear here</small>
              </EmptyState>
            )}
          </CardBody>
        </DashboardCard>
      </DashboardGrid>
    </DashboardContainer>
  );
};

export default Dashboard;