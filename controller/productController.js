const mongoose = require('mongoose')
const aws = require("aws-sdk");
const currencySymbol = require("currency-symbol-map")
const productModel = require('../models/productModel')

const isValid = function (value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    if (typeof value === 'number' && value.toString().trim().length === 0) return false
    return true;
}

const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0
}

// const isValidAvailableSizes = function (title) {
//     return ["S", "XS", "M", "X", "L", "XXL", "XL"].indexOf(title) !== -1;
//   };

aws.config.update({
    accessKeyId: "AKIAY3L35MCRRMC6253G",  // id
    secretAccessKey: "88NOFLHQrap/1G2LqUy9YkFbFRe/GNERsCyKvTZA",  // like your secret password
    region: "ap-south-1" // Mumbai region
  });
  
  
  // this function uploads file to AWS and gives back the url for the file
  let uploadFile = async (file) => {
    return new Promise(function (resolve, reject) { // exactly 
      
      // Create S3 service object
      let s3 = new aws.S3({ apiVersion: "2006-03-01" });
      var uploadParams = {
        ACL: "public-read", // this file is publically readable
        Bucket: "classroom-training-bucket", // HERE
        Key: "pk_newFolder/folderInsideFolder/oneMore/foo/" + file.originalname, // HERE    "pk_newFolder/harry-potter.png" pk_newFolder/harry-potter.png
        Body: file.buffer, 
      };
  
      // Callback - function provided as the second parameter ( most oftenly)
      s3.upload(uploadParams , function (err, data) {
        if (err) {
          return reject( { "error": err });
        }
        console.log(data)
        console.log(`File uploaded successfully. ${data.Location}`);
        return resolve(data.Location); //HERE 
      });
    });
  };

  const createProduct = async function (req, res) {
    try {
        let requestBody = req.body;
        console.log(req.body)
        //----------------Validation Starts-------------------------------------//
        if (!isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: 'Invalid request parameters. Please provide product details.' })
        }

        const { title, description, price, currencyId, isFreeShipping, style, availableSizes, installments } = requestBody;

        if (!isValid(title)) {
            return res.status(400).send({ status: false, message: 'Invalid request parameters. Title is required' })
        }

        const isTitleAlreadyUsed = await productModel.findOne({ title });

        if (isTitleAlreadyUsed) {
            return res.status(400).send({ status: false, message: 'Invalid request parameters. Title is already registered.' })
        }

        if (!isValid(description)) {
            return res.status(400).send({ status: false, message: 'Invalid request parameters. Provide description details.' })
        }

        if (!isValid(price)) {
            return res.status(400).send({ status: false, message: 'Invalid request parameters. Provide product price.' })
        }

        if (!(!isNaN(Number(price)))) {
            return res.status(400).send({ status: false, message: `Price should be a valid number` })
        }
        if (price<=0) {
            return res.status(400).send({ status: false, message: `Price should be a valid number` })
        }

        if (!isValid(currencyId)) {
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

        if (isValid(isFreeShipping)) {

            if(!((isFreeShipping === "true")  || (isFreeShipping === "false"))){
                return res.status(400).send({ status: false, message: 'isFreeShipping should be true or false' })
            }
        }

        if(!isValid(availableSizes)) {
            return res.status(400).send({ status: false, message: 'Invalid request parameters. Provide availableSizes.' })
        }

        if (availableSizes) {
            let arr = availableSizes.split(",").map(x => x.trim())

            // for (let i = 0; i < arr.length; i++) {
            //     if (!(["S", "XS", "M", "X", "L", "XXL", "XL"].includes(arr[i]))) {
            //         return res.status(400).send({ status: false, message: `availableSizes should be among ["S", "XS", "M", "X", "L", "XXL", "XL"]` })
            //     }
            // }
            const found = ["S", "XS", "M", "X", "L", "XXL", "XL"].some(r=> arr.includes(r))

            if(!found){
                return res.status(400).send({ status: false, message: `availableSizes should be among ${["S", "XS", "M", "X", "L", "XXL", "XL"].join(', ')}` })
            }
            
            if (Array.isArray(arr)) {
                productData['availableSizes'] = arr
            }
        }
         //----------------Validation Ends-------------------------------------//
        const productImage = req.files;
        if (!(productImage && productImage.length > 0)) {
            return res.status(400).send({ status: false, msg: "Invalid request parameters. Provide productImage." });
        }

        const downloadUrl = await uploadFile(productImage[0]);

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

        
        const newProduct = await productModel.create(productData)
        res.status(201).send({ status: true, message: "Success", data: newProduct })

    } catch (error) {
        console.log(error)
        res.status(500).send({ status: false, data: error });
    }
}

