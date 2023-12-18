import { getCameraPos, moveCamera, setCameraPos } from "./render";
import { mouseInput } from "./utils";

let MouseInputs;
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


function handleMouseDown(down) {
    MouseInputs.active = true;
    MouseInputs.initialPosition.x = down.clientX;
    MouseInputs.initialPosition.y = down.clientY;
}

function handleScrollDown(e) {
    moveCamera(undefined, undefined, -.1);
}
function handleScrollUp(e) {
    moveCamera(undefined, undefined, .1);
}

function handleMouseUp(up) {
    MouseInputs.active = false
    MouseInputs.initialPosition.x = 0;
    MouseInputs.initialPosition.y = 0; 
}

function mouseActive(event) {
    if (MouseInputs.active == true) {
        let deltaX = (MouseInputs.initialPosition.x - event.clientX);
        let deltaY = (MouseInputs.initialPosition.y - event.clientY);
        const camPos = getCameraPos();
        if (camPos.z < 0) {
            deltaX = -deltaX;
            deltaY = -deltaY;
        }
        const scalar = (camPos.z + .01) / 1000
        moveCamera(deltaX * scalar, deltaY * scalar, 0);
        MouseInputs.initialPosition.x = event.clientX;
        MouseInputs.initialPosition.y = event.clientY;
        setTimeout(null, 17);
    }
}

export { initInputs }