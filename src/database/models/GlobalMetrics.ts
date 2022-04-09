import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export default class GlobalMetrics {

    @PrimaryGeneratedColumn()
    id?: number

    @Column()
    ActiveCryptocurrencies? : number

    @Column()
    ActiveExchanges? : number

    @Column("float")
    EthDominance? : number

    @Column("float")
    BtcDominance? : number

    @Column("float")
    DefiVolume24h? : number

    @Column("float")
    DefiMarketCap? : number

    @Column("float")
    StablecoinVolume24h? : number

    @Column("float")
    StablecoinMarketCap? : number

    @Column("float")
    TotalMarketCap? : number

    @Column("float")
    TotalVolume24h? : number

    @Column("float")
    AltcoinVolume24h? :number
    
    @Column("float")
    AltcoinMarketCap? :number

    @Column({nullable : true})
    UpdateAt? :Date
    
}