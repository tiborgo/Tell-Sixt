'use strict';

const
  bodyParser = require('body-parser'),
  config = require('config'),
  crypto = require('crypto'),
  express = require('express'),
  https = require('https'),  
  request = require('request');

var app = express();
app.set('port', process.env.PORT || 5000);
app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/bookcar', function(req, res) {
    bookCar(function(offer) {
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(offer, null, 3));
  });
});

// pickup_location, pickup_date, return_date,
function bookCar(callback) {
  var offer = {
    pickup_location: "Munich Airport",
    return_location: "Munich Airport",
    pickup_date: new Date(),
    return_date: new Date(),
    price: 59.99,
    car_exmaple: "3er BMW"
  };
  callback(offer);
}

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

module.exports = app;