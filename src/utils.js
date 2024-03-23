//I hate this language;
//classes purely for organizational purposes and ease of initializiation
//no class methods because afaik it slows things down massively as your

//object count increases
const WorldSpaceSize = 100;
const scaleFactor = 10.0;
const Tolerance = 1e-10;
console.log(Tolerance);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function isClose(n1, n2, tolerance = Tolerance) {
  return Math.abs(Math.abs(n1) - Math.abs(n2)) < tolerance;
}
function isCloseVec(v1, v2, tolerance = Tolerance) {
  if (isClose(v1.x, v2.x) && isClose(v1.y, v2.y) && isClose(v1.z, v2.z)) {
    console.log(v1, v2);
    return true;
  }
  return false;
}

function clamp(val, min, max) {
  const test = val < min ? min : val;
  return test > max ? max : test;
}

//clean this up
function bulgeToArc(p1, p2) {
  function distance(p1, p2) {
    return Math.hypot(p2.x - p1.x, p2.y - p1.y);
  }

  function angle(pn1, pn2) {
    return Math.atan2(pn2.y - pn1.y, pn2.x - pn1.x);
  }
  function polar(point, angle, distance) {
    return new vec2(
      point.x + distance * Math.cos(angle),
      point.y + distance * Math.sin(angle)
    );
  }
  const a = 2 * Math.atan(p1.bulge);
  const r = distance(p1, p2) / (2 * Math.sin(a));
  const c = polar(p1, Math.PI / 2 - a + angle(p1, p2), r);
  let startAngle, endAngle;
  if (p1.bulge < 0) {
    startAngle = angle(c, p2);
    endAngle = angle(c, p1);
  } else {
    startAngle = angle(c, p1);
    endAngle = angle(c, p2);
  }

  const arc = { startAngle, endAngle, radius: Math.abs(r), center: c };
  function parse(arc) {
    const center = arc.center;
    const vertices = [];
    const stepCount = 100;
    if (arc.endAngle < arc.startAngle) {
      arc.endAngle += 2 * Math.PI;
    }
    const angleStep = (arc.endAngle - arc.startAngle) * 0.01;

    const p1 = new vec2(
      center.x + arc.radius * Math.cos(arc.startAngle),
      center.y + arc.radius * Math.sin(arc.startAngle),
      center.z
    );
    vertices.push(p1);
    for (let i = 1; i <= stepCount; i++) {
      const angle = arc.startAngle + angleStep * i;
      const point = new vec2(
        center.x + arc.radius * Math.cos(angle),
        center.y + arc.radius * Math.sin(angle),
        center.z
      );
      vertices.push(point);
    }
    const p2 = new vec2(
      center.x + arc.radius * Math.cos(arc.endAngle),
      center.y + arc.radius * Math.sin(arc.endAngle),
      center.z
    );
    vertices.push(p2);
    const result = new entity("ARC", vertices, {
      startAngle: arc.startAngle,
      endAngle: arc.endAngle,
      radius: arc.radius,
      center: center,
    });
    return result;
  }

  return parse(arc);
}
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
class parent {
  parent;
  constructor(parent = null) {
    this.parent = parent;
  }
}
class vec2 {
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
  normalize() {
    const magnitude = this.magnitude();
    this.x = this.x / magnitude;
    this.y = this.y / magnitude;
  }
  translate(translation) {
    this.x += translation.x;
    this.y += translation.y;
  }
  unNormalize(min, max) {
    return new vec3(
      this.x * (max.x - min.x) + min.x,
      this.y * (max.y - min.y) + min.y,
      Camera.pos.z
    );
  }
  magnitude() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
  normalizeToWorld() {
    this.x =
      (2 * (this.x - -WorldSpaceSize)) / (WorldSpaceSize - -WorldSpaceSize) - 1;
    this.y =
      (2 * (this.y - -WorldSpaceSize)) / (WorldSpaceSize - -WorldSpaceSize) - 1;
  }
  projectToScreen(camera, screenW, screenH) {
    const pointTranslated = new vec3(
      this.x - camera.pos.x,
      this.y - camera.pos.y,
      this.z - camera.pos.z
    );
    const distanceRatio = 1 / Math.tan(camera.fov / 2);
    const aspectRatio = screenW / screenH;
    const pointProjected = new vec2(
      (pointTranslated.x * distanceRatio) / pointTranslated.z,
      (pointTranslated.y * distanceRatio * aspectRatio) / pointTranslated.z
    );
    const pointOnScreen = new vec2(
      (pointProjected.x + 1) * 0.5 * screenW,
      (pointProjected.y + 1) * 0.5 * screenH
    );
    return pointOnScreen;
  }
  screenToWorld(camera, screenW, screenH) {
    const pointFromScreen = new vec2(
      (this.x / screenW) * 2 - 1,
      (this.y / screenH) * 2 - 1
    );
    const distanceRatio = Math.tan(camera.fov / 2);
    const aspectRatio = screenW / screenH;

    const pointUnProjected = new vec3(
      pointFromScreen.x * distanceRatio,
      (pointFromScreen.y * distanceRatio) / aspectRatio,
      1
    );
    pointUnProjected.translate(
      new vec3(camera.pos.x, camera.pos.y, camera.pos.z)
    );
    const pointRotated = pointUnProjected.rotateAboutPoint(
      new vec3(-camera.rotation.x, -camera.rotation.y, -camera.rotation.z),
      Scene.centroidOfEnts
    );
    pointRotated.translate(
      new vec3(-camera.pos.x, -camera.pos.y, -camera.pos.z)
    );
    pointRotated.normalize();
    return new ray(camera.pos, pointRotated);
  }

