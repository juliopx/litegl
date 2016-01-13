
var GL = require('../../litegl.js');
var glm = GL.glmatrix, mat3=glm.mat3, mat4=glm.mat4,
    vec2=glm.vec2, vec3=glm.vec3, vec4=glm.vec4, quat=glm.quat;
var Shader = GL.Shader
var DEG2RAD = GL.utils.DEG2RAD

//create the rendering context
var gl = GL.create({width: window.innerWidth,height: window.innerHeight});
var container = document.body;
container.appendChild(gl.canvas);
gl.animate();

//build the mesh
var mesh = GL.Mesh.cube({size:10});
var sphere = GL.Mesh.sphere({size:100});
var texture = new GL.Texture(512,512, { magFilter: gl.LINEAR });

//create basic matrices for cameras and transformation
var persp = mat4.create();
var view = mat4.create();
var model = mat4.create();
var model2 = mat4.create();
var mvp = mat4.create();
var temp = mat4.create();
var identity = mat4.create();

//get mouse actions
gl.captureMouse();
gl.onmousemove = function(e)
{
    if(e.dragging)
        mat4.rotateY(model,model,e.deltax * 0.01);
}

//set the camera position
mat4.perspective(persp, 45 * DEG2RAD, gl.canvas.width / gl.canvas.height, 0.1, 1000);
mat4.lookAt(view, [0,20,20],[0,0,0], [0,1,0]);

//basic shader
var shader = new Shader('\
        precision highp float;\
        attribute vec3 a_vertex;\
        attribute vec3 a_normal;\
        attribute vec2 a_coord;\
        varying vec3 v_normal;\
        varying vec2 v_coord;\
        uniform mat4 u_mvp;\
        uniform mat4 u_model;\
        void main() {\
            v_coord = a_coord;\
            v_normal = (u_model * vec4(a_normal,0.0)).xyz;\
            gl_Position = u_mvp * vec4(a_vertex,1.0);\
        }\
        ', '\
        precision highp float;\
        varying vec3 v_normal;\
        varying vec2 v_coord;\
        uniform vec4 u_color;\
        uniform sampler2D u_texture;\
        void main() {\
          vec3 N = normalize(v_normal);\
          gl_FragColor = u_color * texture2D( u_texture, v_coord);\
        }\
    ');

var flat_shader = new Shader('\
        precision highp float;\
        attribute vec3 a_vertex;\
        uniform mat4 u_mvp;\
        void main() {\
            gl_Position = u_mvp * vec4(a_vertex,1.0);\
            gl_PointSize = 4.0;\
        }\
        ', '\
        precision highp float;\
        uniform vec4 u_color;\
        void main() {\
          gl_FragColor = u_color;\
        }\
    ');

//generic gl flags and settings
gl.clearColor(0.1,0.1,0.1,1);
gl.enable( gl.DEPTH_TEST );

//rendering loop
gl.ondraw = function()
{

    //render something in the texture
    texture.drawTo(function(){
        gl.clearColor(0.1,0.3,0.4,1);
        //gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

        //create modelview and projection matrices
        mat4.multiply(temp,view,model2);
        mat4.multiply(mvp,persp,temp);

        flat_shader.uniforms({
            u_color: [Math.sin( GL.utils.getTime() * 0.001 ),0.3,0.1,1],
            u_model: model2,
            u_mvp: mvp
        }).draw(sphere, gl.POINTS);
    });

    gl.clearColor(0.1,0.1,0.1,1);
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
    //create modelview and projection matrices
    mat4.multiply(temp,view,model);
    mat4.multiply(mvp,persp,temp);

    //render mesh using the shader
    shader.uniforms({
        u_color: [1,1,1,1],
        u_model: model,
        u_texture: texture.bind(0),
        u_mvp: mvp
    }).draw(mesh);
};

//update loop
gl.onupdate = function(dt)
{
    //rotate cube
    mat4.rotateY(model,model,dt*0.2);
    mat4.rotate(model2,model2,dt*0.1,[0,1, Math.sin( GL.utils.getTime() * 0.001 ) ]);
};
