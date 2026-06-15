import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import { Product } from "../../products/model/product.model";
import { StockEntry } from "./stock-entry.model";

@Entity('stock_entry_detail')
export class StockEntryDetail {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    stock_entry_id: number;

    @Column()
    product_id: number;

    @Column({ type: 'int', default: 1 })
    quantity: number;

    @ManyToOne(() => StockEntry, (stockEntry) => stockEntry.details, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'stock_entry_id' })
    stockEntry: StockEntry;

    @ManyToOne(() => Product, { eager: false, nullable: false })
    @JoinColumn({ name: 'product_id' })
    product: Product;
}
