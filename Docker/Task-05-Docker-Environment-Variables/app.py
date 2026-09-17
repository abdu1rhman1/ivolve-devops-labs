import os
from flask import Flask

app = Flask(__name__)

@app.route('/')
def show_env():
    mode = os.getenv("APP_MODE", "default")
    region = os.getenv("APP_REGION", "unknown")
    return f"App mode: {mode}, Region: {region}"

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)

