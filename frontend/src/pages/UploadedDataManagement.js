import React, { useState, useEffect } from 'react';
import { uploadedProfitSheetsAPI } from '../services/api';
import * as XLSX from 'xlsx';
import {
  Box,
  Button,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Assessment as AssessmentIcon,
  Close as CloseIcon,
  Search as SearchIcon
} from '@mui/icons-material';

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

const UploadedDataManagement = () => {
  const [uploads, setUploads] = useState([]);
  const [filteredUploads, setFilteredUploads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUpload, setSelectedUpload] = useState(null);
  const [summary, setSummary] = useState(null);

  // Fetch uploads
  useEffect(() => {
    fetchUploads();
    fetchSummary();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = uploads;

    if (searchTerm) {
      filtered = filtered.filter(u =>
        u.fileName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (startDate || endDate) {
      filtered = filtered.filter(u => {
        const uploadDate = new Date(u.uploadDate);
        if (startDate && uploadDate < new Date(startDate)) return false;
        if (endDate && uploadDate > new Date(new Date(endDate).setHours(23, 59, 59, 999))) return false;
        return true;
      });
    }

    setFilteredUploads(filtered);
  }, [uploads, searchTerm, startDate, endDate]);

  const fetchUploads = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await uploadedProfitSheetsAPI.getAll();
      setUploads(response.data);
    } catch (err) {
      setError('Failed to fetch uploads: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await uploadedProfitSheetsAPI.getSummary();
      setSummary(response.data);
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this upload record? This action cannot be undone.')) {
      try {
        await uploadedProfitSheetsAPI.delete(id);
        setSuccess('Upload record deleted successfully');
        fetchUploads();
        fetchSummary();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('Failed to delete: ' + err.message);
      }
    }
  };

  const handleViewDetails = async (upload) => {
    setSelectedUpload(upload);
    setShowDetailsModal(true);
  };

  const downloadAsExcel = (upload) => {
    try {
      const worksheetData = (upload.uploadedData || []).map(item => ({
        'Combo ID': item.comboId,
        'Combo Name': item.comboName,
        'Products': item.productNames,
        'Quantity': item.quantity,
        'Cost Price': item.costPrice,
        'Sold Price': item.soldPrice,
        'Profit per Unit': item.profitPerUnit,
        'Total Profit': item.profitTotal,
        'Status': item.status,
        'Date': new Date(item.date).toLocaleDateString()
      }));

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Profit Data');

      // Set column widths
      const colWidths = [15, 20, 25, 10, 12, 12, 15, 12, 12, 12];
      worksheet['!cols'] = colWidths.map(width => ({ wch: width }));

      XLSX.writeFile(workbook, `${upload.fileName || 'profit-report'}.xlsx`);
      setSuccess('File downloaded successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to download: ' + err.message);
    }
  };

  const formatCurrency = (value) => {
    const num = Number(value) || 0;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(num);
  };

  return (
    <Box sx={{ padding: '2.5rem', backgroundColor: 'rgba(255, 255, 255, 0.85)', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2.5rem'
      }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <AssessmentIcon sx={{ fontSize: '2rem', color: THEME.gold }} />
            <Typography variant="h4" sx={{ fontWeight: 600, color: THEME.charcoal, letterSpacing: '-0.02em', margin: 0 }}>
              Uploaded Data Management
            </Typography>
          </Box>
          <Typography sx={{ color: THEME.softCharcoal, fontSize: '1rem', marginTop: '0.5rem' }}>
            View and manage all previously uploaded profit sheets
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={() => {
            fetchUploads();
            fetchSummary();
          }}
          sx={{
            backgroundColor: THEME.gold,
            color: THEME.black,
            textTransform: 'none',
            borderRadius: '8px',
            padding: '10px 24px',
            fontWeight: 600,
            boxShadow: '0px 1px 2px rgba(212, 175, 55, 0.2)',
            '&:hover': {
              backgroundColor: THEME.richGold,
              boxShadow: '0px 4px 6px -2px rgba(16, 24, 40, 0.03), 0px 12px 16px -4px rgba(16, 24, 40, 0.08)'
            }
          }}
        >
          Refresh
        </Button>
      </Box>

      {/* Alerts */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%', borderRadius: '8px' }}>
          {error}
        </Alert>
      </Snackbar>
      <Snackbar 
        open={!!success} 
        autoHideDuration={6000} 
        onClose={() => setSuccess('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setSuccess('')} severity="success" sx={{ width: '100%', borderRadius: '8px' }}>
          {success}
        </Alert>
      </Snackbar>

      {/* Summary Cards */}
      {summary && (
        <Grid container spacing={2} sx={{ marginBottom: '2.5rem' }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ 
              border: `1px solid ${THEME.softGold}`,
              borderRadius: '12px',
              boxShadow: '0px 1px 2px rgba(212, 175, 55, 0.15)',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: THEME.gold,
                boxShadow: '0px 4px 6px -2px rgba(212, 175, 55, 0.2), 0px 12px 16px -4px rgba(212, 175, 55, 0.3)'
              }
            }}>
              <CardContent>
                <Typography sx={{ fontSize: '2rem', fontWeight: 700, color: THEME.gold, marginBottom: '0.5rem' }}>
                  {summary?.totalUploads || 0}
                </Typography>
                <Typography sx={{ fontSize: '0.875rem', color: THEME.charcoal, fontWeight: 500 }}>
                  Total Uploads
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ 
              border: `1px solid ${THEME.softGold}`,
              borderRadius: '12px',
              boxShadow: '0px 1px 2px rgba(212, 175, 55, 0.15)',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: THEME.gold,
                boxShadow: '0px 4px 6px -2px rgba(212, 175, 55, 0.2), 0px 12px 16px -4px rgba(212, 175, 55, 0.3)'
              }
            }}>
              <CardContent>
                <Typography sx={{ fontSize: '2rem', fontWeight: 700, color: '#2e7d32', marginBottom: '0.5rem' }}>
                  {formatCurrency(summary?.profitSummary?.deliveredProfit)}
                </Typography>
                <Typography sx={{ fontSize: '0.875rem', color: THEME.charcoal, fontWeight: 500 }}>
                  ✅ Delivered Profit
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ 
              border: `1px solid ${THEME.softGold}`,
              borderRadius: '12px',
              boxShadow: '0px 1px 2px rgba(212, 175, 55, 0.15)',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: THEME.gold,
                boxShadow: '0px 4px 6px -2px rgba(212, 175, 55, 0.2), 0px 12px 16px -4px rgba(212, 175, 55, 0.3)'
              }
            }}>
              <CardContent>
                <Typography sx={{ fontSize: '2rem', fontWeight: 700, color: '#ed6c02', marginBottom: '0.5rem' }}>
                  {formatCurrency(summary?.profitSummary?.rtoProfit || 0)}
                </Typography>
                <Typography sx={{ fontSize: '0.875rem', color: THEME.charcoal, fontWeight: 500 }}>
                  📦 RTO Profit
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ 
              border: '1px solid #EAECF0',
              borderRadius: '12px',
              boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: '#D0D5DD',
                boxShadow: '0px 4px 6px -2px rgba(16, 24, 40, 0.03), 0px 12px 16px -4px rgba(16, 24, 40, 0.08)'
              }
            }}>
              <CardContent>
                <Typography sx={{ fontSize: '2rem', fontWeight: 700, color: '#d32f2f', marginBottom: '0.5rem' }}>
                  {formatCurrency(summary?.profitSummary?.rpuProfit || 0)}
                </Typography>
                <Typography sx={{ fontSize: '0.875rem', color: '#667085', fontWeight: 500 }}>
                  🔄 RPU Profit
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card sx={{ 
              border: '1px solid #EAECF0',
              borderRadius: '12px',
              boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: '#D0D5DD',
                boxShadow: '0px 4px 6px -2px rgba(16, 24, 40, 0.03), 0px 12px 16px -4px rgba(16, 24, 40, 0.08)'
              }
            }}>
              <CardContent>
                <Typography sx={{ fontSize: '2rem', fontWeight: 700, color: '#1976d2', marginBottom: '0.5rem' }}>
                  {formatCurrency(summary?.profitSummary?.netProfit)}
                </Typography>
                <Typography sx={{ fontSize: '0.875rem', color: '#667085', fontWeight: 500 }}>
                  💰 Net Profit
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filter Card */}
      <Card sx={{ 
        border: '1px solid #EAECF0',
        borderRadius: '12px',
        boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)',
        marginBottom: '2.5rem'
      }}>
        <Box sx={{ 
          padding: '16px 24px', 
          backgroundColor: '#F9FAFB',
          borderBottom: '1px solid #EAECF0',
          borderRadius: '12px 12px 0 0'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SearchIcon sx={{ color: '#667085' }} />
            <Typography sx={{ fontWeight: 600, color: '#101828' }}>
              Search & Filter
            </Typography>
          </Box>
        </Box>
        <CardContent sx={{ padding: '24px' }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography sx={{ marginBottom: '8px', fontWeight: 500, color: '#344054', fontSize: '0.875rem' }}>
                Search File Name
              </Typography>
              <TextField
                fullWidth
                placeholder="Search by filename..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography sx={{ marginBottom: '8px', fontWeight: 500, color: '#344054', fontSize: '0.875rem' }}>
                Date Range
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  type="date"
                  fullWidth
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px'
                    }
                  }}
                />
                <TextField
                  type="date"
                  fullWidth
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '8px'
                    }
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Uploads Table */}
      {loading ? (
        <Box sx={{ textAlign: 'center', padding: '3rem' }}>
          <CircularProgress sx={{ color: '#000' }} />
          <Typography sx={{ marginTop: '1rem', color: '#667085' }}>Loading uploads...</Typography>
        </Box>
      ) : filteredUploads.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: '8px' }}>No upload records found</Alert>
      ) : (
        <TableContainer component={Paper} sx={{ 
          borderRadius: '12px',
          border: `1px solid ${THEME.softGold}`,
          boxShadow: '0px 1px 2px rgba(212, 175, 55, 0.15)',
          overflow: 'hidden'
        }}>
          <Table>
            <TableHead sx={{ backgroundColor: THEME.lightGold }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: THEME.charcoal, padding: '16px' }}>File Name</TableCell>
                <TableCell sx={{ fontWeight: 600, color: THEME.charcoal, padding: '16px' }}>Upload Date</TableCell>
                <TableCell sx={{ fontWeight: 600, color: THEME.charcoal, padding: '16px' }}>Records</TableCell>
                <TableCell sx={{ fontWeight: 600, color: THEME.charcoal, padding: '16px' }}>Delivered Profit</TableCell>
                <TableCell sx={{ fontWeight: 600, color: THEME.charcoal, padding: '16px' }}>RPU Profit</TableCell>
                <TableCell sx={{ fontWeight: 600, color: THEME.charcoal, padding: '16px' }}>Net Profit</TableCell>
                <TableCell sx={{ fontWeight: 600, color: THEME.charcoal, padding: '16px' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, color: THEME.charcoal, padding: '16px' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUploads.map(upload => (
                <TableRow 
                  key={upload._id}
                  sx={{
                    '&:hover': {
                      backgroundColor: THEME.lightGold
                    },
                    transition: 'background-color 0.2s ease'
                  }}
                >
                  <TableCell sx={{ padding: '16px', fontWeight: 600, color: THEME.charcoal }}>
                    {upload.fileName}
                  </TableCell>
                  <TableCell sx={{ padding: '16px', color: '#667085' }}>
                    {upload.uploadDate ? new Date(upload.uploadDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : '-'}
                  </TableCell>
                  <TableCell sx={{ padding: '16px', color: '#667085' }}>
                    {upload.successRecords || 0}/{upload.totalRecords || 0}
                  </TableCell>
                  <TableCell sx={{ padding: '16px', fontWeight: 600, color: '#2e7d32' }}>
                    {formatCurrency(upload?.profitSummary?.deliveredProfit)}
                  </TableCell>
                  <TableCell sx={{ padding: '16px', fontWeight: 600, color: '#d32f2f' }}>
                    {formatCurrency(upload?.profitSummary?.rpuProfit || 0)}
                  </TableCell>
                  <TableCell sx={{ 
                    padding: '16px', 
                    fontWeight: 600, 
                    color: (Number(upload?.profitSummary?.netProfit) || 0) >= 0 ? '#1976d2' : '#d32f2f'
                  }}>
                    {formatCurrency(upload?.profitSummary?.netProfit)}
                  </TableCell>
                  <TableCell sx={{ padding: '16px' }}>
                    <Chip 
                      label={upload.status || 'Unknown'} 
                      size="small"
                      sx={{ 
                        backgroundColor: '#F9FAFB', 
                        color: '#101828',
                        border: '1px solid #EAECF0',
                        fontWeight: 500
                      }} 
                    />
                  </TableCell>
                  <TableCell sx={{ padding: '16px' }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetails(upload)}
                        title="View Details"
                        sx={{
                          color: '#667085',
                          border: '1px solid #EAECF0',
                          '&:hover': {
                            borderColor: '#D0D5DD',
                            backgroundColor: '#F9FAFB'
                          }
                        }}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => downloadAsExcel(upload)}
                        title="Download as Excel"
                        sx={{
                          color: '#667085',
                          border: '1px solid #EAECF0',
                          '&:hover': {
                            borderColor: '#D0D5DD',
                            backgroundColor: '#F9FAFB'
                          }
                        }}
                      >
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(upload._id)}
                        title="Delete"
                        sx={{
                          color: '#d32f2f',
                          border: '1px solid #d32f2f',
                          '&:hover': {
                            borderColor: '#c62828',
                            backgroundColor: '#ffebee'
                          }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Details Modal */}
      <Dialog 
        open={showDetailsModal} 
        onClose={() => setShowDetailsModal(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: '#101828' }}>
          Upload Details - {selectedUpload?.fileName}
          <IconButton
            onClick={() => setShowDetailsModal(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: '#667085'
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedUpload && (
            <Box>
              <Grid container spacing={2} sx={{ marginBottom: '24px' }}>
                <Grid item xs={12} md={6}>
                  <Typography sx={{ fontWeight: 600, color: '#101828', marginBottom: '4px' }}>Upload Date:</Typography>
                  <Typography sx={{ color: '#667085' }}>{new Date(selectedUpload.uploadDate).toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography sx={{ fontWeight: 600, color: '#101828', marginBottom: '4px' }}>Total Records:</Typography>
                  <Typography sx={{ color: '#667085' }}>
                    {selectedUpload?.successRecords || 0} successful / {selectedUpload?.totalRecords || 0} total
                  </Typography>
                </Grid>
              </Grid>

              <Grid container spacing={2} sx={{ marginBottom: '24px' }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ textAlign: 'center', border: '1px solid #EAECF0', boxShadow: 'none', borderRadius: '8px' }}>
                    <CardContent>
                      <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: '#2e7d32', marginBottom: '8px' }}>
                        {formatCurrency(selectedUpload?.profitSummary?.deliveredProfit)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#667085' }}>✅ Delivered Profit</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ textAlign: 'center', border: '1px solid #EAECF0', boxShadow: 'none', borderRadius: '8px' }}>
                    <CardContent>
                      <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: '#ed6c02', marginBottom: '8px' }}>
                        {formatCurrency(selectedUpload?.profitSummary?.rtoProfit || 0)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#667085' }}>📦 RTO Profit</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ textAlign: 'center', border: '1px solid #EAECF0', boxShadow: 'none', borderRadius: '8px' }}>
                    <CardContent>
                      <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: '#d32f2f', marginBottom: '8px' }}>
                        {formatCurrency(selectedUpload?.profitSummary?.rpuProfit || 0)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#667085' }}>🔄 RPU Profit</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ textAlign: 'center', border: '1px solid #EAECF0', boxShadow: 'none', borderRadius: '8px' }}>
                    <CardContent>
                      <Typography sx={{ 
                        fontSize: '1.5rem', 
                        fontWeight: 700,
                        color: (Number(selectedUpload?.profitSummary?.netProfit) || 0) >= 0 ? '#1976d2' : '#d32f2f',
                        marginBottom: '8px'
                      }}>
                        {formatCurrency(selectedUpload?.profitSummary?.netProfit)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#667085' }}>💰 Net Profit</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Typography variant="h6" sx={{ marginTop: '32px', marginBottom: '16px', fontWeight: 600, color: '#101828' }}>
                📋 Detailed Records
              </Typography>
              <Box sx={{ maxHeight: '400px', overflowY: 'auto' }}>
                <TableContainer component={Paper} sx={{ border: '1px solid #EAECF0', borderRadius: '8px' }}>
                  <Table size="small">
                    <TableHead sx={{ backgroundColor: '#F9FAFB' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, color: '#101828' }}>Combo ID</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#101828' }}>Quantity</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#101828' }}>Cost Price</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#101828' }}>Sold Price</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#101828' }}>Profit</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#101828' }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(selectedUpload.uploadedData || []).map((item, idx) => (
                        <TableRow key={idx} sx={{ '&:hover': { backgroundColor: '#F9FAFB' } }}>
                          <TableCell>{item.comboId}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatCurrency(item.costPrice)}</TableCell>
                          <TableCell>{formatCurrency(item.soldPrice)}</TableCell>
                          <TableCell sx={{ 
                            color: item.profitTotal >= 0 ? '#2e7d32' : '#d32f2f', 
                            fontWeight: 600 
                          }}>
                            {formatCurrency(item.profitTotal)}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={item.status === 'rtu' ? '📦 RTO' : item.status === 'rpu' ? '🔄 RPU' : '✅ Delivered'}
                              size="small"
                              sx={{ 
                                backgroundColor: 
                                  item.status === 'delivered' ? '#e8f5e9' : 
                                  item.status === 'rtu' ? '#fff3e0' : 
                                  item.status === 'rpu' ? '#ffebee' : '#f5f5f5',
                                color:
                                  item.status === 'delivered' ? '#2e7d32' : 
                                  item.status === 'rtu' ? '#ed6c02' : 
                                  item.status === 'rpu' ? '#d32f2f' : '#666',
                                border: '1px solid',
                                borderColor:
                                  item.status === 'delivered' ? '#a5d6a7' : 
                                  item.status === 'rtu' ? '#ffb74d' : 
                                  item.status === 'rpu' ? '#e57373' : '#ddd'
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px' }}>
          {selectedUpload && (
            <Button 
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => downloadAsExcel(selectedUpload)}
              sx={{
                textTransform: 'none',
                backgroundColor: '#000',
                '&:hover': {
                  backgroundColor: '#333'
                }
              }}
            >
              Download as Excel
            </Button>
          )}
          <Button 
            variant="outlined"
            onClick={() => setShowDetailsModal(false)}
            sx={{
              textTransform: 'none',
              color: '#667085',
              borderColor: '#EAECF0',
              '&:hover': {
                borderColor: '#D0D5DD',
                backgroundColor: '#F9FAFB'
              }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UploadedDataManagement;