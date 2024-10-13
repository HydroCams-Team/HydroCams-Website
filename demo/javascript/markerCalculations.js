// markerCalculations.js
var distances = [];  // Global array to store distances between markers

// Update marker and distance lists
function updateMarkerInfo() {
    console.log("Rectangles (markers):", rectangles); // Log current markers
    distances = recalculateDistances(); // Recalculate distances after marker update
    console.log("Recalculated distances:", distances);

    if (!distances || distances.length === 0) {
        console.log("No distances available to update.");
    }

    updateMarkerList(); // Update the markers
    updateDistanceList(distances); // Update the distances
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
        if (distance.marker1 !== undefined && distance.marker2 !== undefined && !isNaN(distance.distance_inches)) {
            const distanceDiv = document.createElement('div');
            distanceDiv.classList.add('clickable-div'); // Add class for styling
            distanceDiv.innerHTML = `M${distance.marker1} - M${distance.marker2}: ${distance.distance_inches.toFixed(2)} inches`;
            distanceDiv.addEventListener('click', () => highlightLine(distance));
            distanceList.appendChild(distanceDiv);
        } else {
            console.error("Error in distance object:", distance);  // Log any undefined or incorrect distance objects
        }
    });
}

// Function to recalculate distances between markers
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
            const marker1 = i + 1;  // Set marker1 to the index+1
            const marker2 = j + 1;  // Set marker2 to the index+1
            const marker1Position = rectangles[i];
            const marker2Position = rectangles[j];
            const pixel_distance = Math.sqrt(
                Math.pow(marker2Position.x - marker1Position.x, 2) + Math.pow(marker2Position.y - marker1Position.y, 2)
            );
            if (pixel_distance === 0) {
                console.warn(`Markers ${i + 1} and ${j + 1} are overlapping!`);
            }
            const distance_inches = pixel_distance * scale_factor;

            distances.push({
                marker1,  // Add correct marker indices
                marker2,  // Add correct marker indices
                distance_inches
            });

            // Log the distance calculation to ensure it's working
            console.log(`Marker ${marker1} to Marker ${marker2}: ${distance_inches.toFixed(2)} inches`);
        }
    }
    return distances;
}

// Function to highlight a specific marker on the canvas
function highlightMarker(index) {
    selectedRectIndex = index; // Set the selected marker index
    drawAll(); // Redraw the canvas to highlight the selected marker

    const clickedRect = rectangles[selectedRectIndex];
    const area_pixels = clickedRect.width * clickedRect.height;

    // Compute scale factor (inches per pixel)
    const marker_diameter_in_pixels = rectangles.reduce((sum, marker) => sum + marker.width, 0) / rectangles.length;
    const marker_diameter_in_inches = parseFloat(document.getElementById('markerSize').value) || 5; // Default to 5 inches if not set
    const scale_factor = marker_diameter_in_inches / marker_diameter_in_pixels;

    // Convert measurements to inches
    const width_inches = clickedRect.width * scale_factor;
    const height_inches = clickedRect.height * scale_factor;
    const area_inches = area_pixels * scale_factor * scale_factor;

    // Update the marker details section with the clicked marker's details
    document.getElementById("marker-details").innerHTML = `
        <p>Marker ${selectedRectIndex + 1} Details:</p>
        <p>X: ${clickedRect.x.toFixed(2)} px</p>
        <p>Y: ${clickedRect.y.toFixed(2)} px</p>
        <p>Width: ${clickedRect.width.toFixed(2)} px (${width_inches.toFixed(2)} in)</p>
        <p>Height: ${clickedRect.height.toFixed(2)} px (${height_inches.toFixed(2)} in)</p>
        <p>Area: ${area_pixels.toFixed(2)} px² (${area_inches.toFixed(2)} in²)</p>
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
