var alexa = require('alexa-app');
var get = require('request');
var app = new alexa.app('sample');

app.intent('QuickBook',
    {
        "slots": { "city": "AMAZON.DE_CITY" }
        , "utterances": ["book a car in {-|city}"]
    },

    function (request, response) {
        console.log("QuickBookIntent");
        var city = request.slot('city');

        get("https://sixt-bot.herokuapp.com/getoffers?pickupLocation=Munich&pickupDate=2016-12-20T07:00:00.000Z&returnDate=2016-12-23T07:00:00.000Z",
            function (error, resp, body) {
                console.log("bla");
                var offers = JSON.parse(body);
                var offer = offers[0];

                console.log(offers);

                var speechOutput = "You can book a car in " + offer.pickupLocation +
                //" from " + offer.pickupDate +
                //" to " + offer.returnDate +
                " for " + offer.price + " Euros.";

                response.say(speechOutput);
                console.log(speechOutput);
                response.send();
            });

        return false;
    }
);

console.log(app.schema());
console.log(app.utterances());

exports.handler = app.lambda();