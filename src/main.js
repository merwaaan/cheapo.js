var Cheapo = Cheapo || {};

Cheapo.Main = (function() {

  'use strict';

  var _interval = null;
  var _last_frame = null;
  var _tick_rest = 0;

  return {

    init: function() {

      Cheapo.CPU.init();
      Cheapo.Video.init();
      Cheapo.Audio.init();
      Cheapo.Input.init();
    },

    reset: function() {

      Cheapo.CPU.reset();
      Cheapo.Video.reset();
      Cheapo.Audio.reset();
      Cheapo.Input.reset();
    },

    load: function(buffer) {

      this.reset();
      Cheapo.CPU.load(buffer);
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
      var diff = now - _last_frame;
      var ticks = diff / 1000 * Cheapo.CPU.frequency + _tick_rest;
      _tick_rest = ticks % 1;

      for (var i = 0, t = Math.floor(ticks); i < t; ++i)
        Cheapo.CPU.step(diff);

      _last_frame = now;
    }

  };

})();
