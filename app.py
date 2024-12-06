import cv2
import flask
import flask_cors
import imutils
import json
import numpy
import os

from cv2 import typing
from os import path
from typing import Any


UPLOAD_FOLDER = 'uploads'
PROCESSED_FOLDER = 'processed'


# initialize Flask application and enable CORS for all routes
app = flask.Flask(__name__)
flask_cors.CORS(app, resources={r'/*': {'origins': '*'}})


@app.route('/')
def index() -> str:
    """
    Returns the workbench site HTML.

    Returns:
        The index.html of the workbench website. 
    """

    return flask.render_template('index.html')


@app.route('/favicon.ico')
def favicon() -> flask.Response:
    """
    Returns the favicon of the website. 

    Returns:
        The favicon for the website as a file.
    """

    return flask.send_from_directory(path.join(app.root_path, 'static'), 'favicon.ico', 
                                     mimetype='image/vnd.microsoft.icon')


@app.route('/processed/<filename>')
def send_processed_file(filename: str) -> flask.Response:
    """
    Returns the processed image file from storage.

    Parameters:
        filename: The name of the processed file to send. 

    Returns:
        The processed image, containing marker annotations. 
    """

    return flask.send_from_directory(PROCESSED_FOLDER, filename)


# Process image and detect markers with selected colors
@app.route('/upload', methods=['POST'])
def upload_image() -> flask.Response:
    """
    Receives form data from the website, identifies markers and distances, and 
    returns a JSON response containing relevant information. 

    Returns:
        JSON containing all detected markers, the distances between them, and 
        the url of the annotated image. 
    """

    # ensure file is in the request, and retrieve the file if it is and exists
    if 'file' not in flask.request.files:
        return flask.make_response(flask.jsonify({'error': 'No file part in the request'}), 
                                   400)
    else:
        file = flask.request.files['file']
        if file.filename == '':
            return flask.make_response(flask.jsonify({'error': 'No selected file'}), 
                                       400)

    # retrieve form data, and ensure datatypes
    hex_colors = flask.request.form.getlist('colors[]')
    if not hex_colors:
        return flask.make_response(flask.jsonify({'error': 'No colors selected'}), 
                                   400)
    min_contour_area = int(flask.request.form.get('contour_area', 350))
    max_contour_area = int(flask.request.form.get('contour_area_max', 1000))
    marker_size = float(flask.request.form.get('marker_size', 5))

    # convert hex colors to HSV
    hsv_colors = [cv2.cvtColor(numpy.uint8([[hex_to_rgb(color)]]), cv2.COLOR_RGB2HSV)[0][0] for color in hex_colors]

    # save the uploaded file
    uploaded_filepath = path.join(UPLOAD_FOLDER, file.filename)
    file.save(uploaded_filepath)

    # load uploaded image, and use marker detection with contour area limits
    image = cv2.imread(uploaded_filepath)
    processed_image, detected_markers = detect_markers(image, hsv_colors, min_contour_area, 
                                                       max_contour_area)

    # save processed image
    processed_filepath = path.join(PROCESSED_FOLDER, 'processed_' + file.filename)
    if not path.exists(processed_filepath):
        print(f'Error: {processed_filepath} does not exist!')
    else:
        cv2.imwrite(processed_filepath, processed_image)
        print(f'Processed image successfully saved to: {processed_filepath}')
    
    # calculate inter-marker distances
    distances = calculate_marker_distances(detected_markers, marker_size)

    # create and return JSON response
    response = {
        'markers': detected_markers,
        'distances': distances,
        'image_url': '/processed/' + 'processed_' + file.filename
    }
    return flask.jsonify(response)


def calculate_marker_distances(detected_markers: list, marker_diameter: float) -> list[dict[str, Any]]:
    """
    Calculates the real-world distances between the detected markers in the image. 

    Parameters:
        detected_markers: A list containing information about all detected markers 
                          in the image.
        marker_diameter: The real-world marker diameter.

    Returns:
        marker_distances: A list containing information about the distances between 
                          all markers. 
    """

    marker_distances = []

    if len(detected_markers) <= 1:
        return marker_distances

    # Calculate average marker size in pixels
    marker_diameter_in_pixels = numpy.mean([marker['width'] for marker in detected_markers] + 
                                           [marker['height'] for marker in detected_markers])
    scale_factor = marker_diameter / marker_diameter_in_pixels

    # Calculate pairwise distances
    for i, marker_1 in enumerate(detected_markers):
        for marker_2 in detected_markers[i + 1:]:
            pixel_distance = numpy.sqrt((marker_1['x'] - marker_2['x']) ** 2 + (marker_1['y'] - marker_2['y']) ** 2)
            real_world_distance = pixel_distance * scale_factor

            marker_distances.append({
                'marker1': marker_1['marker_number'],
                'marker2': marker_2['marker_number'],
                'pixel_distance': json.dumps(pixel_distance.item()),
                'distance_real_world': json.dumps(real_world_distance.item())
            })

    return marker_distances


