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

	bookCar({
			pickupLocation: 'Muenchen',
			pickupDate: new Date(2016, 11, 20, 8),
			returnDate: new Date(2016, 11, 23, 8)
		}, function(offer) {
     	res.setHeader('Content-Type', 'application/json');
      	res.send(JSON.stringify(offer, null, 3));
  	});
});

function bookCar(offerRequest, callback) {

	// Request location.
	// TODO: take closest location.
	request('https://app.sixt.de/php/mobilews/v4/stationsuggestion?address=' + offerRequest.pickupLocation, function(error, resp, bodyLocation) {
		bodyLocation = JSON.parse(bodyLocation);

		var pickupLocationId = bodyLocation.downtownStations[0].identifier;

		// Request offer.
		// TODO: flexi price.
		// TODO: cheapest offer.
		request('https://app.sixt.de/php/mobilews/v4/offerlist?pickupStation=' + pickupLocationId + '&returnStation=' + pickupLocationId + '&pickupDate=' + offerRequest.pickupDate.toISOString() + '&returnDate=' + offerRequest.returnDate.toISOString(), function(error, resp, bodyOffer) {
			bodyOffer = JSON.parse(bodyOffer);

			var offer = {
	    		pickup_location: bodyLocation.downtownStations[0].name,
	    		return_location: bodyLocation.downtownStations[0].name,
	    		pickup_date: offerRequest.pickupDate,
			    return_date: offerRequest.returnDate,
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