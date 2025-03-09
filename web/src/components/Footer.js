import React from 'react';
import { Box, Typography, Link, Container, Grid, IconButton } from '@mui/material';
import { GitHub, Twitter, Telegram } from '@mui/icons-material';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} justifyContent="space-between">
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="h6" className="gradient-text" gutterBottom>
              VyperSense
            </Typography>
            <Typography variant="body2" color="text.secondary">
              AI-powered cryptocurrency sentiment analysis tool that monitors news, analyzes market sentiment, and generates trading signals.
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="h6" gutterBottom>
              Quick Links
            </Typography>
            <Typography variant="body2">
              <Link href="/" color="inherit" sx={{ display: 'block', mb: 1 }}>
                Dashboard
              </Link>
              <Link href="/sentiment" color="inherit" sx={{ display: 'block', mb: 1 }}>
                Sentiment Analysis
              </Link>
              <Link href="/signals" color="inherit" sx={{ display: 'block', mb: 1 }}>
                Trading Signals
              </Link>
              <Link href="/wallet" color="inherit" sx={{ display: 'block', mb: 1 }}>
                Wallet
              </Link>
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="h6" gutterBottom>
              Connect
            </Typography>
            <Box>
              <IconButton color="inherit" aria-label="GitHub">
                <GitHub />
              </IconButton>
              <IconButton color="inherit" aria-label="Twitter">
                <Twitter />
              </IconButton>
              <IconButton color="inherit" aria-label="Telegram">
                <Telegram />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
        
        <Box mt={3} textAlign="center">
          <Typography variant="body2" color="text.secondary">
            {'© '}
            {new Date().getFullYear()}
            {' VyperSense. All rights reserved.'}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer; 