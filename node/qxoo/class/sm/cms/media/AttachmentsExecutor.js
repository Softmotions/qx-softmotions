/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.cms.media.AttachmentsExecutor", {
    extend  : qx.core.Object,
    include : [sm.nsrv.MExecutor],

    members :
    {
        /**
         * Load media list associated with page
         */
        __media_list : function(req, resp, ctx) {
            if (req.params["ref"] == null) {
                this.handleError(resp, ctx, "Invalid request");
                return;
            }
            var me = this;
            var ref = req.params["ref"];
            var coll = sm.cms.page.PageMgr.getColl();
            var res = [];

            coll.findOne({"_id" : coll.toObjectID(ref)}, {fields : {"media" : 1}}, function(err, doc) {
                if (err || doc == null) {
                    me.handleError(resp, ctx, err ? err : "Missing document, ref=" + ref, true);
                    return;
                }
                var fnames = doc["media"] || [];
                var gfcoll = coll.getMongo().gridFilesCollection();
                var fq = gfcoll.createQuery({"filename" : {$in : fnames}});
                fq.each(
                        function(index, doc) {
                            var fname = doc["filename"];
                            if (fname.indexOf(ref) == 0) {
                                res.push({
                                    "name" : fname.substring(ref.length),
                                    "contentType" : doc["contentType"],
                                    "length" : doc["length"]
                                });
                            }
                        }).exec(
                        function(err) {
                            if (err) {
                                qx.log.Logger.error(me, err);
                            }
                            me.writeJSONObject(res, resp, ctx);
                        });
            });
        },


        /**
         * Remove attached mediafile
         */
        __media_remove : function(req, resp, ctx) {
            if (req.params["ref"] == null) {
                this.handleError(resp, ctx, "Invalid request");
                return;
            }

            var me = this;
            var env = sm.app.Env.getDefault();
            var ref = req.params["ref"];
            var pageRef = ref.substring(0, 24); //extract mongodb ID

            var mongo = env.getMongo();
            var gstore = mongo.gridStore();

            var finish = function() {
                me.writeJSONObject({}, resp, ctx);
            };

            var updatePage = function() {
                var ncoll = sm.cms.page.PageMgr.getColl();
                ncoll.update({"_id" : ncoll.toObjectID(pageRef)},
                        {$pull : {"media" : ref}},
                        {upsert: false, safe : false}, function(err, doc) {
                            if (err) {
                                me.handleError(resp, ctx, err);
                                return;
                            }
                            finish();
                        });
            };

            gstore.unlink(mongo.getDB(), [ref, ref + ".thumb"], {}, function(err) {
                if (err) {
                    me.handleError(resp, ctx, err);
                    return;
                }
                updatePage();
            });
        },

        /**
         * Save uploaded mediafiles
         */
        __media_upload : function(req, resp, ctx) {

            if (req.params["ref"] == null) {
                this.handleError(resp, ctx, "Invalid request");
                return;
            }

            var me = this;

            var async = $$node.require("async");
            var im = $$node.require("imagemagick");

            var ref = req.params["ref"];
            var removed = [];  //Files to be removed
            var savedMedia = [];

            var env = sm.app.Env.getDefault();
            var mongo = env.getMongo();
            var constraints = env.getConfig()["constrains"] || {"maxUploadFileSize" : 10 * 1024};

            var errors = [];
            var files = {};

            var finish = function() {
                try {
                    var res = {
                        files : [],
                        errors : errors
                    };
                    for (var k in files) {
                        var fmeta = files[k];
                        res.files.push({
                            "gfname" : fmeta["gfname"],
                            "length" : fmeta["length"],
                            "name" : fmeta["name"],
                            "type" : fmeta["type"],
                            "features" : fmeta["features"]
                        });
                    }
                    me.writeString(JSON.stringify(res), resp, ctx);
                } finally {
                    //Perform cleanup
                    for (var i = 0; i < removed.length; ++i) {
                        $$node.fs.unlink(removed[i], function(err) {
                            if (err) {
                                qx.log.Logger.error(me, "Unable to remove file", err);
                            }
                        });
                    }
                }
            };

            for (var ff in req.form.files) {
                var fmeta = req.form.files[ff];
                if (fmeta.type == null || fmeta.type == "") {
                    removed.push(fmeta.path);
                    continue;
                }
                if (fmeta.size > constraints["maxUploadFileSize"]) {
                    var mb = Math.floor((constraints["maxUploadFileSize"] / 1024 / 1024));
                    errors.push("Для '" + fmeta["name"] + "' превышен максимальный размер загружаемого файла: " + mb + "Мб");
                    removed.push(fmeta.path);
                    continue;
                }
                fmeta["gfname"] = (ref + fmeta["name"]).replace(/\s/g, "_");
                files[ff] = fmeta;

            }

            if (qx.lang.Object.getLength(files) == 0) {
                finish();
                return;
            }

            var saveThumb = function(fmeta, cb) {

                if (req.params["nothumbs"]) {
                    cb();
                    return;
                }

                var gfname = fmeta["gfname"] + ".thumb";
                var dstPath = fmeta["path"] + ".thumb";
                removed.push(dstPath);

                im.convert([fmeta["path"], "-resize", "128>", dstPath], function(err) {
                    if (err) {
                        cb(err);
                        return;
                    }
                    mongo.openGridFile(gfname, "w", fmeta["type"], null, function(err, gf) {
                        if (err) {
                            cb(err);
                            return;
                        }
                        gf.writeFile(dstPath, function(err) {
                            if (err) {
                                cb(err);
                                return;
                            }
                            gf.close(function(err) {
                                cb(err);
                            });
                        });
                    });
                });
            };


            var writeMf = function(fmeta, gf, cb) {
                gf.writeFile(fmeta["path"], function(err) {
                    if (err) {
                        cb(err);
                        return;
                    }
                    gf.close(function(err) {
                        if (!err) {
                            savedMedia.push(fmeta["gfname"]);
                        }
                        cb(err);
                    });
                });
            };

            //Save function
            var saveMf = function(fmeta, cb) {
                removed.push(fmeta["path"]);
                mongo.openGridFile(fmeta["gfname"], "w", fmeta["type"], null, function(err, gf) {
                    if (err) {
                        cb(err);
                        return;
                    }
                    if (fmeta["type"].indexOf("image/") == 0) { //Process file as image
                        im.identify(fmeta["path"], function(err, features) { //Retrieve image info
                            if (err) {
                                cb(err);
                                return;
                            }
                            fmeta["features"] = features;
                            gf.metadata = features;
                            writeMf(fmeta, gf, function(err) {
                                saveThumb(fmeta, function() {
                                    cb(err);
                                });
                            });
                        });
                    } else { //Process file as binary file
                        writeMf(fmeta, gf, cb)
                    }
                });
            };

            //Perform async save for each file
            async.forEach(qx.lang.Object.getValues(files), qx.lang.Function.bind(saveMf, this), function(err) {
                if (err) {
                    qx.log.Logger.error(me, err);
                }
                //Update pageinfo with saved media
                var ncoll = sm.cms.page.PageMgr.getColl();
                ncoll.update({"_id" : ncoll.toObjectID(ref)},
                        {$addToSet : {"media" : {$each : savedMedia}}},
                        {upsert: false, safe : false}, function(err, doc) {
                            if (err) {
                                qx.log.Logger.error(me, err);
                            }
                            finish();
                        });

            });
        },


        __media_get : function(req, resp, ctx) {
        }
    },


    handlers :
    {
        /**
         * List media files attached to page
         */
        "/media/list" : {
            webapp : "adm",
            handler : "__media_list"
        },

        /**
         * Upload media file
         */
        "/media/upload" : {
            webapp : "adm",
            handler : "__media_upload"
        },

        /**
         * Remove media files
         */
        "/media/remove" : {
            webapp : "adm",
            handler : "__media_remove"
        },

        /**
         * Get media file
         */
        "/media/get" : {
            webapp : "adm",
            handler : "__media_get"
        }
    },

    destruct : function() {
        //this._disposeObjects("__field_name");
    }
});
