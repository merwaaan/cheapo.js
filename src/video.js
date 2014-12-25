var X = X || {};

X.Video = (function() {

  'use strict';

  var ctx;

  return {

    init: function() {

      var canvas = document.querySelector('canvas');
      ctx = canvas.getContext('2d');
    },

    reset: function() {

    },

    pixel: function(x, y) {

    },

    clear: function() {

    }

  };

})();
