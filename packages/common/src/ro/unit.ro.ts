import { Exclude } from 'class-transformer';
import { BaseRO } from './base.ro';

@Exclude()
export class UnitRO extends BaseRO {}
