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


var config =
  [
      //virtual hosts
      {
          vhost : "127.0.0.1",
          defaultWebapp : "test",
          webapps : [
              {
                  id : "test",
                  context : "/test",
                  docRoot : cwd + "/nksrv/webapps/test1",
                  handlerDefaults : {
                      methods : ["GET", "POST"]
                  }
              },
              {
                  id : "test12",
                  context : "/test12",
                  docRoot : cwd + "/nksrv/webapps/test1",
                  handlerDefaults : {
                      methods : ["GET", "POST"]
                  }
              },

              {
                  id : "jazz",
                  context : "/jazz",
                  docRoot : cwd + "/nksrv/webapps/jazz"
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
      },

      {
          vhost : "localhost",
          defaultWebapp : "test2",
          webapps : [
              {
                  id : "test2",
                  context : "/test2",
                  docRoot : cwd + "/nksrv/webapps/test1"
              }
          ],
          errorOptions : {
              showErrorMsg : true,
              messagesInHeaders : true
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


module.exports.testStart = function(test) {
    nserver = new sm.nsrv.NKServer(config);
    nserver.startup(port, "127.0.0.1");
    test.done();
};

module.exports.testSimpleRequest = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req = client.request("GET", "/test/sayHello",
      {"host": "127.0.0.1"});
    req.on("response", function (resp) {
        resp.setEncoding("utf8");
        test.equal(resp.statusCode, 200);
        test.equal(resp.headers["content-type"], "text/plain");
        resp.on("data", function (body) {
            test.ok(body);
            test.ok(body.indexOf("c614033f3d2348cead259f79366d3b79") > 0)
        });
        resp.on("end", function () {
            test.done();
        });
    });
    req.end();
};

module.exports.testSimpleRequest2 = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req = client.request("GET", "/test/sayHello3",
      {"host": "127.0.0.1"});
    req.on("response", function (resp) {
        resp.setEncoding("utf8");
        test.equal(resp.statusCode, 200);
        test.equal(resp.headers["content-type"], "text/plain");
        resp.on("data", function (body) {
            test.ok(body);
            test.ok(body.indexOf("c614033f3d2348cead259f79366d3b79") > 0)
        });
        resp.on("end", function () {
            test.done();
        });
    });
    req.end();
};

module.exports.testVHostNotFound = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req = client.request("GET", "/test/sayHello",
      {"host": "localhost"});
    req.on("response", function (resp) {
        resp.setEncoding("utf8");
        test.equal(resp.statusCode, 404);
        test.equal(resp.headers["content-type"], "text/plain");
        resp.on("data", function (body) {
        });
        resp.on("end", function () {
            test.done();
        });
    });
    req.end();
};

module.exports.testVHostNotFound2 = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req = client.request("GET", "/test2/sayHello",
      {"host": "127.0.0.1"});
    req.on("response", function (resp) {
        resp.setEncoding("utf8");
        test.equal(resp.statusCode, 404);
        test.equal(resp.headers["content-type"], "text/plain");
        resp.on("data", function (body) {
        });
        resp.on("end", function () {
            test.done();
        });
    });
    req.end();
};

module.exports.testVHost2 = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req = client.request("GET", "/test2/sayHello",
      {"host": "localhost"});
    req.on("response", function (resp) {
        resp.setEncoding("utf8");
        test.equal(resp.statusCode, 200);
        test.equal(resp.headers["content-type"], "text/plain");
        resp.on("data", function (body) {
            test.ok(body);
            test.ok(body.indexOf("c614033f3d2348cead259f79366d3b79") > 0)
        });
        resp.on("end", function () {
            test.done();
        });
    });
    req.end();
};


module.exports.testTerminated = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req = client.request("GET", "/test/sayHelloTerminated",
      {"host": "127.0.0.1"});
    req.on("response", function (resp) {
        resp.setEncoding("utf8");
        test.equal(resp.statusCode, 200);
        test.equal(resp.headers["content-type"], "text/plain");
        resp.on("data", function (body) {
            test.ok(body);
            test.ok(body.indexOf("fc19de52aa91464db407fdec55c2ef34") > 0)
        });
        resp.on("end", function () {
            test.done();
        });
    });
    req.end();
};


