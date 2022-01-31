const mongoose = require('mongoose')
const cartModel = require('../models/cartModel')
const userModel = require('../models/userModel')





const createCart = async function (req,res){
    try{

        userId = req.params.userId

        data = req.body

        validUserId = await userModel.findById(userId)
        
        if(!validUserId){
            return res.status(400).send({status:false, msg: "User does not exist"})
        }

        cartExist = await cartModel.findOne({userId: validUserId})

        if(!cartExist){

            cartCreate = await cartModel.create(data)
        }
        // const productId = data.items[0].productId

        alreadyExists = []
        cartExist.items.map(c => alreadyExists.push(c.productId))

        quantityExist = [] 
        cartExist.items.map(c => alreadyExists.push(c.quantity))
        
        updateObj = {
            items: [...alreadyExists, ...data.items.productId]
        }
        
        cartModify = await cartModel.findOneAndUpdate({})



    }catch(err){
        return res.status(500).send({status: false, msg: "error is",err}) 

    }
}