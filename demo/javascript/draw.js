// draw.js

// Function to draw everything on the canvas
function drawAll() {
    // clear the canvas before anything
    context.clearRect(0, 0, canvas.width, canvas.height);

    // save the context state
    context.save()

    // apply pan and zoom transformations
    context.setTransform(scale, 0, 0, scale, offsetX, offsetY);

    // draw the transformed image
    context.drawImage(image, 0, 0, image.width, image.height);

    // adjust lines and text with scale
    context.lineWidth = lineWidth / scale;
    context.font = `${textSize / scale}px Arial`;

    // clear line data
    lines.length = 0;

    // Draw lines between markers and label them with their length
    for (let i = 0; i < rectangles.length; i++) {
        for (let j = i + 1; j < rectangles.length; j++) {
            const marker1 = rectangles[i];
            const marker2 = rectangles[j];

            // Draw a thicker green line between the markers
            context.beginPath();
            context.moveTo(marker1.x, marker1.y);
            context.lineTo(marker2.x, marker2.y);
            context.strokeStyle = 'green';
            context.lineWidth = 8 / scale; // Adjust line width for visibility while zoomed
            context.stroke();

            // Calculate the distance between the markers
            const distance = Math.sqrt(
                Math.pow(marker2.x - marker1.x, 2) + Math.pow(marker2.y - marker1.y, 2)
            );

            // Label the line with the distance (small green text without background)
            const midX = (marker1.x + marker2.x) / 2;
            const midY = (marker1.y + marker2.y) / 2;
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
        const contour = rect.contour;

        if (contour && contour.length > 0) {
            context.beginPath();
            context.moveTo(contour[0][0], contour[0][1]);
            contour.forEach(point => {
                context.lineTo(point[0], point[1]);
            });
            context.closePath();
        } else {
            context.strokeRect(
                rect.x,
                rect.y,
                rect.width * scale,
                rect.height * scale
            );
        }
        context.stroke();

        // Draw the label for each marker (e.g., "M1", "M2", etc.)
        const label = `M${index + 1}`;
        const labelX = rect.x + padding;
        const labelY = rect.y - padding - textSize;

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

    context.restore();
}

