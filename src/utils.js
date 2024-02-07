//I hate this language;
//classes purely for organizational purposes and ease of initializiation
//no class methods because afaik it slows things down massively as your

//object count increases
const WorldSpaceSize = 200;
const scaleFactor = 10.0;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function clamp(val, min, max) {
  const test = val < min ? min : val;
  return test > max ? max : test;
}

function bulgeToArc(p1, p2) {
  function distance(p1, p2) {
    return Math.hypot(p2.x - p1.x, p2.y - p1.y);
  }

  function angle(pn1, pn2) {
    return Math.atan2(pn2.y - pn1.y, pn2.x - pn1.x);
  }
  function polar(point, angle, distance) {
    return new vec2d(
      point.x + distance * Math.cos(angle),
      point.y + distance * Math.sin(angle)
    );
  }
  const a = 2 * Math.atan(p1.bulge);
  const r = distance(p1,p2) / (2 * Math.sin(a));
  const c = polar(p1, Math.PI / 2 - a + angle(p1,p2), r);
  let startAngle, endAngle;
  if (p1.bulge < 0) {
    startAngle = angle(c,p2);
    endAngle = angle(c,p1);
  } else {
    startAngle = angle(c,p1);
    endAngle = angle(c,p2);
  }
  return new entity2D("ARC", [c], {
    startAngle,
    endAngle,
    radius: Math.abs(r),
  });
}
//create a function which scales to something universal?

function scaleRad(rad) {
  return rad * scaleFactor;
}
function normalizeRadiusToWorld(rad) {
  return (2 * (rad - -WorldSpaceSize)) / (WorldSpaceSize - -WorldSpaceSize) - 1;
}

function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

function last(array) {
  return array[array.length - 1];
}
class vec2d {
  x;
  y;
  z;
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
    this.z = 1;
  }
  scale(scaleFactor) {
    this.x = this.x * scaleFactor;
    this.y = this.y * scaleFactor;
  }
  normalize(min, max) {
    this.x = (2 * (this.x - min.x)) / (max.x - min.x) - 1;
    this.y = (2 * (this.y - min.y)) / (max.y - min.y) - 1;
  }
  translate(translation) {
    this.x += translation.x;
    this.y += translation.y;
  }
  unNormalize(min, max) {
    this.x = this.x * (max.x - min.x) + min.x;
    this.y = this.y * (max.y - min.y) + min.y;
  }
  normalizeToWorld() {
    this.x =
      (2 * (this.x - -WorldSpaceSize)) / (WorldSpaceSize - -WorldSpaceSize) - 1;
    this.y =
      (2 * (this.y - -WorldSpaceSize)) / (WorldSpaceSize - -WorldSpaceSize) - 1;
  }
  projectToScreen(camera, screenW, screenH) {
    const pointTranslated = new vec3d(
      this.x - camera.pos.x,
      this.y - camera.pos.y,
      this.z - camera.pos.z
    );
    pointTranslated.rotateAboutPoint(camera.rotation, Scene.centroidOfEnts);
    const distanceRatio = 1 / Math.tan(camera.fov / 2);
    const aspectRatio = screenW / screenH;
    const pointProjected = new vec2d(
      (pointTranslated.x * distanceRatio) / pointTranslated.z,
      (pointTranslated.y * distanceRatio * aspectRatio) / pointTranslated.z
    );
    const pointOnScreen = new vec2d(
      (pointProjected.x + 1) * 0.5 * screenW,
      (pointProjected.y + 1) * 0.5 * screenH
    );
    return pointOnScreen;
  }
}

