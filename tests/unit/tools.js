'use strict';

var colors = require('colors/safe');
var framework = require('./alexa/alexa');
var intentRequest = framework.intent_request;
var session = framework.session;
var context = framework.context;
var Response = require('./../../alexa_response.js');
/**
 * @val self {Wap3AlexaUnitTools}
 */
var self;

/**
 * @type Wap3AlexaUnitTools
 * @constructor
 */
var Wap3AlexaUnitTools = function(options) {
    self = this;

    this.logs = {
        show: false
    };

    this.console = {
        log: console.log
    };
    this.init({
    });
};

/**
 *
 * @param data
 * @returns {{runEvent: {version: {String}, session: *, context: *, request: {}}, runContext: {succeed: succeed, fail: fail}, response: {succeed: succeed, fail: fail}}}
 */
Wap3AlexaUnitTools.prototype.init = function(data) {
    console.log = function(){
        self.log(arguments, 'APP');
    };
    this.session = JSON.parse(JSON.stringify(session));
    this.context = JSON.parse(JSON.stringify(context));
    if(data.session){
        this.session = data.session;
    }
    if(data.sessionId) {
        this.setSessionId(data.sessionId);
    }
    if(data.userId) {
        this.setUserId(data.userId);
    }
    if(data.showAppLogs) {
        this.logs.show = data.showAppLogs;
    }

    var runSuccessCallback = data.runSuccessCallback || undefined;
    var runFailCallback = data.runFailCallback || undefined;
    var runContext = this.getRunContext({
        successCallback: runSuccessCallback, errorCallback: runFailCallback
    });
    var response = this.getResponse(runContext);
    return {
        runEvent: this.getRunEvent(),
        runContext: runContext,
        response: response,
        session: this.session
    };
};

/**
 *
 * @returns {{version: {String}, session: *, context: *, request: {}}}
 */
Wap3AlexaUnitTools.prototype.getRunEvent = function() {
    return {
        "version": 'test_0.1',
        "session": this.session,
        "context": this.context,
        "request": {}
    };
};

/**
 *
 * @param {{successCallback: Function, errorCallback: Function}} data
 * @returns {{succeed: succeed, fail: fail}}
 */
Wap3AlexaUnitTools.prototype.getRunContext = function(data) {
    return {
        succeed: function(res){
            if(data && data.successCallback){
                data.successCallback(res);
            }else{
                console.log(res);
                console.log('PLEASE SET successCallback in getRunContext');
            }
        },
        fail: function(err){
            if(data && data.errorCallback){
                data.errorCallback(err);
            }else{
                console.log(err);
                console.log('PLEASE SET errorCallback in getRunContext');
            }

        }
    };
};

/**
 *
 * @param runContext
 * @returns {Response}
 */
Wap3AlexaUnitTools.prototype.getResponse = function(runContext) {
    return new Response(runContext, this.session);
};

/**
 *
 */
Wap3AlexaUnitTools.prototype.beforeEachMatchers = function() {
    framework.beforeEachMatchers();
};

/**
 *
 * @param {String} sessionId
 */
Wap3AlexaUnitTools.prototype.setSessionId = function(sessionId) {
    this.session.sessionId = sessionId;
};

/**
 *
 */
Wap3AlexaUnitTools.prototype.getSessionId = function() {
    return this.session.sessionId;
};

/**
 *
 * @param {String} userId
 */
Wap3AlexaUnitTools.prototype.setUserId = function(userId) {
    this.session.user.userId = userId;
};

/**
 *
 */
Wap3AlexaUnitTools.prototype.getUserId = function() {
    return this.session.user.userId;
};


/**
 *
 * @param {String} applicationId
 */
Wap3AlexaUnitTools.prototype.setApplicationId = function(applicationId) {
    this.session.application.applicationId = applicationId;
};

/**
 *
 * @param {Object} log
 * @param {String} type
 */
Wap3AlexaUnitTools.prototype.log = function(log, type) {
    type = type || 'UNIT';
    if(type === 'UNIT'){
        self.console.log(colors.red(type+':'), JSON.stringify(log));
    }else if(self.logs.show){
        self.console.log(colors.blue(type+':'), log);
    }

};

/**
 *
 * @param {{name: {String}, slots: {Object}}} data
 */
Wap3AlexaUnitTools.prototype.getIntentRequest = function (data){
    var intentReq = JSON.parse(JSON.stringify(intentRequest));
    if(data && data.name) {
        intentReq.intent.name = data.name;
    }
    if(data && data.slots) {
        intentReq.intent.slots = data.slots;
    }
    return intentReq;
};

module.exports = Wap3AlexaUnitTools;