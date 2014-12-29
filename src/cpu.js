var X = X || {};

X.CPU = (function() {

  'use strict';

  var waiting_register = null;

  var font = [
    0xF0, 0x90, 0x90, 0x90, 0xF0,
    0x20, 0x60, 0x20, 0x20, 0x70,
    0xF0, 0x10, 0xF0, 0x80, 0xF0,
    0xF0, 0x10, 0xF0, 0x10, 0xF0,
    0x90, 0x90, 0xF0, 0x10, 0x10,
    0xF0, 0x80, 0xF0, 0x10, 0xF0,
    0xF0, 0x10, 0x20, 0x40, 0x40,
    0xF0, 0x90, 0xF0, 0x90, 0xF0,
    0xF0, 0x90, 0xF0, 0x10, 0xF0,
    0xF0, 0x90, 0xF0, 0x90, 0x90,
    0xE0, 0x90, 0xE0, 0x90, 0xE0,
    0xF0, 0x80, 0x80, 0x80, 0xF0,
    0xE0, 0x90, 0x90, 0x90, 0xE0,
    0xF0, 0x80, 0xF0, 0x80, 0xF0,
    0xF0, 0x80, 0xF0, 0x80, 0x80
  ];

  /**
    * Generic instructions
    */

  var instructions = {

    ADD: function(params) {
      var x = params[0].get() + params[1].get();
      X.CPU.V[0xF] = x > 0xFF ? 1 : 0;
      params[0].set(x & 0xFF);
    },

    ADD_nocarry: function(params) {
      params[0].set((params[0].get() + params[1].get()) & 0xFF);
    },

    AND: function(params) {
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
      X.CPU.V[0xF] = X.Video.sprite(X.CPU.I, params[0].get(), params[1].get(), params[2].get()) ? 1 : 0;
    },

    LD: function(params) {
      params[0].set(params[1].get());
    },

    LD_bcd: function(params) {
      var x = params[0].get();
      x -= (X.CPU.memory[I] = Math.floor(x/100));
      x -= (X.CPU.memory[I+1] = Math.floor(x/10));
      X.CPU.memory[I+2] = x;
    },

    LD_keypress: function(params) {
      waiting_register = params[0].get();
    },

    LD_font: function(params) {
      X.CPU.I = params[0].get() * 5;
    },

    LD_I_regs: function(params) {
      var x = params[0].get();
      for (var i = 0; i <= x; ++i)
        X.CPU.memory[X.CPU.I + i] = X.CPU.V[i];
      X.CPU.I += x + 1;
    },

    LD_regs_I: function(params) {
      var x = params[0].get();
      for (var i = 0; i <= x; ++i)
        X.CPU.V[i] = X.CPU.memory[X.CPU.I + i];
      X.CPU.I += x + 1;
    },

    JP: function(params) {
      X.CPU.PC = params[0].get() + (params.length > 1 ? params[1].get() : 0);
    },

    OR: function(params) {
      params[0].set(params[0].get() | params[1].get());
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
      var b = params[1].get();
      X.CPU.V[0xF] = X.Utils.bit(b, 7) ? 1 : 0;
      b = (b << 1) & 0xFF;
      params[0].set(b);
      params[1].set(b);
    },

    SHR: function(params) {
      var b = params[1].get();
      X.CPU.V[0xF] = X.Utils.bit(b, 0) ? 1 : 0;
      b >>= 1;
      params[0].set(b);
      params[1].set(b);
    },

    SKP: function(params) {
      if (X.Input.down(params[0].get()))
        X.CPU.PC += 2;
    },

    SKNP: function(params) {
      if (!X.Input.down(params[0].get()))
        X.CPU.PC += 2;
    },

    SNE: function(params) {
      if (params[0].get() != params[1].get())
        X.CPU.PC += 2;
    },

    SUB: function(params) {
      var a = params[0].get(), b = params[1].get();
      params[0].set((a - b) & 0xFF);
      X.CPU.V[0xF] = a < b ? 0 : 1;
    },

    SUBN: function(a, b) {
      var a = params[0].get(), b = params[1].get();
      params[0].set((b - a) & 0xFF);
      X.CPU.V[0xF] = b < a ? 0 : 1;
    },

    XOR: function(a, b) {
      params[0].set(params[0].get() ^ params[1].get());
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

    memory: [],

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
      register('7xkk', instructions.ADD_nocarry, accessors.Vx, accessors.value);
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
      register('Fx0A', instructions.LD_keypress, accessors.value);
      register('Fx15', instructions.LD, accessors.DT, accessors.Vx);
      register('Fx18', instructions.LD, accessors.ST, accessors.VX);
      register('Fx1E', instructions.ADD, accessors.I, accessors.Vx);
      register('Fx29', instructions.LD_font, accessors.Vx);
      register('Fx33', instructions.LD_bcd, accessors.Vx);
      register('Fx55', instructions.LD_I_regs, accessors.Vx);
      register('Fx65', instructions.LD_regs_I, accessors.Vx);

      console.log(jumptable);
    },

    reset: function() {

      this.PC = 0x200;

      // Put the font data at 0
      for (var i = 0; i < font.length; ++i)
        this.memory[i] = font[i];

      // Zero the rest of the memory
      for (var i = font.length; i < 0x10000; ++i)
        this.memory[i] = 0;

    },

    load: function(buffer) {

      for (var i = 0; i < buffer.length; ++i)
        this.memory[0x200 + i] = buffer[i]; // TODO 8b?
    },

    step: function() {

      // Check for user input after a wait instruction

      if (waiting_register) {
        if (X.Input.down())
          waiting_register = null; // TODO put key in reg
        else
          return;
      }

      // Get the current opcode

      var opcode = (this.memory[X.CPU.PC] << 8) | this.memory[X.CPU.PC + 1];

      // Fetch the implementation cached in the jumptable

      var opcode_data = jumptable[opcode];
      if (!opcode_data)
        console.log('Undefined opcode [%s]', opcode.toString(16));
      /*else
        console.log(opcode.toString(16), opcode_data.instruction.prototype);
*/
      // Execute

      opcode_data.instruction(opcode_data.parameters);

      X.CPU.PC += 2;
    },

  };

})();
