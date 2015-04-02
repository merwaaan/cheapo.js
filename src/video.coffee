screenfull = require 'screenfull'
_ = require 'lodash'
require './getset'


RESOLUTIONS =
  normal:
    x: 64
    y: 32
  extended:
    x: 128
    y: 64

cssColor = (color) ->
  '#' + (('0' + parseInt(c).toString(16)).substr(-2) for c in color).join('')


class Video

  constructor: (@cheapo, @container = null) ->

    @resolution = RESOLUTIONS.normal
    @scale = @previousScale = 4

    # Initialize the screen
    @screen = new Array @resolution.x * @resolution.y
    _.fill @screen, off

    # Create a container for the canvas if necessary
    if not @container?
      @container = document.createElement 'div'
      document.body.appendChild @container

    # Create the canvas
    canvas = document.createElement 'canvas'
    canvas.width = @resolution.x * @scale
    canvas.height = @resolution.y * @scale
    @container.appendChild canvas

    @ctx = canvas.getContext '2d'
    @setColor [0x2F, 0xA1, 0xD6]
    @setBackgroundColor [0xFF, 0xFF, 0xFF]

    # Go fullscreen when the canvas is clicked
    canvas.addEventListener 'click', @fullscreen.bind @

    # When switching to or from fullscreen, scale the canvas accordingly
    document.addEventListener screenfull.raw.fullscreenchange, () =>
      if screenfull.isFullscreen
        @previousScale = @scale
        @setScale Math.min(Math.floor(window.screen.width / @resolution.x), Math.floor(window.screen.height / @resolution.y))
      else
        @setScale @previousScale

  reset: ->
    @extend off
    @clear()

  clear: ->
    @ctx.clearRect 0, 0, @ctx.canvas.width, @ctx.canvas.height
    _.fill @screen, off

  sprite: (address, x, y, n) ->

    collision = no

    h = if n is 0 then 16 else n # "0 lines" actually means "draw all lines"   ¯\_(ツ)_/¯
    w = if n is 0 and @extended() then 16 else 8  # "0 lines" in extended mode also means "draw the 16px wide sprite"

    # Loop through the lines
    for i in [0...h]

      if w is 8
        line = @cheapo.cpu.memory[address + i]
      else
        line = @cheapo.cpu.memory[address + i * 2]
        line = line << 8 | @cheapo.cpu.memory[address + i * 2 + 1]

      # Loop through the pixels
      for j in [0...w]
        if !!(line & 1 << (w - j - 1)) && @pixel x + j, y + i
          collision = yes

    return collision

  # Try to draw a pixel at (x,y) and return yes if a pixel
  # was already there.
  pixel: (x, y) ->

    # Out-of-bounds pixels are not drawn (no wrapping)
    if x < 0 or x >= @resolution.x or y < 0 or y >= @resolution.y
      return no

    # Compute the pixel coordinates

    index = y * @resolution.x + x

    xScaled = x * @scale
    yScaled = y * @scale

    # XOR drawing: erase and return a collision if a pixel is already here
    if @screen[index] is on
      @ctx.clearRect xScaled, yScaled, @scale, @scale
      @screen[index] = off
      return yes

    @ctx.fillRect xScaled, yScaled, @scale, @scale
    @screen[index] = on
    return no

  scroll: (x, y) ->

    # Vertical scrolling
    if y > 0
      for i in [@resolution.y - 1..0] by -1
        for j in [0...@resolution.x]
          @screen[i * @resolution.x + j] = if i > y - 1 then  @screen[(i - y) * @resolution.x + j] else off

    # Horizontal scrolling

    if x > 0
      for i in [0...@resolution.y]
        for j in [@resolution.x - 1..0] by -1
          @screen[i * @resolution.x + j] = if j > x - 1 then @screen[i * @resolution.x + j - x] else off

    else if x < 0
      for i in [0...@resolution.y]
        for j in [0...@resolution.x]
          @screen[i * @resolution.x + j] = if j > @resolution.x - x then @screen[i * @resolution.x + j + x] else off

    @redraw()

  redraw: ->

    @ctx.clearRect 0, 0, @ctx.canvas.width, @ctx.canvas.height

    for pixel, i in @screen
      if pixel is on
        @ctx.fillRect (i % @resolution.x) * @scale, Math.floor(i / @resolution.x) * @scale, @scale, @scale

  extend: (flag) ->

    @resolution = if flag is on then RESOLUTIONS.extended else RESOLUTIONS.normal

    @setScale @scale

    # Resize the screen
    @screen = new Array @resolution.x * @resolution.y
    _.fill @screen, off

    console.info "Extended mode #{if flag is on then 'ON' else 'OFF'}"

  extended: ->
    @resolution is RESOLUTIONS.extended

  setScale: (scale) ->
    @scale = scale
    @ctx.canvas.width = @resolution.x * @scale
    @ctx.canvas.height = @resolution.y * @scale
    @setColor @color # Set the color again (was reset) and redraw

  fullscreen: ->
    screenfull.request @ctx.canvas

  setColor: (color) ->
    @color = color
    @ctx.fillStyle = cssColor color
    @redraw()

  setBackgroundColor: (color) ->
    @backgroundColor = color
    @ctx.canvas.style.backgroundColor = cssColor @backgroundColor

  # Getters/Setters for the GUI

  @get 'foreground', -> @color
  @set 'foreground', (x) -> @setColor x

  @get 'background', -> @backgroundColor
  @set 'background', (x) -> @setBackgroundColor x

  @get 'size', -> @scale
  @set 'size', (x) -> @setScale x


module.exports = Video
