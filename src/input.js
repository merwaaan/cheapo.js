var Cheapo = Cheapo || {};

Cheapo.Input = (function() {

  'use strict';

  /**
    * Keyboard state
    */

  var _keys = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];

  /**
    * Mapping between modern keyboard and weird prehistoric hex keyboard
    */

  var _mapping = {
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

    // Callback function called on key press
    callback: null,

    init: function() {

      document.addEventListener('keydown', function(event) {
        if (event.keyCode in _mapping) {

          _keys[_mapping[event.keyCode]] = true;

          if (this.callback)
            this.callback(_mapping[event.keyCode]);
        }
      }.bind(this));

      document.addEventListener('keyup', function(event) {
        if (event.keyCode in _mapping) {

          _keys[_mapping[event.keyCode]] = false;
        }
      });
    },

    reset: function() {

      for (var i = 0; i < _keys.length; ++i)
        _keys[i] = false;

      this.callback = null;
    },

    down: function(key) {

      return _keys[key];
    }

  };

})();
