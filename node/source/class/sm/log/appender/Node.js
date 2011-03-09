qx.Class.define("sm.log.appender.Node", {
    extend  : qx.core.Object,

    statics :
    {

        __toText : function(entry) {
            var output = [];

            if (entry.object) {
                var obj = qx.core.ObjectRegistry.fromHashCode(entry.object);
                if (obj) {
                    output.push(obj.classname + "[" + obj.$$hash + "]:");
                }
            }
            else if (entry.clazz) {
                output.push(entry.clazz.classname + ":");
            }
            var items = entry.items;
            var item, msg;
            for (var i = 0, il = items.length; i < il; i++) {
                item = items[i];
                msg = item.text;
                if (item.trace && item.trace.length > 0) {
                    msg += "\n" + item.trace.join("\n");
                }

                if (msg instanceof Array) {
                    var list = [];
                    for (var j = 0, jl = msg.length; j < jl; j++) {
                        list.push(msg[j].text);
                    }

                    if (item.type === "map") {
                        output.push("{", list.join(", "), "}");
                    } else {
                        output.push("[", list.join(", "), "]");
                    }
                }
                else {
                    output.push(msg);
                }
            }

            return output.join(" ");
        },


        process : function(entry) {
            var level = entry.level;
            var style = null;
            if ("error" == level) {
                style = "\x1B[0;31m"; //red
            } else if ("warn" == level) {
                style = "\x1B[0;33m"; //yellow
            } else if ("info" == level) {
                style = "\x1B[0;32m"; //green
            }
            sm.log.appender.Node.__log(style, level.toUpperCase() + " - " + this.__toText(entry));
        }
    },


    defer : function(statics) {
        var util = $$node.require("util");
        statics.__log = function(style, msg) {
            if (style) {
                util.log(style + msg + "\x1B[0m");
            } else {
                util.log(msg);
            }
        };
        var sys = $$node.require("sys");
        util.error = sys.error = function(arg) {
            qx.log.Logger.error(arg);
        };
        qx.log.Logger.register(statics);
    }
});