import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import User from "./User";

@Entity()
export default class AuthCodeStore {
    @PrimaryGeneratedColumn()
    id?: number

    @Column({ nullable: false })
    Code?: number
    
    @Column("bigint" ,{ nullable: false })
    Expire?: number

    // Relations
    @OneToOne(type => User)
    @JoinColumn()
    User?: User
}