import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  CircularProgress,
  Alert
} from '@mui/material';
import { purchasesAPI, salesAPI, reportsAPI, returnsAPI, profitLossAPI, uploadedProfitSheetsAPI } from '../services/api';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Cell,
} from 'recharts';

// Theme Colors - Premium Gold & Black
const THEME = {
  gold: '#D4AF37',
  richGold: '#C9A227',
  softGold: '#E2C878',
  lightGold: '#F4E3B2',
  black: '#000000',
  charcoal: '#1A1A1A',
  softCharcoal: '#2C2C2C',
  white: '#FFFFFF',
  offWhite: '#F8F5F0'
};

const Reports = () => {
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [filter, setFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [chartData, setChartData] = useState([]);
  const [productData, setProductData] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [graphLoading, setGraphLoading] = useState(false);
  const [reportSummary, setReportSummary] = useState(null);
  const [productSummary, setProductSummary] = useState(null);
  const [statusData, setStatusData] = useState([]);
  const [statusSummary, setStatusSummary] = useState(null);
  const [selectedSheetId, setSelectedSheetId] = useState('all');
  const [uploadedSheets, setUploadedSheets] = useState([]);
  const [uploadResults, setUploadResults] = useState([]);
  const [comboDetails, setComboDetails] = useState({});

  useEffect(() => {
    fetchData();
    fetchProducts();
    fetchUploadedSheets();
  }, []);

  useEffect(() => {
    fetchChartData();
  }, [filter]);

  useEffect(() => {
    if (selectedProduct) {
      fetchProductMonthlyData();
    }
  }, [selectedProduct, filter]);

  useEffect(() => {
    fetchSheetStatusData();
  }, [selectedSheetId, uploadedSheets]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [purchasesRes, salesRes] = await Promise.all([
        purchasesAPI.getAll(),
        salesAPI.getAll()
      ]);
      setPurchases(purchasesRes.data);
      setSales(salesRes.data);
    } catch (error) {
      setError('Failed to fetch reports data');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await reportsAPI.getProductsList();
      setProducts(res.data || []);
      if (res.data && res.data.length > 0) {
        setSelectedProduct(res.data[0]._id);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const fetchUploadedSheets = async () => {
    try {
      const res = await uploadedProfitSheetsAPI.getAll();
      setUploadedSheets(res.data || []);
    } catch (error) {
      console.error('Failed to fetch sheets:', error);
    }
  };

  const fetchChartData = async () => {
    setGraphLoading(true);
    try {
      const response = await reportsAPI.getPurchaseSalesData(filter.startDate, filter.endDate);
      setChartData(response.data.chartData || []);
      setReportSummary(response.data.summary || null);
    } catch (error) {
      console.error('Failed to fetch chart data:', error);
    } finally {
      setGraphLoading(false);
    }
  };

  const fetchProductMonthlyData = async () => {
    try {
      const response = await reportsAPI.getProductMonthlyData(
        selectedProduct,
        filter.startDate,
        filter.endDate
      );
      setProductData(response.data.chartData || []);
      setProductSummary(response.data.summary || null);
    } catch (error) {
      console.error('Failed to fetch product data:', error);
    }
  };

  const fetchSheetStatusData = () => {
    let rtoCount = 0;
    let rpuCount = 0;
    let deliveredCount = 0;

    let targetSheets = [];

    if (selectedSheetId === 'all') {
      targetSheets = uploadedSheets;
    } else {
      targetSheets = uploadedSheets.filter(sheet => sheet._id === selectedSheetId);
    }

    targetSheets.forEach(sheet => {
      if (sheet.statusSummary) {
        rtoCount += (sheet.statusSummary.rto?.count || 0);
        rpuCount += (sheet.statusSummary.rpu?.count || 0);
        deliveredCount += (sheet.statusSummary.delivered?.count || 0);
      }
    });

    const statusCounts = {
      RTO: rtoCount,
      RPU: rpuCount,
      Delivered: deliveredCount
    };

    const chartData = Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count
    }));

    const summary = {
      totalRTO: statusCounts.RTO,
      totalRPU: statusCounts.RPU,
      totalDelivered: statusCounts.Delivered,
      total: statusCounts.RTO + statusCounts.RPU + statusCounts.Delivered
    };

    setStatusData(chartData);
    setStatusSummary(summary);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({ ...prev, [name]: value }));
  };

  const handleProductChange = (e) => {
    setSelectedProduct(e.target.value);
  };

  const handleStatusProductChange = (e) => {
    setSelectedStatusProduct(e.target.value);
  };

  const clearFilters = () => {
    setFilter({
      startDate: '',
      endDate: ''
    });
  };

  const filteredPurchases = purchases.filter(p => {
    const date = new Date(p.purchaseDate);
    const start = filter.startDate ? new Date(filter.startDate) : null;
    const end = filter.endDate ? new Date(filter.endDate) : null;
    return (!start || date >= start) && (!end || date <= end);
  });

  const filteredSales = sales.filter(s => {
    const date = new Date(s.saleDate);
    const start = filter.startDate ? new Date(filter.startDate) : null;
    const end = filter.endDate ? new Date(filter.endDate) : null;
    return (!start || date >= start) && (!end || date <= end);
  });

  const calculateTotals = (items) => {
    return items.reduce((sum, item) => sum + item.totalAmount, 0);
  };

  const calculateProfit = () => {
    const totalSales = calculateTotals(filteredSales);
    const totalPurchases = calculateTotals(filteredPurchases);
    return totalSales - totalPurchases;
  };

  const exportToCSV = (data, filename) => {
    const headers = Object.keys(data[0] || {}).join(',');
    const rows = data.map(item => Object.values(item).join(','));
    const csv = [headers, ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  /* Removed handleReportFileUpload logic */

  if (loading && purchases.length === 0 && sales.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#fff' }}>
        <CircularProgress sx={{ color: THEME.gold }} />
      </Box>
    );
  }

  const selectedProductName = products.find(p => p._id === selectedProduct)?.name || 'Product';

  return (
    <Box sx={{ p: 3, bgcolor: '#fff', minHeight: '100vh' }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
        <Typography variant="h4" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', mb: 1 }}>
          <span style={{ fontSize: '2rem', marginRight: '1rem' }}>📊</span>
          Financial Reports & Analytics
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Comprehensive reports and analytics dashboard
        </Typography>
      </Paper>

      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Spreadsheet Status Report (RTO, RPU, Delivered) */}
      <Paper sx={{ p: 3, mb: 3, border: `1px solid ${THEME.softGold}`, boxShadow: 'none' }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: THEME.black, display: 'flex', alignItems: 'center', gap: 1 }}>
          <span>📊</span>
          Spreadsheet Status Report (RTO, RPU, Delivered)
        </Typography>

        <FormControl fullWidth sx={{ mb: 4 }}>
          <InputLabel>Select Spreadsheet</InputLabel>
          <Select
            value={selectedSheetId}
            onChange={(e) => setSelectedSheetId(e.target.value)}
            label="Select Spreadsheet"
          >
            <MenuItem value="all">All Spreadsheets</MenuItem>
            {uploadedSheets.map(sheet => (
              <MenuItem key={sheet._id} value={sheet._id}>
                {sheet.fileName} ({new Date(sheet.uploadDate).toLocaleDateString()})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Status Summary */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Paper 
            sx={{ 
              p: 4,
              display: 'inline-block',
              background: 'linear-gradient(135deg, #1A1A1A 0%, #2B262A 100%)',
              color: '#F8F5F0', 
              border: `2px solid ${THEME.gold}`,
              boxShadow: '0 8px 32px rgba(212, 175, 55, 0.15)',
              borderRadius: 3,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
              }
            }}
          >
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700, 
                textAlign: 'center', 
                mb: 4,
                color: THEME.gold,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                fontSize: { xs: '1.5rem', md: '2rem' }
              }}
            >
              Status Summary for {selectedSheetId === 'all' ? 'All Spreadsheets' : uploadedSheets.find(s => s._id === selectedSheetId)?.fileName || 'Selected Sheet'}
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Box 
                    sx={{ 
                      textAlign: 'center',
                      p: 3,
                      background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(201, 162, 39, 0.12) 100%)',
                      borderRadius: 2,
                      border: '1px solid rgba(212, 175, 55, 0.2)',
                      transition: 'all 0.3s ease',
                      display: 'inline-block',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 24px rgba(212, 175, 55, 0.25)',
                        border: '1px solid rgba(212, 175, 55, 0.4)',
                      }
                    }}
                  >
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        mb: 2, 
                        color: THEME.lightGold,
                        fontWeight: 500,
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        fontSize: '0.85rem',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      📦 Delivered
                    </Typography>
                    <Typography 
                      variant="h3" 
                      sx={{ 
                        fontWeight: 800,
                        color: '#48bb78',
                        fontSize: { xs: '2rem', md: '2.5rem' },
                        textShadow: '0 2px 8px rgba(72, 187, 120, 0.3)',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {statusSummary?.totalDelivered || 0}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Box 
                    sx={{ 
                      textAlign: 'center',
                      p: 3,
                      background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(201, 162, 39, 0.12) 100%)',
                      borderRadius: 2,
                      border: '1px solid rgba(212, 175, 55, 0.2)',
                      transition: 'all 0.3s ease',
                      display: 'inline-block',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 24px rgba(212, 175, 55, 0.25)',
                        border: '1px solid rgba(212, 175, 55, 0.4)',
                      }
                    }}
                  >
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        mb: 2, 
                        color: THEME.lightGold,
                        fontWeight: 500,
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        fontSize: '0.85rem',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      ↩️ RTO
                    </Typography>
                    <Typography 
                      variant="h3" 
                      sx={{ 
                        fontWeight: 800,
                        color: '#e53e3e',
                        fontSize: { xs: '2rem', md: '2.5rem' },
                        textShadow: '0 2px 8px rgba(229, 62, 62, 0.3)',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {statusSummary?.totalRTO || 0}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Box 
                    sx={{ 
                      textAlign: 'center',
                      p: 3,
                      background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(201, 162, 39, 0.12) 100%)',
                      borderRadius: 2,
                      border: '1px solid rgba(212, 175, 55, 0.2)',
                      transition: 'all 0.3s ease',
                      display: 'inline-block',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 24px rgba(212, 175, 55, 0.25)',
                        border: '1px solid rgba(212, 175, 55, 0.4)',
                      }
                    }}
                  >
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        mb: 2, 
                        color: THEME.lightGold,
                        fontWeight: 500,
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        fontSize: '0.85rem',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      🔄 RPU
                    </Typography>
                    <Typography 
                      variant="h3" 
                      sx={{ 
                        fontWeight: 800,
                        color: '#ed8936',
                        fontSize: { xs: '2rem', md: '2.5rem' },
                        textShadow: '0 2px 8px rgba(237, 137, 54, 0.3)',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {statusSummary?.totalRPU || 0}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Box 
                    sx={{ 
                      textAlign: 'center',
                      p: 3,
                      background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(201, 162, 39, 0.2) 100%)',
                      borderRadius: 2,
                      border: `1px solid rgba(212, 175, 55, 0.3)`,
                      transition: 'all 0.3s ease',
                      display: 'inline-block',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 24px rgba(212, 175, 55, 0.35)',
                        border: `1px solid rgba(212, 175, 55, 0.5)`,
                      }
                    }}
                  >
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        mb: 2, 
                        color: THEME.lightGold,
                        fontWeight: 500,
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        fontSize: '0.85rem',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      📊 Total
                    </Typography>
                    <Typography 
                      variant="h3" 
                      sx={{ 
                        fontWeight: 800,
                        color: THEME.gold,
                        fontSize: { xs: '2rem', md: '2.5rem' },
                        textShadow: '0 2px 8px rgba(212, 175, 55, 0.3)',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {statusSummary?.total || 0}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Box>

        {/* Chart */}
        {statusData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={statusData} margin={{ top: 40, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#f8f9fa',
                  border: `2px solid ${THEME.gold}`,
                  borderRadius: '10px'
                }}
                labelFormatter={(label) => `Status: ${label}`}
                formatter={(value) => [value, 'Count']}
              />
              <Legend />
              <Bar
                dataKey="count"
                name="Count"
                label={{ position: 'top', fontSize: 14, fontWeight: 'bold' }}
              >
                {statusData.map((entry, index) => {
                  const colors = { 'Delivered': '#48bb78', 'RTO': '#e53e3e', 'RPU': '#ed8936' };
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={colors[entry.status] || THEME.gold}
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Box sx={{ textAlign: 'center', py: 5, color: 'text.secondary' }}>
            <Typography>No status data available for the selected selection.</Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default Reports;