  rotateAboutPoint(rotation, point) {
    const qx = Math.sin(rotation.x / 2);
    const qy = Math.sin(rotation.y / 2);
    const qz = Math.sin(rotation.z / 2);
    const qw =
      Math.cos(rotation.x / 2) *
      Math.cos(rotation.y / 2) *
      Math.cos(rotation.z / 2);

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

    const rotatedPx =
      px *
        (normalizedQw * normalizedQw +
          normalizedQx * normalizedQx -
          normalizedQy * normalizedQy -
          normalizedQz * normalizedQz) +
      py * (2 * normalizedQx * normalizedQy - 2 * normalizedQw * normalizedQz) +
      pz * (2 * normalizedQx * normalizedQz + 2 * normalizedQw * normalizedQy);

    const rotatedPy =
      px * (2 * normalizedQx * normalizedQy + 2 * normalizedQw * normalizedQz) +
      py *
        (normalizedQw * normalizedQw -
          normalizedQx * normalizedQx +
          normalizedQy * normalizedQy -
          normalizedQz * normalizedQz) +
      pz * (2 * normalizedQy * normalizedQz - 2 * normalizedQw * normalizedQx);

    const rotatedPz =
      px * (2 * normalizedQx * normalizedQz - 2 * normalizedQw * normalizedQy) +
      py * (2 * normalizedQy * normalizedQz + 2 * normalizedQw * normalizedQx) +
      pz *
        (normalizedQw * normalizedQw -
          normalizedQx * normalizedQx -
          normalizedQy * normalizedQy +
          normalizedQz * normalizedQz);
    return new vec3(
      rotatedPx + point.x,
      rotatedPy + point.y,
      rotatedPz + point.z
    );
  }
}

class ray {
  origin;
  direction;
  constructor(origin, direction) {
    this.origin = origin;
    this.direction = direction;
  }

  intersectVertex(vertex, radius = 0.01) {
    const oppositeVertex = new vec3(-vertex.x, -vertex.y, -vertex.z);
    const oc = this.origin.getTranslated(oppositeVertex);
    const a = this.direction.dotProduct(this.direction);
    const b = 2 * oc.dotProduct(this.direction);
    const c = oc.dotProduct(oc) - radius ** 2;
    const disc = b ** 2 - 4 * a * c;

    if (disc < 0) {
      return false;
    }

    const distSqrt = Math.sqrt(disc);
    let q;
    if (b < 0) {
      q = (-b - distSqrt) / 2.0;
    } else {
      q = (-b + distSqrt) / 2.0;
    }
    const t0 = q / a;
    const t1 = c / q;

    if (t0 > t1) {
      let temp = t0;
      t0 = t1;
      t1 = temp;
    }

    if (t1 < 0) {
      return false;
    }
    return true;
  }
}

