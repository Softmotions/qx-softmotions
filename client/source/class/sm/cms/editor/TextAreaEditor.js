/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.cms.editor.TextAreaEditor", {
      extend : qx.ui.form.TextArea,

      construct : function(options) {
          this.base(arguments);
          if (options["maxLength"] != null) {
              this.setMaxLength(options["maxLength"]);
          }
          if (options["placeholder"] != null) {
              this.setPlaceholder(options["placeholder"]);
          }
          if (options["minimalLineHeight"] != null) {
              this.setMinimalLineHeight(options["minimalLineHeight"]);
          }
      },

      destruct : function() {
          //this._disposeObjects("__field_name");                                
      }
  });