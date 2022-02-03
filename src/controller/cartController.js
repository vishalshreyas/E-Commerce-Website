const mongoose = require('mongoose')
const aws = require("aws-sdk");
const currencySymbol = require("currency-symbol-map")
const ObjectId = mongoose.Types.ObjectId
const validator = require('../utils/validate')
const awsFile = require('../utils/aws')

const productModel = require('../models/productModel')
const cartModel = require('../models/cartModel')
const userModel = require('../models/userModel')



const createCart = async function (req, res) {
    try {

        let requestBody = req.body
        let cartId = req.body.cartId
        let userId = req.params.userId
        let userIdFromToken = req.userId

        //----------------Validation Starts-------------------------------------//

        if (!validator.isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide cart details.' })
        }

        // body validation
        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Invalid userId in body" })
        }
        // do authorisation here

        

        let isUserIdExists = await userModel.findOne({ _id: userId })
       
       
        if (!isUserIdExists) {
            return res.status(400).send({ status: false, message: "UserId does not exits" })
        }
        
        if (isUserIdExists._id.toString() !== userIdFromToken) {
            res.status(401).send({ status: false, message: `Unauthorized access! Owner info doesn't match` });
            return
        }
        let cart = await cartModel.findOne({ userId: userId })

        // Extract body
        const { productId, quantity } = requestBody

        if (!validator.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "Invalid productId provided" })
        }
        let product = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!product) {
            return res.status(400).send({ status: false, message: `No such product present ,unable to add product ${productId} to cart.` })
        }


        if (!(!isNaN(Number(quantity)))) {
            return res.status(400).send({ status: false, message: `Quantity should be a valid number` })
        }
        if (quantity <= 0 || !validator.validInteger(quantity)) {
            return res.status(400).send({ status: false, message: `Quantity must be greater than zero and must be an integer ` })
        }


        let isAlredyCartExists = await cartModel.findOne({ userId: userId })

        if (isAlredyCartExists) {

            //---------Total price
            let priceSum = isAlredyCartExists.totalPrice + (product.price * quantity)

            //----------------
            
            let arr = isAlredyCartExists.items
            
            for (i in arr) {
                if (arr[i].productId.toString() === productId) {
                    arr[i].quantity = arr[i].quantity + quantity

                   
                    const updatedCart = {
                        items: arr,
                        totalPrice: priceSum,
                        totalItems: arr.length
                    }
                  

                    let data = await cartModel.findOneAndUpdate({ _id: isAlredyCartExists._id }, updatedCart, { new: true })
                    return res.status(201).send({ status: true, data: data })
                }
           
            }

            arr.push({ productId: productId, quantity: quantity })
            const updatedCart = {
                items: arr,
                totalPrice: priceSum,
                totalItems: arr.length
            }

            let data = await cartModel.findOneAndUpdate({ _id: isAlredyCartExists._id }, updatedCart, { new: true })
            return res.status(201).send({ status: true, data: data })

        }
       
        // TODO----------------------------create new cart

        let priceSum = product.price * quantity
        let itemArr = [{ productId: productId, quantity: quantity }]

        const updatedCart = {
            userId: userId,
            items: itemArr,
            totalPrice: priceSum,
            totalItems: 1
        }

        let data = await cartModel.create(updatedCart)
        res.status(201).send({ status: true, data: data })

    }
    catch (error) {
        console.log(error)
        res.status(500).send({ status: false, data: error.message });
    }

}

//!---------------Update Cart API

