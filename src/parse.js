import { DxfParser } from 'dxf-parser';
import { outFile, bulgeToArc, vec2d, vec3d, entity2D, entity3D } from './utils';
import { downloadFile } from './output';
import {addEntitiesToScene} from './render'

//Maximum coordinate for x and y so for 1000 inches we use 500 so minX = -500 and max is 500;

//yes this is fairly slow but is only done one time on file load and
const extractB = document.getElementById("extract")
const temp = new outFile();
extractB.addEventListener("click", () => downloadFile(temp.data, "letters.json", "text"))
function handleDXF(fileString, is2D = true) { 
    const parser = new DxfParser();
    const dxf = parser.parseSync(fileString);
    const entities = dxf.entities;
    console.log(entities);
    const parsed = parseEntities(entities);
    console.log(parsed);
    addEntitiesToScene(parsed);
}


function parseEntities(ents) {
    const parsedEnts = [];
    for (let i=0; i < ents.length; i++) {
        const currentEnt = ents[i];
        switch(currentEnt.type) {
            case ("LWPOLYLINE"): {
                if (currentEnt.elevation) {
                    parsedEnts.push(parse3DLWPolyline(currentEnt));
                } else {
                    parsedEnts.push(parse2DLWPolyLine(currentEnt));
                }
                break;
            }
            case("POLYLINE"): {
                parsedEnts.push(parsePolyline(currentEnt))
                break;
            }
            case ("LINE"): {
                if (currentEnt.vertices[0].z) {
                    parsedEnts.push(parse3DLine(currentEnt));
                } else {
                    parsedEnts.push(parse2DLine(currentEnt));
                }
                break;
            }
            case("ARC"): {
                if (currentEnt.center.z != 0) {
                    parsedEnts.push(parse3DArc(currentEnt));
                } else {
                    parsedEnts.push(parse2DArc(currentEnt));
                }
                break;
            }
            case("CIRCLE"): {
                break;
            }
            default: break;
        }
    }
    return parsedEnts;
}

function parse2DLWPolyLine(polyline) {
    const newPolyline = []
    for (let i=0; i < polyline.vertices.length; i++) {
        const v1 = polyline.vertices[i];
        let v2 = polyline.vertices[i+1];
        if (i === polyline.vertices.length - 1) {
            if (polyline.shape === true) {
                v2 = polyline.vertices[0];
            } else {
                break;
            }
        } 
        if (v2 === undefined) {
            break;
        }
        if (v1.bulge) {
            const newArc = bulgeToArc(v1, v2);
            newPolyline.push(newArc);
        } else {
            const newLine = new entity2D("LINE", [convertToVec2D(v1),convertToVec2D(v2)])
            newPolyline.push(newLine);
        }
    }
    const result = new entity2D("LWPOLYLINE", newPolyline)
    result.normalizeToWorld();
    return result;
}
function parse3DLWPolyline(polyline) {
    const newPolyline = [];
    let extrusion = null;
    if (polyline.extrusionDirectionX === 0 || polyline.extrusionDirectionX) {
        extrusion = new vec3d(
            polyline.extrusionDirectionX, polyline.extrusionDirectionY, polyline.extrusionDirectionZ
        )
    }
    for (let i=0; i < polyline.vertices.length; i++) {
        const v1 = polyline.vertices[i];
        let v2 = polyline.vertices[i+1];
        if (i === polyline.vertices.length - 1) {
            if (polyline.shape === true) {
                v2 = polyline.vertices[0];
            } else {
                break;
            }
        }
        if (v2 === undefined) {
            break;
        }
        if (v1.bulge) {
            const newArc = bulgeToArc(v1,v2);
            newArc.vertices[0].z = polyline.elevation;
        } else {
            const vec1 = convertToVec3D(v1, polyline.elevation);
            const vec2 = convertToVec3D(v2, polyline.elevation);
            if (extrusion === null) {
                const newLine = new entity3D("LINE", [vec1, vec2]);
                newPolyline.push(newLine);                
            } else {
                console.log(extrusion);
                const vec1Extruded = applyExtrusion(vec1,extrusion)
                const vec2Extruded = applyExtrusion(vec2,extrusion)
                const newLine = new entity3D("LINE", [vec1Extruded, vec2Extruded])
                newPolyline.push(newLine);
            }
        }
    }
    const result = new entity3D("LWPOLYLINE", newPolyline)
    result.normalizeToWorld();
    return result;
}

