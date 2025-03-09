# VyperSense

An AI-powered cryptocurrency sentiment analysis bot that monitors news, analyzes market sentiment, generates trading signals, and records data on the blockchain.

<p align="center">
<img src="./icon.jpeg" alt="VyperSense Logo" width="400"/>
</p>

## Overview

VyperSense is an autonomous agent that:

1. **Monitors Cryptocurrency News**: Fetches the latest news from crypto news sources
2. **Analyzes Sentiment**: Uses OpenAI's GPT-4 to analyze the sentiment of news articles
3. **Generates Trading Signals**: Creates buy/sell/hold signals based on sentiment analysis
4. **Creates Visualizations**: Generates professional trading signal visualizations using DALL-E
5. **Posts to Social Media**: Shares insights and visualizations on Twitter
6. **Records on Blockchain**: Stores sentiment data on the Polygon blockchain for transparency and verification

## Setting up your dev environment

1. Install [uv](https://github.com/astral-sh/uv): `pip install uv`
2. Clone this repository and cd into it: `git clone <repository-url> && cd VyperSense`
3. Set up a virtual environment: `uv venv`
4. Activate the virtual environment: `source .venv/bin/activate`
5. Install the Python dependencies: `uv pip install .`
6. Install the [moccasin](https://github.com/Cyfrin/moccasin) dependencies: `uv run moccasin install`
7. Set up your `.env` file and fill in the values based on the provided `.env.example` file

## Environment Variables

Create a `.env` file with the following variables:

```
POLYGONSCAN_TOKEN=your_polygonscan_api_key
BLOCKSCOUT_POLYGON_KEY=your_blockscout_api_key
OPEN_AI_KEY=your_openai_api_key
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_ACCESS_TOKEN=your_twitter_access_token
TWITTER_ACCESS_SECRET=your_twitter_access_secret
TWITTER_BEARER_TOKEN=your_twitter_bearer_token
CRYPTO_NEWS_API_KEY=your_crypto_news_api_key
FEED_URL=https://cointelegraph.com/rss
```

## Running the Bot

### Deploy the Sentiment Tracker Contract

```bash
uv run moccasin deploy --network polygon
```

### Run the Agent

```bash
python script/run_agent.py --deploy-contract
```

### Command Line Options

- `--network <network>`: Blockchain network to use (default: polygon-fork)
- `--deploy-contract`: Deploy a new sentiment tracker contract
- `--contract-address <address>`: Address of an existing sentiment tracker contract
- `--no-twitter`: Disable Twitter posting
- `--no-blockchain`: Disable blockchain integration
- `--run-once`: Run once and exit

## Project Structure

- `agent/`: Contains the agent implementation
  - `model/`: Data models
  - `services/`: Service implementations (news, AI, Twitter, blockchain)
- `src/`: Smart contract code
  - `SentimentTracker.vy`: Vyper contract for tracking sentiment data
- `script/`: Scripts for running the agent
- `tests/`: Test files

## How It Works

1. The agent polls cryptocurrency news sources for new articles
2. It analyzes the sentiment of each article using OpenAI's GPT-4
3. It generates trading signals for top cryptocurrencies based on sentiment analysis
4. For high-confidence signals, it creates visualizations using DALL-E
5. It posts the trading signals and visualizations to Twitter
6. It records the sentiment data on the Polygon blockchain for transparency

## Extending the Project

Here are some ideas for extending the project:

1. **Alternative Data Sources**: Add support for social media monitoring, on-chain data, or market data
2. **Advanced Analytics**: Implement more sophisticated sentiment analysis algorithms
3. **Trading Integration**: Connect to trading APIs to execute trades based on signals
4. **Web Dashboard**: Create a web interface to visualize sentiment data and trading signals
5. **Multi-chain Support**: Extend blockchain integration to other chains like Ethereum, Solana, etc.