const Cart = require('../models/Cart');

const roundToTwo = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }

  return cart;
};

const createCartPayload = (cart) => {
  const subtotal = roundToTwo(
    cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  );

  return {
    id: cart._id,
    user: cart.user,
    items: cart.items,
    totals: {
      itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
    },
    updatedAt: cart.updatedAt,
  };
};

// @desc    Get logged in user cart
// @route   GET /api/cart
// @access  Private
exports.getCart = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.userId);

    res.status(200).json({
      success: true,
      cart: createCartPayload(cart),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart/add
// @access  Private
exports.addToCart = async (req, res) => {
  try {
    const {
      id,
      name,
      price,
      quantity = 1,
      image,
      specialInstructions,
    } = req.body;

    if (!id || !name) {
      return res.status(400).json({ message: 'Item id and name are required' });
    }

    const normalizedPrice = Number(price);
    const normalizedQuantity = Number(quantity);

    if (Number.isNaN(normalizedPrice) || normalizedPrice < 0) {
      return res.status(400).json({ message: 'Valid item price is required' });
    }

    if (Number.isNaN(normalizedQuantity) || normalizedQuantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    const cart = await getOrCreateCart(req.userId);
    const existingIndex = cart.items.findIndex((item) => item.id === String(id).trim());

    if (existingIndex >= 0) {
      cart.items[existingIndex].quantity += normalizedQuantity;

      if (specialInstructions) {
        cart.items[existingIndex].specialInstructions = String(specialInstructions).trim();
      }
    } else {
      cart.items.push({
        id: String(id).trim(),
        name: String(name).trim(),
        price: normalizedPrice,
        quantity: normalizedQuantity,
        image: image ? String(image).trim() : undefined,
        specialInstructions: specialInstructions ? String(specialInstructions).trim() : undefined,
      });
    }

    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Item added to cart',
      cart: createCartPayload(cart),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update cart item quantity
// @route   PATCH /api/cart/items/:itemId
// @access  Private
exports.updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity, specialInstructions } = req.body;

    const normalizedQuantity = Number(quantity);

    if (Number.isNaN(normalizedQuantity) || normalizedQuantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    const cart = await getOrCreateCart(req.userId);
    const item = cart.items.find((cartItem) => cartItem.id === String(itemId).trim());

    if (!item) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    item.quantity = normalizedQuantity;

    if (typeof specialInstructions === 'string') {
      item.specialInstructions = specialInstructions.trim();
    }

    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Cart item updated',
      cart: createCartPayload(cart),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/items/:itemId
// @access  Private
exports.removeCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const cart = await getOrCreateCart(req.userId);

    const previousLength = cart.items.length;
    cart.items = cart.items.filter((item) => item.id !== String(itemId).trim());

    if (cart.items.length === previousLength) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      cart: createCartPayload(cart),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
exports.clearCart = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.userId);
    cart.items = [];
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Cart cleared',
      cart: createCartPayload(cart),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
