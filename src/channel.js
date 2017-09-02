export class Channel {
  constructor({id}) {
    this.id = id
  }

  take() {
    const {id: chanId} = this
    return new TakeRequest({chanId})
  }

  put(msg) {
    const {id: chanId} = this
    return new PutRequest({chanId, msg})
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
