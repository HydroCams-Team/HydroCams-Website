// utility.js

// Function to get the clicked rectangle
function getClickedRectangle(x, y) {
    for (let i = 0; i < rectangles.length; i++) {
        const rect = rectangles[i];
        const x1 = Math.min(rect.x, rect.x + rect.width) - tolerance;
        const x2 = Math.max(rect.x, rect.x + rect.width) + tolerance;
        const y1 = Math.min(rect.y, rect.y + rect.height) - tolerance;
        const y2 = Math.max(rect.y, rect.y + rect.height) + tolerance;
        if (x >= x1 && x <= x2 && y >= y1 && y <= y2) {
            return i;
        }
    }
    return null;
}

// Function to calculate the distance from a point to a line segment
function pointToLineDistance(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    const param = len_sq !== 0 ? dot / len_sq : -1;

    let xx, yy;
    if (param < 0) {
        xx = x1;
        yy = y1;
    } else if (param > 1) {
        xx = x2;
        yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
}
