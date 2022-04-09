import { Request, Response, NextFunction } from 'express';
import Container from 'typedi';
import { Like } from 'typeorm';
import Database from '../database/Database';
import GlobalMetrics from '../database/models/GlobalMetrics';
import Market from '../database/models/Market';

// no auth // get
const getGlobalMetrics = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let manager = Container.get(Database).getManager()
        let gm = await manager?.findOne(GlobalMetrics)

        res.status(200).json(gm)
    } catch (e) {
        next(e)
    }

}

// no auth // get
const searchMarket = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let search = req.params.market
        let manager = Container.get(Database).getManager()
        let markets = await manager?.find(Market, {
            take: 20,
            relations: ['Exchanges' , 'BaseAsset' , 'QuoteAsset'],
            where: {
                Symbol: Like(`${search}%`)
            }
        })
        let data = markets?.sort((a: Market, b: Market) => {
            return (b.Exchanges?.length || 0) - (a.Exchanges?.length || 0)
        })
        res.status(200).json(data)
    } catch (e) {
        next(e)
    }
}

// no auth // get
const getMarket = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let search = req.params.market
        let manager = Container.get(Database).getManager()
        let market = await manager?.findOne(Market, {
            relations: ['Exchanges', 'BaseAsset' , 'QuoteAsset'],
            where: {
                Symbol: search
            }
        })

        res.status(200).json(market)
    } catch (e) {
        next(e)
    }
}
export default {
    getGlobalMetrics,
    searchMarket,
    getMarket
}