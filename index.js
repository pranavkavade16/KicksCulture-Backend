const express = require('express');
const app = express();

const { initializeDatabase } = require('./db/db.connect');
const Sneakers = require('./model/sneakers.model');
const Profile = require('./model/profile.model');
const Cart = require('./model/cart.model');
const Wishlist = require('./model/wishlist.model');
const Address = require('./model/address.model');
const Order = require('./model/order.model');
const { chatbotRoute } = require('./chatbotRoute');

const cors = require('cors');


const corsOptions = {
  origin: '*',
  credentials: true,
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.use(express.json());

initializeDatabase();

app.get('/', (req, res) => {
  res.send('Sneakers API');
});

// API to add the data.

// chatbotRoute(app);

const addNewSneaker = async (sneaker) => {
  try {
    const newSneaker = new Sneakers(sneaker);
    const savedSneaker = await newSneaker.save();
    return savedSneaker;
  } catch (error) {
    throw error;
  }
};

app.post('/sneakers', async (req, res) => {
  try {
    const newSneaker = await addNewSneaker(req.body);

    if (newSneaker) {
      res
        .status(200)
        .json({ message: 'Sneaker added successfully', newSneaker });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error to add the data', error });
  }
});

// API to read all sneakers
const readAllSneakers = async () => {
  try {
    const allSneakers = await Sneakers.find();
    return allSneakers;
  } catch (error) {
    throw error;
  }
};

app.get('/sneakers', async (req, res) => {
  try {
    const sneakers = await readAllSneakers();

    if (sneakers.length != 0) {
      res.send(sneakers);
    } else {
      res.status(404).json({ error: 'No Sneaker found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch the data.', error });
  }
});

// API to read sneakers by new arraival
const readSneakersByNewArrival = async () => {
  try {
    const sneakers = await Sneakers.find({ isNewArrival: true });
    return sneakers;
  } catch (error) {
    throw error;
  }
};

app.get('/sneakers/newArrival', async (req, res) => {
  try {
    const sneakers = await readSneakersByNewArrival();
    if (sneakers.length != 0) {
      res.send(sneakers);
    } else {
      res.status(404).json({ error: 'No sneakers found.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error fetching the data', error });
  }
});

// API to add sneakers to cart
const addSneakerToCart = async (userId, sneakerId, quantity, size) => {
  try {
    const exists = await Cart.findOne({ userId, sneakerId, size });

    if (exists) {
      return { message: 'Sneaker already in cart', data: exists };
    }

    const newSneakerInCart = new Cart({ userId, sneakerId, quantity, size });
    const savedSneakerInCart = await newSneakerInCart.save();
    return savedSneakerInCart;
  } catch (error) {
    throw error;
  }
};

app.post('/sneakers/cart', async (req, res) => {
  try {
    const { userId, sneakerId, quantity, size } = req.body;

    const newSneaker = await addSneakerToCart(
      userId,
      sneakerId,
      quantity,
      size
    );
    if (newSneaker) {
      res
        .status(200)
        .json({ message: 'Sneaker added to cart successfully.', newSneaker });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error adding the sneaker to cart.' });
  }
});

// API to read all the sneakers from cart
const readSneakersInCart = async () => {
  try {
    const sneakerInCart = await Cart.find().populate('sneakerId');
    return sneakerInCart;
  } catch (error) {
    throw error;
  }
};

app.get('/sneakers/cart', async (req, res) => {
  console.log('Cart Check');
  try {
    const sneakerInCart = await readSneakersInCart();
    if (sneakerInCart.length != 0) {
      res.send(sneakerInCart);
    } else {
      res.status(404).json({ error: 'No sneakers in the cart.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error in fetching the data.', error });
  }
});

// API to add a sneaker in wishlist
const addSneakerInWishlist = async (userId, sneakerId) => {
  try {
    const exists = await Wishlist.findOne({ userId, sneakerId });

    if (exists) {
      return {
        existed: true,
        data: exists
      };
    }

    const sneakerInWishlist = new Wishlist({ userId, sneakerId });
    const savedSneaker = await sneakerInWishlist.save();
    return  {
      existed: false,
      data: savedSneaker
    };;
  } catch (error) {
    throw error;
  }
};

app.post('/sneakers/wishlist', async (req, res) => {
  try {
    const { userId, sneakerId } = req.body;
    const sneakerInWishlist = await addSneakerInWishlist(userId, sneakerId);

    if (sneakerInWishlist.existed) {
      return res.status(200).json({ message: 'Sneaker already in wishlist.', data: sneakerInWishlist.data });
    }
  
     return res
        .status(200)
        .json({ message: 'Sneaker added to the wishlist successfully.', newSneaker: sneakerInWishlist.data });
    
  } catch (error) {
    res
      .status(500)
      .json({ error: 'Error in adding the sneaker to wishlist', error });
  }
});

// API to read all wishlisted sneakers
const readWishlistedSneakers = async () => {
  try {
    const wishlistedSneakers = await Wishlist.find().populate('sneakerId');
    return wishlistedSneakers;
  } catch (error) {
    throw error;
  }
};

app.get('/sneakers/wishlist', async (req, res) => {
  try {
    const wishlistedSneakers = await readWishlistedSneakers();
    if (wishlistedSneakers.length != 0) {
      res.send(wishlistedSneakers);
    } else {
      res.status(404).json({ error: 'No sneakers available.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch the data.' });
  }
});

// API to delete sneaker from wishlist 
const deleteSneakerFromWishlist = async (wishlistedId) => {
  try {
    const deletedSneaker = await Wishlist.findByIdAndDelete(wishlistedId);
    return deletedSneaker;
  } catch (error) {
    throw error;
  }
}

app.delete('/sneakers/wishlist/delete/:wishlistedId', async (req, res) => {
  try {
    const deletedSneaker = await deleteSneakerFromWishlist(req.params.wishlistedId);  
    if(deletedSneaker){
      res.status(200).json({
        _id: deletedSneaker._id,
        deleted: true
      })
    } else {
      res.status(404).json({ error: "Sneaker not found." });
    }
  } catch (error) {
    res.status(500).json({ error: "Error deleting the sneaker from wishlist.", error });
  } 
});

//API to read the sneakers by their brandname
const readSneakersByBrand = async (brandName) => {
  try {
    const sneakers = await Sneakers.find({ brand: brandName });
    return sneakers;
  } catch (error) {
    throw error;
  }
};

app.get('/sneakers/:brandName', async (req, res) => {
  try {
    const sneakers = await readSneakersByBrand(req.params.brandName);
    if (sneakers) {
      res.send(sneakers);
    } else {
      res.status(404).json({ error: 'Sneaker not found.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error fetching the data.', error });
  }
});

//API to add a profile
const addProfile = async (profile) => {
  try {
    const newProfile = new Profile(profile);
    const savedProfile = await newProfile.save();
    return savedProfile;
  } catch (error) {
    throw error;
  }
};

app.post('/profile', async (req, res) => {
  try {
    const newProfile = await addProfile(req.body);
    if (newProfile) {
      res
        .status(200)
        .json({ message: 'Prfile added successfully', newProfile });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to add the profile.', error });
  }
});

// API to increment the sneakers quantity
app.post('/sneakers/cart/:cartItemId', async (req, res) => {
  try {
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      res.status(400).json({ error: 'Quantity should be atleast 1.' });
    }

    const updatedQuantity = await Cart.findByIdAndUpdate(
      req.params.cartItemId,
      { quantity: req.body.quantity },
      { new: true }
    ).populate('sneakerId');

    if (!updatedQuantity) {
      res.status(404).json({ error: 'Sneaker not found.' });
    } 

    res.send(updatedQuantity);
  } catch (error) {
    res.status(500).json({ error: 'Error to fetch the data.', error });
  }
});

// API to delete a sneaker from cart
app.delete('/sneakers/cart/delete/:cartId', async (req, res) =>{
    try {
        
      const deleted = await Cart.findByIdAndDelete(req.params.cartId);

      if (!deleted) {res.status(404).json({ error: "Sneaker not found." });}

      return res.status(200).json({
        _id: deleted._id,
        deleted: true
      })
    
    } catch (error) {
        res.status(500).json({ error: 'Error deleting the sneaker from cart.', error });
    }
})

// API to empty the cart
const emptyCart = async (userId) => {
  try{
    const deleteAll = await Cart.deleteMany({ userId })
    return deleteAll;
  } catch(error){
    throw error;
  }
}
app.delete("/sneakers/cart/empty/:userId", async (req, res) => {
  try{

    const deleteAll = await emptyCart(req.params.userId);

    if(deleteAll.deletedCount > 0){
      res.status(200).json({message: "Deleted all sneakers from the cart."})
    } else {
      res.status(404).json({message: "No sneakers found in the cart."})
    }

  } catch(error){
    res.status(500).json({error: "Error deleting the sneakers from the cart", error})
  }
})

// API to decrement the sneakers quantity
app.post("/sneakers/cart/decrement/:sneakerId", async (req, res) => {
    try {
        const { quantity } = req.body;

        const decrementedQuantity = await Cart.findByIdAndUpdate(
            req.params.sneakerId,
            { quantity: quantity - 1 },
            { new: true }
        ).populate('sneakerId');

        if(decrementedQuantity){
          res.send(decrementedQuantity);
        } else {
          res.status(404).json({ error: 'Sneaker not found.' });
        }
        
    } catch (error) {
        console.log("Failed to decement the quantity", error);
        
    }
})
// API to read all the profiles.
const readAllProfile = async () => {
  try {
    const allProfiles = await Profile.find();
    return allProfiles;
  } catch (error) {
    throw error;
  }
};

app.get('/profile', async (req, res) => {
  try {
    const allProfiles = await readAllProfile();

    if (allProfiles.length != 0) {
      res.send(allProfiles);
    } else {
      res.status(404).json({ error: 'Profile not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch the data', error });
  }
});

// API to add a new address
const addNewAddress = async (address) => {
  try {
    const newAddress = new Address(address);
    const savedAddress = await newAddress.save();
    return savedAddress;
  } catch (error) {
    throw error;
  }
}

app.post("/address", async(req, res) => {
  try {
    const newAddress = await addNewAddress(req.body);

    if(newAddress){
      res.status(200).json({ message: "Address added successfully", newAddress });
    } else {
      res.status(500).json({ error: "Error adding the address" }); 
    }
  } catch (error) {
    res.status(500).json({ error: "Error adding the address", error });
  }
})

// API to read all addresses
const readAllAddresses = async () => {
  try {
    const addAddresses = await Address.find();
    return addAddresses;
  } catch (error) {
    throw error;
  }
};

app.get("/address", async(req, res) => {
  try {
    const addAddresses = await readAllAddresses();

    if(addAddresses.length != 0){
      res.send(addAddresses);
    } else {
      res.status(404).json({ error: "No address found." });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch the data.", error });
  }
})

// api to edit the address 
app.patch("/address/edit/:addressId", async (req, res) => {
  try {
    const { addressId } = req.params;
    const updatedAddress = req.body;

    // Validation
    if (
      !updatedAddress.pinCode ||
      !updatedAddress.completeAddress ||
      !updatedAddress.firstName ||
      !updatedAddress.lastName ||
      !updatedAddress.mobileNumber
    ) {
      return res
        .status(400)
        .json({ error: "All required fields must be provided." });
    }

    const addressToUpdate = await Address.findByIdAndUpdate(
      addressId,
      updatedAddress,
      { new: true }
    );

    if (!addressToUpdate) {
      return res.status(404).json({ error: "Address not found." });
    }

    res.status(200).json({
      message: "Address updated successfully",
      address: addressToUpdate,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to update address",
      errorDetails: error.message,
    });
  }
});


//api to delete the address
const deleteAddressById = async (addressId) => {
  try {
    const deleteAddress = await Address.findByIdAndDelete(addressId);
    return deleteAddress;
  }catch(error){
    throw error;
  }
};

app.delete("/address/delete/:addressId", async (req, res) => {
  try{
    const deletedAddress = await deleteAddressById(req.params.addressId);
    if(deletedAddress){
      res.status(200).json({message: "Address deleted successfully", deletedAddress });
    } else {
      res.status(404).json({error: "Address not found."})
    }
  } catch(error){
    res.status(500).json({error: "Error deleting the address.", error})
  }
})

// API to place a order 
const placeOrder = async (orderDetails) => {
  try{
    const order = new Order(orderDetails);
    const savedOrder = await order.save();
    return savedOrder;
  }catch(error){
    throw error;
  }
}

app.post("/sneakers/order", async(req, res) => {
  try{
    const newOrder = await placeOrder(req.body);
    if(newOrder){
      res.status(200).json({ message: "Order placed successfully", newOrder });
    } 
  }catch(error){
    res.status(500).json({error: "Error placing the order.", error})
  }
})

// API to read all orders
const readAllOrders = async() => {
  try{
    const allOrders = await Order.find().populate("userId").populate("addressId").populate("items.sneakerId").sort({ createdAt: -1 });;
    console.log(allOrders);
    return allOrders;
  }catch(error){
    throw error;
  }
}
app.get("/order", async(req, res) => {
  try {
    const allOrders = await readAllOrders();
    if(allOrders.length != 0) {
      res.send(allOrders)
    } else {
      res.status(404).json({error: "No orders found"})
    }
  }catch(error){
    res.status(500).json({error: "Failed to fetch the data", error})
  }
})

const PORT = 3000;
app.listen(PORT, () => {
  console.log('Server is running on the PORT:', PORT);
});
