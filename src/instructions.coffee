# Instruction set.
# Each instruction will be bound to the CPU.
#
# http://devernay.free.fr/hacks/chip8/C8TECH10.HTM
# http://mattmik.com/chip8.html
# http://devernay.free.fr/hacks/chip8/schip.txt

Instructions =

  # Flow control

  JP_addr: (addr) -> @PC = addr - 2
  JP_V0_addr: (addr) -> @PC = addr + @V[0] - 2
  RET: -> @PC = @stack[--@SP]
  EXIT: -> @cheapo.stop()

  SE_Vx_byte: (x, byte) -> @PC += 2 if @V[x] is byte
  SE_Vx_Vy: (x, y) -> @PC += 2 if @V[x] is @V[y]
  SNE_Vx_byte: (x, byte) -> @PC += 2 if @V[x] isnt byte
  SNE_Vx_Vy: (x, y) -> @PC += 2 if @V[x] isnt @V[y]
  SKP_Vx: (x) -> @PC += 2 if @cheapo.input.down @V[x]
  SKNP_Vx: (x) -> @PC += 2 if not @cheapo.input.down @V[x]

  CALL_addr: (addr) ->
    @stack[@SP++] = @PC
    @PC = addr - 2

  # Arithmetic

  OR_Vx_Vy: (x, y) -> @V[x] |= @V[y]
  AND_Vx_Vy: (x, y) -> @V[x] &= @V[y]
  XOR_Vx_Vy: (x, y) -> @V[x] ^= @V[y]

  ADD_Vx_byte: (x, byte) -> @V[x] += byte
  ADD_Vx_Vy: (x, y) ->
    sum = @V[x] + @V[y]
    @V[0xF] = +(sum > 0xFF)
    @V[x] = sum
  ADD_I_Vx: (x) ->
    @I += @V[x]
    @V[0xF] = +(@I > 0xFFF)
    @I &= 0xFFF

  SUB_Vx_Vy: (x, y) ->
    @V[0xF] = +(@V[x] >= @V[y])
    @V[x] -= @V[y]
  SUBN_Vx_Vy: (x, y) ->
    @V[0xF] = +(@V[y] >= @V[x])
    @V[x] = @V[y] - @V[x]

  SHL_Vx_Vy: (x, y) ->
    v = if @quirks.VY_shift then y else x
    @V[0xF] = (@V[v] & 0x80) >> 7
    @V[x] = @V[v] <<= 1
  SHR_Vx_Vy: (x, y) ->
    v = if @quirks.VY_shift then y else x
    @V[0xF] = @V[v] & 1
    @V[x] = @V[v] >>= 1

  RND_Vx_byte: (x, byte) -> @V[x] = Math.floor(Math.random() * 0xFF) & byte

  # Data manipulation

  LD_Vx_byte: (x, byte) -> @V[x] = byte
  LD_Vx_Vy: (x, y) -> @V[x] = @V[y]
  LD_I_addr: (addr) -> @I = addr
  LD_Vx_DT: (x) -> @V[x] = @DT
  LD_DT_Vx: (x) -> @DT = @V[x]
  LD_ST_Vx: (x) -> if (@ST = @V[x]) > 0 then @cheapo.audio.toggle on
  LD_LF_Vx: (x) -> @I = @V[x] * 5
  LD_HF_Vx: (x) -> @I = 80 + @V[x] * 10
  LD_I_Vx: (x) -> @memory[@I + i] = @V[i] for i in [0..x]; if @quirks.I_increment then @I += x + 1
  LD_Vx_I: (x) -> @V[i] = @memory[@I + i] for i in [0..x]; if @quirks.I_increment then @I += x + 1
  LD_R_Vx: (x) -> @R[i] = @V[i] for i in [0..x]
  LD_Vx_R: (x) -> @V[i] = @R[i] for i in [0..x]

  LD_B_Vx: (x) ->
    @memory[@I] = Math.floor @V[x] / 100
    @memory[@I + 1] = Math.floor @V[x] % 100 / 10
    @memory[@I + 2] = Math.floor @V[x] % 10

  LD_Vx_K: (x) ->
    @wait on
    @cheapo.input.callback = (key) ->
      @callback = null
      @cheapo.cpu.V[x] = key
      @cheapo.cpu.wait off

  # Display

  CLS: -> @cheapo.video.clear()
  DRW_Vx_Vy_n: (x, y, n) -> @V[0xF] = +@cheapo.video.sprite @I, @V[x], @V[y], n
  SCD_n: (n) -> @cheapo.video.scroll 0, n
  SCR: -> @cheapo.video.scroll 4, 0
  SCL: -> @cheapo.video.scroll -4, 0
  LOW: -> @cheapo.video.extend off
  HIGH: -> @cheapo.video.extend on

module.exports = Instructions
