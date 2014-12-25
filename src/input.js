var X = X || {};

X.Input = (function() {

  'use strict';

  /**
    *
    */

  var keys = [false, false, false, false, false, false, false, false, false, false, false, false, false, false, false, false];

  /**
    *
    */

  var mapping = [];

  return {

    init: function() {

      document.addEventListener('keydown', function(event) {
        if (false) {
          event.preventDefault();
        }
      });

      document.addEventListener('keyup', function(event) {
        if (false) {

        }
      });
    },

    reset: function() {

    },

  };

})();
