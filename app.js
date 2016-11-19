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

	bookCar('Muenchen', new Date(2016, 11, 20, 8), new Date(2016, 11, 23, 8), function(offer) {
     	res.setHeader('Content-Type', 'application/json');
      	res.send(JSON.stringify(offer, null, 3));
  	});
});

function bookCar(pickup_location, pickup_date, return_date, callback) {

	// Request location.
	// TODO: take closest location.
	request('https://app.sixt.de/php/mobilews/v4/stationsuggestion?address=' + pickup_location, function(error, resp, bodyLocation) {
		bodyLocation = JSON.parse(bodyLocation);

		var pickupLocationId = bodyLocation.downtownStations[0].identifier;

		// Request offer.
		// TODO: flexi price.
		// TODO: cheapest offer.
		request('https://app.sixt.de/php/mobilews/v4/offerlist?pickupStation=' + pickupLocationId + '&returnStation=' + pickupLocationId + '&pickupDate=' + pickup_date.toISOString() + '&returnDate=' + return_date.toISOString(), function(error, resp, bodyOffer) {
			bodyOffer = JSON.parse(bodyOffer);

			console.log(bodyOffer)

			var offer = {
	    		pickup_location: bodyLocation.downtownStations[0].name,
	    		return_location: bodyLocation.downtownStations[0].name,
	    		pickup_date: pickup_date,
			    return_date: return_date,
			    price: bodyOffer.offers[0].rates[0].price.totalPrice,
			    car_exmaple: bodyOffer.offers[0].group.modelExample
			};

			callback(offer);
		});
	});
}

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

module.exports = app;