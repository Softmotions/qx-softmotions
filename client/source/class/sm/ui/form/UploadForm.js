/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/*
 #asset(sm/icons/misc/folder_add.png)
 #asset(sm/icons/misc/folder_explore.png)
 #asset(sm/icons/misc/cross16.png)
 */

/**
 * Модифицированная форма uploadwidget.UploadForm
 */
qx.Class.define("sm.ui.form.UploadForm", {
    extend : uploadwidget.UploadForm,
    implement: [
        qx.ui.form.IForm,
        qx.ui.form.IStringForm // заглушка, чтобы в форму добавлялось
    ],
    include : [
        qx.ui.form.MForm
    ],

    /*
     ---------------------------------------------------------------------------
     CONSTRUCTOR
     ---------------------------------------------------------------------------
     */

    /**
     * @param name {String} form name ({@link #name}).
     * @param url {String} url for form submission ({@link #url}).
     * @param encoding {String} encoding for from submission. This is an instantiation only parameter and defaults to multipart/form-data
     */
    construct: function(name, url, encoding) {
        this.base(arguments, name, url, encoding);
        this.setLayout(new qx.ui.layout.VBox());

        this.__uploadRows = [];

        // bugfix for IE8
        var el = this.getContentElement();
        el.setAttribute("encoding", encoding || "multipart/form-data");
        el.setAttribute("enctype", encoding || "multipart/form-data");


        this.__addButton = new qx.ui.form.Button(this.tr("Добавить файл"), "sm/icons/misc/folder_add.png");
        this.add(this.__addButton, {flex : 1});

        this.__addButton.addListener("execute", function() {
            this._addFileItem();
        }, this);
    },

    // --------------------------------------------------------------------------
    // [Events]
    // --------------------------------------------------------------------------

    events:
    {
        // заглушка для формы
        "input" : "qx.event.type.Data",
        "changeValue" : "qx.event.type.Data"

    },

    // --------------------------------------------------------------------------
    // [Properties]
    // --------------------------------------------------------------------------

    properties:
    {
    },

    // --------------------------------------------------------------------------
    // [Members]
    // --------------------------------------------------------------------------

    members:
    {
        //__closeCmd : null,
        __addButton: null,

        __uploadRows: null,

        _addFileItem: function() {
            var formRow = new qx.ui.container.Composite(new qx.ui.layout.HBox());

            var fileName = "file" + this.__uploadRows.length;
            var fileField = new uploadwidget.UploadField(fileName, null, "sm/icons/misc/folder_explore.png");
            formRow.add(fileField, {flex: 1});

            var delFileItem = new qx.ui.form.Button(null, "sm/icons/misc/cross16.png");
            delFileItem.setMarginLeft(5);
            formRow.add(delFileItem);

            this.addBefore(formRow, this.__addButton);
            this.__uploadRows.push(formRow);

            delFileItem.addListener("execute", function() {
                this._removeFileItem(formRow);
            }, this);

            if (this.__uploadRows.length > 9) {
                this.__addButton.setEnabled(false);
            }
            this.fireDataEvent("changeValue", this.__uploadRows.length);
        },

        _removeFileItem: function(element) {
            qx.lang.Array.remove(this.__uploadRows, element);
            this._remove(element);
            if (this.__uploadRows.length <= 9) {
                this.__addButton.setEnabled(true);
            }
            this.fireDataEvent("changeValue", this.__uploadRows.length);
        },


        removeAllUploadRows : function() {
            for (var i = 0; i < this.__uploadRows.length; ++i) {
                if (this.__uploadRows[i]) {
                    this._remove(this.__uploadRows[i]);
                    this.__uploadRows[i] = null;
                }
            }
            this.__uploadRows = [];
            if (this.__uploadRows.length <= 9) {
                this.__addButton.setEnabled(true);
            }
            this.fireDataEvent("changeValue", this.__uploadRows.length);
        },

        /*
         ---------------------------------------------------------------------------
         TEXTFIELD VALUE API
         TODO - надо понять что должны делать эти методы, в контексте текущего использования компонента
         ---------------------------------------------------------------------------
         */

        setValue : function(value) {
        },

        getValue : function() {
            return null;
        },

        resetValue : function() {
        },

        _onChangeContent : function(e) {
        }


    },

    /*
     ---------------------------------------------------------------------------
     DESTRUCTOR
     ---------------------------------------------------------------------------
     */
    destruct : function() {
        this._disposeObjects("__addButton");
        this.__fileItemCount = null;
    }
});