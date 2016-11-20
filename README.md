# Tell Sixt

This project was created in the context of the hackathon [app@night 2016](https://www.appatnight.de/).

It uses the [Amazon Echo infrastructure](https://developer.amazon.com/edw/home.html#/) to book a car at [Sixt](https://www.sixt.de).

## Setup

1. Setup a new Alexa Skill template (e.g. as described [here](https://developer.amazon.com/public/community/post/TxKALMUNLHZPAP/New-Alexa-Skills-Kit-Template:-Step-by-Step-Guide-to-Build-a-How-To-Skill))
2. Setup a Heroku NodeJS app.
3. Upload the root folder to Heroku.
4. Zip the contents of `alexa-app/` and upload it to your Alexa Skill template.
5. Run `node alexa-app/index.js` and update the Intent Schema and the Sample Utterance according to the output.

You can test this project with [Echosim.io](https://echosim.io/)