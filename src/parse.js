import { DxfParser } from 'dxf-parser';
import { addEntityToScene, moveCamera, setCameraPos, wipeEntities } from "./render";
import { arcToArcWithBulge, normalize2DCoordinatesToScreen, scaleVert, last, shape, outFile, normalize_array, entity, normalizeCoordinates2D } from './utils';
import { downloadFile } from './output';
import characters from "./raw/characters.json" assert {type: "json"};
import chars from "./raw/chars.json" assert {type: "json"};

import fs from "fs"

//Maximum coordinate for x and y so for 1000 inches we use 500 so minX = -500 and max is 500;

//yes this is fairly slow but is only done one time on file load and
const extractB = document.getElementById("extract")
const temp = new outFile();
extractB.addEventListener("click", () => downloadFile(temp.data, "letters.json", "text"))
function handleDXF(fileString, is2D = true) { 
    const parser = new DxfParser();
    try {
        const dxf = parser.parseSync(fileString);
        const entities = dxf.entities;
        const shapes = findShapes(entities);
        for (const s of shapes) {
            find2DShapeBoundingBox(s);
        }
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
                    const arcConverted = arcToArcWithBulge(ent);
                    const verts = [];
                    for (let v of arcConverted) {
                        let newV = normalize2DCoordinatesToScreen(v);
                        newV = scaleVert(newV);
                        newV.bulge = v.bulge;
                        verts.push(newV);
                    }
                    addEntityToScene({
                        type: ent.type,
                        vertices: verts
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
    setCameraPos(0,0,0);
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
            if (entities[j].type === "DIMENSION") {
                continue;
            }
            if (usedEnts.has(j)) {
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
            //having same issue as python parser (since vertices are in random order makes doing 4 checks necessary which is sloppy)
            //(need to figure out a way to order things easier and make this less sloppy)
            // though it works I do not like it
            
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
function parseCharsFromJson() {
    let toObj = {}
    for (const c in characters) {
        const charData = characters[c];
        const toShape = new shape([new entity("LINE", charData.vertices)], c);
        if (charData.innerVertices != 'null') {
            for (const inner in charData.innerVertices) {
                const child = new shape([new entity("LINE", charData.innerVertices[inner])]);
                toShape.children.push(child);
            }
        }
        const normalised = normaliseShapeToSelf(toShape)
        toObj[c] = normalised;
    }
    downloadFile(JSON.stringify(toObj),"chars.json","text/plain");
}
parseCharsFromJson()

function normaliseArrOfShapesToSelf(shapeArr) {
    const normalised = []
    for (const shape in shapeArr) {
        const shapeNormalised = normaliseShapeToSelf(shape);
        normalised.push(shapeNormalised);
    }
    return normalised;
}
//Do not do this without good reason.
function normaliseShapeToSelf(shape) {
    let parsedShape = shape;
    if (parsedShape.maxX === null) {
        parsedShape = find2DShapeBoundingBox(shape);
    }
    //loop through shape and its inner shapes and normalise all of them to the shape itself.
    for (let i = 0; i < parsedShape.entities.length; i++) {
        let curEnt = parsedShape.entities[i];
        for (let j = 0; j < curEnt.vertices.length; j++) {
            let curVertice = curEnt.vertices[j];
            const curVerticeNormalised = normalizeCoordinates2D(curVertice.x, curVertice.y, parsedShape.minX, parsedShape.maxX, parsedShape.minY, parsedShape.maxY);
            parsedShape.entities[i].vertices[j] = curVerticeNormalised;
        }
    }
    if (parsedShape.children[0]) {
        for (let c = 0; c < parsedShape.children.length; c++) {
            let curChild = parsedShape.children[c];
            for (let i = 0; i < curChild.entities.length; i++) {
                let curEnt = curChild.entities[i];
                for (let j = 0; j < curEnt.vertices.length; j++) {
                    let curVertice = curEnt.vertices[j];
                    const curVerticeNormalised = normalizeCoordinates2D(curVertice.x, curVertice.y, parsedShape.minX, parsedShape.maxX, parsedShape.minY, parsedShape.maxY);
                    parsedShape.children[c].entities[i].vertices[j] = curVerticeNormalised;
                }
            }
        }
    }
    parsedShape.maxX = parsedShape.maxY = 1;
    parsedShape.minX = parsedShape.minY = -1;
    return parsedShape;
}

function find2DShapeBoundingBox(shape) {
    const shapeLen = shape.entities.length;
    //make min/max ridiculously high and low for first check to always be true
    let minX = 10000, maxX = -1000, minY = 10000, maxY = -10000, totalVerts = 0;
    for (let i=0; i < shapeLen; i++) {
        const vertCount = shape.entities[i].vertices.length;
        for (let j=0; j < vertCount; j++) {
            totalVerts++;
            const curVert = shape.entities[i].vertices[j];
                if (curVert.x > maxX) {
                    maxX = curVert.x;
                }
                if (curVert.x < minX) {
                    minX = curVert.x;
                }
                if (curVert.y > maxY) {
                    maxY = curVert.y;
                }
                if (curVert.y < minY) {
                    minY = curVert.y;
                }
        }  
    }
    shape.minX = minX; shape.maxX = maxX; shape.minY = minY; shape.maxY = maxY, shape.vertCnt = totalVerts;
    return shape;
}

function addBoundingBoxDimensions(shape) {
    const difX = shape.maxX - shape.minX;
    const difY = shape.maxY - shape.minY;


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