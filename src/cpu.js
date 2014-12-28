var X = X || {};

X.CPU = (function() {

//  'use strict';

  var memory;

  /**
    * Generic instructions
    */

  var instructions = {

    ADD: function(params) {
      var x = params[0].get() + params[1].get();
      params[0].set(x & 0xFF);
      X.CPU.V[0xF] = x > 0xFF ? 1 : 0;
    },

    AND: function(params) {
      a &= b;
      params[0].set(params[0].get() & params[1].get());
    },

    CALL: function(params) {
      X.CPU.stack[++X.CPU.SP] = X.CPU.PC;
      X.CPU.PC = params[0].get();
    },

    CLS: function() {
      X.Video.clear();
    },

    DRW: function(params) {

    },

    LD: function(params) {
      params[0].set(params[1].get());
    },

    LD_keypress: function(params) {

    },

    LD_sprite: function(params) {

    },

    LD_bcd: function(params) {

    },

    JP: function(params) {
      X.CPU.PC = params[0].get() + (params.length > 1 ? params[1].get() : 0);
    },

    OR: function(params) {
      params[0].set(params[0].get() | params[1].get());
      a |= b;
    },

    RET: function() {
      X.CPU.PC = X.CPU.stack[X.CPU.SP--];
    },

    RND: function(params) {
      var x = Math.floor(Math.random() * 0xFF);
      params[0].set(x & params[1].get());
    },

    SE: function(params) {
      if (params[0].get() == params[1].get())
        X.CPU.PC += 2;
    },

    SHL: function(params) {
      X.CPU.V[0xF] = X.Utils.bit(params[0].get(), 7) ? 1 : 0;
      params[0].set((params[0].get() << 1) & 0xFF);
    },

    SHR: function(params) {
      X.CPU.V[0xF] = X.Utils.bit(params[0].get(), 0) ? 1 : 0;
      params[0].set(params[0].get() >> 1);
    },

    SKP: function(params) {
      if (X.Input.down(params[0].get()))
        X.CPU.PC += 2;
    },

    SKNP: function(params) {
      if (X.Input.up(params[0].get()))
        X.CPU.PC += 2;
    },

    SNE: function(params) {
      if (params[0].get() != params[1].get())
        X.CPU.PC += 2;
    },

    SUB: function(params) {
      a = (a - b) & 0xFF;
      X.CPU.V[0xF] = a > b ? 1 : 0;
    },

    SUBN: function(a, b) {
      b = (b - a) & 0xFF;
      X.CPU.V[0xF] = b > a ? 1 : 0;
    },

    XOR: function(a, b) {
      a ^= b;
    }

  };

  /**
    * Accessors to feed different values to the instructions depending on the opcode
    */

  var accessors = {
    Vx: { get: function(x) { return X.CPU.V[x]; }, set: function(x, val) { X.CPU.V[x] = val; } },
    V0: { get: function(x) { return X.CPU.V[0]; }, set: function(x, val) { X.CPU.V[0] = val; } },
    I: { get: function(x) { return X.CPU.I; }, set: function(x, val) { X.CPU.I = val; } },
    DT: { get: function(x) { return X.CPU.DT; }, set: function(x, val) { X.CPU.DT = val; } },
    ST: { get: function(x) { return X.CPU.ST; }, set: function(x, val) { X.CPU.ST = val; } },
    value: { get: function(x) { return x; } }
  };

  /**
    *
    */

  var jumptable = {};

  function register(pattern, instruction, accessors) {

    // Isolate the "wildcards" in the opcode pattern
    // eg. '8xy0' -> ['x', 'y']

    var wildcards = pattern.match(/x|y|nnn|n|kk/g);

    // If there is no wildcard (unique opcode) just put the
    // instruction in the jumptable

    if (!wildcards) {
      jumptable[parseInt(pattern, 16)] = {
        instruction: instruction,
      };
    }

    // If there are wildcards, enumerate the possible opcodes and
    // fill the jumptable with the instruction and precomputed parameters

    else {

      var wildcards_length = wildcards.reduce(function(sum, wildcard) { return sum + wildcard.length; }, 0);
      var range = Math.pow(2, wildcards_length * 4);

      var before = pattern.slice(0, pattern.indexOf(wildcards[0]));
      var after = pattern.slice(before.length+wildcards_length);

      var accessors = Array.prototype.slice.call(arguments, 2);

      for (var i = 0; i < range; ++i) {

        var chunk = X.Utils.pad(i.toString(16), '0', wildcards_length);
        var opcode = before + chunk + after;

        var parameters = [];

        var cursor = before.length;
        for (var j = 0; j < wildcards.length; ++j) {

          var parameter = parseInt(opcode.slice(cursor, cursor + wildcards[j].length), 16);

          parameters.push(
            function(accessor, parameter) {
              return {
                get: function() { return accessor.get(parameter); },
                set: function(x) { accessor.set(parameter, x); }
              };
            }(accessors[j], parameter)
          );

          cursor += wildcards[j].length;
        }

        var opcode_data = {
          instruction: instruction,
          parameters: parameters
        };

        jumptable[parseInt(opcode, 16)] = opcode_data;
      }
    }
  };

  return {

    /**
      * Registers
      */

    V: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    I: 0,

    stack: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    SP: 0,

    PC: 0,

    DT: 0,
    ST: 0,

    /**
      *
      */

    init: function() {

      register('00E0', instructions.CLS);
      register('00EE', instructions.RET);
      register('1nnn', instructions.JP, accessors.value);
      register('2nnn', instructions.CALL, accessors.value);
      register('3xkk', instructions.SE, accessors.Vx, accessors.value);
      register('4xkk', instructions.SNE, accessors.Vx, accessors.value);
      register('5xy0', instructions.SE, accessors.Vx, accessors.Vx);
      register('6xkk', instructions.LD, accessors.Vx, accessors.value);
      register('7xkk', instructions.ADD, accessors.Vx, accessors.value);
      register('8xy0', instructions.LD, accessors.Vx, accessors.Vx);
      register('8xy1', instructions.OR, accessors.Vx, accessors.Vx);
      register('8xy2', instructions.AND, accessors.Vx, accessors.Vx);
      register('8xy3', instructions.XOR, accessors.Vx, accessors.Vx);
      register('8xy4', instructions.ADD, accessors.Vx, accessors.Vx);
      register('8xy5', instructions.SUB, accessors.Vx, accessors.Vx);
      register('8xy6', instructions.SHR, accessors.Vx, accessors.Vx);
      register('8xy7', instructions.SUBN, accessors.Vx, accessors.Vx);
      register('8xyE', instructions.SHL, accessors.Vx, accessors.Vx);
      register('9xy0', instructions.SNE, accessors.Vx, accessors.Vx);
      register('Annn', instructions.LD, accessors.I, accessors.value);
      register('Bnnn', instructions.JP, accessors.value, accessors.V0);
      register('Cxkk', instructions.RND, accessors.Vx, accessors.value);
      register('Dxyn', instructions.DRW, accessors.Vx, accessors.Vx, accessors.value);
      register('Ex9E', instructions.SKP, accessors.Vx);
      register('ExA1', instructions.SKNP, accessors.Vx);
      register('Fx07', instructions.LD, accessors.Vx, accessors.DT);
      register('Fx0A', instructions.LD_keypress, accessors.Vx);
      register('Fx15', instructions.LD, accessors.DT, accessors.Vx);
      register('Fx18', instructions.LD, accessors.ST, accessors.VX);
      register('Fx1E', instructions.ADD, accessors.I, accessors.Vx);
      register('Fx29', instructions.LD_sprite, accessors.Vx);
      register('Fx33', instructions.LD_bcd, accessors.Vx);
      register('Fx55', instructions.LD, accessors.I_, accessors.Vx);
      register('Fx65', instructions.LD, accessors.Vx, accessors.I_);

      console.log(jumptable);
    },

    reset: function() {

      this.PC = 0x200;
    },

    load: function(buffer) {

      this.memory = new Uint8Array(buffer);
    },

    step: function() {

      // Get the current opcode

      var opcode = (this.memory[X.CPU.PC] << 2) & this.memory[X.CPU.PC + 1];

      // Fetch the implementation cached in the jumptable

      var opcode_data = jumptable[opcode];
      if (!opcode_data)
        console.log('Undefined opcode');

      // Execute

      opcode_data.instruction(opcode_data.parameters);

      X.CPU.PC += 2;
    },

  };

})();
