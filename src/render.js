import { camera, renderer, vec3d, scene, vec2d, projectToScreen, WorkSpaceSize, scaleFactor, normalizeCoordinates2D } from "./utils";

const Scene = new scene();

function initRenderer(fov, near, far, rotation) {
    const cam = new camera(new vec3d(0,0,0), rotation, fov, near, far);
    return new renderer(cam);
}

function setCameraPos(x, y, z) {
    Scene.renderer.camera.pos.x = x;
    Scene.renderer.camera.pos.y = y;
    Scene.renderer.camera.pos.z = z;
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
    Scene.renderer = initRenderer(45,0.1,1000,new vec3d(0,0,0));
    resizeCanvas();
}

function addEntityToScene(ent) {
    console.log(ent);
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

function drawGrid() {
    for (let i = -WorkSpaceSize; i < WorkSpaceSize; i += scaleFactor) {
        //draw X
        const x1 = normalizeCoordinates2D(i,-WorkSpaceSize,-WorkSpaceSize,WorkSpaceSize,-WorkSpaceSize,WorkSpaceSize);
        const x2 = normalizeCoordinates2D(i,WorkSpaceSize,-WorkSpaceSize,WorkSpaceSize,-WorkSpaceSize,WorkSpaceSize);
        drawLine(
            projectToScreen(x1, 
                Scene.renderer.camera, 
                Scene.canvas.width, 
                Scene.canvas.height), 
            projectToScreen(x2,
                Scene.renderer.camera, 
                Scene.canvas.width, 
                Scene.canvas.height));
    }
}

function drawArc(arc) {
    Scene.context.beginPath();
    Scene.context.arc(arc.cent.x, arc.cent.y, Math.abs(arc.radius), arc.startAngle, arc.endAngle, false);
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
    //THIS FUNCTIONS NEEDS TO BE SHOT IN THE HEAD, REMAKE IT.
    drawGrid();
    for (let i = 0; i < Scene.entities.length; i++) {
        let curEnt = Scene.entities[i];
        switch (curEnt.type) {
            case("LWPOLYLINE"): {
                for (let j = 0; j < curEnt.vertices.length; j++) {
                    let k = j+1
                    if (k >= curEnt.vertices.length) {
                        k=0;
                    }
                    drawPoint(
                        projectToScreen(curEnt.vertices[j], 
                            Scene.renderer.camera, 
                            Scene.canvas.width, 
                            Scene.canvas.height));
                    if (curEnt.vertices[j].bulge) {
                        drawArcFromBulge(
                            projectToScreen(curEnt.vertices[j], 
                                Scene.renderer.camera, 
                                Scene.canvas.width, 
                                Scene.canvas.height), 
                            projectToScreen(curEnt.vertices[k], 
                                Scene.renderer.camera,
                                Scene.canvas.width,
                                Scene.canvas.height,), 
                            curEnt.vertices[j].bulge);
                    } else {
                        drawLine(
                            projectToScreen(curEnt.vertices[j], 
                                Scene.renderer.camera, 
                                Scene.canvas.width, 
                                Scene.canvas.height), 
                            projectToScreen(curEnt.vertices[k],
                                Scene.renderer.camera, 
                                Scene.canvas.width, 
                                Scene.canvas.height));
                    }
                }
                break;
            }
            case("LINE"): {
                drawLine(projectToScreen(curEnt.vertices[0],
                    Scene.renderer.camera, 
                    Scene.canvas.width, 
                    Scene.canvas.height), projectToScreen(curEnt.vertices[1],                                 
                        Scene.renderer.camera, 
                        Scene.canvas.width, 
                        Scene.canvas.height));
                break;
            }
            case("ARC"): {
                curEnt.cent = projectToScreen(curEnt.cent,                                
                    Scene.renderer.camera, 
                    Scene.canvas.width, 
                    Scene.canvas.height)
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


export { initScene, drawPoint, drawArc, drawArcFromBulge, drawLine, drawGrid, addEntityToScene, renderEntities, wipeEntities, setCameraPos, moveCamera, getCameraPos }