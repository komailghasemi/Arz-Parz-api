import { Request, Response, NextFunction } from "express";
import Container from "typedi";
import { Like } from "typeorm";
import Database from "../database/Database";
import Asset from "../database/models/Assest";
import TransactionHistory from "../database/models/TransactionHistory";
import User from "../database/models/User";
import Wallet from "../database/models/Wallet";


// auth - post
const addAssetTransaction = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let id = req.params.id
        let symbol = req.body.symbol
        let usdtTmn = req.body.usdtTmn
        let amount = req.body.amount
        let type = req.body.type
        let price = req.body.price

        let manager = Container.get(Database).getManager()

        let asset = await manager?.findOne(Asset, {
            where: {
                Symbol: symbol
            }
        })

        let user = await manager?.findOne(User, {
            where: {
                ClientId: id
            }
        })

        let wallet = await manager?.findOne(Wallet, {
            relations: ["Asset", "User", "TransactionHistories"],
            where: {
                Asset: asset,
                User: user
            }
        })

        if (type === "SELL") {
            if (wallet === undefined || ((wallet.Amount || 0) < amount)) {
                res.status(200).json("Amount")
            } else {
                wallet!.Amount! -= +amount
                let histories = wallet.TransactionHistories

                let history = new TransactionHistory()
                history.Amount = amount
                history.CreateAt = new Date()
                history.Price = price
                history.Type = type
                history.UsdtTmn = usdtTmn
                await manager?.save(history)

                histories?.push(history)
                wallet.TransactionHistories = histories
                await manager?.save(wallet)
                res.sendStatus(200)
            }
        } else {
            if (wallet === undefined) {
                let w = new Wallet()
                w.Amount = amount
                w.Asset = asset
                w.User = user
                w.CreateAt = new Date()
                w.UsdtPriceAve = price
                w.TmnPriceAve = (+price * +usdtTmn)

                let history = new TransactionHistory()
                history.Amount = amount
                history.CreateAt = new Date()
                history.Price = price
                history.Type = type
                history.UsdtTmn = usdtTmn
                await manager?.save(history)
                w.TransactionHistories = [history]
                await manager?.save(w)
                res.sendStatus(200)
            } else {
                //( ((amount * price) + (new amount * new price ))
                // ---------------------------------------
                //        ( amount + new amount) )


                //( ((amount * (TmnPriceAve)) + (new amount * (new price  * usdttmn)))
                // ---------------------------------------
                //        ( amount + new amount) )

                let usdPriceAve = (((+wallet!.Amount! * +wallet!.UsdtPriceAve!) + (+amount * +price)) / (+wallet!.Amount! + +amount))
                let tmnPriceAve = (((+wallet!.Amount! * +(wallet!.TmnPriceAve || 0)) + (+amount * (+price * +usdtTmn))) / (+wallet!.Amount! + +amount))

                wallet!.Amount! += +amount
                wallet!.UsdtPriceAve = usdPriceAve
                wallet!.TmnPriceAve = tmnPriceAve

                let histories = wallet.TransactionHistories

                let history = new TransactionHistory()
                history.Amount = amount
                history.CreateAt = new Date()
                history.Price = price
                history.Type = type
                history.UsdtTmn = usdtTmn
                await manager?.save(history)

                histories?.push(history)
                wallet.TransactionHistories = histories

                await manager?.save(wallet)
                res.sendStatus(200)
            }
        }
    } catch (e) {
        next(e)
    }

}

// auth - get
const getMyAssets = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let id = req.params.id
        let manager = Container.get(Database).getManager()
        let wallet = await manager?.find(Wallet, {
            relations: ["Asset"],
            where: {
                User: await manager?.findOne(User, {
                    where: {
                        ClientId: id
                    }
                })
            }
        })

        res.status(200).json(wallet)

    } catch (e) {
        next(e)
    }
}

// auth - get
const getAssetsTransaction = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let id = req.params.id
        let symbol = req.params.symbol

        let manager = Container.get(Database).getManager()
        let wallet = await manager?.findOne(Wallet, {
            relations: ["Asset", "TransactionHistories"],
            where: {
                User: await manager?.findOne(User, {
                    where: {
                        ClientId: id
                    }
                }),
                Asset: await manager?.findOne(Asset, {
                    where: {
                        Symbol: symbol
                    }
                })
            }
        })

        res.status(200).json(wallet?.TransactionHistories?.reverse())

    } catch (e) {
        next(e)
    }
}

// auth - get 
const removeAssetsTransaction = async (req: Request, res: Response, next: NextFunction) => {

    try {
        let id = req.params.id
        let symbol = req.params.symbol
        let transactionId = req.params.transactionId

        let manager = Container.get(Database).getManager()
        let wallet = await manager?.findOne(Wallet, {
            relations: ["Asset", "TransactionHistories"],
            where: {
                User: await manager?.findOne(User, {
                    where: {
                        ClientId: id
                    }
                }),
                Asset: await manager?.findOne(Asset, {
                    where: {
                        Symbol: symbol
                    }
                })
            }
        })

        if (wallet) {
            let transaction: TransactionHistory | undefined
            wallet.TransactionHistories = wallet?.TransactionHistories?.filter((value, index, arr) => {
                if (value.id !== +transactionId)
                    return true
                else {
                    transaction = value
                    return false
                }
            })
            let amount = transaction?.Amount || 0

            if (transaction?.Type === 'SELL') {
                wallet!.Amount! += +amount
            } else {


                let price = transaction?.Price || 0.0
                let usdtTmn = transaction?.UsdtTmn || 0.0

                let currentAmount = +wallet!.Amount! - +amount
                let usdPriceAve
                let tmnPriceAve

                if(currentAmount === 0){
                    usdPriceAve = 0
                    tmnPriceAve = 0
                }
                else{
                    usdPriceAve = (((+wallet!.Amount! * +wallet!.UsdtPriceAve!) - (+amount * +price)) / currentAmount)
                    tmnPriceAve = (((+wallet!.Amount! * +(wallet!.TmnPriceAve || 0)) - (+amount * (+price * +usdtTmn))) / currentAmount)
                }
                
                wallet!.Amount! -= +amount
                wallet!.UsdtPriceAve = usdPriceAve
                wallet!.TmnPriceAve = tmnPriceAve
            }
            
            await manager?.remove(transaction)
            await manager?.save(wallet)
            if ((wallet.TransactionHistories?.length || 0) === 0)
                await manager?.remove(wallet)

            res.sendStatus(200)
        } else {
            res.sendStatus(500)
        }


    } catch (e) {
        next(e)
    }

}

// no auth - get
const searchAsset = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let search = req.params.symbol
        let manager = Container.get(Database).getManager()
        let assets = await manager?.find(Asset, {
            take: 20,
            where: [{
                Symbol: Like(`${search}%`)
            }, {
                Name: Like(`${search}%`)
            }]
        })

        res.status(200).json(assets)
    } catch (e) {
        next(e)
    }
}


export default {
    addAssetTransaction,
    searchAsset,
    getMyAssets,
    getAssetsTransaction,
    removeAssetsTransaction
}