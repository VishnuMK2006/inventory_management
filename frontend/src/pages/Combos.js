import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Button,
  Table,
  Modal,
  Form,
  Alert,
  Card,
  Badge,
  Spinner,
  Toast,
  ToastContainer,
  Tabs,
  Tab
} from 'react-bootstrap';
import { combosAPI, productsAPI, productMastersAPI, barcodesAPI, categoriesAPI } from '../services/api';
import styled, { keyframes } from 'styled-components';

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const slideIn = keyframes`
  from { transform: translateX(-30px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

// Styled Components
const StyledContainer = styled(Container)`
  padding: 2rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
`;

const AnimatedContainer = styled.div`
  animation: ${fadeIn} 0.6s ease-out;
`;

const HeaderSection = styled.div`
  background: white;
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
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    
    th {
      color: white;
      border: none;
      padding: 1.2rem;
      font-weight: 600;
    }
  }
  
  tbody tr {
    transition: all 0.3s ease;
    
    &:hover {
      background-color: #f8f9fa;
      transform: translateX(5px);
    }
    
    td {
      padding: 1rem;
      border-color: #e9ecef;
      vertical-align: middle;
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
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.2);
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
  }
`;

const DangerButton = styled(Button)`
  border-radius: 20px;
  padding: 0.5rem 1rem;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);
  }
`;

const StyledModal = styled(Modal)`
  .modal-content {
    border-radius: 20px;
    border: none;
    box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  }
  
  .modal-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 20px 20px 0 0;
    border: none;
    
    .btn-close {
      filter: invert(1);
    }
  }
`;

const FormGroup = styled(Form.Group)`
  margin-bottom: 1rem;
  
  .form-label {
    font-weight: 600;
    color: #4a5568;
    margin-bottom: 0.5rem;
  }
  
  .form-control, .form-select {
    border-radius: 10px;
    border: 2px solid #e2e8f0;
    padding: 0.75rem;
    transition: all 0.3s ease;
    
    &:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
    }
  }
`;

const ProductCard = styled(Card)`
  border: 2px solid #e2e8f0;
  border-radius: 15px;
  transition: all 0.3s ease;
  margin-bottom: 1rem;
  
  &:hover {
    border-color: #667eea;
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  }
`;

const LoadingSpinner = styled(Spinner)`
  color: #667eea;
`;

const GlobalStyle = styled.div`
  .hover-edit:hover {
    background-color: #f8f9fa;
    border: 1px dashed #667eea;
  }
