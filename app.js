'use strict';

const
  bodyParser = require('body-parser'),
  config = require('config'),
  crypto = require('crypto'),
  express = require('express'),
  http = require('http'),  
  request = require('request');

var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);

var conns = [];

app.set('port', process.env.PORT || 5000);
server.listen(app.get('port'), function() {
 	console.log('Node app is running on port', app.get('port'));
});

app.use(express.static('public'));

app.get('/getoffers', function(req, res) {

	var pickupLocation = req.query.pickupLocation;
	var pickupDate = new Date(req.query.pickupDate);
	var returnDate = new Date(req.query.returnDate);

	getOffers({
			pickupLocation: pickupLocation,
			pickupDate: pickupDate,
			returnDate: returnDate
		}, function(offer) {
     	res.setHeader('Content-Type', 'application/json');
      	res.send(JSON.stringify(offer, null, 3));
  	});
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

			var offer = {
	    		pickupLocation: bodyLocation.downtownStations[0].name,
	    		returnLocation: bodyLocation.downtownStations[0].name,
	    		pickupDate: offerRequest.pickupDate,
			    returnDate: offerRequest.returnDate,
			    price: bodyOffer.offers[0].rates[0].price.totalPrice,
			    carExample: bodyOffer.offers[0].group.modelExample
			};

            for(var i = 0; i < conns.length; i++){
                conns[i].emit('chat', {text: "YEHAAAA"});
            }
            
			callback([offer]);
		});
	});
}

// Websocket.
io.on('connection', function(socket) {
	conns.push(socket);
	socket.emit('chat', {
		text: "You are connected!"
	});
	console.log('a user connected');
});

module.exports = app;