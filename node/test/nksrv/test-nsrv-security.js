/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

require("../../nkserver-qxoo.js");

var nunit = require("nodeunit");
var http = require("http");
var crypto = require("crypto");

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
                                        {id: 'c', parent: 'a'},
                                        {id: 'f', parent: ['c', 'b']}
                                    ],
                                    users: [
                                        {/*dGVzdDp0ZXN0*/ login: 'test', password: 'test', roles: ['a']},
                                        {/*dGVzdDI6dGVzdA==*/ login: 'test2', password: 'test', roles: ['b']},
                                        {/*dGVzdDM6dGVzdA==*/ login: 'test3', password: 'test', roles: ['c']},
                                        {/*dGVzdDQ6dGVzdA==*/ login: 'test4', password: 'test', roles: ['b', 'c']},
                                        {/*dGVzdDU6dGVzdA==*/ login: 'test5', password: 'test', roles: ['f']}
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

module.exports["Test secured resource: single request with bad auth (Basic)"] = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req = client.request("GET", "/test/secured", { "host": "127.0.0.1", "Authorization": "Basic dGFzdDp0ZXN0" });
    req.on("response", function (resp) {
        resp.setEncoding("utf8");
        test.equal(resp.statusCode, 401);
        test.equal(resp.headers["www-authenticate"], "Basic realm=\"NKServerTest\"");
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
        module.exports[name + tdata.roles + " (Basic)"] = function(test) {
            var client = http.createClient(port, "127.0.0.1");
            var req = client.request("GET", resource, { "host": "127.0.0.1", "Authorization": "Basic " + tdata.auth });
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

buildBasicRolesTests("Test access resource: required roles ['a'], user roles:",
                     "/test/roles/a",
                     [
                         { auth: "dGVzdDp0ZXN0", access: true, roles: "['a']" },
                         { auth: "dGVzdDI6dGVzdA==", access: false, roles: "['b']" },
                         { auth: "dGVzdDM6dGVzdA==", access: true, roles: "['c', 'a']" },
                         { auth: "dGVzdDQ6dGVzdA==", access: true, roles: "['b', 'c', 'a']" },
                         { auth: "dGVzdDU6dGVzdA==", access: true, roles: "['f', 'b', 'c', 'a']" }
                     ]);

buildBasicRolesTests("Test access resource: required roles ['b'], user roles:",
                     "/test/roles/b",
                     [
                         { auth: "dGVzdDp0ZXN0", access: false, roles: "['a']" },
                         { auth: "dGVzdDI6dGVzdA==", access: true, roles: "['b']" },
                         { auth: "dGVzdDM6dGVzdA==", access: false, roles: "['c', 'a']" },
                         { auth: "dGVzdDQ6dGVzdA==", access: true, roles: "['b', 'c', 'a']" },
                         { auth: "dGVzdDU6dGVzdA==", access: true, roles: "['f', 'b', 'c', 'a']" }
                     ]);

buildBasicRolesTests("Test access resource: required roles ['c'], user roles:",
                     "/test/roles/c",
                     [
                         { auth: "dGVzdDp0ZXN0", access: false, roles: "['a']" },
                         { auth: "dGVzdDI6dGVzdA==", access: false, roles: "['b']" },
                         { auth: "dGVzdDM6dGVzdA==", access: true, roles: "['c', 'a']" },
                         { auth: "dGVzdDQ6dGVzdA==", access: true, roles: "['b', 'c', 'a']" },
                         { auth: "dGVzdDU6dGVzdA==", access: true, roles: "['f', 'b', 'c', 'a']" }
                     ]);

buildBasicRolesTests("Test access resource: required roles ['a', 'b'], user roles:",
                     "/test/roles/d",
                     [
                         { auth: "dGVzdDp0ZXN0", access: false, roles: "['a']" },
                         { auth: "dGVzdDI6dGVzdA==", access: false, roles: "['b']" },
                         { auth: "dGVzdDM6dGVzdA==", access: false, roles: "['c', 'a']" },
                         { auth: "dGVzdDQ6dGVzdA==", access: true, roles: "['b', 'c', 'a']" },
                         { auth: "dGVzdDU6dGVzdA==", access: true, roles: "['f', 'b', 'c', 'a']" }
                     ]);

module.exports["Test logout after auth (Basic)"] = function(test) {
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
                    var req3 = client.request("GET", "/test/logout", { "host": "127.0.0.1", "cookie": cookie });
                    req3.on("response", function (resp3) {
                        resp3.setEncoding("utf8");
                        test.equal(resp3.statusCode, 200);
                        test.equal(resp3.headers["content-type"], "text/plain");
                        resp3.on("data", function (body) {
                            test.ok(body);
                            test.ok(body.indexOf("content") >= 0)
                        });
                        resp3.on("end", function () {
                            var req4 = client.request("GET", "/test/secured", { "host": "127.0.0.1", "cookie": cookie });
                            req4.on("response", function (resp4) {
                                resp4.setEncoding("utf8");
                                test.equal(resp4.statusCode, 401);
                                test.equal(resp4.headers["www-authenticate"], "Basic realm=\"NKServerTest\"");
                                resp4.on("end", function () {
                                    test.done();
                                });
                            });
                            req4.end();
                        });
                    });
                    req3.end();
                });
            });
            req2.end();
        });
    });
    req1.end();
};

