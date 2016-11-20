'use strict';

const
  bodyParser = require('body-parser'),
  config = require('config'),
  crypto = require('crypto'),
  express = require('express'),
  http = require('http'),  
  request = require('request');
 
var dateFormat = require('dateformat');

var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);

var conns = [];

var prevOfferRequest = {
	pickupLocation: 'Munich',
	pickupDate: new Date(),
	returnDate: new Date()
};
prevOfferRequest.pickupDate.setHours(12);
prevOfferRequest.returnDate.setHours(12);
prevOfferRequest.pickupDate.setDate(prevOfferRequest.pickupDate.getDate() + 7);
prevOfferRequest.returnDate.setDate(prevOfferRequest.returnDate.getDate() + 10);

app.set('port', process.env.PORT || 5000);
server.listen(app.get('port'), function() {
 	console.log('Node app is running on port', app.get('port'));
});

app.use(express.static('public'));

app.get('/getoffers', function(req, res) {

	var status = req.query.status;
	var offerRequest = {};

	if (status == 'usual') {
		offerRequest = prevOfferRequest;
	}
	else {
		offerRequest = {
			pickupLocation: req.query.pickupLocation,
			pickupDate: new Date(req.query.pickupDate),
			returnDate: new Date(req.query.returnDate)
		};
	}

	console.log(offerRequest);

	var pickupDateStr = formatDate(offerRequest.pickupDate);
	var returnDateStr = formatDate(offerRequest.returnDate);

	if (status == 'new') {
			sendChatMessage('Tell Sixt to book a car in ' + offerRequest.pickupLocation + ' from ' + pickupDateStr + ' to ' + returnDateStr + '.', 'user');
	}
	else if (status == 'usual') {
		sendChatMessage('Tell Sixt to book a car.', 'user');
	}
	else if (status == 'change') {
		if (prevOfferRequest.pickupLocation != offerRequest.pickupLocation) {
			sendChatMessage('No, in ' + offerRequest.pickupLocation, 'user');
		}
		if (prevOfferRequest.pickupDate.toISOString() != offerRequest.pickupDate.toISOString()) {
			sendChatMessage('No, from ' + pickupDateStr, 'user');
		}
		if (prevOfferRequest.returnDate.toISOString() != offerRequest.returnDate.toISOString()) {
			sendChatMessage('No, until ' + returnDateStr, 'user');
		}
	}

	getOffers(offerRequest, status, function(error, offers) {
		if (error) {
			res.status(500).send({ error: 'Error getting offers' });
		}
		res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify(offers, null, 3));
	});
});

app.get('/confirm', function(req, res) {
	res.setHeader('Content-Type', 'application/json');
	res.send(JSON.stringify({}, null, 3));
	sendChatMessage('Yes!', 'user');
	sendChatMessage('I confirm. the car is booked :)', 'bot');
});

app.get('/getprofile', function(req, res) {
	res.setHeader('Content-Type', 'application/json');
	res.send(JSON.stringify(prevOfferRequest, null, 3));
});

app.get('/', function(req, res) {
	res.sendFile(__dirname + "/index.html");
});

function getOffers(offerRequest, status, callback) {

	// Request location.
	// TODO: take closest location.
	var options = {
	 	url: 'https://app.sixt.de/php/mobilews/v4/stationsuggestion?address=' + offerRequest.pickupLocation,
	  	headers: {
	    	'Accept-Language': 'en_US'
	  	}
	};

	request(options, function(error, resp, bodyLocation) {
		if (error) {
			callback(error, null);
			return;
		}

		bodyLocation = JSON.parse(bodyLocation);

		if (!bodyLocation.downtownStations
			|| bodyLocation.downtownStations.length == 0) {
			callback({ error: 'Did not get a downtown station' }, null);
			return;
		}

		var stations = (bodyLocation.airportStations && bodyLocation.airportStations.length > 0) ?
			bodyLocation.airportStations :
			bodyLocation.downtownStations;
		var pickupLocationId = stations[0].identifier;
		var pickupLocationName = stations[0].name;
		var pickupDateStr = formatDate(offerRequest.pickupDate);
		var returnDateStr = formatDate(offerRequest.returnDate);

		if (status == 'new') {
			sendChatMessage('Ok, I’m looking for offers in ' + pickupLocationName + ' from ' + pickupDateStr + ' to ' + returnDateStr + '.', 'bot');
		}
		else if (status == 'usual') {
			sendChatMessage('Ok, I’m looking for your usual request: in ' + pickupLocationName + ' from ' + pickupDateStr + ' to ' + returnDateStr + '.', 'bot');
		}
		else if (status == 'change') {
			var message = 'Ok, I’m looking for offers ';
			if (prevOfferRequest.pickupLocation != offerRequest.pickupLocation) {
				message += 'in ' + pickupLocationName;
			}
			if (prevOfferRequest.pickupDate.toISOString() != offerRequest.pickupDate.toISOString()) {
				message += 'from ' + pickupDateStr;
			}
			if (prevOfferRequest.returnDate.toISOString() != offerRequest.returnDate.toISOString()) {
				message += 'until ' + returnDateStr;
			}
			message += '.';
			sendChatMessage(message, 'bot');
		}

		// Request offer.
		// TODO: flexi price.
		// TODO: cheapest offer.
		request('https://app.sixt.de/php/mobilews/v4/offerlist?pickupStation=' + pickupLocationId + '&returnStation=' + pickupLocationId + '&pickupDate=' + offerRequest.pickupDate.toISOString() + '&returnDate=' + offerRequest.returnDate.toISOString(), function(error, resp, bodyOffer) {
			if (error) {
				callback(error, null);
				return;
			}
				bodyOffer = JSON.parse(bodyOffer);

			if (!bodyOffer.offers || bodyOffer.offers.size == 0
				|| !bodyOffer.offers[0].rates || bodyOffer.offers[0].rates.size == 0
				|| !bodyOffer.offers[0].rates[0].price || !bodyOffer.offers[0].rates[0].price.totalPrice
				|| !bodyOffer.offers[0].group || !bodyOffer.offers[0].group.modelExample) {
				callback({ error: "Could not get price or car example"}, null);
				return;
			}
			var price = bodyOffer.offers[0].rates[0].price.totalPrice;
			var carExample = bodyOffer.offers[0].group.modelExample;

			var offer = {
	    		pickupLocation: pickupLocationName,
	    		returnLocation: pickupLocationName,
	    		pickupDate: offerRequest.pickupDate,
			    returnDate: offerRequest.returnDate,
			    price: price,
			    carExample: carExample
			};

			// TODO: decide between 'a' and 'an'.
			sendChatMessage('I can offer you a(n) ' + carExample + ' or similar for € ' + price + '. Should I book it now?', 'bot');
            
			callback(null, [offer]);
		});
	});

	prevOfferRequest = offerRequest;
}

// Websocket.
io.on('connection', function(socket) {
	conns.push(socket);
	socket.emit('chat', {
		text: "You are connected!"
	});
	console.log('a user connected');
});

function sendChatMessage(message, sender) {
	for(var i = 0; i < conns.length; i++) {
        conns[i].emit('chat', {
        	text: message,
        	sender: sender,
        	time: new Date()
       	});
	}
}

function formatDate(date) {
	return dateFormat(date, "dddd, mmmm dS, h:MM TT");
}

module.exports = app;