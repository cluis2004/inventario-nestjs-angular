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
import { StockEntryDetail } from "./stock-entry-detail.model";

@Entity('stock_entry')
export class StockEntry {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    entry_date: Date;

    @Column({ type: 'varchar', length: 20, default: 'registered' })
    status: string;

    @Column()
    user_id: number;

    @ManyToOne(() => Usuario, { eager: false, nullable: false })
    @JoinColumn({ name: 'user_id' })
    user: Usuario;

    @OneToMany(() => StockEntryDetail, (detail) => detail.stockEntry, { cascade: false })
    details: StockEntryDetail[];

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
