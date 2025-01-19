import logging

# vc settings 
def setup_logger():
    logger = logging.getLogger(__name__)
    
    if not logger.handlers:
        console_handler = logging.StreamHandler()
        file_handler = logging.FileHandler('app.log')
        
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s'
        )
        
        console_handler.setFormatter(formatter)
        file_handler.setFormatter(formatter)

        logger.addHandler(console_handler)
        logger.addHandler(file_handler)
        
        logger.setLevel(logging.INFO)
    
    return logger