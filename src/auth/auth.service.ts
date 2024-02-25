import {
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { User, Bookmark } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}
  async register(dto: AuthDto) {
    // Generate the password hash
    const password = await argon.hash(dto.password);
    // Save new user in the db
    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          password,
        },
      });

      // Return saved user
      return this.signToken(user.id, user.email);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('Credentials taken');
        }
        throw error;
      }
    }
  }

  async login(dto: AuthDto) {
    // Find the user by email
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });
    // If user does not exist throw exception
    if (!user) {
      throw new ForbiddenException('Credentials incorrect');
    }
    // Compare password
    const pwMatches = await argon.verify(
      user.password,
      dto.password,
    );
    // If password incorrect throw exception
    if (!pwMatches) {
      throw new ForbiddenException('Credentials incorrect');
    }
    // Return the user
    return this.signToken(user.id, user.email);
  }

  async signToken(
    userId: number,
    email: string,
  ): Promise<{ access_token: string }> {
    const payload = {
      sub: userId,
      email,
    };
    const secret = this.config.get('JWT_SECRET');

    const token = await this.jwt.signAsync(payload, {
      expiresIn: '20h',
      secret: secret,
    });

    return {
      access_token: token,
    };
  }
}