module.exports.testJazz = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req = client.request("GET", "/test/sayHelloJazz",
      {"host": "127.0.0.1"});
    req.on("response", function (resp) {
        resp.setEncoding("utf8");
        test.equal(resp.statusCode, 200);
        test.equal(resp.headers["content-type"], "text/html");
        resp.on("data", function (body) {
            test.ok(body);
            test.ok(body.indexOf("c791ad827f0c4fd7a40775f2e6be78ad") > 0)
        });
        resp.on("end", function () {
            test.done();
        });
    });
    req.end();
};


module.exports.testJazzFail = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req = client.request("GET", "/jazz/jzfail.jz",
      {"host": "127.0.0.1"});
    req.on("response", function (resp) {
        resp.setEncoding("utf8");
        test.equal(resp.statusCode, 500);
        resp.on("end", function () {
            test.done();
        });
    });
    req.end();
};
module.exports.testExceptionMsgErr = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req = client.request("GET", "/test/sayHelloExceptionMsgErr",
      {"host": "127.0.0.1"});
    req.on("response", function (resp) {
        resp.setEncoding("utf8");
        test.equal(resp.statusCode, 500);
        test.equal(resp.headers["content-type"], "text/plain");
        test.equal(resp.headers["softmotions-msg-err0"], "2d4d8b9777d04f61bd6db858d451bf58");
        resp.on("data", function (body) {
        });
        resp.on("end", function () {
            test.done();
        });
    });
    req.end();
};

module.exports.testExceptionMsg = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req = client.request("GET", "/test/sayHelloExceptionMsg",
      {"host": "127.0.0.1"});
    req.on("response", function (resp) {
        resp.setEncoding("utf8");
        test.equal(resp.statusCode, 200);
        test.equal(resp.headers["content-type"], "text/plain");
        //qx.log.Logger.warn("headers=" + qx.util.Json.stringify(resp.headers));
        test.equal(resp.headers["softmotions-msg-reg0"], "3a8e5bbf192d4411b3c565950a801827");
        resp.on("data", function (body) {
        });
        resp.on("end", function () {
            test.done();
        });
    });
    req.end();
};


module.exports.testMsg = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req = client.request("GET", "/test/sayHelloMsg",
      {"host": "127.0.0.1"});
    req.on("response", function (resp) {
        resp.setEncoding("utf8");
        test.equal(resp.statusCode, 500);
        test.equal(resp.headers["content-type"], "text/plain");
        test.equal(resp.headers["softmotions-msg-reg0"], "5ed95d81226f44e9b354947c97858a1d");
        test.equal(resp.headers["softmotions-msg-err0"], "4c863c40782848f1857dadaa446b6939");
        test.equal(resp.headers["softmotions-msg-reg1"], "d270951c630245349fae393b3abdf818");
        test.equal(resp.headers["softmotions-msg-err1"], "3dc029e5c667459d849bd44187f0dcd2");
        resp.on("data", function (body) {
        });
        resp.on("end", function () {
            test.done();
        });
    });
    req.end();
};


module.exports.testGetParams = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req = client.request("GET", "/test/getRequestParams?p1=096b5eb190f84d5687795eeafb8dc4e1&p1=f6880b5165c24dd298ad40c29ad994f7&p2=189e6a7c9e6b4f13b0cb5cbe8174a4c9",
      {"host": "127.0.0.1"});
    req.on("response", function (resp) {
        resp.setEncoding("utf8");
        test.equal(resp.statusCode, 200);
        test.equal(resp.headers["content-type"], "text/plain");
        resp.on("data", function (body) {
            test.ok(body.indexOf("p1=096b5eb190f84d5687795eeafb8dc4e1,f6880b5165c24dd298ad40c29ad994f7") >= 0);
            test.ok(body.indexOf("p2=189e6a7c9e6b4f13b0cb5cbe8174a4c9") >= 0);
        });
        resp.on("end", function () {
            test.done();
        });
    });
    req.end();
};