module.exports["Test logout without auth (Basic)"] = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req1 = client.request("GET", "/test/secured", { "host": "127.0.0.1" });
    req1.on("response", function (resp1) {
        resp1.setEncoding("utf8");
        test.equal(resp1.statusCode, 401);
        test.equal(resp1.headers["www-authenticate"], "Basic realm=\"NKServerTest\"");
        var cookie = "";
        test.ok(resp1.headers["set-cookie"]);
        if (resp1.headers["set-cookie"]) {
            var cresp = resp1.headers["set-cookie"];
            cresp.forEach(function(item) {
                cookie += item.split(';')[0] + "; "
            });
        }
        resp1.on("end", function () {
            var req2 = client.request("GET", "/test/logout", { "host": "127.0.0.1", "cookie": cookie });
            req2.on("response", function (resp2) {
                resp2.setEncoding("utf8");
                test.equal(resp2.statusCode, 200);
                test.equal(resp2.headers["content-type"], "text/plain");
                resp2.on("data", function (body) {
                    test.ok(body);
                    test.ok(body.indexOf("content") >= 0)
                });
                resp2.on("end", function () {
                    var req3 = client.request("GET", "/test/secured", { "host": "127.0.0.1", "cookie": cookie });
                    req3.on("response", function (resp3) {
                        resp3.setEncoding("utf8");
                        test.equal(resp3.statusCode, 401);
                        test.equal(resp3.headers["www-authenticate"], "Basic realm=\"NKServerTest\"");
                        resp3.on("end", function () {
                            test.done();
                        });
                    });
                    req3.end();
                });
            });
            req2.end();
        });
    });
    req1.end();
};

module.exports["Tes shutdown server (Basic)"] = function(test) {
    test.ok(nserver);
    nserver.shutdown();
    test.done();
};


// DIGEST AUTH tests