class vec3 {
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
    return new vec3(this.x / x, this.y / x, this.z / x);
  }
  rotate(rotation) {
    let w = Math.cos(rotation.x / 2);
    let i = this.x * Math.sin(rotation.x / 2);
    let j = this.y * Math.sin(rotation.y / 2);
    let k = this.z * Math.sin(rotation.z / 2);

    // Apply rotation
    let dx =
      w * w * this.x +
      2 * this.y * i -
      2 * this.z * j +
      i * i * this.x +
      2 * this.y * j +
      2 * this.z * k -
      j * j * this.x -
      k * k * this.x;
    let dy =
      2 * this.x * i +
      w * w * this.y +
      2 * this.z * k -
      2 * j * i +
      2 * this.x * j +
      i * i * this.y -
      j * j * this.y +
      2 * this.z * i +
      k * k * this.y;
    let dz =
      2 * this.x * i -
      2 * this.y * k +
      w * w * this.z +
      2 * j * i +
      2 * this.x * k +
      2 * this.y * j -
      i * i * this.z +
      j * j * this.z +
      k * k * this.z;

    this.x = dx;
    this.y = dy;
    this.z = dz;
  }
  rotateAboutPoint(rotation, point) {
    const qx = Math.sin(rotation.x / 2);
    const qy = Math.sin(rotation.y / 2);
    const qz = Math.sin(rotation.z / 2);
    const qw =
      Math.cos(rotation.x / 2) *
      Math.cos(rotation.y / 2) *
      Math.cos(rotation.z / 2);

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

    const rotatedPx =
      px *
        (normalizedQw * normalizedQw +
          normalizedQx * normalizedQx -
          normalizedQy * normalizedQy -
          normalizedQz * normalizedQz) +
      py * (2 * normalizedQx * normalizedQy - 2 * normalizedQw * normalizedQz) +
      pz * (2 * normalizedQx * normalizedQz + 2 * normalizedQw * normalizedQy);

    const rotatedPy =
      px * (2 * normalizedQx * normalizedQy + 2 * normalizedQw * normalizedQz) +
      py *
        (normalizedQw * normalizedQw -
          normalizedQx * normalizedQx +
          normalizedQy * normalizedQy -
          normalizedQz * normalizedQz) +
      pz * (2 * normalizedQy * normalizedQz - 2 * normalizedQw * normalizedQx);

    const rotatedPz =
      px * (2 * normalizedQx * normalizedQz - 2 * normalizedQw * normalizedQy) +
      py * (2 * normalizedQy * normalizedQz + 2 * normalizedQw * normalizedQx) +
      pz *
        (normalizedQw * normalizedQw -
          normalizedQx * normalizedQx -
          normalizedQy * normalizedQy +
          normalizedQz * normalizedQz);
    return new vec3(
      rotatedPx + point.x,
      rotatedPy + point.y,
      rotatedPz + point.z
    );
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
    const pointTranslated = new vec3(this.x, this.y, this.z);
    pointTranslated.translate(
      new vec3(-camera.pos.x, -camera.pos.y, -camera.pos.z)
    );
    const distanceRatio = 1 / Math.tan(camera.fov / 2);
    const aspectRatio = screenW / screenH;
    const pointProjected = new vec2(
      (pointTranslated.x * distanceRatio) / pointTranslated.z,
      (pointTranslated.y * distanceRatio * aspectRatio) / pointTranslated.z
    );
    const pointOnScreen = new vec2(
      (pointProjected.x + 1) * 0.5 * screenW,
      (pointProjected.y + 1) * 0.5 * screenH
    );
    return pointOnScreen;
  }
  getTranslated(translation) {
    return new vec3(
      this.x + translation.x,
      this.y + translation.y,
      this.z + translation.z
    );
  }
  translate(translation) {
    this.x += translation.x;
    this.y += translation.y;
    this.z += translation.z;
  }
  crossProduct(v) {
    return new vec3(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x
    );
  }
  dotProduct(v) {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }
  set(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  magnitude() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }
  toMatrix() {
    return [this.x, this.y, this.z];
  }
  normalize() {
    const magnitude = this.magnitude();
    if (magnitude === 0) {
      return;
    }
    this.x = this.x / magnitude;
    this.y = this.y / magnitude;
    this.z = this.z / magnitude;
  }
}

