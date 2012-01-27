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
    var len = 0;

    function done(err) {
        if (callback && !callbackCalled) {
            callback(err, len);
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
        len += chunk.length;
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
        done();
    });

    readStream.addListener('error', function(err) {
        try {
            readStream.destroy();
        } finally {
            try {
                writeStream.end();
            } finally {
                done(err);
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
                done(err);
            }
        }
    });
};
