const mongoose = require('mongoose')
const aws = require("aws-sdk");
const currencySymbol = require("currency-symbol-map")
const productModel = require('../models/productModel')
const ObjectId = mongoose.Types.ObjectId
const validator = require('../utils/validate')
const awsFile = require('../utils/aws')



const createProduct = async function (req, res) {
    try {
        let requestBody = req.body;
        let productImage = req.files
        //----------------Validation Starts-------------------------------------//
        if (!validator.isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide product details.' })
        }

        const { title, description, price, currencyId, isFreeShipping, style, availableSizes, installments } = requestBody;

        if (!validator.isValid(title)) {
            return res.status(400).send({ status: false, message: 'Invalid request parameters. Title is required' })
        }

        const isTitleAlreadyUsed = await productModel.findOne({ title });

        if (isTitleAlreadyUsed) {
            return res.status(400).send({ status: false, message: 'Invalid request parameters. Title is already registered.' })
        }

        if (!validator.isValid(description)) {
            return res.status(400).send({ status: false, message: 'Invalid request parameters. Provide description details.' })
        }

        if (!validator.isValid(price)) {
            return res.status(400).send({ status: false, message: 'Invalid request parameters. Provide product price.' })
        }

        if (!(!isNaN(Number(price)))) {
            return res.status(400).send({ status: false, message: `Price should be a valid number` })
        }
        if (price <= 0) {
            return res.status(400).send({ status: false, message: `Price should be a valid number` })
        }

        if (!validator.isValid(currencyId)) {
            return res.status(400).send({ status: false, message: 'Invalid request parameters. Provide currencyId.' })
        }

        if (!(currencyId == "INR")) {
            return res.status(400).send({ status: false, message: 'currencyId should be INR' })
        }


        if (installments) {
            if (!(!isNaN(Number(installments)))) {
                return res.status(400).send({ status: false, message: `Installments should be a valid number` })
            }
        }

        if (validator.isValid(isFreeShipping)) {

            if (!((isFreeShipping === "true") || (isFreeShipping === "false"))) {
                return res.status(400).send({ status: false, message: 'isFreeShipping should be true or false' })
            }
        }

       
        if (!(productImage && productImage.length > 0)) {
            return res.status(400).send({ status: false, msg: "Invalid request parameters. Provide productImage." });
        }
        const downloadUrl = await awsFile.uploadFile(productImage[0]);

        const productData = {
            title,
            description,
            price,
            currencyId,
            currencyFormat: currencySymbol(currencyId),
            isFreeShipping,
            style,
            installments,
            productImage: downloadUrl
        }

        if (!validator.isValid(availableSizes)) {
            return res.status(400).send({ status: false, message: 'Invalid request parameters. Provide availableSizes.' })
        }

        if (availableSizes) {
            let arr = availableSizes.split(",").map(x => x.trim())

            
            for (let i = 0; i < arr.length; i++) {
                if (!(["S", "XS", "M", "X", "L", "XXL", "XL"].includes(arr[i]))) {
                    return res.status(400).send({ status: false, msg: 'availableSizes should be among ["S", "XS", "M", "X", "L", "XXL", "XL"]' })
                }
            }

            // if (!found) {
            //     return res.status(400).send({ status: false, message: `availableSizes should be among ${["S", "XS", "M", "X", "L", "XXL", "XL"].join(', ')}` })
            // }

            function onlyUnique(value, index, self){
                return self.indexOf(value) === index  //value = "M" true  

            }
            let unique = arr.filter(onlyUnique)  //["M", "S"]
            if (Array.isArray(arr)) {
                if (!productData.hasOwnProperty['availableSizes']) {
                    productData['availableSizes'] = unique
                }
            }

        }
        //----------------Validation Ends-------------------------------------//

        const newProduct = await productModel.create(productData)
        res.status(201).send({ status: true, message: "Success", data: newProduct })

    } catch (error) {
        console.log(error)
        res.status(500).send({ status: false, data: error });
    }
}

//!----------Get API

