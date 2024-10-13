// canvasInteractions.js

// Canvas event listeners
canvas.addEventListener("mousedown", (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (canvas.height / rect.height);

    if (isDrawingEnabled) {
        startX = x;
        startY = y;
        isDrawing = true;
    } else {
        const clickedRectIndex = getClickedRectangle(x, y);
        if (clickedRectIndex !== null) {
            selectedRectIndex = clickedRectIndex;
            drawAll();
        } else {
            selectedRectIndex = null;
            drawAll();
        }
    }
});

canvas.addEventListener("mousemove", (event) => {
    if (isDrawingEnabled && isDrawing) {
        const rect = canvas.getBoundingClientRect();
        currentX = (event.clientX - rect.left) * (canvas.width / rect.width);
        currentY = (event.clientY - rect.top) * (canvas.height / rect.height);
        drawAll();
        context.strokeStyle = "orange";
        context.lineWidth = lineWidth;
        context.strokeRect(startX, startY, currentX - startX, currentY - startY);
    }
});

canvas.addEventListener("mouseup", () => {
    if (isDrawingEnabled) {
        isDrawing = false;
    }
});

// Zooming and panning
canvas.addEventListener('wheel', function (event) {
    event.preventDefault(); // Prevent default scroll behavior

    const mouseX = (event.offsetX - offsetX) / scale;
    const mouseY = (event.offsetY - offsetY) / scale;

    // Calculate the new scale value based on the mouse wheel delta
    const delta = event.deltaY > 0 ? -zoomSpeed : zoomSpeed;
    const newScale = scale + delta;

    // Restrict the zoom level to avoid over-zooming
    if (newScale >= 0.5 && newScale <= 3) { // Allow zoom between 0.5x and 3x
        // Update the scale
        scale = newScale;

        // Adjust the offsets to keep the zoom centered at the cursor position
        offsetX -= mouseX * delta;
        offsetY -= mouseY * delta;

        drawAll(); // Redraw the canvas with the updated zoom
    }
});

// Panning with mouse drag
canvas.addEventListener('mousedown', (event) => {
    isPanning = true;
    startPanX = event.clientX - offsetX;
    startPanY = event.clientY - offsetY;
});

canvas.addEventListener('mousemove', (event) => {
    if (isPanning) {
        offsetX = event.clientX - startPanX;
        offsetY = event.clientY - startPanY;
        drawAll(); // Redraw the canvas with the updated offset
    }
});

canvas.addEventListener('mouseup', () => {
    isPanning = false;
});

canvas.addEventListener('mouseleave', () => {
    isPanning = false;
});

// Delete selected marker
document.getElementById("delete-button").addEventListener("click", () => {
    if (selectedRectIndex !== null) {
        rectangles.splice(selectedRectIndex, 1);
        selectedRectIndex = null;
        drawAll();
        updateMarkerInfo(); // Refresh marker and distance lists
    }
});

// Display marker details on click
canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (canvas.height / rect.height);

    const clickedRectIndex = getClickedRectangle(x, y);
    if (clickedRectIndex !== null) {
        selectedRectIndex = clickedRectIndex;
        updateMarkerDetails(selectedRectIndex); // Use the new function to update marker details
        drawAll(); // Redraw the canvas
    } else {
        selectedRectIndex = null;
        document.getElementById("marker-details").innerHTML = "<p>No marker selected</p>";
    }
});

// Click event to display distance info
canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (canvas.height / rect.height);

    let clickedLine = null;
    for (const line of lines) {
        const distanceToLine = pointToLineDistance(x, y, line.startX, line.startY, line.endX, line.endY);
        if (distanceToLine < 5) { // Allow a small margin of error for clicking
            clickedLine = line;
            break;
        }
    }

    if (clickedLine) {
        alert(`Line between ${clickedLine.marker1} and ${clickedLine.marker2}\nDistance: ${clickedLine.distance} px`);
    }
});
