import { Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import Market from "./Market";
import TransactionHistory from "./TransactionHistory";
import Wallet from "./Wallet";

@Entity()
export default class User {

    @PrimaryGeneratedColumn()
    id?: number

    @Column({ nullable: true })
    Name?: string

    @Column({ nullable: false })
    ClientId?: string

    @Column({ nullable: true })
    Email?: string

    @Column({ nullable: true })
    Password?: string

    @Column({ nullable: true })
    PasswordSalt?: string

    @Column({ nullable: false })
    IsAdmin?: Boolean

    @Column({nullable : false , default : true})
    IsActive? : Boolean

    @Column({ nullable: false })
    CreateAt?: Date

    @Column({ nullable: false })
    UpdateAt?: Date

    @Column({ nullable: false })
    LastLoginAt?: Date

    @Column({ nullable: true })
    NajvaToken? : string

    // Relation
    @ManyToMany(() => Market)
    @JoinTable()
    Markets?: Market[];

    @OneToMany(() => Wallet, Wallets => Wallets.User)
    Wallets?: Wallet[]
} 