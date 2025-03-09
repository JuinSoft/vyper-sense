#!/usr/bin/env python3
import sys
import os
import logging
import argparse
from typing import Optional, Dict, Any

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from moccasin.config import get_config
from moccasin.network import Network

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

def parse_args():
    parser = argparse.ArgumentParser(description='Deploy SentimentTracker contract')
    parser.add_argument('--network', type=str, default='polygon-fork', help='Blockchain network to use')
    parser.add_argument('--name', type=str, default='CryptoSentimentTracker', help='Name for the sentiment tracker')
    return parser.parse_args()

def deploy(network: Network, constructor_args: list) -> Dict[str, Any]:
    """
    Deploy the SentimentTracker contract
    
    Args:
        network: The network to deploy to
        constructor_args: The arguments to pass to the constructor
        
    Returns:
        Dictionary with contract deployment information
    """
    name = constructor_args[0] if constructor_args else "CryptoSentimentTracker"
    logger.info(f"Deploying SentimentTracker contract with name '{name}'...")
    
    # Deploy the contract
    contract = network.deploy_contract(
        contract_name="SentimentTracker",
        constructor_args=constructor_args
    )
    
    logger.info(f"SentimentTracker contract deployed at: {contract.address}")
    logger.info(f"Transaction hash: {contract.tx_hash}")
    
    return {
        "address": contract.address,
        "tx_hash": contract.tx_hash
    }

def main():
    args = parse_args()
    
    logger.info(f"Deploying SentimentTracker contract to {args.network} network...")
    
    # Get the network configuration
    config = get_config()
    network = config.get_network(args.network)
    
    # Deploy the contract
    result = deploy(network, [args.name])
    
    return result["address"]

# This is the function that Moccasin will call
def deploy_contract(network: Network, constructor_args: list) -> Dict[str, Any]:
    """
    Entry point for Moccasin to deploy the contract
    
    Args:
        network: The network to deploy to
        constructor_args: The arguments to pass to the constructor
        
    Returns:
        Dictionary with contract deployment information
    """
    return deploy(network, constructor_args)

if __name__ == "__main__":
    main() 