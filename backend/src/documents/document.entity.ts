import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Document {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  subject: string;

  @Column({ nullable: true })
  contentUrl: string;

  @Column({ nullable: true })
  author: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  fileType: string;

  @Column({ nullable: true })
  fileSize: number;

  @Column({ default: 0 })
  visits: number;

  @Column({ type: 'float', default: 0 })
  rating: number;

  @Column({ default: 0 })
  ratingCount: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  tags: string;

  @Column({ nullable: true })
  semester: string;

  @Column({ nullable: true })
  year: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
