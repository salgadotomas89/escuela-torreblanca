
from . import views
from django.urls import path

urlpatterns = [
    path('', views.configuracion, name='configuracion'),

    path('configuracion/calendario', views.calendario_configuracion, name='calendario_configuracion'),
    path('configuracion/redes-sociales', views.configuracion_redes_sociales, name='configuracion_redes_sociales'),
    path('config', views.config, name='config'),
    path('eliminar_asignatura_de_curso/', views.eliminar_asignatura_de_curso, name='eliminar_asignatura_de_curso'),
    path('guardar_asignatura', views.guardar_asignatura, name="guardar_asignatura"),
    path('guardar_curso', views.guardar_curso, name="guardar_curso"),
    path('asignar_asignaturas', views.asignar_asignaturas, name="asignar_asignaturas"),

    path('obtener_profesor_jefe', views.obtener_profesor_jefe, name='obtener_profesor_jefe'),
    path('obtener_usuarios_disponibles', views.obtener_usuarios_disponibles, name='obtener_usuarios_disponibles'),
    path('usuarios', views.usuarios, name="usuarios"),
    path('cursos', views.cursos, name='cursos'),
    path('asignar_profesor_jefe', views.asignar_profesor_jefe, name="asignar_profesor_jefe"),
    path('quitar_profesor_jefe', views.quitar_profesor_jefe, name="quitar_profesor_jefe"),
    path('ajustes', views.ajustes, name='ajustes'),

    path('asignaturas', views.asignaturas, name="asignaturas"),


    path('obtener_asignaturas', views.obtener_asignaturas, name="obtener_asignaturas"),
    path('eliminar_asignatura', views.eliminar_asignatura, name="eliminar_asignatura"),
    path('asignar_profesor_asignatura', views.asignar_profesor_asignatura, name="asignar_profesor_asignatura"),
    

    path('dame_asignatura', views.dame_asignatura, name="dame_asignatura"),

    
    path('apariencia', views.apariencia, name="apariencia"),
    
    # URLs para Hero Settings
    path('hero/', views.hero_settings, name='hero_settings'),
    
    path('menu', views.menu, name="menu"),

    path('actualizar/', views.actualizar_nombre_colegio, name='actualizar_nombre_colegio'),
    path('actualizar-email/', views.actualizar_email_colegio, name='actualizar_email_colegio'),
    path('actualizar-direccion/', views.actualizar_direccion_colegio, name='actualizar_direccion_colegio'),
    path('actualizar-telefono/', views.actualizar_telefono_colegio, name='actualizar_telefono_colegio'),
    path('actualizar-horario/', views.actualizar_horario_colegio, name='actualizar_horario_colegio'),
    path('actualizar-whatsapp/', views.actualizar_whatsapp_colegio, name='actualizar_whatsapp_colegio'),
    path('actualizar-logo/', views.actualizar_logo_colegio, name='actualizar_logo_colegio'),
    path('eliminar-logo/', views.eliminar_logo_colegio, name='eliminar_logo_colegio'),
    path('actualizar-pais/', views.actualizar_pais_colegio, name='actualizar_pais_colegio'),
    path('actualizar-region/', views.actualizar_region_colegio, name='actualizar_region_colegio'),

    # URLs para Preguntas Frecuentes
    path('preguntas-frecuentes/', views.preguntas_frecuentes, name='preguntas_frecuentes'),
    path('guardar-pregunta/', views.crear_pregunta_frecuente, name='guardar_pregunta'),
    path('obtener-pregunta/<int:pregunta_id>/', views.obtener_pregunta_frecuente, name='obtener_pregunta'),
    path('actualizar-pregunta/', views.actualizar_pregunta_frecuente, name='actualizar_pregunta'),
    path('eliminar-pregunta/', views.eliminar_pregunta_frecuente, name='eliminar_pregunta'),

    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('auth_div/', views.auth_div, name='auth_div'),

    # Agregar esta URL
    path('registro/usuario/', views.registro_usuario, name='registro_usuario'),

    path('reset-password/', views.reset_password, name='reset_password'),
    path('eliminar-usuario/', views.eliminar_usuario, name='eliminar_usuario'),
    path('cambiar-rol/', views.cambiar_rol, name='cambiar_rol'),
    path('obtener-roles-usuario/<int:usuario_id>/', views.obtener_roles_usuario, name='obtener_roles_usuario'),
    path('toggle-superuser/', views.toggle_superuser, name='toggle_superuser'),
    path('usuario-detalles/<int:user_id>/', views.usuario_detalles, name='usuario_detalles'),

    path('perfil_usuario/', views.perfil_usuario, name='perfil_usuario'),

    # Agregar estas URLs
    path('actualizar-nombre-usuario/', views.actualizar_nombre_usuario, name='actualizar_nombre_usuario'),
    path('actualizar-apellido-usuario/', views.actualizar_apellido_usuario, name='actualizar_apellido_usuario'),
    path('actualizar-email-usuario/', views.actualizar_email_usuario, name='actualizar_email_usuario'),
    path('actualizar-foto-usuario/', views.actualizar_foto_usuario, name='actualizar_foto_usuario'),
    path('actualizar-password-usuario/', views.actualizar_password_usuario, name='actualizar_password_usuario'),

    # Agregar estas nuevas URLs en urlpatterns
    path('menu/item/create/', views.crear_menu_item, name='crear_menu_item'),
    path('menu/item/<int:item_id>/', views.obtener_menu_item, name='obtener_menu_item'),
    path('menu/item/<int:item_id>/update/', views.actualizar_menu_item, name='actualizar_menu_item'),
    path('menu/item/<int:item_id>/delete/', views.eliminar_menu_item, name='eliminar_menu_item'),
    

    # URLs para preguntas frecuentes
    path('pregunta-frecuente/crear/', views.crear_pregunta_frecuente, name='crear_pregunta_frecuente'),
    path('pregunta-frecuente/<int:pregunta_id>/', views.obtener_pregunta_frecuente, name='obtener_pregunta_frecuente'),
    path('pregunta-frecuente/actualizar/', views.actualizar_pregunta_frecuente, name='actualizar_pregunta_frecuente'),
    path('pregunta-frecuente/eliminar/', views.eliminar_pregunta_frecuente, name='eliminar_pregunta_frecuente'),

    # URL para configuración de IA
    path('suscripcion-ia/', views.suscripcion_ia, name='suscripcion_ia'),
    path('obtener_asignaturas_disponibles', views.obtener_asignaturas_disponibles, name="obtener_asignaturas_disponibles"),

]
