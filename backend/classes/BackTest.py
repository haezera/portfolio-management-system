import pandas as pd
from .DataBase import PSQLDataBase
from fastapi import HTTPException
from sklearn.linear_model import Ridge
from collections import defaultdict
from scipy.stats.mstats import zscore
import numpy as np

class BackTest:
    def __init__(
        self,
        start_date: str, 
        end_date: str, 
        lookback: int, 
        factors: list[str],
        overlay_weight: float, 
        transaction_costs: float,
        db: PSQLDataBase
    ):
        # first check if dates are valid
        date_validities, bounds = db.are_dates_valid('portfolio_data', [start_date, end_date])
        if False in date_validities:
            raise HTTPException(
                status_code=400,
                detail=f"One of the dates is out of bounds. "
                    f"Max date: {bounds.max_date}, Min date: {bounds.min_date}"
            )

        self.start_date = start_date
        self.end_date = end_date
        self.lookback = lookback
        self.factors = factors
        self.overlay_weight = overlay_weight
        self.transaction_costs = transaction_costs
        self.db = db

    def backtest(self) -> pd.DataFrame:
        portfolio_data = self.db.fetch_between_dates(
            'portfolio_data',
            self.start_date,
            self.end_date,
            None
        ).sort_values(['date', 'ticker'])

        # check factors are valid
        missing_factors = [f for f in self.factors if f not in portfolio_data.columns]
        if missing_factors:
            raise HTTPException(
                status_code=400,
                detail=f"The following factors do not exist in portfolio_data: {missing_factors}"
            )
        print(self.factors)
        # Extract numpy arrays for fast operations
        dates = portfolio_data["date"].to_numpy()
        tickers = portfolio_data["ticker"].to_numpy()
        factor_arrays = portfolio_data[self.factors].to_numpy()
        t_plus_3_return = portfolio_data["t_plus_3_return"].to_numpy()
        returns = portfolio_data["return"].to_numpy()
        estimated_vol = portfolio_data["estimated_vol"].to_numpy()
        index_weight = portfolio_data["index_weight"].to_numpy()

        months = np.unique(dates)
        start_idx = self.lookback + 4

        self.backtest_results = []
        self.portfolio_weights = []
        self.alpha_models = {}
        self.model_coefficients = []

        for i in range(start_idx, len(months)):
            # we start 4 months back, as the predictor in the
            # training model is 3 month future returns.
            tr_end = i - 4
            tr_start = tr_end - self.lookback

            # mask for training data
            mask_tr = (dates >= months[tr_start]) & (dates <= months[tr_end])
            X_tr = factor_arrays[mask_tr]
            y_tr = t_plus_3_return[mask_tr]

            alpha_model = Ridge(alpha=1.0)
            alpha_model.fit(X_tr, y_tr)

            # save the actual model for the month
            # this will be useful for historical goodness-of-fit
            self.alpha_models[months[i]] = alpha_model

            # save model coefficients (z-scored)
            zscored_coefs = zscore(alpha_model.coef_)
            model_coeffs = dict(zip(self.factors, zscored_coefs))
            model_coeffs['date'] = months[i]
            self.model_coefficients.append(model_coeffs)

            # mask for prediction data
            mask_pred = (dates == months[i])
            X_pred = factor_arrays[mask_pred]
            tickers_pred = tickers[mask_pred]
            index_weight_pred = index_weight[mask_pred]
            estimated_vol_pred = estimated_vol[mask_pred]
            returns_pred = returns[mask_pred]

            pred_return = alpha_model.predict(X_pred)

            # now get portfolio weights (all np arrays)
            passive_weights = index_weight_pred
            inverse_vol = 1.0 / estimated_vol_pred
            raw_scores = pred_return * inverse_vol
            centered_scores = raw_scores - raw_scores.mean()
            alpha_overlay = 0.6 * centered_scores / np.abs(centered_scores).sum()
            portfolio_weights_arr = passive_weights + alpha_overlay

            # Store portfolio weights as list of (ticker, weight)
            self.portfolio_weights.append({
                'date': months[i],
                'portfolio_weights': list(zip(tickers_pred.tolist(), portfolio_weights_arr.tolist()))
            })

            # and get portfolio returns
            self.backtest_results.append({
                'date': months[i],
                'portfolio_return': float(np.dot(portfolio_weights_arr, returns_pred)) - self.transaction_costs,
                'passive_return': float(np.dot(passive_weights, returns_pred))
            })

        backtest_results = pd.DataFrame(self.backtest_results)
        backtest_results['cum_portfolio'] = (1 + backtest_results['portfolio_return']).cumprod() - 1
        backtest_results['cum_passive'] = (1 + backtest_results['passive_return']).cumprod() - 1

        return backtest_results.to_dict(orient='records')

    def factor_exposures(self):
        if self.model_coefficients is None:
            raise HTTPException(
                status_code=400,
                detail='Backtest has not been run yet.'
            )
        
        return self.model_coefficients

    def beta_exposures(self, window_length: int):
        # get the rolling beta exposure with the given window length
        backtest_df = pd.DataFrame(self.backtest_results)
        backtest_df = backtest_df.sort_values('date')
        rolling_cov = backtest_df['portfolio_return'].rolling(window=window_length).cov(backtest_df['passive_return'])
        rolling_var = backtest_df['passive_return'].rolling(window=window_length).var()
        rolling_beta = rolling_cov / rolling_var

        # ensure no nas
        rolling_beta_df = pd.DataFrame({
            'date': backtest_df['date'],
            'rolling_beta': rolling_beta
        }).dropna()

        return rolling_beta_df.to_dict(orient='records')