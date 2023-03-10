import type { CookieOptions } from 'express';
import { GraphQLError } from 'graphql';
import { constants } from '../../config/environment';
import type { Context } from '../context';
import { signJwt, verifyJwt } from './jwt';
import { JwtPayload } from './types';

const createCookieOptions = (): CookieOptions => {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    secure: isProd ? true : false,
    httpOnly: true,
    sameSite: 'none',
  };
};

const cookieOptions = createCookieOptions();

const createAccessToken = (payload: JwtPayload) => {
  return signJwt(payload, 'AT', {
    subject: payload?.user,
    expiresIn: `${constants.JWT_ACCESS_EXPIRATION}m`,
  });
};

const createRefreshToken = (payload: JwtPayload) => {
  return signJwt(payload, 'RT', {
    subject: payload?.user,
    expiresIn: `${constants.JWT_REFRESH_EXPIRATION}d`,
  });
};

const createCookies = (accessToken: string, refreshToken: string) => {
  const accessExpiration = Number(constants.JWT_ACCESS_EXPIRATION) * 60 * 1000;
  const refreshExpiration =
    Number(constants.JWT_REFRESH_EXPIRATION) * 24 * 60 * 60 * 1000;

  const accessOptions: CookieOptions = {
    ...cookieOptions,
    expires: new Date(Date.now() + accessExpiration),
  };

  const refreshOptions: CookieOptions = {
    ...cookieOptions,
    expires: new Date(Date.now() + refreshExpiration),
  };

  return [
    ['token', accessToken, accessOptions],
    ['jwt', refreshToken, refreshOptions],
  ] as const;
};

export const createTokens = async (payload: JwtPayload, context: Context) => {
  const accessToken = createAccessToken(payload);
  const refreshToken = createRefreshToken(payload);

  if (!!context) {
    const [accessCookie, refreshCookie] = createCookies(
      accessToken,
      refreshToken
    );
    context.res.cookie(...accessCookie);
    context.res.cookie(...refreshCookie);
  }

  return {
    accessToken,
    refreshToken,
  };
};

export function getRefreshCookie({ req }: Context) {
  let message = 'Invalid cookie: Could not find refresh token';

  const token = req?.cookies?.['jwt'] as string;
  if (!token) {
    throw new GraphQLError(message, {
      extensions: {
        code: 'FORBIDDEN',
        http: { status: 403 },
      },
    });
  }

  message = 'Invalid cookie: No valid keys or signatures';
  const payload = verifyJwt(token, 'RT');
  if (!payload) {
    throw new GraphQLError(message, {
      extensions: {
        code: 'FORBIDDEN',
        http: { status: 403 },
      },
    });
  }

  return payload;
}

export const removeCookies = ({ res }: Context) => {
  res.clearCookie('token', { ...cookieOptions });
  res.clearCookie('jwt', { ...cookieOptions });
};
