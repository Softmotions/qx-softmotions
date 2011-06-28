/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.cms.util.DateTimeHelper", {

      statics :
      {
          DDMMYYYY_FMT : null,

          //RFC_822
          formatRFC822 : function(oDate) {
              //taken from http://sanctumvoid.net/jsexamples/rfc822datetime/rfc822datetime.html
              var aMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
              var aDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
              var dtm = new String();
              dtm = aDays[oDate.getDay()] + ", ";
              dtm += this.padWithZero(oDate.getDate()) + " ";
              dtm += aMonths[oDate.getMonth()] + " ";
              dtm += oDate.getFullYear() + " ";
              dtm += this.padWithZero(oDate.getHours()) + ":";
              dtm += this.padWithZero(oDate.getMinutes()) + ":";
              dtm += this.padWithZero(oDate.getSeconds()) + " ";
              dtm += this.getTZOString(oDate.getTimezoneOffset());
              return dtm;
          },

          padWithZero : function (val) {
              if (parseInt(val) < 10) {
                  return "0" + val;
              }
              return val;
          },

          getTZOString : function(timezoneOffset) {
              var hours = Math.floor(timezoneOffset / 60);
              var modMin = Math.abs(timezoneOffset % 60);
              var s = new String();
              s += (hours > 0) ? "-" : "+";
              var absHours = Math.abs(hours)
              s += (absHours < 10) ? "0" + absHours : absHours;
              s += ((modMin == 0) ? "00" : modMin);
              return(s);
          }
      },

      defer : function(statics) {
          statics.DDMMYYYY_FMT = new qx.util.format.DateFormat("dd.MM.yyyy");
          //statics.RFC_822 = new qx.util.format.DateFormat("EEE, dd MMM yyyy HH:mm:ss Z");
      }
  });