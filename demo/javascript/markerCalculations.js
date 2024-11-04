// markerCalculations.js
var distances = [];  // Global array to store distances between markers
var zeroPointIndex = null; // Index of the zero point marker
var zeroPointDimension = null; // Real-world dimension of the zero point

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

function updateMarkerList() {
    const markerList = document.getElementById('marker-list');
    markerList.innerHTML = ''; // Clear existing content

    rectangles.forEach((marker, index) => {
        const markerDiv = document.createElement('div');
        markerDiv.classList.add('clickable-div');

        // Check if this marker is the zero point
        const isZeroPoint = zeroPointIndex === index;

        // Create content for the marker div
        markerDiv.innerHTML = `
            M${index + 1} (X: ${marker.x.toFixed(0)}, Y: ${marker.y.toFixed(0)})
            ${isZeroPoint ? '<span style="color: red;"> [Zero Point]</span>' : ''}
        `;
        markerDiv.addEventListener('click', () => highlightMarker(index));
        markerList.appendChild(markerDiv);
    });

    document.getElementById('marker-info-container').style.display = 'block';
}

// New function to update the marker tools
function updateMarkerTools() {
    const markerTools = document.getElementById('marker-tools');
    markerTools.innerHTML = ''; // Clear existing content

    if (selectedRectIndex !== null) {
        const isZeroPoint = zeroPointIndex === selectedRectIndex;

        const zeroPointButton = document.createElement('button');
        zeroPointButton.textContent = isZeroPoint ? 'Unset Zero Point' : 'Set as Zero Point';
        zeroPointButton.classList.add("nav-button", "neon-blue-gradient-border");
        zeroPointButton.addEventListener('click', () => setZeroPoint(selectedRectIndex));

        markerTools.appendChild(zeroPointButton);
    } else {
        // Display a message when no marker is selected
        markerTools.innerHTML = '<p>No marker selected</p>';
    }
}


function setZeroPoint(index) {
    if (zeroPointIndex === index) {
        // Unset the zero point
        zeroPointIndex = null;
        zeroPointDimension = null;
    } else {
        zeroPointIndex = index;
        promptZeroPointDimensions();
    }
    updateMarkerInfo();
    highlightMarker(index); // Update the marker tools and details
    drawAll();
}

function promptZeroPointDimensions() {
    // Show the modal
    const modal = document.getElementById('zeroPointModal');
    const closeModalBtn = document.getElementById('closeZeroPointModal');
    const saveBtn = document.getElementById('saveZeroPointDimension');
    const inputField = document.getElementById('zeroPointDimensionInput');

    modal.style.display = 'block';

    // Clear previous input
    inputField.value = '';

    // Close modal when 'x' is clicked
    closeModalBtn.onclick = function() {
        modal.style.display = 'none';
        // Unset the zero point if dimensions are not provided
        zeroPointIndex = null;
        zeroPointDimension = null;
        updateMarkerInfo();
        drawAll();
    }

    // Close modal when user clicks outside of it
    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
            zeroPointIndex = null;
            zeroPointDimension = null;
            updateMarkerInfo();
            drawAll();
        }
    }

    // Save dimensions when 'Save' button is clicked
    saveBtn.onclick = function() {
        const dimension = parseFloat(inputField.value);
        if (isNaN(dimension) || dimension <= 0) {
            alert('Please enter a valid number greater than zero.');
        } else {
            zeroPointDimension = dimension;
            modal.style.display = 'none';
            // Recalculate distances with the new zero point
            distances = recalculateDistances();
            updateDistanceList(distances);
            drawAll();
        }
    }
}



// Function to update the distance list
function updateDistanceList(distances = []) {
    const distanceList = document.getElementById('distance-list');
    distanceList.innerHTML = ''; // Clear existing content

    if (zeroPointIndex === null || zeroPointDimension === null) {
        distanceList.innerHTML = '<p>Please set a zero point to calculate distances.</p>';
        return;
    }

    if (distances.length === 0) {
        distanceList.innerHTML = '<p>No distances measured</p>';
        return;
    }

    distances.forEach((distance) => {
        const distanceDiv = document.createElement('div');
        distanceDiv.classList.add('clickable-div');
        distanceDiv.innerHTML = `Vertical Distance from Zero Point (M${distance.marker1}) to M${distance.marker2}: ${distance.distance_inches.toFixed(2)} inches`;
        distanceDiv.addEventListener('click', () => highlightLine(distance));
        distanceList.appendChild(distanceDiv);
    });
}


