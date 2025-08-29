try:
    from . import azure_provider
except ImportError as e:
    print(f"Warning: Could not import azure_provider: {e}")
