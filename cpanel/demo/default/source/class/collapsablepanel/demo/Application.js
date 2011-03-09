/* ************************************************************************

   Copyright:

   License:

   Authors: Christian Boulanger (cboulanger)

************************************************************************ */

/* ************************************************************************

#asset(collapsablepanel.demo/*)

************************************************************************ */

/**
 * This is the main application class of your custom application "collapsablepanel"
 */
qx.Class.define("collapsablepanel.demo.Application",
{
  extend : qx.application.Standalone,



  /*
  *****************************************************************************
     MEMBERS
  *****************************************************************************
  */

  members :
  {
    /**
     * This method contains the initial application code and gets called
     * during startup of the application
     */

    main : function()
    {
      // Call super class
      this.base(arguments);

      // Enable logging in debug variant
      if (qx.core.Variant.isSet("qx.debug", "on"))
      {
        // support native logging capabilities, e.g. Firebug for Firefox
        qx.log.appender.Native;
        // support additional cross-browser console. Press F7 to toggle visibility
        qx.log.appender.Console;
      }

      /*
      -------------------------------------------------------------------------
        Below is your actual application code...
      -------------------------------------------------------------------------
      */

      /*
       * label
       */
      var label = new qx.ui.basic.Label("<h2>Collapsable Panel Demo</h2>");
      label.setRich(true);
      this.getRoot().add(label, {left: 10, top: 10});

      var panels = [];
      var labels = [];

      /*
       * main box
       */

      var group = new qx.ui.form.RadioGroup();
      group.setAllowEmptySelection(true);

      /*
       * left panel container: modern theme
       */
      var resize = new qx.ui.container.Resizer(new qx.ui.layout.Grow);
      resize.setDecorator("pane");
      resize.setWidth(500);
      resize.setHeight(400);
      resize.setPadding(5);
      resize.setBackgroundColor("white");

      var scroll = new qx.ui.container.Scroll();
      resize.add(scroll);

      var vbox = new qx.ui.container.Composite(new qx.ui.layout.VBox(5));
      vbox.setPadding(0);
      scroll.add(vbox);

      var btnBox = new qx.ui.container.Composite(new qx.ui.layout.HBox());

      var btnAppearance  = new qx.ui.form.ToggleButton("Classic Appearance");
      btnAppearance.addListener("changeValue", function(e)
      {
        for (var i = 0, l = panels.length; i < l; i++)
        {
          panels[i].setAppearance(e.getData() ? "collapsable-panel-classic" : "collapsable-panel");
        }
        this.getLayout().setSpacing(!e.getData() * 5);
        resize.setPadding(!e.getData() * 5);
        resize.setDecorator(e.getData() ? "main" : "pane");
      }, vbox);
      var btnOrientation = new qx.ui.form.ToggleButton("Horizontal");
      btnOrientation.addListener("changeValue", function(e)
      {
        var spacing = !btnAppearance.getValue() * 5;
        this.setLayout(e.getData() ? new qx.ui.layout.HBox(spacing) : new qx.ui.layout.VBox(spacing));
        this.setPadding(spacing);
        for (var i = 0, l = panels.length; i < l; i++)
        {
          panels[i].setOrientation(e.getData() ? "horizontal" : "vertical");
        }
        for (var i = 0, l = labels.length; i < l; i++)
        {
          labels[i].setWidth(e.getData() && !btnFlex.getValue() ? 100 : null);
        }
      }, vbox);

      var btnFlex = new qx.ui.form.ToggleButton("Use Flex");
      btnFlex.addListener("changeValue", function(e)
      {
        for (var i = 0, l = panels.length; i < l; i++)
        {
          panels[i].setLayoutProperties({flex:Number(e.getData())});
        }
        for (var i = 0, l = labels.length; i < l; i++)
        {
          labels[i].setWidth(!e.getData() && btnOrientation.getValue() ? 100 : null);
        }
      }, vbox);
      
      var btnGroup = new qx.ui.form.ToggleButton("Use Radio Group");
      btnGroup.addListener("changeValue", function(e)
      {
        for (var i = 0, l = panels.length; i < l; i++)
        {
          panels[i].setGroup(e.getData() ? group : null);
        }
      }, vbox);

      btnBox.add(btnAppearance);
      btnBox.add(btnOrientation);
      btnBox.add(btnFlex);
      btnBox.add(btnGroup);

      this.getRoot().add(btnBox,  {left: 10, top: 60} );

      var numbers = ["First","Second","Third","Fourth","Fifth"];
      for ( var i=0; i< numbers.length; i++)
      {
        var panel = new collapsablepanel.Panel( numbers[i] + " Panel");
        var label = new qx.ui.basic.Label();
        panels.push(panel);
        label.setRich(true);
        labels.push(label);
        label.setValue("qooxdoo is a comprehensive and innovative framework for creating rich internet applications (RIAs). Leveraging object-oriented JavaScript allows developers to build impressive cross-browser applications. No HTML, CSS nor DOM knowledge is needed.It includes a platform-independent development tool chain, a state-of-the-art GUI toolkit and an advanced client-server communication layer. It is open source under an LGPL/EPL dual license.");
        panel.add( label );
        vbox.add(panel);
        panel.setValue(false);
      }

      var panel = new collapsablepanel.Panel("Panel With Dock Layout", new qx.ui.layout.Dock(5, 5));
      panels.push(panel);
      panel.setContentPadding(5);

      var edge = ["north", "east",  "south", "west",   "center"];
      var bg   = ["red",   "green", "blue",  "yellow", "white"];
      for (var i = 0; i < 5; i++)
      {
        var label = new qx.ui.basic.Atom(bg[i]);
        label.setBackgroundColor(bg[i]);
        label.setDecorator("main");
        label.setPadding(5);
        panel.add(label, {edge : edge[i]} );
      }
      vbox.add(panel);
      panel.setValue(false);

      this.getRoot().add(resize, {left: 10, top: 100} );

      panels[0].setValue(true);

    }
  }
});
