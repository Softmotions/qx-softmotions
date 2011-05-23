/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 * Base class for custom errors
 */
qx.Class.define("sm.lang.BaseError", {
      extend : Error,

      construct : function(error) {
          qx.lang.Object.mergeWith(this, error, false);
          this.message = error.message;
      },

      members :
      {
          message : null,

          getMessage : function() {
              return this.message;
          },

          toString : function() {
              return this.message;
          }
      },

      destruct : function() {
          this.message = null;
      }
  });