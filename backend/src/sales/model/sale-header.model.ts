import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { Usuario } from "../../usuario/model/usuario.model";
import { SaleDetail } from "./sale-detail.model";

@Entity('sale_header')
export class SaleHeader {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    sale_date: Date;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    total_amount: number;

    @Column({ default: true })
    is_active: boolean;

    @Column()
    user_id: number;

    @ManyToOne(() => Usuario, { eager: false, nullable: false })
    @JoinColumn({ name: 'user_id' })
    user: Usuario;

    @OneToMany(() => SaleDetail, (detail) => detail.saleHeader, { cascade: false })
    details: SaleDetail[];

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
