var X = X || {};

X.Video = (function() {

  'use strict';

  var ctx;

  return {

    init: function() {

      var canvas = document.querySelector('canvas');
      this.ctx = canvas.getContext('2d');
      this.ctx.fillStyle = '#000000';
    },

    reset: function() {

      this.clear();
    },

    sprite: function(address, x, y, n) {
      // TODO addr
      this.ctx.fillRect(x, y, 8, n);
      return false; // TODO collision
    },

    pixel: function(x, y) {

    },

    clear: function() {

      this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

  };

})();
