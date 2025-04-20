from flask import Flask, jsonify
from pymongo import MongoClient
import os
from bson.json_util import dumps

app = Flask(__name__)

# MongoDB Connection
MONGO_URI = "mongodb+srv://Temp:hack@cluster0.lhazyyp.mongodb.net/DriverData?retryWrites=true&w=majority&appName=Cluster0"

try:
    client = MongoClient(MONGO_URI)
    db = client.get_database()
    print("MongoDB connection successful")
except Exception as e:
    print(f"MongoDB connection error: {e}")

# Route to check database connection
@app.route('/check-connection', methods=['GET'])
def check_connection():
    try:
        # Ping the database to check connection
        info = client.server_info()
        return jsonify({
            "status": "success",
            "message": "Connected to MongoDB",
            "version": info.get('version', 'unknown')
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Failed to connect to MongoDB: {str(e)}"
        }), 500

# Simple route to test reading data
@app.route('/test-data', methods=['GET'])
def test_data():
    try:
        # Get a list of collections in the database
        collections = db.list_collection_names()
        return jsonify({
            "status": "success",
            "collections": collections
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Error retrieving collections: {str(e)}"
        }), 500

if __name__ == '__main__':
    app.run(debug=True)
