import { DxfParser } from 'dxf-parser';
import { moveCamera, setCameraPos } from "./render";
import { outFile, bulgeToArc, normalizeRadiusToScreen, scaleRad, entity2D, entity3D } from './utils';
import { downloadFile } from './output';


//Maximum coordinate for x and y so for 1000 inches we use 500 so minX = -500 and max is 500;

//yes this is fairly slow but is only done one time on file load and
const extractB = document.getElementById("extract")
const temp = new outFile();
extractB.addEventListener("click", () => downloadFile(temp.data, "letters.json", "text"))
function handleDXF(fileString, is2D = true) { 
    const parser = new DxfParser();
    const dxf = parser.parseSync(fileString);
    const entities = dxf.entities;
    parseEntities(entities);
    setCameraPos(0,0,-2);
    moveCamera(undefined,undefined,undefined);
}


// Potential parsing function i translated from my python parser;
// function findShapes(entities) {
//     const usedEnts = new Set();
//     const entCount = entities.length;
//     const finalShapes = [];
//     let currentShape = [null];
//     function isClose(p1,p2) {
//         return Math.abs(p1.x - p2.x) < .001 && Math.abs(p1.y - p2.y) < .001;
//     };

//     function findNextEnt() {
//         for (let j = 0; j < entCount; j++) {
//             if (usedEnts.has(j) || entities[j].type === "DIMENSION") {
//                 continue; 
//             }
//             if (entities[j].type === "CIRCLE" || entities[j].shape === true) {
//                 usedEnts.add(j);
//                 continue;
//             } 
//             if (isClose(entities[j].vertices[0], last(currentShape[currentShape.length - 1].vertices)) ||
//                 isClose(last(entities[j].vertices), last(currentShape[currentShape.length - 1].vertices)) ||
//                 isClose(last(entities[j].vertices), currentShape[currentShape.length - 1].vertices[0]) || 
//                 isClose(entities[j].vertices[0], currentShape[currentShape.length - 1].vertices[0])) {
//                 usedEnts.add(j);
//                 currentShape.push(entities[j]);
//                 return;
//             }
//         }
//         //add support for incomplete shapes HERE
//         console.error("Could not find next Entity");
//     }

//     let i = 0;
//     while (i < entCount) {
//         if (usedEnts.has(i)) {
//             i++;
//             continue;
//         }
//         if (entities[i].type === "CIRCLE" || entities[i].shape === true) {
//             finalShapes.push(new shape([entities[i]]));
//             usedEnts.add(i);
//             i++;
//             continue;
//         }
//         if (entities[i].type === "ARC") {
//             const verts = arcToArcWithBulge(entities[i]);
//             const newArc = {
//                 vertices: verts,
//                 type: "BARC"
//             }
//             entities[i] = newArc;
//         };

//         const currentEnt = entities[i];
//         if (currentShape[0] === null) {
//             currentShape[0] = currentEnt;
//             usedEnts.add(i);
//             i++;
//         }
//         findNextEnt();
//         i++;

//         if (currentShape.length > 2) {
//             if (isClose(currentShape[0].vertices[0], last(currentShape[currentShape.length - 1].vertices)) || 
//                 isClose(currentShape[0].vertices[0], currentShape[currentShape.length - 1].vertices[0]) || 
//                 isClose(last(currentShape[0].vertices), currentShape[currentShape.length - 1].vertices[0]) || 
//                 isClose(last(currentShape[0].vertices), last(currentShape[currentShape.length - 1].vertices))) {
//                 finalShapes.push(new shape(currentShape));

//                 currentShape = [null];
//                 continue;
//             }
//         }
//     }
//     return finalShapes;
// }

function parseEntities(ents) {
    for (let i=0; i < ents.length; i++) {
        const currentEnt = ents[i];
        console.log(currentEnt);
        let parsed;
        switch(currentEnt.type) {
            case ("LWPOLYLINE"): {
                if (currentEnt.elevation) {
                    parsed = parse3DLWPolyline(currentEnt);
                } else {
                    parsed = parse2DLWPolyLine(currentEnt);
                }
                ents[i] = parsed;
                break;
            }
            case("POLYLINE"): {
                parsed = parsePolyline(currentEnt)
                ents[i] = parsed;
                break;
            }
            case ("LINE"): {
                if (currentEnt.vertices[0].z) {
                    parsed = parse3DLine(currentEnt);
                } else {
                    parsed = parse2DLine(currentEnt);
                }
                ents[i] = parsed;
                break;
            }
            case("ARC"): {
                if (currentEnt.center.z != 0) {
                    parsed = parse3DArc(currentEnt);
                } else {
                    parsed = parse2DArc(currentEnt);
                }
                ents[i] = parsed;
                break;
            }
            case("CIRCLE"): {

            }
            default: break;
        }
    }
}

