'use strict';
//https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/alexa-skills-kit-interface-reference#request-format
module.exports = {
    "System": {
        "application": {
            "applicationId": null
        },
        "user": {
            "userId": null,
            "accessToken": null
        },
        "device": {
            "supportedInterfaces": {
                "AudioPlayer": {}
            }
        }
    }
};