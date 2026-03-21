const Order = require('../models/Order');
const Cart = require('../models/Cart');

const getDiscountByPromo = (promoCode, subtotal) => {
  const normalizedCode = (promoCode || '').trim().toUpperCase();

  if (normalizedCode === 'SAVE20') {
    return subtotal * 0.2;
  }

  return 0;
};

const roundToTwo = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

// @desc    Place a new order
// @route   POST /api/orders
// @access  Private
exports.placeOrder = async (req, res) => {
  try {
    const {
      selectedItemIds,
      promoCode = '',
      orderType,
      tableNumber,
      deliveryAddress,
      requestedDateTime,
      paymentMethod,
    } = req.body;

    if (!Array.isArray(selectedItemIds) || selectedItemIds.length === 0) {
      return res.status(400).json({ message: 'Please select at least one cart item to place order' });
    }

    if (!['dine-in', 'takeaway', 'delivery'].includes(orderType)) {
      return res.status(400).json({ message: 'Invalid order type' });
    }

    if (!['cash', 'card', 'online'].includes(paymentMethod)) {
      return res.status(400).json({ message: 'Invalid payment method' });
    }

    if (orderType === 'dine-in' && !tableNumber) {
      return res.status(400).json({ message: 'Table number is required for dine-in orders' });
    }

    if (orderType === 'delivery' && !deliveryAddress) {
      return res.status(400).json({ message: 'Delivery address is required for delivery orders' });
    }

    if (!requestedDateTime) {
      return res.status(400).json({ message: 'Requested order date and time is required' });
    }

    const parsedRequestedDateTime = new Date(requestedDateTime);

    if (Number.isNaN(parsedRequestedDateTime.getTime())) {
      return res.status(400).json({ message: 'Invalid requested order date and time' });
    }

    if (parsedRequestedDateTime.getTime() < Date.now()) {
      return res.status(400).json({ message: 'Requested order date and time cannot be in the past' });
    }

    const cart = await Cart.findOne({ user: req.userId });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const selectedIdSet = new Set(selectedItemIds.map((itemId) => String(itemId).trim()));

    const selectedCartItems = cart.items.filter((item) => selectedIdSet.has(item.id));

    if (selectedCartItems.length === 0) {
      return res.status(400).json({ message: 'No valid selected items found in cart' });
    }

    const normalizedItems = selectedCartItems.map((item) => ({
      id: String(item.id || '').trim(),
      name: String(item.name || '').trim(),
      price: Number(item.price),
      quantity: Number(item.quantity),
      specialInstructions: item.specialInstructions ? String(item.specialInstructions).trim() : undefined,
    }));

    const hasInvalidItem = normalizedItems.some(
      (item) =>
        !item.id ||
        !item.name ||
        Number.isNaN(item.price) ||
        item.price < 0 ||
        Number.isNaN(item.quantity) ||
        item.quantity < 1
    );

    if (hasInvalidItem) {
      return res.status(400).json({ message: 'Invalid order item details' });
    }

    const subtotal = roundToTwo(
      normalizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    );
    const discount = roundToTwo(getDiscountByPromo(promoCode, subtotal));
    const deliveryFee = orderType === 'delivery' ? 5 : 0;
    const total = roundToTwo(Math.max(subtotal - discount + deliveryFee, 0));

    const order = await Order.create({
      user: req.userId,
      items: normalizedItems,
      promoCode,
      orderType,
      tableNumber: orderType === 'dine-in' ? String(tableNumber).trim() : undefined,
      deliveryAddress: orderType === 'delivery' ? String(deliveryAddress).trim() : undefined,
      requestedDateTime: parsedRequestedDateTime,
      paymentMethod,
      pricing: {
        subtotal,
        discount,
        deliveryFee,
        total,
      },
      status: 'pending',
    });

    cart.items = cart.items.filter((item) => !selectedIdSet.has(item.id));
    await cart.save();

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      orderedItemsCount: normalizedItems.length,
      orderedUnitsCount: normalizedItems.reduce((sum, item) => sum + item.quantity, 0),
      order,
      cart,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/my
// @access  Private
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged in user active orders for tracking
// @route   GET /api/orders/my/active
// @access  Private
exports.getMyActiveOrders = async (req, res) => {
  try {
    const activeOrders = await Order.find({
      user: req.userId,
      status: { $nin: ['completed', 'cancelled'] },
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: activeOrders.length,
      orders: activeOrders,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel logged in user's order
// @route   PATCH /api/orders/:orderId/cancel
// @access  Private
exports.cancelMyOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({ _id: orderId, user: req.userId });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ message: 'Only pending or confirmed orders can be cancelled' });
    }

    order.status = 'cancelled';
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      order,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
