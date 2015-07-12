require './getset'

class Audio

  constructor: (@cheapo) ->

    @ctx = new window.AudioContext()

    @gain = @ctx.createGain()
    @gain.gain.value = 0.25
    @gain.connect @ctx.destination

    @createOscillator()

    @playing = off

  reset: ->
    @toggle off

  toggle: (flag) ->

    if flag is on and not @playing
      @oscillator.start()
      @playing = on

    else if flag is off and @playing
      @oscillator.stop()
      @playing = off
      @createOscillator() # Prepare a new oscillator for the next tone

  createOscillator: ->

    frequency = if @oscillator? then @oscillator.frequency.value else 300

    @oscillator = @ctx.createOscillator()
    @oscillator.type = 'sine'
    @oscillator.frequency.value = frequency

  # Getters/Setters for the GUI

  @get 'volume', -> @gain.gain.value * 100
  @set 'volume', (x) -> @gain.gain.value = x / 100

  @get 'frequency', -> @oscillator.frequency.value
  @set 'frequency', (x) -> @oscillator.frequency.value = x

module.exports = Audio
