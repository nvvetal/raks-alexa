'use strict';
var cheerio = require('cheerio');

var self;

var Wap3AlexaTextModel = function () {
    self = this;
};

/**
 * Hack for replace all
 * @param text
 * @param search
 * @param replacement
 * @returns {string|void|XML}
 */
Wap3AlexaTextModel.prototype.replaceAll = function (text, search, replacement) {
    /*
     var target = this;
     return target.replace(new RegExp(search, 'g'), replacement);
     */
    if (!replacement) {
        //console.log('ERROR: REPLACE ALL', search);
    }
    var spl = text.split(search);
    var j = spl.join(replacement);
    return j;
};

/**
 *
 * @param {String} text
 * @returns {Array}
 */
Wap3AlexaTextModel.prototype.getTextParts = function (text) {
    var parts = [];
    if(self.isSSML(text)){
        text = text.replace(/\<(\w+)([^\>]+)\>/gi, '<$1$2></$1>');
        text = text.replace(/\/(\>\<)/gi, '$1');
        var $ = cheerio.load(text);
        var childs = $('speak').contents();
        if (childs.length > 0) {
            parts = self.getPartsChildren(childs);
        }
    }else{
        parts.push({
            type: 'text',
            data: text
        });
    }
    return parts;
};

/**
 *
 * @param {Array} childrens
 * @returns {Array}
 */
Wap3AlexaTextModel.prototype.getPartsChildren = function (childrens) {
    var parts = [];
    for (var i = 0; i < childrens.length; i++) {
        if (childrens[i].type === 'text') {
            parts.push({
                type: 'text',
                data: childrens[i].data
            });
        } else if (childrens[i].type === 'tag') {
            var item = {
                type: 'tag',
                data: childrens[i].name,
                attribs: childrens[i].attribs
            };
            if (childrens[i].children && childrens[i].children.length > 0) {
                item.children = self.getPartsChildren(childrens[i].children);
            }
            parts.push(item);
        }
    }
    return parts;
};

/**
 *
 * @param text
 * @returns {boolean}
 */
Wap3AlexaTextModel.prototype.isSSML = function(text) {
    return text.indexOf('<speak>') !== -1;
};

/**
 *
 * @param {String} text
 * @returns {string}
 */
Wap3AlexaTextModel.prototype.normalizeText = function (text) {
    var normalizedText = '';
    var parts = self.getTextParts(text);
    for (var i = 0; i < parts.length; i++) {
        var txt = {txt: ''};
        self.normalizeTextPart(txt, parts[i]);
        normalizedText += txt.txt;
    }
    if(self.isSSML(text)){
        normalizedText = '<speak>' + normalizedText + '</speak>';
    }
    return normalizedText;
};

/**
 *
 * @param {Object} normalizedText
 * @param {Object} textPart
 */
Wap3AlexaTextModel.prototype.normalizeTextPart = function (normalizedText, textPart) {
    if (textPart.type === 'tag') {
        normalizedText.txt += ' <' + textPart.data;
        if ((Object.keys(textPart.attribs)).length > 0) {
            normalizedText.txt += ' ';
            for (var k = 0, keys = Object.keys(textPart.attribs); k < keys.length; k++) {
                normalizedText.txt += keys[k] + '="' + textPart.attribs[keys[k]] + '" ';
            }
        }
        if (textPart.children) {
            normalizedText.txt += '>';
            for(var k = 0; k < textPart.children.length; k++){
                var txt = {txt: ''};
                self.normalizeTextPart(txt, textPart.children[k]);
                normalizedText.txt += txt.txt;
            }
            normalizedText.txt += '</' + textPart.data + '>';
        }else {
            normalizedText.txt += '/>';
        }
    } else {
        var res = self.replaceAll(textPart.data, "\r", '');
        res = self.replaceAll(res, "\n", '');
        res = self.normalizeTextDots(res);
        normalizedText.txt += res;
    }
    return normalizedText;
};

/**
 *
 * @param text
 * @returns {void|string|XML}
 */
Wap3AlexaTextModel.prototype.normalizeTextDots = function (text) {
    var $ = cheerio.load(text);
    var t = text.replace(/\.(\w)/gi, '. $1');
    t = t.replace(/\. \./gi, '.');
    return t;
};


/**
 * Retuning text which will end with . or ? or !
 * @param {String} text
 */
Wap3AlexaTextModel.prototype.getEndingText = function (text) {
    if (!text || text === '') {
        return '';
    }
    var re = /([\?\.\!\>])$/i;
    var reComma = /([\,])$/i;
    var reSpace = /([\s])$/i;
    if (!text.match(re)) {
        if (text.match(reComma)) {
            text = text.replace(/,$/i, ".");
        } else {
            text += '.';
        }
    }

    if (!text.match(reSpace)) {
        text += ' ';
    }

    text = this.replaceAll(text, '. . ', '. ');

    return text;
};

module.exports = new Wap3AlexaTextModel();