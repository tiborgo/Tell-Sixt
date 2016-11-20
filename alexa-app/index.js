var alexa = require('alexa-app');
var get = require('request');
var dateFormat = require('dateformat');
var app = new alexa.app('sample');

function formatDate(dateIso) {
    return dateFormat(new Date(dateIso), "dddd, mmmm dS, h:MM TT");
}

function formatDateShort(dateIso) {
    return dateFormat(new Date(dateIso), "dddd, h:MM TT");
}

function buildParams(offer) {
    return "?pickupLocation=" + offer.city +
        "&pickupDate=" + offer.pickupDate +
        "&returnDate=" + offer.returnDate;
}

function saveSession(response, offerRequest) {
    response.session("pickupLocation", offerRequest.pickupLocation);
    response.session("pickupDate", offerRequest.pickupDate);
    response.session("returnDate", offerRequest.returnDate);
}

function loadSession(request) {
    var offerRequest = {};
    offerRequest.pickupLocation = request.session("pickupLocation");
    offerRequest.pickupDate = request.session("pickupDate");
    offerRequest.returnDate = request.session("returnDate");
    return offerRequest;
}

function buildGetOffers(offerRequest, status) {
    return "https://sixt-bot.herokuapp.com/getoffers?pickupLocation=" + offerRequest.pickupLocation +
        "&pickupDate=" + offerRequest.pickupDate +
        "&returnDate=" + offerRequest.returnDate +
        "&status=" + status;
}

function sayOffer(response, offerRequest, offer) {
    response.say("I can offer you a " + offer.carExample + " or similar for " + offer.price + " Euro.")
        .say("Should I book it now?");
    return response;
}

app.intent('NewBooking',
    {
        "slots": {
            "city": "AMAZON.DE_CITY",
            "pickupDate": "AMAZON.DATE",
            "pickupTime": "AMAZON.TIME",
            "returnDate": "AMAZON.DATE",
            "returnTime": "AMAZON.TIME"
        },
		"utterances": ["book {me|} a car in {-|city} from {-|pickupDate} {-|pickupTime} to {-|returnDate} {-|returnTime}"]
    },

    function(request, response) {
        console.log("NewBooking");

        var city = request.slot('city');
        var pickupDate = request.slot('pickupDate');
        var pickupTime = request.slot('pickupTime');
        var returnDate = request.slot('returnDate');
        var returnTime = request.slot('returnTime');

        get("https://sixt-bot.herokuapp.com/getoffers?pickupLocation=" + city +
            "&pickupDate=" + pickupDate + "T" + pickupTime +
            "&returnDate=" + returnDate + "T" + returnTime +
            "&status=new",
            function(error, resp, body) {
                var offers = JSON.parse(body);
                var offer = offers[0];

                console.log(offers);

                response.session("case", 1);
                response.session("params", buildParams(offer));

                response.say("Ok, I'm looking for offers in " + offer.pickupLocation +
                    " from " + formatDate(offer.pickupDate) +
                    " to " + formatDate(offer.returnDate) + ".")
                    .say("I can offer you a " + offer.carExample + " or similar for " + offer.price + " Euro.")
                    .say("Should I book it now?")
                    .shouldEndSession(false)
                    .send();
            });

        return false;
    }
);

var confirmHandler = function (request, response) {
    console.log("YesIntent");

        get("https://sixt-bot.herokuapp.com/confirm" + request.session("params"),
            function(error, resp, body) {
                response.say("I confirm. The car is booked.").send();
            });

        return false;
}

app.intent('AMAZON.YesIntent', confirmHandler);

app.intent('Confirm',
    {
        "utterances": ["{ok|yes|go|} {book|do} it {then|}"]
    }, confirmHandler
);

app.intent("UsualBooking",
    {
        "utterances": ["book {me|} a car {as usual|}"]
    },

    function(request, response) {
        console.log("UsualBookingIntent");

        get("https://sixt-bot.herokuapp.com/getprofile", function(error, resp, bodyProfile) {        
            var offerRequest = JSON.parse(bodyProfile);
            console.log(offerRequest);
            saveSession(response, offerRequest);

            get("https://sixt-bot.herokuapp.com/getoffers?status=usual", function(error, resp, body) {

                var offers = JSON.parse(body);
                var offer = offers[0];

                console.log(offers);

                response.say("Ok, I'm looking for your usual request in " + offer.pickupLocation +
                    " from " + formatDateShort(offer.pickupDate) +
                    " to " + formatDateShort(offer.returnDate) + ".")
                    .say("I can offer you a " + offer.carExample + " or similar for " + offer.price + " Euro.")
                    .say("Should I book it now?")
                    .shouldEndSession(false)
                    .send();
            });
        });

        return false;
    }
)

