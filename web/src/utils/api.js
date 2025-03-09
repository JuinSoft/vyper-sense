import axios from 'axios';
import { ethers } from 'ethers';
import { getCachedData, setCachedData, hasCachedData, clearCacheItem, clearCache } from './cacheService';
import { fetchAllRssArticles } from './rssService';
import { fetchCryptoMarketData, fetchCryptoHistory } from './liveCoinWatchApi';
import { getSymbolFromName } from './cryptoIcons';

// Constants
const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
const CONTRACT_ADDRESS = '0x22633574A82ffC4d5d88ccAb7887799c188544e3';
const POLYGON_AMOY_RPC = 'https://rpc-amoy.polygon.technology';
const POLYGON_AMOY_EXPLORER = 'https://www.oklink.com/amoy/address';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// ABI for the SentimentTracker contract
const SENTIMENT_TRACKER_ABI = [
  "function recordSentiment(string memory cryptocurrency, int8 sentiment, uint8 confidence) external",
  "function getSentiment(string memory cryptocurrency) external view returns (int8 sentiment, uint8 confidence, uint256 timestamp)",
  "function getAllCryptocurrencies() external view returns (string[] memory)",
  "function getSentimentHistory(string memory cryptocurrency) external view returns (tuple(int8 sentiment, uint256 timestamp)[] memory)",
  "function owner() external view returns (address)"
];

// Top cryptocurrencies to focus on
const TOP_CRYPTOCURRENCIES = [
  "Bitcoin", "Ethereum", "Solana", "BNB", "XRP", 
  "Cardano", "Avalanche", "Dogecoin", "Polkadot", "Polygon"
];

// Helper function to retry API calls
const retryOperation = async (operation, maxRetries = MAX_RETRIES, delay = RETRY_DELAY) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      lastError = error;
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

// News Service - Updated to use RSS service with caching
export const fetchNewsArticles = async () => {
  try {
    return await fetchAllRssArticles(20);
  } catch (error) {
    console.error('Error fetching news articles:', error);
    throw error;
  }
};

// AI Service - Updated to use caching
export const analyzeSentiment = async (articles) => {
  if (!OPENAI_API_KEY) {
    console.error('OpenAI API key is missing');
    throw new Error('OpenAI API key is missing');
  }
  
  if (!articles || articles.length === 0) {
    return [];
  }
  
  // Create a unique key based on article IDs
  const articleIds = articles.map(a => a.id).join('_');
  const cacheKey = `sentiment_analysis_${articleIds}`;
  
  // Check cache first
  if (hasCachedData(cacheKey)) {
    return getCachedData(cacheKey);
  }
  
  return retryOperation(async () => {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: `You are an expert cryptocurrency analyst with deep knowledge of market sentiment.
            Analyze each news article for sentiment regarding cryptocurrencies.
            For each article:
            1. Determine the overall sentiment (positive, negative, or neutral)
            2. Assign a sentiment score from -1.0 (very negative) to 1.0 (very positive)
            3. Identify which cryptocurrencies are mentioned
            4. Provide a brief summary of the sentiment analysis
            5. Assign a confidence score from 0.0 to 1.0 based on how clear the sentiment is
            
            Be precise and objective in your analysis. Focus on market implications rather than
            technological achievements unless they have clear market impact.`
          },
          {
            role: "user",
            content: `Analyze the sentiment of these cryptocurrency news articles: ${JSON.stringify(articles)}`
          }
        ],
        functions: [
          {
            name: "analyze_crypto_sentiment",
            description: "Analyze sentiment of cryptocurrency news articles",
            parameters: {
              type: "object",
              properties: {
                analyses: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      headline: {
                        type: "string",
                        description: "The news headline",
                      },
                      source: {
                        type: "string",
                        description: "Source of the article",
                      },
                      sentiment_score: {
                        type: "number",
                        description: "Sentiment score from -1.0 (negative) to 1.0 (positive)",
                      },
                      confidence: {
                        type: "number",
                        description: "Confidence in the sentiment analysis from 0.0 to 1.0",
                      },
                      entities: {
                        type: "array",
                        items: { type: "string" },
                        description: "Cryptocurrency entities mentioned in the article",
                      },
                      summary: {
                        type: "string",
                        description: "Brief summary of the sentiment analysis",
                      },
                    },
                    required: ["headline", "source", "sentiment_score", "confidence", "entities", "summary"],
                  },
                }
              },
              required: ["analyses"],
            }
          }
        ],
        function_call: { name: "analyze_crypto_sentiment" }
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const result = JSON.parse(response.data.choices[0].message.function_call.arguments);
    
    const analyses = result.analyses.map(analysis => ({
      ...analysis,
      timestamp: new Date(),
      // Add symbol for each entity for icon display
      entities: analysis.entities.map(entity => {
        if (typeof entity === 'object' && entity.name) {
          return {
            name: entity.name,
            symbol: entity.symbol || getSymbolFromName(entity.name) || entity.name
          };
        }
        return {
          name: entity,
          symbol: getSymbolFromName(entity) || entity
        };
      })
    }));
    
    // Cache the result
    setCachedData(cacheKey, analyses);
    
    return analyses;
  });
};

