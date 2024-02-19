import { NextResponse, NextRequest } from 'next/server';
import { S3Config } from '../../utils/config';
import { sanitizeKey, uuid } from '../../utils/keys';
import { route } from '../../utils/route-builder';

type NextAppRouteHandler = (req: NextRequest) => Promise<Response>;

type Configure = (options: Options) => Handler;
type Handler = NextAppRouteHandler & { configure: Configure };

type Options = S3Config & {
  key?: (req: NextRequest, filename: string) => string | Promise<string>;
};

const makeRouteHandler = (options: Options = {}): Handler => {
  const nextAppRoute: NextAppRouteHandler = async function (req) {
    const reqClone = req.clone() as NextRequest;

    const reqBody = await req.json();
    const { filename } = reqBody;

    const { key, ...s3Options } = options;

    const fileKey = key
      ? await Promise.resolve(key(reqClone, filename))
      : `next-s3-uploads/${uuid()}/${sanitizeKey(filename)}`;

    const response = await route({
      body: reqBody,
      s3Options: s3Options,
      fileKey: fileKey,
    });

    return NextResponse.json(response);
  };

  const configure = (options: Options) => makeRouteHandler(options);

  return Object.assign(nextAppRoute, { configure });
};

const AppAPIRoute = makeRouteHandler();

export { AppAPIRoute };
