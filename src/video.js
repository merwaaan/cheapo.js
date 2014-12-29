var X = X || {};

X.Video = (function() {

  'use strict';

  var ctx;

  var map = [];

  return {

    init: function() {

      var canvas = document.querySelector('canvas');
      this.ctx = canvas.getContext('2d');
      this.ctx.fillStyle = '#000000';
    },

    reset: function() {

      this.clear();

      // Reset the collision map
      for (var i = 0, l = this.ctx.canvas.width * this.ctx.canvas.height; i < l; ++i)
        map[i] = false;
    },

    sprite: function(address, x, y, n) {

      var collision = false;

      for (var i = 0; i < n; ++i)
        for (var j = 0; j < 8; ++j)
          if (X.Utils.bit(X.CPU.memory[address + i], 7 - j) && this.pixel(x + j, y + i))
            collision = true;

      return collision;
    },

    pixel: function(x, y) {

      var index = y * 8 + x;

      // XOR mode: erase and return a collision if a pixel is already here

      if (map[index]) {
        this.ctx.clearRect(x, y, 1, 1);
        map[index] = false;
        return true;
      }

      this.ctx.fillRect(x, y, 1, 1);
      map[index] = true;
      return false;
    },

    clear: function() {

      this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

  };

})();