// Function to recalculate distances between markers using a single scale factor
function recalculateDistances() {
    const distances = [];
    if (rectangles.length < 2 || zeroPointIndex === null || zeroPointDimension === null) {
        return distances;
    }

    // Get the zero point marker
    const zeroMarker = rectangles[zeroPointIndex];
    const zeroDiameterPixels = (zeroMarker.width + zeroMarker.height) / 2;

    // Calculate scale factor based on the known size of the zero point
    const zeroPointScaleFactor = zeroPointDimension / zeroDiameterPixels;

    console.log(`Zero Point Scale Factor: ${zeroPointScaleFactor.toFixed(4)} inches per pixel`);

    // Loop through each marker to calculate its distance from the zero point
    rectangles.forEach((marker, index) => {
        if (index !== zeroPointIndex) {
            // Calculate the vertical distance (difference in Y-coordinates)
            const pixelDistanceY = Math.abs((marker.y + marker.height / 2) - (zeroMarker.y + zeroMarker.height / 2));

            // Convert pixel distance to real-world distance using the zero point's scale factor
            const distanceInches = pixelDistanceY * zeroPointScaleFactor;

            distances.push({
                marker1: zeroPointIndex + 1,
                marker2: index + 1,
                distance_inches: parseFloat(distanceInches.toFixed(2)),
                pixel_distance: pixelDistanceY, 
                startX: marker.x + marker.width / 2,
                startY: marker.y + marker.height / 2,
                endX: zeroMarker.x + zeroMarker.width / 2,
                endY: zeroMarker.y + zeroMarker.height / 2
            });

            console.log(`Vertical distance from Zero Point (M${zeroPointIndex + 1}) to M${index + 1}: ${distanceInches.toFixed(2)} inches`);
        }
    });

    return distances;
}


// Function to highlight a specific marker on the canvas
function highlightMarker(index) {
    selectedRectIndex = index; // Set the selected marker index
    drawAll(); // Redraw the canvas to highlight the selected marker

    const clickedRect = rectangles[selectedRectIndex];
    const area_pixels = clickedRect.width * clickedRect.height;

    let verticalDistanceInches = null;

    if (zeroPointIndex !== null && zeroPointDimension !== null && zeroPointIndex !== selectedRectIndex) {
        // Calculate vertical distance
        const zeroMarker = rectangles[zeroPointIndex];
        const zeroDiameterPixels = (zeroMarker.width + zeroMarker.height) / 2;
        const scaleFactor = zeroPointDimension / zeroDiameterPixels;
        const pixelDistanceY = Math.abs(clickedRect.y - zeroMarker.y);
        verticalDistanceInches = pixelDistanceY * scaleFactor;
    }

    // Update the marker details section with the clicked marker's details
    document.getElementById("marker-details").innerHTML = `
        <p>Marker ${selectedRectIndex + 1} Details:</p>
        <p>X: ${clickedRect.x.toFixed(2)} px</p>
        <p>Y: ${clickedRect.y.toFixed(2)} px</p>
        <p>Width: ${clickedRect.width.toFixed(2)} px</p>
        <p>Height: ${clickedRect.height.toFixed(2)} px</p>
        <p>Area: ${area_pixels.toFixed(2)} px²</p>
        ${verticalDistanceInches !== null ? `<p>Vertical Distance from<br> Zero Point: ${verticalDistanceInches.toFixed(2)} inches</p>` : ''}
        ${selectedRectIndex === zeroPointIndex ? '<p style="color: red;">This is the Zero Point Marker</p>' : ''}
    `;

    // Update the marker tools section
    updateMarkerTools();
}



// Function to highlight a specific line between markers on the canvas
function highlightLine(distance) {
    selectedRectIndex = null; // Deselect any previously selected marker
    drawAll();

    // Highlight the vertical line by drawing it again in a different color or thickness
    context.save();
    context.setTransform(scale, 0, 0, scale, offsetX, offsetY);
    context.beginPath();
    context.moveTo(distance.startX, distance.startY);
    context.lineTo(distance.endX, distance.endY);
    context.strokeStyle = 'red'; // Highlight the line in red
    context.lineWidth = 4 / scale; // Make the line thicker
    context.stroke();
    context.restore();
}

