import React, { useState, useEffect, useContext } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardHeader,
  CardMedia,
  CardActions,
  Button,
  Divider,
  Chip,
  Avatar,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  useTheme,
  Alert,
  Snackbar,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import { 
  TrendingUp, 
  TrendingDown, 
  TrendingFlat,
  FilterList,
  Search,
  Share,
  OpenInNew,
  Refresh,
  ShoppingCart,
  Sell
} from '@mui/icons-material';
import { Web3Context } from '../utils/Web3Context';
import api from '../utils/api';

const TradingSignals = () => {
  const theme = useTheme();
  const { isConnected, connectWallet, signer, account } = useContext(Web3Context);
  const [loading, setLoading] = useState(true);
  const [signals, setSignals] = useState([]);
  const [filteredSignals, setFilteredSignals] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSignalType, setFilterSignalType] = useState('all');
  const [filterConfidence, setFilterConfidence] = useState('all');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortDirection, setSortDirection] = useState('desc');
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [generatingImages, setGeneratingImages] = useState(false);
  
  // Trade dialog state
  const [tradeDialogOpen, setTradeDialogOpen] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState(null);
  const [tradeAmount, setTradeAmount] = useState('');
  const [tradeLoading, setTradeLoading] = useState(false);
  const [tradeSuccess, setTradeSuccess] = useState(false);
  const [tradeError, setTradeError] = useState(null);

  // Load data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch news articles
      const articles = await api.fetchNewsArticles();
      
      // Analyze sentiment
      const analyses = await api.analyzeSentiment(articles);
      
      // Generate trading signals
      const signals = await api.generateTradingSignals(analyses);
      setSignals(signals);
      setFilteredSignals(signals);
      
      // Generate visualizations for high-confidence signals
      if (signals.length > 0) {
        setGeneratingImages(true);
        const signalsWithImages = [...signals];
        
        // Process signals in parallel with Promise.all
        await Promise.all(
          signalsWithImages
            .filter(signal => signal.confidence > 0.7) // Only generate for high confidence
            .map(async (signal, index) => {
              try {
                const imageUrl = await api.generateVisualization(signal);
                if (imageUrl) {
                  signalsWithImages[index] = { ...signal, image_url: imageUrl };
                }
              } catch (err) {
                console.error(`Error generating visualization for ${signal.cryptocurrency}:`, err);
              }
            })
        );
        
        setSignals(signalsWithImages);
        setFilteredSignals(signalsWithImages);
        setGeneratingImages(false);
      }
    } catch (err) {
      console.error('Error fetching trading signals:', err);
      setError('Failed to fetch trading signals. Please try again later.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Apply filters and search
  useEffect(() => {
    if (signals.length === 0) return;
    
    let result = [...signals];
    
    // Apply signal type filter
    if (filterSignalType !== 'all') {
      result = result.filter(item => item.signal_type === filterSignalType);
    }
    
    // Apply confidence filter
    if (filterConfidence !== 'all') {
      switch (filterConfidence) {
        case 'high':
          result = result.filter(item => item.confidence >= 0.8);
          break;
        case 'medium':
          result = result.filter(item => item.confidence >= 0.6 && item.confidence < 0.8);
          break;
        case 'low':
          result = result.filter(item => item.confidence < 0.6);
          break;
        default:
          break;
      }
    }
    
    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(item => 
        item.cryptocurrency.toLowerCase().includes(term) ||
        item.reasoning.toLowerCase().includes(term) ||
        item.sources.some(source => source.toLowerCase().includes(term))
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'cryptocurrency':
          comparison = a.cryptocurrency.localeCompare(b.cryptocurrency);
          break;
        case 'confidence':
          comparison = a.confidence - b.confidence;
          break;
        case 'sentiment':
          comparison = a.sentiment_score - b.sentiment_score;
          break;
        case 'timestamp':
        default:
          comparison = new Date(a.timestamp) - new Date(b.timestamp);
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    setFilteredSignals(result);
  }, [signals, filterSignalType, filterConfidence, searchTerm, sortBy, sortDirection]);

  const getSignalIcon = (type) => {
    switch (type) {
      case 'buy':
        return <TrendingUp sx={{ color: '#4caf50' }} />;
      case 'sell':
        return <TrendingDown sx={{ color: '#f44336' }} />;
      default:
        return <TrendingFlat sx={{ color: '#ff9800' }} />;
    }
  };

  const getSignalColor = (type) => {
    switch (type) {
      case 'buy':
        return '#4caf50';
      case 'sell':
        return '#f44336';
      default:
        return '#ff9800';
    }
  };

  const getSignalGradient = (type) => {
    switch (type) {
      case 'buy':
        return 'linear-gradient(135deg, rgba(76,175,80,0.1) 0%, rgba(76,175,80,0.2) 100%)';
      case 'sell':
        return 'linear-gradient(135deg, rgba(244,67,54,0.1) 0%, rgba(244,67,54,0.2) 100%)';
      default:
        return 'linear-gradient(135deg, rgba(255,152,0,0.1) 0%, rgba(255,152,0,0.2) 100%)';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  const handleOpenTradeDialog = (signal) => {
    if (!isConnected) {
      connectWallet();
      return;
    }
    
    setSelectedSignal(signal);
    setTradeDialogOpen(true);
    setTradeAmount('');
    setTradeSuccess(false);
    setTradeError(null);
  };
  
  const handleCloseTradeDialog = () => {
    setTradeDialogOpen(false);
    setSelectedSignal(null);
  };
  
  const handleTrade = async () => {
    if (!selectedSignal || !tradeAmount || !signer) return;
    
    setTradeLoading(true);
    setTradeError(null);
    
    try {
      // Record sentiment on blockchain
      const sentimentInt = Math.round(selectedSignal.sentiment_score * 100);
      const confidenceInt = Math.round(selectedSignal.confidence * 100);
      
      const txHash = await api.recordSentiment(
        signer,
        selectedSignal.cryptocurrency,
        selectedSignal.sentiment_score,
        selectedSignal.confidence
      );
      
      setTradeSuccess(true);
      
      // Close dialog after 2 seconds
      setTimeout(() => {
        handleCloseTradeDialog();
      }, 2000);
    } catch (err) {
      console.error('Error executing trade:', err);
      setTradeError('Failed to execute trade. Please try again.');
    } finally {
      setTradeLoading(false);
    }
  };

  return (
    <Box>
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 0 }}>
          Trading Signals
        </Typography>
        <Tooltip title="Refresh data">
          <IconButton 
            onClick={handleRefresh} 
            disabled={refreshing || loading}
            color="primary"
          >
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>
      
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Filters & Search
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Search"
                variant="outlined"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ color: 'action.active', mr: 1 }} />,
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Signal Type</InputLabel>
                <Select
                  value={filterSignalType}
                  onChange={(e) => setFilterSignalType(e.target.value)}
                  label="Signal Type"
                >
                  <MenuItem value="all">All Signals</MenuItem>
                  <MenuItem value="buy">Buy</MenuItem>
                  <MenuItem value="hold">Hold</MenuItem>
                  <MenuItem value="sell">Sell</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Confidence</InputLabel>
                <Select
                  value={filterConfidence}
                  onChange={(e) => setFilterConfidence(e.target.value)}
                  label="Confidence"
                >
                  <MenuItem value="all">All Confidence Levels</MenuItem>
                  <MenuItem value="high">High (80%+)</MenuItem>
                  <MenuItem value="medium">Medium (60-80%)</MenuItem>
                  <MenuItem value="low">Low (Below 60%)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setSortDirection('desc');
                  }}
                  label="Sort By"
                >
                  <MenuItem value="timestamp">Date (Newest First)</MenuItem>
                  <MenuItem value="cryptocurrency">Cryptocurrency</MenuItem>
                  <MenuItem value="confidence">Confidence</MenuItem>
                  <MenuItem value="sentiment">Sentiment Score</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      {loading ? (
        <Box sx={{ width: '100%', mt: 4 }}>
          <LinearProgress color="primary" />
        </Box>
      ) : (
        <>
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Showing {filteredSignals.length} of {signals.length} trading signals
              {generatingImages && ' (Generating visualizations...)'}
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Button 
              startIcon={<FilterList />}
              size="small"
              onClick={() => {
                setFilterSignalType('all');
                setFilterConfidence('all');
                setSearchTerm('');
                setSortBy('timestamp');
                setSortDirection('desc');
              }}
            >
              Reset Filters
            </Button>
          </Box>
          
          {filteredSignals.length > 0 ? (
            <Grid container spacing={3}>
              {filteredSignals.map((signal, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card 
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      background: getSignalGradient(signal.signal_type),
                      border: `1px solid ${getSignalColor(signal.signal_type)}40`,
                    }}
                  >
                    <CardHeader
                      avatar={
                        <Avatar 
                          src={`https://cryptologos.cc/logos/${signal.cryptocurrency.toLowerCase()}-logo.png`} 
                          sx={{ width: 40, height: 40 }}
                        >
                          {signal.cryptocurrency.charAt(0)}
                        </Avatar>
                      }
                      title={
                        <Typography variant="h6" component="div">
                          {signal.cryptocurrency}
                        </Typography>
                      }
                      action={
                        <Chip 
                          label={signal.signal_type.toUpperCase()} 
                          size="small"
                          icon={getSignalIcon(signal.signal_type)}
                          sx={{ 
                            backgroundColor: `${getSignalColor(signal.signal_type)}20`,
                            color: getSignalColor(signal.signal_type),
                            fontWeight: 'bold',
                            borderRadius: '4px'
                          }} 
                        />
                      }
                      subheader={formatDate(signal.timestamp)}
                    />
                    
                    {signal.image_url && (
                      <CardMedia
                        component="img"
                        height="200"
                        image={signal.image_url}
                        alt={`${signal.cryptocurrency} trading signal visualization`}
                        sx={{ objectFit: 'cover' }}
                      />
                    )}
                    
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {signal.reasoning}
                      </Typography>
                      
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2" color="text.secondary">
                            Confidence
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {(signal.confidence * 100).toFixed(0)}%
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={signal.confidence * 100} 
                          sx={{ 
                            height: 6, 
                            borderRadius: 3,
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: getSignalColor(signal.signal_type)
                            }
                          }} 
                        />
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2" color="text.secondary">
                            Sentiment Score
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {(signal.sentiment_score * 100).toFixed(0)}%
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={(signal.sentiment_score + 1) * 50} // Convert from -1..1 to 0..100
                          sx={{ 
                            height: 6, 
                            borderRadius: 3,
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: signal.sentiment_score >= 0.5 ? '#4caf50' : 
                                              signal.sentiment_score >= 0 ? '#ff9800' : '#f44336'
                            }
                          }} 
                        />
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        Sources:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {signal.sources.map((source, index) => (
                          <Chip 
                            key={index} 
                            label={source} 
                            size="small" 
                            sx={{ 
                              backgroundColor: 'rgba(0, 0, 0, 0.1)',
                              fontSize: '0.7rem'
                            }} 
                          />
                        ))}
                      </Box>
                    </CardContent>
                    
                    <Divider />
                    
                    <CardActions>
                      {signal.signal_type !== 'hold' && (
                        <Button 
                          size="small" 
                          startIcon={signal.signal_type === 'buy' ? <ShoppingCart /> : <Sell />}
                          sx={{ color: getSignalColor(signal.signal_type) }}
                          onClick={() => handleOpenTradeDialog(signal)}
                        >
                          {signal.signal_type === 'buy' ? 'Buy' : 'Sell'}
                        </Button>
                      )}
                      <Button 
                        size="small" 
                        startIcon={<Share />}
                        sx={{ color: getSignalColor(signal.signal_type) }}
                        onClick={() => {
                          const text = `${signal.cryptocurrency} ${signal.signal_type.toUpperCase()} Signal | Sentiment: ${(signal.sentiment_score * 100).toFixed(0)}% | Confidence: ${(signal.confidence * 100).toFixed(0)}%`;
                          navigator.clipboard.writeText(text);
                        }}
                      >
                        Share
                      </Button>
                      <Button 
                        size="small" 
                        startIcon={<OpenInNew />}
                        sx={{ color: getSignalColor(signal.signal_type) }}
                        component="a"
                        href={`https://www.google.com/search?q=${encodeURIComponent(`${signal.cryptocurrency} cryptocurrency news`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        News
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4, backgroundColor: 'rgba(0, 0, 0, 0.05)', borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                No Trading Signals Found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your filters or search term to find trading signals.
              </Typography>
            </Box>
          )}
        </>
      )}
      
      {/* Trade Dialog */}
      <Dialog open={tradeDialogOpen} onClose={handleCloseTradeDialog}>
        <DialogTitle>
          {selectedSignal?.signal_type === 'buy' ? 'Buy' : 'Sell'} {selectedSignal?.cryptocurrency}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will record your {selectedSignal?.signal_type} action on the Polygon Amoy blockchain based on the sentiment analysis.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Amount"
            type="number"
            fullWidth
            variant="outlined"
            value={tradeAmount}
            onChange={(e) => setTradeAmount(e.target.value)}
            InputProps={{
              endAdornment: <InputAdornment position="end">{selectedSignal?.cryptocurrency}</InputAdornment>,
            }}
            sx={{ mt: 2 }}
          />
          {tradeError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {tradeError}
            </Alert>
          )}
          {tradeSuccess && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Transaction successful! Your {selectedSignal?.signal_type} order has been recorded on the blockchain.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTradeDialog} disabled={tradeLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleTrade} 
            variant="contained" 
            color={selectedSignal?.signal_type === 'buy' ? 'success' : 'error'}
            disabled={tradeLoading || !tradeAmount || tradeSuccess}
          >
            {tradeLoading ? 'Processing...' : selectedSignal?.signal_type === 'buy' ? 'Buy' : 'Sell'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TradingSignals; 