var X = X || {};

X.Chip8 = (function() {

  'use strict';

  return {

    running: false,

    init: function() {

      // Initialize all modules

      X.CPU.init();
      X.Video.init();
      X.Audio.init();
      X.Input.init();

      // Reset everything when a game is inserted

      var chip8 = this;

      var local_rom_select = document.querySelector('input#local_rom');
      local_rom_select.selectedIndex = -1;
      local_rom_select.addEventListener('change', function() {

        var reader = new FileReader();
        reader.addEventListener('load', function() {
          chip8.load(this.result);
        });

        reader.readAsArrayBuffer(this.files[0]);
      });

      var hosted_rom_select = document.querySelector('select#hosted_rom');
      hosted_rom_select.addEventListener('change', function(event) {

        var name = event.target.selectedOptions[0].textContent;

        var request = new XMLHttpRequest();
        request.open('GET', 'roms/' + name + '.gb', true);
        request.responseType = 'arraybuffer';

        request.onload = function() {
          chip8.load(request.response);
        };

        request.send(null);
      });
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
      //this.run();
    },

    run: function() {
      if (!this.running) {
        this.running = true;
        requestAnimationFrame(this.frame.bind(this));
      }
    },

    pause: function() {
      this.running = false;
    },

    frame: function(time) {

      X.CPU.step();

      // Repeat...
      if (this.running)
        requestAnimationFrame(this.frame.bind(this));
    }

  };

})();
