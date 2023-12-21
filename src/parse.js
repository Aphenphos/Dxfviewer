import { DxfParser } from 'dxf-parser';
import { addEntityToScene, moveCamera, setCameraPos, wipeEntities } from "./render";
import { arcToArcWithBulge, normalize2DCoordinatesToScreen, normalizeCoordinates2D, scaleVert, scaleVerts, WorkSpaceSize } from './utils';


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
                    const verts = []
                    for (let v of ent.vertices) {
                        let newV = normalize2DCoordinatesToScreen(v);
                        newV = scaleVert(newV);
                        if (v.bulge) {
                            newV.bulge = v.bulge;
                        }
                        verts.push(newV);
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
    moveCamera(undefined,undefined,undefined);
}




export { handleDXF }