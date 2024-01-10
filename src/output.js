function downloadFile(data, filename, type) {
    // Create a blob of the data
    let blob = new Blob([data], {type: type});

    // Create a link element
    let url = window.URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = filename;

    // Append the link to the body (Firefox requires this to be added to the DOM before it can be clicked)
    document.body.appendChild(a);
    a.click();
    a.remove();
}

function stringifySet(set) {
    let obj = {};
    for (let item of set) {
        obj[item.name] = item;
    }
    return JSON.stringify(obj);
}
export {downloadFile, stringifySet }