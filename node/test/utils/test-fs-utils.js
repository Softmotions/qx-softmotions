/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

require("../../nkserver-qxoo.js");
var fsutils = require("utils/fsutils");

var cwd = process.cwd();

module.exports.testDirectoryScanner = function(test) {

    test.ok(fsutils.FileSeparator);
    if (fsutils.FileSeparator == '/') {
        test.ok(fsutils.isAbsolutePath("/a/b/c.txt"));
        test.ok(fsutils.isAbsolutePath("/"));
        test.ok(!fsutils.isAbsolutePath("a/b/c.txt"));
        test.ok(!fsutils.isAbsolutePath("test.xml"));
    } else {
        //todo win assumed
        test.ok(fsutils.isAbsolutePath("C:\\a\\b\\c"));
        test.ok(fsutils.isAbsolutePath("D:"));
    }

    var ds = new fsutils.DirectoryScanner(
            cwd, {
        "includes" : ["data/SAMPLE*.AVI", "nksrv/webapps/test*1/**", "**/opr068DD.avi"],
        "excludes" : ["**/*русские*"]
    });

    test.equal(ds._normPattern(""), "**");
    test.equal(ds._normPattern("/**/test/**/test2/*/*/file*.txt"), "**/test/**/test2/.*/.*/file.*\\.txt");
    test.equal(ds._normPattern("/**/**/test/**/test2/*/*/file*.txt"), "**/test/**/test2/.*/.*/file.*\\.txt");
    test.equal(ds._normPattern("/**/**/test/**/test2/*/**/*/file*.txt"), "**/test/**/test2/.*/**/file.*\\.txt");

    test.ok(ds.vote(["a", "b", "c"], ds._normPattern("a/*/c").split(fsutils.FileSeparator)));
    test.ok(!ds.vote(["a", "b", "c"], ds._normPattern("a/*/d").split(fsutils.FileSeparator)));
    test.ok(ds.vote(["a", "b", "c"], ds._normPattern("**").split(fsutils.FileSeparator)));
    test.ok(ds.vote(["a", "b", "c"], ds._normPattern("**/**").split(fsutils.FileSeparator)));
    test.ok(ds.vote(["a", "b", "c"], ds._normPattern("*/*/*").split(fsutils.FileSeparator)));
    test.ok(!ds.vote(["a", "b", "c"], ds._normPattern("*/*/*/*").split(fsutils.FileSeparator)));
    test.ok(!ds.vote(["a", "b", "c"], ds._normPattern("*/*/*/*/f").split(fsutils.FileSeparator)));
    test.ok(!ds.vote(["a", "b", "c"], ds._normPattern("*").split(fsutils.FileSeparator)));
    test.ok(!ds.vote(["a", "b", "c"], ds._normPattern("*/*").split(fsutils.FileSeparator)));
    test.ok(ds.vote(["a", "b", "c"], ds._normPattern("a/**/c").split(fsutils.FileSeparator)));
    test.ok(ds.vote(["a", "b", "c"], ds._normPattern("a/**/*").split(fsutils.FileSeparator)));
    test.ok(ds.vote(["a", "b", "c", "d", "e"], ds._normPattern("a/**/e").split(fsutils.FileSeparator)));
    test.ok(ds.vote(["a", "b", "c", "d", "e"], ds._normPattern("a/**/d/e").split(fsutils.FileSeparator)));
    test.ok(ds.vote(["a", "b", "c", "d", "e"], ds._normPattern("a/**/c/d/e").split(fsutils.FileSeparator)));
    test.ok(!ds.vote(["a", "b", "c", "d", "e"], ds._normPattern("a/**/c/d/f").split(fsutils.FileSeparator)));
    test.ok(!ds.vote(["a", "b", "c", "d", "e"], ds._normPattern("a/**/f/d/e").split(fsutils.FileSeparator)));
    test.ok(ds.vote(["a", "b", "c", "d", "e", "f", "g"], ds._normPattern("a/**/d/**/g").split(fsutils.FileSeparator)));
    test.ok(ds.vote(["a", "b", "c", "d"], ds._normPattern("**/*").split(fsutils.FileSeparator)));
    test.ok(ds.vote(["a", "b", "c", "d"], ds._normPattern("a/**/*").split(fsutils.FileSeparator)));
    test.ok(ds.vote(["a", "b", "c", "d"], ds._normPattern("a/b/c/d").split(fsutils.FileSeparator)));
    test.ok(ds.vote(["src", "p1", "index.cpp"], ds._normPattern("src/**/*.cpp").split(fsutils.FileSeparator)));
    test.ok(ds.vote(["src", "p1", "p2", "index.cpp"], ds._normPattern("src/**/*.cpp").split(fsutils.FileSeparator)));
    test.ok(ds.vote(["src", "index.cpp"], ds._normPattern("src/**/*.cpp").split(fsutils.FileSeparator)));
    test.ok(ds.vote(["src", "index.cpp"], ds._normPattern("src/*.cpp").split(fsutils.FileSeparator)));
    test.ok(!ds.vote(["src", "p1", "index.cpp"], ds._normPattern("src/*.cpp").split(fsutils.FileSeparator)));
    test.ok(ds.vote(["src", "p1", "index.cpp"], ds._normPattern("src/*/*.cpp").split(fsutils.FileSeparator)));
    test.ok(!ds.vote(["nsrv", "nsrv-generic-tests.js"], ds._normPattern("nsrv/**/test1").split(fsutils.FileSeparator)));
    test.ok(ds.vote("/home/adam/Projects/softmotions/uis/dist/uisclient/.svn/props".split(fsutils.FileSeparator),
                    ds._normPattern("**/.svn/**").split(fsutils.FileSeparator)));


    var scanned = {};
    //Scan directory
    ds.scan(function(err, file, stat) {
        test.ifError(err);
        scanned[file.substring(cwd.length)] = stat;

    }, function() {

        var fnames = qx.lang.Object.getKeys(scanned);
        test.equal(fnames.length, 5);

        test.ok(fnames.indexOf("/nksrv/webapps/test1/hello.jz") >= 0);
        test.ok(fnames.indexOf("/nksrv/webapps/test1/params.jz") >= 0);
        test.ok(fnames.indexOf("/nksrv/webapps/test1/hello.txt") >= 0);

        var si = scanned["/data/opr068DD.avi"];
        test.ok(si);
        test.equal(si.size, 1135814);

        si = scanned["/data/SAMPLE.AVI"];
        test.ok(si);
        test.equal(si.size, 1022776);

        si = scanned["/nksrv/webapps/test1/hello.jz"];
        test.ok(si);

        test.done();
    });
};