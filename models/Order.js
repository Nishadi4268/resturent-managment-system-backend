const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    specialInstructions: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: 'Order should include at least one item',
      },
    },
    promoCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
    },
    orderType: {
      type: String,
      enum: ['dine-in', 'takeaway', 'delivery'],
      required: true,
    },
    tableNumber: {
      type: String,
      trim: true,
    },
    deliveryAddress: {
      type: String,
      trim: true,
    },
    requestedDateTime: {
      type: Date,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'online'],
      required: true,
    },
    pricing: {
      subtotal: {
        type: Number,
        required: true,
        min: 0,
      },
      discount: {
        type: Number,
        required: true,
        min: 0,
      },
      deliveryFee: {
        type: Number,
        required: true,
        min: 0,
      },
      total: {
        type: Number,
        required: true,
        min: 0,
      },
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'preparing', 'out-for-delivery', 'completed', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
