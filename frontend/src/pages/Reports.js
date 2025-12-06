import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Snackbar,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  FileDownload as FileDownloadIcon,
  Clear as ClearIcon,
  Assessment as AssessmentIcon,
  ShoppingCart as ShoppingCartIcon,
  AttachMoney as AttachMoneyIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { purchasesAPI, salesAPI, reportsAPI, returnsAPI } from '../services/api';
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
  const [selectedStatusProduct, setSelectedStatusProduct] = useState('');

  useEffect(() => {
    fetchData();
    fetchProducts();
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
    if (selectedStatusProduct) {
      console.log('Fetching status data for product:', selectedStatusProduct);
      fetchProductStatusData();
    }
  }, [selectedStatusProduct]);

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
        setSelectedStatusProduct(res.data[0]._id);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
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

  const fetchProductStatusData = async () => {
    try {
      const returnsResponse = await returnsAPI.getAll();
      const returns = returnsResponse.data || [];
      
      // Get selected product name
      const selectedProductName = products.find(p => p._id === selectedStatusProduct)?.name;
      
      // Filter returns for selected product and calculate quantities
      const productReturns = returns.filter(returnItem => 
        returnItem.items?.some(item => 
          item.product === selectedStatusProduct || 
          item.productName === selectedProductName
        )
      );
      
      // Calculate status counts by quantity
      let rtoCount = 0;
      let rpuCount = 0;
      
      productReturns.forEach(returnItem => {
        const productItems = returnItem.items?.filter(item => 
          item.product === selectedStatusProduct || 
          item.productName === selectedProductName
        ) || [];
        const totalQuantity = productItems.reduce((sum, item) => sum + item.quantity, 0);
        
        if (returnItem.category === 'RTO') {
          rtoCount += totalQuantity;
        } else if (returnItem.category === 'RPU') {
          rpuCount += totalQuantity;
        }
      });
      
      const statusCounts = {
        RTO: rtoCount,
        RPU: rpuCount,
        Delivered: 0 // This would need to come from sales data
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
    } catch (error) {
      console.error('Failed to fetch product status data:', error);
    }
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

  if (loading && purchases.length === 0 && sales.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#fafafa' }}>
        <CircularProgress sx={{ color: '#000' }} />
      </Box>
    );
  }

  const selectedProductName = products.find(p => p._id === selectedProduct)?.name || 'Product';

  return (
    <Box sx={{ backgroundColor: 'rgba(248, 245, 240, 0.85)', minHeight: '100vh', p: 3 }}>
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')}>
        <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <AssessmentIcon sx={{ fontSize: 32 }} />
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Financial Reports & Analytics
        </Typography>
      </Stack>

      {/* Statistics Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ border: '1px solid #e0e0e0', boxShadow: 'none' }}>
            <CardContent>
              <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                📈 Total Sales
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#000' }}>
                ₹{reportSummary?.totalSales.toFixed(2) || calculateTotals(filteredSales).toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ border: '1px solid #e0e0e0', boxShadow: 'none' }}>
            <CardContent>
              <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                🛒 Total Purchases
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#000' }}>
                ₹{reportSummary?.totalPurchase.toFixed(2) || calculateTotals(filteredPurchases).toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ border: '1px solid #e0e0e0', boxShadow: 'none' }}>
            <CardContent>
              <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                💰 Net Profit
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 700, 
                  color: (reportSummary?.profit || calculateProfit()) >= 0 ? '#2e7d32' : '#d32f2f' 
                }}
              >
                ₹{(reportSummary?.profit || calculateProfit()).toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ border: '1px solid #e0e0e0', boxShadow: 'none' }}>
            <CardContent>
              <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                📅 Date Range
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#000' }}>
                {filter.startDate || 'Start'} - {filter.endDate || 'End'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter Section */}
      <Paper sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          🔍 Filter Reports
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              name="startDate"
              value={filter.startDate}
              onChange={handleFilterChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="End Date"
              type="date"
              name="endDate"
              value={filter.endDate}
              onChange={handleFilterChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={clearFilters}
              sx={{
                height: '56px',
                textTransform: 'none',
                borderColor: '#e0e0e0',
                color: '#000',
                '&:hover': { borderColor: '#000', bgcolor: 'rgba(0, 0, 0, 0.04)' }
              }}
            >
              Clear Filters
            </Button>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<FileDownloadIcon />}
              onClick={() => exportToCSV([...filteredPurchases, ...filteredSales], 'financial_report')}
              sx={{
                height: '56px',
                bgcolor: '#000',
                textTransform: 'none',
                '&:hover': { bgcolor: '#333' }
              }}
            >
              Export CSV
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Purchase & Sales Trend Graph */}
      <Paper sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
          📈 Purchase & Sales Trend (Daily Breakdown)
        </Typography>
        {graphLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress sx={{ color: '#000' }} />
          </Box>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                formatter={(value) => `₹${value.toFixed(2)}`}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px'
                }}
              />
              <Legend />
              <Bar dataKey="purchaseAmount" fill="#666" name="Purchase Amount" />
              <Bar dataKey="salesAmount" fill="#000" name="Sales Amount" />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <Box sx={{ textAlign: 'center', py: 5, color: '#666' }}>
            <Typography>No data available for the selected date range</Typography>
          </Box>
        )}
      </Paper>

      {/* Product-wise Analysis */}
      <Paper sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
          🎯 Product-wise Analysis (Monthly Breakdown)
        </Typography>
        
        <FormControl fullWidth sx={{ mb: 4 }}>
          <InputLabel>Select Product</InputLabel>
          <Select
            value={selectedProduct}
            onChange={handleProductChange}
            label="Select Product"
          >
            {products.map(product => (
              <MenuItem key={product._id} value={product._id}>
                {product.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {selectedProduct && (
          <>
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Summary for {selectedProductName}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ border: '1px solid #e0e0e0', boxShadow: 'none' }}>
                    <CardContent>
                      <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                        Quantity Purchased
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#000' }}>
                        {productSummary?.totalPurchaseQuantity || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ border: '1px solid #e0e0e0', boxShadow: 'none' }}>
                    <CardContent>
                      <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                        Quantity Sold
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#000' }}>
                        {productSummary?.totalSalesQuantity || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ border: '1px solid #e0e0e0', boxShadow: 'none' }}>
                    <CardContent>
                      <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                        Purchase Value
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#000' }}>
                        ₹{productSummary?.totalPurchaseAmount.toFixed(2) || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ border: '1px solid #e0e0e0', boxShadow: 'none' }}>
                    <CardContent>
                      <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                        Sales Value
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#000' }}>
                        ₹{productSummary?.totalSalesAmount.toFixed(2) || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>

            {productData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={productData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" label={{ value: 'Quantity', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="right" orientation="right" label={{ value: 'Amount', angle: 90, position: 'insideRight' }} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px'
                    }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="purchaseQuantity" fill="#666" name="Purchase Qty" />
                  <Bar yAxisId="left" dataKey="salesQuantity" fill="#000" name="Sales Qty" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 5, color: '#666' }}>
                <Typography>No data available for this product</Typography>
              </Box>
            )}
          </>
        )}
      </Paper>

      {/* Product Status Report (RTO, RPU, Delivered) */}
      <Paper sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
          📊 Product Status Report (RTO, RPU, Delivered)
        </Typography>
        
        <FormControl fullWidth sx={{ mb: 4 }}>
          <InputLabel>Select Product</InputLabel>
          <Select
            value={selectedStatusProduct}
            onChange={handleStatusProductChange}
            label="Select Product"
          >
            {products.map(product => (
              <MenuItem key={product._id} value={product._id}>
                {product.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {selectedStatusProduct && (
          <>
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                Status Summary for {products.find(p => p._id === selectedStatusProduct)?.name || 'Product'}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ border: '1px solid #e0e0e0', boxShadow: 'none' }}>
                    <CardContent>
                      <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                        📦 Delivered
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#2e7d32' }}>
                        {statusSummary?.totalDelivered || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ border: '1px solid #e0e0e0', boxShadow: 'none' }}>
                    <CardContent>
                      <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                        ↩️ RTO
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#d32f2f' }}>
                        {statusSummary?.totalRTO || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ border: '1px solid #e0e0e0', boxShadow: 'none' }}>
                    <CardContent>
                      <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                        🔄 RPU
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#ed6c02' }}>
                        {statusSummary?.totalRPU || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ border: '1px solid #e0e0e0', boxShadow: 'none' }}>
                    <CardContent>
                      <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                        📊 Total
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#000' }}>
                        {statusSummary?.total || 0}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>

            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={statusData} margin={{ top: 40, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px'
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
                      const colors = { 'Delivered': '#2e7d32', 'RTO': '#d32f2f', 'RPU': '#ed6c02' };
                      return (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={colors[entry.status] || '#000'} 
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 5, color: '#666' }}>
                <Typography>No status data available for this product</Typography>
              </Box>
            )}
          </>
        )}
      </Paper>

      {/* Purchases Report */}
      <Paper sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            🛒 Purchases Report
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<FileDownloadIcon />}
            onClick={() => exportToCSV(filteredPurchases, 'purchases_report')}
            sx={{
              textTransform: 'none',
              borderColor: '#e0e0e0',
              color: '#000',
              '&:hover': { borderColor: '#000', bgcolor: 'rgba(0, 0, 0, 0.04)' }
            }}
          >
            Export
          </Button>
        </Stack>
        
        <TableContainer sx={{ 
          border: '1px solid #e0e0e0',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px'
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
            borderRadius: '4px'
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#888',
            borderRadius: '4px',
            '&:hover': {
              background: '#555'
            }
          }
        }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#fafafa' }}>
                <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Vendor</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPurchases.slice(0, 10).map((purchase) => (
                <TableRow 
                  key={purchase._id}
                  sx={{ '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' } }}
                >
                  <TableCell><strong>{purchase.purchaseId}</strong></TableCell>
                  <TableCell>{purchase.vendor?.name || 'N/A'}</TableCell>
                  <TableCell>{new Date(purchase.purchaseDate).toLocaleDateString()}</TableCell>
                  <TableCell>₹{purchase.totalAmount.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <Card sx={{ mt: 3, bgcolor: '#000', color: '#fff', border: '1px solid #000' }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Total Purchases: ₹{calculateTotals(filteredPurchases).toFixed(2)}
            </Typography>
          </CardContent>
        </Card>
      </Paper>

      {/* Sales Report */}
      <Paper sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            💰 Sales Report
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<FileDownloadIcon />}
            onClick={() => exportToCSV(filteredSales, 'sales_report')}
            sx={{
              textTransform: 'none',
              borderColor: '#e0e0e0',
              color: '#000',
              '&:hover': { borderColor: '#000', bgcolor: 'rgba(0, 0, 0, 0.04)' }
            }}
          >
            Export
          </Button>
        </Stack>
        
        <TableContainer sx={{ 
          border: '1px solid #e0e0e0',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px'
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
            borderRadius: '4px'
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#888',
            borderRadius: '4px',
            '&:hover': {
              background: '#555'
            }
          }
        }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#fafafa' }}>
                <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Buyer</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSales.slice(0, 10).map((sale) => (
                <TableRow 
                  key={sale._id}
                  sx={{ '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' } }}
                >
                  <TableCell><strong>{sale.saleId}</strong></TableCell>
                  <TableCell>{sale.buyer?.name || 'N/A'}</TableCell>
                  <TableCell>{new Date(sale.saleDate).toLocaleDateString()}</TableCell>
                  <TableCell>₹{sale.totalAmount.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <Card sx={{ mt: 3, bgcolor: '#000', color: '#fff', border: '1px solid #000' }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Total Sales: ₹{calculateTotals(filteredSales).toFixed(2)}
            </Typography>
          </CardContent>
        </Card>
      </Paper>

      {/* Summary Section */}
      <Paper sx={{ p: 3, bgcolor: '#2e7d32', color: '#fff', border: '1px solid #2e7d32', boxShadow: 'none' }}>
        <Typography variant="h5" sx={{ fontWeight: 600, textAlign: 'center', mb: 3 }}>
          Financial Summary
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Total Purchases</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                ₹{calculateTotals(filteredPurchases).toFixed(2)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Total Sales</Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                ₹{calculateTotals(filteredSales).toFixed(2)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Net Profit</Typography>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 700,
                  color: calculateProfit() >= 0 ? '#ffffff' : '#ffcdd2'
                }}
              >
                ₹{calculateProfit().toFixed(2)}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default Reports;
