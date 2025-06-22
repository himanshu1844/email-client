"use client";
import Image from "next/image";
import { getaurinko } from "@/lib/aurinko";
export default function Home() {
  return (
   <button className='bg-blue-500  text-white py-2 px-4 rounded' onClick={async () => {
    const authURL = await getaurinko('Google');
    if (authURL) {
      window.location.href = authURL;
    }
   }}>LINK ACCOUNT</button>
  );        
}
