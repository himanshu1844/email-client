"use server"
import { auth} from '@clerk/nextjs/server';
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