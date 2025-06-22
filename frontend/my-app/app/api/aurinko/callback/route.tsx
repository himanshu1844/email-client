import { NextResponse } from 'next/server';
import {NextRequest} from 'next/server';
import axios from 'axios';
export const  GET=async(requset:NextRequest) {
    const status = requset.nextUrl.searchParams.get('status');
    if (status !== 'success') {
        return NextResponse.json({ error: 'Authorization failed' }, { status: 400 });
    }
    const code = requset.nextUrl.searchParams.get('code');
    if (!code) {
        return NextResponse.json({ error: 'Authorization code not found' }, { status: 400 });
    }
    // const token=await gettoken(code);
    // if (!token) {
    //     return NextResponse.json({ error: 'Failed to retrieve token' }, { status: 500 });
    // }
    return NextResponse.redirect('/mail');


  
}