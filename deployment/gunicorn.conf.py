# gunicorn.conf.py — Production WSGI config for Render

import multiprocessing
import os

# Render sets $PORT dynamically
bind             = f"0.0.0.0:{os.getenv('PORT', '5000')}"
workers          = multiprocessing.cpu_count() * 2 + 1
worker_class     = "sync"
worker_connections = 1000
timeout          = 30
keepalive        = 2
max_requests     = 1000
max_requests_jitter = 50
preload_app      = True
accesslog        = "-"
errorlog         = "-"
loglevel         = "info"
