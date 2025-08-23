import os
from dotenv import load_dotenv
from urllib.parse import urlparse, parse_qsl
import pymysql
pymysql.install_as_MySQLdb()


load_dotenv()

# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('SECRET_KEY', '7kae9_b8b#_m-g)o1hp7i=ojuwuqlslecj0kliqf(wgatzp3k=')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['escuelatorreblanca.cl', 'www.escuelatorreblanca.cl' ,'*']

# Email configuration
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'mail.escuelatorreblanca.cl'
EMAIL_PORT = 465
EMAIL_USE_SSL = True  # Puerto 465 requiere SSL
EMAIL_USE_TLS = False  # No usar TLS con SSL
EMAIL_HOST_USER = 'admin@escuelatorreblanca.cl' # Debe ser admin@escuelatorreblanca.cl
EMAIL_HOST_PASSWORD = 'colegio2016'
DEFAULT_FROM_EMAIL = 'admin@escuelatorreblanca.cl'

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'colegio',
    'noticias',
    'comunicados',
    'fotos',
    'profesores',
    'contacto',
    'panel',
    'compressor',
]

CRISPY_ALLOWED_TEMPLATE_PACKS = "bootstrap5"

CRISPY_TEMPLATE_PACK = "bootstrap5"

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # DEBE SER EL PRIMERO
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'miproyecto.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            os.path.join(BASE_DIR, 'templates'),
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'debug': DEBUG,
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'miproyecto.context_processors.datos_globales',
                'colegio.context_processors.menu_items_processor',
                'colegio.context_processors.redes_sociales_processor',
            ],
        },
    },
]

WSGI_APPLICATION = 'miproyecto.wsgi.application'


# Database
# https://docs.djangoproject.com/en/3.0/ref/settings/#databases

# Replace the DATABASES section of your settings.py with this
tmpPostgres = urlparse(os.getenv("DATABASE_URL", ""))

# DATABASES = {
#      'default': {
#          'ENGINE': 'django.db.backends.mysql',
#          'NAME': 'escuelat_torreblanca',
#          'USER': 'escuelat_admin',
#          'PASSWORD': 'jueves1189@',
#          'HOST': 'escuelatorreblanca.cl',
#          'PORT': '3306',
#          'OPTIONS': { 
#             'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
#             'charset': 'utf8mb4',

#         }
#      }
#  }

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
    }
}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Password validation
# https://docs.djangoproject.com/en/3.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/3.0/topics/i18n/

LANGUAGE_CODE = 'es-cl'

TIME_ZONE = 'America/Santiago'

USE_I18N = True

USE_L10N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/3.0/howto/static-files/


STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')  # Directorio donde se recopilarán todos los archivos

# Directorios adicionales donde Django buscará archivos estáticos
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'static'),
]

# Configuración de WhiteNoise para mejorar el rendimiento
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Finders de archivos estáticos estándar
STATICFILES_FINDERS = [ 
    'django.contrib.staticfiles.finders.FileSystemFinder',
    'django.contrib.staticfiles.finders.AppDirectoriesFinder',
        'compressor.finders.CompressorFinder',

]


#path donde es redirigido al momento de entrar y salir de la página web
LOGIN_REDIRECT_URL = 'inicio'
LOGOUT_REDIRECT_URL = 'inicio'


# Cargar variables de entorno para OpenAI
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')



# Configuración para archivos multimedia
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Configuración para manejo de archivos
FILE_UPLOAD_HANDLERS = [
    'django.core.files.uploadhandler.MemoryFileUploadHandler',
    'django.core.files.uploadhandler.TemporaryFileUploadHandler',
]

# Tamaño máximo de archivo (5MB)
MAX_UPLOAD_SIZE = 5242880


COMPRESS_ENABLED = True

COMPRESS_OFFLINE = True


# Configuración de codificación de caracteres
# Asegurarse de que la codificación de caracteres sea UTF-8
DEFAULT_CHARSET = 'utf-8'


# Django REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.BasicAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.FormParser',
        'rest_framework.parsers.MultiPartParser',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# CORS Configuration
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://escuelatorreblanca.cl",
    "https://www.escuelatorreblanca.cl",
    "https://torreblanca-react.vercel.app",
    "https://torreblanca-react-git-main-tomas-salgados-projects.vercel.app",
]

CORS_ALLOW_CREDENTIALS = True

# En desarrollo, puedes usar esto para permitir todos los orígenes (NO usar en producción)
# CORS_ALLOW_ALL_ORIGINS = True

