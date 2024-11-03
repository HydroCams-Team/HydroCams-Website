// draw.js

// Function to draw everything on the canvas
function drawAll() {
    // Clear the canvas before drawing
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Save the context state
    context.save();

    // Apply pan and zoom transformations
    context.setTransform(scale, 0, 0, scale, offsetX, offsetY);

    // Draw the transformed image
    context.drawImage(image, 0, 0, image.width, image.height);

    // Adjust lines and text with scale
    context.lineWidth = lineWidth / scale;
    context.font = `${textSize / scale}px Arial`;

    // Clear line data
    lines.length = 0;

    // **Draw the green horizontal zero axis line**
    if (zeroPointIndex !== null) {
        const zeroMarker = rectangles[zeroPointIndex];
        const zeroY = zeroMarker.y + zeroMarker.height / 2; // Y-coordinate of the zero point marker center

        // Determine the line's start and end X-coordinates
        let minX = 0;
        let maxX = image.width;

        // Optionally, limit the line to the markers' horizontal extent
        /*
        const markerXs = rectangles.map(rect => rect.x + rect.width / 2);
        minX = Math.min(...markerXs) - 50; // Add some padding if desired
        maxX = Math.max(...markerXs) + 50;
        */

        // Draw the horizontal line
        context.beginPath();
        context.moveTo(minX, zeroY);
        context.lineTo(maxX, zeroY);
        context.strokeStyle = 'green';
        context.lineWidth = 2 / scale;
        context.stroke();
    }

    // **Draw vertical lines from markers to the zero axis**
    if (zeroPointIndex !== null && zeroPointDimension !== null) {
        const zeroMarker = rectangles[zeroPointIndex];
        const zeroY = zeroMarker.y + zeroMarker.height / 2; // Center Y-coordinate of zero point

        rectangles.forEach((marker, index) => {
            if (index !== zeroPointIndex) {
                const markerXCenter = marker.x + marker.width / 2;
                const markerY = marker.y + marker.height / 2; // Center Y-coordinate of marker

                // Draw vertical line from marker to the zero axis
                context.beginPath();
                context.moveTo(markerXCenter, markerY);
                context.lineTo(markerXCenter, zeroY);
                context.strokeStyle = 'yellow';
                context.lineWidth = 2 / scale;
                context.stroke();

                // Label the line with the vertical distance
                const distanceObj = distances.find(d => d.marker2 === index + 1);
                if (distanceObj) {
                    const midX = markerXCenter + (5 / scale);
                    const midY = (markerY + zeroY) / 2;
                    context.font = `${10 / scale}px Arial`;
                    context.fillStyle = 'yellow';
                    context.fillText(`${distanceObj.distance_inches.toFixed(2)} in`, midX, midY);
                }
            }
        });
    }

    // Draw the markers with labels
    rectangles.forEach((rect, index) => {
        // Set default stroke style and line width
        context.strokeStyle = "blue";
        context.lineWidth = 2 / scale;

        if (index === zeroPointIndex) {
            // Highlight zero point marker
            context.strokeStyle = "red";
            context.lineWidth = 4 / scale;
        } else if (index === selectedRectIndex) {
            // Highlight selected marker
            context.strokeStyle = "green";
            context.lineWidth = 3 / scale;
        }

        // Draw the contour or bounding rectangle of the marker
        const contour = rect.contour;

        if (contour && contour.length > 0) {
            context.beginPath();
            context.moveTo(contour[0][0], contour[0][1]);
            contour.forEach(point => {
                context.lineTo(point[0], point[1]);
            });
            context.closePath();
            context.stroke();
        } else {
            context.strokeRect(
                rect.x,
                rect.y,
                rect.width,
                rect.height
            );
        }

        // Calculate and label real-world dimensions if zero point is set
        if (zeroPointIndex !== null && zeroPointDimension !== null) {
            // (Measurement-related code can be included here if needed)
        }

        // Draw the label for each marker
        const label = `M${index + 1}`;
        const labelX = rect.x + padding;
        const labelY = rect.y - padding - textSize;

        // Set the font before measuring the text
        context.font = `${textSize / scale}px Arial`;

        // Measure the text width after setting the font
        const labelWidth = context.measureText(label).width;

        // Draw the black background for the label
        context.fillStyle = "black";
        context.fillRect(labelX - 2, labelY - textSize - 2, labelWidth + 4, textSize + 4);

        // Draw the marker label text in white
        context.fillStyle = "white";
        context.fillText(label, labelX, labelY);
    });

    // Restore the context state
    context.restore();
}
