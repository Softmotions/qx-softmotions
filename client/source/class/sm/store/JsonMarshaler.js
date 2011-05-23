/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.store.JsonMarshaler", {
      extend  : qx.data.marshal.Json,

      construct : function(delegate) {
          this.base(arguments, delegate);
      },

      members :
      {

          //overriden
          toClass: function(data, includeBubbleEvents) {
              if (data != null && data != undefined && data["__marshall__"] == false) {
                  return;
              } else {
                  this.base(arguments, data, includeBubbleEvents);
              }
          },

          toModel: function(data) {
              if (data != null && data != undefined && data["__marshall__"] == false) {
                  return data;
              } else {
                  return this.base(arguments, data);
              }
          }
      }
  });