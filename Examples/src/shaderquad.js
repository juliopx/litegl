//create the rendering context
var GL = require('../../litegl.js');
var glm = GL.glmatrix, mat3=glm.mat3, mat4=glm.mat4,
    vec2=glm.vec2, vec3=glm.vec3, vec4=glm.vec4, quat=glm.quat;
var Shader = GL.Shader
var DEG2RAD = GL.utils.DEG2RAD
var getTime = GL.utils.getTime

var container = document.body;

var gl = GL.create({width: container.offsetWidth, height: container.offsetHeight});
container.appendChild(gl.canvas);
gl.animate();
gl.captureMouse();
var pos = [0,0];


//build the mesh
var texture = GL.Texture.fromURL("texture.png",{temp_color:[80,120,40,255], minFilter: gl.LINEAR_MIPMAP_LINEAR});

//basic distort shader
var shader = new Shader( Shader.SCREEN_VERTEX_SHADER, "\
    precision highp float;\n\
    uniform sampler2D texture;\n\
    uniform float u_time;\n\
    uniform vec2 u_mousepos;\n\
    varying vec2 v_coord;\n\
    void main() {\n\
        vec2 n = (v_coord - u_mousepos);\n\
        float l = length(n);\n\
        n /= l;\n\
        vec2 uv = v_coord - n * 0.1;\n\
        gl_FragColor = texture2D(texture, uv);\n\
    }\n\
");


//rendering loop
gl.ondraw = function()
{
    //render mesh using the shader
    texture.bind(0);
    shader.toViewport({
        u_texture: 0,
        u_time: getTime() * 0.001,
        u_mousepos: [pos[0]/gl.canvas.width,pos[1]/gl.canvas.height]
    });
};

gl.onmousemove = function(e)
{
    pos[0] = e.canvasx;
    pos[1] = e.canvasy;
}
