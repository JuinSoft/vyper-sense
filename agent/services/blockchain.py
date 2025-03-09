import logging
from typing import Optional
from moccasin.config import get_config, initialize_global_config
from moccasin.named_contract import NamedContract
from web3 import Web3

logger = logging.getLogger(__name__)

DEFAULT_NETWORK_NAME = "polygon-amoy"
DEFAULT_CONTRACT_ADDRESS = "0x22633574A82ffC4d5d88ccAb7887799c188544e3"

class BlockchainService:
    def __init__(self):
        """Initialize the blockchain service"""
        self.network = None
        try:
            # Try to get the config, initialize it if not already initialized
            try:
                config = get_config()
            except Exception as e:
                if "Global Config object not initialized" in str(e):
                    logger.info("Initializing global config in BlockchainService")
                    initialize_global_config()
                    config = get_config()
                else:
                    raise e
                
            self.network = config.networks.get_network(DEFAULT_NETWORK_NAME)
            logger.info(f"Connected to blockchain network: {self.network.name}")
        except Exception as e:
            logger.error(f"Failed to connect to blockchain network: {str(e)}")
            
    def set_network(self, network_name: str) -> bool:
        """
        Set the active blockchain network
        
        Args:
            network_name: Name of the network to use
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Try to get the config, initialize it if not already initialized
            try:
                config = get_config()
            except Exception as e:
                if "Global Config object not initialized" in str(e):
                    logger.info("Initializing global config in set_network")
                    initialize_global_config()
                    config = get_config()
                else:
                    raise e
                
            self.network = config.networks.get_network(network_name)
            logger.info(f"Switched to blockchain network: {self.network.name}")
            return True
        except Exception as e:
            logger.error(f"Failed to switch blockchain network: {str(e)}")
            return False
            
    def deploy_sentiment_tracker(self, name: str) -> Optional[str]:
        """
        Deploy a sentiment tracker contract
        
        Args:
            name: Name of the sentiment tracker
            
        Returns:
            Contract address if successful, None otherwise
        """
        try:
            if not self.network:
                logger.error("No blockchain network connection available")
                return None
                
            # Deploy the SentimentTracker contract
            sentiment_tracker = self.network.deploy_contract(
                contract_name="SentimentTracker",
                constructor_args=[name]
            )
            
            contract_address = sentiment_tracker.address
            logger.info(f"Deployed VyperSense SentimentTracker contract at {contract_address}")
            return contract_address
            
        except Exception as e:
            logger.error(f"Failed to deploy sentiment tracker contract: {str(e)}")
            return None
            
    def record_sentiment(self, contract_address: str, cryptocurrency: str, 
                         sentiment_score: float, timestamp: int) -> bool:
        """
        Record sentiment data on the blockchain
        
        Args:
            contract_address: Address of the SentimentTracker contract
            cryptocurrency: Name of the cryptocurrency
            sentiment_score: Sentiment score (-1.0 to 1.0)
            timestamp: Unix timestamp
            
        Returns:
            True if successful, False otherwise
        """
        try:
            if not contract_address:
                contract_address = "0x22633574A82ffC4d5d88ccAb7887799c188544e3"
            if not self.network:
                self.network = get_config().networks.get_network("polygon-amoy")

            
            # Get the contract instance
            contract = get_config().get_active_network().get_or_deploy_named("SentimentTracker")
            logger.info(f"Contract: {contract}")
                
            # Convert sentiment score to int128 (multiply by 100 to preserve 2 decimal places)
            sentiment_int = int(sentiment_score * 100)
            
            # Ensure sentiment_int is within int128 range
            if sentiment_int < -100 or sentiment_int > 100:
                raise ValueError("Sentiment score must be between -1.0 and 1.0")
            
            # Convert timestamp to uint256
            timestamp_u256 = int(timestamp) & ((1 << 256) - 1)  # Convert to uint256 by masking to 256 bits
            
            
            # Record the sentiment
            try:
                tx_hash = contract.record_sentiment(
                    cryptocurrency,
                    sentiment_int,
                    timestamp_u256
                )
                logger.info(f"Transaction hash: {tx_hash}")
            except Exception as e:
                logger.error(f"Invalid argument when recording sentiment: {str(e)}")
                return False
            
            # Wait for transaction to be mined
            self.network.w3.eth.wait_for_transaction_receipt(tx_hash)
            
            logger.info(f"Recorded sentiment for {cryptocurrency} on blockchain")
            return True
            
        except Exception as e:
            logger.error(f"Failed to record sentiment on blockchain: {str(e)}")
            return False
            
    def get_sentiment_history(self, contract_address: str, cryptocurrency: str) -> list:
        """
        Get sentiment history for a cryptocurrency
        
        Args:
            contract_address: Address of the SentimentTracker contract
            cryptocurrency: Name of the cryptocurrency
            
        Returns:
            List of sentiment records
        """
        try:
            if not contract_address:
                contract_address = "0x22633574A82ffC4d5d88ccAb7887799c188544e3"
            if not self.network:
                self.network = get_config().networks.get_network("polygon-amoy")

            # Get the contract instance
            contract = get_config().get_active_network().get_or_deploy_named("SentimentTracker")
            
            # Get the sentiment history
            history = contract.get_sentiment_history(cryptocurrency)
            
            # Convert the data to a more usable format
            formatted_history = []
            for record in history:
                formatted_history.append({
                    'sentiment': record[0] / 100.0,  # Convert back to float
                    'timestamp': record[1]
                })
                
            return formatted_history
            
        except Exception as e:
            logger.error(f"Failed to get sentiment history: {str(e)}")
            return [] 