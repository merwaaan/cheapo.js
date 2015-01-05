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

  /**
    * HTML table containing a visual keyboard.
    */

  var _keyboard = null;

  var toggle_visual_keyboard = function(on) {

    if (_keyboard)
      _keyboard.style.display = on ? 'table' : 'none';
  }

  return {

    // Callback function called on key press
    callback: null,

    get visual_keyboard() { return _keyboard.style.display != 'none' }, set visual_keyboard(x) { toggle_visual_keyboard(x) },

    init: function() {

      // Setup event listeners on key down and key up

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

      // Setup the visual keyboard

      _keyboard = document.querySelector('table#keyboard');

      var cells = _keyboard.querySelectorAll('td');
      for (var i = 0; i < cells.length; ++i) {

        var key = parseInt(cells[i].innerHTML, 16);

        cells[i].addEventListener('mousedown', function(key) {
          return function() {

            _keys[key] = true;

            if (this.callback)
              this.callback(key);
          }.bind(this)
        }.call(this, key));

        cells[i].addEventListener('mouseup', function(key) {
          return function() {

            _keys[key] = false;
          }
        }(key));
      }
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
