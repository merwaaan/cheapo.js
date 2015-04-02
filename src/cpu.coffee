Instructions = require './instructions'
Fonts = require './fonts'
_ = require 'lodash'
require './getset'

class CPU

  constructor: (@cheapo) ->

    @memory = new Uint8Array 0x1000

    # Clock rate
    @frequency = 500

    # Delay for the timers to be decremented
    @timerDelay = 0.01666666666 # ~60 Hz

    # Accumulate time over several frames
    @timerAcc = 0

    # Registers

    @V = new Uint8Array 16
    @R = new Uint8Array 8
    @I = 0

    @stack = new Uint16Array 16
    @SP = 0

    @PC = 0

    @DT = 0
    @ST = 0

    # Quirks to handle unclear behaviors, as proposed by mir3z
    # http://mir3z.github.io/chip8-emu/doc/#toc1
    @quirks =
      I_increment: off
      VY_shift: off

    # Is the CPU ready to run? (has a game been loaded?)
    @ready = yes

    # Is the CPU waiting for user input?
    # (The LD_Vx_K instruction blocks the execution until a
    # key is pressed)
    @waiting = no

    # The jumptable contains all possible opcodes and precomputed
    # parameters extracted from the opcode. Filling the jumptable
    # is done by binding instructions to patterns with
    # register().
    @jumptable = {}

    # CHIP-8 instructions
    @register '00E0', Instructions.CLS
    @register '00EE', Instructions.RET
    @register '1nnn', Instructions.JP_addr
    @register '2nnn', Instructions.CALL_addr
    @register '3xkk', Instructions.SE_Vx_byte
    @register '4xkk', Instructions.SNE_Vx_byte
    @register '5xy0', Instructions.SE_Vx_Vy
    @register '6xkk', Instructions.LD_Vx_byte
    @register '7xkk', Instructions.ADD_Vx_byte
    @register '8xy0', Instructions.LD_Vx_Vy
    @register '8xy1', Instructions.OR_Vx_Vy
    @register '8xy2', Instructions.AND_Vx_Vy
    @register '8xy3', Instructions.XOR_Vx_Vy
    @register '8xy4', Instructions.ADD_Vx_Vy
    @register '8xy5', Instructions.SUB_Vx_Vy
    @register '8xy6', Instructions.SHR_Vx_Vy
    @register '8xy7', Instructions.SUBN_Vx_Vy
    @register '8xyE', Instructions.SHL_Vx_Vy
    @register '9xy0', Instructions.SNE_Vx_Vy
    @register 'Annn', Instructions.LD_I_addr
    @register 'Bnnn', Instructions.JP_V0_addr
    @register 'Cxkk', Instructions.RND_Vx_byte
    @register 'Dxyn', Instructions.DRW_Vx_Vy_n
    @register 'Ex9E', Instructions.SKP_Vx
    @register 'ExA1', Instructions.SKNP_Vx
    @register 'Fx07', Instructions.LD_Vx_DT
    @register 'Fx0A', Instructions.LD_Vx_K
    @register 'Fx15', Instructions.LD_DT_Vx
    @register 'Fx18', Instructions.LD_ST_Vx
    @register 'Fx1E', Instructions.ADD_I_Vx
    @register 'Fx29', Instructions.LD_LF_Vx
    @register 'Fx33', Instructions.LD_B_Vx
    @register 'Fx55', Instructions.LD_I_Vx
    @register 'Fx65', Instructions.LD_Vx_I

    # Super CHIP-8 instructions
    @register '00Cn', Instructions.SCD_n
    @register '00FB', Instructions.SCR
    @register '00FC', Instructions.SCL
    @register '00FD', Instructions.EXIT
    @register '00FE', Instructions.LOW
    @register '00FF', Instructions.HIGH
    @register 'Fx30', Instructions.LD_HF_Vx
    @register 'Fx75', Instructions.LD_R_Vx
    @register 'Fx85', Instructions.LD_Vx_R

  register: (pattern, instruction) ->

    # Isolate the "wildcards" in the opcode pattern
    # eg. '8xy0' -> ['x', 'y']
    wildcards = pattern.match /x|y|nnn|n|kk/g

    # If there is no wildcard (unique opcode without
    # parameters) just put the instruction in the jumptable
    # and bind it to the CPU
    if not wildcards?
      @jumptable[parseInt pattern, 16] = instruction.bind @
      console.info "Opcode #{pattern} registered"

    # If there are wildcards, enumerate the possible opcodes
    # and fill the jumptable with the instruction and
    # precomputed parameters
    else

      wildcardsLength = wildcards.join('').length
      range = Math.pow 2, wildcardsLength * 4

      before = pattern.slice 0, pattern.indexOf(wildcards[0])
      after = pattern.slice before.length + wildcardsLength

      for i in [0...range]

        chunk = ('00' + i.toString(16)).substr -wildcardsLength
        opcode = before + chunk + after

        parameters = []

        cursor = before.length
        for j in [0...wildcards.length]

          parameter = parseInt opcode.slice(cursor, cursor + wildcards[j].length), 16
          parameters.push parameter

          cursor += wildcards[j].length

        @jumptable[parseInt(opcode, 16)] = instruction.bind.apply instruction, [@].concat(parameters)

      console.info "Pattern #{pattern} registered (#{range} cached instances)"

  reset: ->

    @ready = no
    @waiting = no
    @timerAcc = 0

    # Reset the registers
    @PC = 0x200
    @SP = 0
    @DT = 0
    @ST = 0
    _.fill @V, 0
    _.fill @R, 0
    _.fill @stack, 0

    # Reset memory
    _.fill @memory, 0

    # Put the fonts data at 0
    for bit, i in Fonts
      @memory[i] = bit

  load: (buffer) ->

    buffer = new Uint8Array buffer
    for bit, i in buffer
      @memory[0x200 + i] = bit

    @ready = yes

  wait: (flag = yes) ->
    @waiting = flag
    if @waiting then console.info 'Waiting for a keypress...'

  step: (dt) ->

    # Don't do anything if we are waiting for a keypress
    if not @waiting

      # Fetch the current opcode
      opcode = @memory[@PC] << 8 | @memory[@PC + 1]

      # Get the implementation cached in the jumptable
      instruction = @jumptable[opcode]

      # Execute the instruction
      try
        instruction()
      catch error
        @cheapo.stop()
        console.error "Bad instruction [#{opcode.toString 16}]"

      @PC = (@PC + 2) & 0xFFF

    #Update the timers
    @timers dt

  timers: (dt) ->

    @timerAcc += dt

    if @timerAcc > @timerDelay

      if @DT > 0
        --@DT

      if @ST > 0
        --@ST
        if @ST is 0
          @cheapo.audio.toggle off

      @timerAcc -= @timerDelay

  # Getters/Setters for the GUI

  @get 'timerFrequency', -> 1 / @timerDelay
  @set 'timerFrequency', (x) -> @timerDelay = 1 / x


module.exports = CPU
