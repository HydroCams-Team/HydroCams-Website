// draw.js

// Function to draw everything on the canvas
function drawAll() {
    // Clear the canvas and reset transformation
    context.setTransform(scale, 0, 0, scale, offsetX, offsetY);
    context.clearRect(0, 0, canvas.width / scale, canvas.height / scale);
    context.drawImage(image, offsetX, offsetY, image.width * scale, image.height * scale);

    context.lineWidth = lineWidth / scale; // Adjust line width according to scale
    context.font = `${textSize / scale}px Arial`; // Adjust text size according to scale

    lines.length = 0; // Clear previous line data

    // Draw lines between markers and label them with their length
    for (let i = 0; i < rectangles.length; i++) {
        for (let j = i + 1; j < rectangles.length; j++) {
            const marker1 = rectangles[i];
            const marker2 = rectangles[j];

            // Draw a thicker green line between the markers
            context.beginPath();
            context.moveTo(marker1.x * scale + offsetX, marker1.y * scale + offsetY);
            context.lineTo(marker2.x * scale + offsetX, marker2.y * scale + offsetY);
            context.strokeStyle = 'green';
            context.lineWidth = 8 / scale; // Adjust line width for visibility while zoomed
            context.stroke();

            // Calculate the distance between the markers
            const distance = Math.sqrt(
                Math.pow(marker2.x - marker1.x, 2) + Math.pow(marker2.y - marker1.y, 2)
            );

            // Label the line with the distance (small green text without background)
            const midX = (marker1.x + marker2.x) / 2 * scale + offsetX;
            const midY = (marker1.y + marker2.y) / 2 * scale + offsetY;
            context.font = '10px Arial'; // Set smaller font for distance label
            context.fillStyle = 'green';
            context.fillText(`${distance.toFixed(1)} px`, midX, midY);

            // Store line data for click handling
            lines.push({
                marker1: `M${i + 1}`,
                marker2: `M${j + 1}`,
                distance: distance.toFixed(1),
                startX: marker1.x,
                startY: marker1.y,
                endX: marker2.x,
                endY: marker2.y
            });
        }
    }

    // Draw the markers with labels
    rectangles.forEach((rect, index) => {
        context.strokeStyle = index === selectedRectIndex ? "red" : "green";
        context.lineWidth = lineWidth;

        // Draw the contour or the bounding rectangle of the marker
        context.beginPath();
        const contour = rect.contour;

        if (contour && contour.length > 0) {
            context.moveTo(contour[0][0] * scale + offsetX, contour[0][1] * scale + offsetY);
            contour.forEach(point => {
                context.lineTo(point[0] * scale + offsetX, point[1] * scale + offsetY);
            });
            context.closePath();
        } else {
            context.strokeRect(
                rect.x * scale + offsetX,
                rect.y * scale + offsetY,
                rect.width * scale,
                rect.height * scale
            );
        }
        context.stroke();

        // Draw the label for each marker (e.g., "M1", "M2", etc.)
        const label = `M${index + 1}`;
        const labelX = rect.x * scale + offsetX + padding;
        const labelY = rect.y * scale + offsetY - padding - textSize;

        // Set the font before measuring the text
        context.font = `${textSize}px Arial`;

        // Measure the text width after setting the font
        const labelWidth = context.measureText(label).width;

        // Draw the black background for the label using the measured width
        context.fillStyle = "black";
        context.fillRect(labelX - 2, labelY - textSize - 2, labelWidth + 4, textSize + 4);

        // Draw the marker label text in white
        context.fillStyle = "white";
        context.fillText(label, labelX, labelY);
    });
}
