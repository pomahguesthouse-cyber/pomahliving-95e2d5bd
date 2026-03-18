import { BrowserRouter, Route, Routes } from "react-router-dom";
import Landing from "./pages/Landing";
import InputLand from "./pages/InputLand";
import Builder from "./pages/Builder";
import FloorPlan from "./pages/FloorPlan";
import Review from "./pages/Review";
import NotFound from "./pages/NotFound";

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/input-land" element={<InputLand />} />
      <Route path="/builder" element={<Builder />} />
      <Route path="/floorplan" element={<FloorPlan />} />
      <Route path="/review" element={<Review />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

export default App;
