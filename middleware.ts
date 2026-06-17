import { next, rewrite } from "@vercel/functions";

const isCareerDevHost = (host: string) =>
  /^.+\.careers-dev\.persevio\.ai$/.test(host);

const isCareerProdHost = (host: string) =>
  /^.+\.careers\.persevio\.ai$/.test(host);

export default function middleware(request: Request) {
  const host = request.headers.get("host") ?? "";

  if (isCareerDevHost(host) || isCareerProdHost(host)) {
    return rewrite(new URL("/api/career-page", request.url));
  }

  return next();
}

export const config = {
  matcher: "/",
};
