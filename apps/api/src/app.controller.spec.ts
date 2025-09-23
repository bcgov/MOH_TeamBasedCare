import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SeedService } from './database/scripts/seed-service';
import { getConnectionToken } from '@nestjs/typeorm';

describe('AppController', () => {
  let appController: AppController;

  const mockSeedService = {};
  const mockConnection = {};

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: SeedService,
          useValue: mockSeedService,
        },
        {
          provide: getConnectionToken(),
          useValue: mockConnection,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return version info', () => {
      expect(Object.keys(appController.getVersion()).length).toBeGreaterThanOrEqual(3);
    });
  });
});
