let previewMinArea = null; // Store the minimum contour area for preview
let previewMaxArea = null; // Store the maximum contour area for preview

// Function to draw everything on the canvas
function drawAll() {
    // Clear the canvas before drawing
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Save the context state
    context.save();

    // Apply pan and zoom transformations
    context.setTransform(scale, 0, 0, scale, offsetX, offsetY);

    // Draw the transformed image as the background layer
    context.drawImage(image, 0, 0, image.width, image.height);

    // Adjust line and text sizes based on scale
    const effectiveLineWidth = Math.max(lineWidth / scale, 1); // Minimum 1px line width for visibility
    const effectiveTextSize = Math.max(textSize / scale, 8); // Minimum 8px font size for legibility

    // Draw the markers with contours first, so they appear below other elements
    drawMarkers(effectiveLineWidth, effectiveTextSize);

    // Draw the green horizontal zero axis line next
    drawZeroAxisLine(effectiveLineWidth);

    // Draw vertical lines from markers to the zero axis last
    drawVerticalLinesToZeroAxis(effectiveLineWidth, effectiveTextSize);

    // Draw preview circles for min and max contour areas
    if (previewMinArea !== null) {
        drawPreviewCircle(previewMinArea, 'yellow');
    }
    if (previewMaxArea !== null) {
        drawPreviewCircle(previewMaxArea, 'orange');
    }

    // Restore the context state
    context.restore();
}

// Function to draw a preview circle
function drawPreviewCircle(area, color) {
    const radius = getCircleRadiusFromArea(area); // Calculate the radius
    const centerX = image.width / 2; // Center of the canvas (adjust as needed)
    const centerY = image.height / 2;

    // Calculate dynamic line width based on image size
    const dynamicLineWidth = Math.max(Math.min(image.width, image.height) * 0.005, 2); // 0.5% of the smaller dimension, minimum 2px

    context.beginPath();
    context.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    context.strokeStyle = color;
    context.lineWidth = dynamicLineWidth / scale; // Adjust line width based on zoom
    context.stroke();
    context.closePath();
}

function rgbToHsv(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, v = max;

    const d = max - min;
    s = max === 0 ? 0 : d / max;

    if (max === min) {
        h = 0; // achromatic
    } else {
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return { h: (h * 360).toFixed(1), s: (s * 100).toFixed(1), v: (v * 100).toFixed(1) };
}


// Function to draw markers with labels
function drawMarkers(lineWidth, textSize) {
    rectangles.forEach((rect, index) => {
        // Get HSV color from an example pixel within the marker area
        const markerColorSample = context.getImageData(rect.x + rect.width / 2, rect.y + rect.height / 2, 1, 1).data;
        const [r, g, b] = markerColorSample;

        // Convert RGB to HSV
        const hsvColor = rgbToHsv(r, g, b);

        // Store HSV color in the marker object
        rect.hsvColor = hsvColor;
        context.strokeStyle = "blue";
        context.lineWidth = lineWidth;

        if (index === zeroPointIndex) {
            context.strokeStyle = "red";
            context.lineWidth = Math.max(4 / scale, 2); // Minimum width to keep it highlighted
        } else if (index === selectedRectIndex) {
            context.strokeStyle = "green";
            context.lineWidth = Math.max(3 / scale, 1.5);
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
            context.strokeRect(rect.x, rect.y, rect.width, rect.height);
        }

        // Draw the label for each marker
        const label = `M${index + 1}`;
        const labelX = rect.x + padding;
        const labelY = rect.y - padding - textSize;

        context.font = `${textSize}px Arial`;
        const labelWidth = context.measureText(label).width;

        // Draw the black background for the label
        context.fillStyle = "black";
        context.fillRect(labelX - 2, labelY - textSize - 2, labelWidth + 4, textSize + 4);

        // Draw the marker label text in white
        context.fillStyle = "white";
        context.fillText(label, labelX, labelY);
    });
}

// Function to draw the green horizontal zero axis line
function drawZeroAxisLine(lineWidth) {
    if (zeroPointIndex !== null) {
        const zeroMarker = rectangles[zeroPointIndex];
        const zeroY = zeroMarker.y + zeroMarker.height / 2;

        context.beginPath();
        context.moveTo(0, zeroY);
        context.lineTo(image.width, zeroY);
        context.strokeStyle = 'green';
        context.lineWidth = lineWidth;
        context.stroke();
    }
}

// Function to draw vertical lines from markers to the zero axis
function drawVerticalLinesToZeroAxis(lineWidth, textSize) {
    if (zeroPointIndex !== null && zeroPointDimension !== null) {
        const zeroMarker = rectangles[zeroPointIndex];
        const zeroY = zeroMarker.y + zeroMarker.height / 2;

        rectangles.forEach((marker, index) => {
            if (index !== zeroPointIndex) {
                const markerXCenter = marker.x + marker.width / 2;
                const markerY = marker.y + marker.height / 2;

                // Draw vertical line from marker to the zero axis
                context.beginPath();
                context.moveTo(markerXCenter, markerY);
                context.lineTo(markerXCenter, zeroY);
                context.strokeStyle = 'yellow';
                context.lineWidth = lineWidth;
                context.stroke();

                // Label the line with the vertical distance
                const distanceObj = distances.find(d => d.marker2 === index + 1);
                if (distanceObj) {
                    const distanceText = `${distanceObj.distance_inches.toFixed(2)}"`;
                    const midX = markerXCenter + (5 / scale);
                    const midY = (markerY + zeroY) / 2;

                    // Set font size for the text
                    context.font = `${textSize}px Arial`;
                    const textWidth = context.measureText(distanceText).width;
                    const textHeight = textSize;

                    // Draw a translucent black rectangle as the background
                    context.fillStyle = "rgba(0, 0, 0, 0.7)"; // 70% opacity
                    context.fillRect(midX - 2, midY - textHeight, textWidth + 4, textHeight + 4);

                    // Draw the measurement text in yellow on top of the rectangle
                    context.fillStyle = 'yellow';
                    context.fillText(distanceText, midX, midY);
                }
            }
        });
    }
}

