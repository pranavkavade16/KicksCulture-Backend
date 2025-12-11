const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profile',
        required: true,
    }, 
    sneakerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Sneakers',
        required: true,
    },  
    quantity: {
        type: Number,
        required: true,
    },
    size: {
        type: Number,   
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