#!/usr/bin/env python3
import sys
import os
import logging
import argparse

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from moccasin.config import get_config

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

def main():
    args = parse_args()
    
    logger.info(f"Deploying SentimentTracker contract to {args.network} network...")
    
    # Get the network configuration
    config = get_config()
    network = config.get_network(args.network)
    
    # Deploy the contract
    contract = network.deploy_contract(
        contract_name="SentimentTracker",
        constructor_args=[args.name]
    )
    
    logger.info(f"SentimentTracker contract deployed at: {contract.address}")
    logger.info(f"Transaction hash: {contract.tx_hash}")
    
    return contract.address

if __name__ == "__main__":
    main() 