import axios from "axios";
import fs from "fs";
import path from "path";
import { Service } from "typedi";
import BinanceApi from "../api/BinanceApi";
import BittrexApi from "../api/BittrexApi";
import CoinexApi from "../api/CoinexApi";
import CoinGekoApi from "../api/CoinGekoApi";
import KucoinApi from "../api/KucoinApi";
import { Info } from "../api/models/CoinexesMarkets";
import { Coin } from "../api/models/Crypto";
import Database from "../database/Database";
import Asset from "../database/models/Assest";
import Exchange from "../database/models/Exchange";
import Market from "../database/models/Market";


@Service({ transient: true })
export default class MarketJob {


    constructor(private readonly database: Database, private readonly coinGekoApi: CoinGekoApi, private readonly kucoinApi: KucoinApi, private readonly bittrexApi: BittrexApi, private readonly coinexApi: CoinexApi, private readonly binanceApi : BinanceApi) {
    }

    assets: Coin[] | undefined

    async sync() {
        console.log('starting market job ...');

        this.assets = await this.cryptos()

        if (this.assets?.length && this.assets?.length > 0) {
            console.log('binance');
            await this.binance()

            console.log('coinex');
            await this.coinex()

            console.log('kucoin');
            await this.kucoin()

            console.log('bittrex');
            await this.bittrex()
        }

        this.assets = undefined
        console.log('end market job ...');
    }

    private async cryptos() {
        let data = await this.coinGekoApi.getCryptos()
        return data?.coins
    }

    private async kucoin() {
        let data = await this.kucoinApi.getMarkets()
        for (let i = 0; i < (data?.data?.length || 0); i++) {
            let symbol = data?.data[i]

            let baseAsset = await this.getAsset(symbol?.baseCurrency)
            let quoteAsset = await this.getAsset(symbol?.quoteCurrency)

            if (baseAsset && quoteAsset)
                await this.save({
                    base: baseAsset,
                    quote: quoteAsset,
                    ex: "Kucoin"
                })
        }
    }
    private async bittrex() {
        let data = await this.bittrexApi.getMarkets()

        for (let i = 0; i < (data?.length || 0); i++) {
            let symbol = data?.[i]

            let baseAsset = await this.getAsset(symbol?.baseCurrencySymbol)
            let quoteAsset = await this.getAsset(symbol?.quoteCurrencySymbol)

            if (baseAsset && quoteAsset)
                await this.save({
                    base: baseAsset,
                    quote: quoteAsset,
                    ex: "Bittrex"
                })
        }
    }

    private async coinex() {
        let markets = await this.coinexApi.getMarkets()
        if (markets === undefined)
            return

        let data = Object.values(markets?.data) as Info[]

        for (let i = 0; i < (data?.length || 0); i++) {
            let symbol = data?.[i]

            let baseAsset = await this.getAsset(symbol?.trading_name)
            let quoteAsset = await this.getAsset(symbol?.pricing_name)

            if (baseAsset && quoteAsset)
                await this.save({
                    base: baseAsset,
                    quote: quoteAsset,
                    ex: "Coinex"
                })
        }
    }

    private async binance(){
        let data = await this.binanceApi.getMarkets()
        for (let i = 0; i < (data?.symbols.length || 0); i++) {
            let symbol = data?.symbols[i]

            let baseAsset = await this.getAsset(symbol?.baseAsset)
            let quoteAsset = await this.getAsset(symbol?.quoteAsset)

            if (baseAsset && quoteAsset)
                await this.save({
                    base: baseAsset,
                    quote: quoteAsset,
                    ex: "Binance"
                })
        }
    }

    private async getAsset(symbol?: string): Promise<Asset | undefined> {

        return new Promise(async (resolve) => {

            let asset = await this.database.getManager()?.findOne(Asset, {
                relations: ['Wallets'],
                where: {
                    Symbol: symbol?.toLowerCase()
                }
            })

            if (asset !== undefined) {
                resolve(asset)
            } else {
                let coin = this.assets?.find((value, index, arr) => {
                    return value.symbol.toLowerCase() == symbol?.toLowerCase()
                })

                if (coin) {
                    await this.downloadLogo(coin.large, coin.id)
                    let newAsset = new Asset()
                    newAsset.CoinGekoId = coin.id
                    newAsset.Name = coin.name
                    newAsset.Symbol = coin.symbol.toLowerCase()
                    resolve(newAsset)
                }

                resolve(undefined)
            }
        })
    }

    private async save(item: {
        base?: Asset,
        quote?: Asset,
        ex?: string
    }) {

        try {
            let repo = this.database.getManager()

            let market = await repo?.findOne(Market, {
                relations: ["Exchanges"],
                where: {
                    Symbol: `${item.base?.Symbol}${item.quote?.Symbol}`
                }
            })

            let ex = await repo?.findOne(Exchange, {
                where: {
                    Name: item.ex
                }
            })

            if (market != undefined) {
                if (market.Exchanges?.find((ex, index, arr) => {
                    return ex.Name === item.ex
                }) === undefined) {
                    if (ex === undefined) {
                        ex = new Exchange()
                        ex.Name = item.ex
                        await repo?.save(ex)
                    }
                    let exes = market.Exchanges
                    exes?.push(ex)
                    market.Exchanges = exes
                }
            } else {
                if (ex === undefined) {
                    ex = new Exchange()
                    ex.Name = item.ex
                    await repo?.save(ex)
                }

                await repo?.save(item.base)
                await repo?.save(item.quote)

                market = new Market()
                market.BaseAsset = item.base
                market.QuoteAsset = item.quote
                market.Symbol = `${market.BaseAsset?.Symbol}${market.QuoteAsset?.Symbol}`
                market.Exchanges = [ex]
            }

            await repo?.save(market)

        } catch (ex) {
            console.log(ex);

        }
    }

    private async downloadLogo(url?: string, name?: string): Promise<void> {
        let newName = name?.toLowerCase()
        if (!fs.existsSync(path.join(__dirname, '../logos/crypto') + `\\${newName}.png`) && url != undefined && newName != undefined) {
            return axios({
                method: 'GET',
                url: url,
                responseType: 'stream',
            }).then(response => {
                return new Promise<void>((resolve) => {
                    const w = response.data.pipe(fs.createWriteStream(path.join(__dirname, '../logos/crypto') + `\\${newName}.png`));
                    w.on('finish', () => {
                        resolve()
                    });

                    w.on('error', (e: Error) => {
                        console.log('>' + e);
                        resolve()
                    });
                })
            }).catch(e => console.log(e))
        }
        return Promise.resolve()
    }
}