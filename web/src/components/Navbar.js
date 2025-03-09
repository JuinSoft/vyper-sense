import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Chip,
  useMediaQuery,
  useTheme,
  IconButton,
  Menu,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import { 
  AccountBalanceWallet as WalletIcon,
  Dashboard as DashboardIcon,
  TrendingUp as TrendingUpIcon,
  Insights as InsightsIcon,
  Menu as MenuIcon
} from '@mui/icons-material';
import { Web3Context } from '../utils/Web3Context';

const Navbar = () => {
  const { 
    isConnected, 
    account, 
    connectWallet, 
    disconnectWallet,
    isConnecting,
    networkName,
    getShortenedAddress
  } = useContext(Web3Context);
  
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [walletMenuAnchor, setWalletMenuAnchor] = React.useState(null);
  
  const handleWalletMenuOpen = (event) => {
    setWalletMenuAnchor(event.currentTarget);
  };
  
  const handleWalletMenuClose = () => {
    setWalletMenuAnchor(null);
  };
  
  const handleDisconnect = () => {
    disconnectWallet();
    handleWalletMenuClose();
  };
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  const navItems = [
    { name: 'Dashboard', path: '/', icon: <DashboardIcon /> },
    { name: 'Sentiment Analysis', path: '/sentiment', icon: <InsightsIcon /> },
    { name: 'Trading Signals', path: '/signals', icon: <TrendingUpIcon /> },
    { name: 'Wallet', path: '/wallet', icon: <WalletIcon /> }
  ];
  
  const isActive = (path) => {
    return location.pathname === path;
  };
  
  const renderMobileMenu = () => (
    <Drawer
      anchor="left"
      open={mobileMenuOpen}
      onClose={toggleMobileMenu}
      PaperProps={{
        sx: { width: 250, backgroundColor: theme.palette.background.paper }
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" component="div" className="gradient-text" sx={{ fontWeight: 'bold' }}>
          VyperSense
        </Typography>
      </Box>
      <List>
        {navItems.map((item) => (
          <ListItem 
            button 
            component={Link} 
            to={item.path} 
            key={item.name}
            selected={isActive(item.path)}
            onClick={toggleMobileMenu}
            sx={{
              backgroundColor: isActive(item.path) ? 'rgba(0, 201, 255, 0.1)' : 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(0, 201, 255, 0.05)'
              }
            }}
          >
            <ListItemIcon sx={{ color: isActive(item.path) ? theme.palette.primary.main : 'inherit' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.name} />
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
  
  return (
    <>
      <AppBar position="fixed" color="transparent" elevation={0} sx={{ backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={toggleMobileMenu}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Typography variant="h6" component="div" className="gradient-text" sx={{ fontWeight: 'bold', flexGrow: isMobile ? 1 : 0 }}>
            VyperSense
          </Typography>
          
          {!isMobile && (
            <Box sx={{ display: 'flex', mx: 4 }}>
              {navItems.map((item) => (
                <Button
                  key={item.name}
                  component={Link}
                  to={item.path}
                  startIcon={item.icon}
                  sx={{
                    mx: 1,
                    color: isActive(item.path) ? theme.palette.primary.main : 'inherit',
                    fontWeight: isActive(item.path) ? 'bold' : 'normal',
                    borderBottom: isActive(item.path) ? `2px solid ${theme.palette.primary.main}` : 'none',
                    borderRadius: 0,
                    '&:hover': {
                      backgroundColor: 'transparent',
                      borderBottom: `2px solid ${theme.palette.primary.main}`,
                    }
                  }}
                >
                  {item.name}
                </Button>
              ))}
            </Box>
          )}
          
          <Box sx={{ flexGrow: 1 }} />
          
          {isConnected ? (
            <>
              <Chip
                icon={<WalletIcon />}
                label={getShortenedAddress(account)}
                variant="outlined"
                onClick={handleWalletMenuOpen}
                sx={{ 
                  borderRadius: '16px',
                  border: '1px solid rgba(0, 201, 255, 0.5)',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 201, 255, 0.1)',
                    border: '1px solid rgba(0, 201, 255, 0.8)',
                  }
                }}
              />
              <Menu
                anchorEl={walletMenuAnchor}
                open={Boolean(walletMenuAnchor)}
                onClose={handleWalletMenuClose}
                PaperProps={{
                  sx: {
                    mt: 1.5,
                    backgroundColor: theme.palette.background.paper,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }
                }}
              >
                <MenuItem sx={{ minWidth: '200px' }}>
                  <Typography variant="body2" color="text.secondary">
                    Connected to {networkName}
                  </Typography>
                </MenuItem>
                <MenuItem onClick={handleDisconnect}>Disconnect Wallet</MenuItem>
              </Menu>
            </>
          ) : (
            <Button
              variant="contained"
              color="primary"
              startIcon={<WalletIcon />}
              onClick={connectWallet}
              disabled={isConnecting}
              sx={{ borderRadius: '20px', px: 3 }}
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          )}
        </Toolbar>
      </AppBar>
      {renderMobileMenu()}
    </>
  );
};

export default Navbar; 