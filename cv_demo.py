## not currently used, but can be used for testing by running the script in the EC2 terminal

import cv2
import numpy as np

# Function to detect red blobs in an image
def detect_red_blobs(image_path, min_area=1000, scale_factor=0.5):
    # Load the image
    image = cv2.imread(image_path)
    if image is None:
        print(f"Error loading image: {image_path}")
        return

    # Convert the image to HSV color space
    hsv_image = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)

    # Define lower and upper ranges for a strong, bright red color in HSV
    lower_red1 = np.array([0, 150, 150])  # First range for red (lower hue)
    upper_red1 = np.array([10, 255, 255])

    lower_red2 = np.array([170, 150, 150])  # Second range for red (higher hue)
    upper_red2 = np.array([180, 255, 255])


    # Create masks for red color using both ranges
    mask1 = cv2.inRange(hsv_image, lower_red1, upper_red1)
    mask2 = cv2.inRange(hsv_image, lower_red2, upper_red2)

    # Combine both masks
    red_mask = cv2.bitwise_or(mask1, mask2)

    # Apply Gaussian blur to reduce noise
    blurred_mask = cv2.GaussianBlur(red_mask, (5, 5), 0)

    # Find contours in the blurred mask
    contours, _ = cv2.findContours(blurred_mask, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

    # Loop over the contours
    for contour in contours:
        # Get the area of the contour
        area = cv2.contourArea(contour)

        # Only consider contours that have an area greater than min_area
        if area >= min_area:
            # Draw the contour on the original image
            cv2.drawContours(image, [contour], 0, (0, 255, 0), 3)
            print(f"Detected red blob with area {area}")

    # Resize the image for display based on the scale_factor
    resized_image = cv2.resize(image, (int(image.shape[1] * scale_factor), int(image.shape[0] * scale_factor)))

    # Display the resized image
    cv2.imshow('Detected Red Blobs', resized_image)
    cv2.waitKey(0)
    cv2.destroyAllWindows()

# Example usage
image_path = '/var/www/html/demo/marker.jpg'  # Path to the uploaded image
detect_red_blobs(image_path, min_area=1500, scale_factor=0.5)  # Adjust min_area and scale_factor as needed
