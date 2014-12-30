var X = X || {};

X.Video = (function() {

  'use strict';

  var ctx;

  var map = [];

  /**
    * Colors
    */

  var _color = [0, 0, 0];
  var _background = [255, 255, 255];

  function css_color(color) {
    return '#' + color.map(function(i){ return parseInt(i).toString(16) }).join('');
  }

  function set_color(color) {

    for (var i = 0; i < 3; ++i)
      _color[i] = color[i];

    ctx.fillStyle = css_color(color);
  }

  function set_background(color) {

    for (var i = 0; i < 3; ++i)
      _background[i] = color[i];

    document.querySelector('canvas').style.backgroundColor = css_color(color);
  }

  /**
    * Canvas size
    */

  var _scale = 1;

  function set_scale(scale) {

    _scale = scale;

    ctx.canvas.width = 64 * _scale;
    ctx.canvas.height = 32 * _scale;

    redraw();
  }

  function redraw() {

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // XXX weird bug when changing the scale before playing a game

    for (var i = 0; i < map.length; ++i)
      if (map[i])
        ctx.fillRect((i % 64) * _scale, parseInt(i / 64) * _scale, _scale, _scale);
  }

  return {

    get color() { return _color }, set color(x) { set_color(x) },
    get background() { return _background }, set background(x) { set_background(x) },

    get scale() { return _scale }, set scale(x) { set_scale(x) },

    wrap: false,

    init: function() {

      var canvas = document.querySelector('canvas');
      ctx = canvas.getContext('2d');
      ctx.fillStyle = '#000000';
    },

    reset: function() {

      this.clear();

      // Reset the collision map
      for (var i = 0, l = ctx.canvas.width * ctx.canvas.height; i < l; ++i)
        map[i] = false;
    },

    sprite: function(address, x, y, n) {

      var collision = false;

      if (n == 0) // Otherwise HAP is not drawn in EMUTEST (wtf?)
        n = 16;

      for (var i = 0; i < n; ++i)
        for (var j = 0; j < 8; ++j)
          if (X.Utils.bit(X.CPU.memory[address + i], 7 - j) && this.pixel(x + j, y + i))
            collision = true;

      return collision;
    },

    pixel: function(x, y) {

      // Wrap the coordinates around the canvas

      if (this.wrap) {
        x %= ctx.canvas.width;
        y %= ctx.canvas.height;
      }

      // XOR mode: erase and return a collision if a pixel is already here

      var index = y * ctx.canvas.width + x;

      if (map[index]) {
        ctx.clearRect(x * _scale, y * _scale, _scale, _scale);
        map[index] = false;
        return true;
      }

      ctx.fillRect(x * _scale, y * _scale, _scale, _scale);
      map[index] = true;
      return false;
    },

    clear: function() {

      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

  };

})();
