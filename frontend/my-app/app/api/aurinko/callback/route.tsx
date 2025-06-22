import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export const GET = async (request: NextRequest) => {
  const status = request.nextUrl.searchParams.get('status');
  const code = request.nextUrl.searchParams.get('code');

//   if (status !== 'success') {
//     return NextResponse.json({ error: 'Authorization failed' }, { status: 400 });
//   }

//   if (!code) {
//     return NextResponse.json({ error: 'Authorization code not found' }, { status: 400 });
//   }

  // Uncomment and implement your token logic here
  // const token = await getToken(code);
  // if (!token) {
  //   return NextResponse.json({ error: 'Failed to retrieve token' }, { status: 500 });
  // }

  return NextResponse.redirect(new URL('/mail', request.nextUrl.origin));
};
