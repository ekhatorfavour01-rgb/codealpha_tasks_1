const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    brand: { type: String, default: '', trim: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    oldPrice: { type: Number, min: 0 },
    discount: { type: String, default: '' },
    category: { type: String, default: 'General' },
    color: { type: String, default: '' },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    badge: { type: String, default: '' },
    image: { type: String, default: '' },
    stock: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);