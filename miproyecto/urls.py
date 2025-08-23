from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include("colegio.urls")),
    path('noticias/', include("noticias.urls")),
    path('accounts/', include('django.contrib.auth.urls')),
    path('comunicados/', include('comunicados.urls')),
    path('fotos/', include("fotos.urls")),
    path('profesores/', include("profesores.urls")),
    path('contacto/', include("contacto.urls")),
    path('configuracion/', include("panel.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
