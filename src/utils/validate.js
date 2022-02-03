const mongoose = require('mongoose')

const isValid = function (value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    return true;
}

const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0
}

const isValidObjectId = function (objectId) {
    return mongoose.Types.ObjectId.isValid(objectId)
}

const validString = function (value) {
    if (typeof value === 'string' && value.trim().length === 0) return false
    return true;
}

const isValidTitle = function (title) {
    return ['Mr', 'Mrs', 'Miss', 'Mast'].indexOf(title) !== -1
}

const isValidStatus = function (title) {

    return ['pending', 'completed', 'cancelled'].indexOf(title) !== -1
   
}

const validInteger = function isInteger(value) {
    return value % 1 == 0;
}
module.exports = {
    isValid,
    isValidRequestBody,
    isValidObjectId,
    validString,
    isValidTitle,
    validInteger,
    isValidStatus
}

