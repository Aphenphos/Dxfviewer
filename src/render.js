import { gridEnabled } from "./input";
import { camera, renderer, vec3d, scene, vec2d, WorkSpaceSize, scaleFactor, normalizeCoordinates2D, scaleVert, rotatePoint, sleep, shape, entity } from "./utils";
import characters from "./raw/characters.json" assert {type: "json"};
console.log(characters.A)
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


function drawString(string, pos) {
    let curOffset = 0;
    for (let i = 0; i < string.length; i++) {
        drawCharacter(string[i]);
    }
}
function drawCharacter(char, offset) {
    //reparse the letters and normalise them so they are much easier to use.
    const toDraw = characters[char]
    for (let i = 0; i < toDraw.vertices.length; i++) {
        let j = i+ 1
        if (j >= toDraw.vertices.length) {
            j = 0;
        }
        let p1 = toDraw.vertices[i];
        let p2 = toDraw.vertices[j];
        p1 = normalizeCoordinates2D(p1.x,p1.y, -WorkSpaceSize, WorkSpaceSize, -WorkSpaceSize, WorkSpaceSize);
        p2 = normalizeCoordinates2D(p2.x,p2.y, -WorkSpaceSize, WorkSpaceSize, -WorkSpaceSize, WorkSpaceSize);
        drawLine(projectToScreen(p1), projectToScreen(p2));
    }
    if (toDraw.innerVertices) {
        for (let i = 0; i < toDraw.innerVertices.length; i++) {
            for (let j = 0; j < toDraw.innerVertices[i].length; j++) {
                let k = j + 1;
                if (k >= toDraw.innerVertices[i].length) {
                    k = 0;
                }
                let p1 = toDraw.innerVertices[i][j];
                let p2 = toDraw.innerVertices[i][k];
                p1 = normalizeCoordinates2D(p1.x,p1.y, -WorkSpaceSize, WorkSpaceSize, -WorkSpaceSize, WorkSpaceSize);
                p2 = normalizeCoordinates2D(p2.x,p2.y, -WorkSpaceSize, WorkSpaceSize, -WorkSpaceSize, WorkSpaceSize);
                drawLine(projectToScreen(p1), projectToScreen(p2));
            }
        }
    }
}

function drawGrid() {
    
    for (let i = -WorkSpaceSize; i < WorkSpaceSize; i += scaleFactor) {
        //draw X
        let x1 = normalizeCoordinates2D(i - .5,-WorkSpaceSize,-WorkSpaceSize,WorkSpaceSize,-WorkSpaceSize,WorkSpaceSize);
        let x2 = normalizeCoordinates2D(i,WorkSpaceSize,-WorkSpaceSize,WorkSpaceSize,-WorkSpaceSize,WorkSpaceSize);
        let y1 = normalizeCoordinates2D(-WorkSpaceSize, i - .5, -WorkSpaceSize, WorkSpaceSize, -WorkSpaceSize, WorkSpaceSize);
        let y2 = normalizeCoordinates2D(WorkSpaceSize, i, -WorkSpaceSize, WorkSpaceSize, -WorkSpaceSize, WorkSpaceSize);
        drawLine(
            projectToScreen(x1), 
            projectToScreen(x2));
        drawLine(
            projectToScreen(y1), 
            projectToScreen(y2));
        }
}

function drawArc(arc) {
    function projectRadiusToScreen(center, radius) {
        // Create two points that are `radius` distance apart
        let point1 = {x: center.x, y: center.y, z: 0};
        let point2 = {x: center.x + radius, y: center.y, z: 0};
        // Project the points to the screen
        // Calculate the distance between the projected points
        let dx = point2.x - point1.x;
        let dy = point2.y - point1.y;
        let projectedRadius = Math.sqrt(dx * dx + dy * dy);

        return projectedRadius;
    }
    Scene.context.beginPath();
    Scene.context.arc(arc.center.x, arc.center.y, Math.abs(projectRadiusToScreen(arc.center, arc.radius)), arc.startAngle, arc.endAngle, false);
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
    drawString(["A","B",'C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','1','2','3','4','5','6','7','8','9','0']);
    if (gridEnabled) {
        drawGrid();
    }
    for (let i = 0; i < Scene.entities.length; i++) {
        let curEnt = Scene.entities[i];
        switch (curEnt.type) {
            case("LWPOLYLINE"): {
                for (let j = 0; j < curEnt.vertices.length; j++) {
                    let k = j+1
                    //ugly but works for now
                    if (curEnt.vertices[j].bulge) {
                        if (k >= curEnt.vertices.length) {
                            k=0
                        }
                        drawArcFromBulge(
                            projectToScreen(curEnt.vertices[j]), 
                            projectToScreen(curEnt.vertices[k]), 
                            curEnt.vertices[j].bulge);
                        } else {
                            if (k >= curEnt.vertices.length) {
                                break;
                            }
                            drawLine(
                            projectToScreen(curEnt.vertices[j]), 
                            projectToScreen(curEnt.vertices[k]));
                        }
                    }
                break;
            }
            case("LINE"): {
                drawLine(projectToScreen(curEnt.vertices[0]), 
                            projectToScreen(curEnt.vertices[1]));
                break;
            }
            case("ARC"): {
                drawArcFromBulge(
                    projectToScreen(curEnt.vertices[0]), 
                    projectToScreen(curEnt.vertices[1]), 
                    curEnt.vertices[0].bulge);
                break;
            }
            case("BARC"): {
                drawArcFromBulge(
                    projectToScreen(curEnt.vertices[0]), 
                    projectToScreen(curEnt.vertices[1]), 
                    curEnt.vertices[0].bulge);
                break;   
            }
            case("CIRCLE"): {
                drawArcFromBulge(
                    projectToScreen(curEnt.vertices[0]), 
                    projectToScreen(curEnt.vertices[1]), 
                    curEnt.vertices[0].bulge);
                break;    
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

function projectToScreen(point) {
    const camera = Scene.renderer.camera
    const screenW = Scene.canvas.width;
    const screenH = Scene.canvas.height;
    const translatedPoint = new vec3d(
        point.x - camera.pos.x,
        point.y - camera.pos.y,
        point.z - camera.pos.z
    );
    const rotatedPoint = rotatePoint(translatedPoint, camera.rotation);
    const distanceRatio = 1 / Math.tan(camera.fov / 2);
    const aspectRatio = screenW / screenH;
    const projecedPoint = new vec2d(
        rotatedPoint.x * distanceRatio / rotatedPoint.z,
        rotatedPoint.y * distanceRatio * aspectRatio / rotatedPoint.z
    );
    
    const pointToScreen = new vec2d(
        (projecedPoint.x + 1) * .5 * screenW,
        (projecedPoint.y + 1) * .5 * screenH
    );
    return pointToScreen;
}


export { initScene, drawPoint, drawArc, drawArcFromBulge, drawLine, drawGrid, addEntityToScene, renderEntities, wipeEntities, setCameraPos, moveCamera, getCameraPos }