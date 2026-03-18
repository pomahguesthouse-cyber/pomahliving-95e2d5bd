import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Landing from "./pages/Landing";
import InputLand from "./pages/InputLand";
import Builder from "./pages/Builder";
import Review from "./pages/Review";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/input-land" element={<InputLand />} />
        <Route path="/builder" element={<Builder />} />
        <Route path="/review" element={<Review />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
    <Toaster />
  </QueryClientProvider>
);

export default App;
