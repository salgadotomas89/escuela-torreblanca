from django.core.cache import cache
from .models import Menu, MenuItem, AppearanceSettings

def menu_items_processor(request):
    """
    Context processor que proporciona los items del menú ordenados y organizados
    """
    # Crear cache key basado en si el usuario está autenticado
    cache_key = f'menu_items_{request.user.is_authenticated}'
    cached_menu = cache.get(cache_key)
    
    if cached_menu is None:
        try:
            menu_principal = Menu.objects.prefetch_related('items').get(nombre='Menu Principal')
            menu_items = menu_principal.items.all().order_by('orden')
            
            # Separar items públicos y privados
            items_publicos = list(menu_items.filter(solo_usuarios_logueados=False))
            items_privados = list(menu_items.filter(solo_usuarios_logueados=True))
            
            cached_menu = {
                'items_publicos': items_publicos,
                'items_privados': items_privados
            }
            # Cachear por 30 minutos
            cache.set(cache_key, cached_menu, 1800)
            
        except Menu.DoesNotExist:
            cached_menu = {
                'items_publicos': [],
                'items_privados': []
            }
            cache.set(cache_key, cached_menu, 1800)
    
    # Filtrar según si el usuario está autenticado
    if request.user.is_authenticated:
        # Usuario logueado ve todos los items
        all_items = cached_menu['items_publicos'] + cached_menu['items_privados']
    else:
        # Usuario no logueado solo ve items públicos
        all_items = cached_menu['items_publicos']
    
    # Separar items normales y mega menús
    items_normales = [item for item in all_items if not item.es_mega_menu]
    mega_menus = [item for item in all_items if item.es_mega_menu]
    
    return {
        'menu_items': items_normales,
        'mega_menus': mega_menus
    }

def redes_sociales_processor(request):
    """
    Context processor que proporciona las URLs de redes sociales
    """
    cache_key = 'redes_sociales_data'
    redes_sociales = cache.get(cache_key)
    
    if redes_sociales is None:
        try:
            apariencia = AppearanceSettings.objects.first()
            if apariencia:
                redes_sociales = {
                    'facebook': apariencia.facebook_url,
                    'twitter': apariencia.twitter_url,
                    'instagram': apariencia.instagram_url,
                    'youtube': apariencia.youtube_url,
                }
            else:
                redes_sociales = {
                    'facebook': None,
                    'twitter': None,
                    'instagram': None,
                    'youtube': None,
                }
        except AppearanceSettings.DoesNotExist:
            redes_sociales = {
                'facebook': None,
                'twitter': None,
                'instagram': None,
                'youtube': None,
            }
        
        # Cachear por 60 minutos ya que raramente cambian
        cache.set(cache_key, redes_sociales, 3600)
    
    return {'redes_sociales': redes_sociales}