import logging
from typing import Optional
from moccasin.config import get_config
from moccasin.named_contract import NamedContract
from web3 import Web3

logger = logging.getLogger(__name__)


class BlockchainService:
    def __init__(self):
        """Initialize the blockchain service"""
        self.network = None
        try:
            self.network = get_config().get_active_network()
            logger.info(f"Connected to blockchain network: {self.network.name}")
        except Exception as e:
            logger.error(f"Failed to connect to blockchain network: {str(e)}")
            
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
            logger.info(f"Deployed SentimentTracker contract at {contract_address}")
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
            if not self.network:
                logger.error("No blockchain network connection available")
                return False
                
            # Convert sentiment score to integer (multiply by 100 to preserve 2 decimal places)
            sentiment_int = int(sentiment_score * 100)
            
            # Get the contract instance
            contract = self.network.get_contract(contract_address)
            
            # Record the sentiment
            tx_hash = contract.record_sentiment(
                cryptocurrency,
                sentiment_int,
                timestamp
            )
            
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
            if not self.network:
                logger.error("No blockchain network connection available")
                return []
                
            # Get the contract instance
            contract = self.network.get_contract(contract_address)
            
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