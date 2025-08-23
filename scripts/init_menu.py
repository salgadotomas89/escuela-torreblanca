import os
import django
import json
import sys
# Agrega la raíz del proyecto al sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'miproyecto.settings')
django.setup()

from colegio.models import Menu, MenuItem

# Ruta al archivo JSON
json_path = os.path.join(os.path.dirname(__file__), '../colegio_menuitem.json')

with open(json_path, 'r') as f:
    data = json.load(f)

# Asumimos que el menú principal ya existe o lo creamos
menu, _ = Menu.objects.get_or_create(id=1, defaults={'nombre': 'Menu Principal'})

for item in data:
    MenuItem.objects.update_or_create(
        id=item['id'],
        defaults={
            'nombre': item['nombre'],
            'url': item['url'],
            'es_mega_menu': item['es_mega_menu'],
            'menu': menu,
            'orden': item['orden'],
            'solo_usuarios_logueados': item['solo_usuarios_logueados'],
        }
    )

print("Datos de menú cargados correctamente.")