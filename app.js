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

	bookCar('11', new Date(2016, 11, 20), new Date(2016, 11, 23), function(offer) {
     	res.setHeader('Content-Type', 'application/json');
      	res.send(JSON.stringify(offer, null, 3));
  	});
});

function bookCar(pickup_location, pickup_date, return_date, callback) {
  var offer = {
    pickup_location: "Munich Airport",
    return_location: "Munich Airport",
    pickup_date: new Date(),
    return_date: new Date(),
    price: 59.99,
    car_exmaple: "3er BMW"
  };

	request('https://app.sixt.de/php/mobilews/v4/offerlist?pickupStation=' + pickup_location + '&returnStation=' + pickup_location + '&pickupDate=' + pickup_date.toISOString() + '&returnDate=' + return_date.toISOString(), function(error, resp, body) {
		body = JSON.parse(body);
		callback(body);
	});
}

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

module.exports = app;