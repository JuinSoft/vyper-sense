#!/usr/bin/env python3
import logging
import time
from datetime import datetime
import argparse
import sys
import os

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from agent.config import (
    FEED_URL, OPENAI_API_KEY, TWITTER_API_KEY, TWITTER_API_SECRET,
    TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET, TOP_CRYPTOCURRENCIES,
    POLLING_INTERVAL
)
from agent.services.news import NewsService
from agent.services.ai_service import AIService
from agent.services.twitter import TwitterService
from agent.services.blockchain import BlockchainService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('crypto_sentiment_bot.log')
    ]
)

logger = logging.getLogger(__name__)


def parse_args():
    parser = argparse.ArgumentParser(description='VyperSense - AI-powered cryptocurrency sentiment analysis')
    parser.add_argument('--network', type=str, default='polygon-fork', help='Blockchain network to use')
    parser.add_argument('--deploy-contract', action='store_true', help='Deploy a new sentiment tracker contract')
    parser.add_argument('--contract-address', type=str, help='Address of an existing sentiment tracker contract')
    parser.add_argument('--no-twitter', action='store_true', help='Disable Twitter posting')
    parser.add_argument('--no-blockchain', action='store_true', help='Disable blockchain integration')
    parser.add_argument('--run-once', action='store_true', help='Run once and exit')
    return parser.parse_args()


def main():
    args = parse_args()
    
    # Initialize services
    logger.info("Initializing VyperSense...")
    
    news_service = NewsService(FEED_URL)
    ai_service = AIService(OPENAI_API_KEY)
    
    # Initialize Twitter service if enabled
    twitter_service = None
    if not args.no_twitter and all([TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET]):
        twitter_service = TwitterService(
            TWITTER_API_KEY,
            TWITTER_API_SECRET,
            TWITTER_ACCESS_TOKEN,
            TWITTER_ACCESS_SECRET
        )
        logger.info("Twitter service initialized")
    else:
        logger.info("Twitter service disabled or missing credentials")
    
    # Initialize blockchain service if enabled
    blockchain_service = None
    contract_address = args.contract_address
    
    if not args.no_blockchain:
        blockchain_service = BlockchainService()
        
        # Deploy a new contract if requested
        if args.deploy_contract and not contract_address:
            contract_address = blockchain_service.deploy_sentiment_tracker("CryptoSentimentTracker")
            if contract_address:
                logger.info(f"Deployed new sentiment tracker contract at {contract_address}")
            else:
                logger.error("Failed to deploy sentiment tracker contract")
        
        if contract_address:
            logger.info(f"Using sentiment tracker contract at {contract_address}")
        else:
            logger.warning("No contract address provided, blockchain recording disabled")
    
    # Main loop
    logger.info("Starting main loop...")
    
    try:
        while True:
            run_cycle(
                news_service, 
                ai_service, 
                twitter_service, 
                blockchain_service, 
                contract_address
            )
            
            if args.run_once:
                logger.info("Run once mode enabled, exiting")
                break
                
            logger.info(f"Sleeping for {POLLING_INTERVAL} seconds...")
            time.sleep(POLLING_INTERVAL)
            
    except KeyboardInterrupt:
        logger.info("Received keyboard interrupt, shutting down")
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise


def run_cycle(news_service, ai_service, twitter_service, blockchain_service, contract_address):
    """Run a single cycle of the agent"""
    logger.info("Starting new cycle")
    
    # Step 1: Fetch news articles
    logger.info("Fetching news articles...")
    articles = news_service.poll_feed()
    logger.info(f"Fetched {len(articles)} new articles")
    
    if not articles:
        logger.info("No new articles to process")
        return
    
    # Step 2: Analyze sentiment
    logger.info("Analyzing sentiment...")
    sentiment_analyses = ai_service.analyze_sentiment(articles)
    logger.info(f"Generated {len(sentiment_analyses)} sentiment analyses")
    
    if not sentiment_analyses:
        logger.info("No sentiment analyses generated")
        return
    
    # Step 3: Generate trading signals
    logger.info("Generating trading signals...")
    trading_signals = ai_service.generate_trading_signals(sentiment_analyses, TOP_CRYPTOCURRENCIES)
    logger.info(f"Generated {len(trading_signals)} trading signals")
    
    if not trading_signals:
        logger.info("No trading signals generated")
        return
    
    # Process each trading signal
    for signal in trading_signals:
        logger.info(f"Processing signal for {signal.cryptocurrency}: {signal.signal_type.upper()}")
        
        # Step 4: Generate visualization
        image_url = None
        if signal.confidence > 0.6:  # Only generate images for high-confidence signals
            logger.info("Generating visualization...")
            image_url = ai_service.generate_visualization(signal)
            if image_url:
                logger.info("Visualization generated successfully")
                signal.image_url = image_url
            else:
                logger.warning("Failed to generate visualization")
        
        # Step 5: Post to Twitter
        if twitter_service:
            # Prepare tweet text
            emoji = "🟢" if signal.signal_type == "buy" else "🔴" if signal.signal_type == "sell" else "🟡"
            tweet_text = (
                f"{emoji} #{signal.cryptocurrency} {signal.signal_type.upper()} SIGNAL | "
                f"Sentiment: {signal.sentiment_score:.2f} | "
                f"Confidence: {signal.confidence:.2f}\n\n"
                f"{signal.reasoning[:100]}...\n\n"
                f"#crypto #trading #sentiment"
            )
            
            logger.info("Posting to Twitter...")
            success = twitter_service.post_tweet(tweet_text, image_url)
            if success:
                logger.info("Posted to Twitter successfully")
            else:
                logger.warning("Failed to post to Twitter")
        
        # Step 6: Record on blockchain
        if blockchain_service and contract_address:
            logger.info("Recording sentiment on blockchain...")
            timestamp = int(signal.timestamp.timestamp())
            success = blockchain_service.record_sentiment(
                contract_address,
                signal.cryptocurrency,
                signal.sentiment_score,
                timestamp
            )
            if success:
                logger.info("Recorded sentiment on blockchain successfully")
            else:
                logger.warning("Failed to record sentiment on blockchain")


if __name__ == "__main__":
    main() 