//I hate this language;
//classes purely for organizational purposes and ease of initializiation
//no class methods because afaik it slows things down massively as your
//object count increases
const sleep = ms => new Promise(r => setTimeout(r, ms));

function clamp(val, min, max) {
    test = val < min ? min : val;
    return test > max ? max : test;
}

function degToRad(deg) {
    return deg * Math.PI / 180;
}

class vec2d {
    x; y;
    constructor(x=0,y=0) {
        this.x = x; this.y = y;
    }
}

class vec3d {
    x; y; z;
    constructor(x=0,y=0,z=0) {
        this.x = x; this.y = y; this.z = z;
    }
}

class camera {
    pos; rotation; fov; near; far;
    constructor(pos=new vec3d(), rotation=0, fov=0, near=0, far=0) {
        this.pos = pos; this.rotation = rotation; this.fov = fov; this.near = near; this.far = far;
    }
}
//0 for 2d  | 1 for 3d
class renderer { 
    camera; fps; mode;
    constructor(c = new camera(), fps=10, mode=0) {
        this.camera = c; this.fps = fps; this.mode = mode;
    }
}

class scene {
    canvas; context; renderer;
    constructor(canvas = null, context = null, renderer = null) {
        this.canvas = canvas; this.context = context; this.renderer = renderer;
    }
}

export { renderer, camera, vec2d, vec3d, scene, clamp, degToRad, sleep }