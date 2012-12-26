/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

// Various filesystem utils

var async = require("async");
var l_fs = require("fs-ext");
var l_path = require("path");
var l_regexp = require("utils/regexp");
var l_async = require("utils/async");
module.exports.FileSeparator = l_path.sep;


///////////////////////////////////////////////////////////////////////////
//                    Read/Write files with lock options                 //
///////////////////////////////////////////////////////////////////////////


var writeFileLock = module.exports.writeFileLock = function(path, data, enc, cb) {
    l_fs.open(path, "w", null, function(err, fd) {		
        if (err) {
            if (cb) {
                cb(err);
            }
            return;
        }		
        l_fs.flock(fd, "ex", function(err) {			
            if (err) {
                l_fs.close(fd, function() {
					if (cb) {
						cb(err, data);
					}
				});
                return;
            }
			l_fs.truncate(fd, 0, function() {				
				l_fs.write(fd, data, 0, enc, function(err) {					
					l_fs.flock(fd, "un", function() {
						l_fs.close(fd, function() {
							if (cb) {
								cb(err, data);
							}
						});              
					});
				});			
			});						            
        });
    });
};

var readFileLock = module.exports.readFileLock = function(path, enc, cb) {
    l_fs.open(path, "r", null, function(err, fd) {	
        if (err) {
            if (cb) {
                cb(err);
            }
            return;
        }
        l_fs.flock(fd, "sh", function(err) {			
            if (err) {
                l_fs.close(fd, function() {
                    if (cb) {
                        cb(err);
                    }
                });
                return;
            }
            readFileFd(fd, enc, function(err, data) {				
                l_fs.flock(fd, "un", function() {    
					//we dont need to close fd - already closed					
					if (cb) {							
						cb(err, data);
					}                    
                });
            });
        });
    });
};

var readFileLockSync = module.exports.readFileLockSync = function(path, enc) {
    var data = null;
    var fd = l_fs.openSync(path, "r");
    try {
        l_fs.flockSync(fd, "sh");
        try {
            data = readFileFdSync(fd, enc);
        } finally {
            l_fs.flockSync(fd, "un");
        }
    } finally {
        l_fs.closeSync(fd); //need to close FD
    }
    return data;
};


///////////////////////////////////////////////////////////////////////////
//                       Read/Write files by FD                          //
///////////////////////////////////////////////////////////////////////////


/**
 * Read entire file reffered by file descriptor (fd)
 * @param fd {Integer} File descriptor
 * @param enc {String?null} Optional encoding
 * @param callback {function(err, data)?null} Optional callback
 */
var readFileFd = module.exports.readFileFd = function(fd, enc, callback) {

    var encoding = typeof(enc) === 'string' ? enc : null;
    var callback = arguments[arguments.length - 1];
    if (typeof(callback) !== 'function') {
        callback = function() {
        };
    }
    var readStream = l_fs.createReadStream(null, {"fd" : fd});
    readStream.emit('open', fd);
    readStream.resume();

    var buffers = [];
    var nread = 0;

    readStream.on('data', function(chunk) {
        buffers.push(chunk);
        nread += chunk.length;
    });

    readStream.on('error', function(er) {
        callback(er);
        readStream.destroy();
    });

    readStream.on('end', function() {
        // copy all the buffers into one
        var buffer;
        switch (buffers.length) {
            case 0:
                buffer = new Buffer(0);
                break;
            case 1:
                buffer = buffers[0];
                break;
            default: // concat together
                buffer = new Buffer(nread);
                var n = 0;
                buffers.forEach(function(b) {
                    var l = b.length;
                    b.copy(buffer, n, 0, l);
                    n += l;
                });
                break;
        }
        if (encoding) {
            try {
                buffer = buffer.toString(encoding);
            } catch (er) {
                return callback(er);
            }
        }
        callback(null, buffer);
    });
};


/**
 * Read entire file reffered by file descriptor (fd)
 * File descriptor will not be closed upon completion.
 *
 * @param fd {Integer} File descriptor
 * @param enc {String?null} Optional encoding
 */
