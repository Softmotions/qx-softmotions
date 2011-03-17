require("../../mediahouse-qxoo-server.js");

var cwd = process.cwd();
var fsutils = $$node.require("utils/fsutils");


var env = null;


module.exports.testEnvCreate = function(test) {
    var envDir = cwd + fsutils.FileSeparator + "env";
    qx.log.Logger.info("Environment dir: " + envDir);
    env = new mh.Env(envDir, null, {create : true});
    var cfg = env.getConfig();
    test.ok(cfg);
    test.ok(cfg["mongo"]);
    test.ok(cfg["mongo"]["db_name"]);
    test.ok(cfg["mongo"]["db_host"]);
    test.ok(cfg["mongo"]["db_port"]);    
    test.done();

};


module.exports.startStopMongo = function(test) {

    var me = this;
    //test.expect(5);

    test.ok(env);

    var cfg = env.getConfig();
    test.ok(cfg);

    var mongo = new sm.mongo.Mongo(cfg["mongo"]["db_name"],
                                   cfg["mongo"]["db_host"],
                                   cfg["mongo"]["db_port"],
                                   {native_parser : true});
    test.ok(!mongo.isConnected());

    mongo.addListenerOnce("error", function(ev) {
        var edata = ev.getData();
        qx.log.Logger.error(mongo, edata[0], edata[1]);
        test.ok(false);
    });

    mongo.addListenerOnce("opened", function() {
        test.ok(mongo.isConnected());
        mongo.close();
    }, this);

    mongo.addListenerOnce("closed", function() {
        test.ok(!mongo.isConnected());
        test.done();
    }, this);

    mongo.open();
};


/**
 * Simple insert & select mongolib test
 */
module.exports.insertAndSelect = function(test) {

    var me = this;

    var cfg = env.getConfig();
    var mongo = new sm.mongo.Mongo(cfg["mongo"]["db_name"],
                                   cfg["mongo"]["db_host"],
                                   cfg["mongo"]["db_port"],
                                   {native_parser : true});

    mongo.addListenerOnce("error", function(ev) {
        var edata = ev.getData();
        qx.log.Logger.error(mongo, edata[0], edata[1]);
        test.ok(false);
    });

    mongo.open();
    test.ok(!mongo.isConnected()); //Not connected due to asyc request

    //but we need to start use collections right now!
    var coll = mongo.collection("foo");
    test.ok(coll instanceof sm.mongo.Collection);

    coll.drop(function(err, dropped) {
        //test.ifError(err);
    });
    coll.insert([
        {"a" : "val1", "b" : 2},
        {"a" : "val2", "b" : 2},
        {"a" : "val3", "b" : 2},
        {"a" : "val4", "b" : 3}
    ]);

    var q = coll.createQuery({"b" : 2},
                             {"sort":[
                                 ["a", -1]
                             ]});
    test.ok(q instanceof sm.mongo.Query);

    var count = 0;

    q.first(function(doc) {
        test.ok(doc);
        test.equal(doc["a"], "val3");
    }).last(function(index, doc) {
        test.ok(doc);
        test.equal(doc["a"], "val1");
    }).each(function(index, doc) {
        test.ok(doc);
        test.ok(doc["_id"]);
        test.ok(index >= 0);
        ++count;
    }).all(function(size, items) {
        test.ok(items);
        test.ok(size == items.length);
        test.equal(items.length, 3);
    }).exec(function(err) {
        test.ifError(err);
        test.equal(count, 3);
        test.done();
    });
};

