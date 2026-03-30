import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MobileRedirect } from "@/components/mobile/MobileRedirect";
import Index from "./pages/Index";
import About from "./pages/About";
import Uniforms from "./pages/Uniforms";
import Fees from "./pages/Fees";
import FeeManagement from "./pages/FeeManagement";
import GlobalPathways from "./pages/GlobalPathways";
import Leadership from "./pages/Leadership";
import Activities from "./pages/Activities";
import Auth from "./pages/Auth";
import Signup from "./pages/Signup";
import Billing from "./pages/Billing";
import Payment from "./pages/billing/Payment";
import Dashboard from "./pages/Dashboard";
import Enrollment from "./pages/Enrollment";
import FeeCollection from "./pages/FeeCollection";
import ManageCollections from "./pages/ManageCollections";
import BalanceWriteoff from "./pages/BalanceWriteoff";
import RecordIncome from "./pages/accounts/RecordIncome";
import RecordExpense from "./pages/accounts/RecordExpense";
import ManageCategories from "./pages/accounts/ManageCategories";
import Reports from "./pages/Reports";
import ManageUsers from "./pages/ManageUsers";
import ManageTeachers from "./pages/ManageTeachers";
import ManageClasses from "./pages/ManageClasses";
import StudentParentRecords from "./pages/StudentParentRecords";
import StudentPassOut from "./pages/StudentPassOut";
import ClassPromotion from "./pages/ClassPromotion";
import ManageSuppliers from "./pages/ManageSuppliers";
import SupplierTransactions from "./pages/SupplierTransactions";
import SupplierReports from "./pages/SupplierReports";
import ManageBooks from "./pages/ManageBooks";
import BookSales from "./pages/BookSales";
import SchoolSettings from "./pages/SchoolSettings";

import NotFound from "./pages/NotFound";

// Mobile pages
import MobileDashboard from "./pages/mobile/MobileDashboard";
import MobileFeeCollection from "./pages/mobile/MobileFeeCollection";
import MobileStudentEnrollment from "./pages/mobile/MobileStudentEnrollment";
import MobileRecordIncome from "./pages/mobile/MobileRecordIncome";
import MobileRecordExpense from "./pages/mobile/MobileRecordExpense";
import MobileParents from "./pages/mobile/MobileParents";
import MobileManageTeachers from "./pages/mobile/MobileManageTeachers";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <MobileRedirect>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/global-pathways" element={<GlobalPathways />} />
          <Route path="/leadership" element={<Leadership />} />
          <Route path="/activities" element={<Activities />} />
          <Route path="/uniforms" element={<Uniforms />} />
          <Route path="/fees" element={<Fees />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/signup" element={<Signup />} />
          <Route 
            path="/billing" 
            element={
              <ProtectedRoute requireUser>
                <Billing />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/billing/payment" 
            element={
              <ProtectedRoute requireUser>
                <Payment />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute requireUser>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/enrollment"
            element={
              <ProtectedRoute requireUser>
                <Enrollment />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student-parent-records"
            element={
              <ProtectedRoute requireUser>
                <StudentParentRecords />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/parents"
            element={
              <ProtectedRoute requireUser>
                <StudentParentRecords />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/students"
            element={
              <ProtectedRoute requireUser>
                <StudentParentRecords />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/fee-collection" 
            element={
              <ProtectedRoute requireUser>
                <FeeCollection />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/fee-management" 
            element={
              <ProtectedRoute requireUser>
                <FeeManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/manage-collections" 
            element={
              <ProtectedRoute requireAdmin>
                <ManageCollections />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/balance-writeoff" 
            element={
              <ProtectedRoute requireAdmin>
                <BalanceWriteoff />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/accounts/income" 
            element={
              <ProtectedRoute requireUser>
                <RecordIncome />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/accounts/expense" 
            element={
              <ProtectedRoute requireUser>
                <RecordExpense />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/accounts/categories" 
            element={
              <ProtectedRoute requireAdmin>
                <ManageCategories />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reports" 
            element={
              <ProtectedRoute requireAdmin>
                <Reports />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/manage-users" 
            element={
              <ProtectedRoute requireAdmin>
                <ManageUsers />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/manage-teachers" 
            element={
              <ProtectedRoute requireUser>
                <ManageTeachers />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/manage-classes" 
            element={
              <ProtectedRoute requireUser>
                <ManageClasses />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student-passout" 
            element={
              <ProtectedRoute requireAdmin>
                <StudentPassOut />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/class-promotion" 
            element={
              <ProtectedRoute requireAdmin>
                <ClassPromotion />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/school-settings" 
            element={
              <ProtectedRoute requireAdmin>
                <SchoolSettings />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/manage-suppliers" 
            element={
              <ProtectedRoute requireUser>
                <ManageSuppliers />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/supplier-transactions" 
            element={
              <ProtectedRoute requireUser>
                <SupplierTransactions />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/supplier-reports" 
            element={
              <ProtectedRoute requireAdmin>
                <SupplierReports />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/manage-books" 
            element={
              <ProtectedRoute requireUser>
                <ManageBooks />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/book-sales" 
            element={
              <ProtectedRoute requireUser>
                <BookSales />
              </ProtectedRoute>
            } 
          />
          {/* Mobile Routes */}
          <Route 
            path="/mobile/dashboard" 
            element={
              <ProtectedRoute requireUser>
                <MobileDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/mobile/fee-collection" 
            element={
              <ProtectedRoute requireUser>
                <MobileFeeCollection />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/mobile/enrollment" 
            element={
              <ProtectedRoute requireUser>
                <MobileStudentEnrollment />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/mobile/income" 
            element={
              <ProtectedRoute requireUser>
                <MobileRecordIncome />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/mobile/expense" 
            element={
              <ProtectedRoute requireUser>
                <MobileRecordExpense />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/mobile/parents" 
            element={
              <ProtectedRoute requireUser>
                <MobileParents />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/mobile/teachers" 
            element={
              <ProtectedRoute requireUser>
                <MobileManageTeachers />
              </ProtectedRoute>
            } 
          />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MobileRedirect>
    </BrowserRouter>
  </TooltipProvider>
</QueryClientProvider>
);

export default App;
