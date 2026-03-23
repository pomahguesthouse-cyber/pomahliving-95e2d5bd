import { BrowserRouter, Route, Routes } from "react-router-dom";
import Landing from "./pages/Landing";
import FloorPlan from "./pages/FloorPlan";
import AreaPlan from "./pages/AreaPlan";
import AIAdmin from "./pages/AIAdmin";
import NotFound from "./pages/NotFound";

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/floorplan" element={<FloorPlan />} />
      <Route path="/area-plan" element={<AreaPlan />} />
      <Route path="/ai-admin" element={<AIAdmin />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

export default App;
