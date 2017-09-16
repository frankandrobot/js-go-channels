export class Channel {
  constructor({id, channelBuffers}) {
    this._id = id
    this._channelBuffers = channelBuffers
  }

  take(_msgId) {
    const {_id: chanId} = this
    return new TakeRequest({chanId, _msgId})
  }

  put(msg) {
    const {_id: chanId} = this
    return new PutRequest({chanId, msg})
  }

  asyncPut(msg) {
    const {_id: chanId, _channelBuffers} = this
    // Add the put request directly to the channel buffer
    _channelBuffers[chanId].add(msg)
  }
}

export class TakeRequest {
  constructor({chanId, _msgId}) {
    this.chanId = chanId
    this._msgId = _msgId
  }
}

export class PutRequest {
  constructor({chanId, msg}) {
    this.chanId = chanId
    this.msg = msg
  }
}
