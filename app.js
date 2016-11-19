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

var prevOfferRequest = {};

app.set('port', process.env.PORT || 5000);
server.listen(app.get('port'), function() {
 	console.log('Node app is running on port', app.get('port'));
});

app.use(express.static('public'));

app.get('/getoffers', function(req, res) {

	var pickupLocation = req.query.pickupLocation;
	var pickupDate = new Date(req.query.pickupDate);
	var returnDate = new Date(req.query.returnDate);
	var status = req.query.status;

	var offerRequest = {
		pickupLocation: pickupLocation,
		pickupDate: pickupDate,
		returnDate: returnDate
	};

	var pickupDateStr = dateFormat(pickupDate, "dddd, mmmm dS, yyyy, h TT");
	var returnDateStr = dateFormat(returnDate, "dddd, mmmm dS, yyyy, h TT");

	if (status == 'new' || !('pickupLocation' in prevOfferRequest)) {
		sendChatMessage('Ask Sixt to book a car in ' + pickupLocation + ' from ' + pickupDateStr + ' to ' + returnDateStr + '.', 'user');
		sendChatMessage('Ok, I’m looking for offers in ' + pickupLocation + ' from ' + pickupDateStr + ' to ' + returnDateStr + '.', 'bot');
	}
	else if (status == 'usual') {
		sendChatMessage('Ask Sixt to book a car.', 'user');
		sendChatMessage('Ok, I’m looking for your usual request: in ' + pickupLocation + ' from ' + pickupDateStr + ' to ' + returnDateStr + '.', 'bot');
	}
	else if (status == 'change') {
		var message = 'Ok, I’m looking for offers ';
		if (prevOfferRequest.pickupLocation != offerRequest.pickupLocation) {
			sendChatMessage('No, in ' + offerRequest.pickupLocation, 'user');
			message += 'in ' + offerRequest.pickupLocation;
		}
		if (prevOfferRequest.pickupDate.toISOString() != offerRequest.pickupDate.toISOString()) {
			sendChatMessage('No, from ' + pickupDateStr, 'user');
			message += 'from ' + pickupDateStr;
		}
		if (prevOfferRequest.returnDate.toISOString() != offerRequest.returnDate.toISOString()) {
			sendChatMessage('No, until ' + returnDateStr, 'user');
			message += 'until ' + returnDateStr;
		}
		message += '.';
		sendChatMessage(message, 'bot');
	}

	getOffers(offerRequest, function(offer) {
     	res.setHeader('Content-Type', 'application/json');
      	res.send(JSON.stringify(offer, null, 3));
  	});
});

app.get('/confirm', function(req, res) {
	res.setHeader('Content-Type', 'application/json');
	res.send(JSON.stringify({}, null, 3));
	sendChatMessage('Yes!', 'user');
	sendChatMessage('I confirm. the car is booked.', 'bot');
});

app.get('/', function(req, res) {
	res.sendFile(__dirname + "/index.html");
});

function getOffers(offerRequest, callback) {

	// Request location.
	// TODO: take closest location.
	var options = {
	 	url: 'https://app.sixt.de/php/mobilews/v4/stationsuggestion?address=' + offerRequest.pickupLocation,
	  	headers: {
	    	'Accept-Language': 'en_US'
	  	}
	};

	request(options, function(error, resp, bodyLocation) {
		bodyLocation = JSON.parse(bodyLocation);

		var pickupLocationId = bodyLocation.downtownStations[0].identifier;

		// Request offer.
		// TODO: flexi price.
		// TODO: cheapest offer.
		request('https://app.sixt.de/php/mobilews/v4/offerlist?pickupStation=' + pickupLocationId + '&returnStation=' + pickupLocationId + '&pickupDate=' + offerRequest.pickupDate.toISOString() + '&returnDate=' + offerRequest.returnDate.toISOString(), function(error, resp, bodyOffer) {
			bodyOffer = JSON.parse(bodyOffer);

			var price = bodyOffer.offers[0].rates[0].price.totalPrice;
			var carExample = bodyOffer.offers[0].group.modelExample;

			var offer = {
	    		pickupLocation: bodyLocation.downtownStations[0].name,
	    		returnLocation: bodyLocation.downtownStations[0].name,
	    		pickupDate: offerRequest.pickupDate,
			    returnDate: offerRequest.returnDate,
			    price: price,
			    carExample: carExample
			};

			// TODO: decide between 'a' and 'an'.
			sendChatMessage('I can offer you a(n) ' + carExample + ' or similar for € ' + price + '. Should I book it now?', 'bot');
            
			callback([offer]);
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
	for(var i = 0; i < conns.length; i++){
        conns[i].emit('chat', {
        	text: message,
        	sender: sender,
        	time: new Date()
       	});
	}
}

module.exports = app;