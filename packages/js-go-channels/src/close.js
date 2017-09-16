export function close(channel) {
  return new CloseChannelRequest({channel})
}

export class CloseChannelRequest {
  constructor({channel}) {
    this.channel = channel
  }
}
