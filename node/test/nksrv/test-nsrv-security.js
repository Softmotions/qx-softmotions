/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

require("../../nkserver-qxoo.js");

var nunit = require("nodeunit");
var http = require("http");

var cwd = process.cwd();
//nodejs appender
/*if (qx.core.Environment.get("sm.nsrv.debug") == true) {
 qx.log.Logger.setLevel("debug");
 } else {
 qx.log.Logger.setLevel("info");
 }*/
qx.log.Logger.setLevel("info");
sm.log.appender.Node


process.on("uncaughtException", function (err) {
    qx.log.Logger.error(err);
});

var auth = {
    basic: {
        type: sm.nsrv.auth.BasicAuthFilter,
        options: {
            realmName: "NKServerTest"
        }
    },
    digest: {
        type: sm.nsrv.auth.DigestAuthFilter,
        options: {
            realmName: "NKServerTest"
        }
    }
};

var config =
        [
            //virtual hosts
            {
                vhost : "127.0.0.1",
                defaultWebapp : "testsecurity",
                webapps : [
                    {
                        id : "testsecurity",
                        context : "/test",
                        docRoot : cwd + "/nksrv/webapps/security",
                        security: {
                            auth: {},
                            userProvider: {
                                type: sm.nsrv.auth.InMemoryUserProvider,
                                options: {
                                    roles: [
                                        {id: 'a'},
                                        {id: 'b'},
                                        {id: 'c', parent: 'a'}
                                    ],
                                    users: [
                                        {/*dGVzdDp0ZXN0*/ login: 'test', password: 'test', roles: ['a']},
                                        {/*dGVzdDI6dGVzdA==*/ login: 'test2', password: 'test', roles: ['b']},
                                        {/*dGVzdDM6dGVzdA==*/ login: 'test3', password: 'test', roles: ['c']},
                                        {/*dGVzdDQ6dGVzdA==*/ login: 'test4', password: 'test', roles: ['b', 'c']}
                                    ]
                                }
                            }
                        },
                        handlerDefaults : {
                            methods : ["GET", "POST"]
                        }
                    }
                ],
                errorOptions : {
                    showErrorMsg : false,    //Return errors in response body
                    messagesInHeaders : true //Return errors in http resp headers
                },
                formdiableOptions : { //options for formidable nodejs module
                    keepExtensions : true,
                    uploadDir : "/tmp",
                    maxFieldsSize :  2 * 1024 * 1024
                }
            }
        ];

var port = 3001;
var nserver = null;

//shutdown hook
process.on("exit", function () {
    nserver.shutdown();
});

process.on("SIGINT1", function () {
    nserver.shutdown();
});

// BASIC AUTH tests

module.exports["Test startup server (Basic)"] = function(test) {
    config[0].webapps[0].security.auth = auth.basic;
    config[0].webapps[0].security.securityKey = "basic";
    nserver = new sm.nsrv.NKServer(config);
    nserver.startup(port, "127.0.0.1");
    test.done();
};

module.exports["Test unsecured resource: single request without auth (Basic)"] = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req = client.request("GET", "/test/unsecured", {"host": "127.0.0.1"});
    req.on("response", function (resp) {
        resp.setEncoding("utf8");
        test.equal(resp.statusCode, 200);
        test.equal(resp.headers["content-type"], "text/plain");
        resp.on("data", function (body) {
            test.ok(body);
            test.ok(body.indexOf("content") >= 0)
        });
        resp.on("end", function () {
            test.done();
        });
    });
    req.end();
};

module.exports["Test unsecured resource: single request with auth (Basic)"] = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req = client.request("GET", "/test/secured", { "host": "127.0.0.1", "Authorization": "Basic dGVzdDp0ZXN0" });
    req.on("response", function (resp) {
        resp.setEncoding("utf8");
        test.equal(resp.statusCode, 200);
        test.equal(resp.headers["content-type"], "text/plain");
        resp.on("data", function (body) {
            test.ok(body);
            test.ok(body.indexOf("content") >= 0)
        });
        resp.on("end", function () {
            test.done();
        });
    });
    req.end();
};

module.exports["Test secured resource: single request without auth (Basic)"] = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req = client.request("GET", "/test/secured", {"host": "127.0.0.1"});
    req.on("response", function (resp) {
        resp.setEncoding("utf8");
        test.equal(resp.statusCode, 401);
        test.equal(resp.headers["www-authenticate"], "Basic realm=\"NKServerTest\"");
        resp.on("end", function () {
            test.done();
        });
    });
    req.end();
};

module.exports["Test secured resource: single request with auth (Basic)"] = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req = client.request("GET", "/test/secured", { "host": "127.0.0.1", "Authorization": "Basic dGVzdDp0ZXN0" });
    req.on("response", function (resp) {
        resp.setEncoding("utf8");
        test.equal(resp.statusCode, 200);
        test.ok(resp.headers["set-cookie"]);
        test.equal(resp.headers["content-type"], "text/plain");
        resp.on("data", function (body) {
            test.ok(body);
            test.ok(body.indexOf("content") >= 0)
        });
        resp.on("end", function () {
            test.done();
        });
    });
    req.end();
};

