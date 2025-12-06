"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  IconButton,
  Stack,
  Divider,
  Card,
  CardContent,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Add as AddIcon,
} from '@mui/icons-material';

function PurchaseOrder({ vendors = [], items = [] }) {
    // Function to format numbers in Indian numbering system
    const formatIndianNumber = (num) => {
        if (num === undefined || num === null) return '0.00';
        
        // Convert to number if it's a string
        const number = typeof num === 'string' ? parseFloat(num) : num;
        
        // Handle NaN cases
        if (isNaN(number)) return '0.00';
        
        // Format the number with Indian numbering system
        return number.toLocaleString('en-IN', {
            maximumFractionDigits: 2,
            minimumFractionDigits: 2
        });
    };

    // Declare hooks only once at the top
    const [selectedVendorId, setSelectedVendorId] = useState("");
    const [selectedItemId, setSelectedItemId] = useState("");
    const [formData, setFormData] = useState({
        companyName: "Velpaari Enterprises",
        streetAddress: "5/3 ,32b Pasumai nagar, Thiruchengode main road, Alampalayam (po)",
        cityStateZip: " Erode-638008",
        phone: "9500791500",
        date: new Date().toLocaleDateString(),
        poNumber: "",
        vendorCompany: "",
        vendorContact: "",
        vendorAddress: "",
        vendorCityStateZip: "",
        vendorPhone: "",
        vendorEmail: "",
        vendorGstNo: "",
        vendorAccountNo: "",
        shipToName: "VELPAARI ENTERPRISES ",
        shipToCompany: "VELPAARI ENTERPRISES",
        shipToAddress: "5/3 ,32b Pasumai nagar, Thiruchengode main road, Alampalayam (po)",
        shipToCityStateZip: "Erode-638008",
        shipToPhone: "9500791500",
        items: [],
        subtotal: 0,
        tax: 0,
        taxAmount: 0,
        shipping: 0,
        shippingNotes: "",
        other: 0,
        otherNotes: "",
        total: 0,
        comments: "",
        contactName: "",
        contactPhone: "",
        contactEmail: "",
    });

    const [newItem, setNewItem] = useState({
        itemId: "",
        barcodeId: "",
        description: "",
        quantity: 1,
        unitPrice: 0,
        gstPercent: 0,
        itemTotal: 0,
        gstAmount: 0,
        total: 0,
    });

    const [manualItemEntry, setManualItemEntry] = useState(false);

    useEffect(() => {
        const subtotal = formData.items.reduce((sum, item) => sum + item.itemTotal, 0);
        const gstTotal = formData.items.reduce((sum, item) => sum + item.gstAmount, 0);
        const total = subtotal + gstTotal + Number(formData.shipping) + Number(formData.other);
        
        setFormData((prev) => ({
            ...prev,
            subtotal,
            gstTotal,
            total,
        }));
    }, [formData.items, formData.shipping, formData.other]);

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleVendorSelect = (vendorId) => {
        setSelectedVendorId(vendorId);
        const vendor = vendors.find((v) => v._id === vendorId);
        if (vendor) {
            setFormData((prev) => ({
                ...prev,
                vendorCompany: vendor.name,
                vendorContact: vendor.contactPerson,
                vendorAddress: vendor.address,
                vendorPhone: vendor.phone,
                vendorEmail: vendor.email,
                vendorGstNo: vendor.gstNo,
                vendorAccountNo: vendor.accountNo,
            }));
        }
    };

    const handleItemSelect = (itemId) => {
        setSelectedItemId(itemId);
        const item = items.find((i) => i._id === itemId);
        if (item) {
            setNewItem((prev) => ({
                ...prev,
                itemId: item._id,
                barcodeId: item.barcodeId || item.barcode || "", // Get barcode ID from item
                description: item.name,
                unitPrice: item.cost || item.price || 0,
                gstPercent: item.gstPercent || 0,
            }));
            calculateItemTotals({
                ...newItem,
                itemId: item._id,
                barcodeId: item.barcodeId || item.barcode || "",
                description: item.name,
                unitPrice: item.cost || item.price || 0,
                gstPercent: item.gstPercent || 0,
            });
        }
    };

    const calculateItemTotals = (item) => {
        const itemTotal = item.quantity * item.unitPrice;
        const gstAmount = itemTotal * (item.gstPercent / 100);
        const total = itemTotal + gstAmount;
        
        setNewItem((prev) => ({ 
            ...prev, 
            itemTotal,
            gstAmount,
            total
        }));
    };

    const addItem = () => {
        if (newItem.description) {
            setFormData((prev) => ({
                ...prev,
                items: [...prev.items, {...newItem}],
            }));
            setNewItem({
                itemId: manualItemEntry ? "MANUAL" : "",
                barcodeId: "",
                description: "",
                quantity: 1,
                unitPrice: 0,
                gstPercent: 0,
                itemTotal: 0,
                gstAmount: 0,
                total: 0,
            });
            setSelectedItemId("");
        }
    };

    const removeItem = (index) => {
        setFormData((prev) => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index),
        }));
    };

    const downloadPurchaseOrder = () => {
        const printWindow = window.open("", "_blank");
        if (printWindow) {
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Purchase Order - ${formData.poNumber}</title>
                    <style>
                        body { font-family: "Times New Roman", Times, serif; margin: 20px; }
                        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                        .logo { 
                            width: 60px; 
                            height: 60px; 
                            border-radius: 50%; 
                            margin-right: 15px; 
                            vertical-align: top;
                            display: inline-block;
                            object-fit: cover;
                            max-width: 60px;
                            max-height: 60px;
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                            visibility: visible;
                            opacity: 1;
                        }
                        .title { color: red; font-size: 24px; font-weight: bold; text-align: center; }
                        .info-section { display: flex; justify-content: space-between; margin: 20px 0; }
                        .info-box { border: 2px solid red; padding: 10px; width: 45%; }
                        .info-header { background: red; color: white; padding: 5px; margin: -10px -10px 10px -10px; font-weight: bold; }
                        .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                        .table th, .table td { border: 1px solid red; padding: 8px; text-align: left; }
                        .table th { background: red; color: white; }
                        .totals { text-align: right; margin: 20px 0; }
                        .total-row { font-weight: bold; background: #ffeb3b; }
                        .comments { border: 2px solid red; padding: 10px; margin: 20px 0; }
                        .comments-header { background: red; color: white; padding: 5px; margin: -10px -10px 10px -10px; }
                        .footer { text-align: center; margin-top: 30px; }
                        .notes { font-style: italic; color: #555; margin-top: 5px; font-size: 0.9em; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div>
                            <img src="/logo_vp.jpeg" alt="Velpaari Enterprises Logo" class="logo">
                            <div><strong>${formData.companyName}</strong></div>
                            <div>${formData.streetAddress}</div>
                            <div>${formData.cityStateZip}</div>
                            <div>Phone: ${formData.phone}</div>
                        </div>
                        <div>
                            <div class="title">Purchase Order</div>
                            <div style="text-align: right; margin-top: 10px;">
                                <div>DATE: ${formData.date}</div>
                                <div>PO #: ${formData.poNumber}</div>
                            </div>
                        </div>
                    </div>

                    <div class="info-section">
                        <div class="info-box">
                            <div class="info-header">VENDOR</div>
                            <div>${formData.vendorCompany}</div>
                            <div>Contact: ${formData.vendorContact}</div>
                            <div>${formData.vendorAddress}</div>
                            <div>Phone: ${formData.vendorPhone}</div>
                            <div>Email: ${formData.vendorEmail}</div>
                            <div>GST: ${formData.vendorGstNo}</div>
                            <div>Account: ${formData.vendorAccountNo}</div>
                        </div>
                        <div class="info-box">
                            <div class="info-header">SHIP TO</div>
                            <div>${formData.shipToName}</div>
                            <div>${formData.shipToCompany}</div>
                            <div>${formData.shipToAddress}</div>
                            <div>${formData.shipToCityStateZip}</div>
                            <div>Phone: ${formData.shipToPhone}</div>
                        </div>
                    </div>

                    <table class="table">
                        <tr>
                            <th>BARCODE ID</th>
                            <th>DESCRIPTION</th>
                            <th>QTY</th>
                            <th>UNIT PRICE</th>
                            <th>GST %</th>
                            <th>ITEM TOTAL</th>
                            <th>GST AMOUNT</th>
                            <th>TOTAL</th>
                        </tr>
                        ${formData.items
                            .map(
                                (item) => `
                            <tr>
                                <td>${item.barcodeId || item.itemId}</td>
                                <td>${item.description}</td>
                                <td>${item.quantity}</td>
                                <td>₹ ${formatIndianNumber(item.unitPrice)}</td>
                                <td>${item.gstPercent}%</td>
                                <td>₹ ${formatIndianNumber(item.itemTotal)}</td>
                                <td>₹ ${formatIndianNumber(item.gstAmount)}</td>
                                <td>₹ ${formatIndianNumber(item.total)}</td>
                            </tr>
                        `
                            )
                            .join("")}
                    </table>

                    <div class="comments">
                        <div class="comments-header">Comments or Special Instructions</div>
                        <div>${formData.comments}</div>
                    </div>

                    <div class="totals">
                        <div>SUBTOTAL: ₹ ${formatIndianNumber(formData.subtotal)}</div>
                        <div>GST TOTAL: ₹ ${formatIndianNumber(formData.gstTotal)}</div>
                        <div>SHIPPING: ₹ ${formatIndianNumber(formData.shipping)}</div>
                        ${formData.shippingNotes ? `<div class="notes">${formData.shippingNotes}</div>` : ''}
                        <div>OTHER: ₹ ${formatIndianNumber(formData.other)}</div>
                        ${formData.otherNotes ? `<div class="notes">${formData.otherNotes}</div>` : ''}
                        <div class="total-row">GRAND TOTAL: ₹ ${formatIndianNumber(formData.total)}</div>
                    </div>

                    <div class="footer">
                        <p>If you have any questions about this purchase order, please contact</p>
                        <p>${formData.contactName}, ${formData.contactPhone}, ${formData.contactEmail}</p>
                    </div>
                </body>
                </html>
            `);
            printWindow.document.close();
            
            // Wait for logo to load before printing
            const logoImg = printWindow.document.querySelector('.logo');
            if (logoImg) {
                logoImg.onload = () => {
                    setTimeout(() => {
                        printWindow.print();
                    }, 500);
                };
                logoImg.onerror = () => {
                    console.log('Logo failed to load in print window');
                    setTimeout(() => {
                        printWindow.print();
                    }, 500);
                };
                // If image is already loaded
                if (logoImg.complete) {
                    setTimeout(() => {
                        printWindow.print();
                    }, 500);
                }
            } else {
                setTimeout(() => {
                    printWindow.print();
                }, 500);
            }
        }
    };

    return (
        <Box sx={{ bgcolor: '#fafafa', minHeight: '100vh', p: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 3, textAlign: 'center' }}>
                Purchase Order Generator
            </Typography>
            
            <Paper sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Company Information
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Company Name"
                            value={formData.companyName}
                            onChange={(e) => handleInputChange("companyName", e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Street Address"
                            value={formData.streetAddress}
                            onChange={(e) => handleInputChange("streetAddress", e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="City, State ZIP"
                            value={formData.cityStateZip}
                            onChange={(e) => handleInputChange("cityStateZip", e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Phone"
                            value={formData.phone}
                            onChange={(e) => handleInputChange("phone", e.target.value)}
                        />
                    </Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Order Information
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            type="date"
                            label="Date"
                            value={formData.date}
                            onChange={(e) => handleInputChange("date", e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="PO Number (Manual Entry)"
                            value={formData.poNumber}
                            onChange={(e) => handleInputChange("poNumber", e.target.value)}
                        />
                    </Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Vendor Information
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                            <InputLabel>Select Vendor</InputLabel>
                            <Select
                                value={selectedVendorId}
                                onChange={(e) => handleVendorSelect(e.target.value)}
                                label="Select Vendor"
                            >
                                <MenuItem value="">Select Vendor</MenuItem>
                                {vendors && vendors.map((vendor) => (
                                    <MenuItem key={vendor._id} value={vendor._id}>
                                        {vendor.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Contact Person"
                            value={formData.vendorContact}
                            onChange={(e) => handleInputChange("vendorContact", e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Vendor Address"
                            value={formData.vendorAddress}
                            onChange={(e) => handleInputChange("vendorAddress", e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Phone"
                            value={formData.vendorPhone}
                            onChange={(e) => handleInputChange("vendorPhone", e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="GST No"
                            value={formData.vendorGstNo}
                            onChange={(e) => handleInputChange("vendorGstNo", e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Account No"
                            value={formData.vendorAccountNo}
                            onChange={(e) => handleInputChange("vendorAccountNo", e.target.value)}
                        />
                    </Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Ship To Information
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Name"
                            value={formData.shipToName}
                            onChange={(e) => handleInputChange("shipToName", e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Company Name"
                            value={formData.shipToCompany}
                            onChange={(e) => handleInputChange("shipToCompany", e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Street Address"
                            value={formData.shipToAddress}
                            onChange={(e) => handleInputChange("shipToAddress", e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="City, State ZIP"
                            value={formData.shipToCityStateZip}
                            onChange={(e) => handleInputChange("shipToCityStateZip", e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Phone"
                            value={formData.shipToPhone}
                            onChange={(e) => handleInputChange("shipToPhone", e.target.value)}
                        />
                    </Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Add Items
                </Typography>
                
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={manualItemEntry}
                            onChange={(e) => setManualItemEntry(e.target.checked)}
                        />
                    }
                    label="Manual Item Entry"
                    sx={{ mb: 2 }}
                />
                
                <Grid container spacing={2}>
                    {!manualItemEntry ? (
                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                                <InputLabel>Select Product</InputLabel>
                                <Select
                                    value={selectedItemId}
                                    onChange={(e) => handleItemSelect(e.target.value)}
                                    label="Select Product"
                                >
                                    <MenuItem value="">Select Product</MenuItem>
                                    {items && items.map((item) => (
                                        <MenuItem key={item._id} value={item._id}>
                                            {item.name} {item.barcodeId ? `(Barcode: ${item.barcodeId})` : ''}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    ) : (
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Barcode ID"
                                value={newItem.barcodeId}
                                onChange={(e) => {
                                    setNewItem((prev) => ({ ...prev, barcodeId: e.target.value }));
                                    calculateItemTotals({...newItem, barcodeId: e.target.value});
                                }}
                            />
                        </Grid>
                    )}
                    
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Description"
                            value={newItem.description}
                            onChange={(e) => {
                                setNewItem((prev) => ({ ...prev, description: e.target.value }));
                                calculateItemTotals({...newItem, description: e.target.value});
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            type="number"
                            label="Quantity"
                            value={newItem.quantity}
                            onChange={(e) => {
                                const quantity = Number.parseInt(e.target.value) || 1;
                                setNewItem((prev) => ({ ...prev, quantity }));
                                calculateItemTotals({...newItem, quantity});
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            type="number"
                            label="Unit Price"
                            value={newItem.unitPrice}
                            onChange={(e) => {
                                const unitPrice = Number.parseFloat(e.target.value) || 0;
                                setNewItem((prev) => ({ ...prev, unitPrice }));
                                calculateItemTotals({...newItem, unitPrice});
                            }}
                            inputProps={{ step: "0.01" }}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            type="number"
                            label="GST %"
                            value={newItem.gstPercent}
                            onChange={(e) => {
                                const gstPercent = Number.parseFloat(e.target.value) || 0;
                                setNewItem((prev) => ({ ...prev, gstPercent }));
                                calculateItemTotals({...newItem, gstPercent});
                            }}
                            inputProps={{ step: "0.01" }}
                        />
                    </Grid>
                    
                    <Grid item xs={12}>
                        <Card sx={{ bgcolor: '#fafafa', border: '1px solid #e0e0e0' }}>
                            <CardContent>
                                <Typography variant="body2" sx={{ mb: 1 }}>Barcode ID: {newItem.barcodeId || "N/A"}</Typography>
                                <Typography variant="body2" sx={{ mb: 1 }}>Item Total: ₹ {formatIndianNumber(newItem.quantity * newItem.unitPrice)}</Typography>
                                <Typography variant="body2" sx={{ mb: 1 }}>GST Amount: ₹ {formatIndianNumber(newItem.quantity * newItem.unitPrice * (newItem.gstPercent / 100))}</Typography>
                                <Typography variant="body1" sx={{ fontWeight: 600 }}>Total: ₹ {formatIndianNumber(newItem.total)}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    
                    <Grid item xs={12}>
                        <Button
                            fullWidth
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={addItem}
                            sx={{
                                bgcolor: '#000',
                                textTransform: 'none',
                                '&:hover': { bgcolor: '#333' }
                            }}
                        >
                            Add Item
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            <Paper sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Items in Purchase Order
                </Typography>
                {formData.items.length === 0 ? (
                    <Typography sx={{ color: '#666', textAlign: 'center', py: 3 }}>
                        No items added yet.
                    </Typography>
                ) : (
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
                                    <TableCell sx={{ fontWeight: 600 }}>Barcode ID</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Qty</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Unit Price</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>GST %</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Item Total</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>GST Amount</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }}>Total</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }} align="center">Action</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {formData.items.map((item, index) => (
                                    <TableRow key={index} sx={{ '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' } }}>
                                        <TableCell>{item.barcodeId || item.itemId}</TableCell>
                                        <TableCell>{item.description}</TableCell>
                                        <TableCell>{item.quantity}</TableCell>
                                        <TableCell>₹ {formatIndianNumber(item.unitPrice)}</TableCell>
                                        <TableCell>{item.gstPercent}%</TableCell>
                                        <TableCell>₹ {formatIndianNumber(item.itemTotal)}</TableCell>
                                        <TableCell>₹ {formatIndianNumber(item.gstAmount)}</TableCell>
                                        <TableCell>₹ {formatIndianNumber(item.total)}</TableCell>
                                        <TableCell align="center">
                                            <IconButton
                                                size="small"
                                                onClick={() => removeItem(index)}
                                                sx={{ color: '#d32f2f' }}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            <Paper sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Totals
                </Typography>
                <Box sx={{ bgcolor: '#fafafa', p: 2, borderRadius: 1 }}>
                    <Stack spacing={2}>
                        <Stack direction="row" justifyContent="space-between" sx={{ pb: 1, borderBottom: '1px dashed #ddd' }}>
                            <Typography sx={{ fontWeight: 600 }}>Subtotal:</Typography>
                            <Typography>₹ {formatIndianNumber(formData.subtotal)}</Typography>
                        </Stack>
                        <Stack direction="row" justifyContent="space-between" sx={{ pb: 1, borderBottom: '1px dashed #ddd' }}>
                            <Typography sx={{ fontWeight: 600 }}>GST Total:</Typography>
                            <Typography>₹ {formatIndianNumber(formData.gstTotal)}</Typography>
                        </Stack>
                        <Stack direction="row" justifyContent="space-between" sx={{ pb: 1, borderBottom: '1px dashed #ddd' }}>
                            <Typography sx={{ fontWeight: 600 }}>Shipping:</Typography>
                            <Box sx={{ textAlign: 'right' }}>
                                <TextField
                                    type="number"
                                    size="small"
                                    value={formData.shipping}
                                    onChange={(e) => {
                                        handleInputChange("shipping", Number.parseFloat(e.target.value) || 0);
                                    }}
                                    inputProps={{ step: "0.01" }}
                                    sx={{ width: '100px', mb: 1 }}
                                />
                                <TextField
                                    size="small"
                                    placeholder="Shipping notes"
                                    multiline
                                    rows={2}
                                    value={formData.shippingNotes}
                                    onChange={(e) => handleInputChange("shippingNotes", e.target.value)}
                                    sx={{ width: '200px' }}
                                />
                            </Box>
                        </Stack>
                        <Stack direction="row" justifyContent="space-between" sx={{ pb: 1, borderBottom: '1px dashed #ddd' }}>
                            <Typography sx={{ fontWeight: 600 }}>Other:</Typography>
                            <Box sx={{ textAlign: 'right' }}>
                                <TextField
                                    type="number"
                                    size="small"
                                    value={formData.other}
                                    onChange={(e) => {
                                        handleInputChange("other", Number.parseFloat(e.target.value) || 0);
                                    }}
                                    inputProps={{ step: "0.01" }}
                                    sx={{ width: '100px', mb: 1 }}
                                />
                                <TextField
                                    size="small"
                                    placeholder="Other charges notes"
                                    multiline
                                    rows={2}
                                    value={formData.otherNotes}
                                    onChange={(e) => handleInputChange("otherNotes", e.target.value)}
                                    sx={{ width: '200px' }}
                                />
                            </Box>
                        </Stack>
                        <Stack 
                            direction="row" 
                            justifyContent="space-between" 
                            sx={{ pt: 2, borderTop: '2px solid #000' }}
                        >
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>Grand Total:</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 700 }}>₹ {formatIndianNumber(formData.total)}</Typography>
                        </Stack>
                    </Stack>
                </Box>
            </Paper>

            <Paper sx={{ p: 3, mb: 3, border: '1px solid #e0e0e0', boxShadow: 'none' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Contact Information
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Contact Name"
                            value={formData.contactName}
                            onChange={(e) => handleInputChange("contactName", e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Contact Phone"
                            value={formData.contactPhone}
                            onChange={(e) => handleInputChange("contactPhone", e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            type="email"
                            label="Contact Email"
                            value={formData.contactEmail}
                            onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                        />
                    </Grid>
                </Grid>
            </Paper>

            <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Button
                    variant="contained"
                    size="large"
                    startIcon={<DownloadIcon />}
                    onClick={downloadPurchaseOrder}
                    sx={{
                        bgcolor: '#000',
                        color: '#fff',
                        textTransform: 'none',
                        px: 4,
                        py: 1.5,
                        '&:hover': { bgcolor: '#333' }
                    }}
                >
                    Download Purchase Order
                </Button>
            </Box>
        </Box>
    );
}

export default PurchaseOrder;
