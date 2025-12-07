import MentorDashboard from "./pages/MentorDashboard";
import MentorClubDetails from "./pages/MentorClubDetails";   

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import ClubDetail from "./pages/ClubDetail";
import EventDetail from "./pages/EventDetail";
import AdminDashboard from "./pages/AdminDashboard";
import ClubCredentials from "./pages/ClubCredentials";
import ViewReport from "./pages/ViewReport";
import StudentLogin from "./pages/StudentLogin";
import StudentDashboard from "./pages/StudentDashboard";
import NotFound from "./pages/NotFound";
import KmitEvents from "@/pages/KmitEvents";
import KmitEventsPast from "@/pages/KmitEventsPast";
import KmitEventDetail from "@/pages/KmitEventDetail";
import NoticeBoard from "./pages/NoticeBoard";
import MentorViewReport from "@/pages/MentorViewReport";
import MentorClubReports from "@/pages/MentorClubReports";
import ResetPassword from "./pages/ResetPassword";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>

          {/* HOME */}
          <Route path="/" element={<Home />} />
          <Route path="/notice-board" element={<NoticeBoard />} />

          {/* CLUB DETAILS */}
          <Route path="/club/:id" element={<ClubDetail />} />
          <Route path="/club/:clubId/event/:eventId" element={<EventDetail />} />

          {/* ADMIN */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/report/:reportId" element={<ViewReport />} />
          <Route path="/credentials" element={<ClubCredentials />} />

          {/* STUDENT */}
          <Route path="/student/login" element={<StudentLogin />} />
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* REPORT */}
          <Route path="/report/:reportId" element={<ViewReport />} />

          {/* KMIT EVENTS */}
          <Route path="/kmit-events" element={<KmitEvents />} />
          <Route path="/kmit-events/past" element={<KmitEventsPast />} />
          <Route path="/kmit-events/:id" element={<KmitEventDetail />} />

          {/* MENTOR ROUTES */}
          <Route path="/mentor/dashboard" element={<MentorDashboard />} />
          <Route path="/mentor/clubs/:id" element={<MentorClubDetails />} />  {/* ✅ NOW WORKING */}
          <Route path="/mentor/view-report/:reportId" element={<MentorViewReport />} />
          <Route path="/mentor/clubs/:id/reports" element={<MentorClubReports />} />



          {/* 404 */}
          <Route path="*" element={<NotFound />} />

        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;


















// // import KmitEvents from "./pages/KmitEvents";
// import MentorDashboard from "./pages/MentorDashboard";

// import { Toaster } from "@/components/ui/toaster";
// import { Toaster as Sonner } from "@/components/ui/sonner";
// import { TooltipProvider } from "@/components/ui/tooltip";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import Home from "./pages/Home";
// import ClubDetail from "./pages/ClubDetail";
// import EventDetail from "./pages/EventDetail";
// import AdminDashboard from "./pages/AdminDashboard";
// import ClubCredentials from "./pages/ClubCredentials";
// import ViewReport from "./pages/ViewReport";
// import StudentLogin from "./pages/StudentLogin";
// import StudentDashboard from "./pages/StudentDashboard";
// import NotFound from "./pages/NotFound";
// import KmitEvents from "@/pages/KmitEvents";
// import KmitEventsPast from "@/pages/KmitEventsPast";
// import KmitEventDetail from "@/pages/KmitEventDetail";
// // import MentorDashboard from "@/pages/MentorDashboard";


// const queryClient = new QueryClient();

// const App = () => (
//   <QueryClientProvider client={queryClient}>
//     <TooltipProvider>
//       <Toaster />
//       <Sonner />
//       <BrowserRouter>
//         <Routes>
//           <Route path="/" element={<Home />} />
//           <Route path="/club/:id" element={<ClubDetail />} />
//           <Route path="/club/:clubId/event/:eventId" element={<EventDetail />} />
//           <Route path="/admin" element={<AdminDashboard />} />
//           <Route path="/admin/report/:reportId" element={<ViewReport />} />
//           <Route path="/credentials" element={<ClubCredentials />} />
//           <Route path="/student/login" element={<StudentLogin />} />
//           <Route path="/student/dashboard" element={<StudentDashboard />} />
//           <Route path="/report/:reportId" element={<ViewReport />} />
//           <Route path="*" element={<NotFound />} />
//           <Route path="/kmit-events" element={<KmitEvents />} />
//           <Route path="/mentor/dashboard" element={<MentorDashboard />} />
//           <Route path="/kmit-events" element={<KmitEvents />} />
// <Route path="/kmit-events/past" element={<KmitEventsPast />} />
// <Route path="/kmit-events/:id" element={<KmitEventDetail />} />
// <Route path="/mentor/dashboard" element={<MentorDashboard />} />



//         </Routes>
//       </BrowserRouter>
//     </TooltipProvider>
//   </QueryClientProvider>
// );

// export default App;
