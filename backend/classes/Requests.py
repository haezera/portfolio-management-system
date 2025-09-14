from pydantic import BaseModel

class BacktestRequest(BaseModel):
    start_date: str             # start date of backtest
    end_date: str               # end date of backtest
    lookback: int               # lookback window
    factors: list[str]          # list of factors the user wishes to use from ['EVEBIT', 'EVEBITDA', 'PE', 'PB', 'PS', 'MOMENTUM']
    overlay_weight: float       # the long/short component overlay weight - 0.6 indicates a 30/30 overlay (30 + 30)
    transaction_costs: float    # transaction costs assumption

class WeightRequest(BaseModel):
    date: str                   # end of month to find index weights for
    factors: list[str]          # list of factors the user wishes to use from ['EVEBIT', 'EVEBITDA', 'PE', 'PB', 'PS', 'MOMENTUM']
    overlay_weight: float       # the long/short component overlay weight - 0.6 indicates a 30/30 overlay (30 + 30)
    lookback: int               # months to look back

class DataRequest(BaseModel):
    table_name: str             # name of the table to get data from
    start_date: str | None      # start date of data fetching   
    end_date: str | None        # end date of data fetching
    tickers: list[str] | None   # tickers to pull