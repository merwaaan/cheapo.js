var Cheapo = Cheapo || {};

Cheapo.CPU = (function() {

  'use strict';

  /**
    * Is the CPU waiting for a keypress?
    */

  var _waiting = false;

  /**
    * Accumulate time over several frames
    * (useful for updating the timers)
    */

  var _dt_acc = 0;

  /**
    * Font data copied at address 0
    */

  var _font = [
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

  var _instructions = {

    // Flow control

    JP_addr: function(addr) { this.PC = addr - 2 },
    JP_V0_addr: function(addr) { this.PC = addr + this.V[0] - 2 },

    CALL_addr: function(addr) {
      this.stack[this.SP++] = this.PC;
      this.PC = addr - 2;
    },

    RET: function() { this.PC = this.stack[--this.SP] },

    SE_Vx_byte: function(x, byte) { if (this.V[x] == byte) this.PC += 2 },
    SE_Vx_Vy: function(x, y) { if (this.V[x] == this.V[y]) this.PC += 2 },
    SNE_Vx_byte: function(x, byte) { if (this.V[x] != byte) this.PC += 2 },
    SNE_Vx_Vy: function(x, y) { if (this.V[x] != this.V[y]) this.PC += 2 },
    SKP_Vx: function(x) { if (Cheapo.Input.down(this.V[x])) this.PC += 2 },
    SKNP_Vx: function(x) { if (!Cheapo.Input.down(this.V[x])) this.PC += 2 },

    // Arithmetic

    OR_Vx_Vy: function(x, y) { this.V[x] |= this.V[y] },
    AND_Vx_Vy: function(x, y) { this.V[x] &= this.V[y] },
    XOR_Vx_Vy: function(x, y) { this.V[x] ^= this.V[y] },

    ADD_Vx_byte: function(x, byte) { this.V[x] = this.V[x] + byte },
    ADD_Vx_Vy: function(x, y) {
      var sum = this.V[x] + this.V[y];
      this.V[0xF] = +(sum > 0xFF);
      this.V[x] = sum;
    },
    ADD_I_Vx: function(x) { this.I = (this.I + this.V[x]) & 0xFFFF },

    SUB_Vx_Vy: function(x, y) {
      this.V[0xF] = +(this.V[x] > this.V[y]);
      this.V[x] -= this.V[y];
    },
    SUBN_Vx_Vy: function(x, y) {
      this.V[0xF] = +(this.V[y] > this.V[x]);
      this.V[x] = this.V[y] - this.V[x];
    },

    SHL_Vx_Vy: function(x, y) { // VY???
      this.V[0xF] = (this.V[x] & 0x80) >> 7;
      this.V[x] <<= 1;
      /*this.V[0xF] = (this.V[y] & 0x80) >> 7;
      this.V[x] = this.V[y] << 1;
      this.V[y] = this.V[y] << 1;*/
    },
    SHR_Vx_Vy: function(x, y) { // VY???
      this.V[0xF] = this.V[x] & 1;
      this.V[x] >>= 1;
      /*this.V[0xF] = this.V[y] & 1;
      this.V[x] = this.V[y] >> 1;
      this.V[y] = this.V[y] >> 1;*/
    },

    RND_Vx_byte: function(x, byte) { this.V[x] = Math.floor(Math.random() * 0xFF) & byte },

    // Data manipulation

    LD_Vx_byte: function(x, byte) { this.V[x] = byte },
    LD_Vx_Vy: function(x, y) { this.V[x] = this.V[y] },
    LD_I_addr: function(addr) { this.I = addr },
    LD_Vx_DT: function(x) { this.V[x] = this.DT },
    LD_DT_Vx: function(x) { this.DT = this.V[x] },
    LD_ST_Vx: function(x) { if ((this.ST = this.V[x]) > 1) Cheapo.Audio.toggle(true) },
    LD_F_Vx: function(x) { this.I = this.V[x] * 5 },
    LD_I_Vx: function(x) { for (var i = 0; i <= x; ++i) this.memory[this.I + i] = this.V[i]; /*this.I += x + 1;*/ }, // inc I???
    LD_Vx_I: function(x) { for (var i = 0; i <= x; ++i) this.V[i] = this.memory[this.I + i]; /*this.I += x + 1;*/ }, // ...

    LD_B_Vx: function(x) { // TODO simplify?
      var value = this.V[x], n = 100;
      for (var i = 0; i < 3; ++i) {
        this.memory[this.I + i] = Math.floor(value / n);
        value %= n;
        n /= 10;
      }
    },

    LD_Vx_K: function(x) {
      this.wait();
      Cheapo.Input.callback = function(key) {
        this.callback = null;
        Cheapo.CPU.V[x] = key;
        Cheapo.CPU.wait(false);
      }.bind(Cheapo.Input);
    },

    // Display

    CLS: function() { Cheapo.Video.clear() },
    DRW_Vx_Vy_nibble: function(x, y, nibble) { this.V[0xF] = +Cheapo.Video.sprite(this.I, this.V[x], this.V[y], nibble) }

  };

  /**
    * The jumptable contains all possible opcodes and precomputed
    * parameters extracted from the opcode. Filling the jumptable
    * is done by binding instructions to patterns with register().
    */

  var _jumptable = {};

  function register(pattern, instruction) {

    // Isolate the "wildcards" in the opcode pattern
    // eg. '8xy0' -> ['x', 'y']

    var wildcards = pattern.match(/x|y|nnn|n|kk/g);

    // If there is no wildcard (unique opcode without parameters)
    // just put the instruction in the jumptable

    if (!wildcards)
      _jumptable[parseInt(pattern, 16)] = {
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

        var chunk = ('00' + i.toString(16)).substr(-wildcards_length);
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

        _jumptable[parseInt(opcode, 16)] = {
          instruction: instruction,
          parameters: parameters
        };
      }
    }
  };

  return {

    memory: new Uint8Array(0x1000),

    frequency: 50,

    /**
      * Registers
      */

    V: new Uint8Array(16),
    I: 0,

    stack: new Uint16Array(16),
    SP: 0,

    PC: 0,

    DT: 0,
    ST: 0,

    init: function() {

      register('00E0', _instructions.CLS);
      register('00EE', _instructions.RET);
      register('1nnn', _instructions.JP_addr);
      register('2nnn', _instructions.CALL_addr);
      register('3xkk', _instructions.SE_Vx_byte);
      register('4xkk', _instructions.SNE_Vx_byte);
      register('5xy0', _instructions.SE_Vx_Vy);
      register('6xkk', _instructions.LD_Vx_byte);
      register('7xkk', _instructions.ADD_Vx_byte);
      register('8xy0', _instructions.LD_Vx_Vy);
      register('8xy1', _instructions.OR_Vx_Vy);
      register('8xy2', _instructions.AND_Vx_Vy);
      register('8xy3', _instructions.XOR_Vx_Vy);
      register('8xy4', _instructions.ADD_Vx_Vy);
      register('8xy5', _instructions.SUB_Vx_Vy);
      register('8xy6', _instructions.SHR_Vx_Vy);
      register('8xy7', _instructions.SUBN_Vx_Vy);
      register('8xyE', _instructions.SHL_Vx_Vy);
      register('9xy0', _instructions.SNE_Vx_Vy);
      register('Annn', _instructions.LD_I_addr);
      register('Bnnn', _instructions.JP_V0_addr);
      register('Cxkk', _instructions.RND_Vx_byte);
      register('Dxyn', _instructions.DRW_Vx_Vy_nibble);
      register('Ex9E', _instructions.SKP_Vx);
      register('ExA1', _instructions.SKNP_Vx);
      register('Fx07', _instructions.LD_Vx_DT);
      register('Fx0A', _instructions.LD_Vx_K);
      register('Fx15', _instructions.LD_DT_Vx);
      register('Fx18', _instructions.LD_ST_Vx);
      register('Fx1E', _instructions.ADD_I_Vx);
      register('Fx29', _instructions.LD_F_Vx);
      register('Fx33', _instructions.LD_B_Vx);
      register('Fx55', _instructions.LD_I_Vx);
      register('Fx65', _instructions.LD_Vx_I);
    },

    reset: function() {

      _waiting = false;
      _dt_acc = 0;

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
      for (var i = 0; i < _font.length; ++i)
        this.memory[i] = _font[i];
    },

    load: function(buffer) {

      buffer = new Uint8Array(buffer);
      for (var i = 0; i < buffer.length; ++i)
        this.memory[0x200 + i] = buffer[i];
    },

    step: function(dt) {

      // Don't do anything in we are waiting for user input

      if (!_waiting) {

        // Get the current opcode

        var opcode = this.memory[Cheapo.CPU.PC] << 8 | this.memory[Cheapo.CPU.PC + 1];

        // Fetch the implementation cached in the jumptable

        var opcode_data = _jumptable[opcode];
        if (opcode_data) {
          //console.log(opcode.toString(16), opcode_data.instruction.prototype, opcode_data.parameters ? opcode_data.parameters.map(function(i){ return i.toString(16) }) : '');
          opcode_data.instruction.apply(this, opcode_data.parameters);
        }
        else {
          console.log('Undefined opcode [%s]', opcode.toString(16));
        }

        this.PC = (this.PC + 2) & 0xFFF;
      }

      // Update the timers at 60 Hz

      _dt_acc += dt;

      if (_dt_acc > 0.017) {

        if (this.DT > 0)
          --this.DT;

        if (this.ST > 0) {
          --this.ST;
          if (this.ST == 0)
            Cheapo.Audio.toggle(false);
        }

        _dt_acc -= 0.017;
      }
    },

    wait: function(on) {
      _waiting = on === undefined ? true : on;
    }

  };

})();
