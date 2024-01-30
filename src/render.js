
import { MouseInput, Scene } from "./utils";
// import chars from "./raw/charsNormalised.json" assert {type: "json"};


function initScene() {
    window.addEventListener("resize", () => { Scene.update(true) }, false);
    Scene.update(true);
    MouseInput.init();
}

function addEntitiesToScene(ents) {
    Scene.wipeEntities();
    Scene.update(false);
    Scene.setEntities(ents);
    Scene.render();
    Scene.update(false);
}


// function drawString(string, pos, scale) {
//     let curOffset = new vec2d(0,0);
//     for (let i = 0; i < string.length; i++) {
//         curOffset.x+=scale * (2.5/scale)
//         drawCharacter(string[i], curOffset, scale);
//     }
// }
// function drawCharacter(char, offset, scale) {
//     //reparse the letters and normalise them so they are much easier to use.
//     const toDraw = chars[char]
//     for (let i = 0; i < toDraw.entities[0].vertices.length; i++) {
//         let j = i+ 1
//         if (j >= toDraw.entities[0].vertices.length) {
//             j = 0;
//         }
//         let p1 = new vec2d(toDraw.entities[0].vertices[i].x, toDraw.entities[0].vertices[i].y);
//         let p2 = new vec2d(toDraw.entities[0].vertices[j].x, toDraw.entities[0].vertices[j].y); 
//         p1.translate(offset);
//         p2.translate(offset);
//         p1.scale(scale)
//         p2.scale(scale);
//         p1.normalizeToWorld()
//         p2.normalizeToWorld();
//         drawLine(projectToScreen(p1), projectToScreen(p2));
//     }
//     if (toDraw.children != []) {
//         for (const child of toDraw.children) {
//             for (let i = 0; i < child.entities.length; i++) {
//                 for (let j = 0; j < child.entities[i].vertices.length; j++) {
//                     let k = j + 1;
//                     if (k >= child.entities[i].vertices.length) {
//                         k = 0;
//                     }
//                     let p1 = new vec2d(child.entities[i].vertices[j].x, child.entities[i].vertices[j].y);
//                     let p2 = new vec2d(child.entities[i].vertices[k].x, child.entities[i].vertices[k].y); 
//                     p1.translate(offset);
//                     p2.translate(offset);
//                     p1.scale(scale)
//                     p2.scale(scale);
//                     p1.normalizeToWorld();
//                     p2.normalizeToWorld();
//                     drawLine(projectToScreen(p1), projectToScreen(p2));
//                 }
//             }
//         }
//     }
// }

//will need to add function to re render all entities.

export { addEntitiesToScene, initScene }