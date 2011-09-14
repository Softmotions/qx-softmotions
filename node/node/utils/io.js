/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */


/**
 * Agressive pump into writeStream, used to pump into HTTP response stream
 * due to some strange io bugs under havy loads with standard util.pump()
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
        try {
            writeStream.write(chunk); //removed if (writeStream.write(chunk) === false) readStream.pause();
        } catch(e) { //we can get: Error: Socket.end() called already; cannot write
            writeStream.emit('error', e);
        }
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
        try {
            readStream.destroy();
        } finally {
            try {
                writeStream.end();
            } finally {
                call(err);
            }
        }
    });

    writeStream.addListener('error', function(err) {
        try {
            writeStream.destroy();
        } finally {
            try {
                readStream.destroy();
            } finally {
                call(err);
            }
        }
    });
};