var parseDigestHeaderString = function (header) {
    var dict = {};
    var first = true;
    while (header.length > 0) {
        // eat whitespace and comma
        if (first) {
            first = false;
        } else {
            if (header[0] != ",") {
                return false;
            }
            header = header.slice(1);
        }
        header = header.trimLeft();

        // parse key
        var key = header.match(/^\w+/);
        if (key === null) {
            return false;
        }
        key = key[0];
        header = header.slice(key.length);

        // parse equals
        var eq = header.match(/^\s*=\s*/);
        if (eq === null) {
            return false;
        }
        header = header.slice(eq[0].length);

        // parse value
        var value;
        if (header[0] == "\"") {
            // quoted string
            value = header.match(/^"([^"\\\r\n]*(?:\\.[^"\\\r\n]*)*)"/);
            if (value === null) {
                return false;
            }
            header = header.slice(value[0].length);
            value = value[1];
        } else {
            // unquoted string
            value = header.match(/^[^\s,]+/);
            if (value === null) {
                return false;
            }
            header = header.slice(value[0].length);
            value = value[0];
        }
        dict[key] = value;

        // eat whitespace
        header = header.trimLeft();
    }

    return dict;
};

var buildHash = function(str) {
    return crypto
            .createHash('MD5')
            .update(str)
            .digest('hex');
};

var generateDigestAuth = function(authreq, resource, username, password) {
    var ha1 = buildHash(username + ":" + authreq.realm + ":" + password);
    var ha2 = buildHash("GET:" + resource);
    var dr = buildHash(ha1 + ":" + authreq.nonce + ":00000001:fcfdfefbfa:auth:" + ha2);

    return 'Digest ' +
           'realm="' + authreq.realm + '", ' +
           'username="' + username + '", ' +
           'qop=auth, ' +
           'uri="' + resource + '", ' +
           'nonce="' + authreq.nonce + '", ' +
           'nc=00000001, ' +
           'cnonce="fcfdfefbfa", ' +
           'algorithm="MD5", ' +
           'response="' + dr + '", ' +
           'opaque="' + authreq.opaque + '"';
};

module.exports["Test startup server (Digest)"] = function(test) {
    config[0].webapps[0].security.auth = auth.digest;
    config[0].webapps[0].security.securityKey = "digest";
    nserver = new sm.nsrv.NKServer(config);
    nserver.startup(port, "127.0.0.1");
    test.done();
};

module.exports["Test unsecured resource: single request without auth (Digest)"] = function(test) {
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

module.exports["Test secured resource: single request without auth (Digest)"] = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req = client.request("GET", "/test/secured", {"host": "127.0.0.1"});
    req.on("response", function (resp) {
        resp.setEncoding("utf8");
        test.equal(resp.statusCode, 401);
        test.ok(resp.headers["www-authenticate"]);
        var match = resp.headers["www-authenticate"].match(/^Digest\s+(.*)/);
        test.ok(match);
        if (match) {
            var authreq = parseDigestHeaderString(match[1]);
            test.equal(authreq.realm, "NKServerTest");
            test.ok(authreq.nonce);
            test.equal(authreq.qop, "auth");
            test.ok(authreq.opaque);
        }
        resp.on("end", function () {
            test.done();
        });
    });
    req.end();
};

module.exports["Test unsecured resource: single request with bad auth (Digest)"] = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req1 = client.request("GET", "/test/secured", { "host": "127.0.0.1"});
    req1.on("response", function (resp1) {
        resp1.setEncoding("utf8");
        test.equal(resp1.statusCode, 401);
        test.ok(resp1.headers["www-authenticate"]);
        var match = resp1.headers["www-authenticate"].match(/^Digest\s+(.*)/);
        test.ok(match);
        resp1.on("end", function () {
            if (match) {
                var authreq = parseDigestHeaderString(match[1]);
                test.equal(authreq.realm, "NKServerTest");
                test.ok(authreq.nonce);
                test.equal(authreq.qop, "auth");
                test.ok(authreq.opaque);

                var auth = generateDigestAuth(authreq, "/test/secured", "test", "test2");

                var req2 = client.request("GET", "/test/secured", {"host": "127.0.0.1", "Authorization": auth});
                req2.on("response", function (resp2) {
                    resp2.setEncoding("utf8");
                    test.equal(resp2.statusCode, 401);
                    test.ok(resp2.headers["www-authenticate"]);
                    var match = resp2.headers["www-authenticate"].match(/^Digest\s+(.*)/);
                    test.ok(match);
                    if (match) {
                        var authreq = parseDigestHeaderString(match[1]);
                        test.equal(authreq.realm, "NKServerTest");
                        test.ok(authreq.nonce);
                        test.equal(authreq.qop, "auth");
                        test.ok(authreq.opaque);
                    }
                    resp2.on("end", function () {
                        test.done();
                    });
                });
                req2.end();
            } else {
                test.done();
            }
        });
    });
    req1.end();
};

module.exports["Test unsecured resource: single request with auth (Digest)"] = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req1 = client.request("GET", "/test/secured", { "host": "127.0.0.1"});
    req1.on("response", function (resp1) {
        resp1.setEncoding("utf8");
        test.equal(resp1.statusCode, 401);
        test.ok(resp1.headers["www-authenticate"]);
        var match = resp1.headers["www-authenticate"].match(/^Digest\s+(.*)/);
        test.ok(match);
        resp1.on("end", function () {
            if (match) {
                var authreq = parseDigestHeaderString(match[1]);
                test.equal(authreq.realm, "NKServerTest");
                test.ok(authreq.nonce);
                test.equal(authreq.qop, "auth");
                test.ok(authreq.opaque);

                var auth = generateDigestAuth(authreq, "/test/secured", "test", "test");

                var req2 = client.request("GET", "/test/secured", {"host": "127.0.0.1", "Authorization": auth});
                req2.on("response", function (resp2) {
                    resp2.setEncoding("utf8");
                    test.equal(resp2.statusCode, 200);
                    test.equal(resp2.headers["content-type"], "text/plain");
                    test.ok(resp2.headers["set-cookie"]);
                    resp2.on("data", function (body) {
                        test.ok(body);
                        test.ok(body.indexOf("content") >= 0)
                    });
                    resp2.on("end", function () {
                        test.done();
                    });
                });
                req2.end();
            } else {
                test.done();
            }
        });
    });
    req1.end();
};

