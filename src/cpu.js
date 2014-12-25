var X = X || {};

X.CPU = (function() {

  'use strict';

  var memory;

  /**
    * Generic instructions
    */

  var instructions = {

    ADD: function(a, b) {
      var x = a + b;
      a = x & 0xFF;
      X.CPU.V[0xF] = x > 0xFF ? 1 : 0;
    },

    AND: function(a, b) {
      a &= b;
    },

    CALL: function(a) {
      X.CPU.stack[++X.CPU.SP] = X.CPU.PC;
      X.CPU.PC = a;
    },

    CLS: function() {
      X.Video.clear();
    },

    DRW: function(a, b, c) {

    },

    LD: function(a, b) {
      a.set(b.get());
    },

    LD_keypress: function(a, b) {

    },

    LD_sprite: function(a, b) {

    },

    LD_bcd: function(a, b) {

    },

    JP: function(a, offset) {
      X.CPU.PC = a + offset;
    },

    OR: function(a, b) {
      a |= b;
    },

    RET: function() {
      X.CPU.PC = X.CPU.stack[X.CPU.SP--];
    },

    RND: function(a, b) {
      var x = Math.floor(Math.random() * 0xFF)
      a = x & b;
    },

    SE: function(a, b) {
      if (a == b)
        X.CPU.PC += 2;
    },

    SHL: function(a, b) {
      X.CPU.V[0xF] = X.Utils.bit(a, 7) ? 1 : 0;
      a = (a << 1) & 0xFF;
    },

    SHR: function(a, b) {
      X.CPU.V[0xF] = X.Utils.bit(a, 0) ? 1 : 0;
      a >>= 1;
    },

    SKP: function(a) {
      if (X.Input.down(a))
        X.CPU.PC += 2;
    },

    SKNP: function(a) {
      if (X.Input.up(a))
        X.CPU.PC += 2;
    },

    SNE: function(a, b) {
      if (a != b)
        X.CPU.PC += 2;
    },

    SUB: function(a, b) {
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

    Vx: {
      get: function(x) { return X.CPU.V[x]; },
      set: function(x, val) { X.CPU.V[x] = val; }
    },

    V0: {
      get: function(x) { return X.CPU.V[0]; },
      set: function(x, val) { X.CPU.V[0] = val; }
    },

    I: {
      get: function(x) { return X.CPU.I; },
      set: function(x, val) { X.CPU.I = val; }
    },

    DT: {
      get: function(x) { return X.CPU.DT; },
      set: function(x, val) { X.CPU.DT = val; }
    },

    ST: {
      get: function(x) { return X.CPU.ST; },
      set: function(x, val) { X.CPU.ST = val; }
    },

    value: {
      get: function(x) { return x; },
      set: function(x, val) { x = val; }
    }

  };

  var jumptable = {};

  function register(opcode, instruction, accessors) {

    // Isolate the "wildcards"

    var wildcards = [];
    var regex = /x|y|nnn|n|kk/g;

    var wildcard;
    while (wildcard = regex.exec(opcode)) {
      wildcards.push(wildcard);
    }

    if (wildcards.length > 0) {
      var before = opcode.slice(0, wildcards[0].index);
      var after = opcode.slice(wildcards[wildcards.length-1].index + wildcards[wildcards.length-1][0].length);
      var length = 4 - before.length - after.length;
    }

    // Prepare the data to be cached in the jumptable

    var args = Array.prototype.slice.call(arguments);

    var opcode_data = {

      instruction: instruction,
      accessors: args.slice(2, args.length),

      parser: function(opcode) {
        var parameters = [];
        for (var i = 0; i < wildcards.length; ++i) {
          parameters[i] = X.Utils.swizzle(4 - wildcards[i].index, wildcards[i][0].length);
        }
        return parameters;
      }
    };

    // Enumerate the possible opcodes and fill the jumptable

    var range = Math.pow(2, length * 4) - 1;

    for (var i = 0; i < range; ++i) {
      var o = before + X.Utils.pad(i.toString(16), '0', length) + after;
      jumptable[o] = opcode_data;
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

      var instruction = opcode_data.instruction;
      var parameters = opcode_data.parse(opcode);
      var accessors = opcode_data.accessors;

      // Execute

      instruction();

      X.CPU.PC += 2;
    },

  };

})();
