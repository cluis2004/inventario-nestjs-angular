import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import { Product } from "../../products/model/product.model";
import { SaleHeader } from "./sale-header.model";

@Entity('sale_detail')
export class SaleDetail {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    sale_header_id: number;

    @Column()
    product_id: number;

    @Column({ type: 'int', default: 1 })
    quantity: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    unit_price: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    line_total: number;

    @ManyToOne(() => SaleHeader, (saleHeader) => saleHeader.details, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'sale_header_id' })
    saleHeader: SaleHeader;

    @ManyToOne(() => Product, { eager: false, nullable: false })
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
