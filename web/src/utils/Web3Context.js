import React, { createContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

// Create context
export const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [networkName, setNetworkName] = useState('');

  // Network names mapping
  const networks = {
    1: 'Ethereum Mainnet',
    5: 'Goerli Testnet',
    11155111: 'Sepolia Testnet',
    137: 'Polygon Mainnet',
    80001: 'Polygon Mumbai',
    421613: 'Arbitrum Goerli',
    42161: 'Arbitrum One',
    10: 'Optimism',
    420: 'Optimism Goerli',
    43114: 'Avalanche C-Chain',
    43113: 'Avalanche Fuji',
  };

  // Initialize provider
  useEffect(() => {
    const initProvider = async () => {
      if (window.ethereum) {
        try {
          const ethersProvider = new ethers.BrowserProvider(window.ethereum);
          setProvider(ethersProvider);

          // Get chain ID
          const network = await ethersProvider.getNetwork();
          const currentChainId = Number(network.chainId);
          setChainId(currentChainId);
          setNetworkName(networks[currentChainId] || `Chain ID: ${currentChainId}`);

          // Check if already connected
          const accounts = await ethersProvider.listAccounts();
          if (accounts.length > 0) {
            const ethersSigner = await ethersProvider.getSigner();
            setAccount(accounts[0].address);
            setSigner(ethersSigner);
            setIsConnected(true);
          }
        } catch (err) {
          console.error('Error initializing provider:', err);
          setError('Failed to initialize Web3 provider');
        }
      } else {
        setError('MetaMask is not installed');
      }
    };

    initProvider();
  }, []);

  // Handle account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          // User disconnected
          setAccount(null);
          setSigner(null);
          setIsConnected(false);
        } else {
          // Account changed
          setAccount(accounts[0]);
          setIsConnected(true);
          // Update signer
          if (provider) {
            provider.getSigner().then(newSigner => {
              setSigner(newSigner);
            });
          }
        }
      };

      const handleChainChanged = (chainIdHex) => {
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [provider]);

  // Connect wallet function
  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      setError('MetaMask is not installed');
      return false;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        setAccount(accounts[0]);
        
        // Update provider and signer
        const ethersProvider = new ethers.BrowserProvider(window.ethereum);
        setProvider(ethersProvider);
        
        const ethersSigner = await ethersProvider.getSigner();
        setSigner(ethersSigner);
        
        // Get network info
        const network = await ethersProvider.getNetwork();
        const currentChainId = Number(network.chainId);
        setChainId(currentChainId);
        setNetworkName(networks[currentChainId] || `Chain ID: ${currentChainId}`);
        
        setIsConnected(true);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError(err.message || 'Failed to connect wallet');
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Disconnect wallet function
  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setSigner(null);
    setIsConnected(false);
  }, []);

  // Switch network function
  const switchNetwork = useCallback(async (targetChainId) => {
    if (!window.ethereum) {
      setError('MetaMask is not installed');
      return false;
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
      return true;
    } catch (switchError) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          // Add the network
          // You would need to define the network parameters here
          return false;
        } catch (addError) {
          setError('Failed to add network');
          return false;
        }
      }
      setError('Failed to switch network');
      return false;
    }
  }, []);

  // Get shortened address
  const getShortenedAddress = useCallback((address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }, []);

  // Context value
  const contextValue = {
    account,
    provider,
    signer,
    chainId,
    networkName,
    isConnected,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    getShortenedAddress,
  };

  return (
    <Web3Context.Provider value={contextValue}>
      {children}
    </Web3Context.Provider>
  );
}; 