var readFileFdSync = module.exports.readFileFdSync = function(fd, encoding) {

    var buffer = new Buffer(4048);
    var buffers = [];
    var nread = 0;
    var lastRead = 0;

    do {
        if (lastRead) {
            buffer._bytesRead = lastRead;
            nread += lastRead;
            buffers.push(buffer);
        }
        var buffer = new Buffer(4048);
        lastRead = l_fs.readSync(fd, buffer, 0, buffer.length, null);
    } while (lastRead > 0);

    if (buffers.length > 1) {
        var offset = 0;
        var i;
        buffer = new Buffer(nread);
        buffers.forEach(function(i) {
            if (!i._bytesRead) {
                return;
            }
            i.copy(buffer, offset, 0, i._bytesRead);
            offset += i._bytesRead;
        });
    } else if (buffers.length) {
        // buffers has exactly 1 (possibly zero length) buffer, so this should
        // be a shortcut
        buffer = buffers[0].slice(0, buffers[0]._bytesRead);
    } else {
        buffer = new Buffer(0);
    }

    if (encoding) {
        buffer = buffer.toString(encoding);
    }
    return buffer;
};


///////////////////////////////////////////////////////////////////////////
//                         Directory & path staff                        //
///////////////////////////////////////////////////////////////////////////


/**
 * Creates directory with its parents
 * @param dirname {String} Full dirname
 * @param mode {Integer ? 0777} Creation mode
 */
module.exports.mkdirsSync = function (dirname, mode) {

    if (mode === undefined) {
        mode = 0777 ^ process.umask();
    }
    var pathsCreated = [], pathsFound = [];
    var fn = dirname;
    while (true) {
        try {
            var stats = l_fs.statSync(fn);
            if (stats.isDirectory()) {
                break;
            }
            throw new Error("Unable to create directory: " + fn);
        } catch (e) {
            if (e.message && e.message.indexOf("ENOENT") !== -1) { //todo crossplatform??
                pathsFound.push(fn);
                fn = l_path.dirname(fn);
            } else {
                throw e;
            }
        }
    }
    for (var i = pathsFound.length - 1; i > -1; i--) {
        fn = pathsFound[i];
        l_fs.mkdirSync(fn, mode);
        pathsCreated.push(fn);
    }
    return pathsCreated;
};


/**
 * Returns true of path is absolute
 * @param path {String}
 * @param os {String? undefined} OS id
 */
module.exports.isAbsolutePath = function(path) {
    var len = path.length;
    if (len == 0) {
        return false;
    }
    var c = path.charAt(0);
    if (path.sep === '/') {
        return (c === path.sep);
    } else {
        var colon = path.indexOf(':');
        return (colon === 1 && c >= 'A' && c <= 'Z');
    }
};

///////////////////////////////////////////////////////////////////////////
//                      ant path pattern checker                         //
///////////////////////////////////////////////////////////////////////////

const AntPathMatcher = function(patternSpec) {
    //Clone scaneSpec data, because it will be modified during normalization
    this.includes = patternSpec["includes"] ? patternSpec["includes"].concat() : ["**"];
    this.excludes = patternSpec["excludes"] ? patternSpec["excludes"].concat() : [];

    for (var i = 0; i < this.excludes.length; ++i) {
        this.excludes[i] = this._normPattern(this.excludes[i]).split('/');
    }
    for (var i = 0; i < DEFAULTEXCLUDES.length; ++i) {
        this.excludes.push(this._normPattern(DEFAULTEXCLUDES[i]).split('/'));
    }
    for (var i = 0; i < this.includes.length; ++i) {
        this.includes[i] = this._normPattern(this.includes[i]).split('/');
    }
};

const DEFAULTEXCLUDES = [
    "**/*~",
    "**/#*#",
    "**/.#*",
    "**/%*%",
    "**/._*",
    "**/CVS",
    "**/CVS/**",
    "**/.cvsignore",
    "**/SCCS",
    "**/SCCS/**",
    "**/vssver.scc",
    "**/.svn",
    "**/.svn/**",
    "**/.DS_Store"
];

/**
 * Normalize ant path pattern
 */
