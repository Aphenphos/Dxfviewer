import { DxfParser } from 'dxf-parser';
import { addEntityToScene, renderEntities, setCameraPos, wipeEntities } from "./render";

//prune the data "centering" it.
//yes this is fairly slow but is only done one time on file load and
//is a big QOL change as scrolling around looking for where people
//positioned their drawing is annoying.
function handleDXF(fileString) { 
    const parser = new DxfParser();
    let highestX = 0;
    let highestY = 0;
    try {
        const dxf = parser.parseSync(fileString);
        const entities = dxf.entities;
        wipeEntities();
        let vertCount = 0;
        let minX = 0;
        let minY = 0;
        //Find Lowest X and Y values;
        for (let cnt=0; cnt < entities.length; cnt++) {
            let check = entities[cnt];
            switch (check.type) {
                case ("LWPOLYLINE"): {
                    for (let vert = 0; vert < check.vertices.len; vert++) {
                        vertCount++;
                        const v = check.vertices[vert];
                        if (v.x < minX) minX = v.x;
                        if (v.y < minY) minY = v.y;
                    }
                    break;
                }
                case ("LINE"): {
                    vertCount++;
                    for (const v of check.vertices) {
                        if (v.x < minX) minX = v.x;
                        if (v.y < minY) minY = v.y;                   
                    }
                    break;
                }
                case ("ARC"): {
                    vertCount++;
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
                        if (vert.x > highestX) highestX = vert.x;
                        if (vert.y > highestY) highestY = vert.y;
                    }
                    break;
                }
                case ("ARC"):
                    check.center.x += minX + 1;
                    check.center.y += minY + 1;
                    if (check.center.x > highestX) highestX = check.center.x;
                    if (check.center.y > highestY) highestY = check.center.y;
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
    setCameraPos(highestX * .5, highestY * .5, -1);
    renderEntities();
}




export { handleDXF }