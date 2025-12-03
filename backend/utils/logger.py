import logging
from logging.handlers import TimedRotatingFileHandler
import os
from datetime import datetime

def setup_logging(app):
    """
    Configure logging for the application with daily log files
    Each day creates a new log file named YYYY-MM-DD.log
    """
    # Create logs directory if it doesn't exist
    log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'logs')
    os.makedirs(log_dir, exist_ok=True)
    
    # Create formatter
    formatter = logging.Formatter(
        '[%(asctime)s] %(levelname)s in %(module)s (%(funcName)s:%(lineno)d): %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Daily log file with YYYY-MM-DD.log format
    today = datetime.now().strftime('%Y-%m-%d')
    log_file = os.path.join(log_dir, f'{today}.log')
    
    # File handler - creates new file each day
    file_handler = TimedRotatingFileHandler(
        filename=log_file,
        when='midnight',
        interval=1,
        backupCount=30,  # Keep 30 days of logs
        encoding='utf-8'
    )
    # Set the suffix to empty since we're already using YYYY-MM-DD.log format
    file_handler.suffix = ''
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(formatter)
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(formatter)
    
    # Configure app logger
    app.logger.setLevel(logging.INFO)
    app.logger.addHandler(file_handler)
    app.logger.addHandler(console_handler)
    
    # Log startup
    app.logger.info('='*50)
    app.logger.info('Application starting up')
    app.logger.info(f'Log directory: {log_dir}')
    app.logger.info(f'Log file: {today}.log')
    app.logger.info('='*50)
    
    return app.logger
