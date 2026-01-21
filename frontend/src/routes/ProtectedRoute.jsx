import PrivateRoute from "./PrivateRoute";

const protectedRoute = (module, subModule, action, Element, path, loader) => ({
  path,
  element: (
    <PrivateRoute module={module} subModule={subModule} action={action}>
      <Element />
    </PrivateRoute>
  ),
   ...(loader && { loader }),
});

export default protectedRoute;