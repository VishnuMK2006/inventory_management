// SaleForm component for create/edit
function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// Helper function to format date for HTML5 date input (YYYY-MM-DD)
function formatDateForInput(date) {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper function to convert YYYY-MM-DD back to Date object for API
function convertToApiDate(dateString) {
  if (!dateString) return new Date();
  return new Date(dateString);
}

const SaleForm = ({ initialData, buyers, products, onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState(() => ({
    buyer: initialData?.buyer?._id || initialData?.buyer || '',
    saleDate: initialData?.saleDate ? formatDateForInput(initialData.saleDate) : formatDateForInput(new Date()),
    items: initialData?.items?.map(item => ({
      product: item.product?._id || item.product || '',
      productData: item.product || item.productData || {},
      quantity: item.quantity || 1,
      unitPrice: item.unitPrice || item.product?.price || item.productData?.price || 0,
      barcode: item.barcode || item.product?.barcode || item.productData?.barcode || '',
    })) || [],
    subtotal: initialData?.subtotal || 0,
    discount: initialData?.discount || 0,
    discountAmount: initialData?.discountAmount || 0,
    tax: initialData?.tax || 0,
    taxAmount: initialData?.taxAmount || 0,
    shipping: initialData?.shipping || 0,
    other: initialData?.other || 0,
    total: initialData?.totalAmount || initialData?.total || 0,
    comments: initialData?.comments || ''
  }));

  useEffect(() => {
    setFormData(prev => ({ ...prev, subtotal: calculateSubtotal(prev.items) }));
  }, [formData.items]);

  const calculateSubtotal = (items) => {
    return items.reduce((sum, item) => sum + (item.unitPrice * (item.quantity || 1)), 0);
  };

  const handleInputChange = (name, value) => {
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (["discount", "tax", "shipping", "other", "items"].includes(name)) {
        return calculateTotals(updated);
      }
      return updated;
    });
  };

  const calculateTotals = (data) => {
    const subtotal = calculateSubtotal(data.items);
    const discountAmount = subtotal * (data.discount / 100);
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * (data.tax / 100);
    const total = taxableAmount + taxAmount + Number(data.shipping) + Number(data.other);
    return { ...data, subtotal, discountAmount, taxAmount, total };
  };

  const handleItemChange = (idx, field, value) => {
    setFormData(prev => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], [field]: value };
      return calculateTotals({ ...prev, items });
    });
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { product: '', productData: {}, quantity: 1, unitPrice: 0, barcode: '' }]
    }));
  };

  const handleRemoveItem = (idx) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx)
    }));
  };

  const handleProductSelect = (idx, productId) => {
    const product = products.find(p => p._id === productId);
    if (product) {
      // Calculate how much of this product is already in the cart
      const existingCartQuantity = formData.items
        .filter(item => item.product === productId)
        .reduce((total, item) => total + (item.quantity || 0), 0);
      
      // Calculate real-time available stock
      const realTimeStock = product.quantity - existingCartQuantity;
      
      // Check real-time stock levels before adding to sale
      if (realTimeStock <= 0) {
        showError(`Out of Stock: ${product.name} is currently out of stock or all available quantity is already in cart. Available: ${realTimeStock}, In Cart: ${existingCartQuantity}`);
        return; // Don't add the product to the sale
      } else if (realTimeStock <= product.minquantity) {
        showWarning(`Low Stock Alert: ${product.name}. Available after addition: ${realTimeStock - 1}, Minimum: ${product.minquantity}, Currently in cart: ${existingCartQuantity+1}`);
      }

      setFormData(prev => {
        const items = [...prev.items];
        items[idx] = {
          ...items[idx],
          product: product._id,
          productData: product,
          unitPrice: product.price,
          barcode: product.barcode
        };
        return calculateTotals({ ...prev, items });
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.buyer || formData.items.length === 0) return;
    // Prepare data for API
    const formatted = {
      ...formData,
      saleDate: convertToApiDate(formData.saleDate), // Convert date to proper format
      items: formData.items.map(item => ({
        product: item.product,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        barcode: item.barcode
      }))
    };
    onSubmit(formatted);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Row>
        <Col md={6}>
          <FormGroup className="mb-3">
            <Form.Label>Buyer</Form.Label>
            <Form.Select
              name="buyer"
              value={formData.buyer}
              onChange={e => handleInputChange('buyer', e.target.value)}
              required
            >
              <option value="">Select Buyer</option>
              {buyers.map(buyer => (
                <option key={buyer._id} value={buyer._id}>{buyer.name}</option>
              ))}
            </Form.Select>
          </FormGroup>
        </Col>
        <Col md={6}>
          <FormGroup className="mb-3">
            <Form.Label>Sale Date</Form.Label>
              <Form.Control
                type="date"
                name="saleDate"
                value={formData.saleDate}
                onChange={e => handleInputChange('saleDate', e.target.value)}
                required
              />
          </FormGroup>
        </Col>
      </Row>
      <h6>Items</h6>
      <Table bordered responsive className="mb-3">
        <thead>
          <tr>
            <th>Product</th>
            <th>Barcode</th>
            <th>Price</th>
            <th>Qty</th>
            <th>Total</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {formData.items.map((item, idx) => (
            <tr key={idx}>
              <td>
                <Form.Select
                  value={item.product}
                  onChange={e => handleProductSelect(idx, e.target.value)}
                  required
                  style={{height: "150px",
                          width:"150px",
                          whiteSpace: "normal",   // allow wrapping
                          lineHeight: "1.5",      // adjust spacing
                          overflowWrap: "break-word",}}
                >
                  <option value="">Select Product</option>
                  {products.map(product => {
                    // Calculate how much of this product is already in the cart
                    const existingCartQuantity = formData.items
                      .filter(item => item.product === product._id)
                      .reduce((total, item) => total + (item.quantity || 0), 0);
                    
                    // Calculate real-time available stock
                    const realTimeStock = product.quantity - existingCartQuantity;
                    
                    return (
                      <option 
                        key={product._id} 
                        value={product._id}
                        disabled={realTimeStock <= 0}
                        style={{
                          color: realTimeStock <= 0 ? '#dc3545' : 
                                 realTimeStock <= product.minquantity ? '#ffc107' : '#000'
                        }}
                      >
                        {product.name} {realTimeStock <= 0 ? `(Out of Stock - ${existingCartQuantity} in cart)` : 
                                       realTimeStock <= product.minquantity ? `(Low Stock: ${realTimeStock} available, ${existingCartQuantity} in cart)` : 
                                       `(Available: ${realTimeStock}, ${existingCartQuantity} in cart)`}
                      </option>
                    );
                  })}
                </Form.Select>
              </td>
              <td>{item.barcode}</td>
              <td>
                <Form.Control
                  type="number"
                  step="any"
                  value={item.unitPrice}
                  min="0"
                  onChange={e => handleItemChange(idx, 'unitPrice', Number(e.target.value))}
                  required
                />
              </td>
              <td>
                <Form.Control
                  type="number" 
                  value={item.quantity}
                  min="1"
                  onChange={e => handleItemChange(idx, 'quantity', Number(e.target.value))}
                  required
                />
              </td>
              <td>{(item.unitPrice * item.quantity).toFixed(2)}</td>
              <td>
                <DangerButton size="sm" onClick={() => handleRemoveItem(idx)}>Remove</DangerButton>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <Button variant="secondary" onClick={handleAddItem} className="mb-3">+ Add Item</Button>
      <Row className="mb-3">
        <Col md={3}>
          <FormGroup>
            <Form.Label>Discount (%)</Form.Label>
            <Form.Control
              type="number"
              value={formData.discount}
              min="0"
              max="100"
              onChange={e => handleInputChange('discount', Number(e.target.value))}
            />
          </FormGroup>
        </Col>
        <Col md={3}>
          <FormGroup>
            <Form.Label>Tax (%)</Form.Label>
            <Form.Control
              type="number"
              value={formData.tax}
              min="0"
              max="100"
              onChange={e => handleInputChange('tax', Number(e.target.value))}
            />
          </FormGroup>
        </Col>
        <Col md={3}>
          <FormGroup>
            <Form.Label>Shipping</Form.Label>
            <Form.Control
              type="number"
              value={formData.shipping}
              min="0"
              onChange={e => handleInputChange('shipping', Number(e.target.value))}
            />
          </FormGroup>
        </Col>
        <Col md={3}>
          <FormGroup>
            <Form.Label>Other</Form.Label>
            <Form.Control
              type="number"
              value={formData.other}
              min="0"
              onChange={e => handleInputChange('other', Number(e.target.value))}
            />
          </FormGroup>
        </Col>
      </Row>
      <div className="mb-3">
        <strong>Final Total: ₹{formData.total.toFixed(2)}</strong>
      </div>
      <FormGroup className="mb-3">
        <Form.Label>Comments</Form.Label>
        <Form.Control
          as="textarea"
          value={formData.comments}
          onChange={e => handleInputChange('comments', e.target.value)}
          rows={2}
        />
      </FormGroup>
      <div className="d-flex justify-content-end gap-2">
        <SecondaryButton type="button" onClick={onCancel}>Cancel</SecondaryButton>
        <PrimaryButton type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</PrimaryButton>
      </div>
    </Form>
  );
};
import React, { useState, useEffect, useRef } from "react";
import {
  Button,
  Table,
  Modal,
  Form,
  Alert,
  Row,
  Col,
  ListGroup,
  Spinner,
  Badge,
  Toast,
  ToastContainer,
  OverlayTrigger,
  Tooltip,
  Popover
} from "react-bootstrap";
import { salesAPI, buyersAPI, productsAPI, barcodesAPI } from "../services/api";
import Quagga from "quagga";
import styled, { keyframes, css, createGlobalStyle } from 'styled-components';

// Print styles
const PrintStyles = createGlobalStyle`
  @media print {
    * {
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    body * {
      visibility: hidden;
    }
    
    .modal, .modal * {
      visibility: visible;
    }
    
    .modal {
      position: absolute !important;
      left: 0 !important;
      top: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      min-height: 100vh !important;
      max-height: none !important;
      height: auto !important;
      overflow: visible !important;
      background: white !important;
      transform: none !important;
      z-index: 1 !important;
    }
    
    .modal-dialog {
      max-width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      height: auto !important;
      transform: none !important;
    }
    
    .modal-content {
      border: none !important;
      box-shadow: none !important;
      border-radius: 0 !important;
      height: auto !important;
      background: white !important;
      transform: none !important;
    }
    
    .modal-header, .modal-footer {
      display: none !important;
    }
    
    .modal-body {
      padding: 0 !important;
      background: white !important;
      margin: 0 !important;
      display: block !important;
      visibility: visible !important;
    }
    
    @page {
      size: A4;
      margin: 0.5in;
    }
    
    table {
      page-break-inside: avoid;
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    
    tr {
      page-break-inside: avoid;
    }
    
    h1, h2, h3 {
      page-break-after: avoid;
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
      display: block !important;
      visibility: visible !important;
    }
    
    /* Force colors to print */
    thead, thead th {
      background: #3498db !important;
      color: white !important;
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    .bg-light {
      background: #f8f9fa !important;
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    
    /* Ensure proper spacing and layout */
    .invoice-container {
      max-width: 100% !important;
      width: 100% !important;
    }
  }
`;

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

const scannerFlash = keyframes`
  0% { opacity: 0.3; }
  50% { opacity: 1; }
  100% { opacity: 0.3; }
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

const StyledTable = styled(Table)`
  background: white;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 5px 20px rgba(0,0,0,0.1);
  
  thead {
    background: linear-gradient(to right, #3498db);
    color: white;
    th {
      background: linear-gradient(to right, #3498db);
      border: none;
      padding: 1.2rem;
      font-weight: 500;
    }
  }
  
  tbody tr {
    transition: all 0.3s ease;
    
    &:hover {
    background: linear-gradient(to right, #3498db);
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }
    
    td {
      padding: 1.2rem;
      border-color: #e9ecef;
    }
  }
`;

const PrimaryButton = styled(Button)`
  background: linear-gradient(to right, #3498db);
  border: none;
  border-radius: 25px;
  padding: 0.8rem 2rem;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.2);
    background: linear-gradient(to right, #3498db, #2ecc71);
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

const SuccessButton = styled(Button)`
  border-radius: 20px;
  padding: 0.5rem 1.2rem;
  transition: all 0.3s ease;
  border: 2px solid #48bb78;
  color: #48bb78;
  background: transparent;
  
  &:hover {
    background: #48bb78;
    color: white;
    transform: translateY(-1px);
    box-shadow: 0 4px 15px rgba(72, 187, 120, 0.3);
  }
`;

const DangerButton = styled(Button)`
  border-radius: 20px;
  padding: 0.5rem 1rem;
  transition: all 0.3s ease;
  font-weight: 500;
  
  &:hover {
    animation: ${pulse} 0.6s ease;
    background-color: #dc3545;
    border-color: #dc3545;
    color: white;
  }
`;

const ScannerButton = styled(Button)`
  border-radius: 20px;
  padding: 0.8rem 1.5rem;
  font-weight: 600;
  transition: all 0.3s ease;
  border: none;
  
  ${props => props.$active ? css`
    background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%);
    color: white;
    box-shadow: 0 4px 15px rgba(229, 62, 62, 0.3);
    
    &:hover {
      background: linear-gradient(135deg, #c53030 0%, #9b2c2c 100%);
      transform: translateY(-2px);
    }
  ` : css`
        background: linear-gradient(to right, #3498db);
    color: white;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    
    &:hover {
        background: linear-gradient(to right, #3498db);
      transform: translateY(-2px);
    }
  `}
`;

const StyledModal = styled(Modal)`
  .modal-content {
    border-radius: 20px;
    border: none;
    box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  }
  
  .modal-header {
    background: linear-gradient(to right, #3498db);
    color: white;
    border-radius: 20px 20px 0 0;
    border: none;
    padding: 0.75rem 1rem;
    
    .btn-close {
      filter: invert(1);
    }
  }
  
  .modal-body {
    padding: 1rem;
  }
  
  .modal-footer {
    padding: 0.5rem 1rem;
    border-top: 1px solid #e9ecef;
  }
`;

const ScannerContainer = styled.div`
  width: 100%;
  height: 250px;
  background: #000;
  border-radius: 15px;
  overflow: hidden;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border: 2px solid #00ff00;
    border-radius: 10px;
    animation: ${scannerFlash} 2s ease-in-out infinite;
    pointer-events: none;
  }
`;

const FormGroup = styled(Form.Group)`
  margin-bottom: 1rem;
  
  .form-label {
    font-weight: 600;
    color: #4a5568;
    margin-bottom: 0.25rem;
    font-size: 0.9rem;
  }
  
  .form-control, .form-select {
    border-radius: 10px;
    border: 2px solid #e2e8f0;
    padding: 0.6rem;
    transition: all 0.3s ease;
    
    &:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
    }
  }
`;

const ItemList = styled(ListGroup)`
  .list-group-item {
    border-radius: 10px;
    margin-bottom: 0.5rem;
    border: 1px solid #e2e8f0;
    transition: all 0.3s ease;
    
    &:hover {
      background: #f7fafc;
      transform: translateX(5px);
    }
  }
`;

const TotalDisplay = styled.h5`
        background: linear-gradient(to right, #3498db);
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 15px;
  text-align: center;
  margin-top: 1.5rem;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  font-weight: bold;
  animation: ${pulse} 2s infinite;
`;

const LoadingSpinner = styled(Spinner)`
  color: #667eea;
  width: 3rem;
  height: 3rem;
`;

const IconWrapper = styled.span`
  margin-right: 0.5rem;
`;

const BarcodeBadge = styled(Badge)`
        background: linear-gradient(to right, #3498db);
  font-size: 0.8rem;
  padding: 0.4rem 0.8rem;
  border-radius: 10px;
`;

const ScannerStatus = styled.div`
  padding: 1rem;
  border-radius: 10px;
  background: ${props => props.$active ? '#48bb78' : '#e53e3e'};
  color: white;
  text-align: center;
  margin-bottom: 1rem;
  font-weight: 600;
`;

const LowStockAlert = styled(Alert)`
  border-left: 4px solid #f56565;
  background-color: #fff5f5;
  color: #c53030;
  font-weight: 500;
  animation: ${pulse} 2s;
`;

// Invoice Styled Components
const InvoiceContainer = styled.div`
  background: white;
  padding: 1.5rem;
  max-width: 800px;
  margin: 0 auto;
  font-family: 'Arial', sans-serif;
  line-height: 1.4;
  color: #333;
  font-size: 0.9rem;
  
  @media print {
    padding: 1rem !important;
    box-shadow: none !important;
    border: none !important;
    max-width: 100% !important;
    width: 100% !important;
    font-size: 12pt !important;
    line-height: 1.3 !important;
    background: white !important;
    -webkit-print-color-adjust: exact !important;
    color-adjust: exact !important;
    margin: 0 !important;
    
    /* Ensure all nested elements inherit print styles */
    *, *::before, *::after {
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  }
`;

const InvoiceHeader = styled.div`
  text-align: center;
  margin-bottom: 1.5rem;
  border-bottom: 3px solid #3498db;
  padding-bottom: 1rem;
  width: 100%;
  
  @media print {
    border-bottom: 3px solid #3498db !important;
    -webkit-print-color-adjust: exact !important;
    color-adjust: exact !important;
    print-color-adjust: exact !important;
    margin-bottom: 1rem !important;
    padding-bottom: 0.8rem !important;
    width: 100% !important;
    
    * {
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
      print-color-adjust: exact !important;
      display: block !important;
      visibility: visible !important;
    }
    
    div {
      display: flex !important;
      visibility: visible !important;
    }
  }
`;

const InvoiceDetails = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  
  @media print {
    gap: 1rem;
    margin-bottom: 1rem;
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const InvoiceSection = styled.div`
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  
  @media print {
    background: #f8f9fa !important;
    padding: 0.8rem !important;
    border: 1px solid #e9ecef !important;
    border-radius: 6px !important;
    -webkit-print-color-adjust: exact !important;
    color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  
  h3 {
    color: #3498db;
    margin-bottom: 0.8rem;
    font-size: 1rem;
    border-bottom: 2px solid #3498db;
    padding-bottom: 0.3rem;
    
    @media print {
      color: #3498db !important;
      font-size: 12pt !important;
      margin-bottom: 0.6rem !important;
      border-bottom: 2px solid #3498db !important;
      padding-bottom: 0.3rem !important;
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
  }
  
  p {
    margin: 0.3rem 0;
    font-size: 0.9rem;
    
    @media print {
      margin: 0.2rem 0 !important;
      font-size: 10pt !important;
      color: #333 !important;
    }
    
    strong {
      color: #333;
      display: inline-block;
      width: 70px;
      
      @media print {
        color: #333 !important;
        width: 60px !important;
      }
    }
  }
`;

const InvoiceTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin: 1.5rem 0;
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border-radius: 6px;
  overflow: hidden;
  font-size: 0.85rem;
  
  @media print {
    margin: 1rem 0;
    box-shadow: none;
    font-size: 0.75rem;
    -webkit-print-color-adjust: exact;
    color-adjust: exact;
    border: 2px solid #333 !important;
  }
  
  thead {
    background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
    color: white;
    
    @media print {
      background: #3498db !important;
      color: white !important;
      -webkit-print-color-adjust: exact;
      color-adjust: exact;
    }
    
    th {
      padding: 0.8rem 0.6rem;
      text-align: left;
      font-weight: 600;
      font-size: 0.8rem;
      border: none;
      
      @media print {
        padding: 0.6rem 0.4rem;
        font-size: 0.75rem;
        border: 1px solid #333 !important;
        background: #3498db !important;
        color: white !important;
      }
    }
  }
  
  tbody {
    tr {
      border-bottom: 1px solid #e9ecef;
      transition: all 0.3s ease;
      
      &:hover {
        background-color: #f8f9fa;
      }
      
      &:last-child {
        border-bottom: none;
      }
      
      @media print {
        &:hover {
          background-color: transparent !important;
        }
      }
    }
    
    td {
      padding: 0.6rem 0.4rem;
      border: 1px solid #dee2e6;
      font-size: 0.8rem;
      
      @media print {
        padding: 0.4rem 0.3rem;
        font-size: 0.75rem;
        border: 1px solid #333 !important;
      }
    }
  }
`;

const InvoiceSummary = styled.div`
  margin-top: 1.5rem;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 1.5rem;
  
  @media print {
    margin-top: 1rem;
    gap: 1rem;
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const SummaryTable = styled.table`
  border-collapse: collapse;
  min-width: 250px;
  font-size: 0.9rem;
  
  @media print {
    min-width: 200px;
    font-size: 0.8rem;
    -webkit-print-color-adjust: exact;
    color-adjust: exact;
  }
  
  tr {
    border-bottom: 1px solid #e9ecef;
    
    &:last-child {
      border-bottom: 3px solid #3498db;
      background: #f8f9fa;
      font-weight: bold;
      font-size: 1rem;
      
      @media print {
        font-size: 0.9rem;
        border-bottom: 3px solid #3498db !important;
        background: #f8f9fa !important;
        -webkit-print-color-adjust: exact;
        color-adjust: exact;
      }
    }
    
    @media print {
      border-bottom: 1px solid #333 !important;
    }
  }
  
  td {
    padding: 0.6rem 0.8rem;
    text-align: right;
    
    @media print {
      padding: 0.4rem 0.6rem;
      border: 1px solid #333 !important;
    }
    
    &:first-child {
      text-align: left;
      font-weight: 500;
    }
  }
`;

const InvoiceFooter = styled.div`
  margin-top: 2rem;
  text-align: center;
  padding-top: 1.5rem;
  border-top: 2px solid #e9ecef;
  color: #666;
  font-size: 0.85rem;
  
  @media print {
    margin-top: 1rem;
    padding-top: 1rem;
    font-size: 0.8rem;
  }
`;

const PrintButton = styled(Button)`
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  border: none;
  padding: 0.8rem 2rem;
  font-weight: 600;
  border-radius: 25px;
  
  &:hover {
    background: linear-gradient(135deg, #20c997 0%, #28a745 100%);
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
  }
  
  @media print {
    display: none;
  }
`;

// Fixed TableRow component without inline animation
const TableRow = styled.tr`
  transition: all 0.3s ease;
  
  @media print {
    page-break-inside: avoid !important;
    transition: none !important;
    transform: none !important;
    box-shadow: none !important;
  }
  
  &:hover {
    background: linear-gradient(to right, #3498db);
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    
    @media print {
      background: none !important;
      color: inherit !important;
      transform: none !important;
      box-shadow: none !important;
    }
  }
  
  &:nth-child(even) {
    @media print {
      background-color: #f8f9fa !important;
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  }
  
  td {
    padding: 1.2rem;
    border-color: #e9ecef;
    
    @media print {
      padding: 0.5rem !important;
      border-color: #e9ecef !important;
      color: #333 !important;
    }
  }
`;

// Toast Container for top-right notifications
const StyledToastContainer = styled(ToastContainer)`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  
  .toast {
    border: none;
    border-radius: 10px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    backdrop-filter: blur(10px);
    margin-bottom: 10px;
    
    &.bg-success {
      background: linear-gradient(135deg, #28a745, #20c997) !important;
      color: white;
    }
    
    &.bg-danger {
      background: linear-gradient(135deg, #dc3545, #e83e8c) !important;
      color: white;
    }
    
    &.bg-warning {
      background: linear-gradient(135deg, #ffc107, #fd7e14) !important;
      color: #212529;
    }
    
    .toast-header {
      background: transparent;
      border: none;
      color: inherit;
      font-weight: 600;
      
      .btn-close {
        filter: ${props => props.variant === 'success' || props.variant === 'danger' ? 'invert(1)' : 'none'};
      }
    }
    
    .toast-body {
      font-weight: 500;
      padding: 0.75rem 1rem;
    }
  }
`;

//logic
const Sales = () => {
  // Password confirmation for edit
  const [showEditConfirmModal, setShowEditConfirmModal] = useState(false);
  const [editSaleIdToConfirm, setEditSaleIdToConfirm] = useState(null);
  const [editPassword, setEditPassword] = useState("");
  const [editPasswordError, setEditPasswordError] = useState("");

  // Show password modal before edit
  const requestEditSale = (sale) => {
    setEditSaleIdToConfirm(sale);
    setEditPassword("");
    setEditPasswordError("");
    setShowEditConfirmModal(true);
  };

  // Confirm password and open edit modal
  const confirmEditSale = () => {
    if (editPassword !== "admin_confirm") {
      setEditPasswordError("Incorrect password. Please enter correct password.");
      return;
    }
    setShowEditConfirmModal(false);
    setEditPassword("");
    setEditPasswordError("");
    handleEdit(editSaleIdToConfirm);
    setEditSaleIdToConfirm(null);
  };
  // Password confirmation for delete
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deleteSaleId, setDeleteSaleId] = useState(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deletePasswordError, setDeletePasswordError] = useState("");

  // Show password modal before delete
  const requestDeleteSale = (saleId) => {
    setDeleteSaleId(saleId);
    setDeletePassword("");
    setDeletePasswordError("");
    setShowDeleteConfirmModal(true);
  };

  // Confirm password and delete
  const confirmDeleteSale = async () => {
    if (deletePassword !== "admin_confirm") {
      setDeletePasswordError("Incorrect password. Please enter correct password.");
      return;
    }
    setShowDeleteConfirmModal(false);
    setDeletePassword("");
    setDeletePasswordError("");
    await handleDeleteSale(deleteSaleId);
    setDeleteSaleId(null);
  };
  // Edit Sale Modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editSaleData, setEditSaleData] = useState(null);

  // Handle Edit button click
  const handleEdit = (sale) => {
    setEditSaleData(sale);
    setShowEditModal(true);
  };

  // Handle Edit Sale submit
  const handleEditSubmit = async (updatedData) => {
    try {
      setLoading(true);
      await salesAPI.update(editSaleData._id, updatedData);
      showSuccess('Sale updated successfully');
      setShowEditModal(false);
      fetchSales();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to update sale');
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete Sale (actual API call)
  const handleDeleteSale = async (saleId) => {
    try {
      setLoading(true);
      await salesAPI.delete(saleId);
      showSuccess('Sale deleted and product quantities restored');
      fetchSales();
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to delete sale');
    } finally {
      setLoading(false);
    }
  };
  const [sales, setSales] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItemIndex, setDeleteItemIndex] = useState(null);
  const [deleteQuantity, setDeleteQuantity] = useState(1);
  const [selectedSale, setSelectedSale] = useState(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [scannedCode, setScannedCode] = useState("");
  const [barcodeMode, setBarcodeMode] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [lowStockAlert, setLowStockAlert] = useState(null);
  const [products, setProducts] = useState([]);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);

  // Toast notifications state
  const [toasts, setToasts] = useState([]);

  const scannerRef = useRef(null);
  const barcodeInputRef = useRef(null);

  // Initialize formData with all required fields
  const [formData, setFormData] = useState({
    buyer: "",
    saleDate: formatDateForInput(new Date()),
    items: [],
    subtotal: 0,
    discount: 0,
    discountAmount: 0,
    tax: 0,
    taxAmount: 0,
    shipping: 0,
    other: 0,
    total: 0,
    comments: ""
  });

  useEffect(() => {
    fetchData();
    return () => {
      stopScanner();
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchSales(), fetchBuyers(), fetchProducts()]);
    } catch (error) {
      showError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSales = async () => {
    try {
      const response = await salesAPI.getAll();
      const salesData = response.data || [];
      
      // Ensure each sale has proper structure
      const formattedSales = salesData.map(sale => ({
        ...sale,
        buyer: sale.buyer || { name: 'Unknown Buyer', phone: '', email: '' },
        items: sale.items || [],
        totalAmount: sale.totalAmount || 0
      }));
      
      setSales(formattedSales);
    } catch (error) {
      console.error("Failed to fetch sales:", error);
      showError("Failed to fetch sales data");
      setSales([]);
    }
  };

  const fetchBuyers = async () => {
    try {
      const response = await buyersAPI.getAll();
      setBuyers(response.data);
    } catch (error) {
      console.error("Failed to fetch buyers");
    }
  };
  
  const fetchProducts = async () => {
    try {
      const response = await productsAPI.getAll();
      setProducts(response.data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  const handleShowModal = () => {
    setShowModal(true);
    setFormData({
      buyer: "",
      saleDate: formatDateForInput(new Date()),
      items: [],
      subtotal: 0,
      discount: 0,
      discountAmount: 0,
      tax: 0,
      taxAmount: 0,
      shipping: 0,
      other: 0,
      total: 0,
      comments: ""
    });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    stopScanner();
  };

  // Updated handleInputChange to handle calculations
  const handleInputChange = (name, value) => {
    setFormData((prev) => {
      const updatedData = { ...prev, [name]: value };
      
      // Recalculate all derived values when relevant fields change
      if (['discount', 'tax', 'shipping', 'other'].includes(name) || name === 'items') {
        return calculateTotals(updatedData);
      }
      
      return updatedData;
    });
  };

  // Add this calculation function
  const calculateTotals = (data) => {
    // Calculate subtotal from items
    const subtotal = data.items.reduce((sum, item) => sum + (item.unitPrice * (item.quantity || 1)), 0);
    
    // Calculate discount amount (percentage of subtotal)
    const discountAmount = subtotal * (data.discount / 100);
    
    // Calculate taxable amount (subtotal minus discount)
    const taxableAmount = subtotal - discountAmount;
    
    // Calculate tax amount (percentage of taxable amount)
    const taxAmount = taxableAmount * (data.tax / 100);
    
    // Calculate final total
    const total = taxableAmount + taxAmount + Number(data.shipping) + Number(data.other);
    
    // Return updated data with all calculated values
    return {
      ...data,
      subtotal,
      discountAmount,
      taxAmount,
      total
    };
  };

  // Start Quagga Scanner
  const startScanner = () => {
    if (scannerRef.current) {
      Quagga.init(
        {
          inputStream: {
            type: "LiveStream",
            target: scannerRef.current,
            constraints: {
              facingMode: "environment",
            },
          },
          decoder: {
            readers: [
              "code_128_reader",
              "ean_reader",
              "upc_reader",
              "code_39_reader",
            ],
          },
        },
        (err) => {
          if (err) {
            showError("Unable to start scanner: " + err);
            return;
          }
          Quagga.start();
          setScannerActive(true);
        }
      );

      Quagga.onDetected((data) => {
        if (data && data.codeResult && data.codeResult.code) {
          setScannedCode(data.codeResult.code);
        }
      });
    }
  };

  // Stop Scanner
  const stopScanner = () => {
    try {
      Quagga.stop();
      setScannerActive(false);
    } catch { }
  };

  // Toast notification helpers
  const showToast = (message, variant = 'success', title = '') => {
    const id = Date.now();
    const toast = {
      id,
      message,
      variant,
      title: title || (variant === 'success' ? 'Success' : variant === 'danger' ? 'Error' : 'Warning'),
      show: true
    };
    
    setToasts(prev => [...prev, toast]);
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showSuccess = (message) => {
    showToast(message, 'success', 'Success');
  };

  const showError = (message) => {
    showToast(message, 'danger', 'Error');
  };

  const showWarning = (message) => {
    showToast(message, 'warning', 'Warning');
  };

  // Toggle barcode mode
  const toggleBarcodeMode = () => {
    setBarcodeMode(prev => {
      const newMode = !prev;
      if (newMode) {
        // Focus the input when enabling barcode mode
        setTimeout(() => {
          if (barcodeInputRef.current) {
            barcodeInputRef.current.focus();
          }
        }, 100);
      } else {
        // Clear the input when disabling barcode mode
        setScannedCode("");
      }
      return newMode;
    });
  };

  // Manual barcode add function
  const addBarcodeManually = async () => {
    if (!scannedCode || !barcodeMode) return;
    
    try {
      await addScannedItem();
      setScannedCode(""); // Clear after manual addition
    } catch (error) {
      console.error("Error adding barcode manually:", error);
    }
  };

  // Extract addScannedItem function to be reusable
  const addScannedItem = async () => {
    if (!scannedCode) return;
    try {
      // First, try the sales API scan endpoint to handle both products and combos
      const response = await salesAPI.scanBarcode({ barcode: scannedCode });
      const scannedItem = response.data;
      
      if (scannedItem.type === 'combo') {
        // Handle combo barcode
        const combo = scannedItem.combo;
        
        // Check if this combo barcode already exists in items
        const existingItemIndex = formData.items.findIndex(item => item.barcode === scannedCode && item.type === 'combo');
        
        setFormData((prev) => {
          let newItems = [...prev.items];
          
          if (existingItemIndex !== -1) {
            // Increment quantity of existing combo
            newItems[existingItemIndex] = {
              ...newItems[existingItemIndex],
              quantity: (newItems[existingItemIndex].quantity || 1) + 1
            };
          } else {
            // Add new combo item
            newItems.push({
              type: 'combo',
              combo: combo._id,
              comboData: combo,
              quantity: 1,
              unitPrice: combo.price,
              barcode: scannedCode,
            });
          }
          
          // Recalculate totals with new items
          return calculateTotals({
            ...prev,
            items: newItems
          });
        });
        
        showSuccess(`Combo "${combo.name}" added to cart`);
        setScannedCode("");
        setError("");
        
      } else if (scannedItem.type === 'rto-product') {
        // Handle RTO product barcode
        const rtoProduct = scannedItem.rtoProduct;
        
        // Check if this RTO product barcode already exists in items
        const existingItemIndex = formData.items.findIndex(item => item.barcode === scannedCode && item.type === 'rto-product');
        
        setFormData((prev) => {
          let newItems = [...prev.items];
          
          if (existingItemIndex !== -1) {
            // Increment quantity of existing RTO product
            newItems[existingItemIndex] = {
              ...newItems[existingItemIndex],
              quantity: (newItems[existingItemIndex].quantity || 1) + 1
            };
          } else {
            // Add new RTO product item
            newItems.push({
              type: 'rto-product',
              rtoProduct: rtoProduct._id,
              rtoProductData: rtoProduct,
              quantity: 1,
              unitPrice: rtoProduct.price,
              barcode: scannedCode,
            });
          }
          
          // Recalculate totals with new items
          return calculateTotals({
            ...prev,
            items: newItems
          });
        });
        
        showSuccess(`RTO Product "${rtoProduct.productName}" added to cart`);
        setScannedCode("");
        setError("");
        
      } else if (scannedItem.type === 'product') {
        // Handle product barcode (existing logic)
        const product = scannedItem.product;
        
        // Calculate how much of this product is already in the cart
        const existingCartQuantity = formData.items
          .filter(item => item.barcode === scannedCode && item.type !== 'combo')
          .reduce((total, item) => total + (item.quantity || 0), 0);
        
        // Calculate real-time available stock
        const realTimeStock = product.quantity - existingCartQuantity;
        
        // Check real-time stock levels
        if (realTimeStock <= 0) {
          showError(`Out of Stock: ${product.name} is currently out of stock or all available quantity is already in cart. Available: ${realTimeStock}, In Cart: ${existingCartQuantity}`);
          setScannedCode("");
          return;
        } else if (realTimeStock <= product.minquantity) {
          showWarning(`Low Stock Alert: ${product.name} Available after scan: ${realTimeStock - 1}, Minimum: ${product.minquantity}, Currently in cart: ${existingCartQuantity+1}`);
        }
        
        setFormData((prev) => {
          // Check if this product barcode already exists in items
          const existingItemIndex = prev.items.findIndex(item => item.barcode === scannedCode && item.type !== 'combo');
          
          let newItems = [...prev.items];
          
          if (existingItemIndex !== -1) {
            // Increment quantity of existing item
            newItems[existingItemIndex] = {
              ...newItems[existingItemIndex],
              quantity: (newItems[existingItemIndex].quantity || 1) + 1
            };
          } else {
            // Add new product item
            newItems.push({
              type: 'product',
              product: product._id,
              productData: product,
              quantity: 1,
              unitPrice: product.price,
              barcode: scannedCode,
            });
          }
          
          // Recalculate totals with new items
          return calculateTotals({
            ...prev,
            items: newItems
          });
        });
        
        showSuccess(`Product "${product.name}" added to cart`);
        setScannedCode("");
        setError("");
      }
      
      // Only stop and restart scanner if it was already active
      if (scannerActive) {
        stopScanner();
        setTimeout(() => {
          startScanner();
        }, 1000);
      }
    } catch (error) {
      // Fallback: try to find in cached products if sales API fails
      await fallbackToProductsAPI();
    }
  };

  // Helper function to use cached products as fallback
  const fallbackToProductsAPI = async () => {
    try {
      // First, try to get product directly from products using the barcode
      const productMatch = products.find(p => p.barcode === scannedCode);
      
      if (productMatch) {
        // Calculate how much of this product is already in the cart
        const existingCartQuantity = formData.items
          .filter(item => item.barcode === scannedCode && item.type !== 'combo')
          .reduce((total, item) => total + (item.quantity || 0), 0);
        
        // Calculate real-time available stock
        const realTimeStock = productMatch.quantity - existingCartQuantity;
        
        // We found a matching product in our already fetched products
        const enhancedProduct = {
          _id: productMatch._id,
          name: productMatch.name,
          category: productMatch.category || 'Unknown',
          description: productMatch.description || '',
          currentStock: productMatch.quantity || 0,
          realTimeStock: realTimeStock,
          minStock: productMatch.minquantity || 0,
          price: productMatch.price
        };
        
        // Check real-time stock levels and handle accordingly
        if (realTimeStock <= 0) {
          // Block sales if real-time stock is 0 or negative
          showError(`Out of Stock: ${productMatch.name} is currently out of stock or all available quantity is already in cart. Available: ${realTimeStock}, In Cart: ${existingCartQuantity}`);
          setScannedCode("");
          return; // Exit function to prevent adding the item
        } else if (realTimeStock <= productMatch.minquantity) {
          // Show warning but allow sales if real-time stock <= minquantity (but not 0)
          showWarning(`Low Stock Alert: ${productMatch.name} Available after scan: ${realTimeStock - 1}, Minimum: ${productMatch.minquantity}, Currently in cart: ${existingCartQuantity+1}`);
        }
        
        setFormData((prev) => {
          // Check if this barcode already exists in items
          const existingItemIndex = prev.items.findIndex(item => item.barcode === scannedCode && item.type !== 'combo');
          
          let newItems = [...prev.items];
          
          if (existingItemIndex !== -1) {
            // Increment quantity of existing item
            newItems[existingItemIndex] = {
              ...newItems[existingItemIndex],
              quantity: (newItems[existingItemIndex].quantity || 1) + 1
            };
          } else {
            // Add new item with enhanced product details
            newItems.push({
              type: 'product',
              product: enhancedProduct._id,
              productData: enhancedProduct,
              quantity: 1,
              unitPrice: enhancedProduct.price,
              barcode: scannedCode,
            });
          }
          
          // Recalculate totals with new items
          return calculateTotals({
            ...prev,
            items: newItems
          });
        });
        
        showSuccess(`Product "${productMatch.name}" added to cart`);
        setScannedCode("");
        setError("");
      } else {
        // Try to fetch product by barcode API
        try {
          const productResponse = await productsAPI.getByBarcode(scannedCode);
          if (productResponse.data) {
            const productDetails = productResponse.data;
            
            // Calculate how much of this product is already in the cart
            const existingCartQuantity = formData.items
              .filter(item => item.barcode === scannedCode && item.type !== 'combo')
              .reduce((total, item) => total + (item.quantity || 0), 0);
            
            // Calculate real-time available stock
            const realTimeStock = productDetails.quantity - existingCartQuantity;
            
            // Create enhanced product object
            const enhancedProduct = {
              _id: productDetails._id,
              name: productDetails.name || 'Unknown Product',
              category: productDetails.category || 'Unknown',
              description: productDetails.description || '',
              currentStock: productDetails.quantity || 0,
              realTimeStock: realTimeStock,
              minStock: productDetails.minquantity || 0,
              price: productDetails.price
            };
            
            // Check real-time stock levels and handle accordingly
            if (realTimeStock <= 0) {
              // Block sales if real-time stock is 0 or negative
              showError(`Out of Stock: ${enhancedProduct.name} is currently out of stock or all available quantity is already in cart. Available: ${realTimeStock}, In Cart: ${existingCartQuantity}`);
              setScannedCode("");
              return; // Exit function to prevent adding the item
            } else if (realTimeStock <= productDetails.minquantity) {
              // Show warning but allow sales if real-time stock <= minquantity (but not 0)
              showWarning(`Low Stock Alert: ${enhancedProduct.name}. Available after scan: ${realTimeStock -1}, Minimum: ${productDetails.minquantity}, Currently in cart: ${existingCartQuantity+1}`);
            }
            
            setFormData((prev) => {
              // Check if this barcode already exists in items
              const existingItemIndex = prev.items.findIndex(item => item.barcode === scannedCode && item.type !== 'combo');
              
              let newItems = [...prev.items];
              
              if (existingItemIndex !== -1) {
                // Increment quantity of existing item
                newItems[existingItemIndex] = {
                  ...newItems[existingItemIndex],
                  quantity: (newItems[existingItemIndex].quantity || 1) + 1
                };
              } else {
                // Add new item with enhanced product details
                newItems.push({
                  type: 'product',
                  product: enhancedProduct._id,
                  productData: enhancedProduct,
                  quantity: 1,
                  unitPrice: enhancedProduct.price,
                  barcode: scannedCode,
                });
              }
              
              // Recalculate totals with new items
              return calculateTotals({
                ...prev,
                items: newItems
              });
            });
            
            showSuccess(`Product "${enhancedProduct.name}" added to cart`);
            setScannedCode("");
            setError("");
          } else {
            throw new Error('Product not found');
          }
        } catch (err) {
          showError(`Invalid or unknown barcode: ${scannedCode}`);
          setScannedCode("");
        }
      }
    } catch (error) {
      showError(`Error processing barcode: ${scannedCode}`);
      setScannedCode("");
    }
  };

  // Add Item (auto on scan) - only when NOT in barcode mode
  useEffect(() => {
    // Only auto-add when NOT in barcode mode
    if (!scannedCode || barcodeMode) return;
    
    addScannedItem();
    // Only run when scannedCode changes and not in barcode mode
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scannedCode, barcodeMode]);

  // Focus barcode input when barcode mode is enabled
  useEffect(() => {
    if (barcodeMode && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [barcodeMode]);

  const removeItem = (index) => {
    const item = formData.items[index];
    
    // If quantity is more than 1, show the delete confirmation modal
    if (item.quantity > 1) {
      setDeleteItemIndex(index);
      setDeleteQuantity(1); // Reset to 1
      setShowDeleteModal(true);
    } else {
      // For single quantity items, delete directly
      deleteItemCompletely(index);
    }
  };
  
  const deleteItemCompletely = (index) => {
    setFormData((prev) => {
      const newItems = prev.items.filter((_, i) => i !== index);
      return calculateTotals({
        ...prev,
        items: newItems
      });
    });
  };
  
  const handlePartialDelete = () => {
    if (deleteItemIndex === null) return;
    
    setFormData((prev) => {
      const newItems = [...prev.items];
      const item = newItems[deleteItemIndex];
      
      // If user wants to delete all or more than available
      if (deleteQuantity >= item.quantity) {
        // Remove the entire item
        newItems.splice(deleteItemIndex, 1);
      } else {
        // Reduce the quantity
        newItems[deleteItemIndex] = {
          ...item,
          quantity: item.quantity - deleteQuantity
        };
      }
      
      // Hide modal and reset state
      setShowDeleteModal(false);
      setDeleteItemIndex(null);
      
      return calculateTotals({
        ...prev,
        items: newItems
      });
    });
  };

  const calculateTotal = () => {
    return formData.items.reduce(
      (sum, item) => sum + item.unitPrice * (item.quantity || 1),
      0
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.buyer || formData.items.length === 0) {
      showError("Buyer and at least one item are required");
      return;
    }

    // Check for zero stock items before submitting using real-time calculations
    const stockIssues = [];
    const productQuantityMap = new Map();
    
    // Calculate total quantities needed for each product (including combo products)
    formData.items.forEach(item => {
      if (item.type === 'combo' && item.comboData?.products) {
        // For combos, add up all the individual product requirements
        item.comboData.products.forEach(comboProduct => {
          const productId = comboProduct.product?._id || comboProduct.product;
          const currentQuantity = productQuantityMap.get(productId) || 0;
          const neededQuantity = comboProduct.quantity * item.quantity;
          productQuantityMap.set(productId, currentQuantity + neededQuantity);
        });
      } else if (item.type === 'product' || !item.type) {
        // For regular products
        const productId = item.product;
        const currentQuantity = productQuantityMap.get(productId) || 0;
        productQuantityMap.set(productId, currentQuantity + item.quantity);
      }
    });
    
    // Check each product's real-time stock
    productQuantityMap.forEach((neededQuantity, productId) => {
      const product = products.find(p => p._id === productId);
      if (product) {
        if (neededQuantity > product.quantity) {
          stockIssues.push(`${product.name}: Need ${neededQuantity}, Available ${product.quantity}`);
        }
      }
    });

    if (stockIssues.length > 0) {
      showError(`Cannot complete sale due to insufficient stock:\n${stockIssues.join('\n')}`);
      return;
    }

    try {
      setLoading(true);
      
      // Create a properly formatted object for the API
      const formattedData = {
        ...formData,
        saleDate: convertToApiDate(formData.saleDate), // Convert date to proper format
        // Map items to the format expected by the API
        items: formData.items.map(item => {
          if (item.type === 'combo') {
            return {
              type: 'combo',
              combo: item.combo, // Send combo ID
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              barcode: item.barcode
            };
          } else if (item.type === 'rto-product') {
            return {
              type: 'rto-product',
              rtoProduct: item.rtoProduct, // Send RTO product ID
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              barcode: item.barcode
            };
          } else {
            return {
              type: 'product',
              product: item.product, // Send product ID
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              barcode: item.barcode
            };
          }
        })
      };
      
      await salesAPI.create(formattedData);
      showSuccess("Sale created successfully");
      fetchSales();
      handleCloseModal();
    } catch (error) {
      showError(error.response?.data?.message || "Failed to create sale");
      setTimeout(() => {
        setError("");
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (sale) => {
    try {
      setLoading(true);
      const response = await salesAPI.getById(sale._id);
      const saleData = response.data;
      
      console.log("Original sale data:", saleData);
      
      // Step 1: Fetch all products
      const productsResponse = await productsAPI.getAll();
      const allProducts = productsResponse.data || [];
      
      console.log("All products fetched:", allProducts.length);
      
      // If items don't have complete product details, enhance them
      if (saleData.items && saleData.items.length > 0) {
        console.log("Processing items:", saleData.items);
        
        const enhancedItems = await Promise.all(
          saleData.items.map(async (item, index) => {
            console.log(`Processing item ${index}:`, item);
            
            // Check if this is a combo item
            if (item.type === 'combo') {
              console.log(`Combo item detected:`, item);
              // For combo items, just return as-is since they should be properly populated by the backend
              return item;
            }
            
            // Handle regular product items
            let productData = item.product;
            
            // If product details are missing or incomplete and barcode exists
            if ((!productData || !productData.name) && item.barcode) {
              console.log(`Looking for product with barcode: ${item.barcode}`);
              
              // Step 2: Filter by barcode from all products
              const matchingProduct = allProducts.find(product => 
                product.barcode === item.barcode
              );
              
              if (matchingProduct) {
                console.log(`Found matching product:`, matchingProduct);
                // Step 3: Assign the values
                productData = matchingProduct;
              } else {
                console.log(`No matching product found, trying barcode API...`);
                // Try barcode API as fallback
                try {
                  const barcodeResponse = await barcodesAPI.getByBarcode(item.barcode);
                  console.log(`Barcode API response:`, barcodeResponse.data);
                  
                  if (barcodeResponse.data && barcodeResponse.data.product) {
                    productData = {
                      ...barcodeResponse.data.product,
                      price: barcodeResponse.data.price,
                      barcode: item.barcode
                    };
                    console.log(`Using barcode API data:`, productData);
                  }
                } catch (error) {
                  console.log(`Failed to fetch product details for barcode ${item.barcode}:`, error);
                  // Set default values if product not found
                  productData = {
                    name: 'Product Not Found',
                    category: 'N/A',
                    description: '',
                    barcode: item.barcode
                  };
                }
              }
            }
            
            const enhancedItem = {
              ...item,
              product: productData,
              barcode: item.barcode || productData?.barcode
            };
            
            console.log(`Enhanced item ${index}:`, enhancedItem);
            return enhancedItem;
          })
        );
        
        saleData.items = enhancedItems;
        console.log("Final enhanced sale data:", saleData);
      }
      
      setSelectedSale(saleData);
      setShowViewModal(true);
    } catch (error) {
      setError("Failed to fetch sale details");
      console.error("Error fetching sale details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoice = async (sale) => {
    try {
      setLoading(true);
      const response = await salesAPI.getById(sale._id);
      const saleData = response.data;
      
      // Step 1: Fetch all products
      const productsResponse = await productsAPI.getAll();
      const allProducts = productsResponse.data || [];
      
      // Enhance items with product details
      if (saleData.items && saleData.items.length > 0) {
        const enhancedItems = await Promise.all(
          saleData.items.map(async (item) => {
            // Check if this is a combo item
            if (item.type === 'combo') {
              // For combo items, just return as-is since they should be properly populated by the backend
              return item;
            }
            
            // Handle regular product items
            let productData = item.product;
            
            // If product details are missing or incomplete and barcode exists
            if ((!productData || !productData.name) && item.barcode) {
              // Step 2: Filter by barcode from all products
              const matchingProduct = allProducts.find(product => 
                product.barcode === item.barcode
              );
              
              if (matchingProduct) {
                // Step 3: Assign the values
                productData = matchingProduct;
              } else {
                // Try barcode API as fallback
                try {
                  const barcodeResponse = await barcodesAPI.getByBarcode(item.barcode);
                  if (barcodeResponse.data && barcodeResponse.data.product) {
                    productData = {
                      ...barcodeResponse.data.product,
                      price: barcodeResponse.data.price,
                      barcode: item.barcode
                    };
                  }
                } catch (error) {
                  console.log(`Failed to fetch product details for barcode ${item.barcode}`);
                  productData = {
                    name: 'Product Not Found',
                    category: 'N/A',
                    description: '',
                    barcode: item.barcode
                  };
                }
              }
            }
            
            return {
              ...item,
              product: productData,
              barcode: item.barcode || productData?.barcode
            };
          })
        );
        saleData.items = enhancedItems;
      }
      
      setInvoiceData(saleData);
      setShowInvoiceModal(true);
    } catch (error) {
      setError("Failed to generate invoice");
      console.error("Error generating invoice:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintInvoice = () => {
    // Ensure logo image is loaded before printing
    const logoImg = document.querySelector('.company-logo-img');
    if (logoImg && !logoImg.complete) {
      logoImg.onload = () => {
        setTimeout(() => {
          window.print();
        }, 500);
      };
    } else {
      // Add a delay to ensure styles are applied
      setTimeout(() => {
        window.print();
      }, 500);
    }
  };

  if (loading && sales.length === 0) {
    return (
      <Container className="d-flex justify-content-center align-items-center">
        <LoadingSpinner animation="border" />
      </Container>
    );
  }

  return (
    <Container>
      <PrintStyles />
      <AnimatedContainer>
        <HeaderSection>
          <Row className="">
            <Col>
              <h4 className="mb-0 d-flex align-items-center">
                <IconWrapper style={{ fontSize: "1.3rem", marginRight: "0.6rem" }}>🛒</IconWrapper>
                Sales Management
              </h4>
            </Col>
            <Col xs="auto">
              <PrimaryButton
                onClick={handleShowModal}
                style={{
                  padding: "6px 14px",
                  fontSize: "0.9rem",
                  borderRadius: "6px"
                }}
              >
                + New Sale
              </PrimaryButton>
            </Col>
          </Row>
        </HeaderSection>

        {/* Toast Notifications */}
        <StyledToastContainer position="top-end">
          {toasts.map(toast => (
            <Toast 
              key={toast.id}
              show={toast.show}
              onClose={() => removeToast(toast.id)}
              bg={toast.variant}
              text={toast.variant === 'warning' ? 'dark' : 'white'}
            >
              <Toast.Header>
                <strong className="me-auto">{toast.title}</strong>
              </Toast.Header>
              <Toast.Body>{toast.message}</Toast.Body>
            </Toast>
          ))}
        </StyledToastContainer>

        <StyledTable responsive hover>
          <thead>
            <tr>
              <th>ID</th>
              <th>Buyer</th>
              <th>Items</th>
              <th>Date</th>
              <th>Total</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <TableRow key={sale._id}>
                <td><strong>{sale.saleId}</strong></td>
                <td>
                  <div>
                    <strong>{sale.buyer?.name || 'N/A'}</strong>
                    {sale.buyer?.phone && (
                      <div><small className="text-muted">{String(sale.buyer.phone)}</small></div>
                    )}
                  </div>
                </td>
                <td>
                  <Badge bg="info">{sale.items?.length || 0} items</Badge>
                </td>
                <td>{formatDate(sale.saleDate)}</td>
                <td><strong>₹{sale.totalAmount?.toFixed(2) || '0.00'}</strong></td>
                <td>
                  <SecondaryButton 
                    size="sm" 
                    className="me-2" 
                    onClick={() => handleView(sale)}
                    disabled={loading}
                  >
                    👁️ View
                  </SecondaryButton>
                  <SuccessButton 
                    size="sm"
                    className="me-2"
                    onClick={() => handleGenerateInvoice(sale)}
                    disabled={loading}
                  >
                    📄 Invoice
                  </SuccessButton>
                  <PrimaryButton
                    size="sm"
                    className="me-2"
                    onClick={() => requestEditSale(sale)}
                    disabled={loading}
                  >
                    ✏️ Edit
                  </PrimaryButton>
        {/* Edit Sale Password Confirmation Modal */}
        <StyledModal show={showEditConfirmModal} onHide={() => setShowEditConfirmModal(false)} size="sm" centered>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Edit</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>To edit this sale, please enter the admin password:</p>
            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                value={editPassword}
                onChange={e => setEditPassword(e.target.value)}
                placeholder="Enter password"
                autoFocus
              />
              {editPasswordError && (
                <Alert variant="danger" className="mt-2">{editPasswordError}</Alert>
              )}
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <SecondaryButton onClick={() => setShowEditConfirmModal(false)}>Cancel</SecondaryButton>
            <PrimaryButton onClick={confirmEditSale}>Edit</PrimaryButton>
          </Modal.Footer>
        </StyledModal>
                  <DangerButton
                    size="sm"
                    onClick={() => requestDeleteSale(sale._id)}
                    disabled={loading}
                  >
                    🗑️ Delete
                  </DangerButton>
        {/* Delete Sale Password Confirmation Modal */}
        <StyledModal show={showDeleteConfirmModal} onHide={() => setShowDeleteConfirmModal(false)} size="sm" centered>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Delete</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>To delete this sale, please enter the admin password:</p>
            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                value={deletePassword}
                onChange={e => setDeletePassword(e.target.value)}
                placeholder="Enter password"
                autoFocus
              />
              {deletePasswordError && (
                <Alert variant="danger" className="mt-2">{deletePasswordError}</Alert>
              )}
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <SecondaryButton onClick={() => setShowDeleteConfirmModal(false)}>Cancel</SecondaryButton>
            <DangerButton onClick={confirmDeleteSale}>Delete</DangerButton>
          </Modal.Footer>
        </StyledModal>
                </td>
              </TableRow>
            ))}
          </tbody>
        </StyledTable>
        {/* Edit Sale Modal */}
        <StyledModal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>Edit Sale</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {editSaleData && (
              <SaleForm
                initialData={editSaleData}
                buyers={buyers}
                products={products}
                loading={loading}
                onSubmit={handleEditSubmit}
                onCancel={() => setShowEditModal(false)}
              />
            )}
          </Modal.Body>
        </StyledModal>

        {/* New Sale Modal */}
        <StyledModal show={showModal} onHide={handleCloseModal} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>Create New Sale</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit}>
            <Modal.Body className="pb-0">
              <Row>
                <Col md={6}>
                  <FormGroup className="mb-3">
                    <Form.Label>Buyer</Form.Label>
                    <Form.Select
                      name="buyer"
                      value={formData.buyer}
                      onChange={(e) => handleInputChange("buyer", e.target.value)}
                      required
                    >
                      <option value="">Select Buyer</option>
                      {buyers.map((buyer) => (
                        <option key={buyer._id} value={buyer._id}>
                          {buyer.name}
                        </option>
                      ))}
                    </Form.Select>
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup className="mb-3">
                    <Form.Label>Sale Date</Form.Label>
                    <Form.Control
                      type="date"
                      name="saleDate"
                      value={formData.saleDate}
                      onChange={(e) => handleInputChange("saleDate", e.target.value)}
                      required
                    />
                  </FormGroup>
                </Col>
              </Row>

              <div className="mb-3">
                <h5 className="mb-2">Scan Items</h5>

                <ScannerStatus $active={scannerActive} className="mb-2">
                  {scannerActive ? '🟢 Scanner Active' : '🔴 Scanner Inactive'}
                </ScannerStatus>
                
                <ScannerContainer ref={scannerRef} style={{marginBottom: '0.5rem'}} />

                <div className="d-flex gap-2 mb-2">
                  <ScannerButton
                    $active={scannerActive}
                    onClick={scannerActive ? stopScanner : startScanner}
                  >
                    {scannerActive ? '⏹️' : '📷'}
                    {scannerActive ? 'Stop Scanner' : 'Start Scanner'}
                  </ScannerButton>
                </div>

                {/* Barcode Input */}
                <FormGroup className="mb-3">
                  <Form.Label>Scanned Barcode</Form.Label>
                  <div className="d-flex gap-2">
                    <Form.Control
                      ref={barcodeInputRef}
                      type="text"
                      value={scannedCode}
                      onChange={(e) => setScannedCode(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault(); // Prevent form submission
                          if (barcodeMode && scannedCode.trim()) {
                            addBarcodeManually();
                          }
                        }
                      }}
                      placeholder={barcodeMode ? "Barcode mode active - scan or enter barcode" : "Enter barcode manually"}
                      disabled={!barcodeMode}
                    />
                    <SecondaryButton 
                      onClick={toggleBarcodeMode}
                      variant={barcodeMode ? "success" : "outline-primary"}
                    >
                      {barcodeMode ? '✓ Barcode Active' : '📊 Enable Barcode'}
                    </SecondaryButton>
                    {barcodeMode && scannedCode && (
                      <PrimaryButton 
                        onClick={addBarcodeManually}
                        variant="primary"
                      >
                        ➕ Add Item
                      </PrimaryButton>
                    )}
                  </div>
                  {barcodeMode && (
                    <small className="text-muted mt-1 d-block">
                      📍 Barcode mode is active. Scan barcode or press Enter to add items automatically.
                    </small>
                  )}
                </FormGroup>
              </div>

              <h6 className="mb-2">Scanned Items ({formData.items.length})</h6>
              
              <Table bordered responsive className="mb-3">
                <thead className="bg-light">
                  <tr>
                    <th>S.No</th>
                    <th>Barcode</th>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th>Price (₹)</th>
                    <th>Qty</th>
                    <th>Total (₹)</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => {
                    const isCombo = item.type === 'combo';
                    const isRTO = item.type === 'rto-product';
                    const itemData = isCombo ? item.comboData : isRTO ? item.rtoProductData : item.productData;
                    const itemName = isRTO ? itemData?.productName : itemData?.name || 'N/A';
                    const itemDescription = itemData?.description || '';
                    const itemCategory = isCombo ? 'Combo Package' : isRTO ? `RTO (${itemData?.category})` : (itemData?.category || 'Unknown');
                    const lowStock = !isCombo && !isRTO && itemData?.currentStock <= itemData?.minStock;
                    
                    return (
                      <tr key={index} className={lowStock ? 'table-warning' : ''}>
                        <td>{index + 1}</td>
                        <td>
                          <BarcodeBadge bg={isCombo ? 'success' : 'info'}>
                            {item.barcode}
                          </BarcodeBadge>
                        </td>
                        <td>
                          <div style={{ fontWeight: 'bold' }}>
                            {isCombo && <span className="badge bg-success me-1">COMBO</span>}
                            {isRTO && <span className="badge bg-warning me-1">RTO</span>}
                            {String(itemName || '')}
                          </div>
                          {itemDescription && (
                            <small className="text-muted">
                              {String(itemDescription).substring(0, 30)}
                              {String(itemDescription).length > 30 ? '...' : ''}
                            </small>
                          )}
                          {isCombo && item.comboData?.products && (
                            <div className="mt-1">
                              <small className="text-info">
                                Contains: {item.comboData.products.map(p => `${p.product?.name || 'Product'} (${p.quantity})`).join(', ')}
                              </small>
                            </div>
                          )}
                        </td>
                        <td>{String(itemCategory || '')}</td>
                        <td>{item.unitPrice.toFixed(2)}</td>
                        <td>{item.quantity}</td>
                        <td>{(item.unitPrice * item.quantity).toFixed(2)}</td>
                        <td>
                          <DangerButton variant="outline-danger" size="sm" onClick={() => removeItem(index)}>
                            Remove
                          </DangerButton>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="6" className="text-end"><strong>Subtotal:</strong></td>
                    <td><strong>₹{formData.subtotal.toFixed(2)}</strong></td>
                    <td></td>
                  </tr>
                </tfoot>
              </Table>

              {/* Totals Section */}
              <div className="mb-3">
                <h5 className="mb-2">Order Summary</h5>
                <Row className="g-2">
                  <Col md={3}>
                    <div className="total-item p-2 border rounded">
                      <Form.Label className="mb-1 small">Discount (%)</Form.Label>
                      <div className="d-flex align-items-center">
                        <Form.Control
                          type="number"
                          className="me-2"
                          size="sm"
                          style={{width: '60px'}}
                          value={formData.discount}
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            // Ensure discount is between 0 and 100
                            handleInputChange("discount", isNaN(value) ? 0 : Math.min(100, Math.max(0, value)));
                          }}
                        />
                        <span style={{color: "#28a745", fontSize: "0.9rem"}}>
                          -₹{formData.discountAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="total-item p-2 border rounded">
                      <Form.Label className="mb-1 small">Tax (%)</Form.Label>
                      <div className="d-flex align-items-center">
                        <Form.Control
                          type="number"
                          className="me-2"
                          size="sm"
                          style={{width: '60px'}}
                          value={formData.tax}
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            handleInputChange("tax", isNaN(value) ? 0 : value);
                          }}
                        />
                        <span style={{color: "#007bff", fontSize: "0.9rem"}}>
                          +₹{formData.taxAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="total-item p-2 border rounded">
                      <Form.Label className="mb-1 small">Shipping</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        size="sm"
                        value={formData.shipping}
                        onChange={(e) => {
                          handleInputChange("shipping", Number.parseFloat(e.target.value) || 0);
                        }}
                      />
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="total-item p-2 border rounded">
                      <Form.Label className="mb-1 small">Other</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        size="sm"
                        value={formData.other}
                        onChange={(e) => {
                          handleInputChange("other", Number.parseFloat(e.target.value) || 0);
                        }}
                      />
                    </div>
                  </Col>
                </Row>
                
                <div className="total-final mt-3 p-2 bg-primary text-white rounded text-center">
                  <h5 className="mb-0">Final Total: ₹{formData.total.toFixed(2)}</h5>
                </div>
              </div>

              {/* Comments Section */}
              <div className="mb-3">
                <h5 className="mb-2">Comments</h5>
                <Form.Control
                  as="textarea"
                  placeholder="Comments or Special Instructions"
                  value={formData.comments}
                  onChange={(e) => handleInputChange("comments", e.target.value)}
                  rows={3}
                />
              </div>
            </Modal.Body>
            <Modal.Footer>
              <SecondaryButton onClick={handleCloseModal}>
                Cancel
              </SecondaryButton>
              <PrimaryButton type="submit" disabled={loading}>
                {loading ? <LoadingSpinner size="sm" /> : 'Create Sale'}
              </PrimaryButton>
            </Modal.Footer>
          </Form>
        </StyledModal>

        {/* Delete Item Confirmation Modal */}
        <StyledModal 
          show={showDeleteModal} 
          onHide={() => setShowDeleteModal(false)} 
          size="sm" 
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Remove Item</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {deleteItemIndex !== null && (
              <>
                <p>This item has a quantity of <strong>{formData.items[deleteItemIndex]?.quantity}</strong>.</p>
                <p>How many units would you like to remove?</p>
                <Form.Group className="mb-3">
                  <Form.Label>Quantity to remove:</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max={formData.items[deleteItemIndex]?.quantity || 1}
                    value={deleteQuantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val) && val > 0 && val <= formData.items[deleteItemIndex]?.quantity) {
                        setDeleteQuantity(val);
                      }
                    }}
                  />
                </Form.Group>
                <div className="d-flex justify-content-between">
                  <SecondaryButton onClick={() => setShowDeleteModal(false)}>
                    Cancel
                  </SecondaryButton>
                  <DangerButton onClick={handlePartialDelete}>
                    Remove
                  </DangerButton>
                </div>
              </>
            )}
          </Modal.Body>
        </StyledModal>

        {/* View Sale Modal */}
        <StyledModal
          show={showViewModal}
          onHide={() => setShowViewModal(false)}
          size="lg"
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Sale Details</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedSale && (
              <>
                <Row>
                  <Col md={6}>
                    <h6>Sale Information</h6>
                    <p><strong>ID:</strong> {selectedSale.saleId}</p>
                    <p><strong>Date:</strong> {formatDate(selectedSale.saleDate)}</p>
                    <p><strong>Time:</strong> {selectedSale.createdAt ? new Date(selectedSale.createdAt).toLocaleTimeString('en-GB') : new Date(selectedSale.saleDate).toLocaleTimeString('en-GB')}</p>
                    <p><strong>Status:</strong> <Badge bg="success">{selectedSale.status || 'completed'}</Badge></p>
                  </Col>
                  <Col md={6}>
                    <h6>Buyer Details</h6>
                    <p><strong>Name:</strong> {selectedSale.buyer?.name || 'N/A'}</p>
                    <p><strong>Email:</strong> {selectedSale.buyer?.email || 'N/A'}</p>
                    <p><strong>Phone:</strong> {selectedSale.buyer?.phone || 'N/A'}</p>
                    {selectedSale.buyer?.address && (
                      <p><strong>Address:</strong> {selectedSale.buyer.address}</p>
                    )}
                  </Col>
                </Row>

                <h6 className="mt-4">Items ({selectedSale.items?.length || 0})</h6>
                <Table striped bordered responsive>
                  <thead style={{ background: '#3498db' }}>
                    <tr>
                      <th>S.No</th>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Barcode</th>
                      <th>Price</th>
                      <th>Quantity</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedSale.items || []).map((item, idx) => {
                      const isCombo = item.type === 'combo';
                      
                      let itemName, itemCategory, itemDescription, unitPrice, barcode;
                      
                      if (isCombo) {
                        // Handle combo items
                        const combo = item.combo || {};
                        itemName = item.comboName || combo.name || 'Combo Not Found';
                        itemCategory = 'Combo Package';
                        itemDescription = combo.description || '';
                        unitPrice = item.unitPrice || combo.price || 0;
                        barcode = item.barcode || combo.barcode || 'N/A';
                      } else {
                        // Handle regular product items
                        const product = item.product || {};
                        itemName = product.name || item.productData?.name || 'Product Not Found';
                        itemCategory = product.category || item.productData?.category || 'N/A';
                        itemDescription = product.description || item.productData?.description || '';
                        unitPrice = item.unitPrice || product.price || item.productData?.price || 0;
                        barcode = item.barcode || product.barcode || 'N/A';
                      }
                      
                      const quantity = item.quantity || 1;
                      const itemTotal = unitPrice * quantity;
                      
                      return (
                        <tr key={item._id || idx}>
                          <td>{idx + 1}</td>
                          <td>
                            <div>
                              {isCombo && <Badge bg="success" className="me-2">COMBO</Badge>}
                              {isCombo ? (
                                <OverlayTrigger
                                  trigger={['hover', 'focus']}
                                  placement="right"
                                  overlay={
                                    <Popover id={`combo-popover-${idx}`} style={{ maxWidth: '400px' }}>
                                      <Popover.Header as="h3" className="bg-success text-white">
                                        <strong>📦 Combo Products</strong>
                                      </Popover.Header>
                                      <Popover.Body>
                                        {item.combo?.products && item.combo.products.length > 0 ? (
                                          <div>
                                            <div className="mb-2">
                                              <small className="text-muted">
                                                <strong>Combo:</strong> {itemName}
                                              </small>
                                            </div>
                                            <Table size="sm" className="mb-0">
                                              <thead>
                                                <tr>
                                                  <th>Product</th>
                                                  <th>Qty</th>
                                                  <th>Price</th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {item.combo.products.map((comboProduct, cpIdx) => (
                                                  <tr key={cpIdx}>
                                                    <td>
                                                      <small>
                                                        <strong>{comboProduct.product?.name || 'N/A'}</strong>
                                                        <br />
                                                        <span className="text-muted">
                                                          {comboProduct.product?.barcode || 'No barcode'}
                                                        </span>
                                                      </small>
                                                    </td>
                                                    <td>
                                                      <Badge bg="secondary">
                                                        {comboProduct.quantity || 1}
                                                      </Badge>
                                                    </td>
                                                    <td>
                                                      <small>
                                                        ₹{(comboProduct.product?.price || 0).toFixed(2)}
                                                      </small>
                                                    </td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                              <tfoot>
                                                <tr className="table-light">
                                                  <td colSpan="2"><strong>Total Value</strong></td>
                                                  <td>
                                                    <strong>
                                                      ₹{item.combo.products.reduce((total, cp) => 
                                                        total + ((cp.product?.price || 0) * (cp.quantity || 1)), 0
                                                      ).toFixed(2)}
                                                    </strong>
                                                  </td>
                                                </tr>
                                              </tfoot>
                                            </Table>
                                          </div>
                                        ) : (
                                          <span className="text-muted">No products found in this combo</span>
                                        )}
                                      </Popover.Body>
                                    </Popover>
                                  }
                                >
                                  <span 
                                    className="combo-hover-item"
                                    style={{ 
                                      cursor: 'help', 
                                      textDecoration: 'underline dotted',
                                      color: '#198754',
                                      fontWeight: 'bold',
                                      position: 'relative'
                                    }}
                                    title="Hover to see combo products"
                                  >
                                    {itemName}
                                    <small className="ms-1" style={{ fontSize: '0.7rem' }}>
                                      ℹ️
                                    </small>
                                  </span>
                                </OverlayTrigger>
                              ) : (
                                <strong>{itemName}</strong>
                              )}
                              {itemDescription && (
                                <div>
                                  <small className="text-muted">
                                    {itemDescription.length > 50 
                                      ? `${itemDescription.substring(0, 50)}...` 
                                      : itemDescription}
                                  </small>
                                </div>
                              )}
                            </div>
                          </td>
                          <td>{String(itemCategory || '')}</td>
                          <td>
                            <BarcodeBadge bg={isCombo ? 'success' : 'info'}>
                              {String(barcode || '')}
                            </BarcodeBadge>
                          </td>
                          <td>₹{unitPrice.toFixed(2)}</td>
                          <td>{quantity}</td>
                          <td>₹{itemTotal.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="6" className="text-end"><strong>Subtotal:</strong></td>
                      <td><strong>₹{selectedSale.subtotal?.toFixed(2) || selectedSale.subtotalAmount?.toFixed(2) || selectedSale.totalAmount?.toFixed(2) || '0.00'}</strong></td>
                    </tr>
                  </tfoot>
                </Table>
                
                <Row className="mt-3">
                  <Col md={3}>
                    <div className="p-2 border rounded text-center">
                      <small>Discount</small>
                      <p className="mb-0 text-success">-₹{selectedSale.discountAmount?.toFixed(2) || selectedSale.discount?.toFixed(2) || "0.00"}</p>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="p-2 border rounded text-center">
                      <small>Tax</small>
                      <p className="mb-0 text-primary">+₹{selectedSale.taxAmount?.toFixed(2) || selectedSale.tax?.toFixed(2) || "0.00"}</p>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="p-2 border rounded text-center">
                      <small>Shipping</small>
                      <p className="mb-0">₹{selectedSale.shippingAmount?.toFixed(2) || selectedSale.shipping?.toFixed(2) || "0.00"}</p>
                    </div>
                  </Col>
                  <Col md={3}>
                    <div className="p-2 border rounded text-center">
                      <small>Other</small>
                      <p className="mb-0">₹{selectedSale.otherAmount?.toFixed(2) || selectedSale.other?.toFixed(2) || "0.00"}</p>
                    </div>
                  </Col>
                </Row>
                
                <TotalDisplay className="mt-4">Total: ₹{selectedSale.totalAmount?.toFixed(2) || '0.00'}</TotalDisplay>
                
                {selectedSale.comments && (
                  <div className="mt-3">
                    <h6>Comments</h6>
                    <div className="p-3 bg-light rounded">
                      <p className="mb-0">{selectedSale.comments}</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </Modal.Body>
        </StyledModal>

        {/* Invoice Modal */}
        <StyledModal
          show={showInvoiceModal}
          onHide={() => setShowInvoiceModal(false)}
          size="xl"
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Invoice</Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-0">
            {invoiceData && (
              <InvoiceContainer>
                <InvoiceHeader>
                  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', width: '100%'}}>
                    <img 
                      src="/logo_vp.jpeg" 
                      alt="Velpaari Enterprises Logo" 
                      style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid #2980b9'
                      }}
                      onError={(e) => {
                        console.log('Logo failed to load');
                        e.target.style.display='none';
                      }}
                      onLoad={(e) => {
                        console.log('Logo loaded successfully');
                      }}
                      crossOrigin="anonymous"
                    />
                    <div style={{textAlign: 'center', flex: '1'}}>
                      <div style={{color: '#3498db', fontSize: '28px', fontWeight: 'bold', margin: '0', lineHeight: '1.2'}}>
                        VELPAARI ENTERPRISES
                      </div>
                      <div style={{color: '#666', fontSize: '16px', margin: '5px 0 0 0', fontWeight: 'normal'}}>
                        Sales Invoice
                      </div>
                    </div>
                  </div>
                </InvoiceHeader>

                <InvoiceDetails>
                  <InvoiceSection>
                    <h3>Invoice Information</h3>
                    <p><strong>Invoice ID:</strong> {invoiceData.saleId}</p>
                    <p><strong>Date:</strong> {formatDate(invoiceData.saleDate)}</p>
                    <p><strong>Time:</strong> {invoiceData.createdAt ? new Date(invoiceData.createdAt).toLocaleTimeString('en-GB') : new Date().toLocaleTimeString('en-GB')}</p>
                  </InvoiceSection>

                  <InvoiceSection>
                    <h3>Customer Details</h3>
                    <p><strong>Customer:</strong> {invoiceData.buyer?.name || 'N/A'}</p>
                    <p><strong>Contact:</strong> {invoiceData.buyer?.phone || 'N/A'}</p>
                    <p><strong>Email:</strong> {invoiceData.buyer?.email || 'N/A'}</p>
                    {invoiceData.buyer?.address && (
                      <p><strong>Address:</strong> {invoiceData.buyer.address}</p>
                    )}
                  </InvoiceSection>
                </InvoiceDetails>

                <InvoiceTable>
                  <thead>
                    <tr>
                      <th>S.No</th>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Barcode</th>
                      <th>Price (₹)</th>
                      <th>Quantity</th>
                      <th>Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(invoiceData.items || []).map((item, idx) => {
                      const isCombo = item.type === 'combo';
                      
                      let itemName, itemCategory, unitPrice, barcode;
                      
                      if (isCombo) {
                        // Handle combo items
                        const combo = item.combo || {};
                        itemName = item.comboName || combo.name || 'Combo Not Found';
                        itemCategory = 'Combo Package';
                        unitPrice = item.unitPrice || combo.price || 0;
                        barcode = item.barcode || combo.barcode || 'N/A';
                      } else {
                        // Handle regular product items
                        const product = item.product || {};
                        itemName = product.name || item.productData?.name || 'Product Not Found';
                        itemCategory = product.category || item.productData?.category || 'N/A';
                        unitPrice = item.unitPrice || product.price || item.productData?.price || 0;
                        barcode = item.barcode || product.barcode || 'N/A';
                      }
                      
                      const quantity = item.quantity || 1;
                      const itemTotal = unitPrice * quantity;
                      
                      return (
                        <tr key={item._id || idx}>
                          <td>{idx + 1}</td>
                          <td>
                            {isCombo ? (
                              <OverlayTrigger
                                trigger={['hover', 'focus']}
                                placement="right"
                                overlay={
                                  <Popover id={`invoice-combo-popover-${idx}`} style={{ maxWidth: '350px' }}>
                                    <Popover.Header as="h3" className="bg-success text-white">
                                      <strong>📦 Combo Breakdown</strong>
                                    </Popover.Header>
                                    <Popover.Body>
                                      {item.combo?.products && item.combo.products.length > 0 ? (
                                        <div>
                                          <div className="mb-2">
                                            <small className="text-muted">
                                              <strong>Combo:</strong> {itemName}
                                            </small>
                                          </div>
                                          {item.combo.products.map((comboProduct, cpIdx) => (
                                            <div key={cpIdx} className="mb-2 pb-2" style={{borderBottom: cpIdx < item.combo.products.length - 1 ? '1px solid #dee2e6' : 'none'}}>
                                              <div>
                                                <strong>{comboProduct.product?.name || 'N/A'}</strong>
                                              </div>
                                              <div className="d-flex justify-content-between">
                                                <small className="text-muted">
                                                  Quantity: <Badge bg="secondary">{comboProduct.quantity || 1}</Badge>
                                                </small>
                                                <small className="text-muted">
                                                  ₹{(comboProduct.product?.price || 0).toFixed(2)}
                                                </small>
                                              </div>
                                            </div>
                                          ))}
                                          <div className="mt-2 pt-2 border-top">
                                            <div className="d-flex justify-content-between">
                                              <strong>Total Value:</strong>
                                              <strong className="text-success">
                                                ₹{item.combo.products.reduce((total, cp) => 
                                                  total + ((cp.product?.price || 0) * (cp.quantity || 1)), 0
                                                ).toFixed(2)}
                                              </strong>
                                            </div>
                                          </div>
                                        </div>
                                      ) : (
                                        <span className="text-muted">No products found</span>
                                      )}
                                    </Popover.Body>
                                  </Popover>
                                }
                              >
                                <span 
                                  style={{ 
                                    cursor: 'help', 
                                    textDecoration: 'underline dotted',
                                    color: '#198754'
                                  }}
                                  title="Hover to see combo products"
                                >
                                  [COMBO] {itemName} ℹ️
                                </span>
                              </OverlayTrigger>
                            ) : (
                              itemName
                            )}
                          </td>
                          <td>{String(itemCategory || '')}</td>
                          <td>{String(barcode || '')}</td>
                          <td>₹{unitPrice.toFixed(2)}</td>
                          <td>{quantity}</td>
                          <td>₹{itemTotal.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </InvoiceTable>

                <InvoiceSummary>
                  <div></div>
                  <SummaryTable>
                    <tbody>
                      <tr>
                        <td>Subtotal:</td>
                        <td>₹{invoiceData.subtotal?.toFixed(2) || invoiceData.subtotalAmount?.toFixed(2) || '0.00'}</td>
                      </tr>
                      <tr>
                        <td>Discount ({invoiceData.discount || 0}%):</td>
                        <td>-₹{invoiceData.discountAmount?.toFixed(2) || '0.00'}</td>
                      </tr>
                      <tr>
                        <td>Tax ({invoiceData.tax || 0}%):</td>
                        <td>+₹{invoiceData.taxAmount?.toFixed(2) || '0.00'}</td>
                      </tr>
                      <tr>
                        <td>Shipping:</td>
                        <td>₹{invoiceData.shipping?.toFixed(2) || '0.00'}</td>
                      </tr>
                      <tr>
                        <td>Others:</td>
                        <td>₹{invoiceData.other?.toFixed(2) || '0.00'}</td>
                      </tr>
                      <tr>
                        <td><strong>Grand Total:</strong></td>
                        <td><strong>₹{invoiceData.totalAmount?.toFixed(2) || '0.00'}</strong></td>
                      </tr>
                    </tbody>
                  </SummaryTable>
                </InvoiceSummary>

                {invoiceData.comments && (
                  <div style={{ marginTop: '2rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
                    <h4 style={{ color: '#3498db', marginBottom: '1rem' }}>Comments</h4>
                    <p style={{ margin: 0 }}>{invoiceData.comments}</p>
                  </div>
                )}

                <InvoiceFooter>
                  <p><strong>Thank you for purchasing!</strong></p>
                  <p>Generated on {formatDate(new Date())} at {new Date().toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                  })}</p>
                </InvoiceFooter>
              </InvoiceContainer>
            )}
          </Modal.Body>
          <Modal.Footer className="d-print-none">
            <SecondaryButton onClick={() => setShowInvoiceModal(false)}>
              Close
            </SecondaryButton>
            <PrintButton onClick={handlePrintInvoice}>
              🖨️ Print Invoice
            </PrintButton>
          </Modal.Footer>
        </StyledModal>
      </AnimatedContainer>
    </Container>
  );
};

export default Sales;
