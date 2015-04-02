_ = require 'lodash'

class Input

  constructor: (@cheapo) ->

    # Keyboard state
    @keys = [off, off, off, off, off, off, off, off, off, off, off, off, off, off, off, off]

    # Mapping between modern keyboard and weird prehistoric hex keyboard
    @mapping =
      86: 0x0
      51: 0x1
      52: 0x2
      53: 0x3
      69: 0x4
      82: 0x5
      84: 0x6
      68: 0x7
      70: 0x8
      71: 0x9
      67: 0xA
      66: 0xB
      54: 0xC
      89: 0xD
      72: 0xE
      78: 0xF

    # Callback function called on key press
    @callback = null

    document.addEventListener 'keydown', ({keyCode}) =>
      if keyCode of @mapping
        @keys[@mapping[keyCode]] = on
        @callback?(@mapping[keyCode])

    document.addEventListener 'keyup', ({keyCode}) =>
      if keyCode of @mapping
        @keys[@mapping[keyCode]] = off

  reset: ->
    _.fill @keys, off
    @callback = null

  down: (key) ->
    @keys[key]




  ###


  var _keyboard = null;

  var _key_binding_listener = null;

  var toggle_visual_keyboard = function(on) {

    if (_keyboard)
      _keyboard.style.display = on ? 'table' : 'none';
  }

  return {


    get visual_keyboard() { return _keyboard.style.display != 'none' },
    set visual_keyboard(x) { toggle_visual_keyboard(x) },

      // Setup the visual keyboard

      _keyboard = document.querySelector('table#keyboard');

      var cells = _keyboard.querySelectorAll('td');
      for (var i = 0; i < cells.length; ++i) {

        var key = parseInt(cells[i].textContent[0], 16);

        var binding = document.createElement('span');
        for (var k in _mapping)
          if (_mapping[k] === key) {
            binding.textContent = String.fromCharCode(k);
            break;
          }
        cells[i].appendChild(binding);

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


    set_keys: function() {

      // Show the visual keyboard and start the key binding sequence

      if (!this.visual_keyboard)
        toggle_visual_keyboard(true);

      this.set_key(0, true);
    },

    set_key: function(key, loop) {

      // Change the style of the key being bound

      var cells = _keyboard.querySelectorAll('td');
      var hex = key.toString(16).toUpperCase();

      var cell = [].find.call(cells, function(c) {
        return c.textContent[0] == hex;
      });

      cell.className = 'setup';

      // Bind the Chip-8 key to the first pressed key

      var input = this;
      _key_binding_listener = document.addEventListener('keydown', function me(event) {

        // Check that the key was not already bound in this sequence

        if (_mapping[event.keyCode] !== undefined && _mapping[event.keyCode] < key) {
          console.warn('The ' + String.fromCharCode(event.keyCode) + ' key is already bound to ' + _mapping[event.keyCode].toString(16).toUpperCase());
          return;
        }

        // Remove the previous key

        for (var k in _mapping)
          if (_mapping[k] == key)
            delete _mapping[k];

        // Bind the new key

        _mapping[event.keyCode] = key;

        cell.className = '';
        cell.children[0].textContent = String.fromCharCode(event.keyCode);
        document.removeEventListener('keydown', me);

        // Continue the binding sequence with the next key

        if (loop && key < 0xF)
          input.set_key(key + 1, true);

  ###


module.exports = Input
