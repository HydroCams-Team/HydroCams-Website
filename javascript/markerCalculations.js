// markerCalculations.js

// Update marker and distance lists
function updateMarkerInfo(distancesFromServer = null) {
    let distances;
    if (distancesFromServer) {
        distances = distancesFromServer;
    } else {
        distances = recalculateDistances(); // Recalculate distances after marker update
    }
    updateMarkerList(); // Update the markers only
    updateDistanceList(distances); // Update the distances only
}

// Function to update the marker list
function updateMarkerList() {
    const markerList = document.getElementById('marker-list');
    markerList.innerHTML = ''; // Clear the existing marker list content

    // Populate marker list with clickable divs
    rectangles.forEach((marker, index) => {
        const markerDiv = document.createElement('div');
        markerDiv.classList.add('clickable-div'); // Add class for styling

        // Ensure marker information is properly displayed with the correct index
        markerDiv.textContent = `M${index + 1} (X: ${marker.x ? marker.x.toFixed(0) : 'N/A'}, Y: ${marker.y ? marker.y.toFixed(0) : 'N/A'})`;
        markerDiv.addEventListener('click', () => highlightMarker(index));
        markerList.appendChild(markerDiv);
    });

    // Ensure the marker info container is visible
    document.getElementById('marker-info-container').style.display = 'block';
}

// Function to update the distance list
function updateDistanceList(distances = []) {
    const distanceList = document.getElementById('distance-list');
    distanceList.innerHTML = ''; // Clear the existing distance list content

    // Populate distance list with clickable divs
    distances.forEach((distance) => {
        const distanceDiv = document.createElement('div');
        distanceDiv.classList.add('clickable-div'); // Add class for styling
        distanceDiv.innerHTML = `M${distance.marker1} - M${distance.marker2}: ${distance.distance_inches.toFixed(2)} inches`;
        distanceDiv.addEventListener('click', () => highlightLine(distance));
        distanceList.appendChild(distanceDiv);
    });
}

// Function to recalculate distances between markers using scale factor
function recalculateDistances() {
    const distances = [];
    if (rectangles.length < 2) {
        return distances;
    }

    // Compute average marker diameter in pixels
    const marker_diameter_in_pixels = rectangles.reduce((sum, marker) => sum + marker.width, 0) / rectangles.length;
    const marker_diameter_in_inches = parseFloat(document.getElementById('markerSize').value) || 5; // Default to 5 inches if not set

    // Calculate scale factor (inches per pixel)
    const scale_factor = marker_diameter_in_inches / marker_diameter_in_pixels;
    console.log(`Marker diameter in pixels: ${marker_diameter_in_pixels}, scale factor: ${scale_factor} inches per pixel`);

    for (let i = 0; i < rectangles.length; i++) {
        for (let j = i + 1; j < rectangles.length; j++) {
            const marker1 = rectangles[i];
            const marker2 = rectangles[j];
            const pixel_distance = Math.sqrt(
                Math.pow(marker2.x - marker1.x, 2) + Math.pow(marker2.y - marker1.y, 2)
            );
            const distance_inches = pixel_distance * scale_factor;

            distances.push({
                marker1: i + 1,
                marker2: j + 1,
                distance_inches: distance_inches
            });
        }
    }
    return distances;
}

// Function to highlight a specific marker on the canvas
function highlightMarker(index) {
    selectedRectIndex = index; // Set the selected marker index
    drawAll(); // Redraw the canvas to highlight the selected marker

    const clickedRect = rectangles[selectedRectIndex];
    const area = clickedRect.width * clickedRect.height;

    // Update the marker details section with the clicked marker's details
    document.getElementById("marker-details").innerHTML = `
        <p>Marker ${selectedRectIndex + 1} Details:</p>
        <p>X: ${clickedRect.x}px</p>
        <p>Y: ${clickedRect.y}px</p>
        <p>Width: ${clickedRect.width}px</p>
        <p>Height: ${clickedRect.height}px</p>
        <p>Area: ${area}px²</p>
    `;
}

// Function to highlight a specific line between markers on the canvas
function highlightLine(distance) {
    const { marker1, marker2 } = distance;
    selectedRectIndex = null; // Deselect any previously selected marker
    drawAll();

    // Highlight the line by drawing it again in a different color or thickness
    const marker1Position = rectangles[marker1 - 1];
    const marker2Position = rectangles[marker2 - 1];
    context.beginPath();
    context.moveTo(marker1Position.x * scale + offsetX, marker1Position.y * scale + offsetY);
    context.lineTo(marker2Position.x * scale + offsetX, marker2Position.y * scale + offsetY);
    context.strokeStyle = 'red'; // Highlight the line in red
    context.lineWidth = 12; // Make the line thicker
    context.stroke();
}
