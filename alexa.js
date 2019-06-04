'use strict';

/**
 *
 * @type {Wap3AlexaResponse}
 */
var Wap3AlexaResponse = require('./alexa_response');

/**
 * @type Wap3AlexaSkill
 * @param appId
 * @constructor
 */
function Wap3AlexaSkill(appId) {
    this.appId = appId;
}

Wap3AlexaSkill.speechOutputType = {
    PLAIN_TEXT: 'PlainText',
    SSML: 'SSML'
};

Wap3AlexaSkill.prototype.requestHandlers = {
    LaunchRequest: function (event, context, response) {
        this.eventHandlers.onLaunch.call(this, event.request, event.session, response);
    },

    IntentRequest: function (event, context, response) {
        this.eventHandlers.onIntent.call(this, event.request, event.session, response);
    },

    SessionEndedRequest: function (event, context) {
        this.eventHandlers.onSessionEnded(event.request, event.session);
        context.succeed();
    },
    
    "Connections.Response": function (event, context, response) {
        this.eventHandlers.onConnectionsResponse.call(this, event, context, response);
    },

    //AUDIO HANDLERS
    "AudioPlayer.PlaybackStarted": function(event, context, response){
        this.eventHandlers.onAudioPlayer.call(this, 'PlaybackStarted', event, context, response);
    },

    "AudioPlayer.PlaybackFinished": function(event, context, response){
        this.eventHandlers.onAudioPlayer.call(this, 'PlaybackFinished', event, context, response);
    },

    "AudioPlayer.PlaybackNearlyFinished": function(event, context, response){
        this.eventHandlers.onAudioPlayer.call(this, 'PlaybackNearlyFinished', event, context, response);
    },

    "AudioPlayer.PlaybackFailed": function(event, context, response){
        this.eventHandlers.onAudioPlayer.call(this, 'PlaybackFailed', event, context, response);
    },

    "AudioPlayer.PlaybackStopped": function(event, context, response){
        this.eventHandlers.onAudioPlayer.call(this, 'PlaybackStopped', event, context, response);
    },

    "System.ExceptionEncountered": function(event, context, response) {
        this.eventHandlers.onAudioPlayer.call(this, 'System.ExceptionEncountered', event, context, response);
    },

    //PlaybackController HANDLERS
    "PlaybackController.PlayCommandIssued": function(event, context, response){
        this.eventHandlers.onPlaybackController.call(this, 'PlayCommandIssued', event, context, response);
    },

    "PlaybackController.PauseCommandIssued": function(event, context, response){
        this.eventHandlers.onPlaybackController.call(this, 'PauseCommandIssued', event, context, response);
    },

    "PlaybackController.NextCommandIssued": function(event, context, response){
        this.eventHandlers.onPlaybackController.call(this, 'NextCommandIssued', event, context, response);
    },

    "PlaybackController.PreviousCommandIssued": function(event, context, response){
        this.eventHandlers.onPlaybackController.call(this, 'PreviousCommandIssued', event, context, response);
    }
};

/**
 * Override any of the eventHandlers as needed
 */
Wap3AlexaSkill.prototype.eventHandlers = {
    /**
     * Called when the session starts.
     * Subclasses could have overriden this function to open any necessary resources.
     */
    onSessionStarted: function (sessionStartedRequest, session) {
    },

    /**
     * Called when the user invokes the skill without specifying what they want.
     * The subclass must override this function and provide feedback to the user.
     */
    onLaunch: function (launchRequest, session, response) {
        throw "onLaunch should be overriden by subclass";
    },

    /**
     * Called when the user specifies an intent.
     */
    onIntent: function (intentRequest, session, response) {
        var intent = intentRequest.intent,
            intentName = intentRequest.intent.name,
            intentHandler = this.intentHandlers[intentName];
        if (intentHandler) {
            console.log('dispatch intent = ' + intentName);
            intentHandler.call(this, intent, session, response);
        }else if( this.callIntent ){
            this.callIntent(intentName, intent, session, response);
        } else {
            this.onUnknownIntent(intentRequest, session, response);
        }
    },
    
    onConnectionsResponse: function (event, context, response) {
        var intentHandler = this.intentHandlers['Connections.Response'];
        intentHandler.call(this, event.payload, event.session, response);
    },

    onUnknownIntent: function (intentRequest, session, response) {

    },

    onAudioPlayer: function (name, event, context, response){
        var audioPlayerHandler = this.audioPlayerHandlers[name];
        if(audioPlayerHandler){
            return audioPlayerHandler.call(this, event, context, response);
        }
        context.succeed(response.buildAudioPlayResponse());
    },

    onPlaybackController: function (name, event, context, response){
        var handler = this.playbackControllerHandlers[name];
        if(handler){
            return handler.call(this, event, context, response);
        }
        context.succeed(response.buildAudioPlayResponse());
    },


    /**
     * Called when the user ends the session.
     * Subclasses could have overriden this function to close any open resources.
     */
    onSessionEnded: function (sessionEndedRequest, session) {
    }
};

/**
 * Subclasses should override the intentHandlers with the functions to handle specific intents.
 */
Wap3AlexaSkill.prototype.intentHandlers = {};
Wap3AlexaSkill.prototype.audioPlayerHandlers = {};
Wap3AlexaSkill.prototype.playbackControllerHandlers = {};


Wap3AlexaSkill.prototype.execute = function (event, context) {
    try {
        // Validate that this request originated from authorized source.
        var currentAppId;
        if(event.session) {
            currentAppId = event.session.application.applicationId;
        }
        if(event.context && event.context.System){
            currentAppId = event.context.System.application.applicationId;
        }

        if (this.appId && currentAppId !== this.appId) {
            console.log("The applicationIds don't match : " + currentAppId + " and "
                + this.appId);
            throw "Invalid applicationId";
        }

        if(event.session) {
            if (!event.session.attributes) {
                event.session.attributes = {};
            }

            if (event.session.new) {
                this.eventHandlers.onSessionStarted(event.request, event.session);
            }
        }

        // Route the request to the proper handler which may have been overriden.
        var requestHandler = this.requestHandlers[event.request.type];
        var response = new Wap3AlexaResponse(context, event, event.session);
        requestHandler.call(this, event, context, response);
    } catch (e) {
        console.log("Unexpected exception " + e);
        context.fail(e);
    }
};

module.exports = Wap3AlexaSkill;