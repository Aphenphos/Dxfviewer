import { gridEnabled } from "./input";
import { camera, renderer, vec3d, scene, vec2d, WorldSpaceSize, scaleFactor,  sleep, shape, entity2D, entity3D } from "./utils";
import chars from "./raw/charsNormalised.json" assert {type: "json"};

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


function drawString(string, pos, scale) {
    let curOffset = new vec2d(0,0);
    for (let i = 0; i < string.length; i++) {
        curOffset.x+=scale * (2.5/scale)
        drawCharacter(string[i], curOffset, scale);
    }
}
function drawCharacter(char, offset, scale) {
    //reparse the letters and normalise them so they are much easier to use.
    const toDraw = chars[char]
    for (let i = 0; i < toDraw.entities[0].vertices.length; i++) {
        let j = i+ 1
        if (j >= toDraw.entities[0].vertices.length) {
            j = 0;
        }
        let p1 = new vec2d(toDraw.entities[0].vertices[i].x, toDraw.entities[0].vertices[i].y);
        let p2 = new vec2d(toDraw.entities[0].vertices[j].x, toDraw.entities[0].vertices[j].y); 
        p1.translate(offset);
        p2.translate(offset);
        p1.scale(scale)
        p2.scale(scale);
        p1.normalizeToWorld()
        p2.normalizeToWorld();
        drawLine(projectToScreen(p1), projectToScreen(p2));
    }
    if (toDraw.children != []) {
        for (const child of toDraw.children) {
            for (let i = 0; i < child.entities.length; i++) {
                for (let j = 0; j < child.entities[i].vertices.length; j++) {
                    let k = j + 1;
                    if (k >= child.entities[i].vertices.length) {
                        k = 0;
                    }
                    let p1 = new vec2d(child.entities[i].vertices[j].x, child.entities[i].vertices[j].y);
                    let p2 = new vec2d(child.entities[i].vertices[k].x, child.entities[i].vertices[k].y); 
                    p1.translate(offset);
                    p2.translate(offset);
                    p1.scale(scale)
                    p2.scale(scale);
                    p1.normalizeToWorld();
                    p2.normalizeToWorld();
                    drawLine(projectToScreen(p1), projectToScreen(p2));
                }
            }
        }
    }
}

function drawGrid() {
    for (let i = -WorldSpaceSize; i < WorldSpaceSize; i += scaleFactor) {
        //draw X
        const x1 = new vec2d(i - .5,-WorldSpaceSize);
        const x2 = new vec2d(i,WorldSpaceSize);
        const y1 = new vec2d(-WorldSpaceSize, i - .5);
        const y2 = new vec2d(WorldSpaceSize, i);
        x1.normalizeToWorld(); x2.normalizeToWorld(); y1.normalizeToWorld(); y2.normalizeToWorld();
        drawLine(
            projectToScreen(x1), 
            projectToScreen(x2));
        drawLine(
            projectToScreen(y1), 
            projectToScreen(y2));
        }
}

function drawArc(arc) {
    const center = projectToScreen(arc.center);
    const rad = projectRadToScreen(arc.center, arc.radius);
    Scene.context.beginPath();
    Scene.context.arc(center.x, center.y, rad, arc.startAngle, arc.endAngle, false);
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
    drawString(["A","B",'C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','1','2','3','4','5','6','7','8','9','0'],0,1);
    // drawString(["I"],0,30);

    if (gridEnabled) {
        drawGrid();
    }
    for (let i = 0; i < Scene.entities.length; i++) {
        let curEnt = Scene.entities[i];
        switch (curEnt.type) {
            case("LWPOLYLINE"): {
                for (let j = 0; j < curEnt.vertices.length; j++) {
                    let k = j+1
                    //ugly but Worlds for now
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
                drawArc(curEnt.vertices[0])
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
    translatedPoint.rotate(camera.rotation);
    const distanceRatio = 1 / Math.tan(camera.fov / 2);
    const aspectRatio = screenW / screenH;
    const projecedPoint = new vec2d(
        translatedPoint.x * distanceRatio / translatedPoint.z,
        translatedPoint.y * distanceRatio * aspectRatio / translatedPoint.z
    );
    
    const pointToScreen = new vec2d(
        (projecedPoint.x + 1) * .5 * screenW,
        (projecedPoint.y + 1) * .5 * screenH
    );
    return pointToScreen;
}

function projectRadToScreen(center, rad) {
    // Create two points that are `radius` distance apart in world space
    let point1 = new vec3d(center.x, center.y, center.z);
    let point2 = new vec3d(center.x + rad, center.y, center.z);

    // Project the points to screen space
    point1 = projectToScreen(point1);
    point2 = projectToScreen(point2);

    // Calculate the distance between the projected points
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;

    return Math.sqrt(dx * dx + dy * dy);
}

export { initScene, drawPoint, drawArc, drawArcFromBulge, drawLine, drawGrid, addEntityToScene, renderEntities, wipeEntities, setCameraPos, moveCamera, getCameraPos }