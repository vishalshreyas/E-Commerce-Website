const jwt = require('jsonwebtoken')


const userAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization' , 'Bearer Token')

        
        if(!token){
            return res.status(403).send({ status: false, message: `Missing authentication token in request` })
        }

        let verifyToken = jwt.verify(token, 'project4')
       
        let x=token.split(' ')
 
        let timeOut = jwt.decode(x[1],'project 5-cart') 
        
       
       
   
        
        if (!verifyToken) {
            return res.status(403).send({ status: false, message: `Invalid authentication token in request ` })
        }

        if (Date.now() > (timeOut.exp)*1000 ){
            return res.status(404).send({ status: false, message: `Session Expired, please login again` })
        }



        req.userId = timeOut.userId

        next()
    } catch (error) {
        console.error(`Error! ${error.message}`)
        res.status(500).send({ status: false, message: error.message })
    }
}


module.exports = {
    userAuth
}