"use_strict";
/**
* creates a new WebGL context (it can create the canvas or use an existing one)
* @method create
* @param {Object} options supported are: width, height, canvas
* @return {gl} gl context for webgl
*/
var GL = module.exports;
var glm = require('./gl-matrix-extra.js'), mat3=glm.mat3, mat4=glm.mat4,
	vec2=glm.vec2, vec3=glm.vec3, vec4=glm.vec4, quat=glm.quat;
var Texture = require('./texture.js').Texture;
var LEvent = require('./levent.js').LEvent;
var utils = require('./utils.js');

var last_context_id = 0

GL.create = function(options) {
	options = options || {};
	var canvas = null;
	if(options.canvas)
	{
		if(typeof(options.canvas) == "string")
		{
			canvas = document.getElementById( options.canvas );
			if(!canvas) throw("Canvas element not found: " + options.canvas );
		}
		else
			canvas = options.canvas;
	}
	else
		canvas = utils.createCanvas(  options.width || 800, options.height || 600 );

	if (!('alpha' in options)) options.alpha = false;
	try { window.gl = canvas.getContext('webgl', options); } catch (e) {}
	try { window.gl = window.gl || canvas.getContext('experimental-webgl', options); } catch (e) {}
	if (!window.gl) { throw 'WebGL not supported'; }

	/**
	* the webgl context returned by create, its a WebGLRenderingContext with some extra methods added
	* @class gl
	*/
	var gl = window.gl;

	canvas.is_webgl = true;
	gl.context_id = last_context_id++;

	//get some common extensions
	gl.extensions = {};
	gl.extensions["OES_standard_derivatives"] = gl.derivatives_supported = gl.getExtension('OES_standard_derivatives') || false;
	gl.extensions["WEBGL_depth_texture"] = gl.getExtension("WEBGL_depth_texture") || gl.getExtension("WEBKIT_WEBGL_depth_texture") || gl.getExtension("MOZ_WEBGL_depth_texture");
	gl.extensions["OES_element_index_uint"] = gl.getExtension("OES_element_index_uint");
	gl.extensions["WEBGL_draw_buffers"] = gl.getExtension("WEBGL_draw_buffers");
	gl.extensions["EXT_shader_texture_lod"] = gl.getExtension("EXT_shader_texture_lod");
	gl.extensions["EXT_sRGB"] = gl.getExtension("EXT_sRGB");
	gl.extensions["EXT_texture_filter_anisotropic"] = gl.getExtension("EXT_texture_filter_anisotropic") || gl.getExtension("WEBKIT_EXT_texture_filter_anisotropic") || gl.getExtension("MOZ_EXT_texture_filter_anisotropic");
	gl.extensions["EXT_frag_depth"] = gl.getExtension("EXT_frag_depth") || gl.getExtension("WEBKIT_EXT_frag_depth") || gl.getExtension("MOZ_EXT_frag_depth");
	gl.extensions["WEBGL_lose_context"] = gl.getExtension("WEBGL_lose_context") || gl.getExtension("WEBKIT_WEBGL_lose_context") || gl.getExtension("MOZ_WEBGL_lose_context");

	//for float textures
	gl.extensions["OES_texture_float_linear"] = gl.getExtension("OES_texture_float_linear");
	if(gl.extensions["OES_texture_float_linear"])
		gl.extensions["OES_texture_float"] = gl.getExtension("OES_texture_float");

	gl.extensions["OES_texture_half_float_linear"] = gl.getExtension("OES_texture_half_float_linear");
	if(gl.extensions["OES_texture_half_float_linear"])
		gl.extensions["OES_texture_half_float"] = gl.getExtension("OES_texture_half_float");

	gl.HALF_FLOAT_OES = 0x8D61;
	if(gl.extensions["OES_texture_half_float"])
		gl.HALF_FLOAT_OES = gl.extensions["OES_texture_half_float"].HALF_FLOAT_OES;
	gl.HIGH_PRECISION_FORMAT = gl.extensions["OES_texture_half_float"] ? gl.HALF_FLOAT_OES : (gl.extensions["OES_texture_float"] ? gl.FLOAT : gl.UNSIGNED_BYTE); //because Firefox dont support half float

	gl.max_texture_units = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);

	//viewport hack to retrieve it without using getParameter (which is slow)
	gl._viewport_func = gl.viewport;
	gl.viewport_data = new Float32Array([0,0,gl.canvas.width,gl.canvas.height]); //32000 max viewport, I guess its fine
	gl.viewport = function(a,b,c,d) { var v = this.viewport_data; v[0] = a|0; v[1] = b|0; v[2] = c|0; v[3] = d|0; this._viewport_func(a,b,c,d); }
	gl.getViewport = function(v) {
		if(v) { v[0] = gl.viewport_data[0]; v[1] = gl.viewport_data[1]; v[2] = gl.viewport_data[2]; v[3] = gl.viewport_data[3]; return v; }
		return new Float32Array( gl.viewport_data );
	};
	gl.setViewport = function(v) { gl.viewport_data.set(v); this._viewport_func(v[0],v[1],v[2],v[3]); };

	var last_click_time = 0;
	gl.mouse_buttons = 0;

	//some window containers, use them to reuse assets
	gl.shaders = {};
	gl.textures = {};
	gl.meshes = {};

	/**
	* sets this context as the current window gl context (in case you have more than one)
	* @method makeCurrent
	*/
	gl.makeCurrent = function()
	{
		window.gl = this;
	}

	/**
	* executes callback inside this webgl context
	* @method execute
	* @param {Function} callback
	*/
	gl.execute = function(callback)
	{
		var old_gl = window.gl;
		window.gl = this;
		callback();
		window.gl = old_gl;
	}


	/**
	* Launch animation loop (calls gl.onupdate and gl.ondraw every frame)
	* example: gl.ondraw = function(){ ... }   or  gl.onupdate = function(dt) { ... }
	* @method animate
	*/
	gl.animate = function(v) {
		if(v === false)
		{
			window.cancelAnimationFrame( this._requestFrame_id );
			this._requestFrame_id = null;
			return;
		}

		var post = window.requestAnimationFrame;
		var time = utils.getTime();
		var context = this;

		//loop only if browser tab visible
		function draw_loop() {
			if(gl.destroyed) //to stop rendering once it is destroyed
				return;

			context._requestFrame_id = post(draw_loop); //do it first, in case it crashes

			var now = utils.getTime();
			var dt = (now - time) * 0.001;

			if (context.onupdate)
				context.onupdate(dt);
			LEvent.trigger(gl,"update",dt);
			if (context.ondraw)
			{
				//make sure the ondraw is called using this gl context (in case there is more than one)
				var old_gl = window.gl;
				window.gl = context;
				//call ondraw
				context.ondraw();
				LEvent.trigger(gl,"draw");
				//restore old context
				window.gl = old_gl;
			}
			time = now;
		}
		this._requestFrame_id = post(draw_loop); //launch main loop
	}

	//store binded to be able to remove them if destroyed
	/*
	var _binded_events = [];
	function addEvent(object, type, callback)
	{
		_binded_events.push(object,type,callback);
	}
	*/

	/**
	* Destroy this WebGL context (removes also the Canvas from the DOM)
	* @method destroy
	*/
	gl.destroy = function() {
		//unbind window events
		if(onkey_handler)
		{
			document.removeEventListener("keydown", onkey_handler );
			document.removeEventListener("keyup", onkey_handler );
		}

		if(this.canvas.parentNode)
			this.canvas.parentNode.removeChild(this.canvas);
		this.destroyed = true;
		if(window.gl == this)
			window.gl = null;
	}

	var mouse = gl.mouse = {
		left_button: false,
		middle_button: false,
		right_button: false,
		x:0,
		y:0,
		deltax: 0,
		deltay: 0,
		isInsideRect: function(x,y,w,h, flip_y )
		{
			var mouse_y = this.y;
			if(flip_y)
				mouse_y = gl.canvas.height - mouse_y;
			if( this.x > x && this.x < x + w &&
				mouse_y > y && mouse_y < y + h)
				return true;
			return false;
		}
	};

	/**
	* Tells the system to capture mouse events on the canvas.
	* This will trigger onmousedown, onmousemove, onmouseup, onmousewheel callbacks assigned in the gl context
	* example: gl.onmousedown = function(e){ ... }
	* The event is a regular MouseEvent with some extra parameters
	* @method captureMouse
	* @param {boolean} capture_wheel capture also the mouse wheel
	*/
	gl.captureMouse = function(capture_wheel) {

		canvas.addEventListener("mousedown", onmouse);
		canvas.addEventListener("mousemove", onmouse);
		if(capture_wheel)
		{
			canvas.addEventListener("mousewheel", onmouse, false);
			canvas.addEventListener("wheel", onmouse, false);
			//canvas.addEventListener("DOMMouseScroll", onmouse, false); //deprecated or non-standard
		}
		//prevent right click context menu
		canvas.addEventListener("contextmenu", function(e) { e.preventDefault(); return false; });

		canvas.addEventListener("touchstart", ontouch, true);
		canvas.addEventListener("touchmove", ontouch, true);
		canvas.addEventListener("touchend", ontouch, true);
		canvas.addEventListener("touchcancel", ontouch, true);

		canvas.addEventListener('gesturestart', ongesture );
		canvas.addEventListener('gesturechange', ongesture );
		canvas.addEventListener('gestureend', ongesture );
	}

	/**
	* launches de canvas in fullscreen mode
	* @method fullscreen
	*/
	gl.fullscreen = function()
	{
		var c = this.canvas;
		if(c.requestFullScreen)
			c.requestFullScreen();
		else if(c.webkitRequestFullScreen)
			c.webkitRequestFullScreen();
		else if(c.mozRequestFullScreen)
			c.mozRequestFullScreen();
		else
			console.error("Fullscreen not supported");
	}

	/**
	* returns a canvas with a snapshot of an area
	* this is safer than using the canvas itself due to internals of webgl
	* @method snapshot
	* @param {Number} startx viewport x coordinate
	* @param {Number} starty viewport y coordinate from bottom
	* @param {Number} areax viewport area width
	* @param {Number} areay viewport area height
	* @return {Canvas} canvas
	*/
	gl.snapshot = function(startx, starty, areax, areay, skip_reverse)
	{
		var c = createCanvas(areax,areay);
		var old_ctx = c.getContext("2d");
		var pixels = old_ctx.getImageData(0,0,c.width,c.height);

		var buffer = new Uint8Array(areax * areay * 4);
		gl.readPixels(startx, starty, c.width, c.height, gl.RGBA,gl.UNSIGNED_BYTE, buffer);

		pixels.data.set( buffer );
		old_ctx.putImageData(pixels,0,0);

		if(skip_reverse)
			return canvas;

		//flip image
		var final_canvas = createCanvas(areax,areay);
		var new_ctx = final_canvas.getContext("2d");
		new_ctx.translate(0,areay);
		new_ctx.scale(1,-1);
		new_ctx.drawImage(canvas,0,0);

		return final_canvas;
	}


	//mini textures manager
	var loading_textures = {};
	/**
	* returns a texture and caches it inside gl.textures[]
	* @method loadTexture
	* @param {String} url
	* @param {Object} options (same options as when creating a texture)
	* @param {Function} callback function called once the texture is loaded
	* @return {Texture} texture
	*/
	gl.loadTexture = function(url, options, on_load)
	{
		if(this.textures[ url ])
			return this.textures[url];

		if( loading_textures[url] )
			return null;

		var img = new Image();
		img.url = url;
		img.onload = function()
		{
			var texture = Texture.fromImage(this, options);
			texture.img = this;
			gl.textures[this.url] = texture;
			delete loading_textures[this.url];
			if(on_load)
				on_load(texture);
		}
		img.src = url;
		loading_textures[url] = true;
		return null;
	}

	/**
	* draws a texture to the viewport
	* @method drawTexture
	* @param {Texture} texture
	* @param {number} x in viewport coordinates
	* @param {number} y in viewport coordinates
	* @param {number} w in viewport coordinates
	* @param {number} h in viewport coordinates
	* @param {number} tx texture x in texture coordinates
	* @param {number} ty texture y in texture coordinates
	* @param {number} tw texture width in texture coordinates
	* @param {number} th texture height in texture coordinates
	*/
	gl.drawTexture = (function() {
		//static variables: less garbage
		var identity = mat3.create();
		var pos = vec2.create();
		var size = vec2.create();
		var area = vec4.create();
		var white = vec4.fromValues(1,1,1,1);
		var viewport = vec2.create();
		var _uniforms = {u_texture: 0, u_position: pos, u_color: white, u_size: size, u_texture_area: area, u_viewport: viewport, u_transform: identity };

		return (function(texture, x,y, w,h, tx,ty, tw,th, shader, uniforms)
		{
			pos[0] = x;	pos[1] = y;
			if(w === undefined)
				w = texture.width;
			if(h === undefined)
				h = texture.height;
			size[0] = w;
			size[1] = h;

			if(tx === undefined) tx = 0;
			if(ty === undefined) ty = 0;
			if(tw === undefined) tw = texture.width;
			if(th === undefined) th = texture.height;

			area[0] = tx / texture.width;
			area[1] = ty / texture.height;
			area[2] = (tx + tw) / texture.width;
			area[3] = (ty + th) / texture.height;

			viewport[0] = this.viewport_data[2];
			viewport[1] = this.viewport_data[3];

			shader = shader || Shader.getPartialQuadShader(this);
			var mesh = Mesh.getScreenQuad(this);
			texture.bind(0);
			shader.uniforms( _uniforms );
			if( uniforms )
				shader.uniforms( uniforms );
			shader.draw( mesh, gl.TRIANGLES );
		});
	})();

	gl.canvas.addEventListener("webglcontextlost", function(e) {
		e.preventDefault();
		if(gl.onlosecontext)
			gl.onlosecontext(e);
	}, false);

	/**
	* use it to reset the the initial gl state
	* @method gl.reset
	*/
	gl.reset = function()
	{
		//viewport
		gl.viewport(0,0, this.canvas.width, this.canvas.height );

		//flags
		gl.disable( gl.BLEND );
		gl.disable( gl.CULL_FACE );
		gl.disable( gl.DEPTH_TEST );
		gl.frontFace( gl.CCW );

		//texture
		gl._current_texture_drawto = null;
		gl._current_fbo_color = null;
		gl._current_fbo_depth = null;
	}

	//Reset state
	gl.reset();

	//Return
	return gl;
}
