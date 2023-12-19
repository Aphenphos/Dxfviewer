import { DxfParser } from 'dxf-parser';
import { addEntityToScene, drawGrid, moveCamera, setCameraPos, wipeEntities } from "./render";
import { normalizeCoordinates2D, scaleVerts, WorkSpaceSize } from './utils';


//Maximum coordinate for x and y so for 1000 inches we use 500 so minX = -500 and max is 500;

//yes this is fairly slow but is only done one time on file load and
function handleDXF(fileString) { 
    const parser = new DxfParser();
    try {
        const dxf = parser.parseSync(fileString);
        const entities = dxf.entities;
        wipeEntities();
        //IMPLEMENT HANDLING OF CIRCLES REWRITE THIS SHIT FUNCTION! AND THE SHIT RENDERIN FUNCTION
        for (let i=0; i < entities.length; i++) {
            let ent = entities[i];
            switch (ent.type) {
                case ("LWPOLYLINE"): {
                    ent.vertices = scaleVerts(ent.vertices);
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
                    const scaledCenter = scaleVerts([{ center:ent.center, radius: ent.radius }]);
                    console.log("scaled",scaledCenter);
                    const normalCenter = normalizeCoordinates2D(scaledCenter.center.x, scaledCenter.center.y, -WorkSpaceSize, WorkSpaceSize, -WorkSpaceSize, WorkSpaceSize)
                    const entToScene = {
                        startAngle: ent.startAngle,
                        endAngle: ent.endAngle,
                        radius: scaledCenter.radius,
                        type: ent.type,
                        center: normalCenter
                    }
                    addEntityToScene(entToScene);
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
                default: break;
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
    setCameraPos(0,0,0);
}




export { handleDXF }