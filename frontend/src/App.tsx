import { lazy, Suspense, type ReactNode } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import RequireRole from './components/auth/RequireRole'
import Home from './pages/Home'
import Occasions from './pages/Occasions'
import LuxuryHampers from './pages/LuxuryHampers'
import IndoorPlants from './pages/IndoorPlants'
import CategoryListing from './pages/CategoryListing'
import ProductDetail from './pages/ProductDetail'
import WeddingEvents from './pages/WeddingEvents'
import About from './pages/About'
import CustomOrder from './pages/CustomOrder'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import PayHerePayment from './pages/PayHerePayment'
import OrderConfirmation from './pages/OrderConfirmation'
import TrackOrder from './pages/TrackOrder'
import AuthPage from './pages/AuthPage'
import ResetPassword from './pages/ResetPassword'
import NotFound from './pages/NotFound'
import { CareGuide, DeliveryInfo, Faq, Privacy, RefundPolicy } from './pages/InfoPages'
import AccountLayout from './pages/account/AccountLayout'
import AccountOrders from './pages/account/AccountOrders'
import AccountOrderDetail from './pages/account/AccountOrderDetail'
import AccountAddresses from './pages/account/AccountAddresses'
import AccountProfile from './pages/account/AccountProfile'

// The owner console is loaded only when someone opens /admin, so customers never download it.
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'))
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'))
const Dashboard = lazy(() => import('./pages/admin/Dashboard'))
const Orders = lazy(() => import('./pages/admin/Orders'))
const OrderDetail = lazy(() => import('./pages/admin/OrderDetail'))
const Products = lazy(() => import('./pages/admin/Products'))
const ProductForm = lazy(() => import('./pages/admin/ProductForm'))
const Categories = lazy(() => import('./pages/admin/Categories'))
const Inventory = lazy(() => import('./pages/admin/Inventory'))
const Customers = lazy(() => import('./pages/admin/Customers'))
const Inquiries = lazy(() => import('./pages/admin/Inquiries'))
const Reviews = lazy(() => import('./pages/admin/Reviews'))
const Analytics = lazy(() => import('./pages/admin/Analytics'))
const Settings = lazy(() => import('./pages/admin/Settings'))

function AdminSuspense({ children }: { children: ReactNode }) {
  return <Suspense fallback={<div className="min-h-screen bg-background" aria-busy="true" />}>{children}</Suspense>
}

export default function App() {
  return (
    <Routes>
      {/* Customer-facing storefront */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<CategoryListing />} />
        <Route path="/products/occasions" element={<Occasions />} />
        <Route path="/products/luxury-hampers" element={<LuxuryHampers />} />
        <Route path="/products/indoor-plants" element={<IndoorPlants />} />
        <Route path="/products/:categorySlug" element={<CategoryListing />} />
        <Route path="/product/:slug" element={<ProductDetail />} />
        <Route path="/wedding-events" element={<WeddingEvents />} />
        <Route path="/about" element={<About />} />
        <Route path="/custom-order" element={<CustomOrder />} />
        <Route path="/bespoke" element={<Navigate to="/custom-order" replace />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/payment/:orderNumber" element={<PayHerePayment />} />
        <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmation />} />
        <Route path="/track-order" element={<TrackOrder />} />
        <Route path="/sign-in" element={<AuthPage mode="sign-in" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/delivery" element={<DeliveryInfo />} />
        <Route path="/care-guide" element={<CareGuide />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />
        <Route path="/privacy" element={<Privacy />} />

        <Route
          path="/account"
          element={
            <RequireRole role="CUSTOMER">
              <AccountLayout />
            </RequireRole>
          }
        >
          <Route index element={<Navigate to="orders" replace />} />
          <Route path="orders" element={<AccountOrders />} />
          <Route path="orders/:orderNumber" element={<AccountOrderDetail />} />
          <Route path="addresses" element={<AccountAddresses />} />
          <Route path="profile" element={<AccountProfile />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Owner console (separate layout: sidebar + top bar), owner role only */}
      <Route path="/admin/login" element={<AdminSuspense><AdminLogin /></AdminSuspense>} />
      <Route
        path="/admin"
        element={
          <RequireRole role="OWNER">
            <AdminLayout />
          </RequireRole>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="orders" element={<Orders />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="products" element={<Products />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/:id" element={<ProductForm />} />
        <Route path="categories" element={<Categories />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="customers" element={<Customers />} />
        <Route path="inquiries" element={<Inquiries />} />
        <Route path="reviews" element={<Reviews />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  )
}