module.exports.testPostParams = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var data = "p1=647fd5149a8541e4a240833b7feea02f&p1=9725bc6748a14d5488ae54760248fd7b&p2=01b3c2272fe94a2f9bb8a21caa9fcef7";
    var req = client.request("POST", "/test/postRequestParams",
      {"host": "127.0.0.1",
          "Content-Type" : "application/x-www-form-urlencoded",
          "Content-Length": data.length});
    req.on("response", function (resp) {
        resp.setEncoding("utf8");
        test.equal(resp.statusCode, 200);
        test.equal(resp.headers["content-type"], "text/plain");
        resp.on("data", function (body) {
            test.ok(body.indexOf("p1=647fd5149a8541e4a240833b7feea02f,9725bc6748a14d5488ae54760248fd7b") >= 0);
            test.ok(body.indexOf("p2=01b3c2272fe94a2f9bb8a21caa9fcef7") >= 0);
        });
        resp.on("end", function () {
            test.done();
        });
    });
    req.write(data);
    req.end();
};

module.exports.testCombinedParams = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var data = "p1=647fd5149a8541e4a240833b7feea02f&p1=9725bc6748a14d5488ae54760248fd7b";
    var req = client.request("POST", "/test/postRequestParams?p2=01b3c2272fe94a2f9bb8a21caa9fcef7",
      {"host": "127.0.0.1",
          "Content-Type" : "application/x-www-form-urlencoded",
          "Content-Length": data.length});
    req.on("response", function (resp) {
        resp.setEncoding("utf8");
        test.equal(resp.statusCode, 200);
        test.equal(resp.headers["content-type"], "text/plain");
        resp.on("data", function (body) {
            test.ok(body.indexOf("p1=647fd5149a8541e4a240833b7feea02f,9725bc6748a14d5488ae54760248fd7b") >= 0);
            test.ok(body.indexOf("p2=01b3c2272fe94a2f9bb8a21caa9fcef7") >= 0);
        });
        resp.on("end", function () {
            test.done();
        });
    });
    req.write(data);
    req.end();
};


module.exports.testJazzInclude = function(test) {

    var client = http.createClient(port, "127.0.0.1");
    var req = client.request("GET", "/jazz/jzInclude",
      {"host": "127.0.0.1"});
    req.on("response", function (resp) {
        resp.setEncoding("utf8");
        test.equal(resp.statusCode, 200);
        resp.on("data", function (body) {
            test.ok(body.indexOf("27b2df36486d4f84ba6bf1146a479225") >= 0);
            test.ok(body.indexOf("e18715b8e2c94ef785b5033f3a2c83c0") >= 0);
        });
        resp.on("end", function () {
            test.done();
        });
    });
    req.end();
};


module.exports.testIRequest = function(test) {

    var client = http.createClient(port, "127.0.0.1");
    var req = client.request("GET", "/jazz/layout1.jz",
      {"host": "127.0.0.1"});
    req.on("response", function (resp) {
        resp.setEncoding("utf8");
        test.equal(resp.statusCode, 200);
        resp.on("data", function (body) {
            test.ok(body.indexOf("4be2bd3ffd3148198dc3a78441829913") >= 0);
            test.ok(body.indexOf("886d31431de242139164b49d7b4d89ef") >= 0);
            test.ok(body.indexOf("b1addcf73646484095e0264db7682598") >= 0);
            test.ok(body.indexOf("fc19de52aa91464db407fdec55c2ef34") >= 0);
            test.ok(body.indexOf("0181869f3ac74d67a98d0385c422a145") >= 0);
            test.equal(resp.headers["softmotions-msg-reg0"], "fcbd66cf179f4d0aa6aff49c55c1653a");
            test.equal(resp.headers["softmotions-msg-reg1"], "89a2e5e561ee4623aa70a53fc21dde48");
            test.equal(resp.headers["softmotions-msg-err0"], "403d89c71a7e4ad886ac4af71057596e");
        });
        resp.on("end", function () {
            test.done();
        });
    });
    req.end();
};


module.exports.testAsm1 = function(test) {

    var client = http.createClient(port, "127.0.0.1");
    var req = client.request("GET", "/jazz/asm/invoke_base.jz",
      {"host": "127.0.0.1"});
    req.on("response", function (resp) {
        resp.setEncoding("utf8");
        test.equal(resp.statusCode, 200);
        resp.on("data", function (body) {
            test.ok(body.indexOf("9c95092379ee4586a9951b436281de11") >= 0);
            test.ok(body.indexOf("title=2ed14b4b2cd64707821f836361259a67") >= 0);
            test.ok(body.indexOf("arg1=957244b210c64aa4ab852c8c1ccadd4f") >= 0);
        });
        resp.on("end", function () {
            test.done();
        });
    });
    req.end();
};


