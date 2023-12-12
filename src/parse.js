import { DxfParser } from 'dxf-parser';
import { drawArcFromBulge, drawLine, drawPoint } from "./render";
import { sleep } from './utils';

function handleDXF(fileString) { 
    const parser = new DxfParser();
    try {
        const dxf = parser.parseSync(fileString);
        const entities = dxf.entities;
        for (let i=0; i < entities.length; i++) {
            console.log(entities[i]);
            handleEntity(entities[i]);
        }
    } catch(err) {
        return console.error(err.stack);
    }
    
}


function handleEntity(ent) {
    switch (ent.type) {
        case ("LWPOLYLINE"): {
            handleLWPolyLine(ent.vertices);
        }
    }
}

function handleLWPolyLine(lwPolyLine) {
    for (let i = 0; i < lwPolyLine.length; i++) {
    let j = i+1
    if (j >= lwPolyLine.length) {
        j=0;
    }
    drawPoint(lwPolyLine[i]);
    if (lwPolyLine[i].bulge) {
        drawArcFromBulge(lwPolyLine[i], lwPolyLine[j]);
    } else {
        drawLine(lwPolyLine[i], lwPolyLine[j]);
    }
}
}

function handleArc(arc) {

}

function handleLine(line) {

}

function handleCircle() {
    
}

export {handleDXF}