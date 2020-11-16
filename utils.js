// ENH: Make NPM module?

const iterate = (root, path, onLeaf) => {
  Object.entries(root).forEach((e) => {
    const p = `${path}>${e[0]}`

    if (Object.prototype.toString.call(e[1]) === "[object Object]") {
      iterate(e[1], p, onLeaf)
    } else if (Object.prototype.toString.call(e[1]) === "[object Array]") {
      iterate({ ...e[1] }, p, onLeaf)
    } else {
      onLeaf(p.substr(1), e[1])
    }
  })
}

module.exports = { iterate }
