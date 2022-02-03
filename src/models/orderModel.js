const mongoose = require('mongoose');


const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    refs: 'user',
    required: true
  },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, required: true },
    quantity: { type: Number, required: true }
  }],
  totalPrice: {
    type: Number,
    required: true
  },
  totalItems: {
    type: Number,
    required: true
  },
  cancellable: {
    type: Boolean,
    default: true,
  },
  status: {
    type: String,
    default: 'pending',
    required: true
  },
  deletedAt: {
    type: Date,
    default: null
  },
  isdeleted: {
    type: Boolean,
    default: false,
  }
}, { timestamps: true })



module.exports = mongoose.model('order', orderSchema)