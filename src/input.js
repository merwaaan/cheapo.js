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
    86: 0x0,
    51: 0x1,
    52: 0x2,
    53: 0x3,
    69: 0x4,
    82: 0x5,
    84: 0x6,
    68: 0x7,
    70: 0x8,
    71: 0x9,
    67: 0xA,
    66: 0xB,
    54: 0xC,
    89: 0xD,
    72: 0xE,
    78: 0xF
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
