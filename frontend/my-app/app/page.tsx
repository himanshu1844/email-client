"use client";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import { useEffect } from "react"; // Import useEffect

export default function Home() {
  const { isLoaded, isSignedIn, userId } = useAuth();

  // Log user ID only when Clerk has loaded and a user is signed in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      console.log("User ID:", userId);
    } else if (isLoaded && !isSignedIn) {
      console.log("Clerk loaded, but user is not signed in.");
    } else {
      console.log("Clerk is still loading...");
    }
  }, [isLoaded, isSignedIn, userId]); // Depend on these values

  const handleLinkAccount = async () => {
    // Only proceed if Clerk is loaded AND the user is signed in
    if (!isLoaded) {
      console.log("Clerk not yet loaded. Please wait.");
      return;
    }
    if (!isSignedIn) {
      console.log("User is not signed in. Cannot link account.");
      // Optionally, redirect to sign-in page here
      // window.location.href = "/sign-in"; // Or use Clerk's redirectToSignIn()
      return;
    }

    try {
      const response = await axios.get(`http://localhost:8000/api/google/authurl?clerkUserId=${userId}`, {
        withCredentials: true
      });

      const authURL = response.data.authURL;
      console.log("response.data:", response.data); 

      if (authURL) {
        window.location.href = authURL;
      } else {
        console.error("Authentication URL not received from API.");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) { // Type guard for Axios error
        if (error.response) {
          console.error(
            "Error fetching authentication URL (HTTP Error):",
            error.response.status,
            error.response.data
          );
        } else if (error.request) {
          console.error("Error fetching authentication URL (No Response):", error.request);
        } else {
          console.error("Error fetching authentication URL:", error.message);
        }
      } else {
        console.error("An unexpected error occurred:", error);
      }
    }
  };

  // Render different content based on loading/auth state
  if (!isLoaded) {
    return <div>Loading authentication...</div>;
  }

  if (!isSignedIn) {
    return (
      <div>
        <p>Please sign in to link your Google account.</p>
        {/* You might provide a sign-in button here */}
        {/* <SignInButton /> */}
      </div>
    );
  }

  // If we reach here, isLoaded is true and isSignedIn is true, so userId will be available
  return (
    <div>
      <h1>Welcome, {userId}!</h1> {/* Just for demonstration */}
      <button className="background-blue" onClick={handleLinkAccount}>Link Google Account</button>
    </div>
  );
}


// "use client";
// import {useAuth} from "@clerk/nextjs";  
// import axios from "axios";


// export default function Home() {
//   const { userId } = useAuth() as { userId: string };
//   console.log("User ID:", userId); 

  

//   const handleLinkAccount = async () => {
  

//     try {
    
//       const response = await axios.get(`http://localhost:8000/api/google/authurl?clerkUserId=${encodeURIComponent(userId)}`, {
       
//         withCredentials: true
//       });

//       const authURL = response.data.authURL; 

//       if (authURL) {
//         window.location.href = authURL; // Redirect to Google's consent screen
//       } else {
//         console.error("Authentication URL not received from API.");
//       }
//     } catch (error:any) {
//       // Axios wraps errors, typically you'd check error.response for HTTP errors
//       if (error.response) {
//         // The request was made and the server responded with a status code
//         // that falls out of the range of 2xx
//         console.error("Error fetching authentication URL (Axios HTTP Error):", error.response.status, error.response.data);
//       } else if (error.request) {
//         // The request was made but no response was received
//         console.error("Error fetching authentication URL (Axios No Response):", error.request);
//       } else {
//         // Something happened in setting up the request that triggered an Error
//         console.error("Error fetching authentication URL (Axios Request Setup Error):", error.message);
//       }
//     }
//   };


//   return (
//     <button
//       className='bg-blue-500 text-white py-2 px-4 rounded'
//       onClick={handleLinkAccount}
//     >
//       LINK ACCOUNT
//     </button>
//   );
// }

