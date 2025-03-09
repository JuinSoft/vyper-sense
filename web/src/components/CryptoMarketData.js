import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Button,
  useTheme
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Refresh,
  Star,
  StarBorder
} from '@mui/icons-material';
import { fetchMarketData } from '../utils/api';
import { getCryptoIconPath } from '../utils/cryptoIcons';

const CryptoMarketData = () => {
  const theme = useTheme();
  const [marketData, setMarketData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('favoriteCryptos');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Fetch market data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('favoriteCryptos', JSON.stringify(favorites));
  }, [favorites]);

  // Fetch market data
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchMarketData();
      setMarketData(data);
    } catch (err) {
      console.error('Error fetching market data:', err);
      setError('Failed to fetch market data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Format price with appropriate precision
  const formatPrice = (price) => {
    if (price === undefined || price === null) return 'N/A';
    
    if (price < 0.01) {
      return '$' + price.toFixed(6);
    } else if (price < 1) {
      return '$' + price.toFixed(4);
    } else if (price < 10) {
      return '$' + price.toFixed(2);
    } else {
      return '$' + price.toLocaleString(undefined, { maximumFractionDigits: 2 });
    }
  };

  // Format percentage change
  const formatChange = (change) => {
    if (change === undefined || change === null) return 'N/A';
    
    const formatted = change.toFixed(2) + '%';
    return change >= 0 ? '+' + formatted : formatted;
  };

  // Format market cap
  const formatMarketCap = (marketCap) => {
    if (marketCap === undefined || marketCap === null) return 'N/A';
    
    if (marketCap >= 1e12) {
      return '$' + (marketCap / 1e12).toFixed(2) + 'T';
    } else if (marketCap >= 1e9) {
      return '$' + (marketCap / 1e9).toFixed(2) + 'B';
    } else if (marketCap >= 1e6) {
      return '$' + (marketCap / 1e6).toFixed(2) + 'M';
    } else {
      return '$' + marketCap.toLocaleString();
    }
  };

  // Format volume
  const formatVolume = (volume) => {
    if (volume === undefined || volume === null) return 'N/A';
    
    if (volume >= 1e12) {
      return '$' + (volume / 1e12).toFixed(2) + 'T';
    } else if (volume >= 1e9) {
      return '$' + (volume / 1e9).toFixed(2) + 'B';
    } else if (volume >= 1e6) {
      return '$' + (volume / 1e6).toFixed(2) + 'M';
    } else {
      return '$' + volume.toLocaleString();
    }
  };

  // Toggle favorite status
  const toggleFavorite = (code) => {
    setFavorites(prev => {
      if (prev.includes(code)) {
        return prev.filter(c => c !== code);
      } else {
        return [...prev, code];
      }
    });
  };

  // Sort data with favorites first
  const sortedData = [...marketData].sort((a, b) => {
    // First sort by favorite status
    const aFav = favorites.includes(a.code) ? 0 : 1;
    const bFav = favorites.includes(b.code) ? 0 : 1;
    
    if (aFav !== bFav) return aFav - bFav;
    
    // Then sort by rank
    return a.rank - b.rank;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Cryptocurrency Market Data</Typography>
        <Tooltip title="Refresh data">
          <IconButton 
            onClick={fetchData} 
            disabled={loading}
            color="primary"
          >
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <Box sx={{ mb: 2 }}>
          <Typography color="error">{error}</Typography>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={fetchData} 
            sx={{ mt: 1 }}
          >
            Try Again
          </Button>
        </Box>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={2}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>#</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Coin</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Price</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>24h %</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Market Cap</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Volume (24h)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedData.map((coin) => (
                <TableRow 
                  key={coin.code}
                  sx={{ 
                    '&:hover': { bgcolor: 'action.hover' },
                    bgcolor: favorites.includes(coin.code) ? 'rgba(255, 215, 0, 0.05)' : 'inherit'
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <IconButton 
                        size="small" 
                        onClick={() => toggleFavorite(coin.code)}
                        sx={{ mr: 1 }}
                      >
                        {favorites.includes(coin.code) ? (
                          <Star fontSize="small" sx={{ color: 'gold' }} />
                        ) : (
                          <StarBorder fontSize="small" />
                        )}
                      </IconButton>
                      {coin.rank}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box 
                        component="img" 
                        src={getCryptoIconPath(coin.code.toLowerCase())} 
                        alt={coin.name}
                        sx={{ width: 24, height: 24, mr: 1 }}
                      />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {coin.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {coin.code}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    {formatPrice(coin.rate)}
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                      {coin.delta?.day !== undefined && (
                        <>
                          {coin.delta.day >= 0 ? (
                            <TrendingUp fontSize="small" sx={{ color: 'success.main', mr: 0.5 }} />
                          ) : (
                            <TrendingDown fontSize="small" sx={{ color: 'error.main', mr: 0.5 }} />
                          )}
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: coin.delta.day >= 0 ? 'success.main' : 'error.main',
                              fontWeight: 'medium'
                            }}
                          >
                            {formatChange(coin.delta.day)}
                          </Typography>
                        </>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    {formatMarketCap(coin.cap)}
                  </TableCell>
                  <TableCell align="right">
                    {formatVolume(coin.volume)}
                  </TableCell>
                </TableRow>
              ))}
              {sortedData.length === 0 && !loading && !error && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" sx={{ py: 2 }}>
                      No market data available
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default CryptoMarketData; 