const getAllProducts = async function (req, res) {
    try {
        const filterQuery = { isDeleted: false }
        const queryParams = req.query;

        if (validator.isValidRequestBody(queryParams)) {
            const { size, name, priceGreaterThan, priceLessThan, priceSort } = queryParams;


            if (validator.isValid(size)) {
                filterQuery['availableSizes'] = size  
            }

            if (validator.isValid(name)) {

                filterQuery['title'] = {}
                filterQuery['title']['$regex'] = name          //https://www.guru99.com/regular-expressions-mongodb.html
                filterQuery['title']['$options'] = 'i'
            }

            if (validator.isValid(priceGreaterThan)) {

                if (!(!isNaN(Number(priceGreaterThan)))) {
                    return res.status(400).send({ status: false, message: `priceGreaterThan should be a valid number` })
                }
                if (priceGreaterThan <= 0) {
                    return res.status(400).send({ status: false, message: `priceGreaterThan should be a valid number` })
                }
                if (!filterQuery.hasOwnProperty('price'))
                    filterQuery['price'] = {}
                filterQuery['price']['$gte'] = Number(priceGreaterThan)
            }

            if (validator.isValid(priceLessThan)) {

                if (!(!isNaN(Number(priceLessThan)))) {
                    return res.status(400).send({ status: false, message: `priceLessThan should be a valid number` })
                }
                if (priceLessThan <= 0) {
                    return res.status(400).send({ status: false, message: `priceLessThan should be a valid number` })
                }
                if (!filterQuery.hasOwnProperty('price'))
                    filterQuery['price'] = {}
                filterQuery['price']['$lte'] = Number(priceLessThan)
            }

            if (validator.isValid(priceSort)) {

                if (!((priceSort == 1) || (priceSort == -1))) {
                    return res.status(400).send({ status: false, message: `priceSort should be 1 or -1 ` })
                }

                const products = await productModel.find(filterQuery).sort({ price: priceSort })

                if (Array.isArray(products) && products.length === 0) {
                    return res.status(404).send({ statuproductss: false, message: 'No Product found' })
                }

                return res.status(200).send({ status: true, message: 'Product list', data: products })
            }
        }

        const products = await productModel.find(filterQuery)
       


        if (Array.isArray(products) && products.length === 0) {
            return res.status(404).send({ statuproductss: false, message: 'No Product found' })
        }

        return res.status(200).send({ status: true, message: 'Product list', data: products })
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

//!-------------getByID API

const getProductById = async function (req, res) {

    try {

        const productId = req.params.productId

        if (!validator.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "Invalid productId in params." })
        }

        const productDet = await productModel.findOne({ _id: productId, isDeleted: false });

        if (!productDet) {
            return res.status(404).send({ status: false, message: 'Product does not exist' })
        }

        return res.status(200).send({ status: true, message: 'Success', data: productDet })

    } catch (error) {

        return res.status(500).send({ status: false, message: error.message });

    }

}

//!------UpdateProduct API

