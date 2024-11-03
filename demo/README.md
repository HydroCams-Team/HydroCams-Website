To get started, ensure the current directory is `HydroCams-Website/demo`, and create a venv using `python -m venv ./.venv`. 

Activate the venv using `source .venv/bin/activate`. 

Then install the dependencies for the current Flask iteration using `pip install -r requirements.txt`. 

Finally, launch the Flask application using `python app.py`, and either ensure this repo is placed in a directory like `/var/www/`, or, in a separate window/pane, launch an HTTP server using `python -m http.server`.

If you encounter issues in launching the server, ensure the constants in `app.py` and `variables.js` are set properly. If you are using `/var/www/`, ensure that the `HTTP_SERVER_PORT_STRING` constant in `variables.js` is set to an empty string. 

You should now be able to navigate to a [local instance](http://localhost:8000), or if installed server-side, a server instance, at `http://{server_ip}/demo`.