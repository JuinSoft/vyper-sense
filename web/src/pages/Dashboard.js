import React, { useState, useEffect, useContext } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardHeader,
  Button,
  Divider,
  Avatar,
  Chip,
  LinearProgress,
  useTheme,
  Alert,
  Snackbar,
  IconButton,
  Tooltip,
  Tab,
  Tabs,
  Paper
} from '@mui/material';
import { 
  TrendingUp, 
  TrendingDown, 
  TrendingFlat,
  Timeline,
  Insights,
  Article,
  Refresh,
  OpenInNew,
  RssFeed,
  ShowChart
} from '@mui/icons-material';
import { Web3Context } from '../utils/Web3Context';
import api from '../utils/api';
import { Link } from 'react-router-dom';
import CryptoMarketData from '../components/CryptoMarketData';
import RssFeedManager from '../components/RssFeedManager';
import { getCryptoIconPath } from '../utils/cryptoIcons';
import { clearCache } from '../utils/cacheService';

const Dashboard = () => {
  const theme = useTheme();
  const { isConnected, connectWallet } = useContext(Web3Context);
  const [loading, setLoading] = useState(true);
  const [newsLoading, setNewsLoading] = useState(true);
  const [sentimentLoading, setSentimentLoading] = useState(true);
  const [signalsLoading, setSignalsLoading] = useState(true);
  
  const [newsArticles, setNewsArticles] = useState([]);
  const [sentimentData, setSentimentData] = useState([]);
  const [tradingSignals, setTradingSignals] = useState([]);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Load data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch news articles
      setNewsLoading(true);
      const articles = await api.fetchNewsArticles();
      setNewsArticles(articles.slice(0, 8)); // Show only the first 8 articles
      setNewsLoading(false);
      
      // Analyze sentiment
      setSentimentLoading(true);
      const analyses = await api.analyzeSentiment(articles);
      setSentimentData(analyses);
      setSentimentLoading(false);
      
      // Generate trading signals
      setSignalsLoading(true);
      const signals = await api.generateTradingSignals(analyses);
      setTradingSignals(signals);
      setSignalsLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data. Please try again later.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    // Clear all caches
    clearCache();
    fetchData();
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

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

  const getSentimentColor = (score) => {
    if (score >= 0.7) return '#4caf50';
    if (score >= 0.4) return '#ff9800';
    return '#f44336';
  };

  const formatDate = (date) => {
    if (!date) return '';
    const now = new Date();
    const diff = now - new Date(date);
    
    // Convert to hours
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (hours < 24) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(hours / 24);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
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

      {!isConnected && (
        <Card sx={{ mb: 4, background: 'linear-gradient(90deg, rgba(0,201,255,0.1) 0%, rgba(146,254,157,0.1) 100%)', border: '1px solid rgba(0, 201, 255, 0.2)' }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h5" gutterBottom>
              Connect Your Wallet to Access All Features
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Connect your MetaMask wallet to interact with the blockchain and access personalized insights.
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              size="large"
              onClick={connectWallet}
              sx={{ px: 4, py: 1.5 }}
            >
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 0 }}>
          Market Overview
        </Typography>
        <Tooltip title="Refresh all data">
          <IconButton 
            onClick={handleRefresh} 
            disabled={refreshing || loading}
            color="primary"
          >
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>
      
      {loading ? (
        <Box sx={{ width: '100%', mt: 4 }}>
          <LinearProgress color="primary" />
        </Box>
      ) : (
        <>
          <Paper sx={{ mb: 4 }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange}
              variant="fullWidth"
              textColor="primary"
              indicatorColor="primary"
            >
              <Tab icon={<ShowChart />} label="MARKET DATA" />
              <Tab icon={<Insights />} label="SENTIMENT" />
              <Tab icon={<RssFeed />} label="NEWS FEEDS" />
            </Tabs>
          </Paper>

          {/* Market Data Tab */}
          {activeTab === 0 && (
            <Box sx={{ mb: 4 }}>
              <CryptoMarketData />
            </Box>
          )}

          {/* Sentiment Tab */}
          {activeTab === 1 && (
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={8}>
                <Card>
                  <CardHeader 
                    title="Latest Sentiment Analysis" 
                    action={
                      <Button 
                        color="primary" 
                        endIcon={<Insights />}
                        component={Link}
                        to="/sentiment"
                      >
                        View All
                      </Button>
                    }
                  />
                  <Divider />
                  <CardContent>
                    {sentimentLoading ? (
                      <LinearProgress color="primary" />
                    ) : sentimentData.length > 0 ? (
                      <Grid container spacing={2}>
                        {sentimentData.slice(0, 4).map((item, index) => (
                          <Grid item xs={12} sm={6} key={index}>
                            <Box 
                              sx={{ 
                                p: 2, 
                                borderRadius: 2, 
                                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2
                              }}
                            >
                              <Avatar 
                                src={getCryptoIconPath(item.entities[0]?.symbol)} 
                                sx={{ width: 48, height: 48 }}
                              >
                                {item.entities[0]?.name?.charAt(0)}
                              </Avatar>
                              <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="subtitle2" noWrap title={item.headline}>
                                  {item.headline.length > 50 ? `${item.headline.substring(0, 50)}...` : item.headline}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    Sentiment: 
                                    <Box component="span" sx={{ color: getSentimentColor(item.sentiment_score), ml: 1, fontWeight: 'bold' }}>
                                      {(item.sentiment_score * 100).toFixed(0)}%
                                    </Box>
                                  </Typography>
                                  <Chip 
                                    label={item.source} 
                                    size="small" 
                                    sx={{ 
                                      backgroundColor: 'rgba(0, 201, 255, 0.1)',
                                      color: theme.palette.primary.main,
                                      fontWeight: 'bold'
                                    }} 
                                  />
                                </Box>
                              </Box>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    ) : (
                      <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                        No sentiment data available. Please refresh to analyze the latest news.
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardHeader 
                    title="Trading Signals" 
                    action={
                      <Button 
                        color="primary" 
                        endIcon={<Timeline />}
                        component={Link}
                        to="/signals"
                      >
                        View All
                      </Button>
                    }
                  />
                  <Divider />
                  <CardContent>
                    {signalsLoading ? (
                      <LinearProgress color="primary" />
                    ) : tradingSignals.length > 0 ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {tradingSignals.slice(0, 3).map((signal, index) => (
                          <Box 
                            key={index}
                            sx={{ 
                              p: 2, 
                              borderRadius: 2, 
                              backgroundColor: 'rgba(0, 0, 0, 0.1)',
                              borderLeft: `4px solid ${getSignalColor(signal.signal_type)}`
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Avatar 
                                src={getCryptoIconPath(signal.symbol)} 
                                sx={{ width: 32, height: 32, mr: 1 }}
                              >
                                {signal.cryptocurrency.charAt(0)}
                              </Avatar>
                              <Typography variant="subtitle2">
                                {signal.cryptocurrency}
                              </Typography>
                              <Box sx={{ flexGrow: 1 }} />
                              <Chip 
                                icon={getSignalIcon(signal.signal_type)} 
                                label={signal.signal_type.toUpperCase()} 
                                size="small"
                                sx={{ 
                                  backgroundColor: `${getSignalColor(signal.signal_type)}20`,
                                  color: getSignalColor(signal.signal_type),
                                  fontWeight: 'bold'
                                }}
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {signal.reasoning.length > 100 ? `${signal.reasoning.substring(0, 100)}...` : signal.reasoning}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="caption" color="text.secondary">
                                Confidence: {(signal.confidence * 100).toFixed(0)}%
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(signal.timestamp)}
                              </Typography>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                        No trading signals available. Please refresh to generate signals.
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {/* RSS Feeds Tab */}
          {activeTab === 2 && (
            <Box sx={{ mb: 4 }}>
              <RssFeedManager onRefresh={fetchData} />
            </Box>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardHeader 
                  title="Latest News" 
                  action={
                    <Button 
                      color="primary" 
                      endIcon={<Article />}
                      onClick={() => window.open(newsArticles[0]?.link, '_blank')}
                      disabled={newsArticles.length === 0}
                    >
                      Read More
                    </Button>
                  }
                />
                <Divider />
                <CardContent>
                  {newsLoading ? (
                    <LinearProgress color="primary" />
                  ) : newsArticles.length > 0 ? (
                    <Grid container spacing={2}>
                      {newsArticles.slice(0, 6).map((article, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                          <Card 
                            elevation={1} 
                            sx={{ 
                              height: '100%', 
                              display: 'flex', 
                              flexDirection: 'column',
                              transition: 'transform 0.2s',
                              '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: 6
                              }
                            }}
                          >
                            <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium', lineHeight: 1.3 }}>
                                {article.title.length > 70 ? `${article.title.substring(0, 70)}...` : article.title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                {article.summary?.replace(/<[^>]*>?/gm, '').substring(0, 100)}...
                              </Typography>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                                <Chip 
                                  label={article.source} 
                                  size="small" 
                                  sx={{ 
                                    backgroundColor: 'rgba(0, 201, 255, 0.1)',
                                    color: theme.palette.primary.main
                                  }} 
                                />
                                <Typography variant="caption" color="text.secondary">
                                  {formatDate(article.published)}
                                </Typography>
                              </Box>
                            </CardContent>
                            <Button 
                              endIcon={<OpenInNew fontSize="small" />}
                              onClick={() => window.open(article.link, '_blank')}
                              sx={{ alignSelf: 'flex-end', m: 1 }}
                            >
                              Read
                            </Button>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                      No news articles available. Please refresh to fetch the latest news.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default Dashboard; 