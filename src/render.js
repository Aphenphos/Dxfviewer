import { camera, renderer, vec3d, scene, vec2d } from "./utils";

const Scene = new scene();

function initRenderer(fov, near, far, rotation) {
    const cam = new camera(new vec3d(0,0,-1), rotation, fov, near, far);
    return new renderer(cam);
}

function setCameraPos(x, y, z) {
    Scene.renderer.camera.pos.x = x;
    Scene.renderer.camera.pos.y = y;
    Scene.renderer.camera.pos.z = z;
    Scene.context.translate(x, y);
    Scene.context.scale(z,z);
    console.log(Scene.renderer.camera.pos);
    updateCanvas();  
}
function getCameraPos() {
    return Scene.renderer.camera.pos;
}
function moveCamera(deltaX = 0, deltaY = 0, deltaZ = 0) {
    setCameraPos(Scene.renderer.camera.pos.x + deltaX,
                 Scene.renderer.camera.pos.y + deltaY,
                 Scene.renderer.camera.pos.z + deltaZ)
}

function initScene() {
    const drawingCanvas = document.getElementById("drawing-canvas");
    const ctx = drawingCanvas.getContext("2d");
    Scene.canvas = drawingCanvas;
    Scene.context = ctx;
    Scene.renderer = initRenderer(90,0.1,1000,0);
    resizeCanvas();
}

function addEntityToScene(ent) {
    Scene.entities.push(ent);
}

function wipeEntities() {
    Scene.entities = [];
}


function drawPoint(point) {
    Scene.context.beginPath();
    Scene.context.arc(point.x, point.y, 5, 0, Math.PI * 2);
    Scene.context.fill();
    Scene.context.closePath();
}

function drawLine(p1,p2) {
    Scene.context.beginPath();
    Scene.context.moveTo(p1.x,p1.y);
    Scene.context.lineTo(p2.x,p2.y);
    Scene.context.stroke();
    Scene.context.closePath();
}

function drawArc(arc) {
    Scene.context.beginPath();
    Scene.context.arc(arc.center.x, arc.center.y, Math.abs(arc.radius), arc.startAngle, arc.endAngle, false);
    Scene.context.stroke();
    Scene.context.closePath();
}

function drawArcFromBulge(p1,p2, bulge) {
    function distance(p1, p2) {
        let dx = p2.x - p1.x;
        let dy = p2.y - p1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    function angle(p1, p2) {
        return Math.atan2(p2.y - p1.y, p2.x - p1.x);
    }

    function polar(p, a, r) {
        return new vec2d(p.x + r * Math.cos(a), p.y + r * Math.sin(a));
    }
    
    let a = 2 * Math.atan(bulge);
    let r = distance(p1, p2) / (2 * Math.sin(a));
    let c = polar(p1, Math.PI / 2 - a + angle(p1, p2), r);

    if (bulge < 0) {
        Scene.context.beginPath();
        Scene.context.arc(c.x, c.y, Math.abs(r), angle(c,p2), angle(c,p1), false);
        Scene.context.stroke();
        Scene.context.closePath();
    } else {
        Scene.context.beginPath();
        Scene.context.arc(c.x, c.y, Math.abs(r), angle(c,p1), angle(c,p2), false);
        Scene.context.stroke();
        Scene.context.closePath();
    } 
}

function renderEntities() {
    for (let i = 0; i < Scene.entities.length; i++) {
        let curEnt = Scene.entities[i];
        switch (curEnt.type) {
            case("LWPOLYLINE"): {
                for (let j = 0; j < curEnt.vertices.length; j++) {
                    let k = j+1
                    if (k >= curEnt.vertices.length) {
                        k=0;
                    }
                    drawPoint(projectPoint2D(curEnt.vertices[j]));
                    if (curEnt.vertices[j].bulge) {
                        drawArcFromBulge(projectPoint2D(curEnt.vertices[j]), projectPoint2D(curEnt.vertices[k]), curEnt.vertices[j].bulge);
                    } else {
                        drawLine(projectPoint2D(curEnt.vertices[j]), projectPoint2D(curEnt.vertices[k]));
                    }
                }
                break;
            }
            case("LINE"): {
                drawLine(curEnt.vertices[0], curEnt.vertices[1]);
                break;
            }
            case("ARC"): {
                drawArc(curEnt);
            }
        }
    }
}

window.addEventListener("resize", resizeCanvas, false);
//will need to add function to re render all entities.

function resizeCanvas() {
    Scene.canvas.width = window.innerWidth * .9;
    Scene.canvas.height = window.innerHeight *.9;
    updateCanvas();
}

function updateCanvas() {
    Scene.canvas.width = Scene.canvas.width;
    Scene.canvas.height = Scene.canvas.height;
    renderEntities();
}

function projectPoint2D(point) {
    const dx = point.x - Scene.renderer.camera.pos.x;
    const dy = point.y - Scene.renderer.camera.pos.y;
    const dz = 1 - Scene.renderer.camera.pos.z;

    const fovRadians = Scene.renderer.camera.fov * (Math.PI / 180);
    const focalLength = 1 / Math.tan(fovRadians / 2);

    const px = dx * (focalLength / dz);
    const py = dy * (focalLength / dz);
    
    return new vec2d(px,py);
}

export { initScene, drawPoint, drawArc, drawArcFromBulge, drawLine, addEntityToScene, renderEntities, wipeEntities, setCameraPos, moveCamera, getCameraPos }