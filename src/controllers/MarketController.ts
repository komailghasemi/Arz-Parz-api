import { NextFunction, Request, Response } from "express"
import Container from "typedi"
import Database from "../database/Database"
import Market from "../database/models/Market"
import User from "../database/models/User"

// auth // get
const addMarket = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let id = req.params.id
        let symbolMarket = req.params.market

        let manager = Container.get(Database).getManager()
        let user = (await manager?.findOne(User, {
            relations: ['Markets'],
            where: { ClientId: id }
        }))!


        let market = await manager?.findOne(Market, {
            relations: ['Exchanges' , 'BaseAsset' , 'QuoteAsset'],
            where: { Symbol: symbolMarket }
        })

        let markets = user?.Markets || []
        markets?.push(market!)
        user.Markets = markets

        await manager?.save(user)

        res.status(200).json(market)

    } catch (e) {
        next(e)
    }
}

// auth // get
const getMyMarkets = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let id = req.params.id
        let manager = Container.get(Database).getManager()

        let user = (await manager?.findOne(User, {
            relations: ['Markets', 'Markets.Exchanges', 'Markets.BaseAsset' , 'Markets.QuoteAsset'],
            where: { ClientId: id }
        }))!
        let data = user.Markets?.sort((a: Market, b: Market) => {
            return (b.Exchanges?.length || 0) - (a.Exchanges?.length || 0)
        })
        
        res.status(200).json(data)
    } catch (e) {
        next(e)
    }
}

//auth // get
const deleteMarket = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let id = req.params.id
        let marketSymbol = req.params.market
        let manager = Container.get(Database).getManager()
        let user = (await manager?.findOne(User, {
            relations: ['Markets'],
            where: { ClientId: id }
        }))!

        user.Markets = user.Markets?.filter((value, index, arr) => {
            return value.Symbol !== marketSymbol
        })
        await manager?.save(user)
        res.sendStatus(200)
    } catch (e) {
        next(e)
    }
}

export default {
    addMarket,
    getMyMarkets,
    deleteMarket
}