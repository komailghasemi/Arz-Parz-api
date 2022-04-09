import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import User from "./User";
import Market from "./Market"

@Entity()
export default class ChatRoom {
    @PrimaryGeneratedColumn()
    id?: number

    @Column({type: "nvarchar", length: "MAX", nullable : false})
    Message?: string

    @Column({ nullable: false })
    CreateAt?: Date

    @Column({ nullable: false })
    Channel?: string

    @ManyToOne(() => User)
    User?: User

}