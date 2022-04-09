import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import Wallet from "./Wallet";

@Entity()
export default class TransactionHistory {

    @PrimaryGeneratedColumn()
    id?: number

    @Column({ nullable: false })
    Type?: string // BUY - SELL

    @Column("float", { nullable: false })
    Amount?: number // مقدار ارز

    @Column("float", { nullable: true })
    UsdtTmn?: number // قیمت تومانی هر دلار

    @Column("float", { nullable: false })
    Price?: number // قیمت هر واحد از ارز

    @Column({ nullable: false })
    CreateAt?: Date

    // Relation
    @ManyToOne(() => Wallet, Wallet => Wallet.TransactionHistories)
    Wallet?: Wallet;
}