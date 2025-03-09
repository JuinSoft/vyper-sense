# VyperSense

An AI-powered cryptocurrency sentiment analysis bot that monitors news, analyzes market sentiment, generates trading signals, and records data on the blockchain.

<p align="center">
<img src="./icon.jpeg" alt="VyperSense Logo" width="400"/>
</p>

## Contract Address
Deployed CONTRACT Address - https://www.oklink.com/amoy/address/0x22633574a82ffc4d5d88ccab7887799c188544e3 [Polygon Amoy]

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

You can deploy the contract using either of these methods:

```bash
# Method 1: Using the deploy script
python script/deploy.py --network polygon-fork

# Method 2: Using moccasin directly
uv run moccasin deploy SentimentTracker --network polygon-fork
```

### Run the Agent

```bash
python script/run_agent.py --deploy-contract
```

Or if you already have a deployed contract:

```bash
python script/run_agent.py --contract-address YOUR_CONTRACT_ADDRESS
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

## Web Interface

The project now includes a modern web interface with MetaMask integration for interacting with the sentiment tracker contract and visualizing sentiment data.

### Features

- **MetaMask Integration**: Connect your Ethereum wallet to interact with the blockchain
- **Dashboard**: View sentiment analysis and trading signals at a glance
- **Sentiment Analysis**: Explore detailed sentiment data for various cryptocurrencies
- **Trading Signals**: View buy/sell/hold signals based on sentiment analysis
- **Wallet Management**: Manage your wallet and interact with the sentiment tracker contract
- **Real-time Data**: Uses OpenAI API to analyze news and generate trading signals
- **Blockchain Integration**: Records sentiment data on the Polygon Amoy blockchain
- **Visualization**: Generates visualizations for high-confidence trading signals

### Running the Web Interface

1. Navigate to the web directory:
   ```
   cd web
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with your OpenAI API key:
   ```
   REACT_APP_OPENAI_API_KEY=your_openai_api_key_here
   ```

4. Start the development server:
   ```
   npm start
   ```

5. Open your browser and navigate to `http://localhost:3000`

For more details, see the [Web Interface README](./web/README.md).