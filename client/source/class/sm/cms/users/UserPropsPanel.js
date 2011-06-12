/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */


/**
 * User properties editor. Roles, login, password, etc.
 */
qx.Class.define("sm.cms.users.UserPropsPanel", {
      extend : qx.ui.core.Widget,
      include : [ qx.ui.core.MChildrenHandling],

      statics :
      {
      },

      events :
      {
      },

      properties :
      {
      },

      construct : function() {
          this.base(arguments);
          this._setLayout(new qx.ui.layout.Grow());

          var stack = this.__stack = new qx.ui.container.Stack();

          var empty = this.__empty = new qx.ui.core.Widget();
          stack.add(empty);

          var table = this.__rtable = new sm.cms.users.UserRolesTable();
          stack.add(table);

          this._add(stack);
      },

      members :
      {
          //qx.ui.container.Stack to handle widgets
          __stack : null,

          //empty widget
          __empty : null,

          //roles table
          __rtable : null,

          /**
           * Setup user login to manage user's roles
           * @param login {String?null}
           */
          setUser : function(login) {
              var sc = this.__stack.getChildren();
              if (login == null) {
                  this.__stack.setSelection([sc[0]]);
              } else {
                  this.__rtable.setUser(login);
                  this.__stack.setSelection([sc[1]]);
              }
          }
      },

      destruct : function() {
          this.__stack = this.__empty = this.__rtable = null;
          //this._disposeObjects("__field_name");
      }
  });