// Trading Signals - Updated to use caching
export const generateTradingSignals = async (sentimentAnalyses) => {
  if (!OPENAI_API_KEY) {
    console.error('OpenAI API key is missing');
    throw new Error('OpenAI API key is missing');
  }
  
  if (!sentimentAnalyses || sentimentAnalyses.length === 0) {
    return [];
  }
  
  // Create a unique key based on sentiment analysis timestamps
  const analysisTimes = sentimentAnalyses.map(a => a.timestamp?.getTime()).join('_');
  const cacheKey = `trading_signals_${analysisTimes}`;
  
  // Check cache first
  if (hasCachedData(cacheKey)) {
    return getCachedData(cacheKey);
  }
  
  return retryOperation(async () => {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: `You are an expert cryptocurrency trader who generates trading signals based on news sentiment.
            Focus on these top cryptocurrencies: ${TOP_CRYPTOCURRENCIES.join(', ')}.
            For each cryptocurrency that has significant sentiment data:
            1. Determine if the overall sentiment suggests a buy, sell, or hold signal
            2. Assign a confidence score from 0.0 to 1.0 based on the strength of the signal
            3. Calculate an overall sentiment score from -1.0 to 1.0
            4. Provide clear reasoning for the trading signal
            5. List the sources supporting this signal
            
            Be conservative with your signals - only suggest buy or sell when there is strong evidence.
            Otherwise, suggest hold. Consider both the sentiment score and confidence in your analysis.`
          },
          {
            role: "user",
            content: `Generate trading signals based on these sentiment analyses: ${JSON.stringify(sentimentAnalyses)}`
          }
        ],
        functions: [
          {
            name: "generate_trading_signals",
            description: "Generate trading signals based on sentiment analyses",
            parameters: {
              type: "object",
              properties: {
                signals: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      cryptocurrency: {
                        type: "string",
                        description: "Name of the cryptocurrency",
                      },
                      signal_type: {
                        type: "string",
                        description: "Type of trading signal: buy, sell, or hold",
                        enum: ["buy", "sell", "hold"]
                      },
                      confidence: {
                        type: "number",
                        description: "Confidence in the trading signal from 0.0 to 1.0",
                      },
                      sentiment_score: {
                        type: "number",
                        description: "Overall sentiment score from -1.0 to 1.0",
                      },
                      reasoning: {
                        type: "string",
                        description: "Reasoning behind the trading signal",
                      },
                      sources: {
                        type: "array",
                        items: { type: "string" },
                        description: "Sources supporting this trading signal",
                      },
                    },
                    required: ["cryptocurrency", "signal_type", "confidence", "sentiment_score", "reasoning", "sources"],
                  },
                }
              },
              required: ["signals"],
            }
          }
        ],
        function_call: { name: "generate_trading_signals" }
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const result = JSON.parse(response.data.choices[0].message.function_call.arguments);
    
    const signals = result.signals.map(signal => ({
      ...signal,
      timestamp: new Date(),
      // Add symbol for cryptocurrency for icon display
      symbol: getSymbolFromName(signal.cryptocurrency) || signal.cryptocurrency
    }));
    
    // Cache the result
    setCachedData(cacheKey, signals);
    
    return signals;
  });
};

// Fetch market data for cryptocurrencies
export const fetchMarketData = async (cryptos = TOP_CRYPTOCURRENCIES) => {
  try {
    // Convert crypto names to symbols
    const symbols = cryptos.map(crypto => getSymbolFromName(crypto) || crypto);
    
    // Fetch market data from LiveCoinWatch
    return await fetchCryptoMarketData(symbols);
  } catch (error) {
    console.error('Error fetching market data:', error);
    throw error;
  }
};

