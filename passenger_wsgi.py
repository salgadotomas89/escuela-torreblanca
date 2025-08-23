import os
import sys

# Asegúrate de que 'miproyecto' sea el nombre de la carpeta 
# que contiene tu archivo wsgi.py
from miproyecto.wsgi import application

sys.path.insert(0, os.path.dirname(__file__))
