import React, { useContext, useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Button, 
  Grid, 
  Divider, 
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  Skeleton,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  Tooltip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { 
  AccountBalanceWallet as WalletIcon,
  ContentCopy as CopyIcon,
  OpenInNew as ExternalLinkIcon,
  SwapHoriz as SwapIcon,
  Send as SendIcon,
  Refresh as RefreshIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  TrendingUp,
  TrendingDown,
  TrendingFlat
} from '@mui/icons-material';
import { Web3Context } from '../utils/Web3Context';
import { ethers } from 'ethers';
import api from '../utils/api';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend
);

const Wallet = () => {
  const theme = useTheme();
  const { 
    isConnected, 
    account, 
    connectWallet, 
    provider, 
    signer,
    chainId,
    networkName,
    isConnecting,
    error: web3Error
  } = useContext(Web3Context);
  
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [contractAddress, setContractAddress] = useState(api.CONTRACT_ADDRESS);
  const [contractInstance, setContractInstance] = useState(null);
  const [contractOwner, setContractOwner] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [cryptocurrencies, setCryptocurrencies] = useState([]);
  const [selectedCrypto, setSelectedCrypto] = useState('');
  const [sentimentData, setSentimentData] = useState(null);
  const [sentimentHistory, setSentimentHistory] = useState([]);
  const [error, setError] = useState(null);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [sendAmount, setSendAmount] = useState('');
  const [sendAddress, setSendAddress] = useState('');
  const [sendError, setSendError] = useState('');
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Initialize contract and fetch data
  useEffect(() => {
    if (provider) {
      initContract();
    }
  }, [provider, account, contractAddress]);
  
  const initContract = async () => {
    try {
      setLoading(true);
      
      // Get contract instance
      const contract = api.getContract(provider);
      setContractInstance(contract);
      
      // Get contract owner
      try {
        const owner = await contract.owner();
        setContractOwner(owner);
        
        // Check if connected account is owner
        if (account && owner.toLowerCase() === account.toLowerCase()) {
          setIsOwner(true);
        } else {
          setIsOwner(false);
        }
      } catch (err) {
        console.error('Error getting contract owner:', err);
      }
      
      // Get all cryptocurrencies
      try {
        const cryptos = await api.getAllCryptocurrencies(provider);
        setCryptocurrencies(cryptos);
        
        if (cryptos.length > 0) {
          setSelectedCrypto(cryptos[0]);
        }
      } catch (err) {
        console.error('Error getting cryptocurrencies:', err);
        setCryptocurrencies([]);
      }
      
      // Fetch balance
      if (account) {
        try {
          const balanceWei = await provider.getBalance(account);
          setBalance(ethers.formatEther(balanceWei));
        } catch (err) {
          console.error('Error fetching balance:', err);
        }
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error initializing contract:', err);
      setError('Failed to initialize contract. Please check the contract address and network.');
      setLoading(false);
    }
  };
  
  // Fetch sentiment data for selected cryptocurrency
  useEffect(() => {
    fetchSentimentData();
  }, [provider, selectedCrypto]);
  
  const fetchSentimentData = async () => {
    if (provider && selectedCrypto) {
      try {
        // Get current sentiment
        const data = await api.getSentiment(provider, selectedCrypto);
        setSentimentData(data);
        
        // Get sentiment history
        const history = await api.getSentimentHistory(provider, selectedCrypto);
        setSentimentHistory(history);
      } catch (err) {
        console.error('Error fetching sentiment data:', err);
        setSentimentData(null);
        setSentimentHistory([]);
      }
    }
  };
  
  const handleRefresh = () => {
    setRefreshing(true);
    initContract().then(() => {
      fetchSentimentData().finally(() => {
        setRefreshing(false);
      });
    });
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(account);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const openExplorer = (address) => {
    window.open(api.getExplorerUrl(address || account), '_blank');
  };
  
  const handleSendDialogOpen = () => {
    setShowSendDialog(true);
    setSendError('');
    setSendSuccess(false);
    setSendAmount('');
    setSendAddress('');
  };
  
  const handleSendDialogClose = () => {
    setShowSendDialog(false);
  };
  
  const handleSend = async () => {
    if (!sendAmount || !sendAddress) {
      setSendError('Please enter both amount and address');
      return;
    }
    
    if (!ethers.isAddress(sendAddress)) {
      setSendError('Invalid Ethereum address');
      return;
    }
    
    try {
      setSendLoading(true);
      setSendError('');
      
      const tx = await signer.sendTransaction({
        to: sendAddress,
        value: ethers.parseEther(sendAmount)
      });
      
      await tx.wait();
      setSendSuccess(true);
      
      // Update balance
      const newBalance = await provider.getBalance(account);
      setBalance(ethers.formatEther(newBalance));
      
      setTimeout(() => {
        handleSendDialogClose();
      }, 2000);
    } catch (err) {
      console.error('Error sending transaction:', err);
      setSendError(err.message || 'Failed to send transaction');
    } finally {
      setSendLoading(false);
    }
  };
  
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
  
  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleString();
  };
  
  // Prepare chart data
  const chartData = {
    labels: sentimentHistory.map(item => formatDate(item.timestamp)),
    datasets: [
      {
        label: 'Sentiment Score',
        data: sentimentHistory.map(item => item.sentiment * 100),
        borderColor: theme.palette.primary.main,
        backgroundColor: 'rgba(0, 201, 255, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };
  
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `${selectedCrypto} Sentiment History`,
      },
    },
    scales: {
      y: {
        min: -100,
        max: 100,
        ticks: {
          callback: function(value) {
            return value + '%';
          }
        }
      }
    }
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
        Wallet & Blockchain
      </Typography>
      
      {!isConnected ? (
        <Card sx={{ mb: 4, background: 'linear-gradient(90deg, rgba(0,201,255,0.1) 0%, rgba(146,254,157,0.1) 100%)', border: '1px solid rgba(0, 201, 255, 0.2)' }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <WalletIcon sx={{ fontSize: 60, color: theme.palette.primary.main, mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Connect Your Wallet
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Connect your MetaMask wallet to interact with the blockchain and access your account details.
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              size="large"
              onClick={connectWallet}
              disabled={isConnecting}
              sx={{ px: 4, py: 1.5 }}
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </Button>
            
            {web3Error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {web3Error}
              </Alert>
            )}
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={5}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <WalletIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
                    <Typography variant="h6">
                      Wallet Details
                    </Typography>
                  </Box>
                  <Tooltip title="Refresh data">
                    <IconButton 
                      onClick={handleRefresh} 
                      disabled={refreshing || loading}
                      color="primary"
                      size="small"
                    >
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
                <Divider sx={{ mb: 2 }} />
                
                {loading ? (
                  <Box sx={{ width: '100%' }}>
                    <LinearProgress color="primary" />
                  </Box>
                ) : (
                  <List disablePadding>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText 
                        primary="Account Address" 
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <Typography variant="body2" component="span" sx={{ mr: 1 }}>
                              {account}
                            </Typography>
                            <IconButton size="small" onClick={copyToClipboard}>
                              {copied ? <CheckIcon fontSize="small" color="success" /> : <CopyIcon fontSize="small" />}
                            </IconButton>
                            <IconButton size="small" onClick={() => openExplorer()}>
                              <ExternalLinkIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        } 
                      />
                    </ListItem>
                    
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText 
                        primary="Network" 
                        secondary={
                          <Chip 
                            label={networkName} 
                            size="small" 
                            sx={{ 
                              mt: 0.5,
                              backgroundColor: 'rgba(0, 201, 255, 0.1)',
                              color: theme.palette.primary.main
                            }} 
                          />
                        } 
                      />
                    </ListItem>
                    
                    <ListItem sx={{ px: 0 }}>
                      <ListItemText 
                        primary="Balance" 
                        secondary={
                          loading ? (
                            <Skeleton width={100} height={24} sx={{ mt: 0.5 }} />
                          ) : (
                            <Typography variant="h6" component="span" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                              {balance} ETH
                            </Typography>
                          )
                        } 
                      />
                    </ListItem>
                  </List>
                )}
                
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button 
                    variant="outlined" 
                    startIcon={<SendIcon />}
                    onClick={handleSendDialogOpen}
                    fullWidth
                  >
                    Send
                  </Button>
                  <Button 
                    variant="outlined" 
                    startIcon={<SwapIcon />}
                    fullWidth
                    component="a"
                    href="https://app.uniswap.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Swap
                  </Button>
                </Box>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <InfoIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
                  <Typography variant="h6">
                    Contract Information
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                
                <TextField
                  label="Contract Address"
                  value={contractAddress}
                  onChange={(e) => setContractAddress(e.target.value)}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton 
                          edge="end"
                          onClick={() => openExplorer(contractAddress)}
                        >
                          <ExternalLinkIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                
                {error && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                  </Alert>
                )}
                
                {contractOwner && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Contract Owner:
                    </Typography>
                    <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                      {contractOwner}
                    </Typography>
                    
                    {isOwner && (
                      <Chip 
                        label="You are the owner" 
                        color="primary" 
                        size="small" 
                        sx={{ mt: 1 }} 
                      />
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={7}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Sentiment Data from Blockchain
                  </Typography>
                  <Box sx={{ flexGrow: 1 }} />
                  <Button 
                    startIcon={<RefreshIcon />}
                    size="small"
                    onClick={fetchSentimentData}
                    disabled={refreshing || !selectedCrypto}
                  >
                    Refresh
                  </Button>
                </Box>
                <Divider sx={{ mb: 3 }} />
                
                {loading ? (
                  <LinearProgress color="primary" />
                ) : cryptocurrencies.length > 0 ? (
                  <>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                      {cryptocurrencies.map((crypto, index) => (
                        <Chip
                          key={index}
                          label={crypto}
                          onClick={() => setSelectedCrypto(crypto)}
                          color={selectedCrypto === crypto ? 'primary' : 'default'}
                          variant={selectedCrypto === crypto ? 'filled' : 'outlined'}
                          sx={{ 
                            fontWeight: selectedCrypto === crypto ? 'bold' : 'normal',
                          }}
                        />
                      ))}
                    </Box>
                    
                    {sentimentData ? (
                      <Paper elevation={0} sx={{ p: 3, backgroundColor: 'rgba(0, 0, 0, 0.1)', borderRadius: 2, mb: 3 }}>
                        <Grid container spacing={3}>
                          <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              {getSentimentIcon(sentimentData.sentiment)}
                              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                Sentiment Score
                              </Typography>
                            </Box>
                            <Typography 
                              variant="h4" 
                              sx={{ 
                                fontWeight: 'bold', 
                                color: getSentimentColor(sentimentData.sentiment) 
                              }}
                            >
                              {(sentimentData.sentiment * 100).toFixed(0)}%
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              {sentimentData.sentiment > 0.5 ? 'Very Positive' : 
                               sentimentData.sentiment > 0 ? 'Positive' : 
                               sentimentData.sentiment > -0.5 ? 'Negative' : 'Very Negative'}
                            </Typography>
                          </Grid>
                          
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Confidence
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                              {(sentimentData.confidence * 100).toFixed(0)}%
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              Last Updated: {formatDate(sentimentData.timestamp)}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Paper>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                          No sentiment data available for {selectedCrypto}
                        </Typography>
                      </Box>
                    )}
                    
                    {sentimentHistory.length > 0 && (
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="h6" gutterBottom>
                          Sentiment History
                        </Typography>
                        <Box sx={{ height: 300, mb: 3 }}>
                          <Line data={chartData} options={chartOptions} />
                        </Box>
                        
                        <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                          <Table stickyHeader size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Date</TableCell>
                                <TableCell>Sentiment</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {sentimentHistory.map((record, index) => (
                                <TableRow key={index}>
                                  <TableCell>{formatDate(record.timestamp)}</TableCell>
                                  <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      {getSentimentIcon(record.sentiment)}
                                      <Typography 
                                        variant="body2" 
                                        sx={{ 
                                          ml: 1,
                                          fontWeight: 'bold', 
                                          color: getSentimentColor(record.sentiment) 
                                        }}
                                      >
                                        {(record.sentiment * 100).toFixed(0)}%
                                      </Typography>
                                    </Box>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>
                    )}
                  </>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <WarningIcon sx={{ fontSize: 48, color: theme.palette.warning.main, mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      No Data Available
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      There are no cryptocurrencies with sentiment data in the contract.
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      
      {/* Send Dialog */}
      <Dialog open={showSendDialog} onClose={handleSendDialogClose} maxWidth="xs" fullWidth>
        <DialogTitle>Send ETH</DialogTitle>
        <DialogContent>
          <TextField
            label="Recipient Address"
            value={sendAddress}
            onChange={(e) => setSendAddress(e.target.value)}
            fullWidth
            margin="normal"
            variant="outlined"
          />
          <TextField
            label="Amount (ETH)"
            value={sendAmount}
            onChange={(e) => setSendAmount(e.target.value)}
            fullWidth
            margin="normal"
            variant="outlined"
            type="number"
            InputProps={{
              endAdornment: <InputAdornment position="end">ETH</InputAdornment>,
            }}
          />
          
          {sendError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {sendError}
            </Alert>
          )}
          
          {sendSuccess && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Transaction sent successfully!
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSendDialogClose} disabled={sendLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSend} 
            variant="contained" 
            color="primary"
            disabled={sendLoading || !sendAmount || !sendAddress}
          >
            {sendLoading ? 'Sending...' : 'Send'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Wallet; 