`;

const Combos = () => {
  const [combos, setCombos] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCombo, setSelectedCombo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editMode, setEditMode] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState([]);

  // Excel upload
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  // Checkbox selection for barcode download
  const [selectedCombos, setSelectedCombos] = useState([]);
  const [isDownloadingBarcodes, setIsDownloadingBarcodes] = useState(false);

  // Editable upload data
  const [editingCell, setEditingCell] = useState(null);
  const [editableData, setEditableData] = useState([]);

  // Add Item modal
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [selectedComboForItem, setSelectedComboForItem] = useState(null);
  const [itemProduct, setItemProduct] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    barcode: '',
    category: '',
    products: [],
    image: null
  });

  // Product selection for combo
  const [selectedProduct, setSelectedProduct] = useState('');
  const [productQuantity, setProductQuantity] = useState(1);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchCombos(),
        fetchProducts(),
        fetchCategories()
      ]);
    } catch (error) {
      showError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCombos = async () => {
    try {
      console.log('Fetching combos...');
      const response = await combosAPI.getAll();
      console.log('Combos response:', response.data);
      setCombos(response.data || []);
      if (response.data?.length > 0) {
        showSuccess(`Loaded ${response.data.length} combos`);
      }
    } catch (error) {
      console.error('Failed to fetch combos:', error);
      showError('Failed to load combos');
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productsAPI.getAll();
      setProducts(response.data || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };



  // Toast helper functions
  const showToast = (message, variant = 'success') => {
    const id = Date.now();
    const toast = {
      id,
      message,
      variant,
      show: true
    };
    
    setToasts(prev => [...prev, toast]);
    
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showSuccess = (message) => showToast(message, 'success');
  const showError = (message) => showToast(message, 'danger');

  const handleShowModal = () => {
    setShowModal(true);
    setEditMode(false);
    setFormData({
      name: '',
      description: '',
      barcode: '',
      category: '',
      products: [],
      image: null
    });
    setSelectedProduct('');
    setProductQuantity(1);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditMode(false);
    setError('');
    setSuccess('');
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setFormData(prev => ({
      ...prev,
      image: file
    }));
  };

  const handleAddProduct = () => {
    if (!selectedProduct || productQuantity < 1) {
      showError('Please select a product and enter a valid quantity');
      return;
    }

    const product = products.find(p => p._id === selectedProduct);
    if (!product) {
      showError('Selected product not found');
      return;
    }

    // Check if there's enough stock
    if (product.quantity < productQuantity) {
      showError(`Insufficient stock! Only ${product.quantity} units available, but you're trying to add ${productQuantity}`);
      return;
    }

    // Check if product is out of stock
    if (product.quantity === 0) {
      showError('Cannot add out-of-stock product to combo');
      return;
    }

    // Check if product is already added
    const existingProductIndex = formData.products.findIndex(
      p => p.product._id === selectedProduct
    );

    setFormData(prev => {
      let updatedProducts = [...prev.products];

      if (existingProductIndex !== -1) {
        // Update quantity if product already exists
        updatedProducts[existingProductIndex] = {
          ...updatedProducts[existingProductIndex],
          quantity: updatedProducts[existingProductIndex].quantity + productQuantity
        };
      } else {
        // Add new product
        updatedProducts.push({
          product: product,
          quantity: productQuantity
        });
      }

      return {
        ...prev,
        products: updatedProducts
      };
    });

    // Reset selection
    setSelectedProduct('');
    setProductQuantity(1);
    showSuccess(`${product.name} added to combo`);
  };

  const handleRemoveProduct = (index) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter((_, i) => i !== index)
    }));
    showSuccess('Product removed from combo');
  };

  const handleUpdateProductQuantity = (index, newQuantity) => {
    if (newQuantity < 1) return;

    setFormData(prev => {
      const updatedProducts = [...prev.products];
      updatedProducts[index] = {
        ...updatedProducts[index],
        quantity: newQuantity
      };
      return {
        ...prev,
        products: updatedProducts
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.barcode) {
      showError('Name and barcode are required');
      return;
    }

    if (formData.products.length === 0) {
      showError('Please add at least one product to the combo');
      return;
    }

    try {
      setLoading(true);
      
      const calculatedPrice = calculateComboValue();
      
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description || '');
      formDataToSend.append('barcode', formData.barcode);
      formDataToSend.append('price', calculatedPrice.toString());
      
      if (formData.category) {
        formDataToSend.append('category', formData.category);
      }
      
      // Add products data
      formDataToSend.append('products', JSON.stringify(
        formData.products.map(p => ({
          product: p.product._id,
          quantity: p.quantity
        }))
      ));

      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }

      // Debug: Log what we're sending
      console.log('FormData contents:');
      for (let [key, value] of formDataToSend.entries()) {
        console.log(key, ':', value);
      }

      if (editMode && selectedCombo) {
        await combosAPI.update(selectedCombo._id, formDataToSend);
        showSuccess('Combo updated successfully');
      } else {
        await combosAPI.create(formDataToSend);
        showSuccess('Combo created successfully');
      }

      handleCloseModal();
      fetchCombos();
    } catch (error) {
      console.error('Submit error:', error);
      showError(error.response?.data?.message || 'Failed to save combo');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (combo) => {
    setSelectedCombo(combo);
    setEditMode(true);
    setFormData({
      name: combo.name,
      description: combo.description || '',
      barcode: combo.barcode,
      category: combo.category?._id || combo.category || '',
      products: combo.products || [],
      image: null
    });
    setShowModal(true);
  };

  const handleView = (combo) => {
    setSelectedCombo(combo);
    setShowViewModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this combo?')) {
      try {
        setLoading(true);
        await combosAPI.delete(id);
        showSuccess('Combo deleted successfully');
        fetchCombos();
      } catch (error) {
        showError('Failed to delete combo');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAddItem = (combo) => {
    setSelectedComboForItem(combo);
    setItemProduct('');
    setItemQuantity(1);
    setShowAddItemModal(true);
  };

  const handleCloseAddItemModal = () => {
    setShowAddItemModal(false);
    setSelectedComboForItem(null);
    setItemProduct('');
    setItemQuantity(1);
  };

  const handleSaveItem = async () => {
    if (!itemProduct || itemQuantity < 1) {
      showError('Please select a product and enter valid quantity');
      return;
    }

    const product = products.find(p => p._id === itemProduct);
    if (!product) {
      showError('Selected product not found');
      return;
    }

    // Check if there's enough stock
    if (product.quantity < itemQuantity) {
      showError(`Insufficient stock! Only ${product.quantity} units available, but you're trying to add ${itemQuantity}`);
      return;
    }

    // Check if product is out of stock
    if (product.quantity === 0) {
      showError('Cannot add out-of-stock product to combo');
      return;
    }

    try {
      setLoading(true);
      const response = await combosAPI.addProduct(selectedComboForItem._id, {
        product: itemProduct,
        quantity: itemQuantity
      });
      
      showSuccess('Product added to combo successfully!');
      handleCloseAddItemModal();
      // Force refresh the combos list
      await fetchCombos();
    } catch (error) {
      console.error('Add product error:', error);
      showError(error.response?.data?.message || 'Failed to add product to combo');
    } finally {
      setLoading(false);
    }
  };

  const calculateComboValue = () => {
    return formData.products.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);
  };

  // Excel Upload Handlers
  const handleShowUploadModal = () => {
    setShowUploadModal(true);
    setUploadFile(null);
    setUploadResult(null);
  };

  const handleCloseUploadModal = () => {
    setShowUploadModal(false);
    setUploadFile(null);
    setUploadResult(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileExtension = file.name.split('.').pop().toLowerCase();
      if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        setUploadFile(file);
      } else {
        showError('Please select a valid Excel file (.xlsx or .xls)');
        e.target.value = null;
      }
    }
  };

  const handleUploadExcel = async () => {
    if (!uploadFile) {
      showError('Please select a file to upload');
      return;
    }

    try {
      setUploadLoading(true);
      const response = await productMastersAPI.uploadExcel(uploadFile);
      setUploadResult(response.data);
      setEditableData(response.data.processedData || []);
      showSuccess(
        `✅ Processed ${response.data.successCount} records! ` +
        `Categories: ${response.data.categoriesCreated}, ` +
        `New Combos: ${response.data.combosCreated}, ` +
        `Updated: ${response.data.combosUpdated}`
      );
      
      // Refresh data after upload
      await fetchCombos();
    } catch (error) {
      console.error('Upload error:', error);
      showError(error.response?.data?.message || 'Failed to upload Excel file');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleGenerateAllBarcodes = async () => {
    if (!uploadResult?.processedData?.length) {
      showError('No processed data available for barcode generation');
      return;
    }

    try {
      setUploadLoading(true);
      
      // Get all combo IDs from the processed data
      const comboIds = uploadResult.processedData
        .map(item => item.comboId)
        .filter(id => id); // Filter out any undefined IDs
      
      if (comboIds.length === 0) {
        showError('No valid combo IDs found for barcode generation');
        return;
      }

      const response = await barcodesAPI.downloadComboBarcodes(comboIds);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `uploaded-combos-barcodes-${Date.now()}.zip`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      showSuccess(`Generated and downloaded ${comboIds.length} barcodes successfully!`);
    } catch (error) {
      console.error('Barcode generation error:', error);
      showError('Failed to generate barcodes for uploaded products');
    } finally {
      setUploadLoading(false);
    }
  };

  // EditableRow component
  const EditableRow = ({ item, index }) => {
    const [localData, setLocalData] = useState({
      sNo: item.sNo || index + 1,
      category: item.category || '',
      comboCode: item.comboCode || '',
      comboName: item.comboName || '',
      price: item.price || 0,
      priceWithGST: item.priceWithGST || (item.price ? (item.price * 1.18) : 0)
    });

    const handleCellEdit = (field, value) => {
      const updatedData = { ...localData, [field]: value };
      if (field === 'price') {
        updatedData.priceWithGST = parseFloat(value) * 1.18;
      }
      setLocalData(updatedData);
    };

    const handleCellClick = (field) => {
      setEditingCell(`${index}-${field}`);
    };

    const handleCellBlur = () => {
      setEditingCell(null);
    };

    const renderEditableCell = (field, value) => {
      const isEditing = editingCell === `${index}-${field}`;
      
      if (isEditing) {
        return (
          <Form.Control
            size="sm"
            type={field === 'price' ? 'number' : 'text'}
            value={value || ''}
            onChange={(e) => handleCellEdit(field, e.target.value)}
            onBlur={handleCellBlur}
            onKeyPress={(e) => e.key === 'Enter' && handleCellBlur()}
            autoFocus
            style={{ minWidth: '100px' }}
          />
        );
      }
      
      const displayValue = field === 'price' || field === 'priceWithGST' 
        ? `₹${parseFloat(value || 0).toFixed(2)}` 
        : String(value || '');
      
      return (
        <span 
          onClick={() => handleCellClick(field)}
          style={{ cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
          className="hover-edit"
        >
          {displayValue}
        </span>
      );
    };

    return (
      <tr>
        <td>{renderEditableCell('sNo', localData.sNo)}</td>
        <td>{renderEditableCell('category', localData.category)}</td>
        <td>
          <Badge bg="info">
            <span>{renderEditableCell('comboCode', localData.comboCode)}</span>
          </Badge>
        </td>
        <td>{renderEditableCell('comboName', localData.comboName)}</td>
        <td>{renderEditableCell('price', localData.price)}</td>
        <td>{renderEditableCell('priceWithGST', localData.priceWithGST)}</td>
      </tr>
    );
  };



  // Checkbox handlers for barcode download
  const handleSelectCombo = (comboId) => {
    setSelectedCombos(prev => 
      prev.includes(comboId) 
        ? prev.filter(id => id !== comboId)
        : [...prev, comboId]
    );
  };

  const handleSelectAllCombos = (checked) => {
    if (checked) {
      setSelectedCombos(combos.map(combo => combo._id));
    } else {
      setSelectedCombos([]);
    }
  };

  const handleDownloadBarcodes = async () => {
    if (selectedCombos.length === 0) {
      showError('Please select at least one combo');
      return;
    }

    try {
      setIsDownloadingBarcodes(true);
      const response = await barcodesAPI.downloadComboBarcodes(selectedCombos);
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      if (selectedCombos.length === 1) {
        const combo = combos.find(c => c._id === selectedCombos[0]);
        link.setAttribute('download', `barcode-${combo?.barcode || 'combo'}.png`);
      } else {
        link.setAttribute('download', `combo-barcodes-${Date.now()}.zip`);
      }
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      showSuccess(`Downloaded ${selectedCombos.length} barcode(s) successfully!`);
      setSelectedCombos([]);
    } catch (error) {
      console.error('Download error:', error);
      showError('Failed to download barcodes');
    } finally {
      setIsDownloadingBarcodes(false);
    }
  };

  return (
    <GlobalStyle>
    <StyledContainer>
      <AnimatedContainer>
        <HeaderSection>
          <Row className="align-items-center">
            <Col>
              <h2 className="mb-0 d-flex align-items-center">
                <span style={{ fontSize: '2rem', marginRight: '1rem' }}>📦</span>
                Combo Management
              </h2>
              <p className="text-muted mb-0 mt-2">Manage product combinations and bundles</p>
            </Col>
            <Col xs="auto" className="d-flex gap-2">
              {selectedCombos.length > 0 && (
                <SecondaryButton 
                  onClick={handleDownloadBarcodes}
                  disabled={isDownloadingBarcodes}
                >
                  {isDownloadingBarcodes ? (
                    <>
                      <LoadingSpinner size="sm" className="me-2" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      📥 Download Barcodes ({selectedCombos.length})
                    </>
                  )}
                </SecondaryButton>
              )}
              <SecondaryButton onClick={handleShowUploadModal}>
                📤 Upload Excel
              </SecondaryButton>
              <PrimaryButton onClick={handleShowModal}>
                ✨ Add New Combo
              </PrimaryButton>
            </Col>
          </Row>
        </HeaderSection>

        {/* Toast Notifications */}
        <ToastContainer position="top-end" className="p-3">
          {toasts.map(toast => (
            <Toast
              key={toast.id}
              show={toast.show}
              onClose={() => removeToast(toast.id)}
              bg={toast.variant}
              text={toast.variant === 'danger' ? 'white' : 'dark'}
            >
              <Toast.Header>
                <strong className="me-auto">
                  {toast.variant === 'success' ? '✅ Success' : '❌ Error'}
                </strong>
              </Toast.Header>
              <Toast.Body>{toast.message}</Toast.Body>
            </Toast>
          ))}
        </ToastContainer>

        {loading && combos.length === 0 ? (
          <div className="d-flex justify-content-center align-items-center" style={{minHeight: '200px'}}>
            <LoadingSpinner animation="border" size="lg" />
          </div>
        ) : (
          <StyledTable responsive hover>
                <thead>
                  <tr>
                    <th>
                      <Form.Check
                        type="checkbox"
                        checked={selectedCombos.length === combos.length && combos.length > 0}
                        onChange={(e) => handleSelectAllCombos(e.target.checked)}
                      />
                    </th>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Barcode</th>
                    <th>Category</th>
                    <th>Products</th>
                    <th>Available</th>
                    <th>Price</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {combos.map((combo) => (
                    <tr key={combo._id}>
                      <td>
                        <Form.Check
                          type="checkbox"
                          checked={selectedCombos.includes(combo._id)}
                          onChange={() => handleSelectCombo(combo._id)}
                        />
                      </td>
                      <td>
                        {combo.imageUrl ? (
                          <img
                            src={combo.imageUrl}
                            alt={combo.name}
                            style={{
                              width: '50px',
                              height: '50px',
                              objectFit: 'cover',
                              borderRadius: '8px'
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '50px',
                              height: '50px',
                              backgroundColor: '#f8f9fa',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            📦
                          </div>
                        )}
                      </td>
                      <td>
                        <div>
                          <strong>{combo.name}</strong>
                          {combo.description && (
                            <div>
                              <small className="text-muted">{combo.description}</small>
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <Badge bg="info" className="px-3 py-2">
                          {combo.barcode}
                        </Badge>
                      </td>
                      <td>
                        {combo.category ? (
                          <Badge bg="secondary" className="px-2 py-1">
                            {typeof combo.category === 'object' ? combo.category.name : combo.category}
                          </Badge>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        <div className="d-flex flex-column gap-1">
                          <Badge bg="info">
                            {combo.products?.length || 0} items
                          </Badge>
                          {combo.productDetails && combo.productDetails.some(p => p.stockStatus === 'insufficient' || p.stockStatus === 'out-of-stock') && (
                            <Badge bg="warning" style={{fontSize: '0.7rem'}}>
                              ⚠️ Stock Issues
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex flex-column gap-1">
                          <Badge bg={combo.availableCount > 0 ? 'success' : 'danger'}>
                            {combo.availableCount || 0} available
                          </Badge>
                          {combo.productDetails && (
                            <small className="text-muted" style={{fontSize: '0.75rem'}}>
                              {combo.productDetails.filter(p => p.stockStatus === 'available').length}/{combo.productDetails.length} products OK
                            </small>
                          )}
                        </div>
                      </td>
                      <td>
                        <strong className="text-success">₹{combo.price?.toFixed(2) || '0.00'}</strong>
                      </td>
                      <td>
                        <div className="d-flex gap-1 flex-wrap">
                          <SecondaryButton
                            size="sm"
                            onClick={() => handleAddItem(combo)}
                          >
                            ➕ Add Item
                          </SecondaryButton>
                          <SecondaryButton
                            size="sm"
                            onClick={() => handleView(combo)}
                          >
                            👁️ View
                          </SecondaryButton>
                          <SecondaryButton
                            size="sm"
                            onClick={() => handleEdit(combo)}
                          >
                            ✏️ Edit
                          </SecondaryButton>
                          <DangerButton
                            size="sm"
                            variant="outline-danger"
                            onClick={() => handleDelete(combo._id)}
                          >
                            🗑️ Delete
                          </DangerButton>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </StyledTable>
        )}

        {/* Add/Edit Combo Modal */}
        <StyledModal show={showModal} onHide={handleCloseModal} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>
              {editMode ? '✏️ Edit Combo' : '✨ Add New Combo'}
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit}>
            <Modal.Body>
              <Row>
                <Col md={6}>
                  <FormGroup>
                    <Form.Label>Combo Name *</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter combo name"
                      required
                    />
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Form.Label>Barcode *</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.barcode}
                      onChange={(e) => handleInputChange('barcode', e.target.value)}
                      placeholder="Enter barcode (e.g., EW00L002)"
                      required
                    />
                  </FormGroup>
                </Col>
              </Row>

              <FormGroup>
                <Form.Label>Category</Form.Label>
                <Form.Select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                >
                  <option value="">Select a category...</option>
                  {categories.map(category => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </Form.Select>
              </FormGroup>

              <FormGroup>
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter combo description"
                />
              </FormGroup>

              <Row>
                <Col md={6}>
                  <FormGroup>
                    <Form.Label>Auto-Calculated Price *</Form.Label>
                    <Form.Control
                      type="text"
                      value={`₹${calculateComboValue().toFixed(2)}`}
                      disabled
                      style={{
                        backgroundColor: '#e9ecef',
                        fontWeight: 'bold',
                        fontSize: '1.1rem',
                        color: '#28a745'
                      }}
                    />
                    <Form.Text className="text-muted">
                      Price is automatically calculated based on selected products
                    </Form.Text>
                  </FormGroup>
                </Col>
                <Col md={6}>
                  <FormGroup>
                    <Form.Label>Combo Image</Form.Label>
                    <Form.Control
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </FormGroup>
                </Col>
              </Row>

              <hr />

              <h5 className="mb-3">📋 Products in Combo</h5>

              {/* Add Product Section */}
              <ProductCard>
                <Card.Body>
                  <h6 className="mb-3">➕ Add Product to Combo</h6>
                  <Row>
                    <Col md={6}>
                      <FormGroup>
                        <Form.Label>Select Product</Form.Label>
                        <Form.Select
                          value={selectedProduct}
                          onChange={(e) => setSelectedProduct(e.target.value)}
                        >
                          <option value="">Choose a product...</option>
                          {products.map(product => {
                            const stockStatus = product.quantity === 0 ? ' - OUT OF STOCK' : 
                                              product.quantity < 10 ? ' - LOW STOCK' : '';
                            return (
                              <option 
                                key={product._id} 
                                value={product._id}
                                disabled={product.quantity === 0}
                              >
                                {product.name} - ₹{product.price} (Available: {product.quantity}){stockStatus}
                              </option>
                            );
                          })}
                        </Form.Select>
                        {selectedProduct && (
                          <Form.Text className="text-muted">
                            {(() => {
                              const selectedProd = products.find(p => p._id === selectedProduct);
                              if (!selectedProd) return '';
                              return selectedProd.quantity === 0 ? '❌ This product is out of stock' :
                                     selectedProd.quantity < 10 ? `⚠️ Low stock warning: Only ${selectedProd.quantity} units available` :
                                     `✅ ${selectedProd.quantity} units available in stock`;
                            })()} 
                          </Form.Text>
                        )}
                      </FormGroup>
                    </Col>
                    <Col md={4}>
                      <FormGroup>
                        <Form.Label>Quantity</Form.Label>
                        <Form.Control
                          type="number"
                          min="1"
                          max={selectedProduct ? products.find(p => p._id === selectedProduct)?.quantity || 1 : undefined}
                          value={productQuantity}
                          onChange={(e) => setProductQuantity(parseInt(e.target.value) || 1)}
                        />
                        {selectedProduct && productQuantity > 0 && (
                          <Form.Text className="text-muted">
                            {(() => {
                              const selectedProd = products.find(p => p._id === selectedProduct);
                              if (!selectedProd) return '';
                              const remaining = selectedProd.quantity - productQuantity;
                              return remaining >= 0 ? 
                                `After adding: ${remaining} units will remain in stock` :
                                `⚠️ Warning: Not enough stock! Need ${Math.abs(remaining)} more units`;
                            })()} 
                          </Form.Text>
                        )}
                      </FormGroup>
                    </Col>
                    <Col md={2} className="d-flex align-items-end">
                      <PrimaryButton
                        type="button"
                        onClick={handleAddProduct}
                        style={{ borderRadius: '10px' }}
                      >
                        ➕ Add
                      </PrimaryButton>
                    </Col>
                  </Row>
                </Card.Body>
              </ProductCard>

              {/* Selected Products List */}
              {formData.products.length > 0 && (
                <div className="mt-3">
                  <h6 className="mb-3">📦 Selected Products ({formData.products.length})</h6>
                  
                  <Table bordered responsive className="mb-3">
                    <thead className="bg-light">
                      <tr>
                        <th>Product</th>
                        <th>Unit Price</th>
                        <th>Quantity</th>
                        <th>Total</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.products.map((item, index) => (
                        <tr key={index}>
                          <td>
                            <div>
                              <strong>{item.product.name}</strong>
                              <div>
                                <small className="text-muted">
                                  Barcode: {item.product.barcode}
                                </small>
                              </div>
                              <div>
                                <small className={`text-${item.product.quantity >= item.quantity ? 'success' : 'danger'}`}>
                                  Stock: {item.product.quantity} 
                                  {item.product.quantity < item.quantity && ' ⚠️ Insufficient!'}
                                </small>
                              </div>
                            </div>
                          </td>
                          <td>₹{item.product.price?.toFixed(2)}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => handleUpdateProductQuantity(index, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                              >
                                -
                              </Button>
                              <span className="mx-2 fw-bold">{item.quantity}</span>
                              <Button
                                variant="outline-secondary"
                                size="sm"
                                onClick={() => handleUpdateProductQuantity(index, item.quantity + 1)}
                              >
                                +
                              </Button>
                            </div>
                          </td>
                          <td>₹{(item.product.price * item.quantity).toFixed(2)}</td>
                          <td>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleRemoveProduct(index)}
                            >
                              🗑️ Remove
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="table-info">
                        <td colSpan="3"><strong>Total Product Value:</strong></td>
                        <td><strong>₹{calculateComboValue().toFixed(2)}</strong></td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </Table>

                  {calculateComboValue() > 0 && (
                    <div className="alert alert-success">
                      <strong>💰 Combo Total Value:</strong>
                      <br />
                      <span className="fs-5 fw-bold text-success">
                        ₹{calculateComboValue().toFixed(2)}
                      </span>
                      <br />
                      <small className="text-muted">
                        This is the total price customers will pay for this combo package.
                      </small>
                    </div>
                  )}
                </div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <SecondaryButton type="button" onClick={handleCloseModal}>
                Cancel
              </SecondaryButton>
              <PrimaryButton type="submit" disabled={loading}>
                {loading ? <LoadingSpinner size="sm" className="me-2" /> : null}
                {editMode ? 'Update Combo' : 'Create Combo'}
              </PrimaryButton>
            </Modal.Footer>
          </Form>
        </StyledModal>

        {/* View Combo Modal */}
        <StyledModal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>📦 Combo Details</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedCombo && (
              <div>
                <Row className="mb-4">
                  <Col md={4} className="text-center">
                    {selectedCombo.imageUrl ? (
                      <img
                        src={selectedCombo.imageUrl}
                        alt={selectedCombo.name}
                        className="img-fluid rounded"
                        style={{ maxHeight: '200px' }}
                      />
                    ) : (
                      <div
                        className="bg-light rounded d-flex align-items-center justify-content-center"
                        style={{ height: '200px' }}
                      >
                        <span style={{ fontSize: '4rem' }}>📦</span>
                      </div>
                    )}
                  </Col>
                  <Col md={8}>
                    <h3>{selectedCombo.name}</h3>
                    <p className="text-muted">{selectedCombo.description}</p>
                    <div className="mb-2">
                      <Badge bg="info" className="me-2 px-3 py-2">
                        Barcode: {selectedCombo.barcode}
                      </Badge>
                      <Badge bg="success" className="px-3 py-2">
                        Price: ₹{selectedCombo.price?.toFixed(2)}
                      </Badge>
                    </div>
                  </Col>
                </Row>

                <h5 className="mb-3">📋 Products in this Combo</h5>
                {selectedCombo.products && selectedCombo.products.length > 0 ? (
                  <>
                    <div className="mb-3">
                      <Badge bg={selectedCombo.availableCount > 0 ? 'success' : 'danger'} className="px-3 py-2">
                        {selectedCombo.availableCount > 0 
                          ? `✅ ${selectedCombo.availableCount} combos can be made` 
                          : '❌ Cannot make combo - insufficient stock'
                        }
                      </Badge>
                    </div>
                    <Table striped bordered>
                      <thead>
                        <tr>
                          <th>Product Name</th>
                          <th>Barcode</th>
                          <th>Unit Price</th>
                          <th>Required Qty</th>
                          <th>Available Stock</th>
                          <th>Can Make</th>
                          <th>Status</th>
                          <th>Total Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedCombo.productDetails || selectedCombo.products).map((item, index) => {
                          const productDetail = selectedCombo.productDetails ? item : {
                            ...item,
                            availableStock: item.product?.quantity || 0,
                            canMake: item.product?.quantity ? Math.floor(item.product.quantity / item.quantity) : 0,
                            stockStatus: !item.product?.quantity ? 'out-of-stock' : 
                                       item.product.quantity < item.quantity ? 'insufficient' : 'available'
                          };
                          
                          const getStatusBadge = (status) => {
                            switch(status) {
                              case 'available': return <Badge bg="success">✅ Available</Badge>;
                              case 'insufficient': return <Badge bg="warning">⚠️ Low Stock</Badge>;
                              case 'out-of-stock': return <Badge bg="danger">❌ Out of Stock</Badge>;
                              case 'unavailable': return <Badge bg="secondary">❓ Unavailable</Badge>;
                              default: return <Badge bg="secondary">Unknown</Badge>;
                            }
                          };
                          
                          return (
                            <tr key={index} className={productDetail.stockStatus === 'out-of-stock' ? 'table-danger' : 
                                                      productDetail.stockStatus === 'insufficient' ? 'table-warning' : ''}>
                              <td>{productDetail.product?.name || 'N/A'}</td>
                              <td>
                                <Badge bg="info">{productDetail.product?.barcode || 'N/A'}</Badge>
                              </td>
                              <td>₹{productDetail.product?.price?.toFixed(2) || '0.00'}</td>
                              <td>
                                <Badge bg="primary">{productDetail.quantity}</Badge>
                              </td>
                              <td>
                                <Badge bg={productDetail.availableStock > 0 ? 'success' : 'danger'}>
                                  {productDetail.availableStock}
                                </Badge>
                              </td>
                              <td>
                                <Badge bg={productDetail.canMake > 0 ? 'success' : 'danger'}>
                                  {productDetail.canMake} combos
                                </Badge>
                              </td>
                              <td>{getStatusBadge(productDetail.stockStatus)}</td>
                              <td>₹{((productDetail.product?.price || 0) * productDetail.quantity).toFixed(2)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="table-info">
                          <td colSpan="7"><strong>Total Combo Value:</strong></td>
                          <td><strong>₹{selectedCombo.price?.toFixed(2) || '0.00'}</strong></td>
                        </tr>
                      </tfoot>
                    </Table>
                  </>
                ) : (
                  <Alert variant="info">No products found in this combo.</Alert>
                )}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <SecondaryButton onClick={() => setShowViewModal(false)}>
              Close
            </SecondaryButton>
          </Modal.Footer>
        </StyledModal>

        {/* Excel Upload Modal */}
        <StyledModal show={showUploadModal} onHide={handleCloseUploadModal} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>📤 Upload Product Master Excel File</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Alert variant="info">
              <strong>📋 Excel File Processing:</strong>
              <ul className="mb-0 mt-2">
                <li><strong>Product Category</strong> → Stored in <Badge bg="secondary">Category DB</Badge></li>
                <li><strong>Selling Product Code, Product Name, Price</strong> → Stored in <Badge bg="primary">Combo DB</Badge></li>
                <li>✅ Category & Combo are <strong>automatically mapped</strong></li>
                <li>⏳ Products remain <strong>unmapped</strong> (manual mapping required)</li>
              </ul>
              <hr />
              <strong>Required Columns:</strong> <code>S.No.</code>, <code>Product Category</code>, 
              <code>Selling Product Code</code>, <code>Product Name</code>, <code>Price/product</code>
            </Alert>

            <FormGroup>
              <Form.Label>Select Excel File (.xlsx or .xls)</Form.Label>
              <Form.Control
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                disabled={uploadLoading}
              />
              {uploadFile && (
                <Form.Text className="text-success">
                  ✅ Selected: {uploadFile.name}
                </Form.Text>
              )}
            </FormGroup>

            {uploadResult && (
              <div className="mt-3">
                <Alert variant={uploadResult.errorCount > 0 ? 'warning' : 'success'}>
                  <h6>📊 Upload Results</h6>
                  <Row>
                    <Col md={6}>
                      <ul className="mb-0">
                        <li><strong>Total Rows:</strong> {uploadResult.totalRows}</li>
                        <li><strong>Success:</strong> {uploadResult.successCount}</li>
                        <li><strong>Errors:</strong> {uploadResult.errorCount}</li>
                      </ul>
                    </Col>
                    <Col md={6}>
                      <ul className="mb-0">
                        <li><strong>Categories Created:</strong> {uploadResult.categoriesCreated}</li>
                        <li><strong>Combos Created:</strong> {uploadResult.combosCreated}</li>
                        <li><strong>Combos Updated:</strong> {uploadResult.combosUpdated}</li>
                      </ul>
                    </Col>
                  </Row>
                </Alert>

                {uploadResult.errors && uploadResult.errors.length > 0 && (
                  <Card className="mt-3">
                    <Card.Header className="bg-danger text-white">
                      ❌ Errors ({uploadResult.errors.length})
                    </Card.Header>
                    <Card.Body style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {uploadResult.errors.map((err, idx) => (
                        <div key={idx} className="mb-2">
                          <strong>Row {err.row}:</strong> {err.error}
                        </div>
                      ))}
                    </Card.Body>
                  </Card>
                )}

                {uploadResult.processedData && uploadResult.processedData.length > 0 && (
                  <Card className="mt-3">
                    <Card.Header className="bg-success text-white d-flex justify-content-between align-items-center">
                      <span>✅ Successfully Processed ({uploadResult.processedData.length})</span>
                      <div className="d-flex gap-2 align-items-center">
                        <PrimaryButton 
                          size="sm"
                          onClick={handleGenerateAllBarcodes}
                          disabled={uploadLoading}
                        >
                          {uploadLoading ? (
                            <>
                              <LoadingSpinner size="sm" className="me-1" />
                              Generating...
                            </>
                          ) : (
                            <>
                              📊 Generate All Barcodes
                            </>
                          )}
                        </PrimaryButton>
                        <small>Click on any cell to edit</small>
                      </div>
                    </Card.Header>
                    <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      <Table size="sm" striped hover>
                        <thead>
                          <tr>
                            <th>S.No.</th>
                            <th>Product Category</th>
                            <th>Selling Product Code</th>
                            <th>Product Name</th>
                            <th>Price/product</th>
                            <th>Price/product with GST</th>
                          </tr>
                        </thead>
                        <tbody>
                          {uploadResult.processedData.map((item, idx) => (
                            <EditableRow key={idx} item={item} index={idx} />
                          ))}
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                )}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <SecondaryButton onClick={handleCloseUploadModal} disabled={uploadLoading}>
              Close
            </SecondaryButton>
            <PrimaryButton onClick={handleUploadExcel} disabled={!uploadFile || uploadLoading}>
              {uploadLoading ? (
                <>
                  <LoadingSpinner size="sm" className="me-2" />
                  Uploading...
                </>
              ) : (
                '📤 Upload & Process'
              )}
            </PrimaryButton>
          </Modal.Footer>
        </StyledModal>


        {/* Add Item Modal */}
        <StyledModal show={showAddItemModal} onHide={handleCloseAddItemModal} centered>
          <Modal.Header closeButton>
            <Modal.Title>➕ Add Product to Combo</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedComboForItem && (
              <>
                <div className="mb-3">
                  <h6>Adding to: <strong>{selectedComboForItem.name}</strong></h6>
                  <Badge bg="info">{selectedComboForItem.barcode}</Badge>
                </div>
                
                <FormGroup>
                  <Form.Label>Select Product</Form.Label>
                  <Form.Select
                    value={itemProduct}
                    onChange={(e) => setItemProduct(e.target.value)}
                  >
                    <option value="">Choose a product...</option>
                    {products.map(product => {
                      const stockStatus = product.quantity === 0 ? ' - OUT OF STOCK' : 
                                        product.quantity < 10 ? ' - LOW STOCK' : '';
                      return (
                        <option 
                          key={product._id} 
                          value={product._id}
                          disabled={product.quantity === 0}
                        >
                          {product.name} - ₹{product.price} (Available: {product.quantity}){stockStatus}
                        </option>
                      );
                    })}
                  </Form.Select>
                  {itemProduct && (
                    <Form.Text className="text-muted">
                      {(() => {
                        const selectedProd = products.find(p => p._id === itemProduct);
                        if (!selectedProd) return '';
                        return selectedProd.quantity === 0 ? '❌ This product is out of stock' :
                               selectedProd.quantity < 10 ? `⚠️ Low stock warning: Only ${selectedProd.quantity} units available` :
                               `✅ ${selectedProd.quantity} units available in stock`;
                      })()} 
                    </Form.Text>
                  )}
                </FormGroup>
                
                <FormGroup>
                  <Form.Label>Quantity</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max={itemProduct ? products.find(p => p._id === itemProduct)?.quantity || 1 : undefined}
                    value={itemQuantity}
                    onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                  />
                  {itemProduct && itemQuantity > 0 && (
                    <Form.Text className="text-muted">
                      {(() => {
                        const selectedProd = products.find(p => p._id === itemProduct);
                        if (!selectedProd) return '';
                        const remaining = selectedProd.quantity - itemQuantity;
                        return remaining >= 0 ? 
                          `After adding: ${remaining} units will remain in stock` :
                          `⚠️ Warning: Not enough stock! Need ${Math.abs(remaining)} more units`;
                      })()} 
                    </Form.Text>
                  )}
                </FormGroup>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <SecondaryButton onClick={handleCloseAddItemModal}>
              Cancel
            </SecondaryButton>
            <PrimaryButton onClick={handleSaveItem} disabled={loading}>
              {loading ? <LoadingSpinner size="sm" className="me-2" /> : null}
              Add Product
            </PrimaryButton>
          </Modal.Footer>
        </StyledModal>

      </AnimatedContainer>
    </StyledContainer>
    </GlobalStyle>
  );
};

export default Combos;
