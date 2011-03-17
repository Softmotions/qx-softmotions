require("../../nkserver-qxoo.js");


module.exports.testNewInstance = function (test) {
    var t = new sm.test.TestQooxdooClass1();
    test.ok(t);
    test.done();
};


module.exports.testWindowAndDoc = function(test) {
    var i = window.execScript("i = 0; ++i");
    test.equal(1, i);
    test.done();
};

module.exports.testPropsAndEvents = function(test) {
    var t = new sm.test.TestQooxdooClass1();
    test.ok(t);
    t.setTest(1);
    test.equal(1, t.getTest());
    test.throws(function() {
        t.setTest("bla");
    });
    test.equal(1, t.getTest());
    t.bind("test", t, "boundedTest");
    t.setTest(2);
    test.equal(2, t.getBoundedTest());

    var handled = 0;
    var handled2 = 0;
    t.addListener("changeTest", function(ev) {
        handled = ev.getData();
    });
    t.setTest(3);
    test.equal(3, handled);

    t.addListener("changeTest2", function(ev) {
        handled2 = ev.getData();
    });
    t.setTest(4);
    test.equal(5, handled2);

    test.done();
};