const getAllProducts = async function (req, res) {
    try {
        const filterQuery = { isDeleted: false }
        const queryParams = req.query;

        if (isValidRequestBody(queryParams)) {
            const { size, name, priceGreaterThan, priceLessThan, priceSort} = queryParams;


            if (isValid(size)) {
                filterQuery['availableSizes'] = size
            }

            if (isValid(name)) {
                filterQuery['title'] = {}
                filterQuery['title']['$regex'] = name
                filterQuery['title']['$options'] = 'i'
            }

            if (isValid(priceGreaterThan)) {

                if (!(!isNaN(Number(priceGreaterThan)))) {
                    return res.status(400).send({ status: false, message: `priceGreaterThan should be a valid number` })
                }
                if (priceGreaterThan <= 0) {
                    return res.status(400).send({ status: false, message: `priceGreaterThan should be a valid number` })
                }
                if (!Object.prototype.hasOwnProperty.call(filterQuery, 'price'))
                    filterQuery['price'] = {}
                filterQuery['price']['$gte'] = Number(priceGreaterThan)
                }

            if (isValid(priceLessThan)) {

                if (!(!isNaN(Number(priceLessThan)))) {
                    return res.status(400).send({ status: false, message: `priceLessThan should be a valid number` })
                }
                if (priceLessThan <= 0) {
                    return res.status(400).send({ status: false, message: `priceLessThan should be a valid number` })
                }
                if (!Object.prototype.hasOwnProperty.call(filterQuery, 'price'))
                    filterQuery['price'] = {}
                    filterQuery['price']['$lte'] = Number(priceLessThan)
                }

            if (isValid(priceSort)) {

                if (!((priceSort == 1) || (priceSort == -1))) {
                    return res.status(400).send({ status: false, message: 'priceSort should be 1 or -1 ' })
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



const getProductById = async function (req, res) {
    try {
        const productId = req.params.productId

        const productDet = await productModel.findOne({ _id: productId, isDeleted: false });

        if (!productDet) {
            return res.status(404).send({ status: false, message: 'Product does not exist' })
        }

        return res.status(200).send({ status: true, message: 'Success', data: productDet })
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}

const updateProduct = async function (req, res) {
    try {
        const requestBody = req.body
        
        const productId = req.params.productId

        const product = await productModel.findOne({ _id: productId, isDeleted: false })

        if (!product) {
            return res.status(404).send({ status: false, message: 'Product is not found' })
        }

        const { title, description, price, currencyId, isFreeShipping, style, availableSizes, installments } = requestBody;

        const updatedProductData = {}

        if (isValid(title)) {
            
            const isTitleAlreadyUsed = await productModel.findOne({title: title});

            if (isTitleAlreadyUsed) {
                return res.status(400).send({ status: false, message: 'title is already used' })
            }

            if (!updatedProductData.hasOwnProperty['title']){
                updatedProductData['title'] = title
            }
        }

        if (isValid(description)) {
            
          
            if (!updatedProductData.hasOwnProperty['description']){
                updatedProductData['description'] = description
            }
        }

        if (isValid(price)) {
    
            if (!(!isNaN(Number(price)))) {
                return res.status(400).send({ status: false, message: `Price should be a valid number` })
            }
            if (price<=0) {
                return res.status(400).send({ status: false, message: `Price should be a valid number` })
            }
           
            if (!updatedProductData.hasOwnProperty['price']){
                updatedProductData['price'] = price
            }
        }

        if (isValid(currencyId)) {
           
            if (!(currencyId == "INR")) {
                return res.status(400).send({ status: false, message: 'currencyId should be INR' })
            }
           
            if (!updatedProductData.hasOwnProperty['currencyId']){
                updatedProductData['currencyId'] = currencyId
            }
        }

        if (isValid(isFreeShipping)) {
           
            if (!(!isNaN(Number(installments)))) {
                return res.status(400).send({ status: false, message: `Installments should be a valid number` })
            }

            if (!updatedProductData.hasOwnProperty['isFreeShipping']){
                updatedProductData['isFreeShipping'] = isFreeShipping
            }
        }

        if (isValid(style)) {
            
            
            if (!updatedProductData.hasOwnProperty['style']){
                updatedProductData['style'] = style
            }
        }

        if (isValid(availableSizes)) {
           
            let arr = availableSizes.split(",").map(x => x.trim())
    
            const found = ["S", "XS", "M", "X", "L", "XXL", "XL"].some(r=> arr.includes(r))
    
            if(!found){
                return res.status(400).send({ status: false, message: `availableSizes should be among ${["S", "XS", "M", "X", "L", "XXL", "XL"].join(', ')}` })
            }
                
            if (Array.isArray(arr)) {
                if (!updatedProductData.hasOwnProperty['availableSizes']){
                        updatedProductData['availableSizes'] = availableSizes
                }
            }
        
        }

        if (isValid(installments)) {
            
            if (!(!isNaN(Number(installments)))) {
                return res.status(400).send({ status: false, message: `Installments should be a valid number` })
            }

            if (!updatedProductData.hasOwnProperty['installments']){
                updatedProductData['installments'] = installments
            }
        }
        
        const productImage = req.files;
        if(isValid(productImage)){
            if (!(productImage && productImage.length > 0)) {
                return res.status(400).send({ status: false, msg: "Invalid request parameters. Provide productImage." });
            }
            const downloadUrl = await uploadFile(productImage[0]);
           
            if (!updatedProductData.hasOwnProperty['productImage']){
                updatedProductData['productImage'] = downloadUrl
            }
        } 

        const updatedProduct = await productModel.findOneAndUpdate({ _id: productId }, updatedProductData, { new: true })

        return res.status(200).send({ status: true, message: 'Success', data: updatedProduct });

    } catch(error){
        return res.status(500).send({ status: false, message: error.message });
    }
}

const deleteProductById = async function (req, res) {
    try {
        const productId = req. params.productId

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

module.exports = {createProduct, getAllProducts, updateProduct, getProductById, deleteProductById}