AntPathMatcher.prototype._normPattern = function(pattern) {
    if (pattern === "") {
        return "**";
    }
	pattern = pattern.replace(/\\/g, '/');
    while (pattern.length > 0 && pattern.charAt(0) === '/') {
        pattern = pattern.substring(1);
    }
    var nlist = [];
    var plist = pattern.split('/');

    var inMD = false; //if true we in **/pattern
    for (var i = 0; i < plist.length; ++i) {
        var pitem = plist[i];
        if (pitem === "**") {
            if (inMD) {
                continue;
            }
            inMD = true;
        } else if (pitem === "*" && inMD) {
            continue;
        } else {
            pitem = l_regexp.glob2Regexp(pitem);
            inMD = false;
        }
        nlist.push(pitem);
    }
    return nlist.join('/');
};

AntPathMatcher.prototype.voteAll = function(farr, onlyPrefix) {
    if (!onlyPrefix) {
        for (var i = 0; i < this.excludes.length; ++i) {
            if (this.vote(farr, this.excludes[i])) {
                return false;
            }
        }
    }
    for (var i = 0; i < this.includes.length; ++i) {
        if (this.vote(farr, this.includes[i], onlyPrefix)) {
            return true;
        }
    }

    return false;
};

AntPathMatcher.prototype.vote = function(farr, pattern, onlyPrefix) {

    //qx.log.Logger.warn("\nfarr=" + farr.join("|") + "\npatt=" + pattern.join("|"));

    if (pattern.length == 1 && pattern[0] === "**") { //Simple case
        return true;
    }

    var expectNext = null;
    var expectNextInd = null;
    var pInd = 0;
    var traversedPatterns = [];

    for (var i = 0; i < farr.length; ++i) {

        var fa = farr[i];
        var pv = pattern[pInd];
        var gotExpectNext = false;

        if (!pv) {
            return false;
        }
        if (pv === "**") {
            if (expectNext == null && pattern.length > pInd + 1) {
                expectNext = pattern[pInd + 1];
                expectNextInd = pInd + 1;
                gotExpectNext = true;
            }
        }
        if (!this.match(fa, pv)) {
            return false;
        }

        traversedPatterns.push(pInd);

        if (expectNext) {
            if (this.match(fa, expectNext)) {
                traversedPatterns.push(expectNextInd);
                expectNext = null;
                expectNextInd = null;
                pInd += ((gotExpectNext) ? 1 : 2);
            }
        } else {
            if (pv !== "**") {
                ++pInd;
            }
        }
    }

    if (!onlyPrefix) {
        for (var i = pInd; i < pattern.length; ++i) {
            if (traversedPatterns.indexOf(i) == -1) {
                return false;
            }
        }
    }

    return true;
};

AntPathMatcher.prototype.match = function(val, pattern) {

    if (!this._rcache) {
        this._rcache = {};
    }
    var lpattern = (pattern === "**") ? ".*" : pattern;
    var re = this._rcache[lpattern];
    if (!re) {
        re = new RegExp(lpattern, "i");
        this._rcache[lpattern] = re;
    }
    return re.test(val);
};

///////////////////////////////////////////////////////////////////////////
//                            Directory scanner                          //
///////////////////////////////////////////////////////////////////////////

const DirectoryScanner = function(rootDir, scanSpec) {

    this.rootDir = l_path.normalize(rootDir);
    this._paused = false;

    this.pathMatcher = new AntPathMatcher(scanSpec);

    this.rootDirArr = this.rootDir.split(FileSeparator);
    this._savedReadDirArgs = [];

    this._scannedNodes = {};

    this._concurrency = 1;
    this._rdQueue = l_async.stack(function(task, cb) {
        l_fs.readdir(task[0], function(err, files) {
            task[1](err, files);
            cb();
        });
    }, this._concurrency);
};

DirectoryScanner.prototype.pause = function() {
    this._paused = true;
};

DirectoryScanner.prototype.resume = function() {
    if (this._paused === true) {
        this._paused = false;
        while (this._savedReadDirArgs.length > 0) {
            this._readDir.apply(this, this._savedReadDirArgs.shift());
        }
    }
};

/**
 * Recusively traverses directory. If Callback function
 * return true on dir then it will be traversed
 *
 * @param startDir {String}  Start directory
 * @param callback {Function} Each filtered file callback
 * @param fcallback {Function} Traverse finish callback
 */