function parse2DLWPolyLine(polyline) {
    const newPolyline = []
    for (let i = 0; i < polyline.vertices.length; i++) {
        const v1 = polyline.vertices[i];
        let v2 = polyline.vertices[i+1];
        if (i === polyline.vertices.length) {
            if (polyline.shape === true) {
                v2 = polyline.vertices[0];
            } else {
                break;
            }
        } 
        if (v1.bulge) {
            const newArc = bulgeToArc(v1, v2);
            newPolyline.push(newArc);
        } else {
            const newLine = new entity2D("LINE", [v1,v2])
            newPolyline.push(newLine);
        }
    }
    return new entity2D("LWPOLYLINE", newPolyline).normalizeToWorld();
}

function parsePolyline(polyline) {
    const newPolyline = [];
    for (let i = 0; i < polyline.vertices.length - 1; i++) {
        const v1 = polyline.vertices[i];
        let v2 = polyline.vertices[i+1];
        if (i === polyline.vertices.length) {
            if (polyline.shape === true) {
                v2 = polyline.vertices[0];
            } else {
                break
            }
        } 
        const newLine = new entity3D("LINE", [v1,v2])
        newPolyline.push(newLine);
    }
    return new entity3D("POLYLINE",newPolyline).normalizeToWorld();
}

function parse2DLine(line) {
    return new entity2D("LINE", line.vertices[0], line.vertices[1]).normalizeToWorld()
}
function parse3DLine(line) {
    return new entity3D("LINE", line.vertices[0], line.vertices[1]).normalizeToWorld()
}

function parse2DArc(arc) {
    return new entity2D("ARC", [arc.center], {
        startAngle: arc.startAngle,
        endAngle: arc.endAngle,
        radius: arc.radius
    }).normalizeToWorld()
}

function parse3DArc(arc) {
    return new entity3D(
        "ARC",
        [arc.center],
        new vec3d(arc.extrusionDirectionX, arc.extrustionDirectionY, arc.extrusionDirectionZ), {
            startAngle: arc.startAngle,
            endAngle: arc.endAngle,
            radius: arc.radius
        }
    ).normalizeToWorld()
}


// let toShapes = [];
// let used = new Set();
// let shape = [null];
// let length = coords.length;
// function isClose(p1, p2) {
//     return Math.abs(p1.x - p2.x) < Number.EPSILON && Math.abs(p1.y - p2.y) < Number.EPSILON;
// }

// function findNextEnt() {
//     for (let j = 0; j < length; j++) {
//         if (used.has(j) || coords[j].start().type === 'CIRCLE') {
//             continue;
//         }
//         if (isClose(coords[j].start(), shape[shape.length - 1].end()) || isClose(coords[j].end(), shape[shape.length - 1].end()) ||
//         isClose(coords[j].start(), shape[shape.length - 1].start()) || isClose(coords[j].end(), shape[shape.length - 1].start())) {
//             used.add(j);
//             shape.push(coords[j]);
//             return true;
//         }
//     }
//     console.log("Could not find next Entity.");
//     process.exit(1);
// }

// let i = 0;
// while (i < length) {
//     if (coords[i].start().type === 'CIRCLE') {
//         toShapes.push(new Shape([coords[i]])); // assuming Shape is a defined class
//         used.add(i);
//         i++;
//         continue;
//     }
//     if (shape[0] === null) {
//         shape[0] = coords[i];
//         used.add(i);
//         i++;
//     }
//     findNextEnt();
//     i++;
//     if (shape.length > 2) {
//         if (isClose(shape[0].start(), shape[shape.length - 1].end()) || isClose(shape[0].end(), shape[shape.length - 1].end()) ||
//             isClose(shape[0].start(), shape[shape.length - 1].start()) || isClose(shape[0].end(), shape[shape.length - 1].start())) {
//             console.log("shape completed");
//             toShapes.push(new Shape(shape)); // assuming Shape is a defined class
//             shape = [null];
//             continue;
//         }
//     }
//     if (used.size === length) {
//         break;
//     }
// }

export { handleDXF }