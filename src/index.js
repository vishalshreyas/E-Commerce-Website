const express = require('express');
var bodyParser = require('body-parser');
const mongoose = require('mongoose')
const route = require('./routes/route.js');
var multer = require('multer') // HERE Helps us upload files to AWS

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer().any()) // HERE making it global

mongoose.connect("mongodb+srv://monty-python:SnYUEY4giV9rekw@functionup-backend-coho.0zpfv.mongodb.net/quoraN?retryWrites=true&w=majority", { useNewUrlParser: true })
    .then(() => console.log('mongodb running perfectly on 27017'))
    .catch(err => console.log(err))



app.use('/', route);

app.listen(process.env.PORT || 3000, function() {
	console.log('Express app running on port ' + (process.env.PORT || 3000))
});