import axios from 'axios';
import { getCachedData, setCachedData, hasCachedData } from './cacheService';

// LiveCoinWatch API base URL
const LCW_API_BASE_URL = 'https://api.livecoinwatch.com';

// API key should be stored in .env file
const LCW_API_KEY = process.env.REACT_APP_LCW_API_KEY;

// Create axios instance with default headers
const lcwAxios = axios.create({
  baseURL: LCW_API_BASE_URL,
  headers: {
    'content-type': 'application/json',
    'x-api-key': LCW_API_KEY,
  },
});

/**
 * Fetch overview data for multiple cryptocurrencies
 * @param {string[]} codes - Array of cryptocurrency codes (e.g., ['BTC', 'ETH'])
 * @param {string} currency - Currency to convert to (default: 'USD')
 * @returns {Promise<Array>} - Array of cryptocurrency data
 */
export const fetchCryptoOverview = async (codes = [], currency = 'USD') => {
  const cacheKey = `lcw_overview_${codes.join('_')}_${currency}`;
  
  // Check cache first
  if (hasCachedData(cacheKey)) {
    return getCachedData(cacheKey);
  }
  
  try {
    const response = await lcwAxios.post('/coins/list', {
      currency,
      sort: 'rank',
      order: 'ascending',
      offset: 0,
      limit: 50,
      meta: true,
    });
    
    let result = response.data;
    
    // Filter by codes if provided
    if (codes.length > 0) {
      result = result.filter(coin => codes.includes(coin.code));
    }
    
    // Cache the result
    setCachedData(cacheKey, result);
    
    return result;
  } catch (error) {
    console.error('Error fetching crypto overview:', error);
    throw error;
  }
};

/**
 * Fetch single cryptocurrency data
 * @param {string} code - Cryptocurrency code (e.g., 'BTC')
 * @param {string} currency - Currency to convert to (default: 'USD')
 * @returns {Promise<Object>} - Cryptocurrency data
 */
export const fetchCryptoData = async (code, currency = 'USD') => {
  const cacheKey = `lcw_crypto_${code}_${currency}`;
  
  // Check cache first
  if (hasCachedData(cacheKey)) {
    return getCachedData(cacheKey);
  }
  
  try {
    const response = await lcwAxios.post('/coins/single', {
      currency,
      code,
      meta: true,
    });
    
    // Cache the result
    setCachedData(cacheKey, response.data);
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching data for ${code}:`, error);
    throw error;
  }
};

/**
 * Fetch cryptocurrency history
 * @param {string} code - Cryptocurrency code (e.g., 'BTC')
 * @param {string} currency - Currency to convert to (default: 'USD')
 * @param {string} start - Start timestamp in milliseconds
 * @param {string} end - End timestamp in milliseconds
 * @param {string} interval - Interval (e.g., '1d', '1h', '15m')
 * @returns {Promise<Array>} - Array of historical data points
 */
export const fetchCryptoHistory = async (code, currency = 'USD', start, end, interval = '1d') => {
  const cacheKey = `lcw_history_${code}_${currency}_${start}_${end}_${interval}`;
  
  // Check cache first
  if (hasCachedData(cacheKey)) {
    return getCachedData(cacheKey);
  }
  
  try {
    const response = await lcwAxios.post('/coins/single/history', {
      currency,
      code,
      start,
      end,
      interval,
    });
    
    // Cache the result
    setCachedData(cacheKey, response.data);
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching history for ${code}:`, error);
    throw error;
  }
};

/**
 * Fetch cryptocurrency market data with delta changes
 * @param {string[]} codes - Array of cryptocurrency codes (e.g., ['BTC', 'ETH'])
 * @param {string} currency - Currency to convert to (default: 'USD')
 * @returns {Promise<Array>} - Array of cryptocurrency market data
 */
export const fetchCryptoMarketData = async (codes = [], currency = 'USD') => {
  const cacheKey = `lcw_market_${codes.join('_')}_${currency}`;
  
  // Check cache first
  if (hasCachedData(cacheKey)) {
    return getCachedData(cacheKey);
  }
  
  try {
    const response = await lcwAxios.post('/coins/list', {
      currency,
      sort: 'rank',
      order: 'ascending',
      offset: 0,
      limit: 50,
      meta: true,
      delta: '24h',
    });
    
    let result = response.data;
    
    // Filter by codes if provided
    if (codes.length > 0) {
      result = result.filter(coin => codes.includes(coin.code));
    }
    
    // Cache the result
    setCachedData(cacheKey, result);
    
    return result;
  } catch (error) {
    console.error('Error fetching crypto market data:', error);
    throw error;
  }
}; 