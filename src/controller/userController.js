const userModel = require('../models/userModel')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId
const validator = require('../utils/validate')
const awsFile = require('../utils/aws')
const bcrypt = require('bcrypt')
const saltRounds = 10;



const registerUser = async function (req, res) {
    try {
        let files = req.files //Getting user profileImage  


        let requestBody = req.body // Getting other details of user

        // Validation of Request Body
        if (!validator.isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, message: "Invalid request parameter, please provide user Detaills" })
        }

        // Extract body by destructuring
        let { fname, lname, email, phone, password, address, profileImage } = requestBody

        //--------------------------------------Validation Starts----------------------------------//


        if (!validator.isValid(fname)) {
            return res.status(400).send({ status: false, message: "Invalid request parameter, please provide fname" })
        }

        if (!validator.isValid(lname)) {
            return res.status(400).send({ status: false, message: "Invalid request parameter, please provide lname" })
        }

        if (!validator.isValid(email)) {
            return res.status(400).send({ status: false, message: "Invalid request parameter, please provide email" })
        }

        // E-mail validation by regex
        if (!/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(email)) {
            return res.status(400).send({ status: false, message: `Email should be a valid email address` });
        }
        // Checking E-mail for Uniqueness
        let isEmailAlredyPresent = await userModel.findOne({ email: email })

        if (isEmailAlredyPresent) {
            return res.status(400).send({ status: false, message: `Email Already Present` });
        }

        if (!validator.isValid(phone)) {
            return res.status(400).send({ status: false, message: "Invalid request parameter, please provide Phone" })
        }


        // Indian type phone number validation
        if (!/^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[6789]\d{9}$/.test(phone)) {
            return res.status(400).send({ status: false, message: `Mobile should be a valid number` });

        }
        // Checking phone number for uniqueness
        let isPhoneAlredyPresent = await userModel.findOne({ phone: phone })

        if (isPhoneAlredyPresent) {
            return res.status(400).send({ status: false, message: `Phone Number Already Present` });
        }

        if (!validator.isValid(password)) {
            return res.status(400).send({ status: false, message: "Invalid request parameter, please provide password" })
        }
        // Checking the length of password
        if (!(password.length >= 8 && password.length <= 15)) {
            return res.status(400).send({ status: false, message: "Password should be Valid min 8 and max 15 " })
        }



        password = await bcrypt.hash(password, saltRounds); //Encrypting Password by Bcrypt package

        // Shipping Adress validation
        if (address.shipping) { 
            if (address.shipping.street) {
                if (!validator.isValidRequestBody(address.shipping.street)) {
                    return res.status(400).send({ status: false, message: 'Shipping Street Required' })
                }
            } else {
                return res.status(400).send({ status: false, message: " Invalid request parameters. Shipping Address cannot be empty" })
            }

            if (address.shipping.city) {
                if (!validator.isValidRequestBody(address.shipping.city)) {
                    return res.status(400).send({ status: false, message: 'Shipping city Required' })
                }
            } else {
                return res.status(400).send({ status: false, message: " Invalid request parameters. Shipping city cannot be empty" })
            }
            if (address.shipping.pincode) {
                if (!validator.isValidRequestBody(address.shipping.pincode)) {
                    return res.status(400).send({ status: false, message: 'Shipping pincode Required' })
                }
            } else {
                return res.status(400).send({ status: false, message: " Invalid request parameters. Shipping pincode cannot be empty" })
            }
        } else {
            return res.status(400).send({ status: false, message: " Invalid request parameters. Shipping address required" })
        }

        // Billing Adress validation
        if (address.billing) {
            if (address.billing.street) {
                if (!validator.isValidRequestBody(address.billing.street)) {
                    return res.status(400).send({ status: false, message: 'billing Street Required' })
                }
            } else {
                return res.status(400).send({ status: false, message: " Invalid request parameters. billing Address cannot be empty" })
            }

            if (address.billing.city) {
                if (!validator.isValidRequestBody(address.billing.city)) {
                    return res.status(400).send({ status: false, message: 'billing city Required' })
                }
            } else {
                return res.status(400).send({ status: false, message: " Invalid request parameters. billing city cannot be empty" })
            }

            if (address.billing.pincode) {
                if (!validator.isValidRequestBody(address.billing.pincode)) {
                    return res.status(400).send({ status: false, message: 'billing pincode Required' })
                }
            } else {
                return res.status(400).send({ status: false, message: " Invalid request parameters. billing pincode cannot be empty" })
            }

            if (!(files && files.length > 0)) {
                return res.status(400).send({ status: false, message: "Invalid request parameter, please provide profile image" })
            }
        } else {
            return res.status(400).send({ status: false, message: " Invalid request parameters. Shipping address required" })
        }

        //--------------------------------------Validation Ends----------------------------------//

        profileImage = await awsFile.uploadFile(files[0])   //profileImage uploaded to AWS S3 Bucket
        const udatedBody = { fname, lname, email, phone, password, address, profileImage }
        let user = await userModel.create(udatedBody)
        res.status(201).send({ status: true, message: 'User created successfully', data: user })


    } catch (err) {
        res.status(500).send({ status: false, msg: err.message })
    }

}