module.exports["Test secured resource: double request with auth, but without cookie (Digest)"] = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req1 = client.request("GET", "/test/secured", { "host": "127.0.0.1" });
    req1.on("response", function (resp1) {
        resp1.setEncoding("utf8");
        test.equal(resp1.statusCode, 401);
        test.ok(resp1.headers["www-authenticate"]);
        var match = resp1.headers["www-authenticate"].match(/^Digest\s+(.*)/);
        test.ok(match);
        resp1.on("end", function () {
            if (match) {
                var authreq = parseDigestHeaderString(match[1]);
                test.equal(authreq.realm, "NKServerTest");
                test.ok(authreq.nonce);
                test.equal(authreq.qop, "auth");
                test.ok(authreq.opaque);

                var auth = generateDigestAuth(authreq, "/test/secured", "test", "test");

                var req2 = client.request("GET", "/test/secured", {"host": "127.0.0.1", "Authorization": auth});
                req2.on("response", function (resp2) {
                    resp2.setEncoding("utf8");
                    test.equal(resp2.statusCode, 200);
                    test.equal(resp2.headers["content-type"], "text/plain");
                    test.ok(resp2.headers["set-cookie"]);
                    resp2.on("data", function (body) {
                        test.ok(body);
                        test.ok(body.indexOf("content") >= 0)
                    });
                    resp2.on("end", function () {
                        var req3 = client.request("GET", "/test/secured", { "host": "127.0.0.1" });
                        req3.on("response", function (resp3) {
                            resp3.setEncoding("utf8");
                            test.equal(resp3.statusCode, 401);
                            test.ok(resp3.headers["www-authenticate"]);
                            test.ok(resp3.headers["www-authenticate"].match(/^Digest\s+(.*)/));
                            resp3.on("end", function () {
                                test.done();
                            });
                        });
                        req3.end();
                    });
                });
                req2.end();
            } else {
                test.done();
            }
        });
    });
    req1.end();
};

module.exports["Test secured resource: double request with auth and with cookie (Digest)"] = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req1 = client.request("GET", "/test/secured", { "host": "127.0.0.1" });
    req1.on("response", function (resp1) {
        resp1.setEncoding("utf8");
        test.equal(resp1.statusCode, 401);
        test.ok(resp1.headers["set-cookie"]);
        var cookie = "";
        test.ok(resp1.headers["set-cookie"]);
        if (resp1.headers["set-cookie"]) {
            var cresp = resp1.headers["set-cookie"];
            cresp.forEach(function(item) {
                cookie += item.split(';')[0] + "; "
            });
        }
        test.ok(resp1.headers["www-authenticate"]);
        var match = resp1.headers["www-authenticate"].match(/^Digest\s+(.*)/);
        test.ok(match);
        resp1.on("end", function () {
            if (match) {
                var authreq = parseDigestHeaderString(match[1]);
                test.equal(authreq.realm, "NKServerTest");
                test.ok(authreq.nonce);
                test.equal(authreq.qop, "auth");
                test.ok(authreq.opaque);

                var auth = generateDigestAuth(authreq, "/test/secured", "test", "test");

                var req2 = client.request("GET", "/test/secured", {"host": "127.0.0.1", "cookie": cookie, "Authorization": auth});
                req2.on("response", function (resp2) {
                    resp2.setEncoding("utf8");
                    test.equal(resp2.statusCode, 200);
                    test.equal(resp2.headers["content-type"], "text/plain");
                    test.ok(resp2.headers["set-cookie"]);
                    resp2.on("data", function (body) {
                        test.ok(body);
                        test.ok(body.indexOf("content") >= 0)
                    });
                    resp2.on("end", function () {
                        var req3 = client.request("GET", "/test/secured", { "host": "127.0.0.1", "cookie": cookie });
                        req3.on("response", function (resp3) {
                            resp3.setEncoding("utf8");
                            test.equal(resp3.statusCode, 200);
                            test.equal(resp3.headers["content-type"], "text/plain");
                            resp3.on("data", function (body) {
                                test.ok(body);
                                test.ok(body.indexOf("content") >= 0)
                            });
                            resp3.on("end", function () {
                                test.done();
                            });
                        });
                        req3.end();
                    });
                });
                req2.end();
            } else {
                test.done();
            }
        });
    });
    req1.end();
};