class entity extends parent {
  type;
  vertices;
  attribs;
  children;
  constructor(type = null, vertices = [], attribs = {}, children = []) {
    super();
    this.type = type;
    this.vertices = vertices;
    this.attribs = attribs;
    this.children = children;
  }
  //will probably need to change this in some way
  doesRayIntersect(ray) {
    if (this.vertices.length > 0) {
      for (let i = 0; i < this.vertices.length; i++) {
        if (ray.intersectVertex(this.vertices[i])) {
          return this.vertices[i];
        }
      }
    }
    if (this.children.length > 0) {
      const hits = [];
      for (let c = 0; c < this.children.length; c++) {
        const result = this.children[c].doesRayIntersect(ray);
        if (result) {
          hits.push(result);
        }
      }
      if (hits.length > 0) {
        return hits;
      }
    }

    return false;
  }
  first() {
    return this.vertices[0];
  }
  last() {
    return this.vertices[length - 1];
  }
  normalizeToWorld() {
    if (this.children.length !== 0) {
      for (let i = 0; i < this.children.length; i++) {
        this.children[i].normalizeToWorld();
      }
    }
    if (this.vertices.length !== 0) {
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
}
class Camera {
  static pos = new vec3(0, 0, -1);
  static rotation = new vec3(0, 0, 0);
  static fov = 45;
  static near = 0.01;
  static far = 1000;

  static setPos(x, y, z) {
    this.pos.x = x;
    this.pos.y = y;
    this.pos.z = z;
  }
  static rotate(x, y, z) {
    this.rotation.x += x;
    this.rotation.y += y;
    this.rotation.z += z;
  }
  static translate(x, y, z) {
    this.pos.x += x;
    this.pos.y += y;
    this.pos.z += z;
  }
  static update(canvasChange) {
    Scene.update(canvasChange);
  }
  static getPos() {
    return this.pos;
  }
  static isInView(p) {
    const d = new vec3(this.pos.x - p.x, this.pos.y - p.y, this.pos.z - p.z);
    d.normalize();
    const dp = d.dotProduct(new vec3(0, 0, -1));
    const fovInRad = this.fov * (Math.PI / 180);
    const cosFov = Math.cos(fovInRad);
    return dp > cosFov;
  }
}
//0 for 2d  | 1 for 3d
class Renderer {
  static canvas = document.getElementById("drawing-canvas");
  static context = this.canvas.getContext("2d");
  static init() {
    this.canvas = document.getElementById("drawing-canvas");
    this.context = this.canvas.getContext("2d");
  }
  static update() {
    this.canvas.width = this.canvas.width;
    this.canvas.height = this.canvas.height;
  }
  static drawLine(p1, p2) {
    const p1Rotated = p1.rotateAboutPoint(
      Camera.rotation,
      Scene.centroidOfEnts
    );
    const p2Rotated = p2.rotateAboutPoint(
      Camera.rotation,
      Scene.centroidOfEnts
    );
    if (Camera.isInView(p1Rotated) && Camera.isInView(p2Rotated)) {
      const p1OnScreen = p1Rotated.projectToScreen(
        Camera,
        this.canvas.width,
        this.canvas.height
      );
      const p2OnScreen = p2Rotated.projectToScreen(
        Camera,
        this.canvas.width,
        this.canvas.height
      );
      Renderer.putPoint(p1OnScreen);
      Renderer.putPoint(p2OnScreen);
      this.context.beginPath();
      this.context.moveTo(p1OnScreen.x, p1OnScreen.y);
      this.context.lineTo(p2OnScreen.x, p2OnScreen.y);
      this.context.stroke();
      this.context.closePath();
    }
  }
  static putPoint(p, color = "red") {
    const size = 4;
    this.context.fillStyle = color;
    this.context.fillRect(p.x, p.y, 1, 1);
    this.context.fillRect(p.x - 1, p.y - 1, size, size);
    this.context.fillRect(p.x + 1, p.y + 1, size, size);
    this.context.fillRect(p.x - 1, p.y + 1, size, size);
    this.context.fillRect(p.x + 1, p.y - 1, size, size);
    this.context.fillRect(p.x + 1, p.y - 1, size, size);
  }
  static drawPoint(point) {
    const pointRotated = point.vertices[0].rotateAboutPoint(
      Camera.rotation,
      Scene.centroidOfEnts
    );
    const pointOnScreen = pointRotated.projectToScreen(
      Camera,
      this.canvas.width,
      this.canvas.height
    );
    Renderer.putPoint(pointOnScreen);
  }
  static drawArc(arc) {
    const p1 = arc.vertices[0];
    const p1Rotated = p1.rotateAboutPoint(
      Camera.rotation,
      Scene.centroidOfEnts
    );
    if (!Camera.isInView(p1Rotated)) {
      return;
    }
    const p1OnScreen = p1Rotated.projectToScreen(
      Camera,
      this.canvas.width,
      this.canvas.height
    );
    this.context.beginPath();
    this.context.moveTo(p1OnScreen.x, p1OnScreen.y);
    // Draw lines to the rest of the points
    for (let i = 1; i < arc.vertices.length; i++) {
      const p2 = arc.vertices[i];
      const p2Rotated = p2.rotateAboutPoint(
        Camera.rotation,
        Scene.centroidOfEnts
      );
      if (!Camera.isInView(p2Rotated)) {
        return;
      }
      const p2OnScreen = p2Rotated.projectToScreen(
        Camera,
        this.canvas.width,
        this.canvas.height
      );
      this.context.lineTo(p2OnScreen.x, p2OnScreen.y);
    }
    this.context.stroke();
    this.context.closePath();
    const p2 = arc.vertices[arc.vertices.length - 1];
    const p2Rotated = p2.rotateAboutPoint(
      Camera.rotation,
      Scene.centroidOfEnts
    );
    const p2OnScreen = p2Rotated.projectToScreen(
      Camera,
      this.canvas.width,
      this.canvas.height
    );
    Renderer.putPoint(p1OnScreen);
    Renderer.putPoint(p2OnScreen);
  }
}

class Scene {
  static entities = [];
  static centroidOfEnts = new vec3(0, 0, 0);
  static init() {
    window.addEventListener(
      "resize",
      () => {
        Scene.update(true);
      },
      false
    );
    Scene.update(true);
    MouseInput.init();
  }
  static findVertexIntersects(ray) {
    for (let i = 0; i < this.entities.length; i++) {
      const result = this.entities[i].doesRayIntersect(ray);
      if (result) {
        console.log(result);
      }
    }
  }
  static findCentroid() {
    let vertCnt = 0;
    Scene.centroidOfEnts = new vec3(0, 0, 0);
    function getCoords(e) {
      switch (e.type) {
        case "LINE": {
          Scene.centroidOfEnts.translate(e.vertices[0]);
          Scene.centroidOfEnts.translate(e.vertices[0]);
          vertCnt += 2;
          break;
        }
        case "CIRCLE": {
          Scene.centroidOfEnts.translate(e.vertices[0]);
          vertCnt += 1;
          break;
        }
        case "ARC": {
          Scene.centroidOfEnts.translate(e.vertices[0]);
          vertCnt += 1;
          break;
        }
        default: {
          for (let j = 0; j < e.vertices.length; j++) {
            getCoords(e.vertices[j]);
          }
          break;
        }
      }
    }

    for (let i = 0; i < Scene.entities.length; i++) {
      const curEnt = Scene.entities[i];
      getCoords(curEnt);
    }
    Scene.centroidOfEnts.x = Scene.centroidOfEnts.x / vertCnt;
    Scene.centroidOfEnts.y = Scene.centroidOfEnts.y / vertCnt;
    Scene.centroidOfEnts.z = Scene.centroidOfEnts.z / vertCnt;
    Camera.pos.x = this.centroidOfEnts.x;
    Camera.pos.y = this.centroidOfEnts.y;
    Camera.pos.z = this.centroidOfEnts.z - 0.5;
    return;
  }
  static setEntities(ents) {
    Scene.entities = ents;
    Scene.findCentroid();
    Camera.setPos(
      Scene.centroidOfEnts.x,
      Scene.centroidOfEnts.y,
      Scene.centroidOfEnts.z - 0.5
    );
  }
  static addEntity(ent) {
    this.entities.push(ent);
    Scene.update(false);
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
          for (let i = 0; i < e.children.length; i++) {
            renderEnt(e.children[i]);
          }
          break;
        }
        case "POLYLINE": {
          for (let i = 0; i < e.children.length; i++) {
            renderEnt(e.children[i]);
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
        case "POINT": {
          Renderer.drawPoint(e);
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

class renderedEntity {
  positionOnScreen; //a vec3
  parentEntity; //reference to actual entity
  parentVectorIndex;
  color; //changes when "focused"
  constructor(positionOnScreen, parentEntity, parentVectorIndex, color) {
    this.positionOnScreen = positionOnScreen;
    this.parentEntity = parentEntity;
    this.parentVectorIndex = parentVectorIndex;
    this.color = color;
  }
}

class MouseInput {
  static active = {
    left: false,
    middle: false,
    right: false,
  };
  static initialPosition = new vec2(0, 0);
  //add way to check all points my ray cast goes throgh
  static timeMoving = 11;
  static init() {
    document.addEventListener("mousedown", this.mouseDown.bind(this));
    document.addEventListener("mouseup", this.mouseUp.bind(this));
    document.addEventListener("mousemove", this.mouseMove.bind(this));
    document.addEventListener("wheel", this.scroll.bind(this));
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
      case 0: {
        this.active.left = true;
        const rect = Renderer.canvas.getBoundingClientRect();
        const realX = down.clientX - rect.left;
        const realY = down.clientY - rect.top;
        this.initialPosition.x = realX;
        this.initialPosition.y = realY;
        this.timeMoving = 0;
        break;
      }
      case 1: {
        this.active.middle = true;
        this.initialPosition.x = down.clientX;
        this.initialPosition.y = down.clientY;
        break;
      }
    }
  }
  static mouseUp(up) {
    switch (up.button) {
      case 0: {
        if (this.timeMoving < 10) {
          this.handleClick();
        }
        this.active.left = false;
        this.timeMoving = 11;
        break;
      }
      case 1: {
        this.active.middle = false;
        break;
      }
    }
  }
  static mouseMove(e) {
    //add holding both left and right click allow you to move and spin
    this.timeMoving++;
    if (this.active.left === true && this.timeMoving > 10) {
      const rect = Renderer.canvas.getBoundingClientRect();
      const realX = e.clientX - rect.left;
      const realY = e.clientY - rect.top;
      let deltaX = this.initialPosition.x - realX;
      let deltaY = this.initialPosition.y - realY;
      const scalar = clamp(0.0001 / Camera.pos.magnitude(), 0.00001, 0.005);
      Camera.translate(deltaX * scalar, deltaY * scalar, 0);
      this.initialPosition.x = realX;
      this.initialPosition.y = realY;
      setTimeout(null, 20);
    }
    if (this.active.middle === true) {
      const rect = Renderer.canvas.getBoundingClientRect();
      const realX = e.clientX - rect.left;
      const realY = e.clientY - rect.top;
      let deltaX = this.initialPosition.x - realX;
      let deltaY = this.initialPosition.y - realY;
      const scalar = clamp(0.0001 / Camera.pos.magnitude(), 0.01, 0.005);
      Camera.rotate(-(deltaY * scalar), deltaX * scalar, 0, 0);
      this.initialPosition.x = realX;
      this.initialPosition.y = realY;
      setTimeout(null, 20);
    }
    Scene.update(false);
  }
  static scrollDown() {
    Camera.translate(0, 0, -0.001);
    Scene.update(false);
  }
  static scrollUp() {
    Camera.translate(0, 0, 0.001);
    Scene.update(false);
  }
  static handleClick(button) {
    const inWorld = this.initialPosition.screenToWorld(
      Camera,
      Renderer.canvas.width,
      Renderer.canvas.height
    );
    Scene.findVertexIntersects(inWorld);
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
  vec2,
  entity,
  vec3,
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
