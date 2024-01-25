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

function bulgeToArc(p1, p2) {
    const theta = Math.atan(p1.bulge) * 4;
    const distance = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    const rad = distance / 2 / Math.sin(theta / 2);
    const angleMid = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    const angleCenter =  angleMid + (p1.bulge > 0 ? -1 : 1) * Math.PI / 2;
    const center = new vec2d(
        (p1.x + p2.x) / 2 + rad * Math.cos(angleCenter),
        (p1.y + p2.y) / 2 + rad * Math.sin(angleCenter)
    );
    let startAngle = Math.atan2(p1.y - center.y, p1.x - center.x);
    let endAngle = Math.atan2(p2.y - center.y, p2.x - center.x);

    if (startAngle < 0) startAngle += 2 * Math.PI;
    if (endAngle < 0) endAngle += 2 * Math.PI;
    
    if (p1.bulge < 0) {
        let temp = startAngle;
        startAngle = endAngle;
        endAngle = temp;
    }
    const attribs = {
        startAngle,
        endAngle,
        radius: rad
    }
    return new entity2D("ARC", [center], attribs);
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

function scaleRad(rad) {
    return rad * scaleFactor;
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

function normalizeRadiusToWorld(rad) {
    return 2 * (rad - (-WorldSpaceSize)) / (WorldSpaceSize - (-WorldSpaceSize)) - 1;
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
    projectToScreen(camera, screenW, screenH) {
        const pointTranslated = new vec3d(
            this.x - camera.pos.x,
            this.y - camera.pos.y,
            this.z - camera.pos.z
        );
        pointTranslated.rotate(camera.rotation);
        const distanceRatio = 1 / Math.tan(camera.fov / 2);
        const aspectRatio = screenW / screenH;
        const pointProjected = new vec2d(
            pointTranslated.x * distanceRatio / pointTranslated.z,
            pointTranslated.y * distanceRatio * aspectRatio / pointTranslated.z
        )
        const pointOnScreen = new vec2d(
            (pointProjected.x + 1) * .5 * screenW,
            (pointProjected.y + 1) * .5 * screenH
            );
        return pointOnScreen;
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
    normalizeToWorld() {
        this.x = 2 * (this.x - (-WorldSpaceSize)) / (WorldSpaceSize - (-WorldSpaceSize)) - 1;
        this.y = 2 * (this.y - (-WorldSpaceSize)) / (WorldSpaceSize - (-WorldSpaceSize)) - 1;
        this.z = 2 * (this.z - (-WorldSpaceSize)) / (WorldSpaceSize - (-WorldSpaceSize)) - 1;
    }
    projectToScreen(camera, screenW, screenH) {
        const pointTranslated = new vec3d(
            this.x - camera.pos.x,
            this.y - camera.pos.y,
            this.z - camera.pos.z
        );
        pointTranslated.rotate(camera.rotation);
        const distanceRatio = 1 / Math.tan(camera.fov / 2);
        const aspectRatio = screenW / screenH;
        const pointProjected = new vec2d(
            pointTranslated.x * distanceRatio / pointTranslated.z,
            pointTranslated.y * distanceRatio * aspectRatio / pointTranslated.z
        )
        const pointOnScreen = new vec2d(
            (pointProjected.x + 1) * .5 * screenW,
            (pointProjected.y + 1) * .5 * screenH
        );
        return pointOnScreen;
    }
}

class entity2D {
    type; vertices; attribs;
    constructor(type=null, vertices=[], attribs = {}) {
        this.type = type;
        this.vertices = vertices;
        this.attribs = attribs;
    }
    first() {
        return this.vertices[0];
    }
    last() {
        return this.vertices[length-1];
    }
    normalizeToWorld() {
        for (let i=0; i < this.vertices.length; i++) {
            this.vertices[i].normalizeToWorld();
        }
        if (this.attribs.radius) {
            this.attribs.radius = normalizeRadiusToWorld(this.attribs.radius);
        }
    }
}

class entity3D {
    type; vertices; attribs; extrusionDirection;
    constructor(type=null, vertices=[], attribs = {}, extrusionDirection=null) {
        this.type = type; 
        this.vertices = vertices; 
        this.attribs = attribs;
        this.extrusionDirection = extrusionDirection;
    }
    first() {
        return this.vertices[0];
    }
    last() {
        return this.vertices[length-1];
    }
    normalizeToWorld() {
        for (let i=0; i < this.vertices.length; i++) {
            this.vertices[i].normalizeToWorld();
        }
        if (this.attribs.radius) {
            this.attribs.radius = normalizeRadiusToWorld(this.attribs.radius);
        }
        if (this.extrusionDirection) {
            this.extrusionDirection.normalizeToWorld();  
        }
    }
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
    constructor(pos=new vec3d(0,0,.98), rotation=new vec3d(0,0,0), fov=45, near=.01, far=1000) {
        this.pos = pos; this.rotation = rotation; this.fov = fov; this.near = near; this.far = far;
    }
    setPos(x,y,z) {
        this.pos.x = x;
        this.pos.y = y;
        this.pos.z = z; 
    }
    translate(x,y,z) {
        this.pos.x +=x;
        this.pos.y +=y;
        this.pos.z +=z
    }
    getPos() {
        return this.pos;
    }
}
//0 for 2d  | 1 for 3d
class Renderer { 
    camera; canvas; context;
    constructor(c = new camera(), canvas = null, context = null) {
        this.camera = c;
        this.canvas = canvas;
        this.context = context;
    }
    init() {
        this.canvas = document.getElementById("drawing-canvas");
        this.context = this.canvas.getContext("2d");
    }
    update() {
        this.canvas.width = this.canvas.width;
        this.canvas.height = this.canvas.height;
    }
    drawLine(p1, p2) {
        const p1OnScreen = p1.projectToScreen(this.camera, this.canvas.width, this.canvas.height);
        const p2OnScreen = p2.projectToScreen(this.camera, this.canvas.width, this.canvas.height);
        this.context.beginPath();
        this.context.moveTo(p1OnScreen.x, p1OnScreen.y);
        this.context.lineTo(p2OnScreen.x, p2OnScreen.y);
        this.context.stroke();
        this.context.closePath();
    }
    drawArc(arc) {
        const projectRadiusToScreen = () => {
            console.log()
            let p1 = new vec3d(arc.vertices[0].x, arc.vertices[0].y, arc.vertices[0].z);
            let p2 = new vec3d(arc.vertices[0].x + arc.attribs.radius, arc.vertices[0].y, arc.vertices[0].z);
            p1 = p1.projectToScreen(this.camera, this.canvas.width, this.canvas.height);
            p2 = p2.projectToScreen(this.camera, this.canvas.width, this.canvas.height);
            const dx = p2.x - p1.x; 
            const dy = p2.y - p1.y;
            return Math.sqrt(dx * dx + dy * dy);
        }
        const center =  arc.vertices[0].projectToScreen(this.camera, this.canvas.width, this.canvas.height);
        const rad = projectRadiusToScreen(arc.attribs.radius);
        this.context.beginPath();
        this.context.arc(center.x, center.y, Math.abs(rad), arc.attribs.startAngle, arc.attribs.endAngle, false);
        this.context.stroke();
        this.context.closePath();
    }
}

class scene {
    renderer; entities;
    constructor(renderer = new Renderer(), entities = []) {
        this.renderer = renderer; this.entities = entities;
    }
    init() {
        this.renderer.init();
    }
    setEntities(ents) {
        this.entities = ents;
    }
    addEntity(ent) {
        this.entities.push(ent);
    }
    wipeEntities() {
        this.entities = [];
    }
    update(canvasChange) {
        if (canvasChange) {
            this.renderer.canvas.width = window.innerWidth * .9;
            this.renderer.canvas.height = window.innerHeight * .9;
        }
        this.renderer.update();
        this.render();
    }
    render() {
        for (let i=0; i < this.entities.length; i++) {
            const curEnt = this.entities[i];
            switch (curEnt.type) {
                case("LWPOLYLINE"): {
                    for (let j=0; j < curEnt.vertices.length; j++) {
                        const e = curEnt.vertices[j];
                        switch (e.type) {
                            case ("LINE"): {
                                this.renderer.drawLine(e.vertices[0],e.vertices[1]);
                                break;
                            }
                            case ("ARC"): {
                                this.renderer.drawArc(e);
                                break;
                            }
                        }
                    }
                    break;
                }
                case ("LINE"): {
                    this.renderer.drawLine(curEnt.vertices[0], curEnt.vertices[1]);
                    break;
                }
                case ("ARC"): {
                    this.renderer.drawArc(curEnt);
                    break;
                }
            }
        }
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

export { Renderer, camera, vec2d, shape, entity2D, entity3D,
         vec3d, scene, mouseInput, outFile, 
         clamp, degToRad, sleep, last, bulgeToArc, scaleRad,
          normalize_array,
         arcToArcWithBulge, scaleVerts, scaleVert, WorldSpaceSize, scaleFactor }