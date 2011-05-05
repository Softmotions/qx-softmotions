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
    basicString: {
        type: "sm.nsrv.auth.BasicAuthFilter",
        options: {
            realmName: "NKServerTest"
        }
    },
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
    },
    form: {
        type: sm.nsrv.auth.FormAuthFilter,
        options: {
            formUrl: "/test/login"
        }
    },
    form2: {
        type: sm.nsrv.auth.FormAuthFilter,
        options: {
            formUrl: "/test/login",
            rememberMe: {
                cookieName: "_remember_cookie_"
            }
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
                            securityKey: "general",
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

var resources = [
    {resource: "/test/roles/a", roles: ['a']},
    {resource: "/test/roles/b", roles: ['b']},
    {resource: "/test/roles/c", roles: ['c']},
    {resource: "/test/roles/d", roles: ['a', 'b']},
    {resource: "/test/roles/e", roles: []}
];

var users = [
    {auth: "dGVzdDp0ZXN0", login: "test", password: "test", roles: ['a']},
    {auth: "dGVzdDI6dGVzdA==", login: "test2", password: "test", roles: ['b']},
    {auth: "dGVzdDM6dGVzdA==", login: "test3", password: "test", roles: ['c', 'a']},
    {auth: "dGVzdDQ6dGVzdA==", login: "test4", password: "test", roles: ['b', 'c', 'a']},
    {auth: "dGVzdDU6dGVzdA==", login: "test5", password: "test", roles: ['f', 'b', 'c', 'a']}
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

var copycookies = function(header, only) {
    var cookie = "";
    only = only || [];
    if (qx.lang.Type.isString(only)) {
        only = [only];
    }
    header.forEach(function(item) {
        var cdata = item.split(';')[0];
        if (only.length < 1 || only.some(function(test){return cdata.indexOf(test) == 0})) {
            cookie += cdata + "; "
        }
    });

    return cookie;
};

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
        test.equal(resp.headers["www-authenticate"], "Basic realm=\"" + auth.basic.options.realmName + "\"");
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
        test.equal(resp.headers["www-authenticate"], "Basic realm=\"" + auth.basic.options.realmName + "\"");
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
                test.equal(resp2.headers["www-authenticate"], "Basic realm=\"" + auth.basic.options.realmName + "\"");
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
            cookie = copycookies(resp1.headers["set-cookie"]);
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

var buildBasicRolesTests = function(resources, users) {
    resources.forEach(function(resource) {
        users.forEach(function(user) {
            var access = resource.roles.every(function(role) {
                return user.roles.some(function(userRole) {
                    return role == userRole;
                });
            });

            var name = "Test access resource: " +
                       "required roles [" + resource.roles.join(", ") + "], " +
                       "user roles: [" + user.roles.join(", ") + "], " +
                       "access: " + access;

            module.exports[name + " (Basic)"] = function(test) {
                var client = http.createClient(port, "127.0.0.1");
                var req = client.request("GET", resource.resource, { "host": "127.0.0.1", "Authorization": "Basic " + user.auth });
                req.on("response", function (resp) {
                    resp.setEncoding("utf8");
                    if (access) {
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
    });
};

buildBasicRolesTests(resources, users);

module.exports["Test logout after auth (Basic)"] = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req1 = client.request("GET", "/test/secured", { "host": "127.0.0.1", "Authorization": "Basic dGVzdDp0ZXN0" });
    req1.on("response", function (resp1) {
        resp1.setEncoding("utf8");
        test.equal(resp1.statusCode, 200);
        var cookie = "";
        test.ok(resp1.headers["set-cookie"]);
        if (resp1.headers["set-cookie"]) {
            cookie = copycookies(resp1.headers["set-cookie"]);
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
                                test.equal(resp4.headers["www-authenticate"], "Basic realm=\"" + auth.basic.options.realmName + "\"");
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
        test.equal(resp1.headers["www-authenticate"], "Basic realm=\"" + auth.basic.options.realmName + "\"");
        var cookie = "";
        test.ok(resp1.headers["set-cookie"]);
        if (resp1.headers["set-cookie"]) {
            cookie = copycookies(resp1.headers["set-cookie"]);
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
                        test.equal(resp3.headers["www-authenticate"], "Basic realm=\"" + auth.basic.options.realmName + "\"");
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
            test.equal(authreq.realm, auth.digest.options.realmName);
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

module.exports["Test secured resource: single request with bad auth (Digest)"] = function(test) {
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
                test.equal(authreq.realm, auth.digest.options.realmName);
                test.ok(authreq.nonce);
                test.equal(authreq.qop, "auth");
                test.ok(authreq.opaque);

                var dauth = generateDigestAuth(authreq, "/test/secured", "test", "test2");

                var req2 = client.request("GET", "/test/secured", {"host": "127.0.0.1", "Authorization": dauth});
                req2.on("response", function (resp2) {
                    resp2.setEncoding("utf8");
                    test.equal(resp2.statusCode, 401);
                    test.ok(resp2.headers["www-authenticate"]);
                    var match = resp2.headers["www-authenticate"].match(/^Digest\s+(.*)/);
                    test.ok(match);
                    if (match) {
                        var authreq = parseDigestHeaderString(match[1]);
                        test.equal(authreq.realm, auth.digest.options.realmName);
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

module.exports["Test secured resource: single request with auth (Digest)"] = function(test) {
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
                test.equal(authreq.realm, auth.digest.options.realmName);
                test.ok(authreq.nonce);
                test.equal(authreq.qop, "auth");
                test.ok(authreq.opaque);

                var dauth = generateDigestAuth(authreq, "/test/secured", "test", "test");

                var req2 = client.request("GET", "/test/secured", {"host": "127.0.0.1", "Authorization": dauth});
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
                test.equal(authreq.realm, auth.digest.options.realmName);
                test.ok(authreq.nonce);
                test.equal(authreq.qop, "auth");
                test.ok(authreq.opaque);

                var dauth = generateDigestAuth(authreq, "/test/secured", "test", "test");

                var req2 = client.request("GET", "/test/secured", {"host": "127.0.0.1", "Authorization": dauth});
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
            cookie = copycookies(resp1.headers["set-cookie"]);
        }
        test.ok(resp1.headers["www-authenticate"]);
        var match = resp1.headers["www-authenticate"].match(/^Digest\s+(.*)/);
        test.ok(match);
        resp1.on("end", function () {
            if (match) {
                var authreq = parseDigestHeaderString(match[1]);
                test.equal(authreq.realm, auth.digest.options.realmName);
                test.ok(authreq.nonce);
                test.equal(authreq.qop, "auth");
                test.ok(authreq.opaque);

                var dauth = generateDigestAuth(authreq, "/test/secured", "test", "test");

                var req2 = client.request("GET", "/test/secured", {"host": "127.0.0.1", "cookie": cookie, "Authorization": dauth});
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

var buildDigestRolesTests = function(resources, users) {
    resources.forEach(function(resource) {
        users.forEach(function(user) {
            var access = resource.roles.every(function(role) {
                return user.roles.some(function(userRole) {
                    return role == userRole;
                });
            });

            var name = "Test access resource: " +
                       "required roles [" + resource.roles.join(", ") + "], " +
                       "user roles: [" + user.roles.join(", ") + "], " +
                       "access: " + access;

            module.exports[name + " (Digest)"] = function(test) {
                var client = http.createClient(port, "127.0.0.1");
                var req1 = client.request("GET", resource.resource, { "host": "127.0.0.1"});
                req1.on("response", function (resp1) {
                    resp1.setEncoding("utf8");
                    test.equal(resp1.statusCode, 401);
                    test.ok(resp1.headers["www-authenticate"]);
                    var match = resp1.headers["www-authenticate"].match(/^Digest\s+(.*)/);
                    test.ok(match);
                    resp1.on("end", function () {
                        if (match) {
                            var authreq = parseDigestHeaderString(match[1]);
                            test.equal(authreq.realm, auth.digest.options.realmName);
                            test.ok(authreq.nonce);
                            test.equal(authreq.qop, "auth");
                            test.ok(authreq.opaque);

                            var dauth = generateDigestAuth(authreq, resource.resource, user.login, user.password);

                            var req2 = client.request("GET", resource.resource, {"host": "127.0.0.1", "Authorization": dauth});
                            req2.on("response", function (resp2) {
                                resp2.setEncoding("utf8");
                                if (access) {
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
    });
};


buildDigestRolesTests(resources, users);

module.exports["Test logout after auth (Digest)"] = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req1 = client.request("GET", "/test/secured", { "host": "127.0.0.1" });
    req1.on("response", function (resp1) {
        resp1.setEncoding("utf8");
        test.equal(resp1.statusCode, 401);
        var cookie = "";
        test.ok(resp1.headers["set-cookie"]);
        if (resp1.headers["set-cookie"]) {
            cookie = copycookies(resp1.headers["set-cookie"]);
        }
        test.ok(resp1.headers["www-authenticate"]);
        var match = resp1.headers["www-authenticate"].match(/^Digest\s+(.*)/);
        test.ok(match);
        resp1.on("end", function () {
            if (match) {
                var authreq = parseDigestHeaderString(match[1]);
                test.equal(authreq.realm, auth.digest.options.realmName);
                test.ok(authreq.nonce);
                test.equal(authreq.qop, "auth");
                test.ok(authreq.opaque);

                var dauth = generateDigestAuth(authreq, "/test/secured", "test", "test");

                var req2 = client.request("GET", "/test/secured", {"host": "127.0.0.1", "cookie": cookie, "Authorization": dauth});
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
            cookie = copycookies(resp1.headers["set-cookie"]);
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


// FORM AUTH tests

module.exports["Test startup server (Form)"] = function(test) {
    config[0].webapps[0].security.auth = auth.form;
    config[0].webapps[0].security.securityKey = "form";
    nserver = new sm.nsrv.NKServer(config);
    nserver.startup(port, "127.0.0.1");
    test.done();
};

module.exports["Test unsecured resource: single request without auth (Form)"] = function(test) {
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

module.exports["Test login form: single request without auth (Form)"] = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req = client.request("GET", "/test/login", {"host": "127.0.0.1"});
    req.on("response", function (resp) {
        resp.setEncoding("utf8");
        test.equal(resp.statusCode, 200);
        test.equal(resp.headers["content-type"], "text/plain");
        resp.on("data", function (body) {
            test.ok(body);
            test.ok(body.indexOf("loginform") >= 0)
        });
        resp.on("end", function () {
            test.done();
        });
    });
    req.end();
};

module.exports["Test login form: single request with auth (Form)"] = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req = client.request("GET", "/test/login?action=login&login=test&password=test", {"host": "127.0.0.1"});
    req.on("response", function (resp) {
        resp.setEncoding("utf8");
        test.equal(resp.statusCode, 200);
        test.equal(resp.headers["content-type"], "text/plain");
        resp.on("data", function (body) {
            test.ok(body);
            test.ok(body.indexOf("loginform") >= 0)
        });
        resp.on("end", function () {
            test.done();
        });
    });
    req.end();
};

module.exports["Test login form: request secured resource after request login form without auth (Form)"] = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req1 = client.request("GET", "/test/login", {"host": "127.0.0.1"});
    req1.on("response", function (resp1) {
        resp1.setEncoding("utf8");
        test.equal(resp1.statusCode, 200);
        var cookie = "";
        test.ok(resp1.headers["set-cookie"]);
        if (resp1.headers["set-cookie"]) {
            cookie = copycookies(resp1.headers["set-cookie"]);
        }
        test.equal(resp1.headers["content-type"], "text/plain");
        resp1.on("data", function (body) {
            test.ok(body);
            test.ok(body.indexOf("loginform") >= 0)
        });
        resp1.on("end", function () {
            var req2 = client.request("GET", "/test/secured", { "host": "127.0.0.1", "cookie": cookie });
            req2.on("response", function (resp2) {
                resp2.setEncoding("utf8");
                test.equal(resp2.statusCode, 302);
                test.equal(resp2.headers["location"], auth.form.options.formUrl);
                resp2.on("end", function () {
                    test.done();
                });
            });
            req2.end();
        });
    });
    req1.end();
};

module.exports["Test login form: request secured resource after request login form with auth (Form)"] = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req1 = client.request("GET", "/test/login?action=login&login=test&password=test", {"host": "127.0.0.1"});
    req1.on("response", function (resp1) {
        resp1.setEncoding("utf8");
        test.equal(resp1.statusCode, 200);
        var cookie = "";
        test.ok(resp1.headers["set-cookie"]);
        if (resp1.headers["set-cookie"]) {
            cookie = copycookies(resp1.headers["set-cookie"]);
        }
        test.equal(resp1.headers["content-type"], "text/plain");
        resp1.on("data", function (body) {
            test.ok(body);
            test.ok(body.indexOf("loginform") >= 0)
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

module.exports["Test secured resource: single request without auth (Form)"] = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req = client.request("GET", "/test/secured", {"host": "127.0.0.1"});
    req.on("response", function (resp) {
        resp.setEncoding("utf8");
        test.equal(resp.statusCode, 302);
        test.equal(resp.headers["location"], auth.form.options.formUrl);
        resp.on("end", function () {
            test.done();
        });
    });
    req.end();
};

module.exports["Test secured resource: single request with bad auth (Form)"] = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req = client.request("GET", "/test/secured?action=login&login=test", {"host": "127.0.0.1"});
    req.on("response", function (resp) {
        resp.setEncoding("utf8");
        test.equal(resp.statusCode, 302);
        test.equal(resp.headers["location"], auth.form.options.formUrl);
        resp.on("end", function () {
            test.done();
        });
    });
    req.end();
};

module.exports["Test secured resource: single GET request with auth (Form)"] = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req = client.request("GET", "/test/secured?action=login&login=test&password=test", {"host": "127.0.0.1"});
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

module.exports["Test secured resource: single POST request with auth  (Form)"] = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req = client.request("POST", "/test/secured", {"host": "127.0.0.1", "content-type": "application/x-www-form-urlencoded"});
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
    req.write("action=login&login=test&password=test");
    req.end();
};

module.exports["Test secured resource: single combined request with auth  (Form)"] = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req = client.request("POST", "/test/secured?action=login", {"host": "127.0.0.1", "content-type": "application/x-www-form-urlencoded"});
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
    req.write("login=test&password=test");
    req.end();
};

module.exports["Test secured resource: double request with auth, but without cookie (Form)"] = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req1 = client.request("GET", "/test/secured?action=login&login=test&password=test", { "host": "127.0.0.1" });
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
                test.equal(resp2.statusCode, 302);
                test.equal(resp2.headers["location"], auth.form.options.formUrl);
                resp2.on("end", function () {
                    test.done();
                });
            });
            req2.end();
        });
    });
    req1.end();
};

module.exports["Test secured resource: double request with auth and with cookie (Form)"] = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req1 = client.request("GET", "/test/secured?action=login&login=test&password=test", { "host": "127.0.0.1" });
    req1.on("response", function (resp1) {
        resp1.setEncoding("utf8");
        test.equal(resp1.statusCode, 200);
        var cookie = "";
        test.ok(resp1.headers["set-cookie"]);
        if (resp1.headers["set-cookie"]) {
            cookie = copycookies(resp1.headers["set-cookie"]);
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

var buildFormRolesTests = function(method, resources, users) {
    resources.forEach(function(resource) {
        users.forEach(function(user) {
            var access = resource.roles.every(function(role) {
                return user.roles.some(function(userRole) {
                    return role == userRole;
                });
            });

            var name = "Test access resource: " +
                       "method: '" + method + "', " +
                       "required roles [" + resource.roles.join(", ") + "], " +
                       "user roles: [" + user.roles.join(", ") + "], " +
                       "access: " + access;

            var headers = {"host": "127.0.0.1"};
            var data = "";
            var url = resource.resource;
            if (method === "POST") {
                headers["content-type"] = "application/x-www-form-urlencoded";
                data += "action=login&login=" + user.login + "&password=" + user.password;
            } else if (method === "GET") {
                url += "?" + "action=login&login=" + user.login + "&password=" + user.password;
            }
            headers["content-length"] = data.length;

            module.exports[name + " (Form)"] = function(test) {
                var client = http.createClient(port, "127.0.0.1");
                var req = client.request(method, url, headers);
                req.on("response", function (resp) {
                    resp.setEncoding("utf8");
                    if (access) {
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
                req.write(data);
                req.end();
            }

        });
    });
};

buildFormRolesTests("GET", resources, users);
buildFormRolesTests("POST", resources, users);

module.exports["Test logout after auth (Form)"] = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req1 = client.request("GET", "/test/secured?action=login&login=test&password=test", { "host": "127.0.0.1" });
    req1.on("response", function (resp1) {
        resp1.setEncoding("utf8");
        test.equal(resp1.statusCode, 200);
        var cookie = "";
        test.ok(resp1.headers["set-cookie"]);
        if (resp1.headers["set-cookie"]) {
            cookie = copycookies(resp1.headers["set-cookie"]);
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
                                test.equal(resp4.statusCode, 302);
                                test.equal(resp4.headers["location"], auth.form.options.formUrl);
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

module.exports["Test logout without auth (Form)"] = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req1 = client.request("GET", "/test/secured", { "host": "127.0.0.1" });
    req1.on("response", function (resp1) {
        resp1.setEncoding("utf8");
        test.equal(resp1.statusCode, 302);
        test.equal(resp1.headers["location"], auth.form.options.formUrl);
        var cookie = "";
        test.ok(resp1.headers["set-cookie"]);
        if (resp1.headers["set-cookie"]) {
            cookie = copycookies(resp1.headers["set-cookie"]);
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
                        test.equal(resp3.statusCode, 302);
                        test.equal(resp3.headers["location"], auth.form.options.formUrl);
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

module.exports["Test shutdown server (Form)"] = function(test) {
    test.ok(nserver);
    nserver.shutdown();
    test.done();
};


// FORM WITH REMEMBER AUTH tests

module.exports["Test startup server (Form with remember)"] = function(test) {
    config[0].webapps[0].security.auth = auth.form2;
    config[0].webapps[0].security.securityKey = "form2";
    nserver = new sm.nsrv.NKServer(config);
    nserver.startup(port, "127.0.0.1");
    test.done();
};

module.exports["Test unsecured resource: single request without auth (Form with remember)"] = function(test) {
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

module.exports["Test login form: single request without auth (Form with remember)"] = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req = client.request("GET", "/test/login", {"host": "127.0.0.1"});
    req.on("response", function (resp) {
        resp.setEncoding("utf8");
        test.equal(resp.statusCode, 200);
        test.equal(resp.headers["content-type"], "text/plain");
        resp.on("data", function (body) {
            test.ok(body);
            test.ok(body.indexOf("loginform") >= 0)
        });
        resp.on("end", function () {
            test.done();
        });
    });
    req.end();
};

module.exports["Test login form: single request with auth (Form with remember)"] = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req = client.request("GET", "/test/login?action=login&login=test&password=test", {"host": "127.0.0.1"});
    req.on("response", function (resp) {
        resp.setEncoding("utf8");
        test.equal(resp.statusCode, 200);
        test.equal(resp.headers["content-type"], "text/plain");
        resp.on("data", function (body) {
            test.ok(body);
            test.ok(body.indexOf("loginform") >= 0)
        });
        resp.on("end", function () {
            test.done();
        });
    });
    req.end();
};

module.exports["Test login form: single request with remember-auth (Form with remember)"] = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req = client.request("GET", "/test/login?action=login&login=test&password=test&rememberMe=true", {"host": "127.0.0.1"});
    req.on("response", function (resp) {
        resp.setEncoding("utf8");
        test.equal(resp.statusCode, 200);
        test.equal(resp.headers["content-type"], "text/plain");
        resp.on("data", function (body) {
            test.ok(body);
            test.ok(body.indexOf("loginform") >= 0)
        });
        resp.on("end", function () {
            test.done();
        });
    });
    req.end();
};

module.exports["Test login form: request secured resource after request login form without auth (Form with remember)"] = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req1 = client.request("GET", "/test/login", {"host": "127.0.0.1"});
    req1.on("response", function (resp1) {
        resp1.setEncoding("utf8");
        test.equal(resp1.statusCode, 200);
        var cookie = "";
        test.ok(resp1.headers["set-cookie"]);
        if (resp1.headers["set-cookie"]) {
            cookie = copycookies(resp1.headers["set-cookie"]);
        }
        test.equal(resp1.headers["content-type"], "text/plain");
        resp1.on("data", function (body) {
            test.ok(body);
            test.ok(body.indexOf("loginform") >= 0)
        });
        resp1.on("end", function () {
            var req2 = client.request("GET", "/test/secured", { "host": "127.0.0.1", "cookie": cookie });
            req2.on("response", function (resp2) {
                resp2.setEncoding("utf8");
                test.equal(resp2.statusCode, 302);
                test.equal(resp2.headers["location"], auth.form2.options.formUrl);
                resp2.on("end", function () {
                    test.done();
                });
            });
            req2.end();
        });
    });
    req1.end();
};

module.exports["Test login form: request secured resource after request login form with auth (Form with remember)"] = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req1 = client.request("GET", "/test/login?action=login&login=test&password=test", {"host": "127.0.0.1"});
    req1.on("response", function (resp1) {
        resp1.setEncoding("utf8");
        test.equal(resp1.statusCode, 200);
        var cookie = "";
        test.ok(resp1.headers["set-cookie"]);
        if (resp1.headers["set-cookie"]) {
            cookie = copycookies(resp1.headers["set-cookie"], ["connect.sid"]);
        }
        test.equal(resp1.headers["content-type"], "text/plain");
        resp1.on("data", function (body) {
            test.ok(body);
            test.ok(body.indexOf("loginform") >= 0)
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

module.exports["Test login form: request secured resource after request login form with remember-auth (Form with remember)"] = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req1 = client.request("GET", "/test/login?action=login&login=test&password=test", {"host": "127.0.0.1"});
    req1.on("response", function (resp1) {
        resp1.setEncoding("utf8");
        test.equal(resp1.statusCode, 200);
        var cookie = "";
        test.ok(resp1.headers["set-cookie"]);
        if (resp1.headers["set-cookie"]) {
            cookie = copycookies(resp1.headers["set-cookie"], ["connect.sid"]);
        }
        test.equal(resp1.headers["content-type"], "text/plain");
        resp1.on("data", function (body) {
            test.ok(body);
            test.ok(body.indexOf("loginform") >= 0)
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

module.exports["Test secured resource: single request without auth (Form with remember)"] = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req = client.request("GET", "/test/secured", {"host": "127.0.0.1"});
    req.on("response", function (resp) {
        resp.setEncoding("utf8");
        test.equal(resp.statusCode, 302);
        test.equal(resp.headers["location"], auth.form2.options.formUrl);
        resp.on("end", function () {
            test.done();
        });
    });
    req.end();
};

module.exports["Test secured resource: single request with bad auth (Form with remember)"] = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req = client.request("GET", "/test/secured?action=login&login=test", {"host": "127.0.0.1"});
    req.on("response", function (resp) {
        resp.setEncoding("utf8");
        test.equal(resp.statusCode, 302);
        test.equal(resp.headers["location"], auth.form2.options.formUrl);
        resp.on("end", function () {
            test.done();
        });
    });
    req.end();
};

module.exports["Test secured resource: single GET request with auth (Form with remember)"] = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req = client.request("GET", "/test/secured?action=login&login=test&password=test", {"host": "127.0.0.1"});
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

module.exports["Test secured resource: single POST request with auth  (Form with remember)"] = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req = client.request("POST", "/test/secured", {"host": "127.0.0.1", "content-type": "application/x-www-form-urlencoded"});
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
    req.write("action=login&login=test&password=test");
    req.end();
};

module.exports["Test secured resource: single combined request with auth (Form with remember)"] = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req = client.request("POST", "/test/secured?action=login", {"host": "127.0.0.1", "content-type": "application/x-www-form-urlencoded"});
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
    req.write("login=test&password=test");
    req.end();
};

module.exports["Test secured resource: single GET request with remember-auth (Form with remember)"] = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req = client.request("GET", "/test/secured?action=login&login=test&password=test&rememberMe=true", {"host": "127.0.0.1"});
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

module.exports["Test secured resource: double request with auth, but without cookie (Form with remember)"] = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req1 = client.request("GET", "/test/secured?action=login&login=test&password=test", { "host": "127.0.0.1" });
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
                test.equal(resp2.statusCode, 302);
                test.equal(resp2.headers["location"], auth.form2.options.formUrl);
                resp2.on("end", function () {
                    test.done();
                });
            });
            req2.end();
        });
    });
    req1.end();
};

module.exports["Test secured resource: double request with remember-auth, but without cookie (Form with remember)"] = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req1 = client.request("GET", "/test/secured?action=login&login=test&password=test&rememberMe=true", { "host": "127.0.0.1" });
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
                test.equal(resp2.statusCode, 302);
                test.equal(resp2.headers["location"], auth.form2.options.formUrl);
                resp2.on("end", function () {
                    test.done();
                });
            });
            req2.end();
        });
    });
    req1.end();
};

module.exports["Test secured resource: double request with auth and with cookies (Form with remember)"] = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req1 = client.request("GET", "/test/secured?action=login&login=test&password=test", { "host": "127.0.0.1" });
    req1.on("response", function (resp1) {
        resp1.setEncoding("utf8");
        test.equal(resp1.statusCode, 200);
        var cookie = "";
        test.ok(resp1.headers["set-cookie"]);
        if (resp1.headers["set-cookie"]) {
            cookie = copycookies(resp1.headers["set-cookie"]);
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

module.exports["Test secured resource: double request with remember-auth and with only session cookie (Form with remember)"] = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req1 = client.request("GET", "/test/secured?action=login&login=test&password=test&rememberMe=true", { "host": "127.0.0.1" });
    req1.on("response", function (resp1) {
        resp1.setEncoding("utf8");
        test.equal(resp1.statusCode, 200);
        var cookie = "";
        test.ok(resp1.headers["set-cookie"]);
        if (resp1.headers["set-cookie"]) {
            cookie = copycookies(resp1.headers["set-cookie"], ["connect.sid"]);
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

module.exports["Test secured resource: double request with remember-auth and with only remember cookie (Form with remember)"] = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req1 = client.request("GET", "/test/secured?action=login&login=test&password=test&rememberMe=true", { "host": "127.0.0.1" });
    req1.on("response", function (resp1) {
        resp1.setEncoding("utf8");
        test.equal(resp1.statusCode, 200);
        var cookie = "";
        test.ok(resp1.headers["set-cookie"]);
        if (resp1.headers["set-cookie"]) {
            cookie = copycookies(resp1.headers["set-cookie"], auth.form2.options.rememberMe.cookieName);
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

var buildForm2RolesTests = function(resources, users) {
    users.forEach(function(user) {
        var cookie = "";
        module.exports["Test access resource: prepare remember cookie for user: " + user.login + " (Form with remember)"] = function(test) {
            var client = http.createClient(port, "127.0.0.1");
            var req1 = client.request("GET", "/test/secured?" + "action=login&login=" + user.login + "&password=" + user.password + "&rememberMe=true",
                                      { "host": "127.0.0.1" });
            req1.on("response", function (resp1) {
                resp1.setEncoding("utf8");
                test.equal(resp1.statusCode, 200);
                test.ok(resp1.headers["set-cookie"]);
                if (resp1.headers["set-cookie"]) {
                    cookie = copycookies(resp1.headers["set-cookie"], auth.form2.options.rememberMe.cookieName);
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

        resources.forEach(function(resource) {
            var access = resource.roles.every(function(role) {
                return user.roles.some(function(userRole) {
                    return role == userRole;
                });
            });

            var name = "Test access resource: " +
                       "user roles: [" + user.roles.join(", ") + "], " +
                       "required roles [" + resource.roles.join(", ") + "], " +
                       "access: " + access;

            module.exports[name + " (Form with remember)"] = function(test) {
                var client = http.createClient(port, "127.0.0.1");
                var req = client.request("GET", resource.resource, {"host": "127.0.0.1", "cookie": cookie});
                req.on("response", function (resp) {
                    resp.setEncoding("utf8");
                    if (access) {
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
    });
};

buildForm2RolesTests(resources, users);

module.exports["Test logout after auth with only session cookie (Form with remember)"] = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req1 = client.request("GET", "/test/secured?action=login&login=test&password=test", { "host": "127.0.0.1" });
    req1.on("response", function (resp1) {
        resp1.setEncoding("utf8");
        test.equal(resp1.statusCode, 200);
        var cookie = "";
        test.ok(resp1.headers["set-cookie"]);
        if (resp1.headers["set-cookie"]) {
            cookie = copycookies(resp1.headers["set-cookie"], ["connect.sid"]);
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
                                test.equal(resp4.statusCode, 302);
                                test.equal(resp4.headers["content-type"], "text/plain");
                                test.equal(resp4.headers["location"], auth.form2.options.formUrl);
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

module.exports["Test logout after remember-auth with only session cookie (Form with remember)"] = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req1 = client.request("GET", "/test/secured?action=login&login=test&password=test&rememberMe=true", { "host": "127.0.0.1" });
    req1.on("response", function (resp1) {
        resp1.setEncoding("utf8");
        test.equal(resp1.statusCode, 200);
        var cookie = "";
        test.ok(resp1.headers["set-cookie"]);
        if (resp1.headers["set-cookie"]) {
            cookie = copycookies(resp1.headers["set-cookie"], ["connect.sid"]);
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
                        test.ok(resp3.headers["set-cookie"]);
                        resp3.on("data", function (body) {
                            test.ok(body);
                            test.ok(body.indexOf("content") >= 0)
                        });
                        resp3.on("end", function () {
                            var req4 = client.request("GET", "/test/secured", { "host": "127.0.0.1", "cookie": cookie });
                            req4.on("response", function (resp4) {
                                resp4.setEncoding("utf8");
                                test.equal(resp4.statusCode, 302);
                                test.equal(resp4.headers["content-type"], "text/plain");
                                test.equal(resp4.headers["location"], auth.form2.options.formUrl);
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

module.exports["Test logout after remember-auth with cookies (Form with remember)"] = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req1 = client.request("GET", "/test/secured?action=login&login=test&password=test&rememberMe=true", { "host": "127.0.0.1" });
    req1.on("response", function (resp1) {
        resp1.setEncoding("utf8");
        test.equal(resp1.statusCode, 200);
        var cookie = "";
        test.ok(resp1.headers["set-cookie"]);
        if (resp1.headers["set-cookie"]) {
            cookie = copycookies(resp1.headers["set-cookie"], ["connect.sid"]);
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
                        test.ok(resp3.headers["set-cookie"]);
                        if (resp3.headers["set-cookie"]) {
                            cookie = copycookies(resp3.headers["set-cookie"], ["connect.sid"]);
                        }
                        resp3.on("data", function (body) {
                            test.ok(body);
                            test.ok(body.indexOf("content") >= 0)
                        });
                        resp3.on("end", function () {
                            var req4 = client.request("GET", "/test/secured", { "host": "127.0.0.1", "cookie": cookie });
                            req4.on("response", function (resp4) {
                                resp4.setEncoding("utf8");
                                test.equal(resp4.statusCode, 302);
                                test.equal(resp4.headers["content-type"], "text/plain");
                                test.equal(resp4.headers["location"], auth.form2.options.formUrl);
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

module.exports["Test logout without auth with cookie (Form with remember)"] = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req1 = client.request("GET", "/test/secured", { "host": "127.0.0.1" });
    req1.on("response", function (resp1) {
        resp1.setEncoding("utf8");
        test.equal(resp1.statusCode, 302);
        test.equal(resp1.headers["location"], auth.form2.options.formUrl);
        var cookie = "";
        test.ok(resp1.headers["set-cookie"]);
        if (resp1.headers["set-cookie"]) {
            cookie = copycookies(resp1.headers["set-cookie"]);
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
                        test.equal(resp3.statusCode, 302);
                        test.equal(resp3.headers["location"], auth.form2.options.formUrl);
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

module.exports["Test shutdown server (Form with remember)"] = function(test) {
    test.ok(nserver);
    nserver.shutdown();
    test.done();
};

// tests with string value of auth filter type in config

module.exports["Test startup server with string value of auth filter (Basic)"] = function(test) {
    config[0].webapps[0].security.auth = auth.basicString;
    config[0].webapps[0].security.securityKey = "basicString";
    nserver = new sm.nsrv.NKServer(config);
    nserver.startup(port, "127.0.0.1");
    test.done();
};

module.exports["Test shutdown server with string value of auth filter (Basic)"] = function(test) {
    test.ok(nserver);
    nserver.shutdown();
    test.done();
};

// tests with string value of auth filter and user provider types in config

module.exports["Test startup server with string value of auth filter and user provider (Basic)"] = function(test) {
    config[0].webapps[0].security.auth = auth.basicString;
    config[0].webapps[0].security.userProvider.type = "sm.nsrv.auth.InMemoryUserProvider";
    config[0].webapps[0].security.securityKey = "basicString";
    nserver = new sm.nsrv.NKServer(config);
    nserver.startup(port, "127.0.0.1");
    test.done();
};

module.exports["Test shutdown server with string value of auth filter and user provider (Basic)"] = function(test) {
    test.ok(nserver);
    nserver.shutdown();
    test.done();
};
