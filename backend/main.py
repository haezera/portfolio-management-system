from typing import Union, Dict
from fastapi import FastAPI
from dotenv import load_dotenv
from classes.DataBase import PSQLDataBase
from classes.AlphaModel import AlphaModel
from classes.BackTest import BackTest
from classes.Requests import DataRequest, WeightRequest, BacktestRequest
from classes.Responses import ErrorResponse
from fastapi import Depends, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from collections import defaultdict
import pandas as pd
import os
import uuid

"""
Caches and other stuff
"""

# for caching backtests, such that users can run
# backtest diagnostics after running initial backtest
# i think for now we can tie backtests to a UUID tag, and then
# each time a client wants a 
backtest_cache: Dict[uuid.UUID, BackTest] = {}

"""
Ensure you have run the database setup steps found in /data
"""

load_dotenv('../.env')
db_url = os.getenv('DB_URL')
db = PSQLDataBase(db_url)

app = FastAPI()

# you shouldn't include this for production level
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # allow all origins
    allow_credentials=True,
    allow_methods=["*"],   # allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],   # allow all headers
)


@app.get('/')
def root():
    return {
        'message': 'You have accessed the root!'
    }

@app.get('/v1/')
def v1_root():
    return {
        'message': 'You have accessed version 1 root!'
    }

@app.get('/v1/backtest/analytics/factor_exposure')
def v1_backtest_factor_exposure(backtest_id: str):
    if backtest_id not in backtest_cache:
        raise HTTPException(
            status_code=400,
            detail=f'Backtest {backtest_id} does not exist in cache.'
        )
    
    backtest = backtest_cache[backtest_id]
    try:
        factor_exposures = backtest.factor_exposures()
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f'{e}'
        )
    
    return factor_exposures

@app.get('/v1/backtest/analytics/beta_exposure')
def v1_backtest_beta_exposure(backtest_id: str):
    if backtest_id not in backtest_cache:
        raise HTTPException(
            status_code=400,
            detail=f'Backtest {backtest_id} does not exist in cache.'
        )
    
    backtest = backtest_cache[backtest_id]
    try:
        rolling_beta = backtest.beta_exposures(12)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f'{e}'
        )
    
    return rolling_beta

@app.post('/v1/backtest/backtest_between_dates')
def v1_backtest_between_dates(req: BacktestRequest):
    try:
        backtest = BackTest(
            req.start_date,
            req.end_date,
            req.lookback,
            req.factors,
            req.overlay_weight,
            req.transaction_costs,
            db
        )
        backtest_id = str(uuid.uuid4())
        backtest_data = backtest.backtest()
        backtest_cache[backtest_id] = backtest

        return {
            'backtest_id': backtest_id,
            'results': backtest_data
        }
    except Exception as e:
        print(e)
        raise e

@app.post('/v1/model/weights_on_date')
def v1_get_weights_on_date(req: WeightRequest):
    try:
        weights_data = AlphaModel.get_weights_on_date(
            req.date, 
            req.lookback,
            req.overlay_weight,
            req.factors, 
            db
        )
    except Exception as e:
        raise e
    
    return weights_data

@app.post('/v1/data/pull_between_dates')
def v1_data_pull_between_dates(req: DataRequest):
    print(req)
    try:
        # attempt to pull the data
        data: pd.DataFrame = db.fetch_between_dates(
            req.table_name, 
            req.start_date, 
            req.end_date, 
            req.tickers
        )
    except Exception as e:
        return JSONResponse(
            status_code = 400,
            content = ErrorResponse(
                code = 400,
                message = 'An error occured while pulling data',
                details = str(e)
            ).model_dump()
        )
    
    data = data.sort_values('date')
    
    # otherwise return the data in json form of records
    return data.to_dict(orient='records')




