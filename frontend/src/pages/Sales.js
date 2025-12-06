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
import { OverlayTrigger, Popover } from "react-bootstrap";
import { salesAPI, buyersAPI, productsAPI, barcodesAPI } from "../services/api";
import Quagga from "quagga";
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
  InputAdornment,
  IconButton,
  Grid,
  Card,
  CardContent,
  Divider,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Receipt as ReceiptIcon,
  Close as CloseIcon,
  CameraAlt as CameraAltIcon,
  QrCodeScanner as QrCodeScannerIcon,
  ShoppingCart as ShoppingCartIcon,
  Print as PrintIcon
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'transparent' }}>
        <CircularProgress sx={{ color: '#000' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ padding: '2.5rem', backgroundColor: 'rgba(255, 255, 255, 0.85)', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2.5rem'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ShoppingCartIcon sx={{ fontSize: '2rem', color: THEME.gold }} />
          <Typography variant="h4" sx={{ fontWeight: 600, color: THEME.charcoal, letterSpacing: '-0.02em', margin: 0 }}>
            Sales Management
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleShowModal}
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
              boxShadow: '0px 4px 6px -2px rgba(212, 175, 55, 0.3), 0px 12px 16px -4px rgba(212, 175, 55, 0.4)'
            }
          }}
        >
          New Sale
        </Button>
      </Box>

      {/* Toast Notifications */}
      {toasts.map(toast => (
        <Snackbar
          key={toast.id}
          open={toast.show}
          autoHideDuration={6000}
          onClose={() => removeToast(toast.id)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => removeToast(toast.id)} 
            severity={toast.variant === 'danger' ? 'error' : toast.variant === 'warning' ? 'warning' : 'success'}
            sx={{ width: '100%', borderRadius: '8px' }}
          >
            <strong>{toast.title}</strong> {toast.message}
          </Alert>
        </Snackbar>
      ))}

      <TableContainer component={Paper} sx={{ 
        borderRadius: '12px', 
        border: `1px solid ${THEME.softGold}`,
        boxShadow: '0px 1px 2px rgba(212, 175, 55, 0.15)',
        overflow: 'hidden'
      }}>
        <Table>
          <TableHead sx={{ backgroundColor: THEME.lightGold }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: THEME.charcoal, padding: '16px' }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 600, color: THEME.charcoal, padding: '16px' }}>Buyer</TableCell>
              <TableCell sx={{ fontWeight: 600, color: THEME.charcoal, padding: '16px' }}>Items</TableCell>
              <TableCell sx={{ fontWeight: 600, color: THEME.charcoal, padding: '16px' }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 600, color: THEME.charcoal, padding: '16px' }}>Total</TableCell>
              <TableCell sx={{ fontWeight: 600, color: THEME.charcoal, padding: '16px' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sales.map((sale) => (
              <TableRow 
                key={sale._id}
                sx={{
                  '&:hover': {
                    backgroundColor: THEME.lightGold
                  },
                  transition: 'background-color 0.2s ease'
                }}
              >
                <TableCell sx={{ padding: '16px', fontWeight: 600, color: THEME.charcoal }}>
                  {sale.saleId}
                </TableCell>
                <TableCell sx={{ padding: '16px' }}>
                  <Box>
                    <Typography sx={{ fontWeight: 600, color: THEME.charcoal, fontSize: '0.875rem' }}>
                      {sale.buyer?.name || 'N/A'}
                    </Typography>
                    {sale.buyer?.phone && (
                      <Typography sx={{ fontSize: '0.75rem', color: THEME.softCharcoal }}>
                        {String(sale.buyer.phone)}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell sx={{ padding: '16px' }}>
                  <Chip 
                    label={`${sale.items?.length || 0} items`} 
                    size="small"
                    sx={{ 
                      backgroundColor: THEME.lightGold, 
                      color: THEME.charcoal,
                      border: `1px solid ${THEME.softGold}`,
                      fontWeight: 500
                    }} 
                  />
                </TableCell>
                <TableCell sx={{ padding: '16px', color: THEME.softCharcoal }}>
                  {formatDate(sale.saleDate)}
                </TableCell>
                <TableCell sx={{ padding: '16px', fontWeight: 600, color: THEME.charcoal }}>
                  ₹{sale.totalAmount?.toFixed(2) || '0.00'}
                </TableCell>
                <TableCell sx={{ padding: '16px' }}>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button 
                      size="small"
                      startIcon={<VisibilityIcon />}
                      onClick={() => handleView(sale)}
                      disabled={loading}
                      sx={{
                        textTransform: 'none',
                        color: THEME.gold,
                        borderColor: THEME.softGold,
                        fontWeight: 500,
                        '&:hover': {
                          borderColor: THEME.gold,
                          backgroundColor: THEME.lightGold
                        }
                      }}
                      variant="outlined"
                    >
                      View
                    </Button>
                    <Button 
                      size="small"
                      startIcon={<ReceiptIcon />}
                      onClick={() => handleGenerateInvoice(sale)}
                      disabled={loading}
                      sx={{
                        textTransform: 'none',
                        color: THEME.gold,
                        borderColor: THEME.softGold,
                        fontWeight: 500,
                        '&:hover': {
                          borderColor: THEME.gold,
                          backgroundColor: THEME.lightGold
                        }
                      }}
                      variant="outlined"
                    >
                      Invoice
                    </Button>
                    <Button 
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => requestEditSale(sale)}
                      disabled={loading}
                      sx={{
                        textTransform: 'none',
                        color: THEME.gold,
                        borderColor: THEME.softGold,
                        fontWeight: 500,
                        '&:hover': {
                          borderColor: THEME.gold,
                          backgroundColor: THEME.lightGold
                        }
                      }}
                      variant="outlined"
                    >
                      Edit
                    </Button>
                    <Button 
                      size="small"
                      startIcon={<DeleteIcon />}
                      onClick={() => requestDeleteSale(sale._id)}
                      disabled={loading}
                      sx={{
                        textTransform: 'none',
                        color: '#d32f2f',
                        borderColor: '#d32f2f',
                        '&:hover': {
                          borderColor: '#c62828',
                          backgroundColor: '#ffebee'
                        }
                      }}
                      variant="outlined"
                    >
                      Delete
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit Sale Password Confirmation Modal */}
      <Dialog 
        open={showEditConfirmModal} 
        onClose={() => setShowEditConfirmModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: '#101828' }}>
          Confirm Edit
          <IconButton
            onClick={() => setShowEditConfirmModal(false)}
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
          <Typography sx={{ marginBottom: '16px', color: '#667085' }}>
            To edit this sale, please enter the admin password:
          </Typography>
          <TextField
            fullWidth
            type="password"
            label="Password"
            value={editPassword}
            onChange={e => setEditPassword(e.target.value)}
            placeholder="Enter password"
            autoFocus
            sx={{ marginTop: '8px' }}
          />
          {editPasswordError && (
            <Alert severity="error" sx={{ marginTop: '16px', borderRadius: '8px' }}>
              {editPasswordError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px' }}>
          <Button 
            onClick={() => setShowEditConfirmModal(false)}
            sx={{ 
              textTransform: 'none',
              color: '#667085',
              borderColor: '#EAECF0',
              '&:hover': {
                borderColor: '#D0D5DD',
                backgroundColor: '#F9FAFB'
              }
            }}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmEditSale}
            variant="contained"
            sx={{
              textTransform: 'none',
              backgroundColor: '#000',
              '&:hover': {
                backgroundColor: '#333'
              }
            }}
          >
            Edit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Sale Password Confirmation Modal */}
      <Dialog 
        open={showDeleteConfirmModal} 
        onClose={() => setShowDeleteConfirmModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: '#101828' }}>
          Confirm Delete
          <IconButton
            onClick={() => setShowDeleteConfirmModal(false)}
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
          <Typography sx={{ marginBottom: '16px', color: '#667085' }}>
            To delete this sale, please enter the admin password:
          </Typography>
          <TextField
            fullWidth
            type="password"
            label="Password"
            value={deletePassword}
            onChange={e => setDeletePassword(e.target.value)}
            placeholder="Enter password"
            autoFocus
            sx={{ marginTop: '8px' }}
          />
          {deletePasswordError && (
            <Alert severity="error" sx={{ marginTop: '16px', borderRadius: '8px' }}>
              {deletePasswordError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px' }}>
          <Button 
            onClick={() => setShowDeleteConfirmModal(false)}
            sx={{ 
              textTransform: 'none',
              color: '#667085',
              borderColor: '#EAECF0',
              '&:hover': {
                borderColor: '#D0D5DD',
                backgroundColor: '#F9FAFB'
              }
            }}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmDeleteSale}
            variant="contained"
            sx={{
              textTransform: 'none',
              backgroundColor: '#d32f2f',
              '&:hover': {
                backgroundColor: '#c62828'
              }
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Sale Modal */}
      <Dialog 
        open={showEditModal} 
        onClose={() => setShowEditModal(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: '#101828' }}>
          Edit Sale
          <IconButton
            onClick={() => setShowEditModal(false)}
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
        </DialogContent>
      </Dialog>

      {/* New Sale Modal */}
      <Dialog 
        open={showModal} 
        onClose={handleCloseModal}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: '#101828' }}>
          Create New Sale
          <IconButton
            onClick={handleCloseModal}
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
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Buyer</InputLabel>
                  <Select
                    name="buyer"
                    value={formData.buyer}
                    label="Buyer"
                    onChange={(e) => handleInputChange("buyer", e.target.value)}
                  >
                    <MenuItem value="">Select Buyer</MenuItem>
                    {buyers.map((buyer) => (
                      <MenuItem key={buyer._id} value={buyer._id}>
                        {buyer.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Sale Date"
                  name="saleDate"
                  value={formData.saleDate}
                  onChange={(e) => handleInputChange("saleDate", e.target.value)}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <Box sx={{ marginTop: '24px', marginBottom: '24px' }}>
              <Typography variant="h6" sx={{ marginBottom: '16px', fontWeight: 600, color: '#101828' }}>
                Scan Items
              </Typography>

              <Alert 
                severity={scannerActive ? 'success' : 'error'} 
                sx={{ marginBottom: '16px', borderRadius: '8px' }}
              >
                {scannerActive ? '🟢 Scanner Active' : '🔴 Scanner Inactive'}
              </Alert>
              
              <Box 
                ref={scannerRef} 
                sx={{ 
                  width: '100%', 
                  height: '250px', 
                  backgroundColor: '#000', 
                  borderRadius: '8px', 
                  marginBottom: '16px',
                  overflow: 'hidden'
                }} 
              />

              <Box sx={{ display: 'flex', gap: 1, marginBottom: '16px' }}>
                <Button
                  variant="contained"
                  startIcon={scannerActive ? <CloseIcon /> : <CameraAltIcon />}
                  onClick={scannerActive ? stopScanner : startScanner}
                  sx={{
                    textTransform: 'none',
                    backgroundColor: scannerActive ? '#d32f2f' : '#000',
                    '&:hover': {
                      backgroundColor: scannerActive ? '#c62828' : '#333'
                    }
                  }}
                >
                  {scannerActive ? 'Stop Scanner' : 'Start Scanner'}
                </Button>
              </Box>

                {/* Barcode Input */}
              <Box sx={{ marginBottom: '24px' }}>
                <Typography variant="body2" sx={{ marginBottom: '8px', fontWeight: 600, color: '#101828' }}>
                  Scanned Barcode
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, marginBottom: '8px' }}>
                  <TextField
                    inputRef={barcodeInputRef}
                    type="text"
                    value={scannedCode}
                    onChange={(e) => setScannedCode(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (barcodeMode && scannedCode.trim()) {
                          addBarcodeManually();
                        }
                      }
                    }}
                    placeholder={barcodeMode ? "Barcode mode active - scan or enter barcode" : "Enter barcode manually"}
                    disabled={!barcodeMode}
                    fullWidth
                    size="small"
                  />
                  <Button 
                    onClick={toggleBarcodeMode}
                    variant={barcodeMode ? "contained" : "outlined"}
                    startIcon={<QrCodeScannerIcon />}
                    sx={{
                      textTransform: 'none',
                      minWidth: '180px',
                      backgroundColor: barcodeMode ? '#2e7d32' : 'transparent',
                      color: barcodeMode ? '#fff' : '#667085',
                      borderColor: '#EAECF0',
                      '&:hover': {
                        backgroundColor: barcodeMode ? '#1b5e20' : '#F9FAFB',
                        borderColor: '#D0D5DD'
                      }
                    }}
                  >
                    {barcodeMode ? '✓ Barcode Active' : 'Enable Barcode'}
                  </Button>
                  {barcodeMode && scannedCode && (
                    <Button 
                      onClick={addBarcodeManually}
                      variant="contained"
                      startIcon={<AddIcon />}
                      sx={{
                        textTransform: 'none',
                        backgroundColor: '#000',
                        '&:hover': {
                          backgroundColor: '#333'
                        }
                      }}
                    >
                      Add Item
                    </Button>
                  )}
                </Box>
                {barcodeMode && (
                  <Typography variant="caption" sx={{ color: '#667085', display: 'block', marginTop: '4px' }}>
                    📍 Barcode mode is active. Scan barcode or press Enter to add items automatically.
                  </Typography>
                )}
              </Box>
            </Box>

            <Typography variant="h6" sx={{ marginBottom: '16px', fontWeight: 600, color: '#101828' }}>
              Scanned Items ({formData.items.length})
            </Typography>
              
            <TableContainer component={Paper} sx={{ 
              marginBottom: '24px',
              border: '1px solid #EAECF0',
              borderRadius: '8px',
              boxShadow: '0px 1px 2px rgba(16, 24, 40, 0.05)'
            }}>
              <Table>
                <TableHead sx={{ backgroundColor: '#F9FAFB' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: '#101828' }}>S.No</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#101828' }}>Barcode</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#101828' }}>Product Name</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#101828' }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#101828' }}>Price (₹)</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#101828' }}>Qty</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#101828' }}>Total (₹)</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#101828' }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.items.map((item, index) => {
                    const isCombo = item.type === 'combo';
                    const isRTO = item.type === 'rto-product';
                    const itemData = isCombo ? item.comboData : isRTO ? item.rtoProductData : item.productData;
                    const itemName = isRTO ? itemData?.productName : itemData?.name || 'N/A';
                    const itemDescription = itemData?.description || '';
                    const itemCategory = isCombo ? 'Combo Package' : isRTO ? `RTO (${itemData?.category})` : (itemData?.category || 'Unknown');
                    const lowStock = !isCombo && !isRTO && itemData?.currentStock <= itemData?.minStock;
                    
                    return (
                      <TableRow key={index} sx={{ 
                        backgroundColor: lowStock ? '#fff3cd' : 'inherit',
                        '&:hover': { backgroundColor: lowStock ? '#ffe8a1' : '#F9FAFB' }
                      }}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          <Chip 
                            label={item.barcode}
                            size="small"
                            sx={{ 
                              backgroundColor: isCombo ? '#2e7d32' : '#1976d2',
                              color: '#fff',
                              fontFamily: 'monospace',
                              fontWeight: 500
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Box sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {isCombo && <Chip label="COMBO" size="small" sx={{ backgroundColor: '#2e7d32', color: '#fff', height: '20px' }} />}
                              {isRTO && <Chip label="RTO" size="small" sx={{ backgroundColor: '#ed6c02', color: '#fff', height: '20px' }} />}
                              {String(itemName || '')}
                            </Box>
                            {itemDescription && (
                              <Typography variant="caption" sx={{ color: '#667085', display: 'block' }}>
                                {String(itemDescription).substring(0, 30)}
                                {String(itemDescription).length > 30 ? '...' : ''}
                              </Typography>
                            )}
                            {isCombo && item.comboData?.products && (
                              <Typography variant="caption" sx={{ color: '#1976d2', display: 'block', marginTop: '4px' }}>
                                Contains: {item.comboData.products.map(p => `${p.product?.name || 'Product'} (${p.quantity})`).join(', ')}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>{String(itemCategory || '')}</TableCell>
                        <TableCell>₹{item.unitPrice.toFixed(2)}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>₹{(item.unitPrice * item.quantity).toFixed(2)}</TableCell>
                        <TableCell>
                          <Button 
                            variant="outlined" 
                            size="small"
                            startIcon={<DeleteIcon />}
                            onClick={() => removeItem(index)}
                            sx={{
                              textTransform: 'none',
                              color: '#d32f2f',
                              borderColor: '#d32f2f',
                              '&:hover': {
                                borderColor: '#c62828',
                                backgroundColor: '#ffebee'
                              }
                            }}
                          >
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <Box sx={{ 
                padding: '16px', 
                borderTop: '2px solid #EAECF0', 
                backgroundColor: '#F9FAFB',
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: 2
              }}>
                <Typography sx={{ fontWeight: 600, color: '#101828' }}>Subtotal:</Typography>
                <Typography sx={{ fontWeight: 600, color: '#101828', fontSize: '1.1rem' }}>
                  ₹{formData.subtotal.toFixed(2)}
                </Typography>
              </Box>
            </TableContainer>

            {/* Totals Section */}
            <Box sx={{ marginBottom: '24px' }}>
              <Typography variant="h6" sx={{ marginBottom: '16px', fontWeight: 600, color: '#101828' }}>
                Order Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <Card sx={{ padding: '16px', border: '1px solid #EAECF0', boxShadow: 'none' }}>
                    <Typography variant="caption" sx={{ marginBottom: '8px', display: 'block', fontWeight: 600, color: '#667085' }}>
                      Discount (%)
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TextField
                        type="number"
                        size="small"
                        value={formData.discount}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          handleInputChange("discount", isNaN(value) ? 0 : Math.min(100, Math.max(0, value)));
                        }}
                        sx={{ width: '80px' }}
                      />
                      <Typography variant="body2" sx={{ color: '#2e7d32', fontWeight: 600 }}>
                        -₹{formData.discountAmount.toFixed(2)}
                      </Typography>
                    </Box>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card sx={{ padding: '16px', border: '1px solid #EAECF0', boxShadow: 'none' }}>
                    <Typography variant="caption" sx={{ marginBottom: '8px', display: 'block', fontWeight: 600, color: '#667085' }}>
                      Tax (%)
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TextField
                        type="number"
                        size="small"
                        value={formData.tax}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          handleInputChange("tax", isNaN(value) ? 0 : value);
                        }}
                        sx={{ width: '80px' }}
                      />
                      <Typography variant="body2" sx={{ color: '#1976d2', fontWeight: 600 }}>
                        +₹{formData.taxAmount.toFixed(2)}
                      </Typography>
                    </Box>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card sx={{ padding: '16px', border: '1px solid #EAECF0', boxShadow: 'none' }}>
                    <Typography variant="caption" sx={{ marginBottom: '8px', display: 'block', fontWeight: 600, color: '#667085' }}>
                      Shipping
                    </Typography>
                    <TextField
                      type="number"
                      size="small"
                      fullWidth
                      inputProps={{ step: "0.01" }}
                      value={formData.shipping}
                      onChange={(e) => {
                        handleInputChange("shipping", Number.parseFloat(e.target.value) || 0);
                      }}
                    />
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card sx={{ padding: '16px', border: '1px solid #EAECF0', boxShadow: 'none' }}>
                    <Typography variant="caption" sx={{ marginBottom: '8px', display: 'block', fontWeight: 600, color: '#667085' }}>
                      Other
                    </Typography>
                    <TextField
                      type="number"
                      size="small"
                      fullWidth
                      inputProps={{ step: "0.01" }}
                      value={formData.other}
                      onChange={(e) => {
                        handleInputChange("other", Number.parseFloat(e.target.value) || 0);
                      }}
                    />
                  </Card>
                </Grid>
              </Grid>
              
              <Box sx={{ 
                marginTop: '24px', 
                padding: '20px', 
                backgroundColor: '#000', 
                color: '#fff', 
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <Typography variant="h5" sx={{ margin: 0, fontWeight: 600 }}>
                  Final Total: ₹{formData.total.toFixed(2)}
                </Typography>
              </Box>
            </Box>

              {/* Comments Section */}
              <Box sx={{ marginBottom: '24px' }}>
                <Typography variant="h6" sx={{ marginBottom: '8px', fontWeight: 600, color: '#101828' }}>
                  Comments
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Comments or Special Instructions"
                  value={formData.comments}
                  onChange={(e) => handleInputChange("comments", e.target.value)}
                />
              </Box>
            </DialogContent>
            <DialogActions sx={{ padding: '16px 24px' }}>
              <Button 
                onClick={handleCloseModal}
                sx={{ 
                  textTransform: 'none',
                  color: '#667085',
                  borderColor: '#EAECF0',
                  '&:hover': {
                    borderColor: '#D0D5DD',
                    backgroundColor: '#F9FAFB'
                  }
                }}
                variant="outlined"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                variant="contained"
                sx={{
                  textTransform: 'none',
                  backgroundColor: '#000',
                  '&:hover': {
                    backgroundColor: '#333'
                  }
                }}
              >
                {loading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Create Sale'}
              </Button>
            </DialogActions>
          </Box>
      </Dialog>

      {/* Delete Item Confirmation Modal */}
      <Dialog 
        open={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: '#101828' }}>
          Remove Item
          <IconButton
            onClick={() => setShowDeleteModal(false)}
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
          {deleteItemIndex !== null && (
            <Box>
              <Typography sx={{ marginBottom: '16px', color: '#667085' }}>
                This item has a quantity of <strong>{formData.items[deleteItemIndex]?.quantity}</strong>.
              </Typography>
              <Typography sx={{ marginBottom: '16px', color: '#667085' }}>
                How many units would you like to remove?
              </Typography>
              <TextField
                fullWidth
                type="number"
                label="Quantity to remove"
                inputProps={{
                  min: 1,
                  max: formData.items[deleteItemIndex]?.quantity || 1
                }}
                value={deleteQuantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val > 0 && val <= formData.items[deleteItemIndex]?.quantity) {
                    setDeleteQuantity(val);
                  }
                }}
                sx={{ marginTop: '8px' }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px' }}>
          <Button 
            onClick={() => setShowDeleteModal(false)}
            sx={{ 
              textTransform: 'none',
              color: '#667085',
              borderColor: '#EAECF0',
              '&:hover': {
                borderColor: '#D0D5DD',
                backgroundColor: '#F9FAFB'
              }
            }}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button 
            onClick={handlePartialDelete}
            variant="contained"
            sx={{
              textTransform: 'none',
              backgroundColor: '#d32f2f',
              '&:hover': {
                backgroundColor: '#c62828'
              }
            }}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Sale Modal */}
      <Dialog
        open={showViewModal}
        onClose={() => setShowViewModal(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: '#101828' }}>
          Sale Details
          <IconButton
            onClick={() => setShowViewModal(false)}
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
        </DialogContent>
      </Dialog>

      {/* Invoice Modal */}
      <Dialog
        open={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: '#101828' }}>
          Invoice
          <IconButton
            onClick={() => setShowInvoiceModal(false)}
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
        <DialogContent sx={{ padding: 0 }}>
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
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px', '@media print': { display: 'none' } }}>
          <Button 
            onClick={() => setShowInvoiceModal(false)}
            sx={{ 
              textTransform: 'none',
              color: '#667085',
              borderColor: '#EAECF0',
              '&:hover': {
                borderColor: '#D0D5DD',
                backgroundColor: '#F9FAFB'
              }
            }}
            variant="outlined"
          >
            Close
          </Button>
          <Button 
            onClick={handlePrintInvoice}
            variant="contained"
            startIcon={<PrintIcon />}
            sx={{
              textTransform: 'none',
              backgroundColor: '#000',
              '&:hover': {
                backgroundColor: '#333'
              }
            }}
          >
            Print Invoice
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Sales;