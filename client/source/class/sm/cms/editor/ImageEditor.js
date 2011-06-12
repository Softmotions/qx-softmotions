/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/*
 #asset(sm/icons/misc/folder_explore.png)
 */

qx.Class.define("sm.cms.editor.ImageEditor", {
      extend : qx.ui.container.Composite,
      implement : [
          qx.ui.form.IStringForm,
          qx.ui.form.IForm
      ],
      include : [
          qx.ui.form.MForm
      ],

      events :
      {
          /** Fired when the value was modified */
          "changeValue" : "qx.event.type.Data",

          /** Fired when the enabled state was modified */
          "changeEnabled" : "qx.event.type.Data",

          /** Fired when the valid state was modified */
          "changeValid" : "qx.event.type.Data",

          /** Fired when the invalidMessage was modified */
          "changeInvalidMessage" : "qx.event.type.Data",

          /** Fired when the required was modified */
          "changeRequired" : "qx.event.type.Data"
      },

      properties :
      {
          // overridden
          appearance :
          {
              refine : true,
              init : "image-editor"
          }
      },

      construct : function(opts) {
          qx.core.Assert.assertMap(opts, "Constructor argument: opts must be Map");
          this.base(arguments);
          this._setLayout(new qx.ui.layout.VBox(2));

          this.__pageId = opts["pageInfo"]["_id"];
          this.__errors = [];

          var hrow = new qx.ui.container.Composite(new qx.ui.layout.HBox(4).set({alignY : "middle"}));
          this.add(hrow);

          opts = opts || {};
          this.__opts = opts;
          var fileForm = this.__fileForm =
            new sm.ui.form.UploadForm(this.__pageId + "image", sm.cms.Application.ACT.getUrl("media.upload"),
              null, {singleUpload : true});
          hrow.add(fileForm, {flex : 1});

          fileForm.getControlContainer().getLayout().set({alignX : "left"}); //todo hack!
          var uploadBt = new qx.ui.form.Button(this.tr("Загрузить")).set({allowGrowY : false});
          uploadBt.addListener("execute", this.__uploadFile, this);
          fileForm.getControlContainer().add(uploadBt, {flex : 0});
          if (opts["comment"]) {
              fileForm.getControlContainer().add(new qx.ui.basic.Label(opts["comment"]).set({rich : true}), {flex : 1})
          }

          this.__image = new qx.ui.basic.Image();
          this.add(this.__image);

      },

      members :
      {
          __fileForm : null,

          __opts : null,

          __pageId : null,

          __errors : null,

          __file : null,

          __image : null,


          getValidator : function() {
              var me = this;
              return function(value, formItem) {
                  if (me.__errors && me.__errors.length > 0) {
                      throw new qx.core.ValidationError("Validation Error", me.__errors.join("\n"));
                  }
                  if (me.isRequired() && (me.__file == null || me.__file == "")) {
                      throw new qx.core.ValidationError("Validation Error", me.tr("Необходимо загрузить изображение"));
                  }
                  return true;
              };
          },

          // overridden
          setValue : function(value) {
              if (value != null && (typeof value) != "string") {
                  value = null;
              }
              this.__file = value;
              if (value != null) {
                  var source = sm.cms.Application.ACT.getUrl("media.get", "ref", value);
                  this.__image.setSource(source);
              } else {
                  this.__image.setSource(null);
              }
              this.fireDataEvent("changeValue", value);
          },

          // overridden
          resetValue : function() {
              this.setValue(null);
          },

          // overridden
          getValue : function() {
              return this.__file;
          },

          __uploadFile : function() {

              var root = qx.core.Init.getApplication().getRoot();
              root.setGlobalCursor("wait");
              root.blockContent(this.getZIndex() + 1);

              this.__fileForm.setParameter("ref", this.__pageId);
              this.__fileForm.setParameter("nothumbs", true);
              this.__fileForm.addListenerOnce("completed", this.__uploadFileCompleted, this);
              this.__fileForm.addListenerOnce("completedResponse", function(ev) {
                  var data = ev.getData();
                  var resp = null;
                  var errors = [];
                  try {
                      resp = qx.util.Json.parse(data);
                      if (qx.lang.Type.isArray(resp.errors)) {
                          errors = resp.errors;
                      }
                  } catch(e) {
                      qx.log.Logger.error(this, e);
                      errors.push(e.toString());
                  }
                  this.__errors = errors;
                  if (errors.length > 0) {
                      var alert = new sm.alert.AlertMessages(this.tr("Внимание"));
                      alert.addMessages(this.tr("Ошибки при загрузке файлов"), errors);
                      alert.show();
                      return;
                  }
                  var imgErrors = this.__checkImageConstrains(resp.files);
                  if (imgErrors.length > 0) {
                      var alert = new sm.alert.AlertMessages(this.tr("Внимание"));
                      alert.addMessages(this.tr("Изображение не соответствует ограничениям"), imgErrors);
                      alert.show();
                      //if image invalid, try to remove it
                      if (resp.files.length == 1 && resp.files[0]["gfname"]) {
                          var req = new sm.io.Request(sm.cms.Application.ACT.getUrl("media.remove"), "GET", "application/json");
                          req.setShowMessages(false);
                          var fname = resp.files[0]["gfname"];
                          req.setParameter("ref", fname, false);
                          req.send();
                          return;
                      }
                  }
                  this.setValue((resp.files && resp.files[0]) ? resp.files[0]["gfname"] : null)
              }, this);

              this.__fileForm.send();
          },

          __checkImageConstrains : function(files) {
              var errors = [];
              if (!qx.lang.Type.isArray(files) || files.length != 1) {
                  qx.log.Logger.warn(this, "Got invalid file meta response: " + qx.util.Json.stringify(files));
                  errors.push(this.tr("Изображение не было загружено"));
                  return errors;
              }
              var meta = files[0];
              if (!qx.lang.Type.isString(meta["type"]) || meta["type"].indexOf("image/") != 0 || !meta["features"]) {
                  errors.push(this.tr("Загруженный файл не является изображением"));
                  return errors;
              }
              var features = meta["features"];
              var width = features["width"];
              var height = features["height"];
              if (isNaN(width) || isNaN(height)) {
                  errors.push(this.tr("Изображение имеет неизвестные размеры"));
                  return errors;
              }

              var ctrArr = this.__opts["constraints"];
              if (!qx.lang.Type.isArray(ctrArr)) {
                  return errors;
              }
              for (var i = 0; i < ctrArr.length; ++i) {
                  var ctr = ctrArr[i];
                  if (!qx.lang.Type.isString(ctr)) {
                      qx.log.Logger.warn(this, "Invalid constraint: " + qx.util.Json.stringify(ctr));
                      continue;
                  }
                  if (ctr.indexOf("square") == 0 && (width != height)) {
                      errors.push(this.tr("Ширина изображения не равна его высоте"));
                      return errors;
                  }
                  var dim = null;
                  if (ctr.indexOf("width") == 0) {
                      dim = "width";
                  } else if (ctr.indexOf("height") == 0) {
                      dim = "height";
                  }
                  if (dim) {
                      var hdim = (dim == "width") ? this.tr("ширина") : this.tr("высота");
                      var rest = ctr.substring(dim.length).trim();
                      var op = rest.charAt(0);
                      var val = parseInt(rest.substring(1));
                      if (isNaN(val)) {
                          qx.log.Logger.warn(this, "Invalid constraint: " + qx.util.Json.stringify(ctr));
                          continue;
                      }
                      if (op == "=") {
                          if (features[dim] != val) {
                              errors.push(hdim + " " + this.tr("изображения не равна") + " " + val);
                          }
                      } else if (op == ">") {
                          if (features[dim] <= val) {
                              errors.push(hdim + " " + this.tr("изображения меньше чем") + " " + (val + 1));
                          }
                      } else if (op == "<") {
                          if (features[dim] >= val) {
                              errors.push(hdim + " " + this.tr("изображения больше чем") + " " + (val - 1));
                          }
                      } else {
                          qx.log.Logger.warn(this, "Invalid constraint: " + qx.util.Json.stringify(ctr));
                          continue;
                      }
                  }
              }

              return errors;
          },

          __uploadFileCompleted : function() {
              try {

              } finally {
                  var root = qx.core.Init.getApplication().getRoot();
                  root.resetGlobalCursor();
                  root.unblockContent();
              }
          }
      },

      destruct : function() {
          this.__pageId = this.__opts = this.__errors = this.__file = this.__image = null;
          //this._disposeObjects("__field_name");
      }
  });

