/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 * Модель для загрузки json форматированных данных
 * в таблицу используя sm.store.Json
 */

qx.Class.define("sm.model.JsonRequestTableModel", {
      extend  : sm.model.JsonTableModel,

      construct : function() {
          this.base(arguments);
          this.__jsonStore = new sm.store.Json(null, false);
          this.__jsonStore.addListener("loaded", this.__applyJsonRequestData, this);
      },

      members :
      {
          __jsonStore : null,

          __applyJsonRequestData : function(ev) {
              var data = ev.getData();
              this._applyJsonData(data);
          },

          setRequest : function(req) {
              if (this._columnsInitiated == false) {
                  req.setAsynchronous(false);
              }
              this.__jsonStore.setRequest(req);
          },

          reload : function() {
              this.__jsonStore.reload();
          }
      },

      destruct : function() {
          this._disposeObjects("__jsonStore");
      }
  });