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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Chip,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider
} from '@mui/material';
import {
  Upload as UploadIcon,
  Download as DownloadIcon,
  TrendingUp as TrendingUpIcon,
  FileDownload as FileDownloadIcon,
  PictureAsPdf as PdfIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { profitLossAPI, uploadedProfitSheetsAPI, salesAPI } from '../services/api';
import * as XLSX from 'xlsx';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const ProfitLoss = () => {
  const formatCurrency = (value, showZero = true) => {
    const num = value == null || value === '' ? null : Number(value);
    if (num == null || Number.isNaN(num)) return showZero ? '₹0.00' : '-';
    return `₹${num.toFixed(2)}`;
  };

  const formatNumberForExcel = (value) => {
    const num = value == null || value === '' ? 0 : Number(value);
    return Number.isNaN(num) ? 0 : num;
  };
  const [filter, setFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [profitData, setProfitData] = useState([]);
  const [editingProfitRow, setEditingProfitRow] = useState(null);
  const [showEditProfitModal, setShowEditProfitModal] = useState(false);
  const [monthlyData, setMonthlyData] = useState([]);
  const [uploadResults, setUploadResults] = useState([]);
  const [uploadedSheet, setUploadedSheet] = useState(null);
  const [availableSheets, setAvailableSheets] = useState([]);
  const [selectedSheetId, setSelectedSheetId] = useState(null);
  const [showAllUploads, setShowAllUploads] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);



  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({ ...prev, [name]: value }));
  };

  const fetchProfitLoss = async () => {
    // Validation
    if (!filter.startDate || !filter.endDate) {
      setError('Please select both Start Date and End Date');
      return;
    }

    if (new Date(filter.startDate) > new Date(filter.endDate)) {
      setError('Start Date must be before End Date');
      return;
    }

    setLoading(true);
    try {
      const response = await profitLossAPI.getProfitLoss(filter.startDate, filter.endDate);
      setProfitData(response.data.profitData || []);
      setMonthlyData(response.data.monthlyChartData || []);
      setSummary(response.data.summary || null);
      // Fetch uploaded sheets and filter them
      fetchUploadedData(filter.startDate, filter.endDate);
      setError('');
    } catch (error) {
      setError('Failed to fetch profit/loss data: ' + error.message);
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUploadedData = async (startDate, endDate) => {
    try {
      const response = await profitLossAPI.getUploadedData();
      const sheets = response.data.results || [];
      setAvailableSheets(sheets);

      // If no sheet is selected yet, select the latest
      if (!selectedSheetId && sheets.length > 0) {
        setSelectedSheetId(sheets[0]._id);
        setUploadedSheet(sheets[0]);
        setUploadResults(filterRowsByDate(sheets[0].uploadedData || [], startDate, endDate));
      } else if (selectedSheetId) {
        const sel = sheets.find(s => s._id === selectedSheetId);
        if (sel) {
          setUploadedSheet(sel);
          setUploadResults(filterRowsByDate(sel.uploadedData || [], startDate, endDate));
        }
      } else if (showAllUploads) {
        // flatten all rows from all sheets
        const allRows = sheets.reduce((acc, s) => acc.concat(s.uploadedData || []), []);
        setUploadResults(filterRowsByDate(allRows, startDate, endDate));
      }
    } catch (err) {
      console.error('Failed to fetch uploaded data:', err);
    }
  };

  const filterRowsByDate = (rows, startDate, endDate) => {
    if (!startDate && !endDate) return rows;
    return (rows || []).filter((r) => {
      const dateStr = r.orderDate || r['Order Date'] || r.date || r.paymentDate;
      const d = dateStr ? new Date(dateStr) : null;
      if (!d || Number.isNaN(d.valueOf())) return false;
      if (startDate && d < new Date(startDate)) return false;
      if (endDate && d > new Date(new Date(endDate).setHours(23,59,59,999))) return false;
      return true;
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('File selected:', file.name, file.type, file.size);

    setLoading(true);
    try {
      console.log('Starting upload...');
      const response = await profitLossAPI.uploadExcel(file);
      console.log('Upload response:', response.data);
      // Handle both legacy array response and new sheet doc response
      let savedResults = response.data.results || [];
      // If the server returned a saved sheet document, extract uploadedData and track the sheet
      if (savedResults && !Array.isArray(savedResults)) {
        setUploadedSheet(savedResults);
        savedResults = savedResults.uploadedData || [];
      } else {
        setUploadedSheet(null);
      }
      if (savedResults && !Array.isArray(savedResults)) {
        // assume it's a sheet doc with uploadedData
        savedResults = savedResults.uploadedData || [];
      }
      console.log('Results array:', savedResults);
      if (savedResults && savedResults.length > 0) {
        console.log('First result:', savedResults[0]);
        console.log('All keys in first result:', Object.keys(savedResults[0]));
      }
      setUploadResults(savedResults || []);
      setSummary(response.data.summary || null);
      setShowModal(true);
      setError('');
      e.target.value = '';

    } catch (error) {
      console.error('Upload error:', error);
      setError('Failed to upload file: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // ProfitData row edit handlers
  const handleEditProfitRowClick = async (row) => {
    // row contains saleId and itemId
    try {
      setLoading(true);
      const resp = await salesAPI.getById(row.saleId);
      const sale = resp.data;
      // find item by itemId
      const item = sale.items.find(i => String(i._id) === String(row.itemId) || String(i._id) === String(row.itemId));
      setEditingProfitRow({ sale, item });
      setShowEditProfitModal(true);
    } catch (err) {
      console.error('Failed to fetch sale for editing:', err);
      setError('Failed to fetch sale for editing: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfitRowChange = (key, value) => {
    setEditingProfitRow(prev => ({
      ...prev,
      item: { ...prev.item, [key]: value }
    }));
  };

  const saveEditedProfitRow = async () => {
    if (!editingProfitRow || !editingProfitRow.sale) return setError('Missing sale to update');
    try {
      setLoading(true);
      const sale = editingProfitRow.sale;
      const updatedItems = sale.items.map(i => {
        if (String(i._id) === String(editingProfitRow.item._id)) {
          return {
            ...i,
            quantity: editingProfitRow.item.quantity,
            unitPrice: editingProfitRow.item.unitPrice,
          };
        }
        return i;
      });

      const payload = {
        items: updatedItems,
        buyer: sale.buyer?._id || sale.buyer || '',
        saleDate: sale.saleDate,
        subtotal: sale.subtotal,
        discount: sale.discount,
        discountAmount: sale.discountAmount,
        tax: sale.tax,
        taxAmount: sale.taxAmount,
        shipping: sale.shipping,
        other: sale.other,
        total: sale.totalAmount,
      };

      await salesAPI.update(sale._id, payload);
      setShowEditProfitModal(false);
      // Refresh profit/loss data
      if (filter.startDate && filter.endDate) {
        fetchProfitLoss();
      }
      setError('');
    } catch (err) {
      console.error('Failed to save edited sale item:', err);
      setError('Failed to save edited sale item: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const deleteProfitRow = async (row) => {
    // Remove item from sale and call update
    try {
      setLoading(true);
      const resp = await salesAPI.getById(row.saleId);
      const sale = resp.data;
      const updatedItems = sale.items.filter(i => String(i._id) !== String(row.itemId));
      // If no items left, delete the sale
      if (updatedItems.length === 0) {
        await salesAPI.delete(sale._id);
      } else {
        const payload = {
          items: updatedItems,
          buyer: sale.buyer?._id || sale.buyer || '',
          saleDate: sale.saleDate,
          subtotal: sale.subtotal,
          discount: sale.discount,
          discountAmount: sale.discountAmount,
          tax: sale.tax,
          taxAmount: sale.taxAmount,
          shipping: sale.shipping,
          other: sale.other,
          total: sale.totalAmount,
        };
        await salesAPI.update(sale._id, payload);
      }
      if (filter.startDate && filter.endDate) fetchProfitLoss();
    } catch (err) {
      console.error('Failed to delete sale item:', err);
      setError('Failed to delete sale item: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (row) => {
    setEditingRow(row);
    setShowEditModal(true);
  };

  const handleEditChange = (key, value) => {
    setEditingRow(prev => ({ ...prev, [key]: value }));
  };

  const saveEditedRow = async () => {
    if (!uploadedSheet) {
      setError('No uploaded sheet selected for editing');
      return;
    }
    try {
      setLoading(true);
      const response = await uploadedProfitSheetsAPI.updateRow(uploadedSheet._id, editingRow._id || editingRow.id, editingRow);
      const updatedSheet = response.data;
      setUploadedSheet(updatedSheet);
      setUploadResults(updatedSheet.uploadedData || []);
      setShowEditModal(false);
      setError('');
      // refresh lists
      fetchUploadedData(filter.startDate, filter.endDate);
    } catch (err) {
      console.error('Edit row failed:', err);
      setError('Failed to save changes: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const deleteRow = async (rowId) => {
    if (!uploadedSheet) {
      setError('No uploaded sheet selected');
      return;
    }
    if (!confirm('Are you sure you want to delete this row?')) return;

    try {
      setLoading(true);
      const response = await uploadedProfitSheetsAPI.deleteRow(uploadedSheet._id, rowId);
      const updatedSheet = response.data;
      setUploadedSheet(updatedSheet);
      setUploadResults(updatedSheet.uploadedData || []);
      setError('');
    } catch (err) {
      console.error('Delete row failed:', err);
      setError('Failed to delete row: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilter({
      startDate: '',
      endDate: ''
    });
    setProfitData([]);
    setMonthlyData([]);
    setSummary(null);
  };

  // fetch saved uploads when component mounts
  useEffect(() => {
    fetchUploadedData();
  }, []);

  const handleSelectSheet = (e) => {
    const id = e.target.value;
    setSelectedSheetId(id);
    setShowAllUploads(id === 'ALL');
    if (id === 'ALL') {
      const allRows = (availableSheets || []).reduce((acc, s) => acc.concat(s.uploadedData || []), []);
      setUploadResults(filterRowsByDate(allRows, filter.startDate, filter.endDate));
      setUploadedSheet(null);
    } else {
      const sel = (availableSheets || []).find(s => s._id === id);
      setUploadedSheet(sel || null);
      setUploadResults(filterRowsByDate(sel?.uploadedData || [], filter.startDate, filter.endDate));
    }
  };

  const downloadExcelTemplate = () => {
    try {
      // Create template data
      const templateData = [
        {
          'Month': 'January',
          'S.No.': 1,
          'Order Date': '2024-01-15',
          'Order id': 'ORD-001',
          'SKU': 'SKU-001',
          'Quantity': 2,
          'Status': 'Delivered',
          'Payment': 150,
          'Payment Date': '2024-01-16',
          'Payment Status': 'Paid',
          'Purchase Price': 100,
          'Profit': 50,
          'Re-use / Claim': 'No',
          'Reused Date': '',
          'Status of Product': 'Good',
          'Remarks': 'Sample order'
        },
        {
          'Month': 'January',
          'S.No.': 2,
          'Order Date': '2024-01-20',
          'Order id': 'ORD-002',
          'SKU': 'SKU-002',
          'Quantity': 1,
          'Status': 'Pending',
          'Payment': 200,
          'Payment Date': '2024-01-21',
          'Payment Status': 'Pending',
          'Purchase Price': 150,
          'Profit': 50,
          'Re-use / Claim': 'Yes',
          'Reused Date': '2024-01-25',
          'Status of Product': 'Returned',
          'Remarks': 'Customer return'
        }
      ];

      // Create instructions sheet
      const instructionsData = [
        { 'Field': 'Month', 'Format': 'Text', 'Example': 'January', 'Required': 'Yes' },
        { 'Field': 'S.No.', 'Format': 'Number', 'Example': '1', 'Required': 'Yes' },
        { 'Field': 'Order Date', 'Format': 'YYYY-MM-DD', 'Example': '2024-01-15', 'Required': 'Yes' },
        { 'Field': 'Order id', 'Format': 'Text', 'Example': 'ORD-001', 'Required': 'Yes' },
        { 'Field': 'SKU', 'Format': 'Text', 'Example': 'SKU-001', 'Required': 'Yes' },
        { 'Field': 'Quantity', 'Format': 'Number', 'Example': '2', 'Required': 'Yes' },
        { 'Field': 'Status', 'Format': 'Text', 'Example': 'Delivered', 'Required': 'Yes' },
        { 'Field': 'Payment', 'Format': 'Number', 'Example': '150', 'Required': 'Yes' },
        { 'Field': 'Payment Date', 'Format': 'YYYY-MM-DD', 'Example': '2024-01-16', 'Required': 'No' },
        { 'Field': 'Payment Status', 'Format': 'Text', 'Example': 'Paid', 'Required': 'No' },
        { 'Field': 'Purchase Price', 'Format': 'Number', 'Example': '100', 'Required': 'Yes' },
        { 'Field': 'Profit', 'Format': 'Number', 'Example': '50', 'Required': 'No' },
        { 'Field': 'Re-use / Claim', 'Format': 'Yes/No', 'Example': 'No', 'Required': 'No' },
        { 'Field': 'Reused Date', 'Format': 'YYYY-MM-DD', 'Example': '2024-01-25', 'Required': 'No' },
        { 'Field': 'Status of Product', 'Format': 'Text', 'Example': 'Good', 'Required': 'No' },
        { 'Field': 'Remarks', 'Format': 'Text', 'Example': 'Sample order', 'Required': 'No' }
      ];

      // Create workbook with multiple sheets
      const worksheet1 = XLSX.utils.json_to_sheet(templateData);
      const worksheet2 = XLSX.utils.json_to_sheet(instructionsData);

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet1, 'Data Template');
      XLSX.utils.book_append_sheet(workbook, worksheet2, 'Instructions');

      // Auto-adjust column widths
      const colWidths = [
        { wch: 12 }, // Month
        { wch: 8 },  // S.No.
        { wch: 12 }, // Order Date
        { wch: 15 }, // Order id
        { wch: 12 }, // SKU
        { wch: 10 }, // Quantity
        { wch: 12 }, // Status
        { wch: 12 }, // Payment
        { wch: 12 }, // Payment Date
        { wch: 15 }, // Payment Status
        { wch: 15 }, // Purchase Price
        { wch: 10 }, // Profit
        { wch: 15 }, // Re-use / Claim
        { wch: 12 }, // Reused Date
        { wch: 15 }, // Status of Product
        { wch: 20 }  // Remarks
      ];
      worksheet1['!cols'] = colWidths;

      XLSX.writeFile(workbook, 'profit_loss_template.xlsx');
      setError('');
    } catch (error) {
      setError('Failed to download template: ' + error.message);
    }
  };

  const exportToExcel = (data, filename = 'profit_loss_report.xlsx') => {
    if (!data || data.length === 0) {
      setError('No data to export');
      return;
    }

    try {
      // Transform data for export
      const exportData = data.map(item => ({
        'Combo ID': item.comboId || '',
        'Products': item.productNames || item.comboName || '',
        'Original Cost Price': formatNumberForExcel(item.costPrice),
        'Sold Price': formatNumberForExcel(item.soldPrice),
        'Quantity': item.quantity || '',
        'Profit/Loss': formatNumberForExcel(item.profitTotal),
        'Status': item.status?.toUpperCase() || 'ERROR',
        'Date': item.date ? new Date(item.date).toLocaleDateString() : '',
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Profit Loss');

      // Add summary sheet if available
      if (summary) {
        const summaryData = [
          { Metric: 'Total Profit/Loss', Amount: formatNumberForExcel(summary.totalProfit) },
          { Metric: 'Delivered Profit', Amount: formatNumberForExcel(summary.deliveredProfit) },
          { Metric: 'RPU Loss', Amount: formatNumberForExcel(summary.rpuProfit) },
          { Metric: 'Total Records', Amount: summary.totalRecords || 0 },
        ];
        const summarySheet = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
      }

      XLSX.writeFile(workbook, filename);
      setError('');
    } catch (error) {
      setError('Failed to export to Excel: ' + error.message);
    }
  };

  const exportToPDF = (data, filename = 'profit_loss_report.pdf') => {
    if (!data || data.length === 0) {
      setError('No data to export');
      return;
    }

    try {
      // Create a table HTML
      let html = `
        <html>
          <head>
            <title>Profit & Loss Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              h1 { color: #333; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th { background-color: #667eea; color: white; padding: 10px; text-align: left; }
              td { padding: 8px; border-bottom: 1px solid #ddd; }
              tr:hover { background-color: #f5f5f5; }
              .summary { margin-top: 30px; }
              .profit { color: #48bb78; font-weight: bold; }
              .loss { color: #e53e3e; font-weight: bold; }
            </style>
          </head>
          <body>
            <h1>Profit & Loss Analysis Report</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
      `;

      // Add summary
      if (summary) {
        html += `
          <div class="summary">
            <h2>Summary</h2>
            <table>
              <tr>
                <th>Metric</th>
                <th>Amount</th>
              </tr>
                <tr>
                <td>Total Profit/Loss</td>
                <td class="${Number(summary?.totalProfit ?? 0) >= 0 ? 'profit' : 'loss'}">${Number(summary?.totalProfit ?? 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td>Delivered Profit</td>
                <td class="profit">${Number(summary?.deliveredProfit ?? 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td>RPU Loss</td>
                <td class="loss">${Number(summary?.rpuProfit ?? 0).toFixed(2)}</td>
              </tr>
              <tr>
                <td>Total Records</td>
                <td>${summary.totalRecords || 0}</td>
              </tr>
            </table>
          </div>
        `;
      }

      // Add data table
      html += `
        <h2>Detailed Records</h2>
        <table>
          <tr>
            <th>Combo ID</th>
            <th>Products</th>
            <th>Original Cost Price</th>
            <th>Sold Price</th>
            <th>Quantity</th>
            <th>Profit/Loss</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
      `;

      data.forEach(item => {
        const profitClass = Number(item.profitTotal ?? 0) >= 0 ? 'profit' : 'loss';
        html += `
          <tr>
            <td>${item.comboId || ''}</td>
            <td>${item.productNames || item.comboName || ''}</td>
            <td>${item.quantity || ''}</td>
            <td>${item.costPrice != null ? Number(item.costPrice).toFixed(2) : ''}</td>
            <td>${item.soldPrice != null ? Number(item.soldPrice).toFixed(2) : ''}</td>
                        <td class="${profitClass}">${item.profitTotal != null ? Number(item.profitTotal).toFixed(2) : ''}</td>
            <td>${item.status?.toUpperCase() || 'ERROR'}</td>
            <td>${item.date ? new Date(item.date).toLocaleDateString() : ''}</td>
          </tr>
        `;
      });

      html += `
          </table>
          </body>
        </html>
      `;

      // Create a blob and download
      const element = document.createElement('a');
      const file = new Blob([html], { type: 'text/html' });
      element.href = URL.createObjectURL(file);
      element.download = filename.replace('.pdf', '.html');
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      setError('PDF exported as HTML file. To save as PDF, use your browser\'s Print to PDF feature.');
    } catch (error) {
      setError('Failed to export to PDF: ' + error.message);
    }
  };

  return (
    <Box sx={{ p: 3, backgroundColor: 'rgba(248, 245, 240, 0.85)', minHeight: '100vh' }}>
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity="error" onClose={() => setError('')}>{error}</Alert>
      </Snackbar>

      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#000' }}>
          Profit & Loss Analysis
        </Typography>
      </Stack>

      {/* Statistics */}
      {summary && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ border: '1px solid #e0e0e0', textAlign: 'center', p: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  💰 Total Profit/Loss
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: Number(summary?.totalProfit ?? 0) >= 0 ? '#2e7d32' : '#d32f2f' }}>
                  {formatCurrency(summary?.totalProfit)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ border: '1px solid #e0e0e0', textAlign: 'center', p: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  ✅ Delivered Profit
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#2e7d32' }}>
                  {formatCurrency(summary?.deliveredProfit)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ border: '1px solid #e0e0e0', textAlign: 'center', p: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  🔄 RPU Loss
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#d32f2f' }}>
                  {formatCurrency(summary?.rpuProfit)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ border: '1px solid #e0e0e0', textAlign: 'center', p: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  📊 Total Records
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#000' }}>
                  {summary.totalRecords}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filter Section */}
      <Paper sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          🔍 Date Range Filter
        </Typography>
        <Grid container spacing={2} alignItems="flex-end">
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
              variant="contained"
              startIcon={<TrendingUpIcon />}
              onClick={fetchProfitLoss}
              sx={{
                bgcolor: '#000',
                color: '#fff',
                textTransform: 'none',
                '&:hover': { bgcolor: '#333' }
              }}
            >
              Fetch Data
            </Button>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={clearFilters}
              sx={{
                borderColor: '#000',
                color: '#000',
                textTransform: 'none',
                '&:hover': { borderColor: '#333', bgcolor: 'rgba(0, 0, 0, 0.04)' }
              }}
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Excel Upload Section */}
      <Paper sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          📁 Upload Excel File
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Button
              variant="contained"
              component="label"
              startIcon={<UploadIcon />}
              disabled={loading}
              sx={{
                bgcolor: '#000',
                color: '#fff',
                textTransform: 'none',
                '&:hover': { bgcolor: '#333' }
              }}
            >
              Choose Excel File
              <input
                type="file"
                hidden
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
              />
            </Button>
            <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#666' }}>
              Columns: Month, S.No., Order Date, Order id, SKU, Quantity, Status, Payment, Payment Date, Payment Status, Purchase Price, Profit, Re-use/Claim, Reused Date, Status of Product, Remarks
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={downloadExcelTemplate}
              sx={{
                borderColor: '#000',
                color: '#000',
                textTransform: 'none',
                '&:hover': { borderColor: '#333', bgcolor: 'rgba(0, 0, 0, 0.04)' }
              }}
            >
              Download Template
            </Button>
          </Grid>
        </Grid>
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12} md={8}>
            <FormControl fullWidth>
              <InputLabel>Load Saved Uploads</InputLabel>
              <Select
                value={selectedSheetId || ''}
                onChange={handleSelectSheet}
                label="Load Saved Uploads"
              >
                <MenuItem value="">-- Select saved upload --</MenuItem>
                <MenuItem value="ALL">All uploads</MenuItem>
                {(availableSheets || []).map(s => (
                  <MenuItem key={s._id} value={s._id}>
                    {s.fileName} ({s.uploadDate ? new Date(s.uploadDate).toLocaleString() : 'Unknown date'})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => fetchUploadedData(filter.startDate, filter.endDate)}
              sx={{
                borderColor: '#000',
                color: '#000',
                textTransform: 'none',
                '&:hover': { borderColor: '#333', bgcolor: 'rgba(0, 0, 0, 0.04)' }
              }}
            >
              Refresh Uploads
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Monthly Profit Chart */}
      {monthlyData.length > 0 && (
        <Paper sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              📈 Monthly Profit Trend
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={() => exportToExcel(monthlyData, 'monthly_profit_report.xlsx')}
                sx={{ textTransform: 'none', borderColor: '#2e7d32', color: '#2e7d32' }}
              >
                Excel
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<PdfIcon />}
                onClick={() => exportToPDF(monthlyData, 'monthly_profit_report.pdf')}
                sx={{ textTransform: 'none', borderColor: '#d32f2f', color: '#d32f2f' }}
              >
                PDF
              </Button>
            </Stack>
          </Stack>
          {loading ? (
            <Box sx={{ textAlign: 'center', py: 5 }}>
              <CircularProgress sx={{ color: '#000' }} />
            </Box>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={monthlyData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value) => (value == null || Number.isNaN(Number(value)) ? '-' : `₹${Number(value).toFixed(2)}`)}
                  contentStyle={{
                    backgroundColor: '#fafafa',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="totalProfit" stroke="#000" name="Total Profit" strokeWidth={2} />
                <Line type="monotone" dataKey="deliveredProfit" stroke="#2e7d32" name="Delivered Profit" strokeWidth={2} />
                <Line type="monotone" dataKey="rpuProfit" stroke="#d32f2f" name="RPU Loss" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Paper>
      )}

      {/* Profit/Loss Data Table */}
      {profitData.length > 0 && (
        <Paper sx={{ mb: 3, border: '1px solid #e0e0e0' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 2, bgcolor: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              📊 Profit/Loss Breakdown
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={() => exportToExcel(profitData, 'profit_loss_database_report.xlsx')}
                sx={{ textTransform: 'none', borderColor: '#2e7d32', color: '#2e7d32' }}
              >
                Excel
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<PdfIcon />}
                onClick={() => exportToPDF(profitData, 'profit_loss_database_report.pdf')}
                sx={{ textTransform: 'none', borderColor: '#d32f2f', color: '#d32f2f' }}
              >
                PDF
              </Button>
            </Stack>
          </Stack>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#fafafa' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Product/Combo</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Cost Price</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Sold Price</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Quantity</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Profit/Loss</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {profitData.slice(0, 20).map((item, index) => (
                  <TableRow key={index} sx={{ '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' } }}>
                    <TableCell>{item.date ? new Date(item.date).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>{item.product}</TableCell>
                    <TableCell>{formatCurrency(item.costPrice)}</TableCell>
                    <TableCell>{formatCurrency(item.soldPrice)}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>
                      <Chip
                        label={formatCurrency(item.profitTotal)}
                        sx={{
                          bgcolor: Number(item.profitTotal ?? 0) >= 0 ? '#e8f5e9' : '#ffebee',
                          color: Number(item.profitTotal ?? 0) >= 0 ? '#2e7d32' : '#d32f2f',
                          fontWeight: 600
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {item.status === 'rpu' ? (
                        <Chip label="RPU" icon={<span>🔄</span>} sx={{ bgcolor: '#ffebee', color: '#d32f2f' }} />
                      ) : (
                        <Chip label="Delivered" icon={<span>✅</span>} sx={{ bgcolor: '#e8f5e9', color: '#2e7d32' }} />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <IconButton size="small" onClick={() => handleEditProfitRowClick(item)} sx={{ color: '#000' }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => deleteProfitRow(item)} sx={{ color: '#d32f2f' }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Typography sx={{ p: 2, textAlign: 'center', color: '#666' }}>
            Showing {profitData.slice(0, 20).length} of {profitData.length} records
          </Typography>
        </Paper>
      )}

      {/* Uploaded Data Table */}
      {uploadResults.length > 0 && (
        <Paper sx={{ mb: 3, border: '1px solid #e0e0e0' }}>
          <Box sx={{ p: 2, bgcolor: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              📊 Uploaded Profit/Loss Data ({uploadResults.length} records)
            </Typography>
          </Box>
          <TableContainer sx={{ 
            maxHeight: 500,
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
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: '#fafafa', fontWeight: 600 }}>Month</TableCell>
                  <TableCell sx={{ bgcolor: '#fafafa', fontWeight: 600 }}>S.No.</TableCell>
                  <TableCell sx={{ bgcolor: '#fafafa', fontWeight: 600 }}>Order Date</TableCell>
                  <TableCell sx={{ bgcolor: '#fafafa', fontWeight: 600 }}>Order id</TableCell>
                  <TableCell sx={{ bgcolor: '#fafafa', fontWeight: 600 }}>SKU</TableCell>
                  <TableCell sx={{ bgcolor: '#fafafa', fontWeight: 600 }}>Quantity</TableCell>
                  <TableCell sx={{ bgcolor: '#fafafa', fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ bgcolor: '#fafafa', fontWeight: 600 }}>Payment</TableCell>
                  <TableCell sx={{ bgcolor: '#fafafa', fontWeight: 600 }}>Payment Date</TableCell>
                  <TableCell sx={{ bgcolor: '#fafafa', fontWeight: 600 }}>Payment Status</TableCell>
                  <TableCell sx={{ bgcolor: '#fafafa', fontWeight: 600 }}>Purchase Price</TableCell>
                  <TableCell sx={{ bgcolor: '#fafafa', fontWeight: 600 }}>Profit</TableCell>
                  <TableCell sx={{ bgcolor: '#fafafa', fontWeight: 600 }}>Re-use / Claim</TableCell>
                  <TableCell sx={{ bgcolor: '#fafafa', fontWeight: 600 }}>Reused Date</TableCell>
                  <TableCell sx={{ bgcolor: '#fafafa', fontWeight: 600 }}>Status of Product</TableCell>
                  <TableCell sx={{ bgcolor: '#fafafa', fontWeight: 600 }}>Remarks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {uploadResults.map((result, index) => (
                  <TableRow key={index} sx={{ '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' } }}>
                    <TableCell>{result.Month || result.month || '-'}</TableCell>
                    <TableCell>{result['S.No.'] || result.sno || '-'}</TableCell>
                    <TableCell>{result['Order Date'] || result.orderDate || '-'}</TableCell>
                    <TableCell>{result['Order id'] || result.orderId || '-'}</TableCell>
                    <TableCell>{result.SKU || result.sku || '-'}</TableCell>
                    <TableCell>{result.Quantity || result.quantity || '-'}</TableCell>
                    <TableCell>{result.Status || result.status || '-'}</TableCell>
                    <TableCell>{result.Payment || result.payment || '-'}</TableCell>
                    <TableCell>{result['Payment Date'] || result.paymentDate || '-'}</TableCell>
                    <TableCell>{result['Payment Status'] || result.paymentStatus || '-'}</TableCell>
                    <TableCell>{result['Purchase Price'] || result.purchasePrice || '-'}</TableCell>
                    <TableCell>{result.Profit || result.profit || '-'}</TableCell>
                    <TableCell>{result['Re-use / Claim'] || result.reuseOrClaim || '-'}</TableCell>
                    <TableCell>{result['Reused Date'] || result.reusedDate || '-'}</TableCell>
                    <TableCell>{result['Status of Product'] || result.statusOfProduct || '-'}</TableCell>
                    <TableCell>{result.Remarks || result.remarks || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Upload Results Modal */}
      <Dialog open={showModal} onClose={() => setShowModal(false)} maxWidth="xl" fullWidth>
        <DialogTitle sx={{ bgcolor: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ fontWeight: 600 }}>📊 Upload Results & Export</Typography>
            <IconButton onClick={() => setShowModal(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {summary && (
            <Paper sx={{ p: 2, mb: 3, bgcolor: '#fafafa', border: '1px solid #e0e0e0' }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={3}>
                  <Typography variant="caption" sx={{ color: '#666' }}>Total Profit/Loss</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: Number(summary?.totalProfit ?? 0) >= 0 ? '#2e7d32' : '#d32f2f' }}>
                    {formatCurrency(summary?.totalProfit)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="caption" sx={{ color: '#666' }}>Delivered Profit</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#2e7d32' }}>
                    {formatCurrency(summary?.deliveredProfit)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="caption" sx={{ color: '#666' }}>RPU Loss</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#d32f2f' }}>
                    {formatCurrency(summary?.rpuProfit)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="caption" sx={{ color: '#666' }}>Total Records</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#000' }}>
                    {summary.totalRecords || 0}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          )}
          
          <TableContainer sx={{ 
            maxHeight: 500, 
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
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: '#fafafa', fontWeight: 600 }}>Month</TableCell>
                  <TableCell sx={{ bgcolor: '#fafafa', fontWeight: 600 }}>S.No.</TableCell>
                  <TableCell sx={{ bgcolor: '#fafafa', fontWeight: 600 }}>Order Date</TableCell>
                  <TableCell sx={{ bgcolor: '#fafafa', fontWeight: 600 }}>Order id</TableCell>
                  <TableCell sx={{ bgcolor: '#fafafa', fontWeight: 600 }}>SKU</TableCell>
                  <TableCell sx={{ bgcolor: '#fafafa', fontWeight: 600 }}>Quantity</TableCell>
                  <TableCell sx={{ bgcolor: '#fafafa', fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ bgcolor: '#fafafa', fontWeight: 600 }}>Payment</TableCell>
                  <TableCell sx={{ bgcolor: '#fafafa', fontWeight: 600 }}>Payment Date</TableCell>
                  <TableCell sx={{ bgcolor: '#fafafa', fontWeight: 600 }}>Payment Status</TableCell>
                  <TableCell sx={{ bgcolor: '#fafafa', fontWeight: 600 }}>Purchase Price</TableCell>
                  <TableCell sx={{ bgcolor: '#fafafa', fontWeight: 600 }}>Profit</TableCell>
                  <TableCell sx={{ bgcolor: '#fafafa', fontWeight: 600 }}>Re-use / Claim</TableCell>
                  <TableCell sx={{ bgcolor: '#fafafa', fontWeight: 600 }}>Reused Date</TableCell>
                  <TableCell sx={{ bgcolor: '#fafafa', fontWeight: 600 }}>Status of Product</TableCell>
                  <TableCell sx={{ bgcolor: '#fafafa', fontWeight: 600 }}>Remarks</TableCell>
                  <TableCell sx={{ bgcolor: '#fafafa', fontWeight: 600 }} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {uploadResults.map((result, index) => (
                  <TableRow key={index} sx={{ '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' } }}>
                    <TableCell>{result.Month || result.month || '-'}</TableCell>
                    <TableCell>{result['S.No.'] || result.sno || result.serialNumber || '-'}</TableCell>
                    <TableCell>{result['Order Date'] || result.orderDate || '-'}</TableCell>
                    <TableCell>{result['Order id'] || result.orderId || result.orderid || '-'}</TableCell>
                    <TableCell>{result.SKU || result.sku || '-'}</TableCell>
                    <TableCell>{result.Quantity || result.quantity || '-'}</TableCell>
                    <TableCell>{result.Status || result.status || '-'}</TableCell>
                    <TableCell>{result.Payment || result.payment || '-'}</TableCell>
                    <TableCell>{result['Payment Date'] || result.paymentDate || '-'}</TableCell>
                    <TableCell>{result['Payment Status'] || result.paymentStatus || '-'}</TableCell>
                    <TableCell>{result['Purchase Price'] || result.purchasePrice || '-'}</TableCell>
                    <TableCell>{result.Profit || result.profit || '-'}</TableCell>
                    <TableCell>{result['Re-use / Claim'] || result.reuseOrClaim || '-'}</TableCell>
                    <TableCell>{result['Reused Date'] || result.reusedDate || '-'}</TableCell>
                    <TableCell>{result['Status of Product'] || result.statusOfProduct || '-'}</TableCell>
                    <TableCell>{result.Remarks || result.remarks || '-'}</TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <IconButton size="small" onClick={() => handleEditClick(result)} sx={{ color: '#000' }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => deleteRow(result._id || result.id)} sx={{ color: '#d32f2f' }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#fafafa', borderTop: '1px solid #e0e0e0' }}>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={() => exportToExcel(uploadResults, 'profit_loss_upload_report.xlsx')}
            sx={{ textTransform: 'none', borderColor: '#2e7d32', color: '#2e7d32' }}
          >
            Export to Excel
          </Button>
          <Button
            variant="outlined"
            startIcon={<PdfIcon />}
            onClick={() => exportToPDF(uploadResults, 'profit_loss_upload_report.pdf')}
            sx={{ textTransform: 'none', borderColor: '#d32f2f', color: '#d32f2f' }}
          >
            Export to PDF
          </Button>
          <Button onClick={() => setShowModal(false)} sx={{ textTransform: 'none', color: '#666' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Row Modal */}
      <Dialog open={showEditModal} onClose={() => setShowEditModal(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ fontWeight: 600 }}>✏️ Edit Row</Typography>
            <IconButton onClick={() => setShowEditModal(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {editingRow && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Order id"
                  value={editingRow.orderId || editingRow['Order id'] || ''}
                  onChange={(e) => handleEditChange('orderId', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Order Date"
                  type="date"
                  value={editingRow.orderDate || ''}
                  onChange={(e) => handleEditChange('orderDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="SKU"
                  value={editingRow.SKU || editingRow.sku || ''}
                  onChange={(e) => handleEditChange('sku', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Quantity"
                  value={editingRow.Quantity || editingRow.quantity || ''}
                  onChange={(e) => handleEditChange('quantity', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Status"
                  value={editingRow.Status || editingRow.status || ''}
                  onChange={(e) => handleEditChange('status', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Payment"
                  value={editingRow.Payment || editingRow.payment || ''}
                  onChange={(e) => handleEditChange('payment', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Purchase Price"
                  value={editingRow['Purchase Price'] || editingRow.purchasePrice || ''}
                  onChange={(e) => handleEditChange('purchasePrice', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Profit"
                  value={editingRow.Profit || editingRow.profit || ''}
                  onChange={(e) => handleEditChange('profit', e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Remarks"
                  multiline
                  rows={3}
                  value={editingRow.Remarks || editingRow.remarks || ''}
                  onChange={(e) => handleEditChange('remarks', e.target.value)}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#fafafa', borderTop: '1px solid #e0e0e0' }}>
          <Button onClick={() => setShowEditModal(false)} sx={{ textTransform: 'none', color: '#666' }}>
            Cancel
          </Button>
          <Button
            onClick={saveEditedRow}
            disabled={loading}
            variant="contained"
            sx={{
              bgcolor: '#000',
              color: '#fff',
              textTransform: 'none',
              '&:hover': { bgcolor: '#333' }
            }}
          >
            {loading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Profit Row Modal */}
      <Dialog open={showEditProfitModal} onClose={() => setShowEditProfitModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" sx={{ fontWeight: 600 }}>✏️ Edit Profit Row</Typography>
            <IconButton onClick={() => setShowEditProfitModal(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {editingProfitRow && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="SKU / Barcode"
                  disabled
                  value={editingProfitRow.item?.barcode || editingProfitRow.item?.productName || ''}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Quantity"
                  type="number"
                  value={editingProfitRow.item?.quantity || 0}
                  onChange={(e) => handleEditProfitRowChange('quantity', Number(e.target.value))}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Unit Price"
                  type="number"
                  value={editingProfitRow.item?.unitPrice || 0}
                  onChange={(e) => handleEditProfitRowChange('unitPrice', Number(e.target.value))}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#fafafa', borderTop: '1px solid #e0e0e0' }}>
          <Button onClick={() => setShowEditProfitModal(false)} sx={{ textTransform: 'none', color: '#666' }}>
            Cancel
          </Button>
          <Button
            onClick={saveEditedProfitRow}
            disabled={loading}
            variant="contained"
            sx={{
              bgcolor: '#000',
              color: '#fff',
              textTransform: 'none',
              '&:hover': { bgcolor: '#333' }
            }}
          >
            {loading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Loading State */}
      {loading && profitData.length === 0 && uploadResults.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#000' }} />
          <Typography sx={{ mt: 2, color: '#666' }}>Processing...</Typography>
        </Box>
      )}
    </Box>
  );
};

export default ProfitLoss;