const updateCart = async function (req, res) {
    try {
        let userId = req.params.userId
        let requestBody = req.body
        let userIdFromToken = req.userId

        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Invalid userId in body" })
        }

        

        let user = await userModel.findOne({ _id: userId })
        if (!user) {
            return res.status(400).send({ status: false, message: "UserId does not exits" })
        }
        if (user._id.toString() !== userIdFromToken) {
            res.status(401).send({ status: false, message: `Unauthorized access! Owner info doesn't match` });
            return
        }
        //authorization
        //Extract body
        const { cartId, productId, removeProduct } = requestBody

        if (!validator.isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide cart details.' })
        }
        //cart
        if (!validator.isValidObjectId(cartId)) {
            return res.status(400).send({ status: false, message: "Invalid cartId in body" })
        }

        let cart = await cartModel.findById({ _id: cartId })

        if (!cart) {
            return res.status(400).send({ status: false, message: "cartId does not exits" })
        }
        //product
        if (!validator.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "Invalid productId in body" })
        }

        let product = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!product) {
            return res.status(400).send({ status: false, message: "productId does not exits" })
        }
        //find if products exits in cart
        let isProductinCart = await cartModel.findOne({ items: { $elemMatch: { productId: productId } } })

        if (!isProductinCart) {
            return res.status(400).send({ status: false, message: `This ${productId} product does not exits in the cart` })
        }

        //removeProduct validation
        if (!(!isNaN(Number(removeProduct)))) {
            return res.status(400).send({ status: false, message: `removeProduct should be a valid number either 0 or 1` })
        }
        if (!((removeProduct === 0) || (removeProduct === 1))) {
            return res.status(400).send({ status: false, message: 'removeProduct should be 0 (product is to be removed) or 1(quantity has to be decremented by 1) ' })
        }


        let findQuantity = cart.items.find(x => x.productId.toString() === productId)
        
        if (removeProduct === 0) {

            let totalAmount = cart.totalPrice - (product.price * findQuantity.quantity) // substract the amount of product*quantity

            await cartModel.findOneAndUpdate({ _id: cartId }, { $pull: { items: { productId: productId } } }, { new: true })   //pull the product from itmes  //https://stackoverflow.com/questions/15641492/mongodb-remove-object-from-array

            let quantity = cart.totalItems - 1
            let data = await cartModel.findOneAndUpdate({ _id: cartId }, { $set: { totalPrice: totalAmount, totalItems: quantity } }, { new: true })   //update the cart with total items and totalprice

            return res.status(200).send({ status: true, message: `${productId} is been removed`, data: data })

        }

        // decrement quantity
        let totalAmount = cart.totalPrice - product.price
        let arr = cart.items
        for (i in arr) {
            if (arr[i].productId.toString() == productId) {
                arr[i].quantity = arr[i].quantity - 1
                if (arr[i].quantity < 1) {
                    await cartModel.findOneAndUpdate({ _id: cartId }, { $pull: { items: { productId: productId } } }, { new: true })
                    let quantity = cart.totalItems - 1
                    let data = await cartModel.findOneAndUpdate({ _id: cartId }, { $set: { totalPrice: totalAmount, totalItems: quantity } }, { new: true })   //update the cart with total items and totalprice

                    return res.status(400).send({ status: false, message: 'no such Quantity/Product present in this cart', data: data })
                }
            }
        }

        let data = await cartModel.findOneAndUpdate({ _id: cartId }, { items: arr, totalPrice: totalAmount }, { new: true })

        return res.status(200).send({ status: true, message: `${productId} quantity is been reduced By 1`, data: data })
    }
    catch (error) {
        console.log(error)
        res.status(500).send({ status: false, data: error.message });
    }

}

//!----------getCartByUserId

const getCartByUserId = async function (req, res) {
    try {

        let userId = req.params.userId;
        let userIdFromToken = req.userId
        //----------------------------------------------Validation Starts---------------------------------------//
        // validating userid from params
        if (!validator.isValid(userId)) {
            return res.status(400).send({ status: false, message: "Invalid request parameters. userId is required" });
        }
        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Invalid request parameters. userId is not valid" });
        }
        let user= await userModel.findOne({_id:userId})
        if (!user) {
            return res.status(400).send({ status: false, msg: "No such user found. Please register and try again" });
        }
        let usercartid = await cartModel.findOne({ userId: userId });
        if (!usercartid) {
            return res.status(400).send({ status: false, msg: "No such cart found. Please register and try again" });
        }
        if (user._id.toString() !== userIdFromToken) {
            res.status(401).send({ status: false, message: `Unauthorized access! Owner info doesn't match` });
            return
        }
        return res.status(200).send({ status: true, data: usercartid })
    }
    catch (error) {
        console.log(error)
        res.status(500).send({ status: false, data: error.message });
    }
}

//!---------------deleteCartByUserId

const deleteCartByUserId = async function (req, res) {
    try {
        let userId = req.params.userId;
        let userIdFromToken = req.userId
        //--------------------------- ---------------------Validation Starts-------------------------------------//
        // validating userid from params
        if (!validator.isValid(userId)) {
            return res.status(400).send({ status: false, message: "Invalid request parameters. userId is required" });
        }
        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Invalid request parameters. userId is not valid" });
        }
       
        let Userdata = await userModel.findOne({ _id: userId })
        if (!Userdata) {
            return res.status(400).send({ status: false, msg: "No such user exists with this userID" });
        }
        if (Userdata._id.toString() !== userIdFromToken) {
            res.status(401).send({ status: false, message: `Unauthorized access! Owner info doesn't match` });
            return
        }
        let usercart = await cartModel.findOne({ userId: userId })
        if (!usercart) {
            return res.status(400).send({ status: false, msg: "No such user found. Please register and try again" });
        }
        let updatedUserCart = await cartModel.findOneAndUpdate({ userId: userId }, { items: [], totalPrice: 0, totalItems: 0 }, { new: true })
        return res.status(204).send({ status: true})
    }
    catch (error) {
        console.log(error)
        res.status(500).send({ status: false, data: error.message });
    }
}

module.exports = {
    createCart, updateCart, getCartByUserId, deleteCartByUserId
}