module.exports.testAsmExtends1 = function(test) {

    var client = http.createClient(port, "127.0.0.1");
    var req = client.request("GET", "/jazz/asm/invoke_base_extends.jz",
      {"host": "127.0.0.1"});
    req.on("response", function (resp) {
        resp.setEncoding("utf8");
        test.equal(resp.statusCode, 200);
        resp.on("data", function (body) {
            test.ok(body.indexOf("9c95092379ee4586a9951b436281de11") >= 0);
            test.ok(body.indexOf("title=6cd22fa775f947e8a5daa17f09ba5329") >= 0);
        });
        resp.on("end", function () {
            test.done();
        });
    });
    req.end();
};


module.exports.testAsmExtends2 = function(test) {

    var client = http.createClient(port, "127.0.0.1");
    var req = client.request("GET", "/jazz/asm/invoke_base_extends2.jz",
      {"host": "127.0.0.1"});
    req.on("response", function (resp) {
        resp.setEncoding("utf8");
        test.equal(resp.statusCode, 200);
        resp.on("data", function (body) {
            test.ok(body.indexOf("9c95092379ee4586a9951b436281de11") >= 0);
            test.ok(body.indexOf("title=307862e1ca624500a1893c09d0096ba7") >= 0);
        });
        resp.on("end", function () {
            test.done();
        });
    });
    req.end();
};

module.exports.testAsmRef = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req = client.request("GET", "/jazz/asm/invoke_asmref1.jz",
      {"host": "127.0.0.1"});
    req.on("response", function (resp) {
        resp.setEncoding("utf8");
        test.equal(resp.statusCode, 200);
        resp.on("data", function (body) {
            //from ref1
            test.ok(body.indexOf("ref1=9c95092379ee4586a9951b436281de11") == 0);
            test.ok(body.indexOf("title=2ed14b4b2cd64707821f836361259a67") >= 0);
            test.ok(body.indexOf("arg1=957244b210c64aa4ab852c8c1ccadd4f") >= 0);
            test.ok(body.indexOf("ctxp1=c0b2e5c12951412d8ac19f968ed78575") >= 0);
            test.ok(body.indexOf("ctxp2=c065232c925345a8bfb9d18e0038db42") >= 0);
            //from ref2
            test.ok(body.indexOf("ref2=ref1=9c95092379ee4586a9951b436281de11") >= 0);
            test.ok(body.indexOf("ctxp1=9ab3f67e7a634e49b5096a195ee4d6f6") >= 0);
            test.ok(body.indexOf("ctxp2=d01ab03bc8054a6eb9bc0504139ca813") >= 0);
            //from ref3
            test.ok(body.indexOf("ref3=ref1=9c95092379ee4586a9951b436281de11") >= 0);
        });
        resp.on("end", function () {
            test.done();
        });
    });
    req.end();
};

module.exports.testAsmIreqRef = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req = client.request("GET", "/jazz/asm/invoke_ireq.jz",
      {"host": "127.0.0.1"});
    req.on("response", function (resp) {
        resp.setEncoding("utf8");
        test.equal(resp.statusCode, 200);
        resp.on("data", function (body) {
            test.ok(body.indexOf("p1=83702b502d5c46b89655ee26dffb3fe7") >= 0);
            test.ok(body.indexOf("inc1=e18715b8e2c94ef785b5033f3a2c83c0") >= 0);
        });
        resp.on("end", function () {
            test.done();
        });
    });
    req.end();
};


module.exports.testAsmFuncAndReq = function(test) {
    var client = http.createClient(port, "127.0.0.1");
    var req = client.request("GET", "/jazz/asm/invoke_func.jz?test_func.p1=dbe965819a2b4563947b56db1a862407",
      {"host": "127.0.0.1"});
    req.on("response", function (resp) {
        resp.setEncoding("utf8");
        test.equal(resp.statusCode, 200);
        resp.on("data", function (body) {
            test.ok(body.indexOf("p1=dbe965819a2b4563947b56db1a862407") >= 0)
        });
        resp.on("end", function () {
            test.done();
        });
    });
    req.end();
};


module.exports.testShutdown = function(test) {
    test.ok(nserver);
    nserver.shutdown();
    test.done();
};




