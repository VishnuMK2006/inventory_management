import React, { useState, useEffect } from 'react';
import { Table, Alert, Form, Button, Row, Col, Card, Spinner, Modal } from 'react-bootstrap';
import { profitLossAPI, uploadedProfitSheetsAPI, salesAPI } from '../services/api';
import styled, { keyframes } from 'styled-components';
import { FaUpload, FaDownload, FaChartLine, FaCheck, FaTimes, FaFileExcel, FaFilePdf } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideIn = keyframes`
  from { transform: translateX(-30px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

// Styled Components
const Container = styled.div`
  padding: 2rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
`;

const AnimatedContainer = styled.div`
  animation: ${fadeIn} 0.6s ease-out;
`;

const HeaderSection = styled.div`
  background: white;
  height: 100px;
  padding: 2rem;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
  animation: ${slideIn} 0.5s ease-out;
`;

const FilterCard = styled(Card)`
  border: none;
  border-radius: 15px;
  box-shadow: 0 5px 20px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
  
  .card-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 15px 15px 0 0;
    border: none;
    font-weight: 600;
  }
`;

const GraphCard = styled(Card)`
  border: none;
  border-radius: 15px;
  box-shadow: 0 5px 20px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
  
  .card-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 15px 15px 0 0;
    border: none;
    font-weight: 600;
  }
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
      padding: 1.2rem;
      font-weight: 500;
    }
  }
  
  tbody tr {
    transition: all 0.3s ease;
    
    &:hover {
      background: rgba(102, 126, 234, 0.1);
      transform: translateY(-2px);
    }
    
    td {
      padding: 1.2rem;
      border-color: #e9ecef;
    }
  }
`;

const PrimaryButton = styled(Button)`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 25px;
  padding: 0.8rem 2rem;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.2);
    background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
  }
`;

const SecondaryButton = styled(Button)`
  border-radius: 20px;
  padding: 0.5rem 1.2rem;
  transition: all 0.3s ease;
  border: 2px solid #667eea;
  color: #667eea;
  background: transparent;
  
  &:hover {
    background: #667eea;
    color: white;
    transform: translateY(-1px);
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  }
`;

const FormGroup = styled(Form.Group)`
  margin-bottom: 1rem;
  
  .form-label {
    font-weight: 600;
    color: #4a5568;
    margin-bottom: 0.5rem;
  }
  
  .form-control {
    border-radius: 10px;
    border: 2px solid #e2e8f0;
    padding: 0.8rem;
    transition: all 0.3s ease;
    
    &:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
    }
  }
