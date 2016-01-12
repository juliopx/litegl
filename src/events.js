//This code has been ported from events.py of myou engine
//by Alberto torres ruiz <kungfoobar@gmail.com> and
//Julio Manuel López Tercero <julio@pixelements.net>

// Global input state (to be put in a closure or class)

// All are just 1 or 0
var keys_pressed = new Uint8Array(256);
var keys_just_pressed = new Uint8Array(256);
var keys_just_released = new Uint8Array(256);
var keys_pressed_count = 0;

var NO_MOVE_TICKS = 3;

var mouse = exports.mouse = {
    // mouse x and y are relative to the app root element
    // and they can be negative or out of the element when
    // there's a button pressed
    x: 0,
    y: 0,
    // rel_x and rel_y is the difference from the last frame
    // both when the pointer is unlocked and locked
    rel_x: 0,
    rel_y: 0,
    page_x: 0,
    page_y: 0,
    movement_since_mousedown: 0,
    move_events_since_mousedown: 0,
    left: false,
    middle: false,
    right: false,
    any_button: false,
    wheel: 0,
    // You can assign cancel_wheel = true to prevent the
    // mouse wheel from scrolling
    cancel_wheel: false,
    target: null,
    down_target: null,
    lock_element: false
}

var touch = exports.touch = {};
// This function sets a set of generic event handlers
// for keyboard, mouse, touch... to be used by game logic
// without having to add one listener per key or button

var set_generic_events = exports.set_generic_events = function(root_element) {
    // The root_element is used on mousedown
    // and mousemove when no button is pressed
    // while the window is used on mouseup
    // and mousemove when a button is pressed
    // This way you can drag the mouse out of the window and
    // it keeps working until you release.

    var keydown = function(event) {
        var ae = document.activeElement;
        var code = event.keyCode;
        // F12 is kept pressed after opening the debug console
        if ((ae.value != null) || ae.isContentEditable || code === 123) {
            return;
        }
        var jp = keys_just_pressed[code] = keys_pressed[code] ^ 1;
        keys_pressed[code] = 1;
        keys_pressed_count += jp;
        if (code === 116) { // F5
            // workaround for chrome, reload ends up eating a lot of memory
            location.href = location.href;
            return event.preventDefault();
        }
    }
    document.body.addEventListener('keydown', keydown, false);

    var keyup = function(event) {
        var ae = document.activeElement;
        var code = event.keyCode;
        if ((ae.value != null) || ae.isContentEditable || code === 123) {
            return;
        }
        keys_pressed[code] = 0;
        keys_just_released[code] = 1;
        return keys_pressed_count -= 1;
    }
    document.body.addEventListener('keyup', keyup, false);

    var mousedown = function(event) {
        event.preventDefault();
        mouse[['left', 'middle', 'right'][event.button]] = true;
        mouse.any_button = true;
        mouse.page_x = event.pageX;
        mouse.page_y = event.pageY;
        var x = event.layerX;
        var y = event.layerY;
        var p = event.target;
        while (p !== root_element) {
            x += p.offsetLeft;
            y += p.offsetTop;
            p = p.offsetParent;
        }
        mouse.x = x;
        mouse.y = y;
        mouse.rel_x = 0;
        mouse.rel_y = 0;
        mouse.movement_since_mousedown = 0;
        mouse.move_events_since_mousedown = 0;
        return mouse.down_target = mouse.target = event.target;
    }
    root_element.addEventListener('mousedown', mousedown, false);

    root_element.addEventListener(
        'contextmenu', function(event){return event.preventDefault()}, false
    );

    // This mousemove is only used when no button is pressed
    var mousemove = function(event) {
        if (mouse.any_button) {
            return;
        }
        event.preventDefault();
        var x = event.pageX;
        var y = event.pageY;
        var rel_x = x - mouse.page_x;
        var rel_y = y - mouse.page_y;
        mouse.page_x = x;
        mouse.page_y = y;
        mouse.rel_x += rel_x;
        mouse.rel_y += rel_y;
        mouse.x += rel_x;
        mouse.y += rel_y;
        return mouse.target = event.target;
    }
    root_element.addEventListener('mousemove', mousemove, false);

    // But this mousemove is only used when a button is pressed
    var mousemove_pressed = function(event) {
        if (!mouse.any_button || mouse.lock_element) {
            return;
        }
        event.preventDefault();
        var x = event.pageX;
        var y = event.pageY;
        var rel_x = x - mouse.page_x;
        var rel_y = y - mouse.page_y;
        mouse.move_events_since_mousedown += 1;
        if (mouse.move_events_since_mousedown < NO_MOVE_TICKS) {
            return;
        }
        mouse.page_x = x;
        mouse.page_y = y;
        mouse.rel_x += rel_x;
        mouse.rel_y += rel_y;
        mouse.x += rel_x;
        mouse.y += rel_y;
        mouse.target = event.target;
        return mouse.movement_since_mousedown += Math.abs(rel_x) + Math.abs(rel_y);
    }
    window.addEventListener('mousemove', mousemove_pressed, false);

    var mouseup = function(event) {
        if (!mouse.any_button) {
            return;
        }
        event.preventDefault();
        mouse[['left', 'middle', 'right'][event.button]] = false;
        mouse.any_button = mouse.left || mouse.middle || mouse.right;
        var x = event.pageX;
        var y = event.pageY;
        var rel_x = x - mouse.page_x;
        var rel_y = y - mouse.page_y;
        mouse.page_x = x;
        mouse.page_y = y;
        mouse.rel_x += rel_x;
        mouse.rel_y += rel_y;
        mouse.x += rel_x;
        mouse.y += rel_y;
        return mouse.target = event.target;
    }
    window.addEventListener('mouseup', mouseup, false);

    var wheel = function(event) {
        // this value will eventually be normalized to be pixels or heights
        // until then, we'll have 1 or -1
        mouse.wheel += max(-1, min(1, event.deltaY));
        if (mouse.cancel_wheel) {
            return event.preventDefault();
        }
    }
    root_element.addEventListener('wheel', wheel, false);

    var locked_mousemove = function(event) {
        var rel_x = event.mozMovementX || event.webkitMovementX || event.movementX || 0;
        var rel_y = event.mozMovementY || event.webkitMovementY || event.movementY || 0;
        mouse.move_events_since_mousedown += 1;
        if (mouse.move_events_since_mousedown < NO_MOVE_TICKS) {
            return;
        }
        mouse.rel_x += rel_x;
        mouse.rel_y += rel_y;
        return mouse.movement_since_mousedown += Math.abs(rel_x) + Math.abs(rel_y);
    }

    var pointerlockchange = function(event) {
        if (mouse.lock_element) {
            mouse.lock_element.removeEventListener('mousemove', locked_mousemove);
        }
        var e = document.mozPointerLockElement || document.webkitPointerLockElement || document.pointerLockElement;
        if (e) {
            mouse.lock_element = e;
            e.addEventListener('mousemove', locked_mousemove);
        }
        return mouse.rel_x = mouse.rel_y = 0;
    }
    document.addEventListener('pointerlockchange', pointerlockchange);
    document.addEventListener('mozpointerlockchange', pointerlockchange);
    return document.addEventListener('webkitpointerlockchange', pointerlockchange);
}

var _empty_key_array = new Uint8Array(256);

var reset_frame_events = exports.reset_frame_events = function() {
    keys_just_pressed.set(_empty_key_array);
    keys_just_released.set(_empty_key_array);
    mouse.rel_x = 0;
    mouse.rel_y = 0;
    return mouse.wheel = 0;
}
