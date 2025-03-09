import feedparser
import logging
from datetime import datetime
from typing import List, Dict, Any

logger = logging.getLogger(__name__)


class NewsService:
    def __init__(self, feed_url: str):
        self.feed_url = feed_url
        self.processed_ids = set()

    def poll_feed(self) -> List[Dict[str, Any]]:
        """
        Poll the RSS feed for new cryptocurrency news articles
        
        Returns:
            List of dictionaries containing article information
        """
        try:
            feed = feedparser.parse(self.feed_url)
            new_items = []
            
            if not feed.entries:
                logger.error("No news items found in the feed")
                return []

            for entry in feed.entries:
                if entry.id in self.processed_ids:
                    continue

                try:
                    # Extract publication date
                    if hasattr(entry, 'published_parsed'):
                        pub_date = datetime(*entry.published_parsed[:6])
                    else:
                        pub_date = datetime.now()
                    
                    # Create article data
                    article = {
                        'id': entry.id,
                        'title': entry.title,
                        'summary': entry.summary if hasattr(entry, 'summary') else "",
                        'link': entry.link,
                        'published': pub_date,
                        'source': feed.feed.title if hasattr(feed, 'feed') and hasattr(feed.feed, 'title') else "Unknown"
                    }
                    
                    logger.info(f"New article: {entry.title}")
                    self.processed_ids.add(entry.id)
                    new_items.append(article)
                    
                except Exception as e:
                    logger.error(f"Error parsing entry: {str(e)}")
                    continue

            return new_items

        except Exception as e:
            logger.error(f"Error polling news feed: {str(e)}")
            return [] 