//todo symlink loops check !!!
DirectoryScanner.prototype.traverseFiles = function(startDir, fstat, callback, fcallback, inodes) {
    if (!inodes) {
        inodes = [];
    }
    if (this.__abort === true) {
        if (inodes.length == 0 && fcallback) {
            process.nextTick(function() {
                if (inodes.length == 0 && fcallback) {
                    fcallback();
                }
            });
        }
        return;
    }
    if (!fstat) {
        try {
            fstat = l_fs.lstatSync(startDir);
        } catch(e) {
            callback(e, startDir, null);
            if (inodes.length == 0 && fcallback) {
                process.nextTick(function() {
                    if (inodes.length == 0 && fcallback) {
                        fcallback();
                    }
                });
            }
            return;
        }
    }
    if (!fstat.isDirectory()) {
        if (inodes.length == 0 && fcallback) {
            process.nextTick(function() {
                if (inodes.length == 0 && fcallback) {
                    fcallback();
                }
            });
        }
        return;
    }
    /*if (inodes.indexOf(fstat.ino) != -1) {
     //avoid symbolic link loops
     return;
     }*/
    var me = this;
    inodes.push(fstat.ino);

    /*l_fs.readdir(startDir, function(cbErr, files) {
     me._readDir(cbErr, files, fstat, inodes, startDir, callback, fcallback);
     });*/
    this._rdQueue.push([[
        startDir,
        function(cbErr, files) {
            me._readDir(cbErr, files, fstat, inodes, startDir, callback, fcallback);
        }
    ]]);

};

DirectoryScanner.prototype._readDir = function(cbErr, files, fstat, inodes, startDir, callback, fcallback) {
    if (this._paused) {
        this._savedReadDirArgs.push([cbErr, files, fstat, inodes, startDir, callback, fcallback]);
        return;
    }
    try {
        if (cbErr) {
            callback(cbErr, startDir, null);
            return;
        }
        if (files && this.__abort !== true) {
            for (var i = 0; i < files.length; ++i) {
                var file = l_path.join(startDir, files[i]);
                var err = null;
                var lfstat = null;
                try {
                    lfstat = l_fs.lstatSync(file);
                } catch(e) {
                    err = e;
                }
                if (!err) {
                    // check symbolic link loops
                    // todo: check sym link loops in win systems
                    if (lfstat.ino === 0 || !this._scannedNodes[lfstat.ino]) {
                        this._scannedNodes[lfstat.ino] = true;
                        var cres = callback(null, file, lfstat);
                        if (cres && lfstat.isDirectory()) {
                            this.traverseFiles(file, lfstat, callback, fcallback, inodes);
                        }
                    }
                } else {
                    callback(err, file, null);
                }
            }
        }
    } finally { //
        qx.lang.Array.remove(inodes, fstat.ino);
        if (inodes.length == 0 && fcallback) {
            fcallback();
        }
    }
};


DirectoryScanner.prototype.abort = function() {
    this.__abort = true;
};

/**
 * Scans directory
 */
DirectoryScanner.prototype.scan = function(callback, fcallback) {
    var me = this;
    this.traverseFiles(this.rootDir, null, function(err, file, fstat) {
        if (err) {
            callback(err, file, fstat);
            return false;
        }
        if (file.indexOf(me.rootDir) != 0) {
            //File is not suffix
            return false;
        }
        var farr = file.substring(me.rootDir.length + 1).split(FileSeparator);
        var res = me.pathMatcher.voteAll(farr);
        if (res) {
            //todo exception handling?
            if (callback) {
                callback(err, file, fstat);
            }
        }
        if (res) {
            //good voting returns true
            return true;
        } else {
            //voting prefix only for directories
            return (fstat && fstat.isDirectory()) ? me.pathMatcher.voteAll(farr, true) : false;
        }
    }, fcallback, null);
};

module.exports.DirectoryScanner = DirectoryScanner;

module.exports.AntPathMatcher = AntPathMatcher;

/**
 * Path scanner
 *
 * @param rootDir {String} Root directory
 * @param scanSpec {Object} Scan configuration
 * @param callback Path elements callback
 * @param fcallback Scan finished callback
 */
module.exports.scanDirectory = function(rootDir, scanSpec, callback, fcallback) {
    return new DirectoryScanner(rootDir, scanSpec).scan(callback, fcallback);

};