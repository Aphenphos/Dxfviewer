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
    console.log("scroll");
    if (e.deltaY > 0) {
        handleScrollDown(e)
    } else {
        handleScrollUp(e)
    }
});

function handleMouseDown(down) {
    MouseInputs.active = true;
    MouseInputs.initialPosition.x = down.clientX;
    MouseInputs.initialPosition.y = down.clientY;
}

function handleScrollDown(e) {
    const cam = getCameraPos();
    const newZ = cam.z + e.deltaY * .001;
    const mouseXWorld = (e.clientX - cam.x) / cam.z;
    const mouseYWorld = (e.clientY - cam.y) / cam.z;

    setCameraPos(cam.x - (mouseXWorld * newZ - mouseXWorld * cam.z), cam.y - (mouseYWorld * newZ - mouseYWorld * cam.z), newZ);
}
function handleScrollUp(e) {
    const cam = getCameraPos();
    const newZ = cam.z + e.deltaY * .001;
    const mouseXWorld = (e.clientX - cam.x) / cam.z;
    const mouseYWorld = (e.clientY - cam.y) / cam.z;

    setCameraPos(cam.x - (mouseXWorld * newZ - mouseXWorld * cam.z), cam.y - (mouseYWorld * newZ - mouseYWorld * cam.z), newZ);
}

function handleMouseUp(up) {
    MouseInputs.active = false
    MouseInputs.initialPosition.x = 0;
    MouseInputs.initialPosition.y = 0; 
}

function mouseActive(event) {
    if (MouseInputs.active == true) {
        const deltaX = (event.clientX - MouseInputs.initialPosition.x);
        const deltaY = (event.clientY - MouseInputs.initialPosition.y );
        moveCamera(deltaX * .7, deltaY * .7, 0);
        MouseInputs.initialPosition.x = event.clientX;
        MouseInputs.initialPosition.y = event.clientY;
        setTimeout(null, 17);
    }
}

export { initInputs }