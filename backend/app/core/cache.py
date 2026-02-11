import diskcache
import hashlib
import json
import logging
from functools import wraps
from typing import Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

class CacheManager:
    _cache: Optional[diskcache.Cache] = None

    @classmethod
    def get_cache(cls) -> diskcache.Cache:
        if cls._cache is None:
            cls._cache = diskcache.Cache(settings.cache_dir)
        return cls._cache

    @classmethod
    def generate_key(cls, domain: str, task: str, payload: Any) -> str:
        """Generate a unique cache key based on domain, task, and input payload."""
        payload_str = json.dumps(payload, sort_keys=True)
        hash_val = hashlib.sha256(payload_str.encode()).hexdigest()
        return f"{domain}:{task}:{hash_val}"

    @classmethod
    def get(cls, key: str) -> Optional[Any]:
        if not settings.enable_caching:
            return None
        return cls.get_cache().get(key)

    @classmethod
    def set(cls, key: str, value: Any, expire: int = 3600):
        if not settings.enable_caching:
            return
        cls.get_cache().set(key, value, expire=expire)

def cache_ai_response(domain: str, expire: int = 3600):
    """Decorator for caching AI service responses."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            if not settings.enable_caching:
                return func(*args, **kwargs)
            
            # Simple key generation based on args
            key_input = {"args": args[1:], "kwargs": kwargs} # Skip self/cls if present
            key = CacheManager.generate_key(domain, func.__name__, key_input)
            
            cached_val = CacheManager.get(key)
            if cached_val is not None:
                logger.info(f"Cache HIT for {domain}:{func.__name__}")
                return cached_val
            
            logger.info(f"Cache MISS for {domain}:{func.__name__}")
            result = func(*args, **kwargs)
            CacheManager.set(key, result, expire=expire)
            return result
        return wrapper
    return decorator