const updateProduct = async function (req, res) {
    try {
        const requestBody = req.body
        const productId = req.params.productId
        const productImage = req.files;

        if (!validator.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "Invalid productId in params." })
        }




        if (!validator.isValidRequestBody(requestBody) && req.files && req.files.length == 0) {

            return res.status(400).send({ status: false, message: 'No paramateres passed product unmodified' })
        }

        // if(!productImage.length==0){
        //     return res.status(400).send({ status: false, message: 'No paramateres passed product unmodified' })
        // }



        const product = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!product) {
            return res.status(404).send({ status: false, message: 'Product is not found' })
        }
        const { title, description, price, currencyId, isFreeShipping, style, availableSizes, installments } = requestBody;

        const updatedProductData = {}

        if (validator.isValid(title)) {
            const isTitleAlreadyUsed = await productModel.findOne({ title: title });
            if (isTitleAlreadyUsed) {
                return res.status(400).send({ status: false, message: 'title is already used' })
            }
            if (!updatedProductData.hasOwnProperty['title']) {
                updatedProductData['title'] = title
            }
        }
        if (validator.isValid(description)) {
            if (!updatedProductData.hasOwnProperty['description']) {
                updatedProductData['description'] = description
            }
        }
        if (validator.isValid(price)) {
            if (!(!isNaN(Number(price)))) {
                return res.status(400).send({ status: false, message: `Price should be a valid number` })
            }
            if (price <= 0) {
                return res.status(400).send({ status: false, message: `Price should be a valid number` })
            }
            if (!updatedProductData.hasOwnProperty['price']) {
                updatedProductData['price'] = price
            }
        }
        if (validator.isValid(currencyId)) {
            if (!(currencyId == "INR")) {
                return res.status(400).send({ status: false, message: 'currencyId should be INR' })
            }
            if (!updatedProductData.hasOwnProperty['currencyId']) {
                updatedProductData['currencyId'] = currencyId
            }
        }

        if (validator.isValid(isFreeShipping)) {
            if (!((isFreeShipping === "true") || (isFreeShipping === "false"))) {
                return res.status(400).send({ status: false, message: 'isFreeShipping should be true or false' })
            }
            if (!updatedProductData.hasOwnProperty['isFreeShipping']) {
                updatedProductData['isFreeShipping'] = isFreeShipping
            }
        }
        if (validator.isValid(style)) {
            if (!updatedProductData.hasOwnProperty['style']) {
                updatedProductData['style'] = style
            }
        }
        if (validator.isValid(availableSizes)) {
            let arr = availableSizes.split(",").map(x => x.trim())
            for (let i = 0; i < arr.length; i++) {
                if (!(["S", "XS", "M", "X", "L", "XXL", "XL"].includes(arr[i]))) {
                    return res.status(400).send({ status: false, msg: 'availableSizes should be among ["S", "XS", "M", "X", "L", "XXL", "XL"]' })
                }
            }
            let data = await productModel.findOne({ _id: productId }).select({ availableSizes: 1 })
            let sizes = data.availableSizes
            let newArr = [...arr, ...sizes] //["M", "M","S"] === self
            function onlyUnique(value, index, self){
                return self.indexOf(value) === index  //value = "M" true  

            }
            let unique = newArr.filter(onlyUnique)  //["M", "S"]
            if (Array.isArray(arr)) {
                if (!updatedProductData.hasOwnProperty['availableSizes']) {
                    updatedProductData['availableSizes'] = unique
                }
            }
        }
        if (validator.isValid(installments)) {
            if (!(!isNaN(Number(installments)))) {
                return res.status(400).send({ status: false, message: `Installments should be a valid number` })
            }
            if (!updatedProductData.hasOwnProperty['installments']) {
                updatedProductData['installments'] = installments
            }
        }


        if (productImage && !productImage.length == 0) {   //Undefined.length will not work in JS
            if (!validator.isValidRequestBody(productImage)) {
                return res.status(400).send({ status: false, msg: "Invalid request parameters. Provide productImage." });
            }
            const downloadUrl = await awsFile.uploadFile(productImage[0]);
            if (!updatedProductData.hasOwnProperty['productImage']) {
                updatedProductData['productImage'] = downloadUrl
            }
        }
        const updatedProduct = await productModel.findOneAndUpdate({ _id: productId }, updatedProductData, { new: true })
        return res.status(200).send({ status: true, message: 'Success', data: updatedProduct });
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}


//!-----------DeleteProduct API

const deleteProductById = async function (req, res) {
    try {
        const productId = req.params.productId

        if (!validator.isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "Invalid productId in params." })
        }

        const product = await productModel.findOne({ _id: productId, isDeleted: false })

        if (!product) {
            return res.status(404).send({ status: false, message: `product not found` })
        }
        await productModel.findOneAndUpdate({ _id: productId }, { $set: { isDeleted: true, deletedAt: new Date() } })
        return res.status(200).send({ status: true, message: 'Successfully deleted' })
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}




module.exports = {
    createProduct, getAllProducts, getProductById, updateProduct, deleteProductById
}