//!------LoginUser API

const loginUser = async function (req, res) {


    try {
        let requestBody = req.body; //Getting E-Mail and Password from request Body

        // Request Body validation
        if (!validator.isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, msg: "Please enter login credentials" });
        }

        // Destructuring request body
        let { email, password } = requestBody;
        

        if (!validator.isValid(email)) {
            res.status(400).send({ status: false, msg: "enter an email" });
            return;
        }

        // E-Mail validation by Regex
        if (!/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(email)) {
            return res.status(400).send({ status: false, message: `Email should be a valid email address` });
        }

        if (!validator.isValid(password)) {
            res.status(400).send({ status: false, msg: "enter a password" });
            return;
        }

        // Password length validation
        if (!(password.length >= 8 && password.length <= 15)) {
            return res.status(400).send({ status: false, message: "Password should be Valid min 8 and max 15 " })
        }

        // Find user details from DB 
        const user = await userModel.findOne({ email: email });
        
        // Checking User exists or not
        if (!user) {
            res.status(401).send({ status: false, msg: " Either email or password incorrect" });
            return;
        }

        //Decrypt password by Bcrypt and Compare the password with password from request body
        const extractPassword = await userModel.findOne({ email: email });
        let hash = extractPassword.password
        let pass = await bcrypt.compare(password, hash)
        if (!pass) {
            return res.status(400).send({ status: false, message: "Password Incorrect" })
        }

        // JWT token creation for authentication of other APIs
        const token = jwt.sign({userId: user._id}, 'project 5-cart')


        // Sending token in response header 
        res.header('BearerToken', token)
        res.status(201).send({ status: true, msg: "successful login", data: { userId: user._id, token: token } });
    } catch (error) {
        res.status(500).send({ status: false, msg: error.message });
    }
}

const getProfile = async function (req, res) {
    try {
        const userId = req.params.userId //Getting userId provided as path parameters 
        const userIdFromToken = req.userId //UserId key in request which was decoded in middleware for authorisation
        
        //validation starts
        if (!validator.isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Invalid userId in params." })
        }
        if (!validator.isValid(userId)) {
            return res.status(400).send({ status: false, message: `${userId} is not a valid user id or not present ` })

        }
        //validation ends


        //UserId for authorisation and User details
        const findUser = await userModel.findOne({ _id: userId })
        
        // In case User doesn't exist
        if (!findUser) {
            return res.status(400).send({
                status: false, message: `User doesn't exists by ${userId}`
            })
        }

        // Authorisation
        if (findUser._id.toString() !== userIdFromToken) {
            res.status(401).send({ status: false, message: `Unauthorized access! Owner info doesn't match` });
            return
        }


        return res.status(200).send({ status: true, message: "Profile found successfully.", data: findUser })
    } catch (err) {
        return res.status(500).send({
            status: false,
            message: "Error is: " + err.message
        })
    }
}

