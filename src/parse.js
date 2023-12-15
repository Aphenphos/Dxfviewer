import { DxfParser } from 'dxf-parser';
import { addEntityToScene, moveCamera, setCameraPos, wipeEntities } from "./render";
import { normalizeCoordinates2D, scaleVerts } from './utils';


//Maximum coordinate for x and y so for 1000 inches we use 500 so minX = -500 and max is 500;

const WorkSpaceSize = 100;
//prune the data "centering" it.
//yes this is fairly slow but is only done one time on file load and
//is a big QOL change as scrolling around looking for where people
//positioned their drawing is annoying.
function handleDXF(fileString) { 
    const parser = new DxfParser();
    try {
        const dxf = parser.parseSync(fileString);
        const entities = dxf.entities;
        wipeEntities();
        //IMPLEMENT HANDLING OF CIRCLES REWRITE THIS SHIT FUNCTION! AND THE SHIT RENDERIN FUNCTION
        for (let i=0; i < entities.length; i++) {
            let ent = entities[i];
            console.log(ent);
            ent.vertices = scaleVerts(ent.vertices);
            switch (ent.type) {
                case ("LWPOLYLINE"): {
                    const verts = []
                    for (let v of ent.vertices) {
                        const newV = normalizeCoordinates2D(v.x, v.y, -WorkSpaceSize, WorkSpaceSize, -WorkSpaceSize, WorkSpaceSize);
                        newV.bulge = v.bulge;
                        verts.push(newV);
                    }
                    addEntityToScene({
                        type: ent.type,
                        vertices: verts
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
                    const verts = [];
                    for (let v of ent.vertices) {
                        const newV = normalizeCoordinates2D(v.x, v.y, -WorkSpaceSize, WorkSpaceSize, -WorkSpaceSize, WorkSpaceSize);
                        verts.push(newV);
                    }
                    addEntityToScene({
                        type: ent.type,
                        vertices: verts
                    });
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
    setCameraPos(0,0,-1);
}




export { handleDXF }