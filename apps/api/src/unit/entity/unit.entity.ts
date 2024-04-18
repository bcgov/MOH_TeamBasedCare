import { cleanText } from 'src/common/utils';
import { BeforeInsert, BeforeUpdate, Column, Entity, Index } from 'typeorm';
import { CustomBaseEntity } from '../../common/custom-base.entity';

@Entity()
export class Unit extends CustomBaseEntity {
  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  @Index()
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  displayName: string;

  @BeforeInsert()
  @BeforeUpdate()
  updateDisplayName(): void {
    if (this.name) {
      this.displayName = this.name;
      this.name = cleanText(this.name);
    }
  }
}
