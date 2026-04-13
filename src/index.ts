import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { db } from './db';
import { users } from './db/schema/users';
import { usersRoute } from './routes/users-route';

export const app = new Elysia()
  .use(swagger({
    documentation: {
      info: {
        title: 'Vibe Coding API',
        version: '1.0.0',
        description: 'Sistem Backend Autentikasi Pengguna Cepat'
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
          }
        }
      }
    }
  }))
  .get('/', () => 'Hello Elysia')
  .get('/users', async () => {
    return await db.select().from(users);
  })
  .use(usersRoute)
  .listen(process.env.PORT || 3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
