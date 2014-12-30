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
    0xF0, 0x80, 0xF0, 0x90, 0xF0,
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
    * Instruction set
    *
    * http://devernay.free.fr/hacks/chip8/C8TECH10.HTM
    * http://mattmik.com/chip8.html
    */

  var instructions = {

    // Flow control

    JP_addr: function(addr) { this.PC = addr - 2 },
    JP_V0_addr: function(addr) { this.PC = addr + this.V[0] - 2 },

    CALL_addr: function(addr) {
      this.stack[++this.SP] = this.PC;
      this.PC = addr;
    },

    RET: function() { this.PC = this.stack[this.SP--] },

    SE_Vx_byte: function(x, byte) { if (this.V[x] == byte) this.PC += 2 },
    SE_Vx_Vy: function(x, y) { if (this.V[x] == this.V[y]) this.PC += 2 },
    SNE_Vx_byte: function(x, byte) { if (this.V[x] != byte) this.PC += 2 },
    SNE_Vx_Vy: function(x, y) { if (this.V[x] != this.V[y]) this.PC += 2 },
    SKP_Vx: function(x) { if (X.Input.down(this.V[x])) this.PC += 2 },
    SKNP_Vx: function(x) { if (!X.Input.down(this.V[x])) this.PC += 2 },

    // Arithmetic

    OR_Vx_Vy: function(x, y) { this.V[x] |= this.V[y] },
    AND_Vx_Vy: function(x, y) { this.V[x] &= this.V[y] },
    XOR_Vx_Vy: function(x, y) { this.V[x] ^= this.V[y] },

    ADD_Vx_byte: function(x, byte) { this.V[x] = (this.V[x] + byte) & 0xFF },
    ADD_Vx_Vy: function(x, y) {
      var sum = this.V[x] + this.V[y];
      this.V[0xF] = +(sum > 0xFF);
      this.V[x] = sum & 0xFF
    },
    ADD_I_Vx: function(x) { this.I = (this.I + this.V[x]) & 0xFFF },

    SUB_Vx_Vy: function(x, y) {
      this.V[0xF] = +(this.V[x] > this.V[y]);
      this.V[x] = (this.V[x] - this.V[y]) & 0xFF;
    },
    SUBN_Vx_Vy: function(x, y) {
      this.V[0xF] = +(this.V[y] > this.V[x]);
      this.V[x] = (this.V[y] - this.V[x]) & 0xFF;
    },

    SHL_Vx_Vy: function(x, y) { // VY???
      this.V[0xF] = (this.V[x] & 0x80) >> 7;
      this.V[x] = (this.V[x] << 1) & 0xFF;
    },
    SHR_Vx_Vy: function(x, y) { // VY???
      this.V[0xF] = this.V[x] & 1;
      this.V[x] = this.V[x] >> 1;
    },

    RND_Vx_byte: function(x, byte) { this.V[x] = Math.floor(Math.random() * 0xFF) & byte },

    // Data manipulation

    LD_Vx_byte: function(x, byte) { this.V[x] = byte },
    LD_Vx_Vy: function(x, y) { this.V[x] = this.V[y] },
    LD_I_addr: function(addr) { this.I = addr },
    LD_Vx_DT: function(x) { this.V[x] = this.DT },
    LD_DT_Vx: function(x) { this.DT = this.V[x] },
    LD_ST_Vx: function(x) { this.ST = this.V[x] },
    LD_F_Vx: function(x) { this.I = this.V[x] * 5 },
    LD_Vx_K: function(x) { waiting_register = x },
    LD_I_Vx: function(x) { for (var i = 0; i <= x; ++i) this.memory[this.I + i] = this.V[i]; this.I += x + 1; },
    LD_Vx_I: function(x) { for (var i = 0; i <= x; ++i) this.V[i] = this.memory[this.I + i]; this.I += x + 1; },

    LD_B_Vx: function(x) {
      var value = this.V[x], n = 100;
      for (var i = 0; i < 3; ++i) {
        this.memory[this.I + i] = Math.floor(value / n);
        value %= n;
        n /= 10;
      }
    },

    // Display

    CLS: function() { X.Video.clear() },
    DRW_Vx_Vy_nibble: function(x, y, nibble) { this.V[0xF] = +X.Video.sprite(this.I, this.V[x], this.V[y], nibble) }

  };

  /**
    *
    */

  var jumptable = {};

  function register(pattern, instruction) {

    // Isolate the "wildcards" in the opcode pattern
    // eg. '8xy0' -> ['x', 'y']

    var wildcards = pattern.match(/x|y|nnn|n|kk/g);

    // If there is no wildcard (unique opcode without parameters)
    // just put the instruction in the jumptable

    if (!wildcards)
      jumptable[parseInt(pattern, 16)] = {
        instruction: instruction
      };

    // If there are wildcards, enumerate the possible opcodes and
    // fill the jumptable with the instruction and precomputed parameters

    else {

      var wildcards_length = wildcards.join('').length;
      var range = Math.pow(2, wildcards_length * 4);

      var before = pattern.slice(0, pattern.indexOf(wildcards[0]));
      var after = pattern.slice(before.length + wildcards_length);

      for (var i = 0; i < range; ++i) {

        var chunk = X.Utils.pad(i.toString(16), '0', wildcards_length);
        var opcode = before + chunk + after;

        var parameters = [];

        var cursor = before.length;
        for (var j = 0; j < wildcards.length; ++j) {

          var parameter = parseInt(opcode.slice(cursor, cursor + wildcards[j].length), 16);

          parameters.push(
            function(parameter) {
              return parameter;
            }(parameter)
          );

          cursor += wildcards[j].length;
        }

        jumptable[parseInt(opcode, 16)] = {
          instruction: instruction,
          parameters: parameters
        };
      }
    }
  };

  return {

    memory: new Uint8Array(0x1000),

    frequency: 100,

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
      register('1nnn', instructions.JP_addr);
      register('2nnn', instructions.CALL_addr);
      register('3xkk', instructions.SE_Vx_byte);
      register('4xkk', instructions.SNE_Vx_byte);
      register('5xy0', instructions.SE_Vx_Vy);
      register('6xkk', instructions.LD_Vx_byte);
      register('7xkk', instructions.ADD_Vx_byte);
      register('8xy0', instructions.LD_Vx_Vy);
      register('8xy1', instructions.OR_Vx_Vy);
      register('8xy2', instructions.AND_Vx_Vy);
      register('8xy3', instructions.XOR_Vx_Vy);
      register('8xy4', instructions.ADD_Vx_Vy);
      register('8xy5', instructions.SUB_Vx_Vy);
      register('8xy6', instructions.SHR_Vx_Vy);
      register('8xy7', instructions.SUBN_Vx_Vy);
      register('8xyE', instructions.SHL_Vx_Vy);
      register('9xy0', instructions.SNE_Vx_Vy);
      register('Annn', instructions.LD_I_addr);
      register('Bnnn', instructions.JP_V0_addr);
      register('Cxkk', instructions.RND_Vx_byte);
      register('Dxyn', instructions.DRW_Vx_Vy_nibble);
      register('Ex9E', instructions.SKP_Vx);
      register('ExA1', instructions.SKNP_Vx);
      register('Fx07', instructions.LD_Vx_DT);
      register('Fx0A', instructions.LD_Vx_K);
      register('Fx15', instructions.LD_DT_Vx);
      register('Fx18', instructions.LD_ST_Vx);
      register('Fx1E', instructions.ADD_I_Vx);
      register('Fx29', instructions.LD_F_Vx);
      register('Fx33', instructions.LD_B_Vx);
      register('Fx55', instructions.LD_I_Vx);
      register('Fx65', instructions.LD_Vx_I);
    },

    reset: function() {

      // Reset the registers

      this.PC = 0x200;
      this.SP = 0;
      this.DT = 0;
      this.ST = 0;

      for (var i = 0; i < 16; ++i)
        this.V[i] = this.stack[i] = 0;

      // Reset the memory
      this.memory = new Uint8Array(0x1000);

      // Put the font data at 0
      for (var i = 0; i < font.length; ++i)
        this.memory[i] = font[i];
    },

    load: function(buffer) {

      buffer = new Uint8Array(buffer);
      for (var i = 0; i < buffer.length; ++i)
        this.memory[0x200 + i] = buffer[i];
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

      var opcode = this.memory[X.CPU.PC] << 8 | this.memory[X.CPU.PC + 1];

      // Fetch the implementation cached in the jumptable

      var opcode_data = jumptable[opcode];
      if (opcode_data) {

        console.log(opcode.toString(16), opcode_data.instruction.prototype, opcode_data.parameters ? opcode_data.parameters.map(function(i){ return i.toString(16) }) : '');

        // Execute

        opcode_data.instruction.apply(this, opcode_data.parameters);

        // Update the timers

        if (this.DT > 0) --this.DT;
        if (this.ST > 0) --this.ST;
      }
      else {
        console.log('Undefined opcode [%s]', opcode.toString(16));
      }

      this.PC = (this.PC + 2) & 0xFFF;
    },

  };

})();
