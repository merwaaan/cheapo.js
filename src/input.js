var X = X || {};

X.Input = (function() {

  'use strict';

  /**
    *
    */

  var _keys = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];

  /**
    *
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

    init: function() {

      document.addEventListener('keydown', function(event) {
        if (event.keyCode in _mapping) {
          _keys[_mapping[event.keyCode]] = true;
          event.preventDefault();
        }
      });

      document.addEventListener('keyup', function(event) {
        if (event.keyCode in _mapping) {
          _keys[_mapping[event.keyCode]] = false;
        }
      });
    },

    reset: function() {

      for (var i = 0; i < _keys.length; ++i)
        _keys[i] = false;
    },

    down: function(key) {

      return _keys[key];
    },

    any: function() {

      for (var i = 0; i < _keys.length; ++i)
        if (_keys[i])
          return i;

      return null;
    }

  };

})();
