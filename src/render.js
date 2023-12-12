import { camera, renderer, vec3d, scene, vec2d } from "./utils";

const Scene = new scene();

function initRenderer(fov, near, far, rotation) {
    const cam = new camera(new vec3d(0,0,-5), rotation, fov, near, far);
    return new renderer(cam);
}

function initScene() {
    const drawingCanvas = document.getElementById("drawing-canvas");
    const ctx = drawingCanvas.getContext("2d");
    Scene.canvas = drawingCanvas;
    Scene.context = ctx;
    Scene.renderer = initRenderer(90,0.1,1000,0);
    resizeCanvas();
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

function drawArcFromBulge(p1,p2) {
    const dist = Math.sqrt(Math.pow(p2.x - p1.x,2) + Math.pow(p2.y - p1.y, 2));
    const rad = (dist / 2) / Math.abs(p1.bulge);
    const center = new vec2d(
        
    )
    const startAngle = Math.atan2(p1.y - center.y, p1.x - p1.x);
    const endAngle = Math.atan2(p2.y - center.y, p2.x = center.x);

    Scene.context.beginPath();
    Scene.context.arc(center.x, center.y, rad, startAngle, endAngle, true);
    Scene.context.stroke();
    Scene.context.closePath();
}

window.addEventListener("resize", resizeCanvas, false);
//will need to add function to re render all entities.
function resizeCanvas() {
  Scene.canvas.width = window.innerWidth * .9;
  Scene.canvas.height = window.innerHeight *.9;
}



export { initScene, drawPoint, drawArcFromBulge, drawLine }