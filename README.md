## Portfolio Management System

A full-stack project with React frontend and Python FastAPI backend, to assist with the implementation and backtesting of the alpha extension
fund strategy seen in ![quant-strats-in-us-equities](https://github.com/haezera/quant-strats-in-us-equities).

### Planned features

- [ ] Table view of factor scores and pricing data, with pricing graphs available
- [ ] Backtest functionality for given period, with different starting dates and parameters like lookback windows
- [ ] Given a backtest, an array of metrics, including factor exposures, historical beta, overperformance and more
- [ ] Realistic portfolio management simulation with starting capital and the ability to roll forwards and backwards through time,
to see weight changes, transaction costs and trade list.
- [ ] Trade list functionality, which stores current portfolio state (given some month) in the database, and given a required rebalance
for the next month, gives a table of trades (volumes, etc), as well as the ability to save to an excel worksheet
- [ ] _Optimised performance_ for all of the above metrics, with nice visuals useing `recharts`

### Project setup

To set up the project, you'll have to set up the database. I provide the data dumps as well as the SQL schemas. The setup,
schema and dumps required is stored in `/data`.

After correctly setting up the required databases, which includes end-of-month prices as well as end-of-month factor scores,
which were computed in the sister project mentioned previously, the project should be able to be run locally.
