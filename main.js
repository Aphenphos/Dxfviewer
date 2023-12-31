import { initInputs } from "./src/input";
import { handleDXF } from "./src/parse";
import { initScene } from "./src/render";

initScene();
initInputs();
const inFile = document.getElementById("file-in");
inFile.addEventListener("change", handleFileChange, false);

function handleFileChange() {
  const currentFile = this.files[0];
  const fileReader = new FileReader();
  fileReader.readAsText(currentFile);
  fileReader.addEventListener("load", () => {
    handleFileLoad(fileReader.result);
  })
}

function handleFileLoad(fileString) {
    handleDXF(fileString);
}
