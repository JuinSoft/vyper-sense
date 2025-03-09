import os
from dotenv import load_dotenv
from pathlib import Path


root_dir = Path(__file__).parent.parent
load_dotenv(root_dir / ".env")


def get_required_env_var(var_name):
    var = os.getenv(var_name)
    if not var:
        raise ValueError(f"{var_name} must be set in .env file")
    return var


# News feed configuration
FEED_URL = os.getenv("FEED_URL", "https://cointelegraph.com/rss")
CRYPTO_NEWS_API_KEY = os.getenv("CRYPTO_NEWS_API_KEY", "")

# OpenAI configuration
OPENAI_API_KEY = get_required_env_var("OPEN_AI_KEY")

# Twitter API configuration
TWITTER_API_KEY = os.getenv("TWITTER_API_KEY", "")
TWITTER_API_SECRET = os.getenv("TWITTER_API_SECRET", "")
TWITTER_ACCESS_TOKEN = os.getenv("TWITTER_ACCESS_TOKEN", "")
TWITTER_ACCESS_SECRET = os.getenv("TWITTER_ACCESS_SECRET", "")
TWITTER_BEARER_TOKEN = os.getenv("TWITTER_BEARER_TOKEN", "")

# Blockchain configuration
POLYGONSCAN_TOKEN = os.getenv("POLYGONSCAN_TOKEN", "")
BLOCKSCOUT_POLYGON_KEY = os.getenv("BLOCKSCOUT_POLYGON_KEY", "")

# Application configuration
TOP_CRYPTOCURRENCIES = [
    "Bitcoin", "Ethereum", "Solana", "BNB", "XRP", 
    "Cardano", "Avalanche", "Dogecoin", "Polkadot", "Polygon"
]

# Polling interval in seconds
POLLING_INTERVAL = 3600  # 1 hour 