/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

// Various filesystem utils


var l_fs = require("fs");
var l_path = require("path");
var l_regexp = require("utils/regexp");


//todo perform locking, need c++ addon
var fLock = false;
var writeFileLock = module.exports.writeFileLock = function(path, data, enc, cb) {
    if (fLock) {
        process.nextTick(function() {
            writeFileLock(path, data, enc, cb);
        });
        return;
    }
    l_fs.writeFile(path, data, enc, function(err) {
        fLock = false;
        if (cb) cb(err);
    });
};

var readFileLock = module.exports.readFileLock = function(path, enc, cb) {
    if (fLock) {
        process.nextTick(function() {
            readFileLock(path, cb);
        });
        return;
    }
    l_fs.readFile(path, enc, function(err, data) {
        fLock = false;
        if (cb) cb(err, data);
    });
};

var readFileLockSync = module.exports.readFileLockSync = function(path, enc) {
    //todo perform locking, need c++ addon
    return l_fs.readFileSync(path, enc);
};

var writeFileLockSync = module.exports.writeFileLockSync = function(path, data, enc) {
    //todo perform locking, need c++ addon
    return l_fs.writeFileSync(path, data, enc);
};


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
            if (e.errno == 2) { //ENOENT todo crossplatform
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
 * Current file separator
 */
        const FileSeparator = ["linux", "sunos", "freebsd"].indexOf(process.platform) >= 0 ? '/' : '\\';
module.exports.FileSeparator = FileSeparator;


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
    if (FileSeparator == '/') {
        return (c == FileSeparator);
    } else {
        var colon = path.indexOf(':');
        return ((c >= 'a' && c <= 'z') && colon == 1 && path.length > 2 && path.charAt(2) == FileSeparator);
    }
};

const DirectoryScanner = function(rootDir, scanSpec) {

    this.rootDir = l_path.normalize(rootDir);

    //Clone scaneSpec data, because it will be modified during normalization
    this.includes = scanSpec["includes"] ? scanSpec["includes"].concat() : ["**"];
    this.excludes = scanSpec["excludes"] ? scanSpec["excludes"].concat() : [];

    for (var i = 0; i < this.excludes.length; ++i) {
        this.excludes[i] = this._normPattern(this.excludes[i]).split(FileSeparator);
    }
    for (var i = 0; i < DEFAULTEXCLUDES.length; ++i) {
        this.excludes.push(this._normPattern(DEFAULTEXCLUDES[i]).split(FileSeparator));
    }
    for (var i = 0; i < this.includes.length; ++i) {
        this.includes[i] = this._normPattern(this.includes[i]).split(FileSeparator);
    }
    this.rootDirArr = this.rootDir.split(FileSeparator);
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
//todo memory optimization, huge memory for big dirs due to unbound async queue 
DirectoryScanner.prototype.traverseFiles = function(startDir, fstat, callback, fcallback, inodes) {
    if (this.__abort == true) {
        return;
    }
    if (!inodes) {
        inodes = [];
    }
    if (!fstat) {
        try {
            fstat = l_fs.lstatSync(startDir);
        } catch(e) {
            callback(e, startDir, null);
            return;
        }
    }
    if (!fstat.isDirectory()) {
        return;
    }
    /*if (inodes.indexOf(fstat.ino) != -1) {
     //avoid symbolic link loops
     return;
     }*/
    var me = this;
    inodes.push(fstat.ino);
    var readdirCb = function(cbErr, files) {
        try {
            if (cbErr) {
                callback(cbErr, startDir, null);
                return;
            }

            if (files && me.__abort != true) {
                for (var i = 0; i < files.length; ++i) {
                    var file = startDir + FileSeparator + files[i];
                    var err = null;
                    var lfstat = null;
                    try {
                        lfstat = l_fs.lstatSync(file);
                    } catch(e) {
                        err = e;
                    }
                    if (!err) {
                        var cres = callback(null, file, lfstat);
                        if (cres && lfstat.isDirectory()) {
                            me.traverseFiles(file, lfstat, callback, fcallback, inodes);
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
    /*if ((inodes.length % 2) == 0) { //todo duty hack, minor memory opts
     var files = null;
     var cbErr = null;
     try {
     files = l_fs.readdirSync(startDir);
     } catch(e) {
     cbErr = e;
     }
     readdirCb(cbErr, files);
     } else {*/
    l_fs.readdir(startDir, readdirCb);
    /*}*/
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


DirectoryScanner.prototype.abort = function() {
    this.__abort = true;
};

/**
 * Normalize ant path pattern
 */
DirectoryScanner.prototype._normPattern = function(pattern) {
    if (pattern == "") {
        return "**";
    }
    while (pattern.length > 0 && pattern.charAt(0) == FileSeparator) {
        pattern = pattern.substring(1);
    }
    var nlist = [];
    var plist = pattern.split(FileSeparator);

    var inMD = false; //if true we in **/pattern
    for (var i = 0; i < plist.length; ++i) {
        var pitem = plist[i];
        if (pitem == "**") {
            if (inMD) {
                continue;
            }
            inMD = true;
        } else if (pitem == "*" && inMD) {
            continue;
        } else {
            pitem = l_regexp.glob2Regexp(pitem);
            inMD = false;
        }
        nlist.push(pitem);
    }
    return nlist.join(FileSeparator);
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
        //console.log(farr.join("/"));
        var res = me.voteAll(farr);
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
            return (fstat && fstat.isDirectory()) ? me.voteAll(farr, true) : false;
        }
    }, fcallback, null);
};

DirectoryScanner.prototype.voteAll = function(farr, onlyPrefix) {

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

DirectoryScanner.prototype.vote = function(farr, pattern, onlyPrefix) {

    //qx.log.Logger.warn("\nfarr=" + farr.join("|") + "\npatt=" + pattern.join("|"));

    if (pattern.length == 1 && pattern[0] == "**") { //Simple case
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
        if (pv == "**") {
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
            if (pv != "**") {
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


DirectoryScanner.prototype.match = function(val, pattern) {

    if (!this._rcache) {
        this._rcache = {};
    }
    var lpattern = (pattern == "**") ? ".*" : pattern;
    var re = this._rcache[lpattern];
    if (!re) {
        re = new RegExp(lpattern, "i");
        this._rcache[lpattern] = re;
    }
    return re.test(val);
};


module.exports.DirectoryScanner = DirectoryScanner;


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