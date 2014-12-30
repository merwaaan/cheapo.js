var X = X || {};

X.Chip8 = (function() {

  'use strict';

  return {

    running: false,
    interval: null,

    init: function() {

      // Initialize all modules

      X.CPU.init();
      X.Video.init();
      X.Audio.init();
      X.Input.init();

      // Reset everything when a game is inserted

      var chip8 = this;

      var local_rom_select = document.querySelector('input#local_rom');
      local_rom_select.addEventListener('change', function() {

        var reader = new FileReader();
        reader.addEventListener('load', function() {
          chip8.load(this.result);
        });

        reader.readAsArrayBuffer(this.files[0]);
      });
    },

    reset: function() {

      X.CPU.reset();
      X.Video.reset();
      X.Audio.reset();
      X.Input.reset();
    },

    load: function(name) {

      var request = new XMLHttpRequest();
      request.open('GET', 'roms/' + name, true);
      request.responseType = 'arraybuffer';

      request.onload = function() {
        X.Chip8.reset();
        X.CPU.load(request.response);
        //X.Chip8.run();
      };

      request.send(null);
    },

    run: function() {

      if (!this.running) {
        this.running = true;
        this.interval = setInterval(this.frame, 10);
        //requestAnimationFrame(this.frame.bind(this));
      }
    },

    pause: function() {

      this.running = false;
    },

    frame: function(time) {

      for (var i = 0; i < 1; ++i)
        X.CPU.step();

      // Repeat...
      /*if (this.running)
        requestAnimationFrame(this.frame.bind(this));
        */
    }

  };

})();
