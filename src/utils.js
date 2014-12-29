var X = X || {};

X.Utils = (function() {

  'use strict';

  return {

    /**
      * Bitwise operations
      */

    bit: function(value, n) {
      return !!(value & 1 << n);
    },

    signed: function(value) {
      return value < 0x80 ? value : value - 0x100;
    },

    hi: function(value) {
      return value >> 8;
    },

    lo: function(value) {
      return value & 0x00FF;
    },

    hilo: function(hi, lo) {
      return hi << 8 | lo;
    },

    random8: function() {
      return Math.floor(Math.random() * 0xFF)
    },

    /**
      * Misc.
      */

    fill: function(array, value) {

      var value = value || 0;

      for (var i = 0; i < array.length; ++i)
        array[i] = value;
    },

    pad: function(string, char, n) {
      return ('00000000000' + string).substr(-n);
    },

    hex8: function(value) {
      return ('0' + value.toString(16).toUpperCase()).substr(-2);
    },

    hex16: function(value) {
      return ('000' + value.toString(16).toUpperCase()).substr(-4);
    },

    bytes_to_string: function(bytes) {
      var string = '';
      for (var i = 0; i < bytes.length; ++i)
        string +=String.fromCharCode(bytes[i]);
      return string;
    }

  };

})();
