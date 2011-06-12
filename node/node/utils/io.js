/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */


/**
 * Agressive pump into writeStream, used to pump into HTTP response stream
 * due to some strange io bugs under havy loads with standard util.pupm()
 */
module.exports.responseHTTPump = function(readStream, writeStream, callback) {
    var callbackCalled = false;

    function call(a, b, c) {
        if (callback && !callbackCalled) {
            callback(a, b, c);
            callbackCalled = true;
        }
    }

    if (!readStream.pause) {
        readStream.pause = function() {
            readStream.emit('pause');
        };
    }

    if (!readStream.resume) {
        readStream.resume = function() {
            readStream.emit('resume');
        };
    }

    readStream.addListener('data', function(chunk) {
        writeStream.write(chunk); //removed if (writeStream.write(chunk) === false) readStream.pause();
    });

    writeStream.addListener('pause', function() {
        readStream.pause();
    });

    writeStream.addListener('drain', function() {
        readStream.resume();
    });

    writeStream.addListener('resume', function() {
        readStream.resume();
    });

    readStream.addListener('end', function() {
        writeStream.end();
    });

    readStream.addListener('close', function() {
        call();
    });

    readStream.addListener('error', function(err) {
        writeStream.end();
        call(err);
    });

    writeStream.addListener('error', function(err) {
        readStream.destroy();
        call(err);
    });
};
