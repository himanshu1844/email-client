"use server"
import { auth} from '@clerk/nextjs/server';
import axios from 'axios';
export async function getaurinko(serviceType: 'Google' | 'Office365'): Promise<string> {
    const { userId } = await auth();
    if (!userId) {
        throw new Error('User is not authenticated');
    }
    const params=new URLSearchParams(
        {
            clientId: process.env.AURINKO_Client_ID as string,
            serviceType,
            scopes: 'Mail.Read Mail.ReadWrite Mail.Send Mail.Drafts Mail.All',
            responseType:'code',
            returnUrl:process.env.AURINKO_Return_URL as string,
            accountRole:'primary',


        }
    )
    return `https://api.aurinko.io/v1/auth/authorize?${params.toString()}`;

}
 
export const getToken = async (code: string) => {
  const AURINKO_CLIENT_ID = process.env.AURINKO_CLIENT_ID;
  const AURINKO_CLIENT_SECRET = process.env.AURINKO_CLIENT_SECRET;
  const AURINKO_REDIRECT_URI = process.env.AURINKO_REDIRECT_URI;

  if (!AURINKO_CLIENT_ID || !AURINKO_CLIENT_SECRET || !AURINKO_REDIRECT_URI) {
    throw new Error('Aurinko credentials not fully configured in environment variables.');
  }

  // Construct the request body for the token endpoint.
  // This is typically application/x-www-form-urlencoded.
  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('client_id', AURINKO_CLIENT_ID);
  params.append('client_secret', AURINKO_CLIENT_SECRET);
  params.append('code', code);
  params.append('redirect_uri', AURINKO_REDIRECT_URI);

  try {
    const response = await fetch('https://api.aurinko.io/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json', // Request JSON response
      },
      body: params.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Aurinko token exchange API error:', data);
      throw new Error(data.error_description || data.error || 'Failed to exchange code for tokens with Aurinko.');
    }

    return data; // This should contain access_token, refresh_token, expires_in, etc.
  } catch (error:any) {
    console.error('Error during Aurinko token exchange:', error);
    throw new Error(`Aurinko token exchange failed: ${error.message}`);
  }
};

// export async function getToken(code:string){
//      try {
//             const response = await axios.post(`https://api.aurinko.io/v1/auth/token/${code}`, {}, {
//                 auth: {
//                     username: process.env.AURINKO_CLIENT_ID as string,
//                     password: process.env.AURINKO_CLIENT_SECRET as string,
//                 }
//             });
    
//              return response.data as {
//                     accountId: number,
//                     accessToken: string,
//                     userId: string,
//                     userSession: string
//                 }
    
//         } catch (error: any) {
//             console.error('Error fetching token:', error.response ? error.response.data : error.message);
//             throw new Error('Failed to fetch token');
//         }
    
// }
export async function getAccount(token: string) {
    try {
           const response = await axios.get('https://api.aurinko.io/v1/account', {
               headers: {
                   'Authorization': `Bearer ${token}`
               }
           });
           return response.data as{
               
                email: string,
                name: string
           };
           
    } catch (error:any) {
           console.error('Error fetching account:', error.response ? error.response.data : error.message);
           throw new Error('Failed to fetch account');
    }
}