app.intent("NoLocation",
    {
        "slots": {
            "city": "AMAZON.DE_CITY",
        },
        "utterances": ["no in {-|city}"]
    },

    function(request, response) {
        console.log("NoLocationIntent");

        offerRequest = loadSession(request);
        offerRequest.pickupLocation = request.slot('city');
        saveSession(response, offerRequest);

        get(buildGetOffers(offerRequest, 'change'), function(error, resp, body) {
            var offer = JSON.parse(body)[0];

            response.say("Ok, I'm looking for offers in " + offerRequest.pickupLocation + ".");
            sayOffer(response, offerRequest, offer)
                .shouldEndSession(false)
                .send();
        });

        return false;
    }
);

app.intent("NoPickupDate",
    {
        "slots": {
            "pickupDate": "AMAZON.DATE",
            "pickupTime": "AMAZON.TIME",
        },
        "utterances": ["no from {-|pickupDate} {-|pickupTime}"]
    },

    function(request, response) {
        console.log("NoPickupDateIntent");

        var pickupDate = request.slot('pickupDate');
        var pickupTime = request.slot('pickupTime');

        offerRequest = loadSession(request);
        offerRequest.pickupDate = pickupDate + "T" + pickupTime;
        saveSession(response, offerRequest);

        get(buildGetOffers(offerRequest, 'change'), function(error, resp, body) {
            var offer = JSON.parse(body)[0];

            response.say("Ok, I'm looking for offers from " + formatDate(offerRequest.pickupDate) + ".");
            sayOffer(response, offerRequest, offer)
                .shouldEndSession(false)
                .send();
        });

        return false;
    }
);

app.intent("NoReturnDate",
    {
        "slots": {
            "returnDate": "AMAZON.DATE",
            "returnTime": "AMAZON.TIME",
        },
        "utterances": ["no until {-|returnDate} {-|returnTime}"]
    },

    function(request, response) {
        console.log("NoReturnDateIntent");

        var returnDate = request.slot('returnDate');
        var returnTime = request.slot('returnTime');

        offerRequest = loadSession(request);
        offerRequest.returnDate = returnDate + "T" + returnTime;
        saveSession(response, offerRequest);

        get(buildGetOffers(offerRequest, 'change'), function(error, resp, body) {
            var offer = JSON.parse(body)[0];

            console.log(offer);

            response.say("Ok, I'm looking for offers until " + formatDate(offerRequest.returnDate) + ".");
            sayOffer(response, offerRequest, offer)
                .shouldEndSession(false)
                .send();
        });

        return false;
    }
);

function infoHandler(type) {
    return function(request, response) {
        console.log("DetailInfoIntent");

        get("https://sixt-bot.herokuapp.com/getInfo?type=" + type,
            function(error, resp, body) {
                var offers = JSON.parse(body);
                var offer = offers[0];

                console.log(offers);

                response.say(offer.text)
                    .shouldEndSession(false)
                    .send();
            });

        return false;
    }
}

app.intent("SeatsInfo",
    {
        "utterances": ["how many seats does {it|the car} have"]
    },

    infoHandler("seats")
)

app.intent("GPSInfo",
    {
        "utterances": ["does {it|the car} have {gps|a navigation system}"]
    },

    infoHandler("gps")
)

app.intent("PriceInfo",
    {
        "utterances": ["how much {it|the car} does it cost {|again}"]
    },

    infoHandler("price")
)

app.intent("AwesomeInfo",
    {
        "utterances": ["is it {a|} nice {car|one}"]
    },

    infoHandler("nice")
)

app.intent("TooExpensive",
    {
        "utterances": ["{no|oh|} {that is|that's} too {much|expensive}"]
    },

    infoHandler("expensive")
)

console.log(app.schema());
console.log(app.utterances());

exports.handler = app.lambda();