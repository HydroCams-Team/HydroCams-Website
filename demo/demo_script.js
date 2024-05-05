const canvas = document.getElementById("image-canvas");
const context = canvas.getContext("2d");
let image = new Image();
let isDrawing = false;
let isDrawingEnabled = false;
let startX, startY, currentX, currentY;
let selectedRectIndex = null;
const rectangles = [];
const padding = 5; // Padding for the text
let lineWidth = 4; // Variable for line width
let textSize = 16; // Variable for text size
const minSelectableSize = 1; // Minimum size of selectable rectangle
const tolerance = 5; // Tolerance zone around the rectangle

// Handle image upload
document.getElementById("upload-button").addEventListener("click", () => {
    document.getElementById("file-input").click();
});

document.getElementById("file-input").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            image.src = e.target.result;
            image.onload = function() {
                // Reset markers and selected index
                rectangles.length = 0;
                selectedRectIndex = null;

                // Clear canvas
                canvas.width = image.width;
                canvas.height = image.height;
                context.clearRect(0, 0, canvas.width, canvas.height);
                context.drawImage(image, 0, 0);

                // Set line width and text size based on image size
                const smallerDim = Math.min(image.width, image.height);
                lineWidth = Math.max(2, smallerDim / 100);
                textSize = Math.max(10, smallerDim / 25);

                drawAll();
            };
        };
        reader.readAsDataURL(file);
    }
});

// Download the edited image
document.getElementById("download-button").addEventListener("click", () => {
    drawAll();
    // Create a temporary link element
    const link = document.createElement("a");
    link.download = "edited-image.png"; // Set the download filename
    link.href = canvas.toDataURL();
    document.body.appendChild(link);
    link.click(); // Trigger the download
    document.body.removeChild(link); // Remove the link element
});

// Toggle drawing mode
const drawButton = document.getElementById("draw-button");
drawButton.addEventListener("click", () => {
    isDrawingEnabled = !isDrawingEnabled;
    drawButton.textContent = isDrawingEnabled ? "Disable Drawing" : "Enable Drawing";
    canvas.style.cursor = isDrawingEnabled ? "crosshair" : "pointer";
});

canvas.addEventListener("mousedown", (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (canvas.height / rect.height);

    if (isDrawingEnabled) {
        startX = x;
        startY = y;
        isDrawing = true;
    } else {
        // Check if a rectangle was clicked
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

document.getElementById("save-button").addEventListener("click", () => {
    if (isDrawingEnabled) {
        rectangles.push({
            x: startX,
            y: startY,
            width: currentX - startX,
            height: currentY - startY,
        });
        drawAll();
    }
});

// Delete the selected rectangle
document.getElementById("delete-button").addEventListener("click", () => {
    if (selectedRectIndex !== null) {
        rectangles.splice(selectedRectIndex, 1);
        selectedRectIndex = null;
        drawAll();
    }
});

function drawAll() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0);
    context.lineWidth = lineWidth;
    context.font = `${textSize}px Arial`;

    rectangles.forEach((rect, index) => {
        context.strokeStyle = index === selectedRectIndex ? "red" : "green";
        context.lineWidth = lineWidth;
        context.strokeRect(rect.x, rect.y, rect.width, rect.height);

        const text = `M${index + 1}`;
        const textWidth = context.measureText(text).width;
        const textHeight = textSize;

        // Draw black rectangle as background for text
        context.fillStyle = "black";
        context.fillRect(
            rect.x + rect.width + padding, 
            rect.y + rect.height - padding - textHeight, 
            textWidth + 4, // Small margin around the text
            textHeight + 4 // Small margin around the text
        );

        // Draw white text
        context.fillStyle = "white";
        context.fillText(text, rect.x + rect.width + padding + 2, rect.y + rect.height - padding - 2);
    });
}

function getClickedRectangle(x, y) {
    for (let i = 0; i < rectangles.length; i++) {
        const rect = rectangles[i];
        // Apply a tolerance zone around the rectangle
        const x1 = Math.min(rect.x, rect.x + rect.width) - tolerance;
        const x2 = Math.max(rect.x, rect.x + rect.width) + tolerance;
        const y1 = Math.min(rect.y, rect.y + rect.height) - tolerance;
        const y2 = Math.max(rect.y, rect.y + rect.height) + tolerance;
        if (x >= x1 && x <= x2 &&
            y >= y1 && y <= y2) {
            return i;
        }
    }
    return null;
}
