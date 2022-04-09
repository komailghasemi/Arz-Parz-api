import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import Asset from "./Assest";
import TransactionHistory from "./TransactionHistory";
import User from "./User";

@Entity()
export default class Wallet {

    @PrimaryGeneratedColumn()
    id?: number


    @Column("float", { nullable: false })
    Amount?: number // مقدار کل دارایی

    @Column("float", { nullable: true })
    TmnPriceAve?: number // میانگین تومانی خریداری شده

    @Column("float", { nullable: false })
    UsdtPriceAve?: number // میانگین دلاری خریداری شده

    @Column({ nullable: false })
    CreateAt?: Date

    // Relation
    @ManyToOne(() => User, User => User.Wallets)
    User?: User;

    @ManyToOne(() => Asset, Asset => Asset.Wallets)
    Asset?: Asset;

    @OneToMany(() => TransactionHistory, TransactionHistories => TransactionHistories.Wallet)
    TransactionHistories?: TransactionHistory[]
}