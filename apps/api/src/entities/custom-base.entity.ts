import { CreateDateColumn, UpdateDateColumn } from 'typeorm';

export class CustomBaseEntity {
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
