'use strict';

/**
 * Wap3AlexaResponse
 * @type Wap3AlexaResponse
 * @param context
 * @param session
 * @constructor
 */
var Wap3AlexaResponse = function (context, event, session) {
    this.context = context;
    this.event = event;
    this.session = session;
};

/**
 *
 * @param text
 * @returns {*}
 */
function createSpeechObject(text) {
    var type = 'PlainText';
    if (text && text.indexOf('<speak>') !== -1) {
        type = 'SSML';
    }

    if (type === 'SSML') {
        return {
            type: type,
            ssml: text
        };
    }

    return {
        type: type,
        text: text
    };

}

Wap3AlexaResponse.prototype = (function () {
    var buildSpeechletResponse = function (options) {
        var alexaResponse = {};

        if (options.card) {
            alexaResponse.card = options.card;
        }

        if (options.cardTitle && options.cardContent) {
            alexaResponse.card = {
                type: "Simple",
                title: options.cardTitle,
                content: options.cardContent
            };
        }

        alexaResponse.outputSpeech = createSpeechObject(options.output);
        alexaResponse.shouldEndSession = options.shouldEndSession;

        if (options.reprompt) {
            alexaResponse.reprompt = {
                outputSpeech: createSpeechObject(options.reprompt)
            };
        }

        if (options.directives) {
            alexaResponse.directives = options.directives;
        }

        var returnResult = {
            version: '1.0',
            response: alexaResponse
        };

        if (options.session && options.session.attributes) {
            returnResult.sessionAttributes = options.session.attributes;
        }

        console.log('[RETURN RESULT]', JSON.stringify(returnResult));
        return returnResult;
    };

    return {
        tell: function (speechOutput) {
            this.context.succeed(buildSpeechletResponse({
                session: this.session,
                output: speechOutput,
                shouldEndSession: true
            }));
        },
        tellWithCard: function (speechOutput, cardTitle, cardContent) {
            this.context.succeed(buildSpeechletResponse({
                session: this.session,
                output: speechOutput,
                cardTitle: cardTitle,
                cardContent: cardContent,
                shouldEndSession: true
            }));
        },
        ask: function (speechOutput, repromptSpeech) {
            this.context.succeed(buildSpeechletResponse({
                session: this.session,
                output: speechOutput,
                reprompt: repromptSpeech,
                shouldEndSession: false
            }));
        },

        askWithCard: function (speechOutput, repromptSpeech, cardTitle, cardContent) {
            this.context.succeed(buildSpeechletResponse({
                session: this.session,
                output: speechOutput,
                reprompt: repromptSpeech,
                cardTitle: cardTitle,
                cardContent: cardContent,
                shouldEndSession: false
            }));
        },

        setSessionParam: function (param, val) {
            this.session.attributes[param] = val;
            if(param !== 'username' && param !== 'history'){
                this.addSessionHistory({
                    param: param,
                    val: val
                });
            }
        },


        getSessionParam: function (param) {
            if (!this.session || !this.session.attributes || !this.session.attributes[param]) return undefined;
            return this.session.attributes[param];
        },
        
        setSessionHistory: function(history) {
            this.session.attributes.history = history;
        },

        getSessionHistory: function() {
            if (!this.session.attributes || !this.session.attributes['history']) return [];
            return this.session.attributes.history;
        },

        addSessionHistory: function(data) {
            var d = JSON.parse(JSON.stringify(data));
            d.created = new Date();
            this.session.attributes.history = (!this.session.attributes.history) ? [] : this.session.attributes.history;
            this.session.attributes.history.push(d);
        },

        /**
         * Clearing session data except exclude array
         * @param {Array} exclude
         */
        clearSessionParams: function (exclude) {
            exclude = exclude || [];
            exclude.push('state');
            exclude.push('fromState');
            exclude.push('fromAction');
            exclude.push('history');
            var sessKeys = Object.keys(this.session.attributes);
            for (var i = 0; i < sessKeys.length; i++) {
                if (exclude.indexOf(sessKeys[i]) == -1) {
                    this.setSessionParam(sessKeys[i], undefined);
                }
            }
            this.setSessionParam('afterSessCleared', JSON.stringify(Object.keys(this.session.attributes)));
        },

        getSessionParams: function() {
            return this.session.attributes || [];
        },

        /**
         * https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/linking-an-alexa-user-with-a-user-in-your-system
         * @returns {*}
         */
        getAlexaUserId: function () {
            if(this.session && this.session.user) {
                return this.session.user.userId;
            }

            if(this.event.System && this.event.System.user){
                return this.event.System.user.userId;
            }

            if(this.event.context && this.event.context.System && this.event.context.System.user){
                return this.event.context.System.user.userId;
            }

            return null;
        },

        buildAudioPlayResponse: function (options) {
            options = options || {};
            var alexaResponse = {};
            if(options.output){
                alexaResponse.outputSpeech = createSpeechObject(options.output);
                alexaResponse.shouldEndSession = options.shouldEndSession;
            }

            if (options.directives) {
                alexaResponse.directives = options.directives;
            }

            if (options.event) {
                alexaResponse.event = options.event;
            }

            if (options.card) {
                alexaResponse.card = options.card;
            }

            var returnResult = {
                version: '1.0',
                response: alexaResponse
            };
            console.log('[RETURN AUDIO RESULT]', JSON.stringify(returnResult));
            return returnResult;
        },

        /**
         *
         * @param speechOutput
         * @param repromptSpeech
         * @param {Object} options
         */
        askWithOptions: function (speechOutput, repromptSpeech, options) {
            options = options || {};

            var data = {
                session: this.session,
                output: speechOutput,
                reprompt: repromptSpeech,
                shouldEndSession: false
            };

            if (options.card) {
                data.card = options.card;
            }

            if (options.directives) {
                data.directives = options.directives;
            }

            this.context.succeed(buildSpeechletResponse(data));
        },
        
        /**
         *
         * @param speechOutput
         * @param repromptSpeech
         * @param {Object} options
         */
        tellWithOptions: function (speechOutput, options) {
            options = options || {};

            var data = {
                session: this.session,
                output: speechOutput,
                shouldEndSession: true
            };

            if (options.card) {
                data.card = options.card;
            }

            if (options.directives) {
                data.directives = options.directives;
            }

            this.context.succeed(buildSpeechletResponse(data));
        },

        /**
         * https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/custom-audioplayer-interface-reference#play
         * @param {String} url https url!
         * @param {String} behavior REPLACE_ALL|ENQUEUE|REPLACE_ENQUEUED
         * @param {String} token max 1024
         * @param {String} expectedPreviousToken
         * @param {Number} offsetInMilliseconds
         * @returns {{type: string, playBehavior: *, audioItem: {stream: {url: *, token: *, expectedPreviousToken: *, offsetInMilliseconds: *}}}}
         */
        getAudioPlayerPlayDirective: function (behavior, url, token, expectedPreviousToken, offsetInMilliseconds, metadata) {
            offsetInMilliseconds = offsetInMilliseconds || 0;
            expectedPreviousToken = expectedPreviousToken || '';
	    metadata = metadata || {};

            var stream = {
                "url": url,
                "token": token,
                "offsetInMilliseconds": offsetInMilliseconds
            };

            if (expectedPreviousToken.length > 0) {
                stream.expectedPreviousToken = expectedPreviousToken;
            }

            return {
                "type": "AudioPlayer.Play",
                "playBehavior": behavior,
                "audioItem": {
                    "stream": stream,
		    "metadata": metadata
                }
            };
        },

        /**
         * Stops the current audio playback
         * @returns {{type: string}}
         */
        getAudioPlayerStopDirective: function () {
            return {
                "type": "AudioPlayer.Stop"
            };
        },

        /**
         *
         * @param {String} clearBehavior CLEAR_ENQUEUED|CLEAR_ALL
         * @returns {{type: string, playBehavior: *}}
         */
        getAudioPlayerClearQueueDirective: function (clearBehavior) {
            return {
                "type": "AudioPlayer.ClearQueue",
                "playBehavior": clearBehavior
            };
        }

    };
})();


module.exports = Wap3AlexaResponse;