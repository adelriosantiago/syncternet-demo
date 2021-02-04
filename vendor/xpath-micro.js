/*
https://gist.github.com/iimos/e9e96f036a3c174d0bf4

// Usage:

// Getting xpath for node:
var xp = xpath(elementNode)

// Executing xpath:
var iterator = xpath("//h2")
var el = iterator.iterateNext();
while (el) {
  // work with element...
  el = iterator.iterateNext();
}
*/

const xpath = (data) => {
  if (!document) return
  if (typeof data === "string") {
    const el = document.evaluate(data, document, null, 0, null).iterateNext()
    if (el === null) return undefined
    return el
  }
  if (!data || data.nodeType != 1) return ""
  if (data.id) return "//*[@id='" + data.id + "']"
  var sames = [].filter.call(data.parentNode.children, function (x) {
    return x.tagName == data.tagName
  })

  return (
    xpath(data.parentNode) +
    "/" +
    data.tagName.toLowerCase() +
    (sames.length > 1 ? "[" + ([].indexOf.call(sames, data) + 1) + "]" : "")
  )
}

module.exports = xpath
