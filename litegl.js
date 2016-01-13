//litegl by Julio Manuel López (pixelement.net)
//forked from litegl.js by Javi Agenjo 2014 @tamat (tamats.com)
//forked from lightgl.js by Evan Wallace (madebyevan.com)

//The file src/events.js has been ported from events.py of myou engine
//by Alberto torres ruiz <kungfoobar@gmail.com> and
//Julio Manuel López Tercero <julio@pixelements.net>
core = require('./src/core.js')
exports.create = core.create
exports.mapKeyCode = core.mapKeyCode
exports.dragging = core.dragging
exports.last_pos = core.last_pos
exports.augmentEvent = core.augmentEvent

exports.Texture = require('./src/texture.js').Texture
exports.Shader = require('./src/shader.js').Shader
exports.Octree = require('./src/octree.js')
exports.FBO = require('./src/fbo.js').FBO
exports.utils = require('./src/utils.js')
exports.glmatrix = require('./src/gl-matrix-extra.js')
exports.geometry = require('./src/geo.js')
exports.Octree = require('./src/octree.js').Octree

raytracer = require('./src/raytracer.js')
exports.HitTest = raytracer.HitTest
exports.Raytracer = raytracer.Raytracer

var mesh = require('./src/mesh.js')
exports.Indexer = mesh.Indexer
exports.Buffer = mesh.Buffer
exports.Mesh = mesh.Mesh

primitives = require('./src/primitives.js')
exports.Mesh.plane = primitives.plane
exports.Mesh.circle = primitives.circle
exports.Mesh.cube = primitives.cube
exports.Mesh.box = primitives.box
exports.Mesh.sphere = primitives.sphere
exports.Mesh.cylinder = primitives.cylinder
exports.Mesh.grid = primitives.grid
exports.Mesh.icosahedron = primitives.icosahedron


//these libraries are added to Mesh
parsers = require('./src/parsers.js')
exports.Mesh.parsers['obj'] = parsers.parseOBJ.bind(exports.Mesh)
exports.Mesh.encoders['obj'] = parsers.encoderOBJ
