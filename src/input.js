import { mouseInput, clamp } from "./utils";

let MouseInputs;
let gridEnabled = false;
//this works but need to implement actual renderer;
function initInputs() {
    MouseInputs = new mouseInput();
}

document.addEventListener("mousedown", handleMouseDown);
document.addEventListener("mouseup", handleMouseUp);
document.addEventListener("mousemove", mouseActive);
document.addEventListener("wheel", (e) => {
    if (e.deltaY > 0) {
        handleScrollDown(e)
    } else {
        handleScrollUp(e)
    }
});
const gridToggle = document.getElementById("toggle-grid");
gridToggle.addEventListener("change",() => {
    gridEnabled = !gridEnabled;
    moveCamera(undefined,undefined,undefined);
})

function handleMouseDown(down) {
    MouseInputs.active = true;

    MouseInputs.initialPosition.x = down.clientX;
    MouseInputs.initialPosition.y = down.clientY;
}

function clientCoordsToWorldSpaceCoords(clientXY) {
    
}

function handleScrollDown(e) {
    moveCamera(undefined, undefined, -.01);
}
function handleScrollUp(e) {
    moveCamera(undefined, undefined, .01);
}

function handleMouseUp(up) {
    MouseInputs.active = false
    MouseInputs.initialPosition.x = 0;
    MouseInputs.initialPosition.y = 0; 
}

function mouseActive(event) {
    if (MouseInputs.active === true) {
        let deltaX = (MouseInputs.initialPosition.x - event.clientX);
        let deltaY = (MouseInputs.initialPosition.y - event.clientY);
        const camPos = getCameraPos();
        const scalar = clamp(.0001 / (camPos.z), .00001, .005)
        moveCamera(deltaX * scalar, deltaY * scalar, 0);
        MouseInputs.initialPosition.x = event.clientX;
        MouseInputs.initialPosition.y = event.clientY;
        setTimeout(null, 17);
    }
}

export { initInputs, gridEnabled }