var buildDigestRolesTests = function(name, resource, tests) {
    var index = 0;

    tests.forEach(function(tdata) {
        module.exports[name + tdata.roles + " (Digest)"] = function(test) {
            var client = http.createClient(port, "127.0.0.1");
            var req1 = client.request("GET", resource, { "host": "127.0.0.1"});
            req1.on("response", function (resp1) {
                resp1.setEncoding("utf8");
                test.equal(resp1.statusCode, 401);
                test.ok(resp1.headers["www-authenticate"]);
                var match = resp1.headers["www-authenticate"].match(/^Digest\s+(.*)/);
                test.ok(match);
                resp1.on("end", function () {
                    if (match) {
                        var authreq = parseDigestHeaderString(match[1]);
                        test.equal(authreq.realm, "NKServerTest");
                        test.ok(authreq.nonce);
                        test.equal(authreq.qop, "auth");
                        test.ok(authreq.opaque);

                        var auth = generateDigestAuth(authreq, resource, tdata.auth.login, tdata.auth.password);

                        var req2 = client.request("GET", resource, {"host": "127.0.0.1", "Authorization": auth});
                        req2.on("response", function (resp2) {
                            resp2.setEncoding("utf8");
                            if (tdata.access) {
                                test.equal(resp2.statusCode, 200);
                                test.ok(resp2.headers["set-cookie"]);
                                test.equal(resp2.headers["content-type"], "text/plain");
                                resp2.on("data", function (body) {
                                    test.ok(body);
                                    test.ok(body.indexOf("content") >= 0);
                                });
                            } else {
                                test.equal(resp2.statusCode, 403);
                            }
                            resp2.on("end", function () {
                                test.done();
                            });
                        });
                        req2.end();
                    } else {
                        test.done();
                    }
                });
            });
            req1.end();
        }
    });
};


buildDigestRolesTests("Test access resource: required roles ['a'], user roles:",
                      "/test/roles/a",
                      [
                          { auth: {login: "test", password: "test"}, access: true, roles: "['a']" },
                          { auth: {login: "test2", password: "test"}, access: false, roles: "['b']" },
                          { auth: {login: "test3", password: "test"}, access: true, roles: "['c', 'a']" },
                          { auth: {login: "test4", password: "test"}, access: true, roles: "['b', 'c', 'a']" },
                          { auth: {login: "test5", password: "test"}, access: true, roles: "['f', 'b', 'c', 'a']" }
                      ]);

buildDigestRolesTests("Test access resource: required roles ['b'], user roles:",
                      "/test/roles/b",
                      [
                          { auth: {login: "test", password: "test"}, access: false, roles: "['a']" },
                          { auth: {login: "test2", password: "test"}, access: true, roles: "['b']" },
                          { auth: {login: "test3", password: "test"}, access: false, roles: "['c', 'a']" },
                          { auth: {login: "test4", password: "test"}, access: true, roles: "['b', 'c', 'a']" },
                          { auth: {login: "test5", password: "test"}, access: true, roles: "['f', 'b', 'c', 'a']" }
                      ]);

buildDigestRolesTests("Test access resource: required roles ['c'], user roles:",
                      "/test/roles/c",
                      [
                          { auth: {login: "test", password: "test"}, access: false, roles: "['a']" },
                          { auth: {login: "test2", password: "test"}, access: false, roles: "['b']" },
                          { auth: {login: "test3", password: "test"}, access: true, roles: "['c', 'a']" },
                          { auth: {login: "test4", password: "test"}, access: true, roles: "['b', 'c', 'a']" },
                          { auth: {login: "test5", password: "test"}, access: true, roles: "['f', 'b', 'c', 'a']" }
                      ]);

buildDigestRolesTests("Test access resource: required roles ['a', 'b'], user roles:",
                      "/test/roles/d",
                      [
                          { auth: {login: "test", password: "test"}, access: false, roles: "['a']" },
                          { auth: {login: "test2", password: "test"}, access: false, roles: "['b']" },
                          { auth: {login: "test3", password: "test"}, access: false, roles: "['c', 'a']" },
                          { auth: {login: "test4", password: "test"}, access: true, roles: "['b', 'c', 'a']" },
                          { auth: {login: "test5", password: "test"}, access: true, roles: "['f', 'b', 'c', 'a']" }
                      ]);

