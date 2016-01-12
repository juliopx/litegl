//litegl by Julio Manuel López (pixelement.net)
//forked from litegl.js by Javi Agenjo 2014 @tamat (tamats.com)
//forked from lightgl.js by Evan Wallace (madebyevan.com)

exports.create = require('./src/core.js').create
exports.Texture = require('./src/texture.js').Texture
exports.Shader = require('./src/shader.js').Shader
mesh = require('./src/mesh.js')
exports.Indexer = mesh.Indexer
exports.Buffer = mesh.Buffer
exports.Mesh = mesh.Mesh
exports.primitives = require('./src/primitives.js')
exports.utils = require('./src/utils.js')
