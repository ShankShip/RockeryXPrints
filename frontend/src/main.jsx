import { StrictMode, useEffect, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { Provider, useDispatch } from 'react-redux'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import { store } from './store/store.js'
import { fetchCurrentUser } from './store/authSlice'
import { fetchCart } from './store/cartSlice'
import { ErrorBoundary } from './components/common/ErrorBoundary.jsx'

// Lazy Loaded Pages
const Home = lazy(() => import('./pages/Home.jsx'))
const AuthPage = lazy(() => import('./pages/AuthPage.jsx'))
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage.jsx'))
const CartPage = lazy(() => import('./pages/CartPage.jsx'))
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'))
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage.jsx'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'))
const CategoriesPage = lazy(() => import('./pages/CategoriesPage.jsx'))
const CollectionsPage = lazy(() => import('./pages/CollectionsPage.jsx'))
const ShopPage = lazy(() => import('./pages/ShopPage.jsx'))
const CategoryDetailPage = lazy(() => import('./pages/CategoryDetailPage.jsx'))
const ReturnPolicyPage = lazy(() => import('./pages/ReturnPolicyPage.jsx'))
const TermsPage = lazy(() => import('./pages/TermsPage.jsx'))
import AuthLayout from './components/AuthLayout.jsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/auth',
    element: (
      <AuthLayout authentication={false}>
        <AuthPage />
      </AuthLayout>
    ),
  },
  {
    path: '/products/:slug',
    element: <ProductDetailPage />,
  },
  {
    path: '/cart',
    element: <CartPage />,
  },
  {
    path: '/dashboard',
    element: (
      <AuthLayout authentication={true}>
        <DashboardPage />
      </AuthLayout>
    ),
  },
  {
    path: '/orders/:orderId',
    element: <OrderDetailPage />,
  },
  {
    path: '/collections',
    element: <CollectionsPage />,
  },
  {
    path: '/categories',
    element: <CategoriesPage />,
  },
  {
    path: '/category/:categorySlug',
    element: <CategoryDetailPage />,
  },
  {
    path: '/shop',
    element: <ShopPage />,
  },
  {
    path: '/return-policy',
    element: <ReturnPolicyPage />,
  },
  {
    path: '/returns',
    element: <ReturnPolicyPage />,
  },
  {
    path: '/terms-and-conditions',
    element: <TermsPage />,
  },
  {
    path: '/terms',
    element: <TermsPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])

function AppWrapper({ children }) {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchCurrentUser()).then((action) => {
      if (fetchCurrentUser.fulfilled.match(action) && action.payload) {
        dispatch(fetchCart());
      }
    });
  }, [dispatch]);

  return children;
}

const FallbackLoader = () => (
  <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
    <div className="font-space font-black uppercase text-2xl animate-pulse tracking-widest text-black">
      LOADING SYSTEMS...
    </div>
  </div>
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <Provider store={store}>
          <AppWrapper>
            <Suspense fallback={<FallbackLoader />}>
              <RouterProvider router={router} />
            </Suspense>
          </AppWrapper>
        </Provider>
      </HelmetProvider>
    </ErrorBoundary>
  </StrictMode>
)
