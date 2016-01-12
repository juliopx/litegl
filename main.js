//litegl by Julio Manuel López (pixelement.net)
//forked from litegl.js by Javi Agenjo 2014 @tamat (tamats.com)
//forked from lightgl.js by Evan Wallace (madebyevan.com)

//The file src/events.js has been ported from events.py of myou engine
//by Alberto torres ruiz <kungfoobar@gmail.com> and
//Julio Manuel López Tercero <julio@pixelements.net>

exports.create = require('./src/core.js').create
exports.Texture = require('./src/texture.js').Texture
exports.Shader = require('./src/shader.js').Shader
exports.events = require('./src/events.js')
exports.Octree = require('./src/octree.js')
exports.FBO = require('./src/fbo.js')
exports.utils = require('./src/utils.js')

raytracer = require('./src/raytracer.js')
exports.HitTest = raytracer.HitTest
exports.Raytracer = raytracer.Raytracer

var mesh = require('./src/mesh.js')
exports.Indexer = mesh.Indexer
exports.Buffer = mesh.Buffer
exports.Mesh = mesh.Mesh
exports.Mesh.primitives = require('./src/primitives.js')
//these libraries are added to Mesh
parsers = require('./src/parsers.js')
exports.Mesh.parsers['obj'] = parsers.parseOBJ.bind(exports.Mesh)
exports.Mesh.enconders['obj'] = parsers.encoderOBJ
