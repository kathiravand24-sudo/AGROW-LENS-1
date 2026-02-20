import flask
import flask_cors
import requests
from PIL import Image
try:
    import tensorflow
    print("tensorflow imported")
except ImportError:
    print("tensorflow import failed")

import numpy
try:
    import transformers
    print("transformers imported")
except ImportError:
    print("transformers import failed")

try:
    import torch
    print("torch imported")
except ImportError:
    print("torch import failed")

print("All critical imports successful")
