const mongoose = require('mongoose');


const cartSchema = new mongoose.Schema({
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
  }
}, { timestamps: true })



module.exports = mongoose.model('Cart', cartSchema)

