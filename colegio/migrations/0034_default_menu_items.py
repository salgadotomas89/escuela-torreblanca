from django.db import migrations

def crear_menu_items_default(apps, schema_editor):
    Menu = apps.get_model('colegio', 'Menu')
    MenuItem = apps.get_model('colegio', 'MenuItem')
    
    # Crear menú principal si no existe
    menu_principal, _ = Menu.objects.get_or_create(nombre='Menu Principal')
    
    # Lista de items por defecto con las URLs correctas
    items_default = [
        {
            'nombre': 'Inicio',
            'url': '/',
            'orden': 1,
            'es_mega_menu': False
        },
        {
            'nombre': 'Noticias',
            'url': '/noticias/0',
            'orden': 2,
            'es_mega_menu': False
        },
        {
            'nombre': 'Colegio',
            'url': '#',
            'orden': 3,
            'es_mega_menu': True
        },
        {
            'nombre': 'Fotos',
            'url': '/fotos',
            'orden': 4,
            'es_mega_menu': False
        },
        {
            'nombre': 'Configuración',
            'url': '/configuracion',
            'orden': 5,
            'es_mega_menu': False
        },
        {
            'nombre': 'Contacto',
            'url': '/contacto',
            'orden': 6,
            'es_mega_menu': False
        }
    ]
    
    # Crear los items solo si no existen
    for item_data in items_default:
        MenuItem.objects.get_or_create(
            menu=menu_principal,
            nombre=item_data['nombre'],
            defaults={
                'url': item_data['url'],
                'orden': item_data['orden'],
                'es_mega_menu': item_data['es_mega_menu']
            }
        )

def revertir_menu_items(apps, schema_editor):
    MenuItem = apps.get_model('colegio', 'MenuItem')
    Menu = apps.get_model('colegio', 'Menu')
    MenuItem.objects.all().delete()
    Menu.objects.all().delete()

class Migration(migrations.Migration):
    dependencies = [
        ('colegio', '0033_alter_menuitem_options_rename_name_menuitem_nombre_and_more'),
    ]

    operations = [
        migrations.RunPython(crear_menu_items_default, revertir_menu_items),
    ] 