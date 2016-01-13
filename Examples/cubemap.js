
// Copy example.html and files required by index.html in webpack
require('file?name=example.html!./example.html')
require('!!file?name=cross-cubemap.png!./cross-cubemap.png')
require('file?name=style.css!./style.css')

//create the rendering context
var container = document.body;
var GL = require('../litegl.js');
var glm = GL.glmatrix, mat3=glm.mat3, mat4=glm.mat4,
    vec2=glm.vec2, vec3=glm.vec3, vec4=glm.vec4, quat=glm.quat;
var gl = GL.create({width: container.offsetWidth, height: container.offsetHeight});
container.appendChild(gl.canvas);
gl.animate();

window.GL = GL
//build the mesh
var mesh = GL.Mesh.primitives.sphere({size:10});
var texture = GL.Texture.cubemapFromURL("cross-cubemap.png",{temp_color:[80,120,40,255], is_cross: 1, minFilter: gl.LINEAR_MIPMAP_LINEAR });

//create basic matrices for cameras and transformation
var proj = mat4.create();
var view = mat4.create();
var model = mat4.create();
var mvp = mat4.create();
var temp = mat4.create();

//set the camera position
mat4.perspective( proj, 45 * GL.utils.DEG2RAD, gl.canvas.width / gl.canvas.height, 0.1, 1000);
mat4.lookAt(view, [0,30,30],[0,0,0], [0,1,0]);

//basic phong shader
var shader = new GL.Shader('\
        precision highp float;\
        attribute vec3 a_vertex;\
        attribute vec3 a_normal;\
        varying vec3 v_normal;\
        uniform mat4 u_model;\
        uniform mat4 u_mvp;\
        void main() {\
            v_normal = a_normal;\
            gl_Position = u_mvp * vec4(a_vertex,1.0);\
        }\
        ', '\
        precision highp float;\
        varying vec3 v_normal;\
        varying vec2 v_coord;\
        uniform samplerCube u_texture;\
        uniform vec3 u_camera_eye;\
        void main() {\
          vec3 N = normalize(v_normal);\
          vec4 color = textureCube( u_texture, N );\
          gl_FragColor = color;\
        }\
    ');

//generic gl flags and settings
gl.clearColor(0.1,0.1,0.1,1);
gl.enable( gl.DEPTH_TEST );

//rendering loop
gl.ondraw = function()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

    //create modelview and projection matrices
    mat4.multiply(temp,view,model);
    mat4.multiply(mvp,proj,temp);

    //compute rotation matrix for normals
    texture.bind(0);

    //render mesh using the shader
    shader.uniforms({
        u_model: model,
        u_texture: 0,
        u_mvp: mvp
    }).draw(mesh);
};
//define the elememt that will recive the events:
var events = GL.events
events.set_generic_events(container)

//update loop
gl.onupdate = function(dt)
{
    //constant sphere rotation
    mat4.rotateY(model,model,dt*0.2);

    //rotate sphere acording mouse movement
    if(events.mouse.left === true){
    mat4.rotateY(model,model,dt*events.mouse.rel_x * 0.5)
    }
    if(events.mouse.left === true){
    mat4.rotateX(model,model,dt*events.mouse.rel_y * 0.5)
    }
    events.reset_frame_events()
};
