//I hate this language;
//classes purely for organizational purposes and ease of initializiation
//no class methods because afaik it slows things down massively as your
//object count increases
const WorkSpaceSize = 1000;
const scaleFactor = 10.0;

const sleep = ms => new Promise(r => setTimeout(r, ms));

function clamp(val, min, max) {
    const test = val < min ? min : val;
    return test > max ? max : test;
}

function arcToArcWithBulge(arc) {
    const startAngle = arc.startAngle   
    let endAngle = arc.endAngle
    if (startAngle > endAngle) {
        //if start angle is greater than end this will draw the arc
        //everywhere except where we want it
        endAngle += 2 * Math.PI;
    }
    const startX = arc.center.x + Math.abs(arc.radius) * Math.cos(startAngle);
    const startY = arc.center.y + Math.abs(arc.radius) * Math.sin(startAngle);
    const endX = arc.center.x + Math.abs(arc.radius) * Math.cos(endAngle);
    const endY = arc.center.y + Math.abs(arc.radius) * Math.sin(endAngle);
    const bulge = Math.tan((endAngle - startAngle) * .25);
// parser deals with bulge arcs by using sequential vertices
// this uses the first vertice bulge, therefore I only store it once.
    return [{
        x: startX,
        y: startY,
        bulge: bulge
    }, {
       x: endX,
       y: endY 
    }]
}
//create a function which scales to something universal?
function scaleVert(vert) {
    return {
        x: vert.x * scaleFactor,
        y: vert.y * scaleFactor,
        z: 1
    };
}
function scaleVerts(verts) {

    let totalX = 0;
    let totalY = 0;
    const newVerts = [];
    for (let i = 0; i < verts.length; i++) {
        const v = verts[i];
        if (verts.center) {
            totalX += verts.center.x;
            totalY += verts.center.y;
        } else {
            totalX += v.x;
            totalY += v.y;
        }
    }

    const shapeCenter = new vec2d(totalX / verts.length, totalY / verts.length);

    for (let i = 0; i < verts.length; i++) {
        let curVert = verts[i];
        let translatedVert = new vec2d(
            curVert.x - shapeCenter.x,
            curVert.y - shapeCenter.y
        );

        let scaledVert = new vec2d(
            translatedVert.x * scaleFactor,
            translatedVert.y * scaleFactor
        );

        let retranslatedVert = new vec2d(
            scaledVert.x + shapeCenter.x,
            scaledVert.y + shapeCenter.y
        );
        if (verts[i].bulge) {
            retranslatedVert.bulge = verts[i].bulge;
        }
        newVerts.push(retranslatedVert)
    }
    return newVerts;    
}

function rotatePoint(point, rotation) {
    let sinX = Math.sin(rotation.x);
    let cosX = Math.cos(rotation.x);
    let sinY = Math.sin(rotation.y);
    let cosY = Math.cos(rotation.y);
    let sinZ = Math.sin(rotation.z);
    let cosZ = Math.cos(rotation.z);
    let dx = point.x * cosY * cosZ + point.y * (cosZ * sinX * sinY - cosX * sinZ) + point.z * (sinX * sinZ + cosX * cosZ * sinY);
    let dy = point.x * cosY * sinZ + point.y * (cosX * cosZ + sinX * sinY * sinZ) + point.z * (cosX * sinY * sinZ - cosZ * sinX);
    let dz = point.x * -sinY + point.y * cosY * sinX + point.z * cosX * cosY;

    return new vec3d(dx, dy, dz);
}

function normalizeCoordinates2D(originalX, originalY, minX, maxX, minY, maxY) {
    let normalizedX = 2 * (originalX - minX) / (maxX - minX) - 1;
    let normalizedY = 2 * (originalY - minY) / (maxY - minY) - 1;
    return new vec3d(normalizedX, normalizedY, 1);
}

function normalize2DCoordinatesToScreen(point) {
    let normalizedX = 2 * (point.x - (-WorkSpaceSize)) / (WorkSpaceSize - (-WorkSpaceSize)) - 1;
    let normalizedY = 2 * (point.y - (-WorkSpaceSize)) / (WorkSpaceSize - (-WorkSpaceSize)) - 1 ;
    return new vec3d(normalizedX, normalizedY,1);
}

// Function to un-normalize 2D coordinates
function unNormalizeCoordinates2D(normalizedX, normalizedY, minX, maxX, minY, maxY) {
    let originalX = normalizedX * (maxX - minX) + minX;
    let originalY = normalizedY * (maxY - minY) + minY;
    return new vec3d(originalX, originalY, 0);
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
    constructor(pos=new vec3d(), rotation=new vec3d(), fov=0, near=0, far=0) {
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
    canvas; context; renderer; entities;
    constructor(canvas = null, context = null, renderer = null, entities = []) {
        this.canvas = canvas; this.context = context; this.renderer = renderer; this.entities = entities;
    }
}

class mouseInput {
    active; initialPosition;
    constructor() {
        this.active = false;
        this.initialPosition = new vec2d();
    }
}

export { renderer, camera, vec2d, 
        vec3d, scene, mouseInput, 
        clamp, degToRad, sleep, 
        normalizeCoordinates2D, normalize2DCoordinatesToScreen,  unNormalizeCoordinates2D, 
         rotatePoint, arcToArcWithBulge, scaleVerts, scaleVert, WorkSpaceSize, scaleFactor }