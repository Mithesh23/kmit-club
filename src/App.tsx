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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/club/:id" element={<ClubDetail />} />
          <Route path="/club/:clubId/event/:eventId" element={<EventDetail />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/report/:reportId" element={<ViewReport />} />
          <Route path="/credentials" element={<ClubCredentials />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