module.exports["Test secured resource: double request with auth, but without cookie (Basic)"] = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req1 = client.request("GET", "/test/secured", { "host": "127.0.0.1", "Authorization": "Basic dGVzdDp0ZXN0" });
    req1.on("response", function (resp1) {
        resp1.setEncoding("utf8");
        test.equal(resp1.statusCode, 200);
        test.equal(resp1.headers["content-type"], "text/plain");
        test.ok(resp1.headers["set-cookie"]);
        resp1.on("data", function (body) {
            test.ok(body);
            test.ok(body.indexOf("content") >= 0)
        });
        resp1.on("end", function () {
            var req2 = client.request("GET", "/test/secured", { "host": "127.0.0.1" });
            req2.on("response", function (resp2) {
                resp2.setEncoding("utf8");
                test.equal(resp2.statusCode, 401);
                test.equal(resp2.headers["www-authenticate"], "Basic realm=\"NKServerTest\"");
                resp2.on("end", function () {
                    test.done();
                });
            });
            req2.end();
        });
    });
    req1.end();
};

module.exports["Test secured resource: double request with auth and with cookie (Basic)"] = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req1 = client.request("GET", "/test/secured", { "host": "127.0.0.1", "Authorization": "Basic dGVzdDp0ZXN0" });
    req1.on("response", function (resp1) {
        resp1.setEncoding("utf8");
        test.equal(resp1.statusCode, 200);
        var cookie = "";
        test.ok(resp1.headers["set-cookie"]);
        if (resp1.headers["set-cookie"]) {
            var cresp = resp1.headers["set-cookie"];
            cresp.forEach(function(item) {
                cookie += item.split(';')[0] + "; "
            });
        }
        test.equal(resp1.headers["content-type"], "text/plain");
        resp1.on("data", function (body) {
            test.ok(body);
            test.ok(body.indexOf("content") >= 0)
        });
        resp1.on("end", function () {
            var req2 = client.request("GET", "/test/secured", { "host": "127.0.0.1", "cookie": cookie });
            req2.on("response", function (resp2) {
                resp2.setEncoding("utf8");
                test.equal(resp2.statusCode, 200);
                test.equal(resp2.headers["content-type"], "text/plain");
                resp2.on("data", function (body) {
                    test.ok(body);
                    test.ok(body.indexOf("content") >= 0)
                });
                resp2.on("end", function () {
                    test.done();
                });
            });
            req2.end();
        });
    });
    req1.end();
};

var buildBasicRolesTests = function(name, resource, tests) {
    var index = 0;

    tests.forEach(function(tdata) {
        module.exports[name + tdata.roles] = function(test) {
            var client = http.createClient(port, "127.0.0.1");
            var req = client.request("GET", resource, { "host": "127.0.0.1", "Authorization": "Basic " + tdata.auth }
                    );
            req.on("response", function (resp) {
                resp.setEncoding("utf8");
                if (tdata.access) {
                    test.equal(resp.statusCode, 200);
                    test.ok(resp.headers["set-cookie"]);
                    test.equal(resp.headers["content-type"], "text/plain");
                    resp.on("data", function (body) {
                        test.ok(body);
                        test.ok(body.indexOf("content") >= 0);
                    });
                } else {
                    test.equal(resp.statusCode, 403);
                }
                resp.on("end", function () {
                    test.done();
                });
            });
            req.end();
        }

    });
};

buildBasicRolesTests("Test access resource (Basic): required roles ['a'], user roles:",
                     "/test/roles/a",
                     [
                         { auth: "dGVzdDp0ZXN0", access: true, roles: "['a']" },
                         { auth: "dGVzdDI6dGVzdA==", access: false, roles: "['b']" },
                         { auth: "dGVzdDM6dGVzdA==", access: true, roles: "['c', 'a']" },
                         { auth: "dGVzdDQ6dGVzdA==", access: true, roles: "['b', 'c', 'a']" }
                     ]);

buildBasicRolesTests("Test access resource (Basic): required roles ['b'], user roles:",
                     "/test/roles/b",
                     [
                         { auth: "dGVzdDp0ZXN0", access: false, roles: "['a']" },
                         { auth: "dGVzdDI6dGVzdA==", access: true, roles: "['b']" },
                         { auth: "dGVzdDM6dGVzdA==", access: false, roles: "['c', 'a']" },
                         { auth: "dGVzdDQ6dGVzdA==", access: true, roles: "['b', 'c', 'a']" }
                     ]);

buildBasicRolesTests("Test access resource (Basic): required roles ['c'], user roles:",
                     "/test/roles/c",
                     [
                         { auth: "dGVzdDp0ZXN0", access: false, roles: "['a']" },
                         { auth: "dGVzdDI6dGVzdA==", access: false, roles: "['b']" },
                         { auth: "dGVzdDM6dGVzdA==", access: true, roles: "['c', 'a']" },
                         { auth: "dGVzdDQ6dGVzdA==", access: true, roles: "['b', 'c', 'a']" }
                     ]);

buildBasicRolesTests("Test access resource (Basic): required roles ['a', 'b'], user roles:",
                     "/test/roles/d",
                     [
                         { auth: "dGVzdDp0ZXN0", access: false, roles: "['a']" },
                         { auth: "dGVzdDI6dGVzdA==", access: false, roles: "['b']" },
                         { auth: "dGVzdDM6dGVzdA==", access: false, roles: "['c', 'a']" },
                         { auth: "dGVzdDQ6dGVzdA==", access: true, roles: "['b', 'c', 'a']" }
                     ]);

module.exports["Tes shutdown server (Basic)"] = function(test) {
    test.ok(nserver);
    nserver.shutdown();
    test.done();
};


// DIGEST AUTH tests

module.exports["Test startup server (Digest)"] = function(test) {
    config[0].webapps[0].security.auth = auth.digest;
    config[0].webapps[0].security.securityKey = "digest";
    nserver = new sm.nsrv.NKServer(config);
    nserver.startup(port, "127.0.0.1");
    test.done();
};


module.exports["Test shutdown server (Digest)"] = function(test) {
    test.ok(nserver);
    nserver.shutdown();
    test.done();
};

