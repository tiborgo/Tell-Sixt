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

function saveSession(session, offerRequest) {
    session("pickupLocation", offerRequest.pickupLocation);
    session("pickupDate", offerRequest.pickupDate);
    session("returnDate", offerRequest.returnDate);
}

function loadSession(session) {
    var offerRequest = {};
    offerRequest.pickupLocation = request.session("pickupLocation");
    offerRequest.pickupDate = request.session("pickupDate");
    offerRequest.returnDate = request.session("returnDate");
    return offerRequest;
}

app.intent('NewBooking',
    {
        "slots": {
            "city": "AMAZON.DE_CITY",
            "pickupDate": "AMAZON.DATE",
            "pickupTime": "AMAZON.TIME",
            "returnDate": "AMAZON.DATE",
            "returnTime": "AMAZON.TIME"
        }
        , "utterances": ["book a car in {-|city} from {-|pickupDate} {-|pickupTime} to {-|returnDate} {-|returnTime}"]
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

app.intent('AMAZON.YesIntent',

    function(request, response) {
        console.log("YesIntent");

        get("https://sixt-bot.herokuapp.com/confirm" + request.session("params"),
            function(error, resp, body) {
                response.say("I confirm. The car is booked.").send();
            });

        return false;
    }
);

app.intent("UsualBooking",
    {
        "utterances": ["book a car"]
    },

    function(request, response) {
        console.log("UsualBookingIntent");

        get("https://sixt-bot.herokuapp.com/getprofile", function(error, resp, bodyProfile) {        
            var offerRequest = JSON.parse(bodyProfile);
            response.session("pickupLocation", offerRequest.pickupLocation);
            response.session("pickupDate", offerRequest.pickupDate.toISOString());
            response.session("returnDate", offerRequest.returnDate.toISOString());

            console.log(offerRequest);

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

        offerRequest = loadSession(response.session);
        offerRequest.pickupLocation = request.slot('city');
        saveSession(offerRequest);

        get("https://sixt-bot.herokuapp.com/getoffers?pickupLocation=" + offerRequest.pickupLocation +
                "&pickupDate=" + offerRequest.pickupDate +
                "&returnDate=" + offerRequest.returnDate + "status=change", function(error, resp, body) {

            var offer = JSON.parse(body)[0];

            response.say("Ok, I'm looking for offers in " + offerRequest.pickupLocation)
                .say("I can offer you a " + offer.carExample + " or similar for " + offer.price + " Euro.")
                .say("Should I book it now?")
                .shouldEndSession(false)
                .send();
        });
    }
);

console.log(app.schema());
console.log(app.utterances());

exports.handler = app.lambda();