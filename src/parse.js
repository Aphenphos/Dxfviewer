import { DxfParser } from 'dxf-parser';
import { addEntityToScene, moveCamera, setCameraPos, wipeEntities } from "./render";
import { normalizeCoordinates2D } from './utils';


//Maximum coordinate for x and y so for 1000 inches we use 500 so minX = -500 and max is 500;

const WorkSpaceSize = 100;
//prune the data "centering" it.
//yes this is fairly slow but is only done one time on file load and
//is a big QOL change as scrolling around looking for where people
//positioned their drawing is annoying.
function handleDXF(fileString) { 
    const parser = new DxfParser();
    let xTotal = 0;
    let yTotal = 0;
    let vertCount = 0;
    try {
        const dxf = parser.parseSync(fileString);
        const entities = dxf.entities;
        wipeEntities();
        //LOOP AGAIN, SENDING TO RENDERER WITH THE CENTERED CAMERA POSITION
        for (let i=0; i < entities.length; i++) {
            let ent = entities[i];
            switch (ent.type) {
                case ("LWPOLYLINE"): {
                    for (let v of ent.vertices) {
                        const newXY = normalizeCoordinates2D(v.x, v.y, -WorkSpaceSize, WorkSpaceSize, -WorkSpaceSize, WorkSpaceSize);
                        v.x = newXY.x;
                        v.y = newXY.y;
                    }
                    addEntityToScene({
                        type: ent.type,
                        vertices: ent.vertices
                    })
                    break;
                }
                case ("ARC"): {
                    addEntityToScene({
                        type: ent.type,
                        startAngle: ent.startAngle,
                        endAngle: ent.endAngle,
                        radius: ent.radius,
                        center: normalizeCoordinates2D(ent.center)
                    });
                    break;
                }
                case ("LINE"): {
                    for (let v of ent.vertices) {
                        const newXY = normalizeCoordinates2D(v.x, v.y, -WorkSpaceSize, WorkSpaceSize, -WorkSpaceSize, WorkSpaceSize);
                        v.x = newXY.x;
                        v.y = newXY.y;
                    }
                    addEntityToScene({
                        type: ent.type,
                        vertices: ent.vertices});
                    break;
                }
                // case("CIRCLE"): {
                //     addEntityToScene({
                //         type: ent.type,
                //         vertices: ent.vertices});
                //     break;
                // }
            }
        }
    } catch(err) {
        return console.error(err.stack);
    }
    setCameraPos(xTotal / vertCount, yTotal / vertCount, 2);
}




export { handleDXF }