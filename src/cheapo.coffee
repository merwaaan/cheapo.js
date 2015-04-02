CPU = require './cpu'
Video = require './video'
Audio = require './audio'
Input = require './input'

class Cheapo

  constructor: (@container) ->

    @components = [
      @cpu = new CPU @
      @video = new Video @, @container
      @audio = new Audio @
      @input = new Input @
    ]

    # Interval and delay between screen updates
    @interval = null
    @intervalDelay = 30

    # When were the last frames drawn?
    @lastFrame = null

    # Partial tick not consumed during the last screen update
    @ticksRest = 0

  # Reset all components
  reset: () ->
    @stop()
    component.reset() for component in @components

  # Load a ROM and play
  load: (buffer) ->
    @reset()
    @cpu.load buffer
    @start() if @cpu.ready

  start: () ->
    @lastFrame = window.performance.now()
    @interval = setInterval @frames.bind @, @intervalDelay

  stop: () ->
    clearInterval @interval

  frames: (time) ->

    now = window.performance.now()
    diff = now - @lastFrame

    ticks = diff / 1000 * @cpu.frequency + @ticksRest
    @ticksRest = ticks % 1 # Keep the "partial tick" not consumed in this frame for the next one

    ticks = Math.floor ticks
    tickDuration = diff / ticks
    for i in [0...ticks]
      @cpu.step tickDuration

    @lastFrame = now


window.Cheapo = Cheapo
module.exports = Cheapo
