import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { UsuarioDto } from '../src/usuario/dto/usuario.dto';
import { AppModule } from '../src/app.module';
import { UsuarioService } from '../src/usuario/usuario.service';

type CliArgs = {
  name?: string;
  email?: string;
  password?: string;
};

function parseArgs(argv: string[]): CliArgs {
  const result: CliArgs = {};

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];

    if (current === '--name') {
      result.name = argv[index + 1];
      index += 1;
      continue;
    }

    if (current === '--email') {
      result.email = argv[index + 1];
      index += 1;
      continue;
    }

    if (current === '--password') {
      result.password = argv[index + 1];
      index += 1;
    }
  }

  return result;
}

async function bootstrap() {
  const args = parseArgs(process.argv.slice(2));
  const name = args.name?.trim();
  const email = args.email?.trim();
  const password = args.password?.trim();

  if (!name || !email || !password) {
    console.error('Uso: npm run create:user -- --name "Admin" --email "admin@local.com" --password "123456"');
    process.exitCode = 1;
    return;
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  try {
    const usuarioService = app.get(UsuarioService);
    const payload: UsuarioDto = { name, email, password };
    const result = await usuarioService.save(payload);

    console.log(result);
    console.log(`Usuario creado: ${name} <${email}>`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`No se pudo crear el usuario: ${message}`);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error inesperado: ${message}`);
  process.exitCode = 1;
});