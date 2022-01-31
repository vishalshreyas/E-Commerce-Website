const express = require('express');
const router = express.Router();

const productController = require('../controller/productController.js')

// product routes
router.post('/products', productController.createProduct)
router.get('/products', productController.getAllProducts)
// router.get('/products/:productId', productController.getProductDetails)
// router.put('/products/:productId', productController.updateProduct)
// router.delete('/products/:productId', productController.deleteProduct)

module.exports = router;