const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profile',
        required: true,
    }, 
    items: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cart',
        required: true,
    },  
    addressId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address', 
        required: true,
    },
})

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;