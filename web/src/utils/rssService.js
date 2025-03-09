import axios from 'axios';
import { getCachedData, setCachedData, hasCachedData, clearCacheItem } from './cacheService';

// Default RSS feeds
const DEFAULT_RSS_FEEDS = [
  {
    id: 'cointelegraph',
    name: 'CoinTelegraph',
    url: process.env.REACT_APP_NEWS_FEED_URL_COINTELEGRAPH || 'https://cointelegraph.com/rss',
  },
  {
    id: 'bitcoinmagazine',
    name: 'Bitcoin Magazine',
    url: process.env.REACT_APP_NEWS_FEED_URL_BITCOINMAGAZINE || 'https://bitcoinmagazine.com/feed',
  },
  {
    id: 'bitcoinist',
    name: 'Bitcoinist',
    url: process.env.REACT_APP_NEWS_FEED_URL_BITCOINIST || 'https://bitcoinist.com/feed/',
  },
  {
    id: 'newsbtc',
    name: 'NewsBTC',
    url: process.env.REACT_APP_NEWS_FEED_URL_NEWSBTC || 'https://www.newsbtc.com/feed',
  },
];

// Get RSS feeds from localStorage or use defaults
export const getRssFeeds = () => {
  try {
    const savedFeeds = localStorage.getItem('rssFeeds');
    if (savedFeeds) {
      return JSON.parse(savedFeeds);
    }
  } catch (error) {
    console.error('Error getting RSS feeds from localStorage:', error);
  }
  
  return DEFAULT_RSS_FEEDS;
};

// Save RSS feeds to localStorage
export const saveRssFeeds = (feeds) => {
  try {
    localStorage.setItem('rssFeeds', JSON.stringify(feeds));
  } catch (error) {
    console.error('Error saving RSS feeds to localStorage:', error);
  }
};

// Add a new RSS feed
export const addRssFeed = (feed) => {
  const feeds = getRssFeeds();
  
  // Check if feed already exists
  const existingFeedIndex = feeds.findIndex(f => f.id === feed.id || f.url === feed.url);
  
  if (existingFeedIndex >= 0) {
    // Update existing feed
    feeds[existingFeedIndex] = feed;
  } else {
    // Add new feed
    feeds.push(feed);
  }
  
  saveRssFeeds(feeds);
  return feeds;
};

// Remove an RSS feed
export const removeRssFeed = (feedId) => {
  const feeds = getRssFeeds();
  const updatedFeeds = feeds.filter(feed => feed.id !== feedId);
  saveRssFeeds(updatedFeeds);
  return updatedFeeds;
};

/**
 * Fetch articles from a single RSS feed using rss2json API
 * @param {Object} feed - RSS feed object with url and name
 * @returns {Promise<Array>} - Array of articles
 */
export const fetchFeedArticles = async (feed) => {
  const cacheKey = `rss_feed_${feed.id}`;
  
  // Clear the cache to ensure we get fresh data
  clearCacheItem(cacheKey);
  
  try {
    // Use rss2json.com API to convert RSS to JSON
    const response = await axios.get(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`);
    
    if (!response.data || response.data.status !== 'ok') {
      throw new Error(`Failed to fetch RSS feed: ${feed.url}`);
    }
    
    const articles = response.data.items.map(item => ({
      id: item.guid || item.link,
      title: item.title,
      summary: item.description,
      link: item.link,
      published: new Date(item.pubDate),
      source: feed.name,
      imageUrl: item.thumbnail || item.enclosure?.url || null,
    }));
    
    // Cache the result
    setCachedData(cacheKey, articles);
    
    return articles;
  } catch (error) {
    console.error(`Error fetching RSS feed ${feed.name}:`, error);
    return [];
  }
};

/**
 * Fetch articles from all configured RSS feeds
 * @param {number} limit - Maximum number of articles to return per feed
 * @returns {Promise<Array>} - Array of articles from all feeds
 */
export const fetchAllRssArticles = async (limit = 10) => {
  const feeds = getRssFeeds();
  const cacheKey = `rss_all_feeds_${feeds.map(f => f.id).join('_')}_${limit}`;
  
  // Clear the cache to ensure we get fresh data
  clearCacheItem(cacheKey);
  
  try {
    // Fetch articles from all feeds in parallel
    const articlesPromises = feeds.map(feed => fetchFeedArticles(feed));
    const articlesArrays = await Promise.all(articlesPromises);
    
    // Flatten and sort by date (newest first)
    const allArticles = articlesArrays
      .flat()
      .sort((a, b) => b.published - a.published)
      .slice(0, limit);
    
    // Cache the result
    setCachedData(cacheKey, allArticles);
    
    return allArticles;
  } catch (error) {
    console.error('Error fetching all RSS feeds:', error);
    return [];
  }
}; 