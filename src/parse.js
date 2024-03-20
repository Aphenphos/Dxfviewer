import { DxfParser } from 'dxf-parser';
import { outFile, bulgeToArc, vec2, vec3, entity } from './utils';
import { downloadFile } from './output';
import { Scene } from './utils';
//Maximum coordinate for x and y so for 1000 inches we use 500 so minX = -500 and max is 500;

//yes this is fairly slow but is only done one time on file load and
const extractB = document.getElementById("extract")
const temp = new outFile();
extractB.addEventListener("click", () => downloadFile(temp.data, "letters.json", "text"))
function handleDXF(fileString) { 
    const parser = new DxfParser();
    const dxf = parser.parseSync(fileString);
    const entities = dxf.entities;
    console.log(entities);
    const parsed = parseEntities(entities);
    console.log(parsed);
    Scene.setEntities(parsed);
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
    const result = new entity("LWPOLYLINE")
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
            const newLine = new entity("LINE", [convertTovec2(v1),convertTovec2(v2)])
            newLine.parent = result;
            newPolyline.push(newLine);
        }
    }
    result.children = newPolyline
    result.parent = true;
    result.normalizeToWorld();
    return result;
}
function parse3DLWPolyline(polyline) {
    const newPolyline = [];
    let extrusion = null;
    const result = new entity("LWPOLYLINE")
    if (polyline.extrusionDirectionX === 0 || polyline.extrusionDirectionX) {
        extrusion = new vec3(
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
            const vec1 = convertTovec3(v1, polyline.elevation);
            const vec2 = convertTovec3(v2, polyline.elevation);
            if (extrusion === null) {
                const newLine = new entity("LINE", [vec1, vec2]);
                newLine.parent = result
                newPolyline.push(newLine);                
            } else {
                const vec1Extruded = applyExtrusion(vec1,extrusion)
                const vec2Extruded = applyExtrusion(vec2,extrusion)
                const newLine = new entity("LINE", [vec1Extruded, vec2Extruded])
                newLine.parent = result
                newPolyline.push(newLine);
            }
        }
    }
    result.children = newPolyline;
    result.normalizeToWorld();
    return result;
}

function parsePolyline(polyline) {
    const newPolyline = [];
    let faceBeginning = 0;
    for (let i = 0; i < polyline.vertices.length - 1; i++) {
        const v1 = convertTovec3(polyline.vertices[i]);
        let v2 = polyline.vertices[i+1];
        if (i === polyline.vertices.length) {
            if (polyline.shape === true) {
                v2 = polyline.vertices[0];
            } else {
                break
            }
        } 
        if (v1.x === 0 && v1.y === 0 && v1.z === 0) {
            console.log("v1",i);
            faceBeginning = i;
            break;
        }
        if (v2.x === 0 && v2.y === 0 && v2.z === 0){
            console.log("v2",i);
            faceBeginning = i+1;
            break;
        }
        v2 = convertTovec3(v2);
        const newLine = new entity("LINE", [v1,v2])
        newPolyline.push(newLine);
    }
    let faceArr = []
    const faceMap = {
        'faceA': (face) => faceArr.push(face),        
        'faceB': (face) => faceArr.push(face),
        'faceC': (face) => faceArr.push(face),
        'faceD': (face) => faceArr.push(face),
    }
    for (let i = faceBeginning; i < polyline.vertices.length - 1; i++) {
        const curVert = polyline.vertices[i];
        for (let key in curVert) {
            if (faceMap[key]) {
                faceMap[key](curVert[key]);
            }
        }
        for (let k=0; k<faceArr.length-1; k++) {
            let j = k+1;
            let i1 = faceArr[k] > 0 ? faceArr[k] : polyline.vertices.length + faceArr[k];
            let i2 = faceArr[j] > 0 ? faceArr[j]: polyline.vertices.length + faceArr[j];
            if (faceArr[k] >= 0 && faceArr[j] >= 0) {
                const v1 = convertTovec3(polyline.vertices[i1-1]);
                const v2 = convertTovec3(polyline.vertices[i2-1]); 
                const newLine = new entity("LINE", [v1,v2]);
                newPolyline.push(newLine);
            }
        }
        faceArr = [];
    }
    const result = new entity("POLYLINE",newPolyline)
    result.normalizeToWorld();
    return result;
}

function parse2DLine(line) {
    const v1 = convertTovec2(line.vertices[0]);
    const v2 = convertTovec2(line.vertices[1]);
    const result = new entity("LINE",[v1,v2]);
    result.normalizeToWorld()
    return result;
}
function parse3DLine(line) {
    const v1 = convertTovec3(line.vertices[0]);
    const v2 = convertTovec3(line.vertices[1]);
    const result = new entity("LINE",[v1,v2]);
    result.normalizeToWorld()
    return result;

}

function parse2DArc(arc) {
    const result = new entity("ARC", [convertTovec2(arc.center)], {
        startAngle: arc.startAngle,
        endAngle: arc.endAngle,
        radius: arc.radius
    })
    result.normalizeToWorld()
    return result;
}

function parse3DArc(arc) {
    const result = new entity(
        "ARC",
        [convertTovec3(arc.center)],{
            startAngle: arc.startAngle,
            endAngle: arc.endAngle,
            radius: arc.radius
        })
    if (arc.extrusionDirectionX || arc.extrusionDirectionX === 0) {
        result.attribs.extrusionDirection = new vec3(arc.extrusionDirectionX, arc.extrusionDirectionY, arc.extrusionDirectionZ);
    }
    result.normalizeToWorld()
    return result;    
}
function convertTovec2(object) {
    return new vec2(object.x, object.y);
}
function convertTovec3(object, elevation) {
    if (!elevation) {
        return new vec3(object.x, object.y, object.z);
    }
    return new vec3(object.x, object.y, elevation);
}
function applyExtrusion(point, extrusion) {
    function crossProduct(vec1, vec2) {
        return new vec3(
            vec1.y * vec2.z - vec1.z * vec2.y,
            vec1.z * vec2.x - vec1.x * vec2.z,
            vec1.x * vec2.y - vec1.y * vec2.x
        );
    }

    function normalize(vec) {
        let length = vec.magnitude();
        return new vec3(vec.x / length, vec.y / length, vec.z / length);
    }

    let Az = normalize(extrusion);
    let Ax, Ay;

    if (Math.abs(Az.x) < 1/64 && Math.abs(Az.y) < 1/64) {
        Ax = normalize(crossProduct(new vec3(0, 1, 0), Az));
    } else {
        Ax = normalize(crossProduct(new vec3(0, 0, 1), Az));
    }

    Ay = normalize(crossProduct(Az, Ax));

    function wcsToOcs(point) {
        let px = point.x, py = point.y, pz = point.z;
        let x = px * Ax.x + py * Ax.y + pz * Ax.z;
        let y = px * Ay.x + py * Ay.y + pz * Ay.z;
        let z = px * Az.x + py * Az.y + pz * Az.z;
        return new vec3(x, y, z);
    }

    let Wx = wcsToOcs(new vec3(1, 0, 0));
    let Wy = wcsToOcs(new vec3(0, 1, 0));
    let Wz = wcsToOcs(new vec3(0, 0, 1));

    return new vec3(
        point.x * Wx.x + point.y * Wx.y + point.z * Wx.z,
        point.x * Wy.x + point.y * Wy.y + point.z * Wy.z,
        point.x * Wz.x + point.y * Wz.y + point.z * Wz.z
    );
}


export { handleDXF }