const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    items: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            name: String,
            price: Number,
            image: String,
            qty: {
                type: Number,
                required: true,
                min: 1
            },
        },
    ],

    shippingAddress: {
        type: String,
        required: true
    },
    
    total: {
        type: Number,
        required: true,
        min: 0
    },

    status: {
        type: String,
        enum: ['Pending', 'Paid', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Pending'
    },

    paymentStatus: {
        type: String,
        enum: ['Pending', 'Paid', 'Failed'],
        default: 'Pending'
    },

    paidAt: Date,
   
},

{ timestamps: true }

);

module.exports = mongoose.model('Order', orderSchema);