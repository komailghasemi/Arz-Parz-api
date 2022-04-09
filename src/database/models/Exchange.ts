import { Column, Entity, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import Market from "./Market";

@Entity()
export default class Exchange {

    @PrimaryGeneratedColumn()
    id? : number

    @Column({ nullable: false })
    Name?: string

}