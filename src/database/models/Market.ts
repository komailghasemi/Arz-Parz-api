import { Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import Asset from "./Assest";
import Exchange from "./Exchange";

@Entity()
export default class Market {

    @PrimaryGeneratedColumn()
    id? : number
    
    @Column({ nullable: false })
    Symbol?: string

    // Relation  

    @ManyToMany(() => Exchange)
    @JoinTable()
    Exchanges?: Exchange[];

    @ManyToOne(() => Asset)
    BaseAsset?: Asset

    @ManyToOne(() => Asset)
    QuoteAsset?: Asset
}