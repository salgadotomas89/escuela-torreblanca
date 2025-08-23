import os

# Server socket
bind = "0.0.0.0:10000"
backlog = 2048

# Worker processes
workers = 1
worker_class = "sync"
worker_connections = 1000
timeout = 120
keepalive = 2

# Restart workers after this many requests, to help prevent memory leaks
max_requests = 1000
max_requests_jitter = 100

# Preload app for better performance
preload_app = True

# Use tmpfs for worker temporary directory (if available)
worker_tmp_dir = "/dev/shm"

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"

# Process naming
proc_name = "miproyecto"

# Graceful timeout
graceful_timeout = 30

# Limit request line size
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190
