from flask import Flask
import sys
import os


def create_app():
    app = Flask(__name__)

    # Configuration
    sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)), ".."))
    import config
    app.config.from_object(config)

    # Logging
    from webserver.loggers import init_loggers
    init_loggers(app)

    # Database connection
    from db import init_db_connection
    init_db_connection(app.config['PG_CONNECT'])

    # Memcached
    if 'MEMCACHED_SERVERS' in app.config:
        from db import cache
        cache.init(app.config['MEMCACHED_SERVERS'],
                   app.config['MEMCACHED_NAMESPACE'],
                   debug=1 if app.debug else 0)

    # Extensions
    from flask_uuid import FlaskUUID
    FlaskUUID(app)

    # MusicBrainz
    import musicbrainzngs
    from db import SCHEMA_VERSION
    musicbrainzngs.set_useragent(app.config['MUSICBRAINZ_USERAGENT'], SCHEMA_VERSION)
    if app.config['MUSICBRAINZ_HOSTNAME']:
        musicbrainzngs.set_hostname(app.config['MUSICBRAINZ_HOSTNAME'])

    # Error handling
    from webserver.errors import init_error_handlers
    init_error_handlers(app)

    # Template utilities
    app.jinja_env.add_extension('jinja2.ext.do')
    from webserver import utils
    app.jinja_env.filters['date'] = utils.reformat_date
    app.jinja_env.filters['datetime'] = utils.reformat_datetime

    # Blueprints
    from webserver.views.index import index_bp
    from webserver.views.api import api_bp
    app.register_blueprint(index_bp)
    app.register_blueprint(api_bp)

    return app
