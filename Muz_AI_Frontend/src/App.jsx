import { createBrowserRouter, Navigate, RouterProvider } from "react-router";
import AuthPage from "./pages/AuthPage.jsx";
import Home from "./pages/Home.jsx";

const router = createBrowserRouter([
	{
		path: "/",
		element: <Navigate to="/home" replace />,
	},
	{
		path: "/home",
		element: <Home />,
	},
	{
		path: "/authentication",
		element: <AuthPage />,
	},
	{
		path: "*",
		element: <Navigate to="/home" replace />,
	},
]);

function App() {
	return <RouterProvider router={router} />;
}

export default App;
