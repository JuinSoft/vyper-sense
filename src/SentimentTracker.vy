# @version ^0.3.7

"""
@title Cryptocurrency Sentiment Tracker
@author Jintu (JuinSoft)
@notice Tracks sentiment data for cryptocurrencies
"""

# Structs
struct SentimentRecord:
    sentiment: int128  # Sentiment score multiplied by 100 to handle 2 decimal places
    timestamp: uint256  # Unix timestamp

# Events
event SentimentRecorded:
    cryptocurrency: String[64]
    sentiment: int128
    timestamp: uint256

# State variables
name: public(String[100])
owner: public(address)
sentiment_data: public(HashMap[String[64], DynArray[SentimentRecord, 1000]])  # Maps cryptocurrency name to sentiment records

@external
def __init__(_name: String[100]):
    """
    @notice Initialize the sentiment tracker
    @param _name Name of the sentiment tracker
    """
    self.name = _name
    self.owner = msg.sender

@external
def record_sentiment(cryptocurrency: String[64], sentiment: int128, timestamp: uint256):
    """
    @notice Record sentiment data for a cryptocurrency
    @param cryptocurrency Name of the cryptocurrency
    @param sentiment Sentiment score (-100 to 100, representing -1.00 to 1.00)
    @param timestamp Unix timestamp when the sentiment was recorded
    """
    assert -100 <= sentiment <= 100, "Sentiment must be between -100 and 100"
    
    # Create a new sentiment record
    record: SentimentRecord = SentimentRecord({
        sentiment: sentiment,
        timestamp: timestamp
    })
    
    # Add the record to the cryptocurrency's history
    self.sentiment_data[cryptocurrency].append(record)
    
    # Emit event
    log SentimentRecorded(cryptocurrency, sentiment, timestamp)

@view
@external
def get_sentiment_history(cryptocurrency: String[64]) -> DynArray[SentimentRecord, 1000]:
    """
    @notice Get the sentiment history for a cryptocurrency
    @param cryptocurrency Name of the cryptocurrency
    @return Array of sentiment records
    """
    return self.sentiment_data[cryptocurrency]

@view
@external
def get_latest_sentiment(cryptocurrency: String[64]) -> (int128, uint256):
    """
    @notice Get the latest sentiment for a cryptocurrency
    @param cryptocurrency Name of the cryptocurrency
    @return Tuple of (sentiment, timestamp)
    """
    history: DynArray[SentimentRecord, 1000] = self.sentiment_data[cryptocurrency]
    if len(history) == 0:
        return (0, 0)  # Return default values if no history exists
    
    latest: SentimentRecord = history[len(history) - 1]
    return (latest.sentiment, latest.timestamp)

@view
@external
def get_average_sentiment(cryptocurrency: String[64], time_period: uint256) -> int128:
    """
    @notice Get the average sentiment for a cryptocurrency over a time period
    @param cryptocurrency Name of the cryptocurrency
    @param time_period Time period in seconds to consider (0 for all time)
    @return Average sentiment score
    """
    history: DynArray[SentimentRecord, 1000] = self.sentiment_data[cryptocurrency]
    if len(history) == 0:
        return 0  # Return 0 if no history exists
    
    current_time: uint256 = block.timestamp
    total_sentiment: int128 = 0
    count: uint256 = 0
    
    # Calculate the cutoff time
    cutoff_time: uint256 = 0
    if time_period > 0:
        cutoff_time = current_time - time_period
    
    # Sum up the sentiment scores within the time period
    for i in range(len(history)):
        if time_period == 0 or history[i].timestamp >= cutoff_time:
            total_sentiment += history[i].sentiment
            count += 1
    
    # Calculate the average
    if count == 0:
        return 0
    
    return total_sentiment / convert(count, int128) 