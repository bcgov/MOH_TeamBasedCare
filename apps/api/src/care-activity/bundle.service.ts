import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Bundle } from './entity/bundle.entity';
import { cleanText } from 'src/common/utils';

@Injectable()
export class BundleService {
  constructor(
    @InjectRepository(Bundle)
    private repo: Repository<Bundle>,
  ) {}

  async getManyByIds(ids: string[]) {
    return this.repo.find({
      where: { id: In(ids) },
    });
  }

  async getManyByNames(names: string[]) {
    return this.repo.find({
      where: { name: In(names.map(name => cleanText(name))) },
    });
  }

  async upsertBundles(bundleNames: string[]) {
    return this.repo.upsert(
      bundleNames.map(name =>
        this.repo.create({
          name,
        }),
      ),
      {
        skipUpdateIfNoValuesChanged: true,
        conflictPaths: ['name'],
      },
    );
  }
}
