import axios from 'axios';
import { ethers } from 'ethers';

// Constants
const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
const NEWS_FEED_URL = 'https://cointelegraph.com/rss';
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

// News Service
export const fetchNewsArticles = async () => {
  try {
    const response = await axios.get(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(NEWS_FEED_URL)}`);
    
    if (response.data && response.data.items) {
      return response.data.items.map(item => ({
        id: item.guid || item.link,
        title: item.title,
        summary: item.description,
        link: item.link,
        published: new Date(item.pubDate),
        source: response.data.feed.title
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching news articles:', error);
    throw error;
  }
};

// AI Service
export const analyzeSentiment = async (articles) => {
  if (!OPENAI_API_KEY) {
    console.error('OpenAI API key is missing');
    throw new Error('OpenAI API key is missing');
  }
  
  if (!articles || articles.length === 0) {
    return [];
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
    
    return result.analyses.map(analysis => ({
      ...analysis,
      timestamp: new Date()
    }));
  });
};

export const generateTradingSignals = async (sentimentAnalyses) => {
  if (!OPENAI_API_KEY) {
    console.error('OpenAI API key is missing');
    throw new Error('OpenAI API key is missing');
  }
  
  if (!sentimentAnalyses || sentimentAnalyses.length === 0) {
    return [];
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
    
    return result.signals.map(signal => ({
      ...signal,
      timestamp: new Date()
    }));
  });
};

export const generateVisualization = async (tradingSignal) => {
  if (!OPENAI_API_KEY) {
    console.error('OpenAI API key is missing');
    throw new Error('OpenAI API key is missing');
  }
  
  if (!tradingSignal || tradingSignal.confidence < 0.6) {
    return null;
  }
  
  return retryOperation(async () => {
    const color = tradingSignal.signal_type === "buy" ? "green" : 
                 tradingSignal.signal_type === "sell" ? "red" : "yellow";
    
    const response = await axios.post(
      'https://api.openai.com/v1/images/generations',
      {
        model: "dall-e-3",
        prompt: `Create a professional cryptocurrency trading signal visualization for ${tradingSignal.cryptocurrency}.
        Signal type: ${tradingSignal.signal_type.toUpperCase()} (use ${color} color theme)
        Sentiment score: ${tradingSignal.sentiment_score.toFixed(2)}
        Confidence: ${tradingSignal.confidence.toFixed(2)}
        
        The image should:
        - Have a clean, professional financial/trading appearance
        - Include the cryptocurrency name and logo
        - Prominently display the ${tradingSignal.signal_type.toUpperCase()} signal
        - Use a ${color} color scheme to indicate the signal type
        - Include visual indicators of sentiment and confidence
        - Have a modern, digital aesthetic suitable for crypto trading
        
        Do NOT include any text explaining the reasoning - just the key metrics and signal.
        Make it visually appealing and suitable for sharing on social media.`,
        size: "1024x1024",
        quality: "standard",
        n: 1,
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.data[0].url;
  });
};

// Blockchain Service
export const getProvider = () => {
  return new ethers.JsonRpcProvider(POLYGON_AMOY_RPC);
};

export const getContract = (provider) => {
  return new ethers.Contract(CONTRACT_ADDRESS, SENTIMENT_TRACKER_ABI, provider);
};

export const getAllCryptocurrencies = async (provider) => {
  try {
    const contract = getContract(provider);
    return await contract.getAllCryptocurrencies();
  } catch (error) {
    console.error('Error getting all cryptocurrencies:', error);
    throw error;
  }
};

export const getSentiment = async (provider, cryptocurrency) => {
  try {
    const contract = getContract(provider);
    const data = await contract.getSentiment(cryptocurrency);
    
    return {
      sentiment: Number(data[0]) / 100, // Convert from int8 to float (-1.0 to 1.0)
      confidence: Number(data[1]) / 100, // Convert from uint8 to float (0.0 to 1.0)
      timestamp: new Date(Number(data[2]) * 1000) // Convert from seconds to milliseconds
    };
  } catch (error) {
    console.error(`Error getting sentiment for ${cryptocurrency}:`, error);
    throw error;
  }
};

export const getSentimentHistory = async (provider, cryptocurrency) => {
  try {
    const contract = getContract(provider);
    const history = await contract.getSentimentHistory(cryptocurrency);
    
    return history.map(record => ({
      sentiment: Number(record[0]) / 100, // Convert from int8 to float (-1.0 to 1.0)
      timestamp: new Date(Number(record[1]) * 1000) // Convert from seconds to milliseconds
    }));
  } catch (error) {
    console.error(`Error getting sentiment history for ${cryptocurrency}:`, error);
    throw error;
  }
};

export const recordSentiment = async (signer, cryptocurrency, sentimentScore, confidence) => {
  try {
    const contract = new ethers.Contract(CONTRACT_ADDRESS, SENTIMENT_TRACKER_ABI, signer);
    
    // Convert sentiment score to int8 (multiply by 100 to preserve 2 decimal places)
    const sentimentInt = Math.round(sentimentScore * 100);
    
    // Convert confidence to uint8 (multiply by 100 to preserve 2 decimal places)
    const confidenceInt = Math.round(confidence * 100);
    
    // Record the sentiment
    const tx = await contract.recordSentiment(cryptocurrency, sentimentInt, confidenceInt);
    
    // Wait for transaction to be mined
    await tx.wait();
    
    return tx.hash;
  } catch (error) {
    console.error(`Error recording sentiment for ${cryptocurrency}:`, error);
    throw error;
  }
};

export const getExplorerUrl = (address) => {
  return `${POLYGON_AMOY_EXPLORER}/${address}`;
};

export default {
  fetchNewsArticles,
  analyzeSentiment,
  generateTradingSignals,
  generateVisualization,
  getProvider,
  getContract,
  getAllCryptocurrencies,
  getSentiment,
  getSentimentHistory,
  recordSentiment,
  getExplorerUrl,
  TOP_CRYPTOCURRENCIES,
  CONTRACT_ADDRESS
}; 