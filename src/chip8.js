var X = X || {};

X.Chip8 = (function() {

  'use strict';

  var _interval = null;
  var _last_frame = null;
  var _tick_rest = 0;

  return {

    init: function() {

      X.CPU.init();
      X.Video.init();
      X.Audio.init();
      X.Input.init();
    },

    reset: function() {

      X.CPU.reset();
      X.Video.reset();
      X.Audio.reset();
      X.Input.reset();
    },

    load: function(buffer) {

      this.reset();
      X.CPU.load(buffer);
      this.run();
    },

    run: function() {

      _last_frame = window.performance.now();
      _interval = setInterval(this.frame, 30);
    },

    pause: function() {

      clearInterval(_interval);
    },

    frame: function(time) {

      var now = window.performance.now();
      var ticks = (now - _last_frame) / 1000 * X.CPU.frequency + _tick_rest;
      _tick_rest = ticks % 1;

      for (var i = 0, t = Math.floor(ticks); i < t; ++i)
        X.CPU.step();

      _last_frame = now;
    }

  };

})();
