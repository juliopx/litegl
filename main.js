//litegl by Julio Manuel López (pixelement.net)
//forked from litegl.js by Javi Agenjo 2014 @tamat (tamats.com)
//forked from lightgl.js by Evan Wallace (madebyevan.com)

//The file src/events.js has been ported from events.py of myou engine
//by Alberto torres ruiz <kungfoobar@gmail.com> and
//Julio Manuel López Tercero <julio@pixelements.net>

exports.create = require('./src/core.js').create
exports.Texture = require('./src/texture.js').Texture
exports.Shader = require('./src/shader.js').Shader
var mesh = require('./src/mesh.js')
exports.Indexer = mesh.Indexer
exports.Buffer = mesh.Buffer
exports.Mesh = mesh.Mesh
exports.primitives = require('./src/primitives.js')
exports.utils = require('./src/utils.js')
