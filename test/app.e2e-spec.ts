import { Test } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import * as pactum from 'pactum';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthDto } from '../src/auth/dto';
import { EditUserDto } from '../src/user/dto';
import {
  CreateBookmarkDto,
  EditBookmarkDto,
} from 'src/bookmark/dto';

describe('App e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );
    await app.init();
    await app.listen(3333);

    prisma = app.get(PrismaService);
    await prisma.cleanDb();
    pactum.request.setBaseUrl('http://localhost:3333');
  });

  afterAll(() => {
    app.close();
  });

  describe('Auth', () => {
    const dto: AuthDto = {
      email: 'fawwaz@gmail.com',
      password: 'fawwaz',
    };
    describe('Register', () => {
      it('Should throw if email empty', () => {
        return pactum
          .spec()
          .post('/auth/register')
          .withBody({
            password: dto.password,
          })
          .expectStatus(400);
      });
      it('Should throw if password empty', () => {
        return pactum
          .spec()
          .post('/auth/register')
          .withBody({
            email: dto.email,
          })
          .expectStatus(400);
      });
      it('Should throw if no body provided', () => {
        return pactum
          .spec()
          .post('/auth/register')
          .expectStatus(400);
      });
      it('Should register', () => {
        return pactum
          .spec()
          .post('/auth/register')
          .withBody(dto)
          .expectStatus(201);
      });
    });

    describe('Login', () => {
      it('Should throw if email empty', () => {
        return pactum
          .spec()
          .post('/auth/login')
          .withBody({
            password: dto.password,
          })
          .expectStatus(400);
      });
      it('Should throw if password empty', () => {
        return pactum
          .spec()
          .post('/auth/login')
          .withBody({
            email: dto.email,
          })
          .expectStatus(400);
      });
      it('Should throw if no body provided', () => {
        return pactum
          .spec()
          .post('/auth/login')
          .expectStatus(400);
      });
      it('Should login', () => {
        return pactum
          .spec()
          .post('/auth/login')
          .withBody(dto)
          .stores('userToken', 'access_token')
          .expectStatus(200);
      });
    });
  });

  describe('User', () => {
    describe('Get me', () => {
      it('Should get current user', () => {
        return pactum
          .spec()
          .get('/users/me')
          .withHeaders({
            Authorization: 'Bearer $S{userToken}',
          })
          .expectStatus(200);
      });
    });

    describe('Edit user', () => {
      it('Should edit user', () => {
        const dto: EditUserDto = {
          firstName: 'Fawwaz',
          email: 'fawwaz@gmail.com',
        };
        return pactum
          .spec()
          .patch('/users/edit')
          .withHeaders({
            Authorization: 'Bearer $S{userToken}',
          })
          .withBody(dto)
          .expectStatus(200);
      });
    });
  });

  describe('Bookmark', () => {
    describe('Get empty bookmark', () => {
      it('Should get empty bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userToken}',
          })
          .expectBody([])
          .expectStatus(200);
      });
    });

    describe('Create bookmark', () => {
      const dto: CreateBookmarkDto = {
        title: 'First Bookmark',
        link: 'https://youtu.be/j3LytVMEAk0?si=AIHg_YDTwqvjXNdA',
      };
      it('Should create bookmark', () => {
        return pactum
          .spec()
          .post('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userToken}',
          })
          .withBody(dto)
          .stores('bookmarkId', 'id')
          .expectStatus(201);
      });
    });

    describe('Get bookmarks', () => {
      it('Should get bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userToken}',
          })
          .expectStatus(200);
      });
    });

    describe('Get bookmark by id', () => {
      it('Should get bookmark by id', () => {
        return pactum
          .spec()
          .get('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userToken}',
          })
          .expectBodyContains('$S{bookmarkId}')
          .expectStatus(200);
      });
    });

    describe('Edit bookmark by id', () => {
      const dto: EditBookmarkDto = {
        description:
          'Fullstack/MERN Stack Task Manager App #3',
      };
      it('Should edit bookmark by id', () => {
        return pactum
          .spec()
          .patch('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userToken}',
          })
          .withBody(dto)
          .expectBodyContains(dto.description)
          .expectStatus(200);
      });
    });

    describe('Delete bookmark by id', () => {
      it('Should delete bookmark by id', () => {
        return pactum
          .spec()
          .delete('/bookmarks/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userToken}',
          })
          .expectStatus(204);
      });

      it('Should get empty bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userToken}',
          })
          .expectBody([])
          .expectStatus(200);
      });
    });
  });
});