// Fetch historical data for a cryptocurrency
export const fetchHistoricalData = async (crypto, days = 30) => {
  try {
    const symbol = getSymbolFromName(crypto) || crypto;
    const end = Date.now();
    const start = end - (days * 24 * 60 * 60 * 1000);
    
    return await fetchCryptoHistory(symbol, 'USD', start, end, '1d');
  } catch (error) {
    console.error(`Error fetching historical data for ${crypto}:`, error);
    throw error;
  }
};

// Clear cache for specific data type
export const refreshData = (dataType) => {
  switch (dataType) {
    case 'news':
      // Clear all RSS feed caches
      clearCacheItem('rss_all_feeds');
      break;
    case 'sentiment':
      // Clear sentiment analysis cache
      clearCacheItem('sentiment_analysis');
      break;
    case 'signals':
      // Clear trading signals cache
      clearCacheItem('trading_signals');
      break;
    case 'market':
      // Clear market data cache
      clearCacheItem('lcw_market');
      clearCacheItem('lcw_overview');
      break;
    case 'all':
      // Clear all caches
      clearCache();
      break;
    default:
      break;
  }
};

// Web3 Provider
export const getProvider = () => {
  return new ethers.JsonRpcProvider(POLYGON_AMOY_RPC);
};

// Contract instance
export const getContract = (provider) => {
  return new ethers.Contract(CONTRACT_ADDRESS, SENTIMENT_TRACKER_ABI, provider);
};

// Get all cryptocurrencies from the contract
export const getAllCryptocurrencies = async (provider) => {
  const contract = getContract(provider);
  try {
    return await contract.getAllCryptocurrencies();
  } catch (error) {
    console.error('Error getting all cryptocurrencies:', error);
    return [];
  }
};

// Get sentiment for a cryptocurrency
export const getSentiment = async (provider, cryptocurrency) => {
  const contract = getContract(provider);
  try {
    const [sentiment, confidence, timestamp] = await contract.getSentiment(cryptocurrency);
    return {
      sentiment: Number(sentiment),
      confidence: Number(confidence),
      timestamp: new Date(Number(timestamp) * 1000)
    };
  } catch (error) {
    console.error(`Error getting sentiment for ${cryptocurrency}:`, error);
    return null;
  }
};

// Get sentiment history for a cryptocurrency
export const getSentimentHistory = async (provider, cryptocurrency) => {
  const contract = getContract(provider);
  try {
    const history = await contract.getSentimentHistory(cryptocurrency);
    return history.map(item => ({
      sentiment: Number(item.sentiment),
      timestamp: new Date(Number(item.timestamp) * 1000)
    }));
  } catch (error) {
    console.error(`Error getting sentiment history for ${cryptocurrency}:`, error);
    return [];
  }
};

// Record sentiment for a cryptocurrency
export const recordSentiment = async (signer, cryptocurrency, sentimentScore, confidence) => {
  const contract = new ethers.Contract(CONTRACT_ADDRESS, SENTIMENT_TRACKER_ABI, signer);
  
  try {
    // Convert sentiment score from -1.0 to 1.0 range to -100 to 100 range
    const sentimentInt = Math.round(sentimentScore * 100);
    
    // Convert confidence from 0.0 to 1.0 range to 0 to 100 range
    const confidenceInt = Math.round(confidence * 100);
    
    const tx = await contract.recordSentiment(cryptocurrency, sentimentInt, confidenceInt);
    return await tx.wait();
  } catch (error) {
    console.error(`Error recording sentiment for ${cryptocurrency}:`, error);
    throw error;
  }
};

// Get explorer URL for an address
export const getExplorerUrl = (address) => {
  return `${POLYGON_AMOY_EXPLORER}/${address}`;
};

// Default export
const apiService = {
  fetchNewsArticles,
  analyzeSentiment,
  generateTradingSignals,
  fetchMarketData,
  fetchHistoricalData,
  refreshData,
  getProvider,
  getContract,
  getAllCryptocurrencies,
  getSentiment,
  getSentimentHistory,
  recordSentiment,
  getExplorerUrl
};

export default apiService; 