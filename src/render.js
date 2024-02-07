
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
export { addEntitiesToScene, initScene }