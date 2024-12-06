To get started, ensure the current directory is `HydroCams-Website/demo`, and create a venv using `python -m venv ./.venv`. 

Activate the venv using `source .venv/bin/activate{.shell extension}` for Unix-like, or `source .venv/Scripts/activate` for Windows. 

Then install the dependencies for the current Flask iteration using `pip install -r requirements.txt`. 

Finally, launch the Flask application using `python app.py`.

The Flask and HTTP port can be configured in `static/constants.json`.

You should now be able to navigate to a [local instance](http://localhost:5000), or if installed server-side, a server instance, at `http://{server_ip}:5000`.