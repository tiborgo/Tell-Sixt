var alexa = require('alexa-app');
var get = require('request');
var dateformat = require('dateformat');
var app = new alexa.app('sample');

app.intent('QuickBook',
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

    function (request, response) {
        console.log("QuickBookIntent");

        var city = request.slot('city');
        var pickupDate = request.slot('pickupDate');
        var pickupTime = request.slot('pickupTime');
        var returnDate = request.slot('returnDate');
        var returnTime = request.slot('returnTime');

        var params = "?pickupLocation=" + city +
            "&pickupDate=" + pickupDate + "T" + pickupTime +
            "&returnDate=" + returnDate + "T" + returnTime +
            "&status=new";

        get("https://sixt-bot.herokuapp.com/getoffers" + params,
            function (error, resp, body) {
                var offers = JSON.parse(body);
                var offer = offers[0];

                console.log(offers);

                offer.pickupDate = dateformat(new Date(offer.pickupDate), "dddd, mmmm dS, h:mm TT");
                offer.returnDate = dateformat(new Date(offer.returnDate), "dddd, mmmm dS, h:mm TT");

                response.session("case1", params);

                response.say("You want to book a car in " + offer.pickupLocation + 
                    " from " + offer.pickupDate +
                    " to " + offer.returnDate + ".")
                    .say("I can offer you a " + offer.carExample + " or similar for " + offer.price + " Euro.")
                    .say("Should I book it now?")
                    .shouldEndSession(false)
                    .send();
            });

        return false;
    }
);

app.intent('AMAZON.YesIntent',

    function (request, response) {
        console.log("YesIntent");

        get("https://sixt-bot.herokuapp.com/confirm" + request.session("case1"),
            function (error, resp, body) {
                response.say("I confirm. The car is booked.").send();
            });

        return false;
    }
);

console.log(app.schema());
console.log(app.utterances());

exports.handler = app.lambda();