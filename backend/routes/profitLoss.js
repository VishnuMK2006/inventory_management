const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const mongoose = require('mongoose');
const Purchase = require('../models/Purchase');
const Sale = require('../models/Sale');
const Combo = require('../models/Combo');
const Product = require('../models/Product');
const UploadedProfitSheet = require('../models/UploadedProfitSheet');
const RTOProduct = require('../models/RTOProduct');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// GET profit/loss for date range from database
router.get('/', async (req, res) => {
  try {
    console.log('📊 GET /profit-loss endpoint called with query:', req.query);
    const { startDate, endDate } = req.query;

    // Validate date range
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ message: 'Start date must be before end date' });
    }

    console.log('🔍 Fetching sales data...');
    // Get sales data with status filtering
    const salesData = await Sale.aggregate([
      {
        $match: {
          ...(startDate || endDate
            ? {
                saleDate: {
                  ...(startDate && { $gte: new Date(startDate) }),
                  ...(endDate && {
                    $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
                  }),
                },
              }
            : {}),
        },
      },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productDetails',
        },
      },
      {
        $lookup: {
          from: 'combos',
          localField: 'items.combo',
          foreignField: '_id',
          as: 'comboDetails',
        },
      },
      {
        $project: {
          _id: 1,
          saleDate: 1,
          status: 1,
          itemId: '$items._id',
          itemType: '$items.type',
          quantity: '$items.quantity',
          unitPrice: '$items.unitPrice',
          total: '$items.total',
          productDetails: { $arrayElemAt: ['$productDetails', 0] },
          comboDetails: { $arrayElemAt: ['$comboDetails', 0] },
        },
      },
    ]);

    // Calculate profit by comparing with purchase cost
    const profitData = [];
    let totalProfit = 0;
    let deliveredProfit = 0;
    let rpuProfit = 0;

    for (const sale of salesData) {
      let costPrice = 0;

      try {
        // Get cost price from purchase data
        if (sale.itemType === 'product' && sale.productDetails) {
          // Find purchase record for this product
          const purchase = await Purchase.findOne(
            { 'items.product': sale.productDetails._id },
            { 'items.$': 1, totalAmount: 1 }
          );

          if (purchase && purchase.items && purchase.items[0]) {
            costPrice = purchase.items[0].unitCost;
          }
        } else if (sale.itemType === 'combo' && sale.comboDetails) {
          // For combos, sum the cost of all products in the combo
          const combo = await Combo.findById(sale.comboDetails._id).populate('products.product');
          if (combo && combo.products && combo.products.length > 0) {
            for (const comboProduct of combo.products) {
              const purchase = await Purchase.findOne(
                { 'items.product': comboProduct.product._id },
                { 'items.$': 1 }
              );
              if (purchase && purchase.items && purchase.items[0]) {
                costPrice += purchase.items[0].unitCost * comboProduct.quantity;
              }
            }
          } else {
            console.warn(`Combo ${sale.comboDetails._id} has no products or not found`);
          }
        }

        const profitPerUnit = sale.unitPrice - costPrice;
        let profitTotal = profitPerUnit * sale.quantity;

        // For RPU items, treat profit as negative
        const isRPU = sale.status === 'rpu' || sale.status === 'returned';
        if (isRPU) {
          profitTotal = -Math.abs(profitTotal);
        }

        const profitRecord = {
          itemId: sale.itemId || null,
          saleId: sale._id,
          date: sale.saleDate,
          status: sale.status || 'delivered',
          itemType: sale.itemType,
          product: sale.productDetails?.name || sale.comboDetails?.name || 'Unknown',
          costPrice: costPrice,
          soldPrice: sale.unitPrice,
          quantity: sale.quantity,
          profitPerUnit: profitPerUnit,
          profitTotal: profitTotal,
        };

        profitData.push(profitRecord);

        if (isRPU) {
          rpuProfit += profitTotal;
        } else {
          deliveredProfit += profitTotal;
        }

        totalProfit += profitTotal;
      } catch (itemError) {
        console.error(`Error processing sale item ${sale._id}:`, itemError);
        // Continue processing other items instead of failing completely
      }
    }

    // Monthly breakdown
    const monthlyProfit = {};
    profitData.forEach(record => {
      const month = new Date(record.date).toISOString().split('T')[0].slice(0, 7);
      if (!monthlyProfit[month]) {
        monthlyProfit[month] = { deliveredProfit: 0, rpuProfit: 0, totalProfit: 0 };
      }

      if (record.status === 'rpu' || record.status === 'returned') {
        monthlyProfit[month].rpuProfit += record.profitTotal;
      } else {
        monthlyProfit[month].deliveredProfit += record.profitTotal;
      }
      monthlyProfit[month].totalProfit += record.profitTotal;
    });

    const monthlyChartData = Object.entries(monthlyProfit)
      .map(([month, data]) => ({
        month,
        deliveredProfit: data.deliveredProfit,
        rpuProfit: data.rpuProfit,
        totalProfit: data.totalProfit,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    console.log(`✅ Successfully fetched ${profitData.length} profit records`);
    res.json({
      profitData,
      monthlyChartData,
      summary: {
        totalProfit: Number(totalProfit.toFixed(2)),
        deliveredProfit: Number(deliveredProfit.toFixed(2)),
        rpuProfit: Number(rpuProfit.toFixed(2)),
        totalRecords: profitData.length,
      },
    });
  } catch (error) {
    console.error('❌ Error calculating profit/loss:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      message: error.message,
      details: 'Check backend logs for full error',
      error: error.toString()
    });
  }
});

