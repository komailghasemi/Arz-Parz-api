import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";


@Entity()
export default class News{
    
    @PrimaryGeneratedColumn()
    id?: number

    @Column({nullable : false})
    Title? : string

    @Column({type: "nvarchar", length: "MAX", nullable : false})
    Message? : string

    @Column({nullable : false})
    CreateAt? : Date

    @Column({nullable : true})
    Image? : string

    @Column({nullable : true})
    Video? : string
}