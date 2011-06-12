/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.cms.util.DateTimeHelper", {

      statics :
      {
          DDMMYYYY_FMT : null
      },

      defer : function(statics) {
          statics.DDMMYYYY_FMT = new qx.util.format.DateFormat("dd.MM.yyyy");
      }
  });