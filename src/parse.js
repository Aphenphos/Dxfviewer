import { DxfParser } from 'dxf-parser';
import { addEntityToScene, moveCamera, setCameraPos, wipeEntities } from "./render";
import { arcToArcWithBulge, normalize2DCoordinatesToScreen, scaleVert, last, shape, outFile, bulgeToArc, normalizeRadiusToScreen, scaleRad, entity2D, entity3D } from './utils';
import { downloadFile } from './output';


//Maximum coordinate for x and y so for 1000 inches we use 500 so minX = -500 and max is 500;

//yes this is fairly slow but is only done one time on file load and
const extractB = document.getElementById("extract")
const temp = new outFile();
extractB.addEventListener("click", () => downloadFile(temp.data, "letters.json", "text"))
function handleDXF(fileString, is2D = true) { 
    const parser = new DxfParser();
    try {
        const dxf = parser.parseSync(fileString);
        console.log(dxf.entities);
        const entities = dxf.entities;
        const result = parseEntities(entities);
        console.log(entities)
        // findShapes(entities);
        //Write a real way to extract into json and make it robust for later.
        //draw size for each shape
        wipeEntities();
        for (let i=0; i < entities.length; i++) {
            let ent = entities[i];
            switch (ent.type) {
                case ("LWPOLYLINE"): {
                    const verts = []
                    for (let v of ent.vertices) {
                        let newV = normalize2DCoordinatesToScreen(v);
                        newV = scaleVert(newV);
                        if (v.bulge) {
                            newV.bulge = v.bulge;
                        }
                        verts.push(newV);
                    }
                    if (ent.shape === true) {
                        verts.push(verts[0]);
                    }
                    addEntityToScene({
                        type: ent.type,
                        vertices: verts
                    })
                    break;
                }
                case ("ARC"): {
                    //converted from {rad, startAngle, endAngle, centerPoint} -> [{x,y,bulge}, {x,y}];
                    //this mimics the shape of the polyline bulge and is easier to work with later on.
                    let newV = normalize2DCoordinatesToScreen(ent.center);
                    newV = scaleVert(newV);
                    let rad = normalizeRadiusToScreen(ent.radius);
                    rad = scaleRad(rad);
                    addEntityToScene({
                        type: ent.type,
                        vertices: [{
                            startAngle: ent.startAngle,
                            endAngle: ent.endAngle,
                            radius: rad,
                            center: newV
                        }]
                    });
                    break;
                }
                case ("LINE"): {
                    const verts = [];
                    for (let v of ent.vertices) {
                        let newV = normalize2DCoordinatesToScreen(v);
                        newV = scaleVert(newV);
                        verts.push(newV);
                    }
                    addEntityToScene({
                        type: ent.type,
                        vertices: verts
                    });
                    break;
                }
                //Circles are treated as arcs for simplicities sake.
                case("CIRCLE"): {
                    const halfCircle = arcToArcWithBulge({
                        startAngle: .001,
                        endAngle: Math.PI * 2,
                        radius: ent.radius,
                        center: ent.center
                    });
                    const verts = [];
                    let newV = normalize2DCoordinatesToScreen(halfCircle[0]);
                    let newV2 = normalize2DCoordinatesToScreen(halfCircle[1]);
                    newV = scaleVert(newV);
                    newV2 = scaleVert(newV2);
                    newV.bulge = halfCircle[0].bulge;
                    verts.push(newV);
                    verts.push(newV2);
                    addEntityToScene({
                        type: ent.type,
                        vertices: verts
                    });
                    break;
                }
                default: break;
            }
        }
    } catch(err) {
        return console.error(err.stack);
    }
    setCameraPos(0,0,-2);
    moveCamera(undefined,undefined,undefined);
}


// Potential parsing function i translated from my python parser;
function findShapes(entities) {
    const usedEnts = new Set();
    const entCount = entities.length;
    const finalShapes = [];
    let currentShape = [null];
    function isClose(p1,p2) {
        return Math.abs(p1.x - p2.x) < .001 && Math.abs(p1.y - p2.y) < .001;
    };

    function findNextEnt() {
        for (let j = 0; j < entCount; j++) {
            if (sedEnts.has(j) || entities[j].type === "DIMENSION") {
                continue; 
            }
            if (entities[j].type === "CIRCLE" || entities[j].shape === true) {
                usedEnts.add(j);
                continue;
            } 
            if (entities[j].type === "ARC") {
                const verts = arcToArcWithBulge(entities[j]);
                const newArc = {
                    vertices: verts,
                    //BARC is a Arc which has been converted to BULGE ARC
                    type: "BARC"
                }
                entities[j] = newArc;
            };
            if (isClose(entities[j].vertices[0], last(currentShape[currentShape.length - 1].vertices)) ||
                isClose(last(entities[j].vertices), last(currentShape[currentShape.length - 1].vertices)) ||
                isClose(last(entities[j].vertices), currentShape[currentShape.length - 1].vertices[0]) || 
                isClose(entities[j].vertices[0], currentShape[currentShape.length - 1].vertices[0])) {
                usedEnts.add(j);
                currentShape.push(entities[j]);
                return;
            }
        }
        //add support for incomplete entities HERE
        console.error("Could not find next Entity");
    }

    let i = 0;
    while (i < entCount) {
        if (usedEnts.has(i)) {
            i++;
            continue;
        }
        if (entities[i].type === "CIRCLE" || entities[i].shape === true) {
            finalShapes.push(new shape([entities[i]]));
            usedEnts.add(i);
            i++;
            continue;
        }
        if (entities[i].type === "ARC") {
            const verts = arcToArcWithBulge(entities[i]);
            const newArc = {
                vertices: verts,
                type: "BARC"
            }
            entities[i] = newArc;
        };

        const currentEnt = entities[i];
        if (currentShape[0] === null) {
            currentShape[0] = currentEnt;
            usedEnts.add(i);
            i++;
        }
        findNextEnt();
        i++;

        if (currentShape.length > 2) {
            if (isClose(currentShape[0].vertices[0], last(currentShape[currentShape.length - 1].vertices)) || 
                isClose(currentShape[0].vertices[0], currentShape[currentShape.length - 1].vertices[0]) || 
                isClose(last(currentShape[0].vertices), currentShape[currentShape.length - 1].vertices[0]) || 
                isClose(last(currentShape[0].vertices), last(currentShape[currentShape.length - 1].vertices))) {
                finalShapes.push(new shape(currentShape));

                currentShape = [null];
                continue;
            }
        }
    }
    return finalShapes;
}

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
                return new entity2D("LWPOLYLINE",newPolyline);
            }
        } 
        if (v1.bulge) {
            const newArc = bulgeToArc(v1, v2);
            console.log(newArc);
            newPolyline.push(newArc);
        } else {
            const newLine = new entity2D("LINE", [v1,v2])
            newPolyline.push(newLine);
        }
    }
    return new entity2D("LWPOLYLINE", newPolyline);
}

function parsePolyline(polyline) {
    for (let i = 0; i < polyline.vertices.length; i++) {
        
    }
}

function parse2DLine(line) {
    return new entity2D("LINE", line.vertices[0], line.vertices[1]);
}
function parse3DLine(line) {
    return new entity3D("LINE", line.vertices[0], line.vertices[1]);
}

function parse2DArc(arc) {
    return new entity2D("ARC", [arc.center], {
        startAngle: arc.startAngle,
        endAngle: arc.endAngle,
        radius: arc.radius
    });
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