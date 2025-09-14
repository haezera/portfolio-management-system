import pandas as pd
from .DataBase import PSQLDataBase
from .Responses import WeightsResponse
from fastapi import HTTPException
from dataclasses import dataclass
from sklearn.linear_model import Ridge
import numpy as np

@dataclass
class WeightResponse:
    weights: dict
    sector_breakdown: dict

class AlphaModel:
    def get_weights_on_date(date: str, lookback: int, overlay_weight: float, factors: list[str], db: PSQLDataBase):
        # ensure the date is the end of the month
        date_pd = pd.to_datetime(date)
        end_of_month_date = date_pd + pd.offsets.MonthEnd(0)

        # now we have to check for validility of these dates
        tr_end = end_of_month_date - pd.DateOffset(months=4) + pd.offsets.MonthEnd(0)
        tr_start = tr_end - pd.DateOffset(months=lookback+4) + pd.offsets.MonthEnd(0)
        # above, we + 4 to lookback to have three extra months to lookback for the 
        # forward +3 months lookahead bias
    
        date_validities, bounds = db.are_dates_valid('portfolio_data', [tr_start, tr_end, end_of_month_date])

        if False in date_validities:
            raise HTTPException(
                status_code=400,
                detail=f"One of the dates is out of bounds. "
                    f"Max date: {bounds.max_date}, Min date: {bounds.min_date}"
            )
        
        # fetch the required market data and split into training and testing
        portfolio_data = db.fetch_between_dates('portfolio_data', tr_start, end_of_month_date, None)

        # check factors are valid and are contained in the portfolio data
        missing_factors = [f for f in factors if f not in portfolio_data.columns]
        if missing_factors:
            raise HTTPException(
                status_code=400,
                detail=f"The following factors do not exist in portfolio_data: {missing_factors}"
            )


        tr_data = portfolio_data[
            (portfolio_data['date'] >= tr_start.date()) &
            (portfolio_data['date'] <= tr_end.date())
        ].copy()
        pred_data = portfolio_data[portfolio_data['date'] == end_of_month_date.date()].copy()

        # train the model
        X_tr = tr_data[factors]
        y_tr = tr_data['t_plus_3_return']

        alpha_model = Ridge(alpha=1.0)
        alpha_model.fit(X_tr, y_tr)

        coeff_dict = dict(zip(factors, np.round(alpha_model.coef_, 4)))

        # get the predicted returns
        X_tst = pred_data[factors]
        pred_data['pred_return'] = alpha_model.predict(X_tst)
        
        # now get passive index weights and alpha overlay
        passive_weights = pred_data['index_weight']
        inverse_vol = 1 / pred_data['estimated_vol']
        raw_scores = pred_data['pred_return'] * inverse_vol 
        centered_scores = raw_scores - raw_scores.mean()
        alpha_weights = overlay_weight * centered_scores / centered_scores.abs().sum()

        # now we can get the total weights
        portfolio_weights = passive_weights + alpha_weights
        pred_data['portfolio_weight'] = portfolio_weights
        per_sector_breakdown = {
            sector: {
                "long": weights[weights > 0].sum(),
                "short": weights[weights < 0].sum()
            }
            for sector, weights in pred_data.groupby("sector")["portfolio_weight"]
        }

        # Build a dictionary mapping tickers to their portfolio weights
        portfolio_weights_dict = dict(zip(pred_data['ticker'], portfolio_weights))

        return WeightsResponse(
            portfolio_weights=portfolio_weights_dict,
            model_coef=coeff_dict,
            sector_weights=per_sector_breakdown
        )

        
        


