import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Chip,
  Alert,
  Snackbar,
  Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { getRssFeeds, addRssFeed, removeRssFeed, fetchFeedArticles } from '../utils/rssService';
import { clearCacheItem } from '../utils/cacheService';

const RssFeedManager = ({ onRefresh }) => {
  const [feeds, setFeeds] = useState([]);
  const [newFeed, setNewFeed] = useState({ name: '', url: '' });
  const [editMode, setEditMode] = useState(false);
  const [editIndex, setEditIndex] = useState(-1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Load feeds on component mount
  useEffect(() => {
    setFeeds(getRssFeeds());
  }, []);

  // Handle dialog open
  const handleOpenDialog = (index = -1) => {
    if (index >= 0) {
      // Edit mode
      setEditMode(true);
      setEditIndex(index);
      setNewFeed({ ...feeds[index] });
    } else {
      // Add mode
      setEditMode(false);
      setNewFeed({ name: '', url: '' });
    }
    setDialogOpen(true);
    setTestResult(null);
  };

  // Handle dialog close
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setTestResult(null);
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewFeed(prev => ({ ...prev, [name]: value }));
  };

  // Generate a unique ID for a feed
  const generateFeedId = (name, url) => {
    return `feed_${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
  };

  // Test RSS feed
  const testFeed = async () => {
    if (!newFeed.url) {
      setError('Please enter a valid RSS feed URL');
      return;
    }

    setTestLoading(true);
    setTestResult(null);

    try {
      const testFeedObj = {
        ...newFeed,
        id: newFeed.id || generateFeedId(newFeed.name, newFeed.url)
      };
      
      const articles = await fetchFeedArticles(testFeedObj);
      
      if (articles.length > 0) {
        setTestResult({
          success: true,
          message: `Successfully fetched ${articles.length} articles from the feed.`,
          sample: articles[0]
        });
      } else {
        setTestResult({
          success: false,
          message: 'No articles found in this feed. Please check the URL and try again.'
        });
      }
    } catch (error) {
      console.error('Error testing feed:', error);
      setTestResult({
        success: false,
        message: 'Error fetching feed. Please check the URL and try again.'
      });
    } finally {
      setTestLoading(false);
    }
  };

  // Save feed
  const saveFeed = () => {
    if (!newFeed.name || !newFeed.url) {
      setError('Please enter both name and URL');
      return;
    }

    try {
      // Prepare feed object
      const feedObj = {
        ...newFeed,
        id: newFeed.id || generateFeedId(newFeed.name, newFeed.url)
      };
      
      // Add or update feed
      const updatedFeeds = addRssFeed(feedObj);
      setFeeds(updatedFeeds);
      
      // Clear cache to refresh feed data
      clearCacheItem(`rss_feed_${feedObj.id}`);
      clearCacheItem('rss_all_feeds');
      
      // Refresh parent component if needed
      if (onRefresh) onRefresh();
      
      // Close dialog
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving feed:', error);
      setError('Error saving feed. Please try again.');
    }
  };

  // Delete feed
  const deleteFeed = (id) => {
    try {
      const updatedFeeds = removeRssFeed(id);
      setFeeds(updatedFeeds);
      
      // Clear cache to refresh feed data
      clearCacheItem(`rss_feed_${id}`);
      clearCacheItem('rss_all_feeds');
      
      // Refresh parent component if needed
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error deleting feed:', error);
      setError('Error deleting feed. Please try again.');
    }
  };

  // Refresh all feeds
  const refreshAllFeeds = () => {
    // Clear all feed caches
    feeds.forEach(feed => {
      clearCacheItem(`rss_feed_${feed.id}`);
    });
    clearCacheItem('rss_all_feeds');
    
    // Refresh parent component if needed
    if (onRefresh) onRefresh();
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

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">RSS Feed Sources</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={refreshAllFeeds}
            sx={{ mr: 1 }}
          >
            Refresh All
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Feed
          </Button>
        </Box>
      </Box>

      <Paper elevation={2} sx={{ mb: 4 }}>
        <List>
          {feeds.length === 0 ? (
            <ListItem>
              <ListItemText primary="No RSS feeds configured. Add one to get started." />
            </ListItem>
          ) : (
            feeds.map((feed, index) => (
              <React.Fragment key={feed.id}>
                {index > 0 && <Divider />}
                <ListItem>
                  <ListItemText
                    primary={feed.name}
                    secondary={feed.url}
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" onClick={() => handleOpenDialog(index)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton edge="end" onClick={() => deleteFeed(feed.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              </React.Fragment>
            ))
          )}
        </List>
      </Paper>

      {/* Add/Edit Feed Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Edit RSS Feed' : 'Add RSS Feed'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Feed Name"
              name="name"
              value={newFeed.name}
              onChange={handleInputChange}
              margin="normal"
              variant="outlined"
              placeholder="e.g., CoinDesk"
            />
            <TextField
              fullWidth
              label="Feed URL"
              name="url"
              value={newFeed.url}
              onChange={handleInputChange}
              margin="normal"
              variant="outlined"
              placeholder="e.g., https://www.coindesk.com/arc/outboundfeeds/rss/"
              helperText="Enter the full URL of the RSS feed"
            />

            {testResult && (
              <Box sx={{ mt: 2 }}>
                <Alert severity={testResult.success ? 'success' : 'error'}>
                  {testResult.message}
                </Alert>
                {testResult.success && testResult.sample && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                    <Typography variant="subtitle2">Sample Article:</Typography>
                    <Typography variant="body2">{testResult.sample.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(testResult.sample.published).toLocaleString()}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={testFeed} 
            color="secondary" 
            disabled={!newFeed.url || testLoading}
          >
            {testLoading ? 'Testing...' : 'Test Feed'}
          </Button>
          <Button 
            onClick={saveFeed} 
            color="primary" 
            variant="contained"
            disabled={!newFeed.name || !newFeed.url}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RssFeedManager; 