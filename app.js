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

app.get('/getoffers', function(req, res) {

	var pickupLocation = req.query.pickupLocation;
	var pickupDate = new Date(req.query.pickupDate);

	console.log(pickupLocation);
	console.log(pickupDate);

	getOffers({
			pickupLocation: pickupLocation,
			pickupDate: new Date(2016, 11, 20, 8),
			returnDate: new Date(2016, 11, 23, 8)
		}, function(offer) {
     	res.setHeader('Content-Type', 'application/json');
      	res.send(JSON.stringify(offer, null, 3));
  	});
});

function getOffers(offerRequest, callback) {

	// Request location.
	// TODO: take closest location.

	var options = {
	 	url: 'https://app.sixt.de/php/mobilews/v4/stationsuggestion?address=' + offerRequest.pickupLocation,
	  	headers: {
	    	//'User-Agent': 'request'
	    	'Accept-Language': 'en_US'
	  	}
	};

	request(options, function(error, resp, bodyLocation) {
		bodyLocation = JSON.parse(bodyLocation);

		//console.log(resp);

		var pickupLocationId = bodyLocation.downtownStations[0].identifier;

		// Request offer.
		// TODO: flexi price.
		// TODO: cheapest offer.
		request('https://app.sixt.de/php/mobilews/v4/offerlist?pickupStation=' + pickupLocationId + '&returnStation=' + pickupLocationId + '&pickupDate=' + offerRequest.pickupDate.toISOString() + '&returnDate=' + offerRequest.returnDate.toISOString(), function(error, resp, bodyOffer) {
			bodyOffer = JSON.parse(bodyOffer);

			var offer = {
	    		pickupLocation: bodyLocation.downtownStations[0].name,
	    		returnLocation: bodyLocation.downtownStations[0].name,
	    		pickupDate: offerRequest.pickupDate,
			    returnDate: offerRequest.returnDate,
			    price: bodyOffer.offers[0].rates[0].price.totalPrice,
			    carExmaple: bodyOffer.offers[0].group.modelExample
			};

			callback([offer]);
		});
	});
}

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

module.exports = app;