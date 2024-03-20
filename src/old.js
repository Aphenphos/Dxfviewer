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



// class shape {
//     entities; children; parent; isNormalised; is3D;
//     static id = 0;
//     constructor(entities = [], name=null) {
//         this.id = shape.id++;
//         this.name = name;
//         this.entities = entities;
//         this.children = [];
//         this.parent = null;
//         this.isNormalised = false;
//         this.boundingBox = null
//         this.is3D = false;
//     }
//     findBoundingBox() {
//         const size = this.entities.length;
//         let minX = Infinity; let minY = Infinity; let minZ = Infinity;
//         let maxX = -Infinity; let maxY = -Infinity; let maxZ = -Infinity;
//         for (let i=0; i < size; i++) {
//             const vertCount = this.entities[i].vertices.length;
//             for (let j=0; j < vertCount; j++) {
//                 const curVert = this.entities[i].vertices[j];
//                 if (curVert.x > maxX) maxX = curVert.x;
//                 if (curVert.x < minX) minX = curVert.x;
//                 if (curVert.y > maxY) maxY = curVert.y;
//                 if (curVert.y < minY) minY = curVert.y;
//                 if (this.is3D) {
//                     if (curVert.z > maxZ) maxZ = curVert.z;
//                     if (curVert.z < minZ) minZ = curVert.z;
//                 }
//             }
//         }
//         if (this.is3D) {
//             this.boundingBox = {
//                 min: new vec3(minX,minY,minZ),
//                 max: new vec3(maxX,maxY,maxZ)
//             }
//         } else {
//             this.boundingBox = {
//                 min: new vec2(minX, minY),
//                 max: new vec2(maxX,maxY)
//             }
//         }
//     }

//     normalizeToSelf() {
//         if (this.boundingBox === null) {
//             this.findBoundingBox();
//         }
//         for (let i=0; i < this.entities.length; i++) {
//             const curEnt = this.entities[i];
//             for (let j=0; j < curEnt.vertices.length; j++) {
//                 const curVert = curEnt.vertices[j];
//                 curVert.normalize(this.boundingBox.min, this.boundingBox.max);
//             }
//         }
//         this.isNormalised = true;
//         this.boundingBox = null;
//     }
// }

//0 for 2d  | 1 for 3d