// POST upload and process Excel file
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Parse Excel file
      const workbook = xlsx.read(req.file.buffer, { type: 'buffer', cellDates: true });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      // Ensure we do not get raw Excel serials where possible; defval helps maintain keys with empty strings
      const dataRaw = xlsx.utils.sheet_to_json(worksheet, { raw: false, defval: '' });

      // Normalize date columns (e.g., Order Date, Payment Date) so frontend always receives readable YYYY-MM-DD strings
      const normalizeDateKeys = (row) => {
        const normalizedRow = { ...row };
        const dateKeyRegex = /^\s*(order\s*date|payment\s*date)\s*$/i;
        Object.keys(normalizedRow).forEach((key) => {
          if (dateKeyRegex.test(key)) {
            const val = normalizedRow[key];
            // If value already a Date object (with cellDates:true), format it
            if (val instanceof Date && !Number.isNaN(val.valueOf())) {
              normalizedRow[key] = val.toISOString().split('T')[0];
              normalizedRow.orderDate = normalizedRow.orderDate || normalizedRow[key];
              normalizedRow.paymentDate = normalizedRow.paymentDate || normalizedRow[key];
            } else if (typeof val === 'number' && !Number.isNaN(val)) {
              // Excel serial number -> JS date
              try {
                const dateObj = new Date((val - 25569) * 86400 * 1000);
                normalizedRow[key] = dateObj.toISOString().split('T')[0];
                normalizedRow.orderDate = normalizedRow.orderDate || normalizedRow[key];
                normalizedRow.paymentDate = normalizedRow.paymentDate || normalizedRow[key];
              } catch (err) {
                // leave as-is
              }
            } else if (typeof val === 'string' && val.trim() !== '') {
              // Try to parse string into Date
              const parsed = new Date(val);
              if (!Number.isNaN(parsed.valueOf())) {
                normalizedRow[key] = parsed.toISOString().split('T')[0];
                normalizedRow.orderDate = normalizedRow.orderDate || normalizedRow[key];
                normalizedRow.paymentDate = normalizedRow.paymentDate || normalizedRow[key];
              }
            }
          }
        });
        return normalizedRow;
      };

      const data = dataRaw.map(normalizeDateKeys);

    console.log('📄 Parsed upload first row:', data[0]);
    if (!data || data.length === 0) {
      return res.status(400).json({ message: 'No data found in Excel file' });
    }

    // Persist upload as a single sheet document containing the uploaded rows
    const timestamp = Date.now();
    const originalName = req.file.originalname || 'unknown';
    const fileName = `${timestamp}_${originalName}`;
    const rows = data.map((row) => ({
      month: String(row['Month'] || row.month || ''),
      sno: String(row['S.No.'] || row.sno || row.serialNumber || ''),
      orderDate: String(row['Order Date'] || row.orderDate || ''),
      orderId: String(row['Order id'] || row.orderId || row.orderid || ''),
      sku: String(row['SKU'] || row.sku || ''),
      quantity: String(row['Quantity'] || row.quantity || ''),
      status: String(row['Status'] || row.status || ''),
      payment: String(row['Payment'] || row.payment || ''),
      paymentDate: String(row['Payment Date'] || row.paymentDate || ''),
      paymentStatus: String(row['Payment Status'] || row.paymentStatus || ''),
      purchasePrice: String(row['Purchase Price'] || row.purchasePrice || ''),
      profit: String(row['Profit'] || row.profit || ''),
      reuseOrClaim: String(row['Re-use / Claim'] || row.reuseOrClaim || ''),
      reusedDate: String(row['Reused Date'] || row.reusedDate || ''),
      statusOfProduct: String(row['Status of Product'] || row.statusOfProduct || ''),
      remarks: String(row['Remarks'] || row.remarks || ''),
    }));

    // Compute a simple profit summary from uploaded rows (if profit is numeric)
    let totalProfit = 0;
    let deliveredProfit = 0;
    let rpuProfit = 0;
    let successRecords = 0;
    rows.forEach((r) => {
      const profitNum = Number(r.profit || 0);
      if (!Number.isNaN(profitNum)) {
        totalProfit += profitNum;
        if (r.status && r.status.toLowerCase() === 'rpu') {
          rpuProfit += profitNum;
        } else {
          deliveredProfit += profitNum;
        }
      }
      if (r.orderId && r.orderId.trim() !== '') successRecords++;
    });

    const sheetDoc = new UploadedProfitSheet({
      fileName,
      uploadedData: rows,
      totalRecords: rows.length,
      successRecords,
      errorRecords: rows.length - successRecords,
      profitSummary: {
        totalProfit: parseFloat(totalProfit.toFixed(2)),
        deliveredProfit: parseFloat(deliveredProfit.toFixed(2)),
        rpuProfit: parseFloat(rpuProfit.toFixed(2)),
        netProfit: parseFloat((deliveredProfit + rpuProfit).toFixed(2)),
      },
      uploadDate: new Date(),
      status: 'uploaded',
    });

    await sheetDoc.save();
    console.log('📥 Saved UploadedProfitSheet doc:', { id: sheetDoc._id, fileName: sheetDoc.fileName, totalRecords: sheetDoc.totalRecords, uploadedDataLength: sheetDoc.uploadedData.length });
    if (sheetDoc.uploadedData.length > 0) {
      console.log('📥 First uploaded row:', sheetDoc.uploadedData[0]);
    }

    res.json({
      results: sheetDoc,
      summary: {
        totalRecords: rows.length,
        savedCount: rows.length,
        fileName,
      },
    });
  } catch (error) {
    console.error('❌ Error in /profit-loss/upload:', error.stack || error);
    res.status(500).json({ message: error.message, stack: error.stack });
  }
});

// GET uploaded profit sheet data
router.get('/uploaded-data', async (req, res) => {
  try {
    const data = await UploadedProfitSheet.find().sort({ createdAt: -1 });
    res.json({
      results: data,
      summary: {
        totalRecords: data.length
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;