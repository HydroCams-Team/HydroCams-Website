import cv2
import flask
import flask_cors
import imutils
import numpy as np
import os

# Global constants
FLASK_HOST = '54.218.238.180'
FLASK_PORT = 5000
UPLOAD_FOLDER = 'uploads'
PROCESSED_FOLDER = 'processed'
INCH_TO_CM = 2.54  # Conversion constant from inches to centimeters

# Flask app initialization
app = flask.Flask(__name__)
flask_cors.CORS(app, resources={r"/*": {"origins": "*"}})  # Enable CORS for all routes

# Ensure folders exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)

# Utility to convert hex to RGB
def hex_to_rgb(hex_color):
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

# Serve processed images from the 'processed' folder
@app.route('/processed/<filename>')
def send_processed_file(filename):
    return flask.send_from_directory(PROCESSED_FOLDER, filename)

# Process image and detect markers with selected colors
@app.route('/upload', methods=['POST'])
def upload_image():
    if 'file' not in flask.request.files:
        return flask.make_response(flask.jsonify({'error': 'No file part in the request'}), 400)
    
    file = flask.request.files['file']
    if file.filename == '':
        return flask.make_response(flask.jsonify({'error': 'No selected file'}), 400)

    # Retrieve form data
    hex_colors = flask.request.form.getlist('colors[]')
    contour_area = int(flask.request.form.get('contour_area', 350))
    contour_area_max = flask.request.form.get('contour_area_max')  # Retrieve max contour area
    if contour_area_max is not None:
        contour_area_max = int(contour_area_max)  # Convert to int if provided

    marker_size = float(flask.request.form.get('marker_size', 5))

    if not hex_colors:
        return flask.make_response(flask.jsonify({'error': 'No colors selected'}), 400)

    # Convert hex colors to HSV
    hsv_colors = [cv2.cvtColor(np.uint8([[hex_to_rgb(color)]]), cv2.COLOR_RGB2HSV)[0][0] for color in hex_colors]

    # Save the uploaded file
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)

    # Process image using marker detection with contour area limits
    processed_file_path = os.path.join(PROCESSED_FOLDER, 'processed_' + file.filename)
    image = cv2.imread(file_path)
    processed_image, detected_markers = detect_markers(image, hsv_colors, contour_area, contour_area_max)

    # Save the processed image
    cv2.imwrite(processed_file_path, processed_image)

    if not os.path.exists(processed_file_path):
        print(f"Error: Processed image was not saved to: {processed_file_path}")
    else:
        print(f"Processed image successfully saved to: {processed_file_path}")
    
    # Calculate distances between markers
    distances = calculate_distances_between_markers(detected_markers, marker_diameter_in_inches=marker_size)

    response = {
        'markers': detected_markers,
        'distances': distances,
        'image_url': '/demo/processed/' + 'processed_' + file.filename
    }

    return flask.jsonify(response)

