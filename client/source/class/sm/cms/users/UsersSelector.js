/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.cms.users.UsersSelector", {
    extend : qx.ui.core.Widget,
    include : [qx.ui.core.MChildrenHandling],

    events :
    {

        /**
         * Event fired if user was selected/deselected
         *
         * data: {"logn" : userId, "name" : userName, "email": userEmail}
         * or null if selection cleared
         */
        "userSelected" : "qx.event.type.Data"

    },

    properties :
    {
    },

    construct : function() {
        this.base(arguments);
        this._setLayout(new qx.ui.layout.VBox(4));

        var sbox = new qx.ui.container.Composite(new qx.ui.layout.HBox(4).set({alignY : "middle"})).set({padding : [5, 5, 0, 5] });
        sbox.add(new qx.ui.basic.Label(this.tr("Search")));

        var stext = this.__stext = new qx.ui.form.TextField().set({maxLength : 64});
        stext.addListener("keydown", function(ev) {
            if (ev.getKeyCode() == 13) {
                ev.stop();
                this.__search();
            }
        }, this);
        sbox.add(stext, {flex : 1});

        var sbut = new qx.ui.form.Button(this.tr("Find"));
        sbut.addListener("execute", this.__search, this);
        sbox.add(sbut);
        this._add(sbox);

        var ut = this.__table = new sm.cms.users.UsersTable().set({
            "statusBarVisible" : false,
            "showCellFocusIndicator" : false});

        ut.getSelectionModel().addListener("changeSelection", function(ev) {
            var user = this.getSelectedUser();
            this.fireDataEvent("userSelected", user ? user : null);
        }, this);

        this._add(ut, {flex : 1});
    },

    members :
    {
        __table : null,

        __stext : null,

        setViewSpec : function(vspec) {
            this.__table.getTableModel().setViewSpec(vspec);
        },

        updateViewSpec : function(vspec) {
            this.__table.getTableModel().updateViewSpec(vspec);
        },

        getTable : function() {
            return this.__table;
        },

        getSelectedUserInd : function() {
            return this.__table.getSelectedUserInd();
        },

        getSelectedUser : function() {
            return this.__table.getSelectedUser();
        },

        setUserData : function(ind, data) {
            return this.__table.setUserData(ind, data);
        },

        /**
         * Perform users search
         */
        __search : function() {
            this.__table.resetSelection();
            var val = this.__stext.getValue();
            this.setViewSpec(val != null && val != "" ? {stext : val} : {});
        }
    },

    destruct : function() {
        this.__table = this.__stext = null;
        //this._disposeObjects("__field_name");
    }
});