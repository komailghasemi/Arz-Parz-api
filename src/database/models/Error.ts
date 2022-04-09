import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";


@Entity()
export default class Error {
    @PrimaryGeneratedColumn()
    id?: number

    @Column({ nullable: true })
    Name?: string

    @Column("text" ,{ nullable: true })
    Message?: string
    
    @Column("text" ,{ nullable: true })
    StackTrace?: string

}