// Copy files required
require('!!file?name=man.obj!../static-files/man.obj')

//create the rendering context
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

    //build the mesh
    var mesh = GL.Mesh.fromURL("man.obj");
    var cam_pos = [0,100,250];
    var cam_center = [0,100,0];

    //create basic matrices for cameras and transformation
    var proj = mat4.create();
    var view = mat4.create();
    var model = mat4.create();
    var mvp = mat4.create();
    var temp = mat4.create();


    //set the camera position
    mat4.perspective(proj, 45 * GL.utils.DEG2RAD, gl.canvas.width / gl.canvas.height, 0.1, 1000);

    //basic phong shader
    var shader = new GL.Shader('\
            precision highp float;\
            attribute vec3 a_vertex;\
            attribute vec3 a_normal;\
            varying vec3 v_normal;\
            uniform mat4 u_mvp;\
            uniform mat4 u_model;\
            void main() {\
                v_normal = (u_model * vec4(a_normal,0.0)).xyz;\
                gl_Position = u_mvp * vec4(a_vertex,1.0);\
            }\
            ', '\
            precision highp float;\
            varying vec3 v_normal;\
            uniform vec3 u_lightvector;\
            uniform vec4 u_camera_position;\
            uniform vec4 u_color;\
            void main() {\
              vec3 N = normalize(v_normal);\
              gl_FragColor = u_color * max(0.0, dot(u_lightvector,N));\
            }\
        ');


    //generic gl flags and settings
    gl.clearColor(0.1,0.1,0.1,1);
    gl.enable( gl.DEPTH_TEST );

    //rendering loop
    gl.ondraw = function()
    {
        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
        mat4.lookAt(view, cam_pos, cam_center, [0,1,0]);

        //create modelview and projection matrices
        mat4.multiply(temp,view,model);
        mat4.multiply(mvp,proj,temp);

        //render mesh using the shader
        if(mesh)
            shader.uniforms({
                u_color: [1,1,1,1],
                u_lightvector: vec3.normalize(vec3.create(),[1,1,1]),
                u_camera_position: cam_pos,
                u_model: model,
                u_mvp: mvp
            }).draw(mesh);
    };

    //update loop
    gl.onforceupdate = function(dt)
    {
        //rotate world
        mat4.rotateY(model,model,dt*0.2);
    };



    //Allows to DRAG AND DROP files
    var dropbox = document.body;
    dropbox.addEventListener("dragenter", onDragEvent, false);
    function onDragEvent(evt)
    {
        for(var i in evt.dataTransfer.types)
            if(evt.dataTransfer.types[i] == "Files")
            {
                if(evt.type != "dragover") console.log("Drag event: " + evt.type);
                evt.stopPropagation();
                evt.preventDefault();

                dropbox.addEventListener("dragexit", onDragEvent, false);
                dropbox.addEventListener("dragover", onDragEvent, false);
                dropbox.addEventListener("drop", onDrop, false);
            }
    }

    function onDrop(evt)
    {
        dropbox.removeEventListener("dragexit", onDragEvent, false);
        dropbox.removeEventListener("dragover", onDragEvent, false);
        dropbox.removeEventListener("drop", onDrop, false);
        //load file in memory
        onFileDrop(evt);
    }

    function onFileDrop(evt)
    {
        evt.stopPropagation();
        evt.preventDefault();

        var files = evt.dataTransfer.files;
        var count = files.length;

        for(var i=0; i < files.length; i++)
        {
            var file = files[i];
            var reader = new FileReader();
            reader.onload = function(e) {
                var data = e.target.result;
                mesh.parse( data, "obj" );
                console.log(mesh.bounding);
                cam_center = GL.geometry.BBox.getCenter( mesh.bounding );
                var r = GL.geometry.BBox.getRadius( mesh.bounding );
                cam_pos = vec3.add( cam_pos, cam_center, [0,r*0.5, r*2] );
            };
            reader.readAsText(file);
        }
    }
    
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
        events.reset_frame_events()
    };
}
init()
