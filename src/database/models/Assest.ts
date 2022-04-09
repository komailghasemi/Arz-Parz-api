import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import Wallet from "./Wallet";

@Entity()
export default class Asset {

    @PrimaryGeneratedColumn()
    id?: number

    @Column({ nullable: true })
    Name?: string

    @Column({ nullable: true })
    Symbol?: string

    @Column({ nullable: true })
    CoinGekoId?: string


    // Relation
    @OneToMany(() => Wallet, Wallets => Wallets.Asset)
    Wallets?: Wallet[]
}