# http://bl.ocks.org/joyrexus/65cb3780a24ecd50f6df

Function::get = (prop, get) ->
  Object.defineProperty @prototype, prop, {get, configurable: yes}

Function::set = (prop, set) ->
  Object.defineProperty @prototype, prop, {set, configurable: yes}
