# VyperSense Web Interface

A modern web interface for the VyperSense cryptocurrency sentiment analysis tool.

## Features

- **MetaMask Integration**: Connect your Ethereum wallet to interact with the blockchain
- **Dashboard**: View sentiment analysis and trading signals at a glance
- **Sentiment Analysis**: Explore detailed sentiment data for various cryptocurrencies
- **Trading Signals**: View buy/sell/hold signals based on sentiment analysis
- **Wallet Management**: Manage your wallet and interact with the sentiment tracker contract

## New Features

### Cryptocurrency Icons
The application now uses the [cryptocurrency-icons](https://github.com/spothq/cryptocurrency-icons) package for displaying cryptocurrency icons instead of calling DALL-E. This provides consistent and recognizable icons for all major cryptocurrencies.

### Improved UI
- Added tabbed interface on the Dashboard for better organization
- Enhanced news card display with hover effects
- Improved market data display with favorites functionality
- Better responsive design for all screen sizes

### Caching
API responses are now cached for 5 minutes to improve performance and reduce API calls. The cache is automatically invalidated when:
- The user manually refreshes the data
- 5 minutes have passed since the last fetch
- The user adds or removes RSS feeds

### RSS Feed Management
Users can now manage multiple RSS feeds for news:
- Add custom RSS feeds
- Remove existing feeds
- Test feeds before adding them
- View news from all configured feeds

### LiveCoinWatch Integration
The application now uses the [LiveCoinWatch API](https://livecoinwatch.github.io/lcw-api-docs/) for real-time cryptocurrency market data:
- Current prices
- 24-hour price changes
- Market cap
- Trading volume

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- MetaMask browser extension
- OpenAI API key for sentiment analysis and visualization generation

### Installation

1. Clone the repository and navigate to the web directory:
   ```
   cd vyper-sense/web
   ```

2. Install dependencies:
   ```
   npm install
   ```
   or
   ```
   yarn install
   ```

3. Create a `.env` file in the web directory with your OpenAI API key:
   ```
   REACT_APP_OPENAI_API_KEY=your_openai_api_key_here
   ```
   You can copy the `.env.example` file and replace the placeholder with your actual API key.

4. Start the development server:
   ```
   npm start
   ```
   or
   ```
   yarn start
   ```

5. Open your browser and navigate to `http://localhost:3000`

## Building for Production

To build the application for production:

```
npm run build
```
or
```
yarn build
```

The build artifacts will be stored in the `build/` directory.

## MetaMask Integration

This application integrates with MetaMask to:

1. Connect to your Ethereum wallet
2. Display your account balance and network information
3. Interact with the VyperSense sentiment tracker contract
4. Send transactions

To use these features, you need to have the MetaMask extension installed in your browser and set up with an account.

## Contract Interaction

The application interacts with the VyperSense sentiment tracker contract deployed on the Polygon network. The default contract address is `0x22633574a82ffc4d5d88ccab7887799c188544e3` (Polygon Amoy testnet).

You can change the contract address in the Wallet page if needed.

## Technologies Used

- React.js
- Material-UI
- ethers.js
- Web3.js
- Chart.js
- React Router

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Environment Variables

To run this project, you will need to add the following environment variables to your .env file:

```
REACT_APP_OPENAI_API_KEY=your-openai-api-key
REACT_APP_LCW_API_KEY=your-livecoinwatch-api-key
```

You can obtain an API key for LiveCoinWatch by signing up at [livecoinwatch.com](https://www.livecoinwatch.com/). 