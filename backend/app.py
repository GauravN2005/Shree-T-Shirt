from flask import Flask
from flask_cors import CORS
from routes.students import students_routes

from routes.auth import auth_routes
from routes.schools import school_routes

app = Flask(__name__)
CORS(app)

app.register_blueprint(auth_routes)
app.register_blueprint(school_routes)
app.register_blueprint(students_routes)

if __name__ == "__main__":
    app.run(debug=True)