const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Purchase = require('../models/Purchase');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Combo = require('../models/Combo');

// GET purchase and sales data for date range with daily breakdown
router.get('/purchase-sales', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let matchStage = { status: 'completed' };

    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) {
        matchStage.date.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchStage.date.$lte = end;
      }
    }

    // Get daily purchase data
    const purchaseData = await Purchase.aggregate([
      {
        $match: {
          status: 'completed',
          ...(startDate || endDate
            ? {
                purchaseDate: {
                  ...(startDate && { $gte: new Date(startDate) }),
                  ...(endDate && {
                    $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
                  }),
                },
              }
            : {}),
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$purchaseDate',
            },
          },
          totalAmount: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get daily sales data
    const salesData = await Sale.aggregate([
      {
        $match: {
          status: 'completed',
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
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$saleDate',
            },
          },
          totalAmount: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Merge data for combined view
    const mergedData = {};
    purchaseData.forEach((item) => {
      mergedData[item._id] = {
        date: item._id,
        purchaseAmount: item.totalAmount,
        purchaseCount: item.count,
        salesAmount: 0,
        salesCount: 0,
      };
    });

    salesData.forEach((item) => {
      if (!mergedData[item._id]) {
        mergedData[item._id] = {
          date: item._id,
          purchaseAmount: 0,
          purchaseCount: 0,
          salesAmount: item.totalAmount,
          salesCount: item.count,
        };
      } else {
        mergedData[item._id].salesAmount = item.totalAmount;
        mergedData[item._id].salesCount = item.count;
      }
    });

    const chartData = Object.values(mergedData).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    // Calculate totals
    const totalPurchase = purchaseData.reduce((sum, item) => sum + item.totalAmount, 0);
    const totalSales = salesData.reduce((sum, item) => sum + item.totalAmount, 0);

    res.json({
      chartData,
      summary: {
        totalPurchase,
        totalSales,
        profit: totalSales - totalPurchase,
        purchaseCount: purchaseData.reduce((sum, item) => sum + item.count, 0),
        salesCount: salesData.reduce((sum, item) => sum + item.count, 0),
      },
    });
  } catch (error) {
    console.error('Error fetching purchase-sales data:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET product-wise monthly analysis
router.get('/product/:productId/monthly', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const { productId } = req.params;

    // Get product purchases monthly
    const purchaseData = await Purchase.aggregate([
      {
        $match: {
          status: 'completed',
          ...(startDate || endDate
            ? {
                purchaseDate: {
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
        $match: {
          'items.product': new mongoose.Types.ObjectId(productId),
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m',
              date: '$purchaseDate',
            },
          },
          quantity: { $sum: '$items.quantity' },
          totalAmount: { $sum: '$items.total' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get product sales monthly
    const salesData = await Sale.aggregate([
      {
        $match: {
          status: 'completed',
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
        $match: {
          'items.product': new mongoose.Types.ObjectId(productId),
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m',
              date: '$saleDate',
            },
          },
          quantity: { $sum: '$items.quantity' },
          totalAmount: { $sum: '$items.total' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Merge data
    const mergedData = {};
    purchaseData.forEach((item) => {
      mergedData[item._id] = {
        month: item._id,
        purchaseQuantity: item.quantity,
        purchaseAmount: item.totalAmount,
        salesQuantity: 0,
        salesAmount: 0,
      };
    });

    salesData.forEach((item) => {
      if (!mergedData[item._id]) {
        mergedData[item._id] = {
          month: item._id,
          purchaseQuantity: 0,
          purchaseAmount: 0,
          salesQuantity: item.quantity,
          salesAmount: item.totalAmount,
        };
      } else {
        mergedData[item._id].salesQuantity = item.quantity;
        mergedData[item._id].salesAmount = item.totalAmount;
      }
    });

    const chartData = Object.values(mergedData).sort((a, b) =>
      a.month.localeCompare(b.month)
    );

    // Get product details
    const product = await Product.findById(productId);

    res.json({
      product: product ? { name: product.name, id: product._id } : null,
      chartData,
      summary: {
        totalPurchaseQuantity: purchaseData.reduce((sum, item) => sum + item.quantity, 0),
        totalSalesQuantity: salesData.reduce((sum, item) => sum + item.quantity, 0),
        totalPurchaseAmount: purchaseData.reduce((sum, item) => sum + item.totalAmount, 0),
        totalSalesAmount: salesData.reduce((sum, item) => sum + item.totalAmount, 0),
      },
    });
  } catch (error) {
    console.error('Error fetching product monthly data:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET all products for dropdown
router.get('/products/list', async (req, res) => {
  try {
    const products = await Product.find().select('_id name barcode');
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET product status data (RTO, RPU, Delivered) for histogram
router.get('/product-status/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const RTOProduct = require('../models/RTOProduct');

    // Try both ObjectId and string matching
    const rtoProducts = await RTOProduct.find({
      $or: [
        { product: new mongoose.Types.ObjectId(productId) },
        { product: productId }
      ]
    });
    console.log('Found RTO Products:', rtoProducts);

    // Get delivered count
    const delivered = await Sale.aggregate([
      { $unwind: '$items' },
      {
        $match: {
          'items.product': new mongoose.Types.ObjectId(productId),
          status: { $in: ['delivered', 'completed'] }
        }
      },
      { $group: { _id: null, total: { $sum: '$items.quantity' } } }
    ]);

    // Get RTO count
    const rto = rtoProducts
      .filter(p => p.category === 'RTO')
      .reduce((sum, p) => sum + p.quantity, 0);

    // Get RPU count  
    const rpu = rtoProducts
      .filter(p => p.category === 'RPU')
      .reduce((sum, p) => sum + p.quantity, 0);

    const deliveredCount = delivered.length > 0 ? delivered[0].total : 0;

    const product = await Product.findById(productId);

    const chartData = [
      { status: 'Delivered', count: deliveredCount },
      { status: 'RTO', count: rto },
      { status: 'RPU', count: rpu }
    ];

    console.log('Final counts:', { deliveredCount, rto, rpu });

    res.json({
      product: product ? { name: product.name, id: product._id } : null,
      chartData,
      summary: {
        totalDelivered: deliveredCount,
        totalRTO: rto,
        totalRPU: rpu,
        total: deliveredCount + rto + rpu
      }
    });
  } catch (error) {
    console.error('Error fetching product status data:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;