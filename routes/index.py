from flask import redirect, url_for

from main import app


@app.route('/')
def index():
    return redirect(url_for('home'))
