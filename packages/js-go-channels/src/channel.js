export class Channel {
  constructor({id, channelBuffers}) {
    this._id = id
    this._channelBuffers = channelBuffers
  }

  take() {
    const {_id: chanId} = this
    return new TakeRequest({chanId})
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
  constructor({chanId}) {
    this.chanId = chanId
  }
}

export class PutRequest {
  constructor({chanId, msg}) {
    this.chanId = chanId
    this.msg = msg
  }
}