def detect_markers(image: typing.MatLike, hsv_colors: list[list[int]], min_contour_area: float, 
                   max_contour_area: float) -> tuple[typing.MatLike, list]:
    """
    Detects markers in an image using a list of HSV colors, within a min and max size. 

    Parameters:
        image: An OpenCV image in the BGR colorspace.
        hsv_colors: An array of arrays containing HSV color codes.
        min_contour_area: The minimum pixel area of a valid marker. 
        max_contour_area: The maximum pixel area of a valid marker. 

    Returns:
        image: The OpenCV image, now with added contour bounding rectangles. 
        detected_markers: A list containing marker information. 
    """

    # initialize a list to hold all detected markers
    detected_markers = []

    # convert the image to the HSV color space
    hsv_image = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)

    # log the maximum contour area
    print(f'Max contour area allowed: {max_contour_area}') # TODO: Implement actual logging?

    # process each color individually to detect markers of each color separately
    for hsv_color in hsv_colors:
        # get a mask of the image using the input color
        mask = get_hsv_range(hsv_image, hsv_color, 10)

        # mask the image using the obtained mask
        result = cv2.bitwise_and(image, image, mask=mask)
        blurred_image = cv2.GaussianBlur(result, (5, 5), 0)
        grayscale_blurred_image = cv2.cvtColor(blurred_image, cv2.COLOR_BGR2GRAY)
        threshold_image = cv2.threshold(grayscale_blurred_image, 35, 255, cv2.THRESH_BINARY)[1]

        # get the contours of the masked image
        contours = cv2.findContours(threshold_image.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        contours = imutils.grab_contours(contours)

        # iterate the detected contours
        for contour in contours:
            # get the area of the contour, and ensure it is within the min-max range
            area = cv2.contourArea(contour)
            if min_contour_area <= area <= max_contour_area:
                # draw a bounding rectangle around the contour
                _, _, w, h = cv2.boundingRect(contour)

                # using the width and height, determine if the aspect ratio of the contour is circular or square
                aspect_ratio = w / h
                if 0.9 <= aspect_ratio <= 1.1:  # Roughly circular or square
                    print(f'Detected contour with area {area} within bounds ({min_contour_area} - {max_contour_area}) for color {hsv_color}')

                    # get the coordinates and size of the circle enclosing the contour
                    (center_x, center_y), radius = cv2.minEnclosingCircle(contour)

                    # add this contour to the list of markers
                    detected_markers.append({
                        'marker_number': len(detected_markers) + 1,
                        'x': float(center_x),
                        'y': float(center_y),
                        'enclosing_radius': int(radius),
                        'width': w,
                        'height': h,
                        'contour': contour[:, 0, :].tolist()
                    })
            else:
                print(f'Contour with area {area} skipped (outside bounds)')

    return image, detected_markers


def get_hsv_range(hsv_image: typing.MatLike, hsv_color: list[int], tolerance: int
                  ) -> typing.MatLike:
    """
    Determines a plausible detection range using the input HSV image and color.

    Parameters:
        hsv_image: An OpenCV image in the HSV color space. 
        hsv_color: An array containing an HSV color code. 
        tolerance: An integer tolerance value; Default of 10.

    Returns:
        An OpenCV mask of the image, within the detection range.
    """

    # if the input hsv color and tolerance values will cause a color space wrapping
    if hsv_color[0] < tolerance or hsv_color[0] > (180 - tolerance):
        # define lower wraparound range
        lower_lower_range = numpy.array([hsv_color[0], 100, 100])
        lower_upper_range = numpy.array([(int(hsv_color[0]) + tolerance) % 180, 255, 255])
        if lower_lower_range[0] > 0:
            lower_lower_range[0] = 0
        
        # create a mask of the lower range
        lower_mask = cv2.inRange(hsv_image, lower_lower_range, lower_upper_range)

        # define upper wraparound range
        upper_lower_range = numpy.array([(int(hsv_color[0]) - tolerance) % 180, 100, 100])
        upper_upper_range = numpy.array([hsv_color[0], 255, 255])
        if upper_upper_range[0] >= 0:
            upper_upper_range[0] = 180

        # create a mask of the upper range
        upper_mask = cv2.inRange(hsv_image, upper_lower_range, upper_upper_range)

        # combine the lower and upper masks
        mask = lower_mask + upper_mask
    else:
        # define a non-wraparound range
        lower_range = numpy.array([int(hsv_color[0]) - tolerance, 100, 100])
        upper_range = numpy.array([int(hsv_color[0]) + tolerance, 255, 255])

        # create a mask using the lower and upper range
        mask = cv2.inRange(hsv_image, lower_range, upper_range)

    return mask


# Utility to convert hex to RGB
def hex_to_rgb(hex_color: str) -> tuple[int, int, int]:
    """
    Converts hex colors to an RGB tuple.

    Parameters:
        hex_color: A string containing a hex color code. 

    Returns:
        A tuple containing the RGB equivalent of the hex input. 
    """

    # strip leading # from hex code
    hex_color = hex_color.lstrip('#')

    # convert hex to numeric
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))


if __name__ == '__main__':
    # ensure upload/processed image folders exist
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(PROCESSED_FOLDER, exist_ok=True)

    # open the JSON config file and retrieve the Flask port from it
    with open('static/constants.json') as input:
        constants = json.load(input)
    FLASK_PORT = constants['FLASK_PORT']

    # run the Flask app
    app.run(debug=True, host='localhost', port=FLASK_PORT)
