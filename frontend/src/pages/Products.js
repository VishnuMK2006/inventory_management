import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { productsAPI, vendorsAPI, returnsAPI, categoriesAPI, barcodesAPI } from '../services/api';
import Quagga from 'quagga';

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

const zoomIn = keyframes`
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
  
  @media (max-width: 576px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const PageTitle = styled.h2`
  color: #2c3e50;
  margin: 0;
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
    background: linear-gradient(to right, #3498db);
    border-radius: 2px;
  }
`;

const ActionButton = styled.button`
  background: linear-gradient(to right, #3498db);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.8rem 1.5rem;
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
  
  &:active {
    transform: translateY(0);
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
  
  ${props => props.variant === 'success' && css`
    background: rgba(46, 204, 113, 0.15);
    color: #27ae60;
    border-left: 4px solid #27ae60;
  `}
  
  ${props => props.variant === 'danger' && css`
    background: rgba(231, 76, 60, 0.15);
    color: #e74c3c;
    border-left: 4px solid #e74c3c;
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

const TableContainer = styled.div`
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 5px 25px rgba(0, 0, 0, 0.1);
  animation: ${fadeIn} 0.6s ease-out;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  thead {
    background: linear-gradient(to right, #3498db);
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
  
  /* Make S.No column narrower */
  th:first-child, td:first-child {
    width: 60px;
    text-align: center;
  }
  
  @media (max-width: 1200px) {
    th:nth-child(5),
    td:nth-child(5) {
      display: none;
    }
  }
  
  @media (max-width: 992px) {
    th:nth-child(4),
    td:nth-child(4) {
      display: none;
    }
  }
  
  @media (max-width: 768px) {
    th:nth-child(7),
    td:nth-child(7) {
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

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: ${fadeIn} 0.3s ease-out;
  padding: 1rem;
`;

const ModalContainer = styled.div`
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  animation: ${slideIn} 0.3s ease-out;
`;

const ModalHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #f1f2f6;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ModalTitle = styled.h3`
  margin: 0;
  color: #2c3e50;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #7f8c8d;
  padding: 0.2rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    color: #e74c3c;
    background: rgba(231, 76, 60, 0.1);
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #2c3e50;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.8rem 1rem;
  border: 2px solid #f1f2f6;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.8rem 1rem;
  border: 2px solid #f1f2f6;
  border-radius: 8px;
  font-size: 1rem;
  resize: vertical;
  min-height: 80px;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.8rem 1rem;
  border: 2px solid #f1f2f6;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
  }
`;

const ModalFooter = styled.div`
  padding: 1.5rem;
  border-top: 1px solid #f1f2f6;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
`;

const SecondaryButton = styled.button`
  background: #f1f2f6;
  color: #7f8c8d;
  border: none;
  border-radius: 8px;
  padding: 0.8rem 1.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: #e4e6eb;
    transform: translateY(-2px);
  }
`;

const PrimaryButton = styled.button`
  background: linear-gradient(to right, #3498db);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.8rem 1.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(52, 152, 219, 0.4);
    animation: ${pulse} 1s;
  }
`;

const ImagePreview = styled.div`
  margin-top: 0.5rem;
  img {
    max-width: 100%;
    max-height: 200px;
    border-radius: 8px;
    border: 2px solid #f1f2f6;
  }
`;

const RemoveImageButton = styled.button`
  margin-top: 0.5rem;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.3rem 0.8rem;
  cursor: pointer;
  font-size: 0.8rem;
  
  &:hover {
    background: #c0392b;
  }
`;

const DownloadButton = styled.a`
  background: rgba(46, 204, 113, 0.1);
  color: #27ae60;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(46, 204, 113, 0.2);
    transform: translateY(-2px);
  }
`;

// Image Preview Modal Styles
const ImagePreviewModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: ${fadeIn} 0.3s ease-out;
`;

const ImagePreviewContainer = styled.div`
  max-width: 90vw;
  max-height: 90vh;
  animation: ${zoomIn} 0.3s ease-out;
`;

const PreviewImage = styled.img`
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
`;

const ClosePreviewButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.1);
  }
`;

// Custom checkbox styling
const Checkbox = styled.input.attrs({ type: 'checkbox' })`
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #3498db;
  position: relative;
  border-radius: 4px;
  
  &:checked {
    background-color: #3498db;
  }
  
  &:hover {
    transform: scale(1.1);
  }
`;

// Batch actions styling
const BatchActionsContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  background: rgba(52, 152, 219, 0.1);
  padding: 1rem;
  border-radius: 8px;
  align-items: center;
  animation: ${slideIn} 0.3s ease-out;
`;

const BatchActionButton = styled(ActionButton)`
  ${props => props.variant === 'download' && css`
    background: linear-gradient(to right, #27ae60, #2ecc71);
    box-shadow: 0 4px 15px rgba(39, 174, 96, 0.3);
    
    &:hover {
      box-shadow: 0 6px 20px rgba(39, 174, 96, 0.4);
    }
  `}
  
  ${props => props.variant === 'delete' && css`
    background: linear-gradient(to right, #e74c3c, #c0392b);
    box-shadow: 0 4px 15px rgba(231, 76, 60, 0.3);
    
    &:hover {
      box-shadow: 0 6px 20px rgba(231, 76, 60, 0.4);
    }
  `}
`;

const SelectionCounter = styled.span`
  color: #2c3e50;
  font-weight: 500;
  animation: ${pulse} 1s;
`;

// Barcode search input styling
const BarcodeSearchContainer = styled.div`
  position: relative;
  min-width: 250px;
`;

const BarcodeSearchInput = styled(Input)`
  padding-left: 2.5rem;
  background-color: #f8f9fa;
  border: 2px solid #f1f2f6;
  transition: all 0.3s ease;
  
  &:focus {
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
  }
`;

const SearchIcon = styled.i`
  position: absolute;
  left: 0.8rem;
  top: 50%;
  transform: translateY(-50%);
  color: #3498db;
`;

const ClearIcon = styled.i`
  position: absolute;
  right: 0.8rem;
  top: 50%;
  transform: translateY(-50%);
  color: #7f8c8d;
  cursor: pointer;
  
  &:hover {
    color: #e74c3c;
  }
`;

// Scanner styled components
const scannerFlash = keyframes`
  0% { opacity: 0.3; }
  50% { opacity: 1; }
  100% { opacity: 0.3; }
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

const ScannerButton = styled.button`
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

const ScannerStatus = styled.div`
  padding: 1rem;
  border-radius: 10px;
  background: ${props => props.$active ? '#48bb78' : '#e53e3e'};
  color: white;
  text-align: center;
  margin-bottom: 1rem;
  font-weight: 600;
`;

// Global style for spin animation
const GlobalStyle = styled.div`
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  .spin {
    animation: spin 1s linear infinite;
  }
`;

const Products = () => {
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    minquantity: '',
    quantity: '',
    vendor: '',
    photo: null,
    imagePreview: '',
    deleteImage: false
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [barcodeFilter, setBarcodeFilter] = useState('');
  const [showRTOModal, setShowRTOModal] = useState(false);
  const [rtoFormData, setRTOFormData] = useState({
    category: 'RTO', // Fixed category for RTO
    returnDate: new Date().toISOString().split('T')[0],
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    reason: '',
    items: [],
    totalAmount: 0,
    comments: '',
    status: 'processed' // Default status
  });
  const [rtoScannerActive, setRTOScannerActive] = useState(false);
  const [rtoScannedCode, setRTOScannedCode] = useState('');
  const [rtoBarcodeMode, setRTOBarcodeMode] = useState(false);
  
  const rtoScannerRef = useRef(null);
  const rtoBarcodeInputRef = useRef(null);

  // RPU States
  const [showRPUModal, setShowRPUModal] = useState(false);
  const [rpuFormData, setRPUFormData] = useState({
    category: 'RPU', // Fixed category for RPU
    returnDate: new Date().toISOString().split('T')[0],
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    reason: 'other',
    items: [],
    totalAmount: 0,
    comments: '',
    status: 'processed' // Default status
  });
  const [rpuScannerActive, setRPUScannerActive] = useState(false);
  const [rpuScannedCode, setRPUScannedCode] = useState('');
  const [rpuBarcodeMode, setRPUBarcodeMode] = useState(false);
  
  const rpuScannerRef = useRef(null);
  const rpuBarcodeInputRef = useRef(null);

  useEffect(() => {
    fetchProducts();
    fetchVendors();
    fetchCategories();
  }, []);
  
  // Cleanup scanner on component unmount
  useEffect(() => {
    return () => {
      stopRTOScanner();
      stopRPUScanner();
    };
  }, []);

  // Effect to handle select all checkbox state
  useEffect(() => {
    if (selectAll) {
      setSelectedProducts(products.map(product => product._id));
    } else {
      setSelectedProducts([]);
    }
  }, [selectAll, products]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getAll();
      setProducts(response.data);
      setError('');
    } catch (error) {
      setError('Failed to fetch products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await vendorsAPI.getAll();
      setVendors(response.data);
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleShowModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || '',
        category: product.category?._id || '',
        price: product.price,
        minquantity: product.minquantity,
        quantity: product.quantity,
        vendor: product.vendor?._id || '',
        photo: null,
        imagePreview: product.image || '',
        deleteImage: false
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        category: '',
        price: '',
        minquantity: '',
        quantity: '',
        vendor: '',
        photo: null,
        imagePreview: '',
        deleteImage: false
      });
    }
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.match('image.*')) {
        setError('Please select an image file');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      
      setFormData(prev => ({
        ...prev,
        photo: file,
        imagePreview: previewUrl,
        deleteImage: false // Reset delete flag when new file is selected
      }));
      
      setError('');
    }
  };

  const removeImage = () => {
    // Cleanup preview URL to prevent memory leaks
    if (formData.imagePreview && formData.imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(formData.imagePreview);
    }
    
    setFormData(prev => ({
      ...prev,
      imagePreview: '',
      photo: null,
      deleteImage: true // Signal that the image should be deleted
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        price: parseFloat(formData.price),
        minquantity: parseInt(formData.minquantity),
        quantity: parseInt(formData.quantity),
        vendor: formData.vendor,
        photo: formData.photo, // Include the file for upload
        deleteImage: formData.deleteImage // Include delete flag for image removal
      };

      if (editingProduct) {
        await productsAPI.update(editingProduct._id, productData);
        setSuccess('Product updated successfully!');
      } else {
        await productsAPI.create(productData);
        setSuccess('Product created successfully!');
      }
      fetchProducts();
      handleCloseModal();
    } catch (error) {
      setError('Failed to save product. Please try again.');
      console.error('Submit error:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productsAPI.delete(id);
        setSuccess('Product deleted successfully!');
        fetchProducts();
      } catch (error) {
        setError('Failed to delete product. Please try again.');
      }
    }
  };

  const clearAlerts = () => {
    setError('');
    setSuccess('');
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

  const openImagePreview = (imageUrl) => {
    setImagePreview(imageUrl);
  };

  const closeImagePreview = () => {
    setImagePreview(null);
  };

  // Handle individual checkbox selection
  const handleSelectProduct = (productId) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        // If already selected, remove it
        const newSelected = prev.filter(id => id !== productId);
        // Update selectAll state
        if (newSelected.length === 0) {
          setSelectAll(false);
        }
        return newSelected;
      } else {
        // If not selected, add it
        const newSelected = [...prev, productId];
        // Check if all products are now selected
        if (newSelected.length === products.length) {
          setSelectAll(true);
        }
        return newSelected;
      }
    });
  };

  // Handle select all checkbox
  const handleSelectAll = () => {
    setSelectAll(!selectAll);
  };

  // Handle batch delete of selected products
  const handleBatchDelete = async () => {
    if (selectedProducts.length === 0) {
      setError('No products selected for deletion');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedProducts.length} selected products?`)) {
      try {
        // Perform multiple delete operations
        const promises = selectedProducts.map(id => productsAPI.delete(id));
        await Promise.all(promises);
        
        setSuccess(`${selectedProducts.length} products deleted successfully!`);
        setSelectedProducts([]);
        setSelectAll(false);
        fetchProducts();
      } catch (error) {
        setError('Failed to delete selected products. Please try again.');
      }
    }
  };

  // Handle batch barcode download
  const handleBatchBarcodeDownload = async () => {
    if (selectedProducts.length === 0) {
      setError('No products selected for barcode download');
      return;
    }

    try {
      setLoading(true);
      const response = await barcodesAPI.downloadProductBarcodes(selectedProducts);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      if (selectedProducts.length === 1) {
        const product = products.find(p => p._id === selectedProducts[0]);
        link.setAttribute('download', `barcode-${product?.barcode || 'product'}.png`);
      } else {
        link.setAttribute('download', `product-barcodes-${Date.now()}.zip`);
      }
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setSuccess(`Downloaded ${selectedProducts.length} barcode(s) successfully!`);
      setSelectedProducts([]);
      setSelectAll(false);
    } catch (error) {
      console.error('Download error:', error);
      setError('Failed to download barcodes. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter products by barcode or product name
  const filterProductsByBarcode = () => {
    if (!barcodeFilter) return products;
    
    const searchTerm = barcodeFilter.toLowerCase();
    return products.filter(product => 
      (product.barcode && product.barcode.toLowerCase().includes(searchTerm)) ||
      (product.name && product.name.toLowerCase().includes(searchTerm))
    );
  };

  // Handle barcode scan (can be connected to a real scanner via input event)
  const handleBarcodeInput = (e) => {
    setBarcodeFilter(e.target.value);
  };

  const ProductImage = ({ product }) => {
    if (product.image) {
      return (
        <img 
          src={product.image} 
          alt={product.name}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            objectFit: 'cover',
            cursor: 'pointer'
          }}
          onClick={() => openImagePreview(product.image)}
        />
      );
    }

    return (
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '8px',
        background: 'linear-gradient(135deg, #3498db, #2980b9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 'bold'
      }}>
        {product.name.charAt(0)}
      </div>
    );
  };

  // Function to handle barcode download (fetch as blob for cross-browser support)
  const downloadBarcode = async (barcode, productName) => {
    if (!barcode) return;
    try {
      const response = await productsAPI.getBarcodeImage(barcode);
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `barcode-${barcode}-${productName.replace(/\s+/g, '-')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download barcode image.');
    }
  };

  // RTO Form Functions
  const handleRTOInputChange = (name, value) => {
    setRTOFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateRTOTotal = () => {
    return rtoFormData.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  };

  const handleRTOItemChange = (index, field, value) => {
    const newItems = [...rtoFormData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    const totalAmount = newItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    
    setRTOFormData(prev => ({
      ...prev,
      items: newItems,
      totalAmount
    }));
  };

  const handleAddRTOItem = () => {
    setRTOFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        product: '',
        productName: '',
        barcode: '',
        quantity: 1,
        unitPrice: 0,
        total: 0
      }]
    }));
  };

  const handleRemoveRTOItem = (index) => {
    const newItems = rtoFormData.items.filter((_, i) => i !== index);
    const totalAmount = newItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    
    setRTOFormData(prev => ({
      ...prev,
      items: newItems,
      totalAmount
    }));
  };

  const handleRTOProductSelect = (index, productId) => {
    const product = products.find(p => p._id === productId);
    if (product) {
      const newItems = [...rtoFormData.items];
      newItems[index] = {
        ...newItems[index],
        product: product._id,
        productName: product.name,
        barcode: product.barcode || '',
        unitPrice: product.price
      };
      
      const totalAmount = newItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
      
      setRTOFormData(prev => ({
        ...prev,
        items: newItems,
        totalAmount
      }));
    }
  };

  const handleRTOSubmit = async (e) => {
    e.preventDefault();
    
    if (!rtoFormData.customerName || rtoFormData.items.length === 0) {
      setError('Customer name and at least one item are required');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      setLoading(true);
      
      // Prepare the return data for API
      const returnData = {
        category: 'RTO',
        returnDate: rtoFormData.returnDate,
        customerName: rtoFormData.customerName,
        customerPhone: rtoFormData.customerPhone,
        customerEmail: rtoFormData.customerEmail,
        reason: rtoFormData.reason,
        items: rtoFormData.items.map(item => ({
          product: item.product,
          productName: item.productName,
          barcode: item.barcode,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.unitPrice * item.quantity
        })),
        totalAmount: rtoFormData.totalAmount,
        comments: rtoFormData.comments,
        status: 'processed'
      };
      
      // Create the return record
      const response = await returnsAPI.create(returnData);
      
      if (response.data) {
        const returnId = response.data.returnId || response.data.return?.returnId || response.data._id;
        setSuccess(`RTO processed successfully! Return ID: ${returnId}. Product quantities have been updated. Check Returns & Tracking page to view details.`);
        
        // Refresh the products list to show updated quantities
        await fetchProducts();
        
        // Reset form and close modal
        setRTOFormData({
          category: 'RTO',
          returnDate: new Date().toISOString().split('T')[0],
          customerName: '',
          customerPhone: '',
          customerEmail: '',
          reason: '',
          items: [],
          totalAmount: 0,
          comments: '',
          status: 'processed'
        });
        setShowRTOModal(false);
        
        // Clear success message after 8 seconds to give user time to read
        setTimeout(() => setSuccess(''), 8000);
      }
    } catch (error) {
      console.error('RTO Submission Error:', error);
      setError(error.response?.data?.message || 'Failed to process RTO. Please try again.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseRTOModal = () => {
    stopRTOScanner(); // Stop scanner when closing modal
    setShowRTOModal(false);
    setRTOFormData({
      category: 'RTO',
      returnDate: new Date().toISOString().split('T')[0],
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      reason: '',
      items: [],
      totalAmount: 0,
      comments: '',
      status: 'processed'
    });
    setRTOScannedCode('');
    setRTOBarcodeMode(false);
  };

  // RTO Scanner Functions
  const startRTOScanner = () => {
    if (rtoScannerRef.current) {
      Quagga.init(
        {
          inputStream: {
            type: "LiveStream",
            target: rtoScannerRef.current,
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
            setError("Unable to start RTO scanner: " + err);
            return;
          }
          Quagga.start();
          setRTOScannerActive(true);
        }
      );

      Quagga.onDetected((data) => {
        if (data && data.codeResult && data.codeResult.code) {
          setRTOScannedCode(data.codeResult.code);
        }
      });
    }
  };

  const stopRTOScanner = () => {
    try {
      Quagga.stop();
      setRTOScannerActive(false);
    } catch (error) {
      // Ignore errors when stopping scanner
    }
  };

  const toggleRTOBarcodeMode = () => {
    setRTOBarcodeMode(prev => {
      const newMode = !prev;
      if (newMode) {
        setTimeout(() => {
          if (rtoBarcodeInputRef.current) {
            rtoBarcodeInputRef.current.focus();
          }
        }, 100);
      } else {
        setRTOScannedCode("");
      }
      return newMode;
    });
  };

  const addRTOBarcodeManually = async () => {
    if (!rtoScannedCode || !rtoBarcodeMode) return;
    
    try {
      await addRTOScannedItem();
      setRTOScannedCode("");
    } catch (error) {
      console.error("Error adding barcode manually:", error);
    }
  };

  const addRTOScannedItem = async () => {
    if (!rtoScannedCode) return;
    
    try {
      // Find product by barcode in the products list
      const productMatch = products.find(p => p.barcode === rtoScannedCode);
      
      if (productMatch) {
        // Check if this barcode already exists in RTO items
        const existingItemIndex = rtoFormData.items.findIndex(item => item.barcode === rtoScannedCode);
        
        let newItems = [...rtoFormData.items];
        
        if (existingItemIndex !== -1) {
          // Increment quantity of existing item
          newItems[existingItemIndex] = {
            ...newItems[existingItemIndex],
            quantity: (newItems[existingItemIndex].quantity || 1) + 1
          };
        } else {
          // Add new item
          newItems.push({
            product: productMatch._id,
            productName: productMatch.name,
            barcode: productMatch.barcode,
            quantity: 1,
            unitPrice: productMatch.price,
            total: productMatch.price
          });
        }
        
        // Calculate total amount
        const totalAmount = newItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
        
        setRTOFormData(prev => ({
          ...prev,
          items: newItems,
          totalAmount
        }));
        
        setRTOScannedCode("");
        setSuccess(`Added ${productMatch.name} to return items`);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        // Try to fetch product by barcode from API
        try {
          const response = await productsAPI.getByBarcode(rtoScannedCode);
          if (response.data) {
            const product = response.data;
            
            // Check if this barcode already exists in RTO items
            const existingItemIndex = rtoFormData.items.findIndex(item => item.barcode === rtoScannedCode);
            
            let newItems = [...rtoFormData.items];
            
            if (existingItemIndex !== -1) {
              // Increment quantity of existing item
              newItems[existingItemIndex] = {
                ...newItems[existingItemIndex],
                quantity: (newItems[existingItemIndex].quantity || 1) + 1
              };
            } else {
              // Add new item
              newItems.push({
                product: product._id,
                productName: product.name,
                barcode: product.barcode,
                quantity: 1,
                unitPrice: product.price,
                total: product.price
              });
            }
            
            // Calculate total amount
            const totalAmount = newItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
            
            setRTOFormData(prev => ({
              ...prev,
              items: newItems,
              totalAmount
            }));
            
            setRTOScannedCode("");
            setSuccess(`Added ${product.name} to return items`);
            
            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(''), 3000);
          } else {
            setError(`Product with barcode ${rtoScannedCode} not found`);
            setTimeout(() => setError(''), 3000);
          }
        } catch (error) {
          setError(`Product with barcode ${rtoScannedCode} not found`);
          setTimeout(() => setError(''), 3000);
        }
      }
      
      // Restart scanner if it was active
      if (rtoScannerActive) {
        stopRTOScanner();
        setTimeout(() => {
          startRTOScanner();
        }, 1000);
      }
    } catch (error) {
      setError(`Error processing barcode: ${rtoScannedCode}`);
      setTimeout(() => setError(''), 3000);
      setRTOScannedCode("");
    }
  };

  // Auto-add scanned items when not in barcode mode
  useEffect(() => {
    if (!rtoScannedCode || rtoBarcodeMode) return;
    
    addRTOScannedItem();
  }, [rtoScannedCode, rtoBarcodeMode]);

  // Focus barcode input when barcode mode is enabled
  useEffect(() => {
    if (rtoBarcodeMode && rtoBarcodeInputRef.current) {
      rtoBarcodeInputRef.current.focus();
    }
  }, [rtoBarcodeMode]);

  // RPU Form Functions
  const handleRPUInputChange = (name, value) => {
    setRPUFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRPUItemChange = (index, field, value) => {
    const newItems = [...rpuFormData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    const totalAmount = newItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    
    setRPUFormData(prev => ({
      ...prev,
      items: newItems,
      totalAmount
    }));
  };

  const handleAddRPUItem = () => {
    setRPUFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        product: '',
        productName: '',
        barcode: '',
        quantity: 1,
        unitPrice: 0,
        total: 0
      }]
    }));
  };

  const handleRemoveRPUItem = (index) => {
    const newItems = rpuFormData.items.filter((_, i) => i !== index);
    const totalAmount = newItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    
    setRPUFormData(prev => ({
      ...prev,
      items: newItems,
      totalAmount
    }));
  };

  const handleRPUProductSelect = (index, productId) => {
    const product = products.find(p => p._id === productId);
    if (product) {
      const newItems = [...rpuFormData.items];
      newItems[index] = {
        ...newItems[index],
        product: product._id,
        productName: product.name,
        barcode: product.barcode || '',
        unitPrice: product.price
      };
      
      const totalAmount = newItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
      
      setRPUFormData(prev => ({
        ...prev,
        items: newItems,
        totalAmount
      }));
    }
  };

  const handleRPUSubmit = async (e) => {
    e.preventDefault();
    
    if (!rpuFormData.customerName || rpuFormData.items.length === 0) {
      setError('Customer name and at least one item are required');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      setLoading(true);
      
      // Prepare the return data for API
      const returnData = {
        category: 'RPU',
        returnDate: rpuFormData.returnDate,
        customerName: rpuFormData.customerName,
        customerPhone: rpuFormData.customerPhone,
        customerEmail: rpuFormData.customerEmail,
        reason: rpuFormData.reason,
        items: rpuFormData.items.map(item => ({
          product: item.product,
          productName: item.productName,
          barcode: item.barcode,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.unitPrice * item.quantity
        })),
        totalAmount: rpuFormData.totalAmount,
        comments: rpuFormData.comments,
        status: 'processed'
      };
      
      // Create the return record
      const response = await returnsAPI.create(returnData);
      
      if (response.data) {
        const returnId = response.data.returnId || response.data.return?.returnId || response.data._id;
        setSuccess(`RPU processed successfully! Return ID: ${returnId}. Record saved (no inventory changes). Check Returns & Tracking page to view details.`);
        
        // Reset form and close modal
        setRPUFormData({
          category: 'RPU',
          returnDate: new Date().toISOString().split('T')[0],
          customerName: '',
          customerPhone: '',
          customerEmail: '',
          reason: 'other',
          items: [],
          totalAmount: 0,
          comments: '',
          status: 'processed'
        });
        setShowRPUModal(false);
        
        // Clear success message after 8 seconds
        setTimeout(() => setSuccess(''), 8000);
      }
    } catch (error) {
      console.error('RPU Submission Error:', error);
      setError(error.response?.data?.message || 'Failed to process RPU. Please try again.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseRPUModal = () => {
    stopRPUScanner(); // Stop scanner when closing modal
    setShowRPUModal(false);
    setRPUFormData({
      category: 'RPU',
      returnDate: new Date().toISOString().split('T')[0],
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      reason: 'other',
      items: [],
      totalAmount: 0,
      comments: '',
      status: 'processed'
    });
    setRPUScannedCode('');
    setRPUBarcodeMode(false);
  };

  // RPU Scanner Functions
  const startRPUScanner = () => {
    if (rpuScannerRef.current) {
      Quagga.init(
        {
          inputStream: {
            type: "LiveStream",
            target: rpuScannerRef.current,
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
            setError("Unable to start RPU scanner: " + err);
            return;
          }
          Quagga.start();
          setRPUScannerActive(true);
        }
      );

      Quagga.onDetected((data) => {
        if (data && data.codeResult && data.codeResult.code) {
          setRPUScannedCode(data.codeResult.code);
        }
      });
    }
  };

  const stopRPUScanner = () => {
    try {
      Quagga.stop();
      setRPUScannerActive(false);
    } catch (error) {
      // Ignore errors when stopping scanner
    }
  };

  const toggleRPUBarcodeMode = () => {
    setRPUBarcodeMode(prev => {
      const newMode = !prev;
      if (newMode) {
        setTimeout(() => {
          if (rpuBarcodeInputRef.current) {
            rpuBarcodeInputRef.current.focus();
          }
        }, 100);
      } else {
        setRPUScannedCode("");
      }
      return newMode;
    });
  };

  const addRPUBarcodeManually = async () => {
    if (!rpuScannedCode || !rpuBarcodeMode) return;
    
    try {
      await addRPUScannedItem();
      setRPUScannedCode("");
    } catch (error) {
      console.error("Error adding barcode manually:", error);
    }
  };

  const addRPUScannedItem = async () => {
    if (!rpuScannedCode) return;
    
    try {
      // Find product by barcode in the products list
      const productMatch = products.find(p => p.barcode === rpuScannedCode);
      
      if (productMatch) {
        // Check if this barcode already exists in RPU items
        const existingItemIndex = rpuFormData.items.findIndex(item => item.barcode === rpuScannedCode);
        
        let newItems = [...rpuFormData.items];
        
        if (existingItemIndex !== -1) {
          // Increment quantity of existing item
          newItems[existingItemIndex] = {
            ...newItems[existingItemIndex],
            quantity: (newItems[existingItemIndex].quantity || 1) + 1
          };
        } else {
          // Add new item
          newItems.push({
            product: productMatch._id,
            productName: productMatch.name,
            barcode: productMatch.barcode,
            quantity: 1,
            unitPrice: productMatch.price,
            total: productMatch.price
          });
        }
        
        // Calculate total amount
        const totalAmount = newItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
        
        setRPUFormData(prev => ({
          ...prev,
          items: newItems,
          totalAmount
        }));
        
        setRPUScannedCode("");
        setSuccess(`Added ${productMatch.name} to processing items`);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        // Try to fetch product by barcode from API
        try {
          const response = await productsAPI.getByBarcode(rpuScannedCode);
          if (response.data) {
            const product = response.data;
            
            // Check if this barcode already exists in RPU items
            const existingItemIndex = rpuFormData.items.findIndex(item => item.barcode === rpuScannedCode);
            
            let newItems = [...rpuFormData.items];
            
            if (existingItemIndex !== -1) {
              // Increment quantity of existing item
              newItems[existingItemIndex] = {
                ...newItems[existingItemIndex],
                quantity: (newItems[existingItemIndex].quantity || 1) + 1
              };
            } else {
              // Add new item
              newItems.push({
                product: product._id,
                productName: product.name,
                barcode: product.barcode,
                quantity: 1,
                unitPrice: product.price,
                total: product.price
              });
            }
            
            // Calculate total amount
            const totalAmount = newItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
            
            setRPUFormData(prev => ({
              ...prev,
              items: newItems,
              totalAmount
            }));
            
            setRPUScannedCode("");
            setSuccess(`Added ${product.name} to processing items`);
            
            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(''), 3000);
          } else {
            setError(`Product with barcode ${rpuScannedCode} not found`);
            setTimeout(() => setError(''), 3000);
          }
        } catch (error) {
          setError(`Product with barcode ${rpuScannedCode} not found`);
          setTimeout(() => setError(''), 3000);
        }
      }
      
      // Restart scanner if it was active
      if (rpuScannerActive) {
        stopRPUScanner();
        setTimeout(() => {
          startRPUScanner();
        }, 1000);
      }
    } catch (error) {
      setError(`Error processing barcode: ${rpuScannedCode}`);
      setTimeout(() => setError(''), 3000);
      setRPUScannedCode("");
    }
  };

  // Auto-add scanned items when not in barcode mode for RPU
  useEffect(() => {
    if (!rpuScannedCode || rpuBarcodeMode) return;
    
    addRPUScannedItem();
  }, [rpuScannedCode, rpuBarcodeMode]);

  // Focus barcode input when barcode mode is enabled for RPU
  useEffect(() => {
    if (rpuBarcodeMode && rpuBarcodeInputRef.current) {
      rpuBarcodeInputRef.current.focus();
    }
  }, [rpuBarcodeMode]);

  if (loading) {
    return (
      <PageContainer>
        <LoadingSpinner />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <GlobalStyle />
      <PageHeader>
        <PageTitle>Products Management</PageTitle>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Barcode scanner/filter input */}
          <BarcodeSearchContainer>
            <BarcodeSearchInput
              type="text"
              placeholder="Scan or enter barcode"
              value={barcodeFilter}
              onChange={handleBarcodeInput}
            />
            <SearchIcon className="bi bi-upc-scan" />
            {barcodeFilter && (
              <ClearIcon 
                className="bi bi-x-circle"
                onClick={() => setBarcodeFilter('')}
              />
            )}
          </BarcodeSearchContainer>
          <ActionButton onClick={() => handleShowModal()}>
            <i className="bi bi-plus-circle"></i>
            Add New Product
          </ActionButton>
          <ActionButton onClick={() => setShowRTOModal(true)}>
            <i className="bi bi-arrow-return-left"></i>
            RTO
          </ActionButton>
          <ActionButton onClick={() => setShowRPUModal(true)}>
            <i className="bi bi-arrow-clockwise"></i>
            RPU
          </ActionButton>
        </div>
      </PageHeader>

      {error && (
        <AlertMessage variant="danger">
          <i className="bi bi-exclamation-circle"></i>
          {error}
          <CloseAlert onClick={clearAlerts}>
            <i className="bi bi-x"></i>
          </CloseAlert>
        </AlertMessage>
      )}

      {success && (
        <AlertMessage variant="success">
          <i className="bi bi-check-circle"></i>
          {success}
          <CloseAlert onClick={clearAlerts}>
            <i className="bi bi-x"></i>
          </CloseAlert>
        </AlertMessage>
      )}

      {/* Batch Action Buttons - Only shown when products are selected */}
      {selectedProducts.length > 0 && (
        <BatchActionsContainer>
          <SelectionCounter>
            {selectedProducts.length} product{selectedProducts.length > 1 ? 's' : ''} selected
          </SelectionCounter>
          <BatchActionButton 
            variant="download"
            onClick={handleBatchBarcodeDownload}
          >
            <i className="bi bi-upc"></i>
            Download Barcodes
          </BatchActionButton>
          <BatchActionButton 
            variant="delete"
            onClick={handleBatchDelete}
          >
            <i className="bi bi-trash"></i>
            Delete Selected
          </BatchActionButton>
        </BatchActionsContainer>
      )}

      <TableContainer>
        {products.length > 0 ? (
          <StyledTable>
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>
                  <Checkbox 
                    checked={selectAll}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>S.No</th>
                <th>Product</th>
                <th>Barcode</th>
                <th>Category</th>
                <th>Price</th>
                <th>Min Quantity</th>
                <th>Stock Level</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filterProductsByBarcode().length > 0 ? (
                filterProductsByBarcode().map((product, index) => (
                  <tr key={product._id}>
                    <td style={{ textAlign: 'center' }}>
                      <Checkbox 
                        checked={selectedProducts.includes(product._id)}
                        onChange={() => handleSelectProduct(product._id)}
                      />
                    </td>
                    <td>{index + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ProductImage product={product} />
                        {product.name}
                      </div>
                    </td>
                    <td>{product.barcode || '-'}</td>
                    <td>
                      {product.category?.code ? `${product.category.code} - ${product.category.name}` : 'N/A'}
                    </td>
                    <td>{formatCurrency(product.price)}</td>
                    <td>{product.minquantity}</td>
                    <td>
                      <StockIndicator>
                        <span>{product.quantity}</span>
                        <ProgressBar>
                          <ProgressFill 
                            current={product.quantity} 
                            max={Math.max(product.quantity * 2, 100)} 
                          />
                        </ProgressBar>
                      </StockIndicator>
                    </td>
                    <td>
                      <StatusBadge variant={getStockStatus(product.quantity, product.minquantity)}>
                        {getStockStatusText(product.quantity, product.minquantity)}
                      </StatusBadge>
                    </td>
                    <ActionCell>
                      <IconButton 
                        variant="edit" 
                        onClick={() => handleShowModal(product)}
                        title="Edit Product"
                      >
                        <i className="bi bi-pencil"></i>
                      </IconButton>
                      <IconButton 
                        variant="danger" 
                        onClick={() => handleDelete(product._id)}
                        title="Delete Product"
                      >
                        <i className="bi bi-trash"></i>
                      </IconButton>
                      {product.barcode ? (
                        <DownloadButton
                          href="#"
                          onClick={async (e) => {
                            e.preventDefault();
                            await downloadBarcode(product.barcode, product.name);
                          }}
                        >
                          <i className="bi bi-download"></i>
                        </DownloadButton>
                      ) : '-'}
                    </ActionCell>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10">
                    <EmptyState>
                      <i className="bi bi-search"></i>
                      <h3>No products found with barcode "{barcodeFilter}"</h3>
                      <p>Try a different barcode or clear the search filter.</p>
                      <SecondaryButton 
                        onClick={() => setBarcodeFilter('')}
                        style={{ marginTop: '1rem' }}
                      >
                        Clear Filter
                      </SecondaryButton>
                    </EmptyState>
                  </td>
                </tr>
              )}
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

      {showModal && (
        <ModalOverlay onClick={handleCloseModal}>
          <ModalContainer onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</ModalTitle>
              <CloseButton onClick={handleCloseModal}>
                <i className="bi bi-x"></i>
              </CloseButton>
            </ModalHeader>
            <form onSubmit={handleSubmit}>
              <ModalBody>
                <FormGrid>
                  <FormGroup>
                    <Label>Name </Label>
                    <Input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter product name"
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Category *</Label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e0e0e0',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        backgroundColor: 'white',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <option value="">Select a category</option>
                      {categories.map(category => (
                        <option key={category._id} value={category._id}>
                          {category.code} - {category.name}
                        </option>
                      ))}
                    </select>
                  </FormGroup>

                  <FormGroup>
                    <Label>Price </Label>
                    <Input
                      type="number"
                      step="1"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                      placeholder="0"
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Min Quantity </Label>
                    <Input
                      type="number"
                      step="1"
                      name="minquantity"
                      value={formData.minquantity}
                      onChange={handleInputChange}
                      required
                      placeholder="0"
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Quantity </Label>
                    <Input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      required
                      placeholder="0"
                    />
                  </FormGroup>

                  <FormGroup>
                    <Label>Vendor </Label>
                    <Select
                      name="vendor"
                      value={formData.vendor}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select a vendor</option>
                      {vendors.map(vendor => (
                        <option key={vendor._id} value={vendor._id}>
                          {vendor.name}
                        </option>
                      ))}
                    </Select>
                  </FormGroup>

                  <FormGroup>
                    <Label>Product Image</Label>
                    <Input
                      type="file"
                      name="photo"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    {formData.imagePreview && (
                      <ImagePreview>
                        <img src={formData.imagePreview} alt="Preview" />
                        <RemoveImageButton type="button" onClick={removeImage}>
                          Remove Image
                        </RemoveImageButton>
                      </ImagePreview>
                    )}
                  </FormGroup>
                </FormGrid>

                <FormGroup>
                  <Label>Description</Label>
                  <TextArea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter product description"
                  />
                </FormGroup>
              </ModalBody>
              <ModalFooter>
                <SecondaryButton type="button" onClick={handleCloseModal}>
                  Cancel
                </SecondaryButton>
                <PrimaryButton 
                  type="submit"
                >
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </PrimaryButton>
              </ModalFooter>
            </form>
          </ModalContainer>
        </ModalOverlay>
      )}

      {/* Image Preview Modal */}
      {imagePreview && (
        <ImagePreviewModal onClick={closeImagePreview}>
          <ClosePreviewButton onClick={closeImagePreview}>
            <i className="bi bi-x"></i>
          </ClosePreviewButton>
          <ImagePreviewContainer onClick={(e) => e.stopPropagation()}>
            <PreviewImage src={imagePreview} alt="Product preview" />
          </ImagePreviewContainer>
        </ImagePreviewModal>
      )}

      {/* RTO (Return to Origin) Modal */}
      {showRTOModal && (
        <ModalOverlay onClick={handleCloseRTOModal}>
          <ModalContainer onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px' }}>
            <ModalHeader>
              <div>
                <ModalTitle>
                  <i className="bi bi-arrow-return-left" style={{ marginRight: '0.5rem' }}></i>
                  Return to Origin (RTO)
                </ModalTitle>
                <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.2rem' }}>
                  Process customer returns and automatically restore inventory quantities
                </div>
              </div>
              <CloseButton onClick={handleCloseRTOModal}>
                <i className="bi bi-x"></i>
              </CloseButton>
            </ModalHeader>
            <form onSubmit={handleRTOSubmit}>
              <ModalBody>
                {/* Customer Information */}
                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ color: '#2c3e50', marginBottom: '1rem', borderBottom: '2px solid #3498db', paddingBottom: '0.5rem' }}>
                    Customer Information
                  </h4>
                  <FormGrid>
                    <FormGroup>
                      <Label>Return Date</Label>
                      <Input
                        type="date"
                        value={rtoFormData.returnDate}
                        onChange={(e) => handleRTOInputChange('returnDate', e.target.value)}
                        required
                      />
                    </FormGroup>
                    <FormGroup>
                      <Label>Customer Name</Label>
                      <Input
                        type="text"
                        value={rtoFormData.customerName}
                        onChange={(e) => handleRTOInputChange('customerName', e.target.value)}
                        placeholder="Enter customer name"
                        required
                      />
                    </FormGroup>
                    <FormGroup>
                      <Label>Customer Phone</Label>
                      <Input
                        type="tel"
                        value={rtoFormData.customerPhone}
                        onChange={(e) => handleRTOInputChange('customerPhone', e.target.value)}
                        placeholder="Enter phone number"
                      />
                    </FormGroup>
                    <FormGroup>
                      <Label>Customer Email</Label>
                      <Input
                        type="email"
                        value={rtoFormData.customerEmail}
                        onChange={(e) => handleRTOInputChange('customerEmail', e.target.value)}
                        placeholder="Enter email address"
                      />
                    </FormGroup>
                    <FormGroup>
                      <Label>Return Reason</Label>
                      <Select
                        value={rtoFormData.reason}
                        onChange={(e) => handleRTOInputChange('reason', e.target.value)}
                        required
                      >
                        <option value="">Select reason</option>
                        <option value="defective">Defective Product</option>
                        <option value="wrong_item">Wrong Item Delivered</option>
                        <option value="damaged">Damaged During Shipping</option>
                        <option value="not_satisfied">Customer Not Satisfied</option>
                        <option value="warranty_claim">Warranty Claim</option>
                        <option value="other">Other</option>
                      </Select>
                    </FormGroup>
                  </FormGrid>
                </div>

                {/* Barcode Scanning Section */}
                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ color: '#2c3e50', marginBottom: '1rem', borderBottom: '2px solid #3498db', paddingBottom: '0.5rem' }}>
                    <i className="bi bi-upc-scan" style={{ marginRight: '0.5rem' }}></i>
                    Scan Return Items
                  </h4>

                  <ScannerStatus $active={rtoScannerActive} style={{ marginBottom: '1rem' }}>
                    {rtoScannerActive ? '🟢 Scanner Active' : '🔴 Scanner Inactive'}
                  </ScannerStatus>
                  
                  <ScannerContainer ref={rtoScannerRef} style={{ marginBottom: '1rem' }} />

                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    <ScannerButton
                      type="button"
                      $active={rtoScannerActive}
                      onClick={rtoScannerActive ? stopRTOScanner : startRTOScanner}
                    >
                      {rtoScannerActive ? '⏹️ Stop Scanner' : '📷 Start Scanner'}
                    </ScannerButton>
                  </div>

                  {/* Barcode Input */}
                  <FormGroup style={{ marginBottom: '1rem' }}>
                    <Label>Scanned Barcode</Label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <Input
                        ref={rtoBarcodeInputRef}
                        type="text"
                        value={rtoScannedCode}
                        onChange={(e) => setRTOScannedCode(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (rtoBarcodeMode && rtoScannedCode.trim()) {
                              addRTOBarcodeManually();
                            }
                          }
                        }}
                        placeholder={rtoBarcodeMode ? "Barcode mode active - scan or enter barcode" : "Enter barcode manually"}
                        disabled={!rtoBarcodeMode}
                        style={{ flex: '1', minWidth: '200px' }}
                      />
                      <SecondaryButton 
                        type="button"
                        onClick={toggleRTOBarcodeMode}
                        style={{
                          background: rtoBarcodeMode ? '#28a745' : 'transparent',
                          color: rtoBarcodeMode ? 'white' : '#3498db',
                          border: rtoBarcodeMode ? '2px solid #28a745' : '2px solid #3498db'
                        }}
                      >
                        {rtoBarcodeMode ? '✓ Barcode Active' : '📊 Enable Barcode'}
                      </SecondaryButton>
                      {rtoBarcodeMode && rtoScannedCode && (
                        <ActionButton 
                          type="button"
                          onClick={addRTOBarcodeManually}
                          style={{ background: 'linear-gradient(to right, #28a745, #20c997)' }}
                        >
                          ➕ Add Item
                        </ActionButton>
                      )}
                    </div>
                    {rtoBarcodeMode && (
                      <small style={{ color: '#6c757d', marginTop: '0.5rem', display: 'block' }}>
                        📍 Barcode mode is active. Scan barcode or press Enter to add items automatically.
                      </small>
                    )}
                  </FormGroup>
                </div>

                {/* Return Items */}
                <div style={{ marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ color: '#2c3e50', margin: 0, borderBottom: '2px solid #3498db', paddingBottom: '0.5rem' }}>
                      Return Items ({rtoFormData.items.length})
                    </h4>
                    <ActionButton type="button" onClick={handleAddRTOItem}>
                      <i className="bi bi-plus-circle"></i>
                      Add Item Manually
                    </ActionButton>
                  </div>

                  {rtoFormData.items.length > 0 ? (
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: 'linear-gradient(to right, #3498db)', color: 'white' }}>
                          <tr>
                            <th style={{ padding: '0.8rem', textAlign: 'left', border: 'none' }}>Product</th>
                            <th style={{ padding: '0.8rem', textAlign: 'left', border: 'none' }}>Barcode</th>
                            <th style={{ padding: '0.8rem', textAlign: 'left', border: 'none' }}>Price</th>
                            <th style={{ padding: '0.8rem', textAlign: 'left', border: 'none' }}>Quantity</th>
                            <th style={{ padding: '0.8rem', textAlign: 'left', border: 'none' }}>Total</th>
                            <th style={{ padding: '0.8rem', textAlign: 'left', border: 'none' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rtoFormData.items.map((item, index) => (
                            <tr key={index} style={{ borderBottom: '1px solid #e2e8f0' }}>
                              <td style={{ padding: '0.8rem' }}>
                                <Select
                                  value={item.product}
                                  onChange={(e) => handleRTOProductSelect(index, e.target.value)}
                                  required
                                  style={{ minWidth: '200px' }}
                                >
                                  <option value="">Select Product</option>
                                  {products.map(product => (
                                    <option key={product._id} value={product._id}>
                                      {product.name}
                                    </option>
                                  ))}
                                </Select>
                              </td>
                              <td style={{ padding: '0.8rem' }}>
                                <span style={{
                                  background: 'linear-gradient(to right, #3498db)',
                                  color: 'white',
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '4px',
                                  fontSize: '0.8rem'
                                }}>
                                  {item.barcode || 'N/A'}
                                </span>
                              </td>
                              <td style={{ padding: '0.8rem' }}>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.unitPrice}
                                  onChange={(e) => handleRTOItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                  style={{ width: '100px' }}
                                />
                              </td>
                              <td style={{ padding: '0.8rem' }}>
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => handleRTOItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                                  style={{ width: '80px' }}
                                />
                              </td>
                              <td style={{ padding: '0.8rem', fontWeight: 'bold' }}>
                                ₹{(item.unitPrice * item.quantity).toFixed(2)}
                              </td>
                              <td style={{ padding: '0.8rem' }}>
                                <SecondaryButton
                                  type="button"
                                  onClick={() => handleRemoveRTOItem(index)}
                                  style={{
                                    background: '#e74c3c',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.3rem 0.8rem',
                                    fontSize: '0.8rem'
                                  }}
                                >
                                  <i className="bi bi-trash"></i>
                                </SecondaryButton>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr style={{ background: '#f8f9fa', fontWeight: 'bold' }}>
                            <td colSpan="4" style={{ padding: '0.8rem', textAlign: 'right' }}>
                              Total Return Amount:
                            </td>
                            <td style={{ padding: '0.8rem', fontSize: '1.1rem', color: '#e74c3c' }}>
                              ₹{rtoFormData.totalAmount.toFixed(2)}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ) : (
                    <div style={{
                      textAlign: 'center',
                      padding: '2rem',
                      background: '#f8f9fa',
                      borderRadius: '8px',
                      border: '2px dashed #dee2e6'
                    }}>
                      <i className="bi bi-box" style={{ fontSize: '2rem', color: '#6c757d', marginBottom: '1rem' }}></i>
                      <p style={{ color: '#6c757d', margin: 0 }}>No items added yet. Click "Add Item" to start.</p>
                    </div>
                  )}
                </div>

                {/* Comments */}
                <FormGroup>
                  <Label>Additional Comments</Label>
                  <TextArea
                    value={rtoFormData.comments}
                    onChange={(e) => handleRTOInputChange('comments', e.target.value)}
                    placeholder="Enter any additional notes about the return..."
                    rows="3"
                  />
                </FormGroup>
              </ModalBody>
              
              <ModalFooter>
                <SecondaryButton type="button" onClick={handleCloseRTOModal} disabled={loading}>
                  Cancel
                </SecondaryButton>
                <PrimaryButton 
                  type="submit" 
                  disabled={loading}
                  style={{ background: 'linear-gradient(to right, #e74c3c, #c0392b)' }}
                >
                  {loading ? (
                    <>
                      <i className="bi bi-arrow-clockwise spin" style={{ marginRight: '0.5rem' }}></i>
                      Processing...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle" style={{ marginRight: '0.5rem' }}></i>
                      Process Return
                    </>
                  )}
                </PrimaryButton>
              </ModalFooter>
            </form>
          </ModalContainer>
        </ModalOverlay>
      )}

      {/* RPU (Return Pick Up) Modal */}
      {showRPUModal && (
        <ModalOverlay onClick={handleCloseRPUModal}>
          <ModalContainer onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px' }}>
            <ModalHeader>
              <div>
                <ModalTitle>
                  <i className="bi bi-box-arrow-in-up" style={{ marginRight: '0.5rem' }}></i>
                  Return Pick Up (RPU)
                </ModalTitle>
                <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.2rem' }}>
                  Record customer return pickup (no inventory changes)
                </div>
              </div>
              <CloseButton onClick={handleCloseRPUModal}>
                <i className="bi bi-x"></i>
              </CloseButton>
            </ModalHeader>
            <form onSubmit={handleRPUSubmit}>
              <ModalBody>
                {/* Customer Information */}
                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ color: '#2c3e50', marginBottom: '1rem', borderBottom: '2px solid #e74c3c', paddingBottom: '0.5rem' }}>
                    Customer Information
                  </h4>
                  <FormGrid>
                    <FormGroup>
                      <Label>Pickup Date</Label>
                      <Input
                        type="date"
                        value={rpuFormData.returnDate}
                        onChange={(e) => handleRPUInputChange('returnDate', e.target.value)}
                        required
                      />
                    </FormGroup>
                    <FormGroup>
                      <Label>Customer Name</Label>
                      <Input
                        type="text"
                        value={rpuFormData.customerName}
                        onChange={(e) => handleRPUInputChange('customerName', e.target.value)}
                        placeholder="Enter customer name"
                        required
                      />
                    </FormGroup>
                    <FormGroup>
                      <Label>Customer Phone</Label>
                      <Input
                        type="tel"
                        value={rpuFormData.customerPhone}
                        onChange={(e) => handleRPUInputChange('customerPhone', e.target.value)}
                        placeholder="Enter phone number"
                      />
                    </FormGroup>
                    <FormGroup>
                      <Label>Customer Email</Label>
                      <Input
                        type="email"
                        value={rpuFormData.customerEmail}
                        onChange={(e) => handleRPUInputChange('customerEmail', e.target.value)}
                        placeholder="Enter email address"
                      />
                    </FormGroup>
                    <FormGroup>
                      <Label>Pickup Reason</Label>
                      <Select
                        value={rpuFormData.reason}
                        onChange={(e) => handleRPUInputChange('reason', e.target.value)}
                        required
                      >
                        <option value="">Select reason</option>
                        <option value="defective">Defective Product</option>
                        <option value="wrong_item">Wrong Item Delivered</option>
                        <option value="damaged">Damaged During Shipping</option>
                        <option value="not_satisfied">Customer Not Satisfied</option>
                        <option value="warranty_claim">Warranty Claim</option>
                        <option value="other">Other</option>
                      </Select>
                    </FormGroup>
                  </FormGrid>
                </div>

                {/* Item Scanner Section */}
                <div style={{ marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ color: '#2c3e50', margin: 0, borderBottom: '2px solid #e74c3c', paddingBottom: '0.5rem' }}>
                      Items to Process
                    </h4>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <ActionButton 
                        type="button" 
                        onClick={toggleRPUBarcodeMode}
                        style={{ 
                          fontSize: '0.8rem', 
                          padding: '0.3rem 0.8rem',
                          backgroundColor: rpuBarcodeMode ? '#e74c3c' : '#95a5a6',
                          color: 'white',
                          border: 'none'
                        }}
                      >
                        <i className={`bi bi-${rpuBarcodeMode ? 'keyboard' : 'upc-scan'}`} style={{ marginRight: '0.3rem' }}></i>
                        {rpuBarcodeMode ? 'Manual Entry' : 'Scan Mode'}
                      </ActionButton>
                      <ActionButton 
                        type="button" 
                        onClick={rpuScannerActive ? stopRPUScanner : startRPUScanner}
                        style={{ 
                          fontSize: '0.8rem', 
                          padding: '0.3rem 0.8rem',
                          backgroundColor: rpuScannerActive ? '#e74c3c' : '#27ae60',
                          color: 'white',
                          border: 'none'
                        }}
                      >
                        <i className={`bi bi-${rpuScannerActive ? 'stop-circle' : 'camera'}`} style={{ marginRight: '0.3rem' }}></i>
                        {rpuScannerActive ? 'Stop Camera' : 'Start Camera'}
                      </ActionButton>
                    </div>
                  </div>

                  {/* Scanner Container */}
                  {rpuScannerActive && (
                    <div style={{ 
                      marginBottom: '1rem', 
                      border: '2px solid #e74c3c', 
                      borderRadius: '8px', 
                      overflow: 'hidden',
                      position: 'relative'
                    }}>
                      <div 
                        ref={rpuScannerRef} 
                        style={{ 
                          width: '100%', 
                          height: '250px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#f8f9fa'
                        }}
                      />
                      <div style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        backgroundColor: 'rgba(231, 76, 60, 0.9)',
                        color: 'white',
                        padding: '0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.8rem'
                      }}>
                        <i className="bi bi-camera" style={{ marginRight: '0.3rem' }}></i>
                        RPU Scanner Active
                      </div>
                    </div>
                  )}

                  {/* Manual Barcode Input */}
                  {rpuBarcodeMode && (
                    <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <Input
                        ref={rpuBarcodeInputRef}
                        type="text"
                        value={rpuScannedCode}
                        onChange={(e) => setRPUScannedCode(e.target.value)}
                        placeholder="Enter or scan barcode..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addRPUBarcodeManually();
                          }
                        }}
                        style={{ flex: 1 }}
                      />
                      <ActionButton 
                        type="button" 
                        onClick={addRPUBarcodeManually}
                        style={{ 
                          padding: '0.5rem 1rem',
                          backgroundColor: '#e74c3c',
                          color: 'white',
                          border: 'none'
                        }}
                      >
                        <i className="bi bi-plus-circle" style={{ marginRight: '0.3rem' }}></i>
                        Add Item
                      </ActionButton>
                    </div>
                  )}

                  {/* Scanned Code Display */}
                  {rpuScannedCode && !rpuBarcodeMode && (
                    <div style={{
                      padding: '0.8rem',
                      backgroundColor: '#d4edda',
                      border: '1px solid #c3e6cb',
                      borderRadius: '4px',
                      marginBottom: '1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span>
                        <i className="bi bi-upc-scan" style={{ marginRight: '0.5rem', color: '#155724' }}></i>
                        Scanned: <strong>{rpuScannedCode}</strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* Items List */}
                <div style={{ marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h5 style={{ color: '#2c3e50', margin: 0 }}>Items ({rpuFormData.items.length})</h5>
                    <ActionButton 
                      type="button" 
                      onClick={handleAddRPUItem}
                      style={{ 
                        fontSize: '0.8rem', 
                        padding: '0.3rem 0.8rem',
                        backgroundColor: '#e74c3c',
                        color: 'white',
                        border: 'none'
                      }}
                    >
                      <i className="bi bi-plus" style={{ marginRight: '0.3rem' }}></i>
                      Add Item
                    </ActionButton>
                  </div>

                  {rpuFormData.items.length === 0 ? (
                    <div style={{
                      padding: '2rem',
                      textAlign: 'center',
                      backgroundColor: '#f8f9fa',
                      border: '2px dashed #dee2e6',
                      borderRadius: '8px',
                      color: '#6c757d'
                    }}>
                      <i className="bi bi-inbox" style={{ fontSize: '2rem', marginBottom: '1rem', display: 'block' }}></i>
                      <p style={{ margin: 0, fontSize: '0.9rem' }}>
                        No items added yet. Use the camera scanner or add items manually.
                      </p>
                    </div>
                  ) : (
                    <div style={{ 
                      border: '1px solid #e0e0e0', 
                      borderRadius: '8px',
                      maxHeight: '300px',
                      overflowY: 'auto'
                    }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ backgroundColor: '#f8f9fa', position: 'sticky', top: 0 }}>
                          <tr>
                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e0e0e0', fontSize: '0.85rem', fontWeight: '600' }}>Product</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #e0e0e0', fontSize: '0.85rem', fontWeight: '600', width: '100px' }}>Barcode</th>
                            <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #e0e0e0', fontSize: '0.85rem', fontWeight: '600', width: '80px' }}>Qty</th>
                            <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #e0e0e0', fontSize: '0.85rem', fontWeight: '600', width: '100px' }}>Unit Price</th>
                            <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #e0e0e0', fontSize: '0.85rem', fontWeight: '600', width: '100px' }}>Total</th>
                            <th style={{ padding: '0.75rem', textAlign: 'center', borderBottom: '1px solid #e0e0e0', fontSize: '0.85rem', fontWeight: '600', width: '50px' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rpuFormData.items.map((item, index) => (
                            <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                              <td style={{ padding: '0.75rem' }}>
                                <select
                                  value={item.product}
                                  onChange={(e) => handleRPUProductSelect(index, e.target.value)}
                                  style={{
                                    width: '100%',
                                    padding: '0.4rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '0.85rem'
                                  }}
                                  required
                                >
                                  <option value="">Select Product</option>
                                  {products.map(product => (
                                    <option key={product._id} value={product._id}>
                                      {product.name}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#666' }}>
                                {item.barcode || '-'}
                              </td>
                              <td style={{ padding: '0.75rem' }}>
                                <input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => handleRPUItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                                  min="1"
                                  style={{
                                    width: '60px',
                                    padding: '0.4rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    textAlign: 'center',
                                    fontSize: '0.85rem'
                                  }}
                                  required
                                />
                              </td>
                              <td style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.85rem' }}>
                                ${(item.unitPrice || 0).toFixed(2)}
                              </td>
                              <td style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.85rem', fontWeight: '600' }}>
                                ${((item.unitPrice || 0) * (item.quantity || 0)).toFixed(2)}
                              </td>
                              <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveRPUItem(index)}
                                  style={{
                                    padding: '0.3rem',
                                    backgroundColor: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem'
                                  }}
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Total Section */}
                      <div style={{
                        padding: '1rem',
                        backgroundColor: '#f8f9fa',
                        borderTop: '2px solid #e0e0e0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{ fontSize: '1rem', fontWeight: '600', color: '#2c3e50' }}>
                          Total Amount:
                        </span>
                        <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#e74c3c' }}>
                          ${rpuFormData.totalAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Comments Section */}
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ color: '#2c3e50', marginBottom: '1rem', borderBottom: '2px solid #e74c3c', paddingBottom: '0.5rem' }}>
                    Additional Notes
                  </h4>
                  <FormGroup>
                    <Label>Comments/Notes</Label>
                    <textarea
                      value={rpuFormData.comments}
                      onChange={(e) => handleRPUInputChange('comments', e.target.value)}
                      placeholder="Additional notes about the pickup..."
                      style={{
                        width: '100%',
                        minHeight: '80px',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '0.9rem',
                        fontFamily: 'inherit',
                        resize: 'vertical'
                      }}
                    />
                  </FormGroup>
                </div>

                {/* Info Alert */}
                <div style={{
                  padding: '1rem',
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffeaa7',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <i className="bi bi-info-circle-fill" style={{ 
                    color: '#856404', 
                    fontSize: '1.2rem', 
                    marginRight: '0.75rem',
                    flexShrink: 0
                  }}></i>
                  <div style={{ fontSize: '0.9rem', color: '#856404' }}>
                    <strong>Note:</strong> RPU (Return Pick Up) only records the transaction. 
                    Product inventory quantities will <strong>NOT</strong> be modified during this process.
                  </div>
                </div>
              </ModalBody>

              <ModalFooter>
                <SecondaryButton type="button" onClick={handleCloseRPUModal}>
                  <i className="bi bi-x-circle" style={{ marginRight: '0.5rem' }}></i>
                  Cancel
                </SecondaryButton>
                <PrimaryButton 
                  type="submit" 
                  disabled={loading || rpuFormData.items.length === 0}
                  style={{ backgroundColor: '#e74c3c', borderColor: '#c0392b' }}
                >
                  {loading ? (
                    <>
                      <i className="bi bi-arrow-clockwise spin" style={{ marginRight: '0.5rem' }}></i>
                      Recording...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-box-arrow-in-up" style={{ marginRight: '0.5rem' }}></i>
                      Record Pickup
                    </>
                  )}
                </PrimaryButton>
              </ModalFooter>
            </form>
          </ModalContainer>
        </ModalOverlay>
      )}
    </PageContainer>
  );
};

export default Products;