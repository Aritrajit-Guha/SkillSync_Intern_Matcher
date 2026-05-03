import os


class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "change-me")
    RECOMMENDATION_TOP_N = int(os.getenv("RECOMMENDATION_TOP_N", 5))
    MIN_MATCH_SCORE = int(os.getenv("MIN_MATCH_SCORE", 10))
    NEAR_MISS_GAP_THRESHOLD = int(os.getenv("NEAR_MISS_GAP_THRESHOLD", 2))
    ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False


config_map = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
}


def get_config():
    env = os.getenv("FLASK_ENV", "development")
    return config_map.get(env, DevelopmentConfig)
