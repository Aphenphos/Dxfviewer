import { DxfParser } from 'dxf-parser';
import { addEntityToScene, moveCamera, setCameraPos, wipeEntities } from "./render";

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
        let minX = 0;
        let minY = 0;
        //Find Lowest X and Y values;
        for (let cnt=0; cnt < entities.length; cnt++) {
            let check = entities[cnt];
            switch (check.type) {
                case ("LWPOLYLINE"): {
                    for (let vert = 0; vert < check.vertices.len; vert++) {
                        const v = check.vertices[vert];
                        if (v.x < minX) minX = v.x;
                        if (v.y < minY) minY = v.y;
                    }
                    break;
                }
                case ("LINE"): {
                    for (const v of check.vertices) {
                        if (v.x < minX) minX = v.x;
                        if (v.y < minY) minY = v.y;                   
                    }
                    break;
                }
                case ("ARC"): {
                    if (check.center.x < minX) minX = check.center.x;
                    if (check.center.y < minY) minY = check.center.y;
                }
                break;
            }
        }
    //LOOP AGAIN AND OFFSET THEM ALL WHILE FINDING THE HIGHEST X Y.
        for (let cnt=0; cnt < entities.length; cnt++) {
            let check = entities[cnt];
            switch (check.type) {
                case ("LWPOLYLINE"):
                case ("LINE"):    
                    {
                    for (const vert of check.vertices) {
                        vert.x += minX + 1;
                        vert.y += minY + 1;
                        vertCount += 1;
                        xTotal += vert.x;
                        yTotal += vert.y;
                    }
                    break;
                }
                case ("ARC"):
                    check.center.x += minX + 1;
                    check.center.y += minY + 1;
                    vertCount += 1;
                    xTotal += check.center.x;
                    yTotal += check.center.y;
            }
        }
        //LOOP AGAIN, SENDING TO RENDERER WITH THE CENTERED CAMERA POSITION
        for (let i=0; i < entities.length; i++) {
            let ent = entities[i];
            switch (ent.type) {
                case ("LWPOLYLINE"): {
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
                        center: ent.center
                    });
                    break;
                }
                case ("LINE"): {
                    addEntityToScene({
                        type: ent.type,
                        vertices: ent.vertices});
                    break;
                }
                case("CIRCLE"): {
                    addEntityToScene({
                        type: ent.type,
                        vertices: ent.vertices});
                    break;
                }
            }
        }
    } catch(err) {
        return console.error(err.stack);
    }
    setCameraPos(xTotal / vertCount, yTotal / vertCount, 2);
}




export { handleDXF }