`;

const StatCard = styled(Card)`
  border: none;
  border-radius: 15px;
  text-align: center;
  padding: 1.5rem;
  transition: all 0.3s ease;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 35px rgba(0,0,0,0.15);
  }
  
  .card-title {
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: #4a5568;
  }
  
  .card-text {
    font-size: 1.8rem;
    font-weight: 700;
    color: #667eea;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const LoadingSpinner = styled(Spinner)`
  color: #667eea;
  width: 3rem;
  height: 3rem;
`;

const IconWrapper = styled.span`
  margin-right: 0.5rem;
`;

const ProfitBadge = styled.span`
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
  color: ${props => props.profit >= 0 ? '#fff' : '#fff'};
  background: ${props => props.profit >= 0 ? '#48bb78' : '#e53e3e'};
`;

const ProfitLoss = () => {
  const formatCurrency = (value, showZero = true) => {
    const num = value == null || value === '' ? null : Number(value);
    if (num == null || Number.isNaN(num)) return showZero ? '$0.00' : '-';
    return `$${num.toFixed(2)}`;
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
    <Container>
      <AnimatedContainer>
        <HeaderSection>
          <Row>
            <Col>
              <h4 className="mb-0 d-flex align-items-center">
                <IconWrapper style={{ fontSize: "1.3rem", marginRight: "0.6rem" }}>💹</IconWrapper>
                Profit & Loss Analysis
              </h4>
            </Col>
          </Row>
        </HeaderSection>

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Statistics */}
        {summary && (
          <StatsGrid>
            <StatCard>
              <Card.Title>💰 Total Profit/Loss</Card.Title>
                <Card.Text style={{ color: Number(summary?.totalProfit ?? 0) >= 0 ? '#48bb78' : '#e53e3e' }}>
                {formatCurrency(summary?.totalProfit)}
              </Card.Text>
            </StatCard>
            <StatCard>
              <Card.Title>✅ Delivered Profit</Card.Title>
                <Card.Text style={{ color: '#48bb78' }}>
                {formatCurrency(summary?.deliveredProfit)}
              </Card.Text>
            </StatCard>
            <StatCard>
              <Card.Title>🔄 RPU Loss</Card.Title>
                <Card.Text style={{ color: '#e53e3e' }}>
                {formatCurrency(summary?.rpuProfit)}
              </Card.Text>
            </StatCard>
            <StatCard>
              <Card.Title>📊 Total Records</Card.Title>
              <Card.Text>{summary.totalRecords}</Card.Text>
            </StatCard>
          </StatsGrid>
        )}

        {/* Filter Section */}
        <FilterCard>
          <Card.Header>
            <IconWrapper>🔍</IconWrapper>
            Date Range Filter
          </Card.Header>
          <Card.Body>
            <Form>
              <Row>
                <Col md={3}>
                  <FormGroup>
                    <Form.Label>Start Date</Form.Label>
                    <Form.Control
                      type="date"
                      name="startDate"
                      value={filter.startDate}
                      onChange={handleFilterChange}
                    />
                  </FormGroup>
                </Col>
                <Col md={3}>
                  <FormGroup>
                    <Form.Label>End Date</Form.Label>
                    <Form.Control
                      type="date"
                      name="endDate"
                      value={filter.endDate}
                      onChange={handleFilterChange}
                    />
                  </FormGroup>
                </Col>
                <Col md={3} className="d-flex align-items-end">
                  <PrimaryButton onClick={fetchProfitLoss} className="w-100">
                    <FaChartLine /> Fetch Data
                  </PrimaryButton>
                </Col>
                <Col md={3} className="d-flex align-items-end">
                  <SecondaryButton onClick={clearFilters} className="w-100">
                    🗑️ Clear
                  </SecondaryButton>
                </Col>
              </Row>
            </Form>
          </Card.Body>
        </FilterCard>

        {/* Excel Upload Section */}
        <FilterCard>
          <Card.Header>
            <IconWrapper>📁</IconWrapper>
            Upload Excel File
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Form.Label>Choose Excel File</Form.Label>
                  <Form.Control
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    disabled={loading}
                  />
                  <Form.Text className="text-muted">
                    Columns: Month, S.No., Order Date, Order id, SKU, Quantity, Status, Payment, Payment Date, Payment Status, Purchase Price, Profit, Re-use/Claim, Reused Date, Status of Product, Remarks
                  </Form.Text>
                </FormGroup>
              </Col>
              <Col md={6} className="d-flex align-items-end">
                <SecondaryButton onClick={downloadExcelTemplate} className="w-100">
                  <FaDownload /> Download Template
                </SecondaryButton>
              </Col>
            </Row>
            <Row className="mt-3">
              <Col md={8}>
                <FormGroup>
                  <Form.Label>Load Saved Uploads</Form.Label>
                  <Form.Control as="select" value={selectedSheetId || ''} onChange={handleSelectSheet}>
                    <option value="">-- Select saved upload --</option>
                    <option value="ALL">All uploads</option>
                    {(availableSheets || []).map(s => (
                      <option key={s._id} value={s._id}>{s.fileName} ({s.uploadDate ? new Date(s.uploadDate).toLocaleString() : 'Unknown date'})</option>
                    ))}
                  </Form.Control>
                </FormGroup>
              </Col>
              <Col md={4} className="d-flex align-items-end">
                <SecondaryButton onClick={() => fetchUploadedData(filter.startDate, filter.endDate)} className="w-100">
                  🔁 Refresh Uploads
                </SecondaryButton>
              </Col>
            </Row>
          </Card.Body>
        </FilterCard>

        {/* Monthly Profit Chart */}
        {monthlyData.length > 0 && (
          <GraphCard>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <span>
                <IconWrapper>📈</IconWrapper>
                Monthly Profit Trend
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button 
                  size="sm" 
                  variant="outline-primary"
                  onClick={() => exportToExcel(monthlyData, 'monthly_profit_report.xlsx')}
                  title="Export to Excel"
                >
                  <FaFileExcel /> Excel
                </Button>
                <Button 
                  size="sm" 
                  variant="outline-danger"
                  onClick={() => exportToPDF(monthlyData, 'monthly_profit_report.pdf')}
                  title="Export to PDF"
                >
                  <FaFilePdf /> PDF
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center py-5">
                  <LoadingSpinner animation="border" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={monthlyData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => (value == null || Number.isNaN(Number(value)) ? '-' : `$${Number(value).toFixed(2)}`)}
                      contentStyle={{
                        backgroundColor: '#f5f7fa',
                        border: '2px solid #667eea',
                        borderRadius: '10px'
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="totalProfit" stroke="#667eea" name="Total Profit" strokeWidth={2} />
                    <Line type="monotone" dataKey="deliveredProfit" stroke="#48bb78" name="Delivered Profit" strokeWidth={2} />
                    <Line type="monotone" dataKey="rpuProfit" stroke="#e53e3e" name="RPU Loss" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card.Body>
          </GraphCard>
        )}

        {/* Profit/Loss Data Table */}
        {profitData.length > 0 && (
          <GraphCard>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <span>
                <IconWrapper>📊</IconWrapper>
                Profit/Loss Breakdown
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button 
                  size="sm" 
                  variant="outline-primary"
                  onClick={() => exportToExcel(profitData, 'profit_loss_database_report.xlsx')}
                  title="Export to Excel"
                >
                  <FaFileExcel /> Excel
                </Button>
                <Button 
                  size="sm" 
                  variant="outline-danger"
                  onClick={() => exportToPDF(profitData, 'profit_loss_database_report.pdf')}
                  title="Export to PDF"
                >
                  <FaFilePdf /> PDF
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              <div style={{ overflowX: 'auto' }}>
                <StyledTable responsive>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Product/Combo</th>
                      <th>Cost Price</th>
                      <th>Sold Price</th>
                      <th>Quantity</th>
                      <th>Profit/Loss</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profitData.slice(0, 20).map((item, index) => (
                      <tr key={index}>
                        <td>{item.date ? new Date(item.date).toLocaleDateString() : '-'}</td>
                        <td>{item.product}</td>
                        <td>{formatCurrency(item.costPrice)}</td>
                        <td>{formatCurrency(item.soldPrice)}</td>
                        <td>{item.quantity}</td>
                        <td>
                          <ProfitBadge profit={Number(item.profitTotal ?? 0)}>
                            {formatCurrency(item.profitTotal)}
                          </ProfitBadge>
                        </td>
                        <td>
                          {item.status === 'rpu' ? (
                            <span style={{ color: '#e53e3e' }}>🔄 RPU</span>
                          ) : (
                            <span style={{ color: '#48bb78' }}>✅ Delivered</span>
                          )}
                        </td>
                        <td>
                          <Button size="sm" variant="outline-secondary" onClick={() => handleEditProfitRowClick(item)} style={{ marginRight: '0.4rem' }}>
                            ✏️ Edit
                          </Button>
                          <Button size="sm" variant="outline-danger" onClick={() => deleteProfitRow(item)}>
                            🗑️ Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </StyledTable>
              </div>
              <div style={{ marginTop: '1rem', textAlign: 'center', color: '#666' }}>
                Showing {profitData.slice(0, 20).length} of {profitData.length} records
              </div>
            </Card.Body>
          </GraphCard>
        )}

        {/* Uploaded Data Table */}
        {uploadResults.length > 0 && (
          <GraphCard>
            <Card.Header>
              <IconWrapper>📊</IconWrapper>
              Uploaded Profit/Loss Data ({uploadResults.length} records)
            </Card.Header>
            <Card.Body>
              <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                <StyledTable responsive striped size="sm">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>S.No.</th>
                      <th>Order Date</th>
                      <th>Order id</th>
                      <th>SKU</th>
                      <th>Quantity</th>
                      <th>Status</th>
                      <th>Payment</th>
                      <th>Payment Date</th>
                      <th>Payment Status</th>
                      <th>Purchase Price</th>
                      <th>Profit</th>
                      <th>Re-use / Claim</th>
                      <th>Reused Date</th>
                      <th>Status of Product</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadResults.map((result, index) => (
                      <tr key={index}>
                        <td>{result.Month || result.month || '-'}</td>
                        <td>{result['S.No.'] || result.sno || '-'}</td>
                        <td>{result['Order Date'] || result.orderDate || '-'}</td>
                        <td>{result['Order id'] || result.orderId || '-'}</td>
                        <td>{result.SKU || result.sku || '-'}</td>
                        <td>{result.Quantity || result.quantity || '-'}</td>
                        <td>{result.Status || result.status || '-'}</td>
                        <td>{result.Payment || result.payment || '-'}</td>
                        <td>{result['Payment Date'] || result.paymentDate || '-'}</td>
                        <td>{result['Payment Status'] || result.paymentStatus || '-'}</td>
                        <td>{result['Purchase Price'] || result.purchasePrice || '-'}</td>
                        <td>{result.Profit || result.profit || '-'}</td>
                        <td>{result['Re-use / Claim'] || result.reuseOrClaim || '-'}</td>
                        <td>{result['Reused Date'] || result.reusedDate || '-'}</td>
                        <td>{result['Status of Product'] || result.statusOfProduct || '-'}</td>
                        <td>{result.Remarks || result.remarks || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </StyledTable>
              </div>
            </Card.Body>
          </GraphCard>
        )}

        {/* Upload Results Modal */}
        <Modal show={showModal} onHide={() => setShowModal(false)} size="xl">
          <Modal.Header closeButton>
            <Modal.Title>📊 Upload Results & Export</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {summary && (
              <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '10px' }}>
                <Row>
                  <Col md={3}>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>Total Profit/Loss</p>
                      <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: Number(summary?.totalProfit ?? 0) >= 0 ? '#48bb78' : '#e53e3e' }}>
                      {formatCurrency(summary?.totalProfit)}
                    </p>
                  </Col>
                  <Col md={3}>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>Delivered Profit</p>
                      <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#48bb78' }}>
                      {formatCurrency(summary?.deliveredProfit)}
                    </p>
                  </Col>
                  <Col md={3}>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>RPU Loss</p>
                      <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#e53e3e' }}>
                      {formatCurrency(summary?.rpuProfit)}
                    </p>
                  </Col>
                  <Col md={3}>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>Total Records</p>
                    <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#667eea' }}>
                      {summary.totalRecords || 0}
                    </p>
                  </Col>
                </Row>
              </div>
            )}
            
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              <StyledTable responsive striped size="sm">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>S.No.</th>
                    <th>Order Date</th>
                    <th>Order id</th>
                    <th>SKU</th>
                    <th>Quantity</th>
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Payment Date</th>
                    <th>Payment Status</th>
                    <th>Purchase Price</th>
                    <th>Profit</th>
                    <th>Re-use / Claim</th>
                    <th>Reused Date</th>
                    <th>Status of Product</th>
                    <th>Remarks</th>
                    <th>Actions</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                    {uploadResults.map((result, index) => (
                    <tr key={index}>
                      <td>{result.Month || result.month || '-'}</td>
                      <td>{result['S.No.'] || result.sno || result.serialNumber || '-'}</td>
                      <td>{result['Order Date'] || result.orderDate || '-'}</td>
                      <td>{result['Order id'] || result.orderId || result.orderid || '-'}</td>
                      <td>{result.SKU || result.sku || '-'}</td>
                      <td>{result.Quantity || result.quantity || '-'}</td>
                      <td>{result.Status || result.status || '-'}</td>
                      <td>{result.Payment || result.payment || '-'}</td>
                      <td>{result['Payment Date'] || result.paymentDate || '-'}</td>
                      <td>{result['Payment Status'] || result.paymentStatus || '-'}</td>
                      <td>{result['Purchase Price'] || result.purchasePrice || '-'}</td>
                      <td>{result.Profit || result.profit || '-'}</td>
                      <td>{result['Re-use / Claim'] || result.reuseOrClaim || '-'}</td>
                      <td>{result['Reused Date'] || result.reusedDate || '-'}</td>
                      <td>{result['Status of Product'] || result.statusOfProduct || '-'}</td>
                        <td>{result.Remarks || result.remarks || '-'}</td>
                        <td>
                          <Button size="sm" variant="outline-secondary" onClick={() => handleEditClick(result)} style={{ marginRight: '0.4rem' }}>
                            ✏️ Edit
                          </Button>
                          <Button size="sm" variant="outline-danger" onClick={() => deleteRow(result._id || result.id)}>
                            🗑️ Delete
                          </Button>
                        </td>
                        <td>
                          <Button size="sm" variant="outline-secondary" onClick={() => handleEditClick(result)} style={{ marginRight: '0.4rem' }}>
                            ✏️ Edit
                          </Button>
                          <Button size="sm" variant="outline-danger" onClick={() => deleteRow(result._id || result.id)}>
                            🗑️ Delete
                          </Button>
                        </td>
                    </tr>
                  ))}
                </tbody>
              </StyledTable>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button 
              variant="outline-primary" 
              onClick={() => exportToExcel(uploadResults, 'profit_loss_upload_report.xlsx')}
            >
              <FaFileExcel /> Export to Excel
            </Button>
            <Button 
              variant="outline-danger" 
              onClick={() => exportToPDF(uploadResults, 'profit_loss_upload_report.pdf')}
            >
              <FaFilePdf /> Export to PDF
            </Button>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Edit Row Modal */}
        <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>✏️ Edit Row</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {editingRow && (
              <Form>
                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <Form.Label>Order id</Form.Label>
                      <Form.Control value={editingRow.orderId || editingRow['Order id'] || ''} onChange={(e) => handleEditChange('orderId', e.target.value)} />
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Form.Label>Order Date</Form.Label>
                      <Form.Control type="date" value={editingRow.orderDate || ''} onChange={(e) => handleEditChange('orderDate', e.target.value)} />
                    </FormGroup>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <Form.Label>SKU</Form.Label>
                      <Form.Control value={editingRow.SKU || editingRow.sku || editingRow.sku || ''} onChange={(e) => handleEditChange('sku', e.target.value)} />
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Form.Label>Quantity</Form.Label>
                      <Form.Control value={editingRow.Quantity || editingRow.quantity || ''} onChange={(e) => handleEditChange('quantity', e.target.value)} />
                    </FormGroup>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <Form.Label>Status</Form.Label>
                      <Form.Control value={editingRow.Status || editingRow.status || ''} onChange={(e) => handleEditChange('status', e.target.value)} />
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Form.Label>Payment</Form.Label>
                      <Form.Control value={editingRow.Payment || editingRow.payment || ''} onChange={(e) => handleEditChange('payment', e.target.value)} />
                    </FormGroup>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <FormGroup>
                      <Form.Label>Purchase Price</Form.Label>
                      <Form.Control value={editingRow['Purchase Price'] || editingRow.purchasePrice || editingRow.purchasePrice || ''} onChange={(e) => handleEditChange('purchasePrice', e.target.value)} />
                    </FormGroup>
                  </Col>
                  <Col md={6}>
                    <FormGroup>
                      <Form.Label>Profit</Form.Label>
                      <Form.Control value={editingRow.Profit || editingRow.profit || ''} onChange={(e) => handleEditChange('profit', e.target.value)} />
                    </FormGroup>
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <FormGroup>
                      <Form.Label>Remarks</Form.Label>
                      <Form.Control as="textarea" rows={3} value={editingRow.Remarks || editingRow.remarks || ''} onChange={(e) => handleEditChange('remarks', e.target.value)} />
                    </FormGroup>
                  </Col>
                </Row>
              </Form>
            )}
          </Modal.Body>
          <Modal.Footer>
            <PrimaryButton onClick={saveEditedRow} disabled={loading}>Save</PrimaryButton>
            <SecondaryButton onClick={() => setShowEditModal(false)}>Cancel</SecondaryButton>
          </Modal.Footer>
        </Modal>

        {/* Edit Profit Row Modal */}
        <Modal show={showEditProfitModal} onHide={() => setShowEditProfitModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>✏️ Edit Profit Row</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {editingProfitRow && (
              <Form>
                <Row>
                  <Col md={4}>
                    <FormGroup>
                      <Form.Label>SKU / Barcode</Form.Label>
                      <Form.Control disabled value={editingProfitRow.item?.barcode || editingProfitRow.item?.productName || ''} />
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Form.Label>Quantity</Form.Label>
                      <Form.Control type="number" value={editingProfitRow.item?.quantity || 0} onChange={(e) => handleEditProfitRowChange('quantity', Number(e.target.value))} />
                    </FormGroup>
                  </Col>
                  <Col md={4}>
                    <FormGroup>
                      <Form.Label>Unit Price</Form.Label>
                      <Form.Control type="number" value={editingProfitRow.item?.unitPrice || 0} onChange={(e) => handleEditProfitRowChange('unitPrice', Number(e.target.value))} />
                    </FormGroup>
                  </Col>
                </Row>
              </Form>
            )}
          </Modal.Body>
          <Modal.Footer>
            <PrimaryButton onClick={saveEditedProfitRow} disabled={loading}>Save</PrimaryButton>
            <SecondaryButton onClick={() => setShowEditProfitModal(false)}>Cancel</SecondaryButton>
          </Modal.Footer>
        </Modal>

        {/* Loading State */}
        {loading && profitData.length === 0 && uploadResults.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <LoadingSpinner animation="border" />
            <p>Processing...</p>
          </div>
        )}
      </AnimatedContainer>
    </Container>
  );
};

export default ProfitLoss;