import HomePage from "./pages/home/HomePage";
import LoginPage from "./pages/auth/login/LoginPage";
import SignUpPage from "./pages/auth/signup/SignUpPage";
import MessagesPage from "./pages/message/MessagesPage";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Sidebar from "./components/common/Sidebar";
import RightPanel from "./components/common/RightPanel";
import NotificationPage from "./pages/notification/NotificationPage";
import ProfilePage from "./pages/profile/ProfilePage";
import { Toaster } from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";
import LoadingSpinner from "./components/common/LoadingSpinner";
import { SocketContextProvider } from "./context/SocketContext";

export default function App() {
  const location = useLocation();
  
  const {data:authUser, isLoading} = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if(data.error) return null;
        if(!res.ok) {
          throw new Error(data.error || "Failed to fetch user");
        }
        console.log("authUser is here", data);
        return data;
      } catch (error) {
        throw error;
      }
    },
    retry: false,
  });

  if(isLoading) {
    return (
      <div className="h-screen flex justify-center items-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Kiểm tra xem có đang ở trang Messages không
  const isMessagesPage = location.pathname === '/messages';

  return (
    <div className='flex max-w-6xl mx-auto'>
      <SocketContextProvider>
        {/* Common component , bc it's not wrapped with Routes*/}
        {authUser && <Sidebar/>}
        <Routes>
					<Route path='/' element={authUser ? <HomePage /> : <Navigate to='/login' />} />
					<Route path='/login' element={!authUser ? <LoginPage /> : <Navigate to='/' />} />
					<Route path='/signup' element={!authUser ? <SignUpPage /> : <Navigate to='/' />} />
					<Route path='/messages' element={authUser ? <MessagesPage /> : <Navigate to='/login' />} />
					<Route path='/notifications' element={authUser ? <NotificationPage /> : <Navigate to='/login' />} />
					<Route path='/profile/:username' element={authUser ? <ProfilePage /> : <Navigate to='/login' />} />
        </Routes>
        {/* Ẩn RightPanel khi ở trang Messages */}
        {authUser && !isMessagesPage && <RightPanel/>}
      </SocketContextProvider>
      <Toaster />
    </div>
  );
}