class vec3d {
  x;
  y;
  z;
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  scale(scaleFactor) {
    this.x = this.x * scaleFactor;
    this.y = this.y * scaleFactor;
    this.z = this.z * scaleFactor;
  }
  dilate(x) {
    return new vec3d(
      this.x / x,
      this.y / x,
      this.z / x
    );
  }
  rotate(rotation) {
    let w = Math.cos(rotation.x/2);
    let i = this.x * Math.sin(rotation.x/2);
    let j = this.y * Math.sin(rotation.y/2);
    let k = this.z * Math.sin(rotation.z/2);

    // Apply rotation
    let dx = w*w*this.x + 2*this.y*i - 2*this.z*j + i*i*this.x + 2*this.y*j + 2*this.z*k - j*j*this.x - k*k*this.x;
    let dy = 2*this.x*i + w*w*this.y + 2*this.z*k - 2*j*i + 2*this.x*j + i*i*this.y - j*j*this.y + 2*this.z*i + k*k*this.y;
    let dz = 2*this.x*i - 2*this.y*k + w*w*this.z + 2*j*i + 2*this.x*k + 2*this.y*j - i*i*this.z + j*j*this.z + k*k*this.z;

    this.x = dx;
    this.y = dy;
    this.z = dz;
  }
  rotateAboutPoint(rotation, point) {
    const qx = Math.sin(rotation.x / 2);
    const qy = Math.sin(rotation.y / 2);
    const qz = Math.sin(rotation.z / 2);
    const qw = Math.cos(rotation.x / 2) * Math.cos(rotation.y / 2) * Math.cos(rotation.z / 2);

    // Normalize the quaternion
    const magnitude = Math.sqrt(qx * qx + qy * qy + qz * qz + qw * qw);
    const normalizedQx = qx / magnitude;
    const normalizedQy = qy / magnitude;
    const normalizedQz = qz / magnitude;
    const normalizedQw = qw / magnitude;

    // Apply rotation
    const px = this.x - point.x;
    const py = this.y - point.y;
    const pz = this.z - point.z;

    const rotatedPx = px * (normalizedQw * normalizedQw + normalizedQx * normalizedQx - normalizedQy * normalizedQy - normalizedQz * normalizedQz) +
                      py * (2 * normalizedQx * normalizedQy - 2 * normalizedQw * normalizedQz) +
                      pz * (2 * normalizedQx * normalizedQz + 2 * normalizedQw * normalizedQy);

    const rotatedPy = px * (2 * normalizedQx * normalizedQy + 2 * normalizedQw * normalizedQz) +
                      py * (normalizedQw * normalizedQw - normalizedQx * normalizedQx + normalizedQy * normalizedQy - normalizedQz * normalizedQz) +
                      pz * (2 * normalizedQy * normalizedQz - 2 * normalizedQw * normalizedQx);

    const rotatedPz = px * (2 * normalizedQx * normalizedQz - 2 * normalizedQw * normalizedQy) +
                      py * (2 * normalizedQy * normalizedQz + 2 * normalizedQw * normalizedQx) +
                      pz * (normalizedQw * normalizedQw - normalizedQx * normalizedQx - normalizedQy * normalizedQy + normalizedQz * normalizedQz);

    this.x = rotatedPx + point.x;
    this.y = rotatedPy + point.y;
    this.z = rotatedPz + point.z;
  }
  normalizeToWorld() {
    this.x =
      (2 * (this.x - -WorldSpaceSize)) / (WorldSpaceSize - -WorldSpaceSize) - 1;
    this.y =
      (2 * (this.y - -WorldSpaceSize)) / (WorldSpaceSize - -WorldSpaceSize) - 1;
    this.z =
      (2 * (this.z - -WorldSpaceSize)) / (WorldSpaceSize - -WorldSpaceSize) - 1;
  }
  projectToScreen(camera, screenW, screenH) {
    const pointTranslated = new vec3d(this.x, this.y, this.z);
    pointTranslated.rotateAboutPoint(camera.rotation, Scene.centroidOfEnts);
    pointTranslated.translate(new vec3d(
      -camera.pos.x,
      -camera.pos.y,
      -camera.pos.z
    ))
    const distanceRatio = 1 / Math.tan(camera.fov / 2);
    const aspectRatio = screenW / screenH;
    const pointProjected = new vec2d(
      (pointTranslated.x * distanceRatio) / pointTranslated.z,
      (pointTranslated.y * distanceRatio * aspectRatio) / pointTranslated.z
    );
    const pointOnScreen = new vec2d(
      (pointProjected.x + 1) * 0.5 * screenW,
      (pointProjected.y + 1) * 0.5 * screenH
    );
    return pointOnScreen;
  }
  getTranslated(translation) {
    return new vec3d(
      this.x + translation.x,
      this.y + translation.y,
      this.z + translation.z
    )
  }
  translate(translation) {
    this.x += translation.x;
    this.y += translation.y;
    this.z += translation.z
  }
  crossProduct(v) {
    return new vec3d(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x
    );
  }
  set(x,y,z) {
    this.x = x; this.y = y; this.z = z;
  }
  magnitude() {
    return Math.sqrt(this.x*this.x + this.y*this.y + this.z*this.z)
  }
  toMatrix() {
    return [this.x,this.y,this.z];
  }
  normalize() {
    const magnitude = this.magnitude();
    this.x = this.x / magnitude;
    this.y = this.y / magnitude;
    this.z = this.z / magnitude;
  }
}

