var X = X || {};

X.Input = (function() {

  'use strict';

  /**
    *
    */

  var keys = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];

  /**
    *
    */

  var mapping = {
    69: 0x1,
    82: 0x2,
    84: 0x3,
    68: 0x4,
    70: 0x5,
    71: 0x6,
    67: 0x7,
    86: 0x8,
    66: 0x9,
    89: 0xA,
    85: 0xB,
    73: 0xC,
    72: 0xD,
    74: 0xE,
    75: 0xF,
    78: 0x0
  };

  return {

    init: function() {

      document.addEventListener('keydown', function(event) {
        if (event.keyCode in mapping) {
          keys[mapping[event.keyCode]] = true;
          event.preventDefault();
        }
      });

      document.addEventListener('keyup', function(event) {
        if (event.keyCode in mapping) {
          keys[mapping[event.keyCode]] = false;
        }
      });
    },

    reset: function() {

      for (var i = 0; i < keys.length; ++i)
        keys[i] = false;
    },

    down: function(key) {

      if (key === undefined) {
        return keys.some(function(down) { return down; });
      }

      return keys[key];
    }

  };

})();
