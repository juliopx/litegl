
var GL = require('../../litegl.js');
var glm = GL.glmatrix, mat3=glm.mat3, mat4=glm.mat4,
    vec2=glm.vec2, vec3=glm.vec3, vec4=glm.vec4, quat=glm.quat;

function init()
{
    //create the rendering context
    var container = document.body;

    var gl = GL.create({width: container.offsetWidth, height: container.offsetHeight});
    container.appendChild(gl.canvas);
    gl.animate();

    var cam_pos = [0,100,250];

    var mesh = GL.Mesh.load({ vertices: [0,0,0, 0,100,0,  0,0,0, 100,0,0,  0,0,0, 0,0,100],
                            colors: [1,0,0,1, 1,0,0,1,  1,1,1,1, 1,1,1,1,  0,0,1,1, 0,0,1,1 ] });

    //create basic matrices for cameras and transformation
    var persp = mat4.create();
    var view = mat4.create();
    var model = mat4.create();
    var mvp = mat4.create();
    var temp = mat4.create();


    //set the camera position
    mat4.perspective(persp, 45 * GL.utils.DEG2RAD, gl.canvas.width / gl.canvas.height, 0.1, 1000);
    mat4.lookAt(view, cam_pos,[0,0,0], [0,1,0]);

    //basic phong shader
    var shader = new GL.Shader('\
            precision highp float;\
            attribute vec3 a_vertex;\
            attribute vec4 a_color;\
            uniform mat4 u_mvp;\
            varying vec4 v_color;\
            void main() {\
                v_color = a_color;\
                gl_Position = u_mvp * vec4(a_vertex,1.0);\
            }\
            ', '\
            precision highp float;\
            uniform vec4 u_color;\
            varying vec4 v_color;\
            void main() {\
              gl_FragColor = u_color * v_color;\
            }\
        ');


    //generic gl flags and settings
    gl.clearColor(0.1,0.1,0.1,1);
    gl.disable( gl.DEPTH_TEST );

    //rendering loop
    gl.ondraw = function()
    {
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

        //create modelview and projection matrices
        mat4.lookAt(view, cam_pos,[0,0,0], [0,1,0]);
        mat4.multiply(temp,view,model);
        mat4.multiply(mvp,persp,temp);

        //compute rotation matrix for normals
        var modelt = mat4.toRotationMat4(mat4.create(), model);

        //render mesh using the shader
        if(mesh)
            shader.uniforms({
                u_color: [1,1,1,1],
                u_mvp: mvp
            }).draw(mesh, gl.LINES);

        //define the elememt that will recive the events:
        var events = GL.events
        events.set_generic_events(container)

        gl.onupdate = function(dt)
        {
            if(events.mouse.left === true){
                mat4.rotateY(model,model,events.mouse.rel_x * 0.01);
                cam_pos[1] += events.mouse.rel_y;
            }
            events.reset_frame_events()
        }
    };

    //update loop
    gl.onforceupdate = function(dt)
    {
        //rotate world
        mat4.rotateY(model,model,dt*0.2);
    };
}
init()