class entity2D {
  type;
  vertices;
  attribs;
  constructor(type = null, vertices = [], attribs = {}) {
    this.type = type;
    this.vertices = vertices;
    this.attribs = attribs;
  }
  first() {
    return this.vertices[0];
  }
  last() {
    return this.vertices[length - 1];
  }
  normalizeToWorld() {
    for (let i = 0; i < this.vertices.length; i++) {
      this.vertices[i].normalizeToWorld();
    }
    if (this.attribs.radius) {
      this.attribs.radius = normalizeRadiusToWorld(this.attribs.radius);
    }
  }
}

class entity3D {
  type;
  vertices;
  attribs;

  constructor(
    type = null,
    vertices = [],
    attribs = {},
  ) {
    this.type = type;
    this.vertices = vertices;
    this.attribs = attribs;
  }
  first() {
    return this.vertices[0];
  }
  last() {
    return this.vertices[length - 1];
  }
  normalizeToWorld() {
    for (let i = 0; i < this.vertices.length; i++) {
      this.vertices[i].normalizeToWorld();
    }
    if (this.attribs.radius) {
      this.attribs.radius = normalizeRadiusToWorld(this.attribs.radius);
    }
    if (this.attribs.extrusionDirection) {
      this.attribs.extrusionDirection.normalizeToWorld();
    }
  }
}
class Camera {
  static pos = new vec3d(0, 0, -1);
  static rotation = new vec3d(1,0,0);
  static fov = 45;
  static near = 0.01;
  static far = 1000

  static setPos(x, y, z) {
    this.pos.x = x;
    this.pos.y = y;
    this.pos.z = z;
    Scene.update(false)
  }
  static rotate(x, y, z) {
    this.rotation.x +=x;
    this.rotation.y +=y;
    this.rotation.z +=z;
    Scene.update(false);
}
  static translate(x, y, z) {
    this.pos.x += x;
    this.pos.y += y;
    this.pos.z += z;
    Scene.update(false);
  }
  static getPos() {
    return this.pos;
  }
}
//0 for 2d  | 1 for 3d
class Renderer {
  static canvas = document.getElementById("drawing-canvas");;
  static context = this.canvas.getContext("2d");;
  static init() {
    this.canvas = document.getElementById("drawing-canvas");
    this.context = this.canvas.getContext("2d");
  }
  static update() {
    this.canvas.width = this.canvas.width;
    this.canvas.height = this.canvas.height;
  }
  static drawLine(p1, p2) {
    const p1OnScreen = p1.projectToScreen(
      Camera,
      this.canvas.width,
      this.canvas.height
    );
    const p2OnScreen = p2.projectToScreen(
      Camera,
      this.canvas.width,
      this.canvas.height
    );
    this.context.beginPath();
    this.context.moveTo(p1OnScreen.x, p1OnScreen.y);
    this.context.lineTo(p2OnScreen.x, p2OnScreen.y);
    this.context.stroke();
    this.context.closePath();
  }
  static drawArc(arc) {
    const projectRadiusToScreen = () => {
      let p1 = new vec3d(
        arc.vertices[0].x,
        arc.vertices[0].y,
        arc.vertices[0].z
      );
      let p2 = new vec3d(
        arc.vertices[0].x + arc.attribs.radius,
        arc.vertices[0].y,
        arc.vertices[0].z
      );
      p1 = p1.projectToScreen(
        Camera,
        this.canvas.width,
        this.canvas.height
      );
      p2 = p2.projectToScreen(
        Camera,
        this.canvas.width,
        this.canvas.height
      );
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      return Math.sqrt(dx * dx + dy * dy);
    };
    const center = arc.vertices[0].projectToScreen(
      Camera,
      this.canvas.width,
      this.canvas.height
    );
    const rad = projectRadiusToScreen(arc.attribs.radius);
    this.context.beginPath();
    this.context.arc(
      center.x,
      center.y,
      rad,
      arc.attribs.startAngle,
      arc.attribs.endAngle,
      false
    );
    this.context.stroke();
    this.context.closePath();
  }
}

