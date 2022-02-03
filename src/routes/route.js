const express = require('express');
const mongoose = require('mongoose')
const router = express.Router();

const UserController = require('../controller/userController')
const productController=require('../controller/productController')
const cartController=require('../controller/cartController')
const orderController=require('../controller/orderController')
const loginCheck=require('../Middleware/userAuth')


// User
//registerUser API
router.post("/register", UserController.registerUser)
//LoginUser API
router.post('/login', UserController.loginUser)
//getuser API
router.get('/user/:userId/profile',loginCheck.userAuth,UserController.getProfile)
// updateUser API
router.put('/user/:userId/profile',loginCheck.userAuth,UserController.updateUser)

//Product 
// register Product
router.post('/products', productController.createProduct)
// get products API
router.get('/products', productController.getAllProducts)
// get product by Id
router.get('/products/:productId',productController.getProductById)
// update product API
router.put('/products/:productId',productController.updateProduct)
// delete product
router.delete('/products/:productId',productController.deleteProductById)

//Cart
//create cart API
router.post('/users/:userId/cart',loginCheck.userAuth, cartController.createCart)
//updateCart API
router.put('/users/:userId/cart',loginCheck.userAuth,cartController.updateCart)
// getCartByUserId
router.get('/users/:userId/cart',loginCheck.userAuth,cartController.getCartByUserId)
// deleteCartByUserId
router.delete('/users/:userId/cart',loginCheck.userAuth, cartController.deleteCartByUserId)


//Order
//createOrder
router.post('/users/:userId/orders',loginCheck.userAuth, orderController.createOrder)
//update Order
router.put('/users/:userId/orders', loginCheck.userAuth,orderController.updateOrder)

module.exports = router;