var Cheapo = Cheapo || {};

Cheapo.Video = (function() {

  'use strict';

  var _ctx = null;

  var _map = [];

  /**
    * Colors
    */

  var _color = [0x2F, 0xA1, 0xD6];
  var _background = [0xFF, 0xFF, 0xFF];

  function css_color(color) {
    return '#' + color.map(function(i){ return ('0' + parseInt(i).toString(16)).substr(-2) }).join('');
  }

  function set_color(color) {

    _color = color;
    _ctx.fillStyle = css_color(color);

    redraw();
  }

  function set_background(color) {

    _background = color;
    _ctx.canvas.style.backgroundColor = css_color(color);
  }

  /**
    * Screen size & position
    */

  var _resolution = {x: 64, y:32};
  var _scrolling = {x: 0, y: 0};
  var _scale = 1;

  function set_scale(scale) {

    _scale = scale;

    _ctx.canvas.width = 128 * _scale;
    _ctx.canvas.height = 64 * _scale;

    // Set the color again (was reset) and redraw
    set_color(_color);
  }

  function redraw() {

    _ctx.clearRect(0, 0, _ctx.canvas.width, _ctx.canvas.height);

    var multiplier = _resolution.x == 128 ? 1 : 2;

    for (var i = 0; i < _map.length; ++i)
      if (_map[i])
        _ctx.fillRect((i % _resolution.x) * _scale * multiplier, Math.floor(i / _resolution.x) * _scale * multiplier, _scale * multiplier, _scale * multiplier);
  }

  return {

    get color() { return _color }, set color(x) { set_color(x) },
    get background() { return _background }, set background(x) { set_background(x) },

    get extended() { return _resolution.x == 128 },
    get scale() { return _scale }, set scale(x) { set_scale(x) },

    wrap: true,

    init: function() {

      var canvas = document.querySelector('canvas');
      _ctx = canvas.getContext('2d');
      set_color(_color);

      // Initialize the collision map

      _map = [];
      for (var i = 0, l = _resolution.x * _resolution.y; i < l; ++i)
        _map.push(false);
    },

    reset: function() {

      _resolution.x = 64;
      _resolution.y = 32;
      _scrolling.x = _scrolling.y = 0;

      this.clear();
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

      // Out-of-bounds pixels are not drawn (no wrapping)

      if (x < 0 || x >= _resolution.x || y < 0 || y >= _resolution.y)
        return;

      // Compute the pixel coordinates.
      // The canvas always has the resolution of extended mode but in
      // non-extended mode, a pixel is drawn as a 2x2 square.

      var index = y * _resolution.x + x;

      var x_canvas = x * _scale * (this.extended ? 1 : 2);
      var y_canvas = y * _scale * (this.extended ? 1 : 2);
      var s_canvas = _scale * (this.extended ? 1 : 2);

      // XOR mode: erase and return a collision if a pixel is already here

      if (_map[index]) {
        _ctx.clearRect(x_canvas, y_canvas, s_canvas, s_canvas);
        _map[index] = false;
        return true;
      }

      _ctx.fillRect(x_canvas, y_canvas, s_canvas, s_canvas);
      _map[index] = true;
      return false;
    },

    clear: function() {

      _ctx.clearRect(0, 0, _ctx.canvas.width, _ctx.canvas.height);

      for (var i = 0; i < _map.length; ++i)
        _map[i] = false;
    },

    scroll: function(x, y) {

      _scrolling.x += x;
      _scrolling.y += y;
    },

    extend: function(on) {

      _resolution = on ?
        {x: 128, y:64} :
        {x: 64, y:32};

      // Resize the map

      _map = [];
      for (var i = 0, l = _resolution.x * _resolution.y; i < l; ++i)
        _map.push(false);
    }

  };

})();
