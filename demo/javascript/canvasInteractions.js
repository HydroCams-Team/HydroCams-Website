// canvasInteractions.js

// Canvas event listeners
// Marker selection
canvas.addEventListener("mousedown", (event) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  const x = mouseX * (canvas.width / rect.width);
  const y = mouseY * (canvas.height / rect.height);

  const clickedRectIndex = getClickedRectangle(x, y);
  if (clickedRectIndex !== null) {
      selectedRectIndex = clickedRectIndex;
      highlightMarker(selectedRectIndex);
      drawAll();
      isPanning = false;
  } else {
      selectedRectIndex = null;
      document.getElementById("marker-details").innerHTML = "<p>No marker selected</p>";
      isPanning = true;
      lastMouseX = mouseX;
      lastMouseY = mouseY;

      updateMarkerTools();
  }
});

// Zooming
canvas.addEventListener("wheel", function (event) {
  event.preventDefault(); // Prevent default scroll behavior

  const mouseX = (event.offsetX - offsetX) / scale;
  const mouseY = (event.offsetY - offsetY) / scale;

  // Calculate the new scale value based on the mouse wheel delta
  const delta = event.deltaY > 0 ? -zoomSpeed : zoomSpeed;
  const newScale = scale + delta;

  // Restrict the zoom level to avoid over-zooming
  if (newScale >= 0.5 && newScale <= 3) {
    // Allow zoom between 0.5x and 3x
    // Update the scale
    scale = newScale;

    // Adjust the offsets to keep the zoom centered at the cursor position
    offsetX -= mouseX * delta;
    offsetY -= mouseY * delta;

    drawAll(); // Redraw the canvas with the updated zoom
  }
});

// Panning
const panSpeed = 3; // Change to control the panning speed

let lastMouseX, lastMouseY; // Store last mouse position during panning

// start panning on mouse click
canvas.addEventListener("mousemove", (event) => {
  if (isPanning) {
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      // Calculate the change in position with panSpeed applied
      const dx = (mouseX - lastMouseX) * panSpeed;
      const dy = (mouseY - lastMouseY) * panSpeed;

      // Update the offsets based on the delta movement
      offsetX += dx;
      offsetY += dy;

      // Update the last mouse position
      lastMouseX = mouseX;
      lastMouseY = mouseY;

      drawAll(); // Redraw the canvas with updated offsets
  }
});


// pan with mouse movement
canvas.addEventListener("mousemove", (event) => {
  if (isPanning) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Calculate the change in position with panSpeed applied
    const dx = (mouseX - lastMouseX) * panSpeed;
    const dy = (mouseY - lastMouseY) * panSpeed;

    // Update the offsets based on the delta movement
    offsetX += dx;
    offsetY += dy;

    // Update the last mouse position
    lastMouseX = mouseX;
    lastMouseY = mouseY;

    drawAll(); // Redraw the canvas with updated offsets
  }
});

// stop panning on mouse up
canvas.addEventListener("mouseup", () => {
  isPanning = false;
});

// stop panning on mouse leaving the canvas
canvas.addEventListener("mouseleave", () => {
  isPanning = false;
});

// Delete selected marker
document.getElementById("delete-button").addEventListener("click", () => {
  if (selectedRectIndex !== null) {
      if (selectedRectIndex === zeroPointIndex) {
          const confirmDelete = confirm("The selected marker is the zero point. Deleting it will unset the zero point. Do you want to proceed?");
          if (!confirmDelete) {
              return;
          }
      }
      rectangles.splice(selectedRectIndex, 1);
      adjustZeroPointIndex(selectedRectIndex);
      selectedRectIndex = null;
      drawAll();
      updateMarkerInfo(); // Refresh marker and distance lists
  }
});


function adjustZeroPointIndex(deletedIndex) {
  if (zeroPointIndex !== null) {
      if (deletedIndex < zeroPointIndex) {
          zeroPointIndex--;
      } else if (deletedIndex === zeroPointIndex) {
          // Zero point has been deleted
          zeroPointIndex = null;
          zeroPointDimension = null;
      }
  }
}


function adjustZeroPointIndex(deletedIndex) {
  if (zeroPointIndex !== null) {
      if (deletedIndex < zeroPointIndex) {
          zeroPointIndex--;
      } else if (deletedIndex === zeroPointIndex) {
          // Zero point has been deleted
          zeroPointIndex = null;
          zeroPointDimension = null;
      }
  }
}

// Function to get the index of the clicked marker
function getClickedRectangle(x, y) {
  // Adjust x and y according to scale and offset
  const adjustedX = (x - offsetX) / scale;
  const adjustedY = (y - offsetY) / scale;

  for (let i = 0; i < rectangles.length; i++) {
      const rect = rectangles[i];
      if (adjustedX >= rect.x && adjustedX <= rect.x + rect.width &&
          adjustedY >= rect.y && adjustedY <= rect.y + rect.height) {
          return i; // Return index of the rectangle
      }
  }
  return null; // No rectangle found at the click location
}

// Display marker details on click
canvas.addEventListener("click", (event) => {
  const rect = canvas.getBoundingClientRect();

  const x = (event.clientX - rect.left) * (canvas.width / rect.width);
  const y = (event.clientY - rect.top) * (canvas.height / rect.height);

  const clickedRectIndex = getClickedRectangle(x, y);
  if (clickedRectIndex !== null) {
    selectedRectIndex = clickedRectIndex;
    drawAll(); // Redraw the canvas
  } else {
    selectedRectIndex = null;
    document.getElementById("marker-details").innerHTML =
      "<p>No marker selected</p>";
  }
});

// display line details on line click
canvas.addEventListener("click", (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) * (canvas.width / rect.width);
  const y = (event.clientY - rect.top) * (canvas.height / rect.height);

  let clickedLine = null;
  for (const line of lines) {
    const distanceToLine = pointToLineDistance(
      x,
      y,
      line.startX,
      line.startY,
      line.endX,
      line.endY
    );

    if (distanceToLine < 5) {
      // Allow a small margin of error for clicking
      clickedLine = line;
      break;
    }
  }

  if (clickedLine) {
    alert(
      `Line between ${clickedLine.marker1} and ${clickedLine.marker2}\nDistance: ${clickedLine.distance} px`
    );
  }
});