function parsePolyline(polyline) {
    const newPolyline = [];
    for (let i = 0; i < polyline.vertices.length - 1; i++) {
        const v1 = convertToVec3D(polyline.vertices[i]);
        let v2 = polyline.vertices[i+1];
        if (i === polyline.vertices.length) {
            if (polyline.shape === true) {
                v2 = polyline.vertices[0];
            } else {
                break
            }
        } 
        if ((v1.x === 0 && v1.y === 0 && v1.z === 0 ) || (v2.x === 0 && v2.y === 0 && v2.z === 0)) {
            break;
        }
        v2 = convertToVec3D(v2);
        const newLine = new entity3D("LINE", [v1,v2])
        newPolyline.push(newLine);
    }
    const result = new entity3D("POLYLINE",newPolyline)
    result.normalizeToWorld();
    return result;
}

function parse2DLine(line) {
    const v1 = convertToVec2D(line.vertices[0]);
    const v2 = convertToVec2D(line.vertices[1]);
    const result = new entity2D("LINE",[v1,v2]);
    result.normalizeToWorld()
    return result;
}
function parse3DLine(line) {
    const v1 = convertToVec3D(line.vertices[0]);
    const v2 = convertToVec3D(line.vertices[1]);
    const result = new entity3D("LINE",[v1,v2]);
    result.normalizeToWorld()
    return result;

}

function parse2DArc(arc) {
    const result = new entity2D("ARC", [convertToVec2D(arc.center)], {
        startAngle: arc.startAngle,
        endAngle: arc.endAngle,
        radius: arc.radius
    })
    result.normalizeToWorld()
    return result;
}

function parse3DArc(arc) {
    const result = new entity3D(
        "ARC",
        [convertToVec3D(arc.center)],{
            startAngle: arc.startAngle,
            endAngle: arc.endAngle,
            radius: arc.radius
        })
    if (arc.extrusionDirectionX || arc.extrusionDirectionX === 0) {
        result.attribs.extrusionDirection = new vec3d(arc.extrusionDirectionX, arc.extrusionDirectionY, arc.extrusionDirectionZ);
    }
    result.normalizeToWorld()
    return result;    
}
function convertToVec2D(object) {
    return new vec2d(object.x, object.y);
}
function convertToVec3D(object, elevation) {
    return new vec3d(object.x, object.y, elevation);
}
function applyExtrusion(point, extrusion) {
    function crossProduct(vec1, vec2) {
        return new vec3d(
            vec1.y * vec2.z - vec1.z * vec2.y,
            vec1.z * vec2.x - vec1.x * vec2.z,
            vec1.x * vec2.y - vec1.y * vec2.x
        );
    }

    function normalize(vec) {
        let length = vec.magnitude();
        return new vec3d(vec.x / length, vec.y / length, vec.z / length);
    }

    let Az = normalize(extrusion);
    let Ax, Ay;

    if (Math.abs(Az.x) < 1/64 && Math.abs(Az.y) < 1/64) {
        Ax = normalize(crossProduct(new vec3d(0, 1, 0), Az));
    } else {
        Ax = normalize(crossProduct(new vec3d(0, 0, 1), Az));
    }

    Ay = normalize(crossProduct(Az, Ax));

    function wcsToOcs(point) {
        let px = point.x, py = point.y, pz = point.z;
        let x = px * Ax.x + py * Ax.y + pz * Ax.z;
        let y = px * Ay.x + py * Ay.y + pz * Ay.z;
        let z = px * Az.x + py * Az.y + pz * Az.z;
        return new vec3d(x, y, z);
    }

    let Wx = wcsToOcs(new vec3d(1, 0, 0));
    let Wy = wcsToOcs(new vec3d(0, 1, 0));
    let Wz = wcsToOcs(new vec3d(0, 0, 1));

    return new vec3d(
        point.x * Wx.x + point.y * Wx.y + point.z * Wx.z,
        point.x * Wy.x + point.y * Wy.y + point.z * Wy.z,
        point.x * Wz.x + point.y * Wz.y + point.z * Wz.z
    );
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
export { handleDXF }