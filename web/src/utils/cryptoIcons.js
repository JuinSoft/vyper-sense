/**
 * Utility for handling cryptocurrency icons using the cryptocurrency-icons package
 */

// Import default icon for fallback
import defaultIcon from 'cryptocurrency-icons/svg/color/generic.svg';

/**
 * Get cryptocurrency icon path
 * @param {string} symbol - Cryptocurrency symbol (e.g., 'BTC', 'ETH')
 * @param {string} type - Icon type ('color' or 'black')
 * @param {string} format - Icon format ('svg' or 'png')
 * @returns {string} - Path to the cryptocurrency icon
 */
export const getCryptoIconPath = (symbol, type = 'color', format = 'svg') => {
  if (!symbol) return defaultIcon;
  
  const normalizedSymbol = symbol.toLowerCase();
  
  try {
    // Dynamic import to get the icon
    return require(`cryptocurrency-icons/${format}/${type}/${normalizedSymbol}.${format}`);
  } catch (error) {
    // If icon not found, return default icon
    return defaultIcon;
  }
};

/**
 * Get cryptocurrency icon component
 * @param {string} symbol - Cryptocurrency symbol (e.g., 'BTC', 'ETH')
 * @param {Object} props - Additional props for the img element
 * @returns {JSX.Element} - Image element with the cryptocurrency icon
 */
export const CryptoIcon = ({ symbol, ...props }) => {
  const iconPath = getCryptoIconPath(symbol);
  
  return (
    <img 
      src={iconPath} 
      alt={`${symbol} icon`}
      {...props}
    />
  );
};

/**
 * Map of common cryptocurrency names to their symbols
 */
export const CRYPTO_NAME_TO_SYMBOL = {
  'bitcoin': 'BTC',
  'ethereum': 'ETH',
  'solana': 'SOL',
  'bnb': 'BNB',
  'binance coin': 'BNB',
  'xrp': 'XRP',
  'ripple': 'XRP',
  'cardano': 'ADA',
  'avalanche': 'AVAX',
  'dogecoin': 'DOGE',
  'polkadot': 'DOT',
  'polygon': 'MATIC',
  'tron': 'TRX',
  'litecoin': 'LTC',
  'chainlink': 'LINK',
  'uniswap': 'UNI',
  'stellar': 'XLM',
  'cosmos': 'ATOM',
  'monero': 'XMR',
  'tether': 'USDT',
  'usd coin': 'USDC',
  'dai': 'DAI',
  'shiba inu': 'SHIB',
};

/**
 * Get cryptocurrency symbol from name
 * @param {string} name - Cryptocurrency name
 * @returns {string|null} - Cryptocurrency symbol or null if not found
 */
export const getSymbolFromName = (name) => {
  if (!name) return null;
  
  const normalizedName = name.toLowerCase();
  
  // Check if the name is in the map
  if (CRYPTO_NAME_TO_SYMBOL[normalizedName]) {
    return CRYPTO_NAME_TO_SYMBOL[normalizedName];
  }
  
  // Check if the name is already a symbol
  if (normalizedName.length <= 5 && normalizedName === normalizedName.toUpperCase()) {
    return normalizedName;
  }
  
  // Check if any key in the map contains the name
  for (const [key, value] of Object.entries(CRYPTO_NAME_TO_SYMBOL)) {
    if (key.includes(normalizedName) || normalizedName.includes(key)) {
      return value;
    }
  }
  
  return null;
}; 