const net = require('net');


const TERMINATOR = '#'


class App {
  constructor() {
    this._socketPool = {}
    this.routes = []

    this.server = net.createServer(socket => this._onNewSocket(socket))
    this.server.on('close', () => {}) //TODO: implement
    this.server.on('error', err => this._serverError(err) ) //TODO: implement
  }

  _serverError(err) {
    console.log(err)
  }


  _onNewSocket(socket) {
    const handle = new SocketHandle(socket)
    handle.onData(data => this._onHandleData(handle, data))
    handle.onTimeout(() => this._onHandleTimeout(handle))

    console.log('new handle')

    this._addHandle(handle)
  }


  _onHandleTimeout(handle) {
    console.log('socket timeout')
    this._removeHandle(handle)
  }


  _addHandle(handle) {
    const key = this._handleKey(handle)

    const old_handle = this._socketPool[key]
    if(old_handle !== handle) this._removeHandle(old_handle)
    
    this._socketPool[key] = handle
  }


  _removeHandle(handle, close = true) {
    if(!handle) return

    const key = this._handleKey(handle)

    if(this._socketPool[key] === handle) {
      delete this._socketPool[key]
      console.log('removing handle from the pool')
    } else {
      console.log('removing handle that was not in the pool')
    }

    if(close) handle.close()
  }


  _handleKey(handle) {
    return handle.socket.address().address
  }


  _onHandleData(handle, data) {
    const req = new Request().parse(data).from(handle)
    const res = new Response().for(req)

    for(let r of this.routes) {

      // TODO: move to Route class
      const locationMatch = r.location.matches(req.location)
      const routeMatch = r.mode.toUpperCase() === req.mode.toUpperCase() && locationMatch.match

      if(routeMatch) {
        req.withParams(locationMatch.params)

        r.callback(req, res)
        this._processResponse(handle, res)

        break
      }
    }
  }


  _processResponse(handle, res) {
    if(!res.toSend) return

    const data = res.pack()
    handle.socket.write(data, 'utf-8')
  }


  route(mode, location, callback) {
    // TODO: use location matcher here
    const r = { mode: mode, location: new Location(location), callback }
    this.routes = [r, ...this.routes]
  }


  listen(port, callback) {
    this.server.listen(port, callback)
  }


  stop(callback) {
    this.server.close(callback)
  }
}


class Response {
  constructor() {
    this.req = null
    this.toSend = null
  }

  for(req) {
    this.req = req
    return this
  }

  send(mode, location, content) {
    this.toSend = { mode, location, content }
  }

  pack() {
    const m = this.toSend.mode.toUpperCase() || ''
    const l = this.toSend.location || ''
    const c = this.toSend.content || ''

    return `${m} ${l}\n${c}\n${TERMINATOR}`
  }
}


// TODO: implement
class Route {
  constructor() {
  }
}


class Request {
  constructor() {
    this.mode = ""
    this.location = ""
    this.raw = ""
    this.address = null
    this.params = {}
    this._json = null
  }

  from(handle) {
    this.address = handle.socket.address()

    return this
  }

  parse(data) {
    data.replace('\r', '')

    const spaceIndex = data.indexOf(' ')
    if(spaceIndex < 0) return false

    let mode = data.slice(0, spaceIndex)
    const newLineIndex = data.indexOf('\n')

    let content = ''
    let location = ''

    if(newLineIndex > 0) {
      location = data.slice(spaceIndex, newLineIndex)
      content = data.slice(newLineIndex)
    } else {
      location = data.slice(spaceIndex)
    }

    mode = mode.trim().toUpperCase()
    location = location.trim().toLowerCase()
    content = content.trim()

    if(location.match(/\s/))
      return false

    if(mode.match(/\s/))
      return false

    this.mode = mode
    this.location = new Location(location) //TODO: use string here
    this.raw = content

    return this
  }

  withParams(p) {
    this.params = p
    return this
  }

  json() {
    if(this._json == null)
      this._json = JSON.parse(this.raw)

    return this._json
  }
}


// TODO: transform in LocationMatcher
class Location {
  constructor(str) {
    this.bits = []

    this.bits = str.split('/').filter(s => s.length > 0)
  }

  matches(other) {
    if(this.bits.length === 0 && other.bits.length === 0)
      return { match: true, params: {} }

    if(this.bits.length !== other.bits.length)
      return { match: false, params: {} }

    const params = {}

    for(let i = 0; i < this.bits.length; i++) {
      const myB = this.bits[i]
      const otherB = other.bits[i]

      if(myB.startsWith(':')) {
        const paramName = myB.replace(':', '')
        params[paramName] = otherB
      }
      else if(myB !== '*') {
        if(myB !== otherB)
          return { match: false, params: null }
      }
    }

    return { match: true, params }
  }
}


class SocketHandle {
  constructor(socket) {
    this.socket = socket;
    this._partial = "";

    socket.setEncoding('utf-8')
    socket.setTimeout(10 * 1000)

    socket.on('data', data => this._dataFromSocket(data))
    socket.on('timeout', () => this?._onTimeOutCallback())

    this.socket.on('error', err => {
      console.log(err)
    });

    this.socket.on('close', err => {
      console.log(err)
    });
  }

  _dataFromSocket(data) {
    this._partial = this._partial.concat(data);

    if (data.includes(TERMINATOR)) {
      const parts = this._partial.split(TERMINATOR);
      this._partial = parts[1];
      const sentence = parts[0].trim();

      this?._onDataCallback(sentence)
    }
  }

  close() {
    this._onTimeOutCallback = null
    this._onDataCallback = null
    this.socket.end()
  }


  setTimeout(time) {
    this.socket.timeout = time
  }


  onData(callback) {
    this._onDataCallback = callback
  }

  onTimeout(callback) {
    this._onTimeOutCallback = callback
  }
}



module.exports = { App }
