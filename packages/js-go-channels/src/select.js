export function select(...channels) {
  return new SelectRequest({channels})
}

export class SelectRequest {
  constructor({channels}) {
    this.channels = channels
  }
}
