_ = require 'lodash'

class Input

  constructor: (@cheapo) ->

    # Keyboard state
    @keys = [off, off, off, off, off, off, off, off, off, off, off, off, off, off, off, off]

    # Mapping between modern keyboard and hex keyboard
    @mapping =
      86: 0x0
      51: 0x1
      52: 0x2
      53: 0x3
      69: 0x4
      82: 0x5
      84: 0x6
      68: 0x7
      70: 0x8
      71: 0x9
      67: 0xA
      66: 0xB
      54: 0xC
      89: 0xD
      72: 0xE
      78: 0xF

    # Optional function called on key press
    @callback = null

    document.addEventListener 'keydown', ({keyCode}) =>
      if keyCode of @mapping
        hex = @modern_to_hex keyCode
        @keys[hex] = on
        @callback?(hex)

    document.addEventListener 'keyup', ({keyCode}) =>
      if keyCode of @mapping
        @keys[@modern_to_hex keyCode] = off

    # Visual keyboard
    @keyboard = null
    @setup_visual_keyboard()

  reset: ->
    _.fill @keys, off
    @callback = null

  down: (key) ->
    @keys[key]

  modern_to_hex: (modern) ->
    return @mapping[modern]

  hex_to_modern: (hex) ->
    for modern, h of @mapping
      if h is hex
        return modern
    return null

  toggle_visual_keyboard: (flag) ->
    @keyboard.style.display = if flag is on then 'table' else 'none'

  setup_visual_keyboard: () ->

    # Find the table that holds the visual keyboard
    @keyboard = document.querySelector 'table#keyboard'

    # Function that adds the binding of one key to the DOM
    # and sets up its event listeners
    setup_key = (cell) =>

      key = parseInt cell.textContent[0], 16

      # Append the corresponding keyboard key
      binding = document.createElement 'span'
      binding.textContent = String.fromCharCode @hex_to_modern key
      cell.appendChild binding

      # Attach mouse listeners to emulate keypresses
      cell.addEventListener 'mousedown', () =>
        @keys[key] = on
        @callback?(key)

      cell.addEventListener 'mouseup', () =>
        @keys[key] = off

    # Do that for each key of the visual keyboard
    cells = @keyboard.querySelectorAll 'td'
    setup_key(cell) for cell in cells

  remap_visual_keyboard: () ->
    # Show the visual keyboard and start the key binding sequence
    @toggle_visual_keyboard on
    @remap_key 0, true

  remap_key: (index, follow = false) ->

    cells = @keyboard.querySelectorAll 'td'
    cell = cells[index]
    hex = parseInt cell.textContent[0], 16

    # Change the style of the key for the duration of the binding
    cell.className = 'setup'

    # Function that maps the current hex key to the first
    #modern key pressed
    listener = ({keyCode}) =>

      # Remove the previous key from the mapping
      delete @mapping[@hex_to_modern hex]

      # Bind the new key
      @mapping[keyCode] = hex

      # Update the displayed key too
      cell.children[0].textContent = String.fromCharCode keyCode

      # Reset the style and remove the keyboard listener
      cell.className = ''
      document.removeEventListener 'keydown', listener

      # Follow up with the next key if necessary
      if follow
        @remap_key index + 1, index < 14

    document.addEventListener 'keydown', listener

  # Getters/Setters for the GUI

  @get 'visual_keyboard', () -> @keyboard.style.display isnt 'none'
  @set 'visual_keyboard', (x) -> @toggle_visual_keyboard(x)

module.exports = Input
