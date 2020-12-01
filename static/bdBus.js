function _bdBus() {
  let subscriptions = {}

  this.subscribe = function subscribeCallbackToEvent(eventType, callback) {
    const id = Symbol("id")
    if (!subscriptions[eventType]) subscriptions[eventType] = {}
    subscriptions[eventType][id] = callback
    return {
      unsubscribe: function unsubscribe() {
        delete subscriptions[eventType][id]

        if (Object.getOwnPropertySymbols(subscriptions[eventType]).length === 0) {
          delete subscriptions[eventType]
        }
      },
    }
  }

  this.publish = function publishEventWithArgs(eventType, arg) {
    if (!subscriptions[eventType]) return
    Object.getOwnPropertySymbols(subscriptions[eventType]).forEach(function (key) {
      return subscriptions[eventType][key](arg)
    })
  }
}

const bdBus = new _bdBus()
