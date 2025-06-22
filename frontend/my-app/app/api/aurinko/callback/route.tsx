    import { NextResponse } from 'next/server';
    import { NextRequest } from 'next/server';
    import { getToken } from '@/lib/aurinko';
    import { getAccount } from '@/lib/aurinko';
    import { auth } from "@clerk/nextjs/server";
    import axios from 'axios';
    export const GET = async (request: NextRequest) => {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

    const status = request.nextUrl.searchParams.get('status');
    const code = request.nextUrl.searchParams.get('code');
    console.log("Status:", status);
    console.log("Code:", code);
        
    // if (status !== 'success') return NextResponse.json({ error: "Account connection failed" }, { status: 400 });

    if (!code) {
        return NextResponse.json({ error: 'Authorization code not found' }, { status: 400 });
    }

    const tokenResponse = await getToken(code as string);
    if (!tokenResponse || !tokenResponse.accessToken) {
        return NextResponse.json({ error: 'Failed to retrieve token' }, { status: 500 });
    }
    const token = tokenResponse.accessToken;
    const account = await getAccount(token);
    if (!account) {
        return NextResponse.json({ error: 'Failed to retrieve account information' }, { status: 500 });
    }
    // Store the token and account information in a session or database as needed

    const response = await axios.post(
        'http://localhost:8000/api/aurinko/account',
        {
            id: tokenResponse.accountId?.toString(),
            userId,
            token: tokenResponse.accessToken,
            emailAddress: account.email,
            name: account.name,
        },
        {
            headers: {
                'Content-Type': 'application/json',
            },
        }
    );
    if (response.status !== 200) {
        return NextResponse.json({ error: 'Failed to store account information' }, { status: 500 });
    }

    return NextResponse.redirect(new URL('/mail', request.nextUrl.origin));
    };
