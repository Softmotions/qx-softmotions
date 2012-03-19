/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

var async = require("async");

// additional async utilities

// it is a copy of async.queue with another task receiving strategy
var stack = module.exports.stack = function (worker, concurrency) {
    var _forEach = function (arr, iterator) {
        if (arr.forEach) {
            return arr.forEach(iterator);
        }
        for (var i = 0; i < arr.length; i += 1) {
            iterator(arr[i], i, arr);
        }
    };

    var workers = 0;
    var q = {
        tasks: [],
        concurrency: concurrency,
        saturated: null,
        empty: null,
        drain: null,
        push: function (data, callback) {
            if (data.constructor !== Array) {
                data = [data];
            }
            _forEach(data, function(task) {
                q.tasks.push({
                    data: task,
                    callback: typeof callback === 'function' ? callback : null
                });
                if (q.saturated && q.tasks.length == concurrency) {
                    q.saturated();
                }
                async.nextTick(q.process);
            });
        },
        process: function () {
            if (workers < q.concurrency && q.tasks.length) {
                // task receiving strategy changed
                var task = q.tasks.pop();
                if (q.empty && q.tasks.length == 0) {
                    q.empty();
                }
                workers += 1;
                worker(task.data, function () {
                    workers -= 1;
                    if (task.callback) {
                        task.callback.apply(task, arguments);
                    }
                    if (q.drain && q.tasks.length + workers == 0) {
                        q.drain();
                    }
                    q.process();
                });
            }
        },
        length: function () {
            return q.tasks.length;
        },
        running: function () {
            return workers;
        }
    };
    return q;
};
