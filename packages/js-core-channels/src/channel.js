export class Channel {
  constructor({id, channelBuffers}) {
    this.id = id
    this.channelBuffers = channelBuffers
  }

  take() {
    const {id: chanId} = this
    return new TakeRequest({chanId})
  }

  put(msg) {
    const {id: chanId} = this
    return new PutRequest({chanId, msg})
  }

  asyncPut(msg) {
    const {id: chanId} = this
    // Add the put request directly to the channel buffer
    this.channelBuffers[chanId].add(msg)
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
