var Cheapo = Cheapo || {};

Cheapo.Main = (function() {

  'use strict';

  var _interval_delay = 30;
  var _interval = null;
  var _last_frame = null;
  var _ticks_rest = 0;

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
      _interval = setInterval(this.frame, _interval_delay);
    },

    stop: function() {

      clearInterval(_interval);
    },

    frame: function(time) {

      var now = window.performance.now();
      var diff = now - _last_frame;

      var ticks = diff / 1000 * Cheapo.CPU.frequency + _ticks_rest;
      _ticks_rest = ticks % 1; // Keep the "part-tick" not consumed in this frame for the next one
      ticks = Math.floor(ticks);

      var tick_duration = diff / ticks;
      for (var i = 0; i < ticks; ++i)
        Cheapo.CPU.step(tick_duration);

      _last_frame = now;
    }

  };

})();
