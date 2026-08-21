import requests
from flask import Flask
app = Flask(__name__)

@app.route('/')
def home():
    try:
        r = requests.get("http://backend:5000")
        return f"Frontend received: {r.text}"
    except:
        return "Could not connect to backend."
        
app.run(host='0.0.0.0', port=5000)