def detect_markers(image, hsv_colors, contour_area, contour_area_max=None):
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    detected_markers = []

    # Log the maximum contour area for debugging
    print(f"Max contour area allowed: {contour_area_max}")

    # Process each color individually to detect markers of each color separately
    for hsv_color in hsv_colors:
        if hsv_color[0] <= 9 or hsv_color[0] >= 171:
            # Define lower wraparound range
            lower_lower_range = np.array([hsv_color[0], 100, 100])
            lower_upper_range = np.array([(int(hsv_color[0]) + 10) % 180, 255, 255])
            if lower_lower_range[0] > 0:
                lower_lower_range[0] = 0
            lower_mask = cv2.inRange(hsv, lower_lower_range, lower_upper_range)

            # Define upper wraparound range
            upper_lower_range = np.array([(int(hsv_color[0]) - 20) % 180, 100, 100])
            upper_upper_range = np.array([hsv_color[0], 255, 255])
            if upper_upper_range[0] >= 0:
                upper_upper_range[0] = 180
            upper_mask = cv2.inRange(hsv, upper_lower_range, upper_upper_range)

            mask = lower_mask + upper_mask
        else:
            # Non-wraparound range
            lower_range = np.array([int(hsv_color[0]) - 20, 100, 100])
            upper_range = np.array([int(hsv_color[0]) + 10, 255, 255])
            mask = cv2.inRange(hsv, lower_range, upper_range)

        # Process the mask for this color individually
        result = cv2.bitwise_and(image, image, mask=mask)
        blurred_image = cv2.GaussianBlur(result, (5, 5), 0)
        grayscale_blurred_image = cv2.cvtColor(blurred_image, cv2.COLOR_BGR2GRAY)
        threshold_image = cv2.threshold(grayscale_blurred_image, 35, 255, cv2.THRESH_BINARY)[1]

        # Find contours for the current color mask
        contours = cv2.findContours(threshold_image.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        contours = imutils.grab_contours(contours)

        # Process each contour individually for this color
        for contour in contours:
            area = cv2.contourArea(contour)

            # Check if the contour area is within the specified bounds
            if contour_area <= area <= (contour_area_max if contour_area_max is not None else float('inf')):
                # Check if the contour is approximately circular or square
                x, y, w, h = cv2.boundingRect(contour)
                aspect_ratio = w / h
                if 0.8 <= aspect_ratio <= 1.25:  # Roughly circular or square
                    print(f"Detected contour with area {area} within bounds ({contour_area} - {contour_area_max}) for color {hsv_color}")
                    (center_x, center_y), radius = cv2.minEnclosingCircle(contour)

                    detected_markers.append({
                        'marker_number': len(detected_markers) + 1,
                        'x': int(center_x),
                        'y': int(center_y),
                        'enclosing_radius': int(radius),
                        'width': w,
                        'height': h,
                        'contour': contour[:, 0, :].tolist()
                    })
            else:
                print(f"Contour with area {area} skipped (outside bounds)")

    return image, detected_markers


def get_hsv_range(hsv_color):
    if hsv_color[0] <= 9 or hsv_color[0] >= 171:
        # Wraparound range handling
        lower_lower_range = np.array([hsv_color[0], 100, 100])
        lower_upper_range = np.array([(int(hsv_color[0]) + 10) % 180, 255, 255])
        upper_lower_range = np.array([(int(hsv_color[0]) - 20) % 180, 100, 100])
        upper_upper_range = np.array([hsv_color[0], 255, 255])
        return (lower_lower_range, lower_upper_range), (upper_lower_range, upper_upper_range)
    else:
        lower_range = np.array([int(hsv_color[0]) - 20, 100, 100])
        upper_range = np.array([int(hsv_color[0]) + 10, 255, 255])
        return lower_range, upper_range

def calculate_distances_between_markers(detected_markers, marker_diameter_in_inches=5):
    distances = []
    if len(detected_markers) < 2:
        return distances

    marker_diameter_in_pixels = np.mean([marker['width'] for marker in detected_markers])
    scale_factor = marker_diameter_in_inches / marker_diameter_in_pixels

    for i, marker1 in enumerate(detected_markers):
        for j, marker2 in enumerate(detected_markers[i + 1:], start=i + 1):
            pixel_distance = np.sqrt((marker1['x'] - marker2['x']) ** 2 + (marker1['y'] - marker2['y']) ** 2)
            real_world_distance_inches = pixel_distance * scale_factor
            distances.append({
                'marker1': marker1['marker_number'],
                'marker2': marker2['marker_number'],
                'pixel_distance': pixel_distance,
                'distance_inches': real_world_distance_inches
            })

    return distances

@app.route('/favicon.ico')
def favicon():
    return flask.send_from_directory(os.path.join(app.root_path, 'static'), 'favicon.ico', 
                                     mimetype='image/vnd.microsoft.icon')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=FLASK_PORT)
