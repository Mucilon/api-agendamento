
const path = require('path');
require('dotenv').config({path: __dirname + '/.env'})
const express = require('express');
const app = express();
const bodyParse = require('body-parser');
const router = express.Router();


app.use(bodyParse.urlencoded({ extended: false }));
app.use(bodyParse.json());


app.use('/',router);

app.use('/schedule/day', require('./routes/day'));
app.use('/schedule/daily', require('./routes/daily'));
app.use('/schedule/weekdays', require('./routes/week'));


app.listen(process.env.PORT || 3000);

module.exports = app;

