import logging
import tweepy
from typing import Optional

logger = logging.getLogger(__name__)


class TwitterService:
    def __init__(self, api_key: str, api_secret: str, access_token: str, access_secret: str):
        """
        Initialize the Twitter service
        
        Args:
            api_key: Twitter API key
            api_secret: Twitter API secret
            access_token: Twitter access token
            access_secret: Twitter access token secret
        """
        self.api_key = api_key
        self.api_secret = api_secret
        self.access_token = access_token
        self.access_secret = access_secret
        self.client = None
        self.initialize_client()
        
    def initialize_client(self):
        """Initialize the Twitter client"""
        try:
            auth = tweepy.OAuth1UserHandler(
                self.api_key, 
                self.api_secret,
                self.access_token,
                self.access_secret
            )
            self.client = tweepy.API(auth)
            logger.info("Twitter client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Twitter client: {str(e)}")
            self.client = None
            
    def post_tweet(self, text: str, image_url: Optional[str] = None) -> bool:
        """
        Post a tweet with optional image
        
        Args:
            text: Tweet text
            image_url: URL of image to include (optional)
            
        Returns:
            True if successful, False otherwise
        """
        try:
            if not self.client:
                self.initialize_client()
                if not self.client:
                    return False
                    
            # Ensure text is within Twitter's character limit
            if len(text) > 280:
                text = text[:277] + "..."
                
            if image_url:
                # Download and upload the image
                import requests
                import tempfile
                import os
                
                # Create a temporary file for the image
                with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as temp_file:
                    temp_path = temp_file.name
                    
                try:
                    # Download the image
                    response = requests.get(image_url)
                    response.raise_for_status()
                    
                    # Save the image to the temporary file
                    with open(temp_path, "wb") as f:
                        f.write(response.content)
                    
                    # Upload the image and post the tweet
                    media = self.client.media_upload(temp_path)
                    self.client.update_status(status=text, media_ids=[media.media_id])
                    
                    logger.info("Successfully posted tweet with image")
                    return True
                    
                finally:
                    # Clean up the temporary file
                    if os.path.exists(temp_path):
                        os.remove(temp_path)
            else:
                # Post text-only tweet
                self.client.update_status(status=text)
                logger.info("Successfully posted text tweet")
                return True
                
        except Exception as e:
            logger.error(f"Failed to post tweet: {str(e)}")
            return False 