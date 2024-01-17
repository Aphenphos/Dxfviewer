//I hate this language;
//classes purely for organizational purposes and ease of initializiation
//no class methods because afaik it slows things down massively as your

//object count increases
const WorldSpaceSize = 1000;
const scaleFactor = 10.0;

const sleep = ms => new Promise(r => setTimeout(r, ms));

function clamp(val, min, max) {
    const test = val < min ? min : val;
    return test > max ? max : test;
}

function normalize_array(arr) {

    const normalize = function(val, max, min) { 
      return (val - min) / (max - min); 
    }
  
    const maxX = Math.max.apply(null, arr.map(function(obj) { return obj.x; })) 
    const minX = Math.min.apply(null, arr.map(function(obj) { return obj.x; }))
    
    const maxY = Math.max.apply(null, arr.map(function(obj) { return obj.y; })) 
    const minY = Math.min.apply(null, arr.map(function(obj) { return obj.y; }))
  
    const hold_normed_values=[]
    arr.forEach(function(this_obj) {
      hold_normed_values.push({
        x: normalize(this_obj.x, maxX, minX),
        y: normalize(this_obj.y, maxY, minY)
      })
    })
  
    return hold_normed_values;
  
  }

function arcToArcWithBulge(arc) {
    const startAngle = arc.startAngle   
    let endAngle = arc.endAngle
    if (startAngle > endAngle) {
        //if start angle is greater than end this will draw the arc
        //everywhere except where we want it | Add full circle of radians to correct it
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
    const result = new vec3d(normalizedX, normalizedY, 1)
    return result;
}

function normalize2DCoordinatesToScreen(point) {
    let normalizedX = 2 * (point.x - (-WorldSpaceSize)) / (WorldSpaceSize - (-WorldSpaceSize)) - 1;
    let normalizedY = 2 * (point.y - (-WorldSpaceSize)) / (WorldSpaceSize - (-WorldSpaceSize)) - 1 ;
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

function last(array) {
    return array[array.length - 1];
}
class vec2d {
    x; y; z;
    constructor(x=0,y=0) {
        this.x = x; this.y = y; this.z = 1;
    }
    scale(scaleFactor) {
        this.x = this.x * scaleFactor;
        this.y = this.y * scaleFactor;
    }
    normalize(min, max) {
        this.x = 2 * (this.x - min.x) / (max.x - min.x) - 1;
        this.y = 2 * (this.y - min.y) / (max.y - min.y) - 1;
    }
    translate(translation) {
        this.x += translation.x; this.y += translation.y;
    }
    unNormalize(min, max) {
        this.x = this.x * (max.x - min.x) + min.x;
        this.y = this.y * (max.y - min.y) + min.y;
    }
    normalizeToWorld() {
        this.x = 2 * (this.x - (-WorldSpaceSize)) / (WorldSpaceSize - (-WorldSpaceSize)) - 1;
        this.y = 2 * (this.y - (-WorldSpaceSize)) / (WorldSpaceSize - (-WorldSpaceSize)) - 1;
    }
}

class vec3d {
    x; y; z;
    constructor(x=0,y=0,z=0) {
        this.x = x; this.y = y; this.z = z;
    }
    scale(scaleFactor) {
        this.x = this.x * scaleFactor;
        this.y = this.y * scaleFactor;
        this.z = this.z * scaleFactor;
    }
    rotate(rotation) {
        let sinX = Math.sin(rotation.x);
        let cosX = Math.cos(rotation.x);
        let sinY = Math.sin(rotation.y);
        let cosY = Math.cos(rotation.y);
        let sinZ = Math.sin(rotation.z);
        let cosZ = Math.cos(rotation.z);
        let dx = this.x * cosY * cosZ + this.y * (cosZ * sinX * sinY - cosX * sinZ) + this.z * (sinX * sinZ + cosX * cosZ * sinY);
        let dy = this.x * cosY * sinZ + this.y * (cosX * cosZ + sinX * sinY * sinZ) + this.z * (cosX * sinY * sinZ - cosZ * sinX);
        let dz = this.x * -sinY + this.y * cosY * sinX + this.z * cosX * cosY;

        this.x = dx; this.y = dy; this.z = dz;
    }
}

class entity2D {
    type; vertices;
    constructor(type=null, vertices = []) {
        this.type = type;
        this.vertices = vertices;
    }
}

class entity3D {
    type; vertices; extrusionDirection;
}

class shape {
    entities; children; parent; isNormalised; is3D;
    static id = 0;
    constructor(entities = [], name=null) {
        this.id = shape.id++;
        this.name = name;
        this.entities = entities;
        this.children = [];
        this.parent = null;
        this.isNormalised = false;
        this.boundingBox = null
        this.is3D = false;
    }
    findBoundingBox() {
        const size = this.entities.length;
        let minX = Infinity; let minY = Infinity; let minZ = Infinity;
        let maxX = -Infinity; let maxY = -Infinity; let maxZ = -Infinity;
        for (let i=0; i < size; i++) {
            const vertCount = this.entities[i].vertices.length;
            for (let j=0; j < vertCount; j++) {
                const curVert = this.entities[i].vertices[j];
                if (curVert.x > maxX) maxX = curVert.x;
                if (curVert.x < minX) minX = curVert.x;
                if (curVert.y > maxY) maxY = curVert.y;
                if (curVert.y < minY) minY = curVert.y;
                if (this.is3D) {
                    if (curVert.z > maxZ) maxZ = curVert.z;
                    if (curVert.z < minZ) minZ = curVert.z;
                }
            }
        }
        if (this.is3D) {
            this.boundingBox = {
                min: new vec3d(minX,minY,minZ),
                max: new vec3d(maxX,maxY,maxZ)
            }
        } else {
            this.boundingBox = {
                min: new vec2d(minX, minY),
                max: new vec2d(maxX,maxY)
            }
        }
    }
    normalizeToSelf() {
        if (this.boundingBox === null) {
            this.findBoundingBox();
        }
        for (let i=0; i < this.entities.length; i++) {
            const curEnt = this.entities[i];
            for (let j=0; j < curEnt.vertices.length; j++) {
                const curVert = curEnt.vertices[j];
                curVert.normalize(this.boundingBox.min, this.boundingBox.max);
            }
        }
        this.isNormalised = true;
        this.boundingBox = null;
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

class outFile {
    data; name; type;
    constructor(data=[], name="test", type="json") {
        this.data = data; this.name = name; this.type=type;
    }
}

export { renderer, camera, vec2d, shape, entity2D, entity3D,
         vec3d, scene, mouseInput, outFile, 
         clamp, degToRad, sleep, last,
         normalizeCoordinates2D, normalize2DCoordinatesToScreen,  normalize_array, unNormalizeCoordinates2D, 
         rotatePoint, arcToArcWithBulge, scaleVerts, scaleVert, WorldSpaceSize, scaleFactor }