
const middleWare = function(req, res, next){
    
    res.send("This is middleware")
    next()
}