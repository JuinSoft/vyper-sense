import React, { useState, useEffect, useContext } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Divider, 
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Avatar,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  useTheme,
  Alert,
  Snackbar,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import { 
  TrendingUp, 
  TrendingDown, 
  TrendingFlat,
  FilterList,
  Search,
  Refresh,
  OpenInNew
} from '@mui/icons-material';
import { Web3Context } from '../utils/Web3Context';
import api from '../utils/api';

const SentimentAnalysis = () => {
  const theme = useTheme();
  const { isConnected } = useContext(Web3Context);
  const [loading, setLoading] = useState(true);
  const [sentimentData, setSentimentData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCrypto, setFilterCrypto] = useState('all');
  const [filterSentiment, setFilterSentiment] = useState('all');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortDirection, setSortDirection] = useState('desc');
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Load data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setRefreshing(true);
    setError(null);
    
    try {
      // Fetch news articles
      const articles = await api.fetchNewsArticles();
      
      // Analyze sentiment
      const analyses = await api.analyzeSentiment(articles);
      setSentimentData(analyses);
      setFilteredData(analyses);
    } catch (err) {
      console.error('Error fetching sentiment data:', err);
      setError('Failed to fetch sentiment data. Please try again later.');
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
    if (sentimentData.length === 0) return;
    
    let result = [...sentimentData];
    
    // Apply cryptocurrency filter
    if (filterCrypto !== 'all') {
      result = result.filter(item => 
        item.entities.some(entity => 
          (typeof entity === 'object' ? entity.name.toLowerCase() : entity.toLowerCase()) === filterCrypto.toLowerCase()
        )
      );
    }
    
    // Apply sentiment filter
    if (filterSentiment !== 'all') {
      switch (filterSentiment) {
        case 'positive':
          result = result.filter(item => item.sentiment_score >= 0.5);
          break;
        case 'neutral':
          result = result.filter(item => item.sentiment_score >= 0 && item.sentiment_score < 0.5);
          break;
        case 'negative':
          result = result.filter(item => item.sentiment_score < 0);
          break;
        default:
          break;
      }
    }
    
    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(item => 
        item.headline.toLowerCase().includes(term) ||
        item.source.toLowerCase().includes(term) ||
        item.summary.toLowerCase().includes(term) ||
        item.entities.some(entity => 
          (typeof entity === 'object' ? entity.name.toLowerCase() : entity.toLowerCase()).includes(term)
        )
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'cryptocurrency':
          const entityA = a.entities[0];
          const entityB = b.entities[0];
          const nameA = typeof entityA === 'object' ? entityA.name : entityA || '';
          const nameB = typeof entityB === 'object' ? entityB.name : entityB || '';
          comparison = nameA.localeCompare(nameB);
          break;
        case 'sentiment':
          comparison = a.sentiment_score - b.sentiment_score;
          break;
        case 'confidence':
          comparison = a.confidence - b.confidence;
          break;
        case 'timestamp':
        default:
          comparison = new Date(a.timestamp) - new Date(b.timestamp);
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    setFilteredData(result);
  }, [sentimentData, filterCrypto, filterSentiment, searchTerm, sortBy, sortDirection]);

  // Get unique cryptocurrencies for filter
  const uniqueCryptos = [...new Set(sentimentData.flatMap(item => 
    item.entities.map(entity => typeof entity === 'object' ? entity.name : entity)
  ))].sort();

  const getSentimentColor = (score) => {
    if (score >= 0.5) return '#4caf50';
    if (score >= 0) return '#ff9800';
    return '#f44336';
  };

  const getSentimentIcon = (score) => {
    if (score >= 0.5) return <TrendingUp sx={{ color: '#4caf50' }} />;
    if (score >= 0) return <TrendingFlat sx={{ color: '#ff9800' }} />;
    return <TrendingDown sx={{ color: '#f44336' }} />;
  };

  const getSentimentLabel = (score) => {
    if (score >= 0.7) return 'Very Positive';
    if (score >= 0.5) return 'Positive';
    if (score >= 0) return 'Neutral';
    if (score >= -0.5) return 'Negative';
    return 'Very Negative';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('desc');
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
          Sentiment Analysis
        </Typography>
        <Tooltip title="Refresh data">
          <IconButton 
            onClick={handleRefresh} 
            disabled={refreshing}
            color="primary"
          >
            {refreshing ? <CircularProgress size={24} /> : <Refresh />}
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
                <InputLabel>Cryptocurrency</InputLabel>
                <Select
                  value={filterCrypto}
                  onChange={(e) => setFilterCrypto(e.target.value)}
                  label="Cryptocurrency"
                >
                  <MenuItem value="all">All Cryptocurrencies</MenuItem>
                  {uniqueCryptos.map((crypto, index) => (
                    <MenuItem key={index} value={crypto}>{crypto}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Sentiment</InputLabel>
                <Select
                  value={filterSentiment}
                  onChange={(e) => setFilterSentiment(e.target.value)}
                  label="Sentiment"
                >
                  <MenuItem value="all">All Sentiments</MenuItem>
                  <MenuItem value="positive">Positive</MenuItem>
                  <MenuItem value="neutral">Neutral</MenuItem>
                  <MenuItem value="negative">Negative</MenuItem>
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
                  <MenuItem value="sentiment">Sentiment Score</MenuItem>
                  <MenuItem value="confidence">Confidence</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      {loading && filteredData.length === 0 ? (
        <Box sx={{ width: '100%', mt: 4 }}>
          <LinearProgress color="primary" />
        </Box>
      ) : (
        <>
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Showing {filteredData.length} of {sentimentData.length} sentiment analyses
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            {refreshing && (
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Refreshing...
                </Typography>
              </Box>
            )}
            <Button 
              startIcon={<FilterList />}
              size="small"
              onClick={() => {
                setFilterCrypto('all');
                setFilterSentiment('all');
                setSearchTerm('');
                setSortBy('timestamp');
                setSortDirection('desc');
              }}
            >
              Reset Filters
            </Button>
          </Box>
          
          {filteredData.length > 0 ? (
            <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'rgba(0, 0, 0, 0.1)' }}>
                    <TableCell 
                      onClick={() => handleSort('cryptocurrency')}
                      sx={{ 
                        fontWeight: 'bold', 
                        cursor: 'pointer',
                        color: sortBy === 'cryptocurrency' ? theme.palette.primary.main : 'inherit'
                      }}
                    >
                      Cryptocurrency
                    </TableCell>
                    <TableCell>Headline & Source</TableCell>
                    <TableCell 
                      onClick={() => handleSort('sentiment')}
                      sx={{ 
                        fontWeight: 'bold', 
                        cursor: 'pointer',
                        color: sortBy === 'sentiment' ? theme.palette.primary.main : 'inherit'
                      }}
                    >
                      Sentiment
                    </TableCell>
                    <TableCell 
                      onClick={() => handleSort('confidence')}
                      sx={{ 
                        fontWeight: 'bold', 
                        cursor: 'pointer',
                        color: sortBy === 'confidence' ? theme.palette.primary.main : 'inherit'
                      }}
                    >
                      Confidence
                    </TableCell>
                    <TableCell 
                      onClick={() => handleSort('timestamp')}
                      sx={{ 
                        fontWeight: 'bold', 
                        cursor: 'pointer',
                        color: sortBy === 'timestamp' ? theme.palette.primary.main : 'inherit'
                      }}
                    >
                      Date
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredData.map((row, index) => (
                    <TableRow
                      key={index}
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {row.entities.slice(0, 3).map((entity, idx) => {
                            const entityName = typeof entity === 'object' ? entity.name : entity;
                            const entitySymbol = typeof entity === 'object' ? entity.symbol : entity;
                            return (
                              <Box sx={{ display: 'flex', alignItems: 'center' }} key={idx}>
                                <Avatar 
                                  src={`https://cryptologos.cc/logos/${entitySymbol.toLowerCase()}-logo.png`} 
                                  sx={{ width: 24, height: 24, mr: 1 }}
                                >
                                  {entityName.charAt(0)}
                                </Avatar>
                                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                  {entityName}
                                </Typography>
                              </Box>
                            );
                          })}
                          {row.entities.length > 3 && (
                            <Chip 
                              label={`+${row.entities.length - 3} more`} 
                              size="small" 
                              sx={{ alignSelf: 'flex-start', mt: 0.5 }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          component="a"
                          href={`https://www.google.com/search?q=${encodeURIComponent(row.headline)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ 
                            fontWeight: 'medium',
                            color: 'inherit', 
                            textDecoration: 'none',
                            '&:hover': { color: theme.palette.primary.main }
                          }}
                        >
                          {row.headline}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Source: {row.source}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {row.summary}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {getSentimentIcon(row.sentiment_score)}
                          <Box sx={{ ml: 1 }}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: 'bold', 
                                color: getSentimentColor(row.sentiment_score) 
                              }}
                            >
                              {(row.sentiment_score * 100).toFixed(0)}%
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {getSentimentLabel(row.sentiment_score)}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {(row.confidence * 100).toFixed(0)}%
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={row.confidence * 100} 
                            sx={{ 
                              height: 4, 
                              borderRadius: 2,
                              width: 60,
                              mt: 0.5,
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            }} 
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(row.timestamp)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4, backgroundColor: 'rgba(0, 0, 0, 0.05)', borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                No Results Found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your filters or search term to find sentiment analyses.
              </Typography>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default SentimentAnalysis; 