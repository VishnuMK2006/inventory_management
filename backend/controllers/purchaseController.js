const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const ProductItem = require('../models/ProductItem');
const { generateBarcode } = require('../config/barcodeGenerator');

// Get all purchases
exports.getAllPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find()
      .populate('vendor', 'name contactPerson')
      .populate('items.product', 'name category')
      .sort({ purchaseDate: -1 });
    res.json(purchases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get purchase by ID
exports.getPurchaseById = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate('vendor', 'name contactPerson phone email address')
      .populate('items.product', 'name description category');
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }
    res.json(purchase);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new purchase
exports.createPurchase = async (req, res) => {

  console.log("Called Purchase")
  const session = await Purchase.startSession();
  session.startTransaction();
  
  try {
    const { vendor, items, purchaseDate } = req.body;
    
    // Calculate totals
    let totalAmount = 0;
    const purchaseItems = [];
    
    for (const item of items) {
      const itemTotal = item.quantity * item.unitCost;
      totalAmount += itemTotal;
      purchaseItems.push({
        product: item.product,
        quantity: item.quantity,
        unitCost: item.unitCost,
        total: itemTotal
      });
      
      // Update product quantity
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { quantity: item.quantity } },
        { session }
      );
    }
    
    // Create purchase
    const purchase = new Purchase({
      vendor,
      items: purchaseItems,
      totalAmount,
      purchaseDate: purchaseDate || new Date()
    });
    
    const savedPurchase = await purchase.save({ session });
    
    // Generate product items and assign the product's barcode to each item
    for (const item of items) {
      // Get the product's barcode
      const productDoc = await Product.findById(item.product);
      for (let i = 0; i < item.quantity; i++) {
        const productItem = new ProductItem({
          product: item.product,
          barcode: productDoc.barcode,
          purchase: savedPurchase._id,
          purchasePrice: item.unitCost,
          sellingPrice: item.unitCost * 1.2 // 20% markup by default
        });
        await productItem.save({ session });
      }
    }
    
    await session.commitTransaction();
    session.endSession();
    
    const populatedPurchase = await Purchase.findById(savedPurchase._id)
      .populate('vendor', 'name contactPerson')
      .populate('items.product', 'name category');
    
    res.status(201).json(populatedPurchase);


  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.log(error.message)
    res.status(400).json({ message: error.message });
  }
};

// Generate barcodes for a purchase
exports.generatePurchaseBarcodes = async (req, res) => {
  try {
    const purchaseId = req.params.id;
    const productItems = await ProductItem.find({ purchase: purchaseId })
      .populate('product', 'name');
    
    const barcodePromises = productItems.map(async (item) => {
      const barcodeBuffer = await generateBarcode(item.barcode);
      return {
        barcode: item.barcode,
        productName: item.product.name,
        barcodeData: barcodeBuffer.toString('base64')
      };
    });
    
    const barcodes = await Promise.all(barcodePromises);
    res.json(barcodes);



  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};