const updateUser = async function (req, res) {
    try {
        let files = req.files // Profile Image for updation
        let requestBody = req.body // Other details for updation from request body
        let params = req.params 
        let userId = params.userId  //UserId as path parameter
        let userIdFromToken = req.userId    //UserId from decode token from userId key in request sent from middleware


        // if (!validator.isValidRequestBody(requestBody)) {
        //     res.status(400).send({ status: false, message: 'No paramateres passed. book unmodified' })
        //     return
        // }
        
        // Validating ObjectId format of UserId from path parameters
        if (!validator.isValidObjectId(userId)) {
            res.status(400).send({ status: false, message: `${userId} is not a valid user id` })
            return
        }

        // Checking user details exist or not
        const findUser = await userModel.findOne({ _id: userId })
        if (!findUser) {
            return res.status(400).send({
                status: false, message: `User doesn't exists by ${userId}`
            })
        }

        // Authorisation
        if (findUser._id.toString() !== userIdFromToken) {
            res.status(401).send({ status: false, message: `Unauthorized access! Owner info doesn't match` });
            return
        }



        // Extract params by destructuring
        let { fname, lname, email, phone, password, address, profileImage } = requestBody;

        if (!validator.validString(fname)) {
            return res.status(400).send({ status: false, message: 'fname Required' })
        }
        if (fname) {
            if (!validator.isValid(fname)) {
                return res.status(400).send({ status: false, message: "Invalid request parameter, please provide fname" })
            }

        }

        if (!validator.validString(lname)) {              
            return res.status(400).send({ status: false, message: 'lname Required' })
        }

        if (lname) {
            if (!validator.isValid(lname)) {
                return res.status(400).send({ status: false, message: "Invalid request parameter, please provide lname" })
            }


        }


        if (!validator.validString(email)) {
            return res.status(400).send({ status: false, message: 'email Required' })
        }

        if (email) {
            if (!validator.isValid(email)) {
                return res.status(400).send({ status: false, message: "Invalid request parameter, please provide email" })
            }
            
            // E-Mail validation by regex
            if (!/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(email)) {
                return res.status(400).send({ status: false, message: `Email should be a valid email address` });
            }
            // E-Mail validation for Uniqueness
            let isEmailAlredyPresent = await userModel.findOne({ email: email })

            if (isEmailAlredyPresent) {
                return res.status(400).send({ status: false, message: `Email Already Present` });
            }

        }


        if (!validator.validString(phone)) {
            return res.status(400).send({ status: false, message: 'phone Required' })
        }
        if (phone) {
            if (!validator.isValid(phone)) {
                return res.status(400).send({ status: false, message: "Invalid request parameter, please provide Phone" })
            }
            // Phone number validation by regex
            if (!/^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[6789]\d{9}$/.test(phone)) {
                return res.status(400).send({ status: false, message: `Mobile should be a valid number` });

            }
            // Phone number validation for uniqueness
            let isPhoneAlredyPresent = await userModel.findOne({ phone: phone })

            if (isPhoneAlredyPresent) {
                return res.status(400).send({ status: false, message: `Phone Number Already Present` });
            }

        }

        if (!validator.validString(password)) {
            return res.status(400).send({ status: false, message: 'password Required' })
        }
        let tempPassword = password

        if (tempPassword) {
            if (!validator.isValid(tempPassword)) {
                return res.status(400).send({ status: false, message: "Invalid request parameter, please provide password" })
            }

            // Password length validation
            if (!(tempPassword.length >= 8 && tempPassword.length <= 15)) {
                return res.status(400).send({ status: false, message: "Password should be Valid min 8 and max 15 " })
            }

            var PassWord = await bcrypt.hash(tempPassword, saltRounds)

        }





        //!----------

        // console.log(address)
        if (address) {
            let x=JSON.stringify(address)
            let y = JSON.parse(x)
            if (validator.isValidRequestBody(y)) {
                if (y.hasOwnProperty('shipping')) {
                    if (y.shipping.hasOwnProperty('street')) {
                        if (!validator.isValid(y.shipping.street)) {
                            return res.status(400).send({ status: false, message: " Invalid request parameters. Please provide Street" });
                        }
                    }
                    if (y.shipping.hasOwnProperty('city')) {
                        if (!validator.isValid(y.shipping.city)) {
                            return res.status(400).send({ status: false, message: " Invalid request parameters. Please provide City" });
                        }
                    }
                    if (y.shipping.hasOwnProperty('pincode')) {
                        if (!validator.isValid(y.shipping.pincode)) {
                            return res.status(400).send({ status: false, message: " Invalid request parameters. Please provide pincode" });
                        }
                    }
                    var shippingStreet = address.shipping.street
                    var shippingCity = address.shipping.city
                    var shippingPincode = address.shipping.pincode
                }
            } else {
                return res.status(400).send({ status: false, message: " Invalid request parameters. Address cannot be empty" });
            }
        }

        if (address) {
            let x=JSON.stringify(address)
            let y = JSON.parse(x)
            if (validator.isValidRequestBody(y)) {
                if (y.hasOwnProperty('billing')) {
                    if (y.billing.hasOwnProperty('street')) {
                        if (!validator.isValid(y.billing.street)) {
                            return res.status(400).send({ status: false, message: " Invalid request parameters. Please provide  b Street" });
                        }
                    }
                    if (y.billing.hasOwnProperty('city')) {
                        if (!validator.isValid(y.billing.city)) {
                            return res.status(400).send({ status: false, message: " Invalid request parameters. Please provide  b City" });
                        }
                    }
                    if (y.billing.hasOwnProperty('pincode')) {
                        if (!validator.isValid(y.billing.pincode)) {
                            return res.status(400).send({ status: false, message: " Invalid request parameters. Please provide  b pincode" });
                        }
                    }
                    var billingStreet = address.billing.street
                    var billingCity = address.billing.city
                    var billingPincode = address.billing.pincode
                }
            } else {
                return res.status(400).send({ status: false, message: " Invalid request parameters. Address cannot be empty" });
            }
        }


        if (files) {
            if (validator.isValidRequestBody(files)) {
                if (!(files && files.length > 0)) {
                    return res.status(400).send({ status: false, message: "Invalid request parameter, please provide profile image" })
                }
                profileImage = await awsFile.uploadFile(files[0])
            }
        }

        ///---------------------------------------Validation Ends --------------------------------//




        let updatedBookData = await userModel.findOneAndUpdate({ _id: userId },

            {
                $set:
                {
                    fname: fname,
                    lname: lname,
                    email: email,
                    profileImage: profileImage,
                    phone: phone,
                    password: PassWord,
                    'address.shipping.street': shippingStreet,
                    'address.shipping.city': shippingCity,
                    'address.shipping.pincode': shippingPincode,
                    'address.billing.street': billingStreet,
                    'address.billing.city': billingCity,
                    'address.billing.pincode': billingPincode

                }
            }, { new: true }
        )


        res.status(200).send({ status: true, data: updatedBookData })


    } catch (err) {
        return res.status(500).send({
            status: false,
            message: "Error is: " + err.message
        })
    }
}

module.exports = {
    registerUser, loginUser, getProfile, updateUser
}