class Scene {
  static entities = [];
  static centroidOfEnts = new vec3d(0,0,0);
  static findCentroid() {
    let vertCnt = 0;
    Scene.centroidOfEnts = new vec3d(0,0,0);
    function getCoords(e) {  
      switch (e.type) {
        case("LINE"): {
          Scene.centroidOfEnts.translate(e.vertices[0]);
          Scene.centroidOfEnts.translate(e.vertices[0]);
          vertCnt +=2;
          break;
        }
        case("CIRCLE"): {
          Scene.centroidOfEnts.translate(e.vertices[0]);
          vertCnt +=1;
          break;
        }
        case("ARC"): {
          Scene.centroidOfEnts.translate(e.vertices[0]);
          vertCnt +=1;
          break;
        }
        default: {
          for (let j=0; j < e.vertices.length; j++) {
            getCoords(e.vertices[j]);
          }
          break;
        }
      }
    }

    for (let i=0; i < Scene.entities.length; i++) {
      const curEnt = Scene.entities[i];
      getCoords(curEnt);
    }
    Scene.centroidOfEnts.x = Scene.centroidOfEnts.x / vertCnt;
    Scene.centroidOfEnts.y = Scene.centroidOfEnts.y / vertCnt;
    Scene.centroidOfEnts.z = Scene.centroidOfEnts.z / vertCnt;
    Camera.pos.x = this.centroidOfEnts.x;
    Camera.pos.y = this.centroidOfEnts.y;
    Camera.pos.z = this.centroidOfEnts.z - 1;
    return;
  }
  static setEntities(ents) {
    Scene.entities = ents;
    Scene.findCentroid();
    console.log(Scene.centroidOfEnts)
  }
  static addEntity(ent) {
    this.entities.push(ent);
  }
  static wipeEntities() {
    this.entities = [];
  }
  static update(canvasChange) {
    if (canvasChange) {
      Renderer.canvas.width = window.innerWidth * 0.9;
      Renderer.canvas.height = window.innerHeight * 0.9;
    }
    Renderer.update();
    this.render();
  }
  static render() {
    function renderEnt(e) {
      switch (e.type) {
        case "LWPOLYLINE": {
          for (let i=0; i<e.vertices.length; i++) {
            renderEnt(e.vertices[i]);
          }
          break;
        }
        case "LINE": {
          Renderer.drawLine(e.vertices[0], e.vertices[1]);
          break;
        }
        case "ARC": {
          Renderer.drawArc(e);
          break;
        }
      }
    }

    //this will be innefcient with vertex count being higher than it needs to be most likely.
    for (let i = 0; i < this.entities.length; i++) {
      renderEnt(this.entities[i]);
    }
  }
}

  class MouseInput {
    static active = {
      left: false,
      middle: false,
      right: false
    };
    static initialPosition = new vec2d(0,0);

    static init() {
      document.addEventListener("mousedown", this.mouseDown.bind(this))
      document.addEventListener("mouseup", this.mouseUp.bind(this))
      document.addEventListener("mousemove", this.mouseMove.bind(this));
      document.addEventListener("wheel", this.scroll.bind(this))
    }
    static scroll(e) {
        if (e.deltaY > 0) {
          this.scrollDown(e);
      } else {
          this.scrollUp();
      }
    }
    static mouseDown(down) {
      switch (down.button) {
        case (0): {
          this.active.left = true;
          this.initialPosition.x = down.clientX; this.initialPosition.y = down.clientY;
          break;
        }
        case (1): {
          this.active.middle = true;
          break;
        }
      }
    }
    static mouseUp(up) {
      switch (up.button) {
        case (0): {
          this.active.left = false;
          break;
        }
        case (1): {
          this.active.middle = false;
          break
        }
      }
      this.initialPosition.x = 0; this.initialPosition.y = 0;
    }
    static mouseMove(e) {
      if (this.active.left === true) {
        let deltaX = (this.initialPosition.x - e.clientX);
        let deltaY = (this.initialPosition.y - e.clientY);
        const scalar = clamp(.0001 / Camera.pos.magnitude(), .00001, .005);
        Camera.translate(deltaX * scalar, deltaY * scalar, 0);
        this.initialPosition.x = e.clientX;
        this.initialPosition.y = e.clientY;
        setTimeout(null, 20);
      }
      if (this.active.middle === true) {
        let deltaX = (this.initialPosition.x - e.clientX);
        const scalar = clamp(.0001 / Camera.pos.magnitude(), .01, .005);
        Camera.rotate(deltaX * scalar,0,0);
        this.initialPosition.x = e.clientX;
        this.initialPosition.y = e.clientY;
        setTimeout(null, 20);
      }
    }
    static scrollDown() {
      Camera.translate(0,0,-.01);
    }
    static scrollUp() {
      Camera.translate(0,0,.01);
    }

}

class outFile {
  data;
  name;
  type;
  constructor(data = [], name = "test", type = "json") {
    this.data = data;
    this.name = name;
    this.type = type;
  }
}

export {
  Renderer,
  Camera,
  vec2d,
  entity2D,
  entity3D,
  vec3d,
  Scene,
  MouseInput,
  outFile,
  clamp,
  degToRad,
  sleep,
  last,
  bulgeToArc,
  scaleRad,
  WorldSpaceSize,
  scaleFactor,
};
