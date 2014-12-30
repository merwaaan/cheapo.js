var Cheapo = Cheapo || {};

Cheapo.Video = (function() {

  'use strict';

  var _ctx = null;

  var _map = [];

  /**
    * Colors
    */

  var _color = [0x2F, 0xA1, 0xD6];
  var _background = [255, 255, 255];

  function css_color(color) {
    return '#' + color.map(function(i){ return parseInt(i).toString(16) }).join('');
  }

  function set_color(color) {

    for (var i = 0; i < 3; ++i)
      _color[i] = color[i];

    _ctx.fillStyle = css_color(color);
  }

  function set_background(color) {

    for (var i = 0; i < 3; ++i)
      _background[i] = color[i];

    document.querySelector('canvas').style.backgroundColor = css_color(color);
  }

  /**
    * Canvas size
    */

  var _scale = 6;

  function set_scale(scale) {

    _scale = scale;

    _ctx.canvas.width = 64 * _scale;
    _ctx.canvas.height = 32 * _scale;

    redraw();
  }

  function redraw() {

    _ctx.clearRect(0, 0, _ctx.canvas.width, _ctx.canvas.height);

    // XXX weird bug when changing the scale before playing a game
    // XXX also bugs when scaling (not clearinf properly)

    for (var i = 0; i < _map.length; ++i)
      if (_map[i])
        _ctx.fillRect((i % 64) * _scale, parseInt(i / 64) * _scale, _scale, _scale);
  }

  return {

    get color() { return _color }, set color(x) { set_color(x) },
    get background() { return _background }, set background(x) { set_background(x) },

    get scale() { return _scale }, set scale(x) { set_scale(x) },

    wrap: false,

    init: function() {

      var canvas = document.querySelector('canvas');
      _ctx = canvas.getContext('2d');
      set_color(_color);
    },

    reset: function() {

      this.clear();

      // Reset the collision _map
      for (var i = 0, l = _ctx.canvas.width * _ctx.canvas.height; i < l; ++i)
        _map[i] = false;
    },

    sprite: function(address, x, y, n) {

      var collision = false;

      // A height of 0 draws the whole 16px sprite

      if (n == 0)
        n = 16;

      // Loop through the pixels

      for (var i = 0; i < n; ++i) {

        var line = Cheapo.CPU.memory[address + i];

        for (var j = 0; j < 8; ++j)
          if (!!(line & 1 << (7 - j)) && this.pixel(x + j, y + i))
            collision = true;
      }

      return collision;
    },

    pixel: function(x, y) {

      // Wrap the coordinates around the canvas

      if (this.wrap) {
        x %= _ctx.canvas.width;
        y %= _ctx.canvas.height;
      }

      // XOR mode: erase and return a collision if a pixel is already here

      var index = y * _ctx.canvas.width + x;

      if (_map[index]) {
        _ctx.clearRect(x * _scale, y * _scale, _scale, _scale);
        _map[index] = false;
        return true;
      }

      _ctx.fillRect(x * _scale, y * _scale, _scale, _scale);
      _map[index] = true;
      return false;
    },

    clear: function() {

      _ctx.clearRect(0, 0, _ctx.canvas.width, _ctx.canvas.height);
    }

  };

})();
