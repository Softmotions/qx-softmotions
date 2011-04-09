/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

//Regexp helpers


/**
 * Converts glob pattern into regexp
 * @param glob {String} glob pattern
 */
module.exports.glob2Regexp = function(glob) {

    var res = "";
    glob = glob.trim();

    var escaping = false;
    var inCurlies = 0;
    var previousChar = null;

    for (var cInd = 0; cInd < glob.length; ++cInd) {

        var currentChar = glob.charAt(cInd);

        switch (currentChar) {
            case '*':
                if (escaping) {
                    res += "\\*";
                } else {
                    res += ".*";
                }
                escaping = true;
                break;
            case '?':
                if (escaping) {
                    res += "\\?";
                } else {
                    res += ".";
                }
                escaping = false;
                break;
            case '.':
            case '(':
            case ')':
            case '+':
            case '|':
            case '^':
            case '$':
            case '@':
            case '%':
                res += '\\';
                res += currentChar;
                escaping = false;
                break;
            case '\\':
                if (escaping) {
                    res += "\\\\";
                    escaping = false;
                } else {
                    escaping = true;
                }
                break;
            case '{':
                if (escaping) {
                    res += "\\{";
                } else {
                    res += '(';
                    inCurlies++;
                }
                escaping = false;
                break;
            case '}':
                if (inCurlies > 0 && !escaping) {
                    res += ')';
                    inCurlies--;
                } else if (escaping) {
                    res += "\\}";
                } else {
                    res += "}";
                }
                escaping = false;
                break;
            case ',':
                if (inCurlies > 0 && !escaping) {
                    res += '|';
                } else {
                    res += currentChar;
                }
                escaping = false;
                break;

            default:
                if (currentChar == ' ') {
                    if (previousChar != null && previousChar == ' ') {
                        res += "\\s*";
                    }
                } else {
                    res += currentChar;
                }
                escaping = false;
        }

        previousChar = currentChar;
    }

    return res;
};