module.exports["Test logout after auth (Digest)"] = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req1 = client.request("GET", "/test/secured", { "host": "127.0.0.1" });
    req1.on("response", function (resp1) {
        resp1.setEncoding("utf8");
        test.equal(resp1.statusCode, 401);
        test.ok(resp1.headers["set-cookie"]);
        var cookie = "";
        test.ok(resp1.headers["set-cookie"]);
        if (resp1.headers["set-cookie"]) {
            var cresp = resp1.headers["set-cookie"];
            cresp.forEach(function(item) {
                cookie += item.split(';')[0] + "; "
            });
        }
        test.ok(resp1.headers["www-authenticate"]);
        var match = resp1.headers["www-authenticate"].match(/^Digest\s+(.*)/);
        test.ok(match);
        resp1.on("end", function () {
            if (match) {
                var authreq = parseDigestHeaderString(match[1]);
                test.equal(authreq.realm, "NKServerTest");
                test.ok(authreq.nonce);
                test.equal(authreq.qop, "auth");
                test.ok(authreq.opaque);

                var auth = generateDigestAuth(authreq, "/test/secured", "test", "test");

                var req2 = client.request("GET", "/test/secured", {"host": "127.0.0.1", "cookie": cookie, "Authorization": auth});
                req2.on("response", function (resp2) {
                    resp2.setEncoding("utf8");
                    test.equal(resp2.statusCode, 200);
                    test.equal(resp2.headers["content-type"], "text/plain");
                    test.ok(resp2.headers["set-cookie"]);
                    resp2.on("data", function (body) {
                        test.ok(body);
                        test.ok(body.indexOf("content") >= 0)
                    });
                    resp2.on("end", function () {
                        var req3 = client.request("GET", "/test/logout", { "host": "127.0.0.1", "cookie": cookie });
                        req3.on("response", function (resp3) {
                            resp3.setEncoding("utf8");
                            test.equal(resp3.statusCode, 200);
                            test.equal(resp3.headers["content-type"], "text/plain");
                            resp3.on("data", function (body) {
                                test.ok(body);
                                test.ok(body.indexOf("content") >= 0)
                            });
                            resp3.on("end", function () {
                                var req4 = client.request("GET", "/test/secured", { "host": "127.0.0.1", "cookie": cookie });
                                req4.on("response", function (resp4) {
                                    resp4.setEncoding("utf8");
                                    test.equal(resp4.statusCode, 401);
                                    test.ok(resp4.headers["www-authenticate"]);
                                    test.ok(resp4.headers["www-authenticate"].match(/^Digest\s+(.*)/));
                                    resp4.on("end", function () {
                                        test.done();
                                    });
                                });
                                req4.end();
                            });
                        });
                        req3.end();
                    });
                });
                req2.end();
            } else {
                test.done();
            }
        });
    });
    req1.end();
};

module.exports["Test logout without auth (Digest)"] = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req1 = client.request("GET", "/test/secured", { "host": "127.0.0.1" });
    req1.on("response", function (resp1) {
        resp1.setEncoding("utf8");
        test.equal(resp1.statusCode, 401);
        var cookie = "";
        test.ok(resp1.headers["set-cookie"]);
        if (resp1.headers["set-cookie"]) {
            var cresp = resp1.headers["set-cookie"];
            cresp.forEach(function(item) {
                cookie += item.split(';')[0] + "; "
            });
        }
        test.ok(resp1.headers["www-authenticate"]);
        test.ok(resp1.headers["www-authenticate"].match(/^Digest\s+(.*)/));
        resp1.on("end", function () {
            var req2 = client.request("GET", "/test/logout", { "host": "127.0.0.1", "cookie": cookie });
            req2.on("response", function (resp2) {
                resp2.setEncoding("utf8");
                test.equal(resp2.statusCode, 200);
                test.equal(resp2.headers["content-type"], "text/plain");
                resp2.on("data", function (body) {
                    test.ok(body);
                    test.ok(body.indexOf("content") >= 0)
                });
                resp2.on("end", function () {
                    var req3 = client.request("GET", "/test/secured", { "host": "127.0.0.1", "cookie": cookie });
                    req3.on("response", function (resp3) {
                        resp3.setEncoding("utf8");
                        test.equal(resp3.statusCode, 401);
                        test.ok(resp3.headers["www-authenticate"]);
                        test.ok(resp3.headers["www-authenticate"].match(/^Digest\s+(.*)/));
                        resp3.on("end", function () {
                            test.done();
                        });
                    });
                    req3.end();
                });
            });
            req2.end();
        });
    });
    req1.end();
};

module.exports["Test shutdown server (Digest)"] = function(test) {
    test.ok(nserver);
    nserver.shutdown();
    test.done();
};

