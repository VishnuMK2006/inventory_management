import React, { useState, useEffect } from 'react';
import { Table, Alert, Form, Button, Row, Col, Card, Spinner, Modal, Badge } from 'react-bootstrap';
import { uploadedProfitSheetsAPI } from '../services/api';
import styled from 'styled-components';
import { FaEye, FaTrash, FaSearch, FaSync, FaDownload } from 'react-icons/fa';
import * as XLSX from 'xlsx';

const Container = styled.div`
  padding: 2rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
`;

const HeaderSection = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
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
      padding: 1rem;
      vertical-align: middle;
      border: none;
    }
  }
`;

const SummaryCard = styled(Card)`
  border: none;
  border-radius: 15px;
  box-shadow: 0 5px 20px rgba(0,0,0,0.1);
  background: linear-gradient(135deg, ${props => props.color1} 0%, ${props => props.color2} 100%);
  color: white;
  
  .card-body {
    padding: 1.5rem;
  }
  
  .summary-value {
    font-size: 1.8rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }
  
  .summary-label {
    font-size: 0.9rem;
    opacity: 0.9;
  }
`;

const ActionButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  
  button {
    padding: 0.4rem 0.8rem;
    font-size: 0.85rem;
    border-radius: 5px;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
  }
`;

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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num);
  };

  return (
    <Container>
      <HeaderSection>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 style={{ color: '#333', marginBottom: '0.5rem' }}>📊 Uploaded Data Management</h2>
            <p style={{ color: '#666', marginBottom: 0 }}>View and manage all previously uploaded profit sheets</p>
          </div>
          <Button 
            variant="primary" 
            onClick={() => {
              fetchUploads();
              fetchSummary();
            }}
            className="d-flex align-items-center gap-2"
          >
            <FaSync /> Refresh
          </Button>
        </div>
      </HeaderSection>

      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

      {/* Summary Cards */}
      {summary && (
        <Row className="mb-4">
          <Col md={3}>
            <SummaryCard color1="#667eea" color2="#764ba2">
              <Card.Body>
                <div className="summary-value">{summary?.totalUploads || 0}</div>
                <div className="summary-label">Total Uploads</div>
              </Card.Body>
            </SummaryCard>
          </Col>
          <Col md={3}>
            <SummaryCard color1="#4facfe" color2="#00f2fe">
              <Card.Body>
                    <div className="summary-value">{formatCurrency(summary?.profitSummary?.deliveredProfit)}</div>
                <div className="summary-label">✅ Delivered Profit</div>
              </Card.Body>
            </SummaryCard>
          </Col>
          <Col md={2}>
            <SummaryCard color1="#ffa500" color2="#ff6347">
              <Card.Body>
                <div className="summary-value">{formatCurrency(summary?.profitSummary?.rtoProfit || 0)}</div>
                <div className="summary-label">📦 RTO Profit</div>
              </Card.Body>
            </SummaryCard>
          </Col>
          <Col md={2}>
            <SummaryCard color1="#fa709a" color2="#fee140">
              <Card.Body>
                <div className="summary-value">{formatCurrency(summary?.profitSummary?.rpuProfit || 0)}</div>
                <div className="summary-label">🔄 RPU Profit</div>
              </Card.Body>
            </SummaryCard>
          </Col>
          <Col md={2}>
            <SummaryCard color1="#667eea" color2="#764ba2">
              <Card.Body>
                <div className="summary-value">{formatCurrency(summary?.profitSummary?.netProfit)}</div>
                <div className="summary-label">💰 Net Profit</div>
              </Card.Body>
            </SummaryCard>
          </Col>
        </Row>
      )}

      {/* Filter Card */}
      <FilterCard>
        <Card.Header>🔍 Search & Filter</Card.Header>
        <Card.Body>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Search File Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search by filename..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="rounded-3"
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Date Range</Form.Label>
                <div className="d-flex gap-2">
                  <Form.Control
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="rounded-3"
                  />
                  <Form.Control
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="rounded-3"
                  />
                </div>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </FilterCard>

      {/* Uploads Table */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading uploads...</p>
        </div>
      ) : filteredUploads.length === 0 ? (
        <Alert variant="info">No upload records found</Alert>
      ) : (
        <StyledTable responsive>
          <thead>
            <tr>
              <th>File Name</th>
              <th>Upload Date</th>
              <th>Records</th>
              <th>Delivered Profit</th>
              <th>RPU Profit</th>
              <th>Net Profit</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUploads.map(upload => (
              <tr key={upload._id}>
                <td>
                  <strong>{upload.fileName}</strong>
                </td>
                <td>{upload.uploadDate ? new Date(upload.uploadDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : '-'}</td>
                <td>{upload.successRecords || 0}/{upload.totalRecords || 0}</td>
                <td>
                    <span style={{ color: '#28a745', fontWeight: '600' }}>
                    {formatCurrency(upload?.profitSummary?.deliveredProfit)}
                  </span>
                </td>
                <td>
                    <span style={{ color: '#dc3545', fontWeight: '600' }}>
                    {formatCurrency(upload?.profitSummary?.rpuProfit || 0)}
                  </span>
                </td>
                <td>
                    <span style={{ 
                    fontWeight: '600',
                    color: (Number(upload?.profitSummary?.netProfit) || 0) >= 0 ? '#007bff' : '#dc3545'
                  }}>
                    {formatCurrency(upload?.profitSummary?.netProfit)}
                  </span>
                </td>
                <td>
                  <Badge bg="success">{upload.status || 'Unknown'}</Badge>
                </td>
                <td>
                  <ActionButtonGroup>
                    <Button
                      size="sm"
                      variant="info"
                      onClick={() => handleViewDetails(upload)}
                      title="View Details"
                    >
                      <FaEye />
                    </Button>
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => downloadAsExcel(upload)}
                      title="Download as Excel"
                    >
                      <FaDownload />
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(upload._id)}
                      title="Delete"
                    >
                      <FaTrash />
                    </Button>
                  </ActionButtonGroup>
                </td>
              </tr>
            ))}
          </tbody>
        </StyledTable>
      )}

      {/* Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Upload Details - {selectedUpload?.fileName}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUpload && (
            <>
              <Row className="mb-3">
                <Col md={6}>
                  <strong>Upload Date:</strong>
                  <p>{new Date(selectedUpload.uploadDate).toLocaleString()}</p>
                </Col>
                <Col md={6}>
                  <strong>Total Records:</strong>
                  <p>{selectedUpload?.successRecords || 0} successful / {selectedUpload?.totalRecords || 0} total</p>
                </Col>
              </Row>

              <Row className="mb-3">
                <Col md={3}>
                  <Card className="text-center">
                    <Card.Body>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#28a745' }}>
                        {formatCurrency(selectedUpload?.profitSummary?.deliveredProfit)}
                      </div>
                      <small>✅ Delivered Profit</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="text-center">
                    <Card.Body>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ff8c00' }}>
                        {formatCurrency(selectedUpload?.profitSummary?.rtoProfit || 0)}
                      </div>
                      <small>📦 RTO Profit</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="text-center">
                    <Card.Body>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#dc3545' }}>
                        {formatCurrency(selectedUpload?.profitSummary?.rpuProfit || 0)}
                      </div>
                      <small>🔄 RPU Profit</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="text-center">
                    <Card.Body>
                      <div style={{ 
                        fontSize: '1.5rem', 
                        fontWeight: '700',
                        color: (Number(selectedUpload?.profitSummary?.netProfit) || 0) >= 0 ? '#007bff' : '#dc3545'
                      }}>
                        {formatCurrency(selectedUpload?.profitSummary?.netProfit)}
                      </div>
                      <small>💰 Net Profit</small>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <h6 className="mt-4 mb-3">📋 Detailed Records</h6>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <Table striped bordered hover size="sm">
                  <thead>
                    <tr>
                      <th>Combo ID</th>
                      <th>Quantity</th>
                      <th>Cost Price</th>
                      <th>Sold Price</th>
                      <th>Profit</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedUpload.uploadedData || []).map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.comboId}</td>
                        <td>{item.quantity}</td>
                        <td>{formatCurrency(item.costPrice)}</td>
                        <td>{formatCurrency(item.soldPrice)}</td>
                        <td style={{ color: item.profitTotal >= 0 ? '#28a745' : '#dc3545', fontWeight: '600' }}>
                          {formatCurrency(item.profitTotal)}
                        </td>
                        <td>
                          <Badge bg={
                            item.status === 'delivered' ? 'success' : 
                            item.status === 'rtu' ? 'warning' : 
                            item.status === 'rpu' ? 'danger' : 'secondary'
                          }>
                            {item.status === 'rtu' ? '📦 RTO' : item.status === 'rpu' ? '🔄 RPU' : '✅ Delivered'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          {selectedUpload && (
            <Button 
              variant="success" 
              onClick={() => downloadAsExcel(selectedUpload)}
              className="d-flex align-items-center gap-2"
            >
              <FaDownload /> Download as Excel
            </Button>
          )}
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default UploadedDataManagement;