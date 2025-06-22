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


        }
    )
    return `https://api.aurinko.io/v1/auth/authorize?${params.toString()}`;

}

export const getToken = async (code: string) => {
    console.log("Code received:", code);
  
    try {
        const response = await axios.post(`https://api.aurinko.io/v1/auth/token/${code}`,
            {},
            {
                auth: {
                    username: process.env.AURINKO_Client_ID as string,
                    password: process.env.AURINKO_CLIENT_SECRET as string,
                    
                }
            }
        );

        return response.data as {
            accountId: number,
           accessToken : string,
            userId: string,
            userSession: string
        }
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Error fetching Aurinko token:', error.response?.data || error.response?.status);
        } else {
            console.error('Unexpected error fetching Aurinko token:', error);
        }
    }
}
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