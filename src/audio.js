var Cheapo = Cheapo || {};

Cheapo.Audio = (function() {

  'use strict';

  var _ctx = null;
  var _oscillator = null;
  var _gain = null;

  var _playing = false;

  function create_oscillator() {

    var frequency = _oscillator ? _oscillator.frequency.value : 300;

    _oscillator = _ctx.createOscillator();
    _oscillator.type = 0;
    _oscillator.frequency.value = frequency;
    _oscillator.connect(_gain);
  }

  return {

    get volume() { return _gain.gain.value * 100 },
    set volume(x) { _gain.gain.value = x / 100; },

    get frequency() { return _oscillator.frequency.value },
    set frequency(x) { _oscillator.frequency.value = x; },

    get playing() { return _playing },

    init: function() {

      _ctx = new window.AudioContext();

      _gain = _ctx.createGain();
      _gain.gain.value = 0.25;
      _gain.connect(_ctx.destination);

      create_oscillator();
    },

    reset: function() {

      this.toggle(false);
      _playing = false;
    },

    toggle: function(on) {

      if (on && !_playing) {
        _oscillator.start();
        _playing = true;
      }
      else if (!on && _playing) {
        _oscillator.stop();
        _playing = false;
        create_oscillator(); // Prepare a new oscillator for the next tone
      }
    }

  };

})();
