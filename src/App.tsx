import React, { useState, useEffect } from 'react';
import { PageRoute, UserRole, Employee, ManagementUser, ActivityLog } from './types';
import { INITIAL_EMPLOYEES, INITIAL_MANAGEMENT_USERS, INITIAL_ACTIVITY_LOGS } from './data/initialData';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LoginModal } from './components/LoginModal';
import { HomeView } from './views/HomeView';
import { EmployeesView } from './views/EmployeesView';
import { SignatureStudioView } from './views/SignatureStudioView';
import { InstallationGuideView } from './views/InstallationGuideView';
import { AboutView } from './views/AboutView';
import { SupportView } from './views/SupportView';
import { EmployeePortalView } from './views/EmployeePortalView';
import { ManagementPortalView } from './views/ManagementPortalView';
import { AdminPanelView } from './views/AdminPanelView';
import { 
  getStoredAuthSession, 
  setStoredAuthSession, 
  clearAuthSession, 
  canAccessAdmin, 
  canAccessManagement, 
  canAccessEmployee 
} from './services/authService';
import { deleteSignatureRecord } from './services/signatureStorageService';
import { 
  getFirestoreEmployees, 
  subscribeToFirestoreEmployees, 
  saveFirestoreEmployee, 
  deleteFirestoreEmployee,
  getFirestoreActivityLogs,
  subscribeToFirestoreActivityLogs,
  saveFirestoreActivityLog
} from './services/firebaseService';

export const App: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<PageRoute>('home');
  const [adminInitialTab, setAdminInitialTab] = useState<string>('settings');
  const [employeeInitialTab, setEmployeeInitialTab] = useState<string>('dashboard');
  const [managementInitialTab, setManagementInitialTab] = useState<string>('dashboard');

  const [userRole, setUserRole] = useState<UserRole>(() => {
    const session = getStoredAuthSession();
    return session ? session.role : 'guest';
  });

  const [employees, setEmployees] = useState<Employee[]>(() => getFirestoreEmployees());
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(() => {
    const session = getStoredAuthSession();
    const emps = getFirestoreEmployees();
    if (session && session.employeeId) {
      return emps.find(e => e.id.toLowerCase() === session.employeeId?.toLowerCase()) || 
             INITIAL_EMPLOYEES.find(e => e.id.toLowerCase() === session.employeeId?.toLowerCase()) || null;
    }
    return null;
  });
  const [managementUsers, setManagementUsers] = useState<ManagementUser[]>(INITIAL_MANAGEMENT_USERS);
  const [currentMgmtUser, setCurrentMgmtUser] = useState<ManagementUser>(INITIAL_MANAGEMENT_USERS[0]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => getFirestoreActivityLogs());
  const [searchQuery, setSearchQuery] = useState('');
  
  const [loginModal, setLoginModal] = useState<{
    isOpen: boolean;
    portal: 'employee' | 'management' | 'admin';
    targetRoute?: PageRoute;
  }>({
    isOpen: false,
    portal: 'employee'
  });

  // Real-time Firestore synchronization for employees and activity logs
  useEffect(() => {
    const unsubEmployees = subscribeToFirestoreEmployees((liveList) => {
      setEmployees(liveList);
    });
    const unsubLogs = subscribeToFirestoreActivityLogs((liveLogs) => {
      setActivityLogs(liveLogs);
    });
    return () => {
      unsubEmployees();
      unsubLogs();
    };
  }, []);

  // Keep currentEmployee in sync with session & live Firestore employees list
  useEffect(() => {
    const session = getStoredAuthSession();
    if (session && session.employeeId && employees.length > 0) {
      const match = employees.find(e => e.id.toLowerCase() === session.employeeId?.toLowerCase()) ||
                    INITIAL_EMPLOYEES.find(e => e.id.toLowerCase() === session.employeeId?.toLowerCase());
      if (match) {
        setCurrentEmployee(match);
      }
    }
  }, [employees]);

  // Standard HTML5 Pathname Routing with RBAC Access Protection
  useEffect(() => {
    const handleLocationChange = () => {
      const session = getStoredAuthSession();
      const rawPath = window.location.pathname.toLowerCase().replace(/\/$/, '') || '/';
      const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase().trim();
      const path = hash || rawPath;

      // 1. Internal Protected Route: /admin and subpaths
      if (path === '/admin' || path === 'admin' || path.startsWith('/admin') || path.startsWith('admin/')) {
        if (!canAccessAdmin(session)) {
          // Deny access and trigger Admin Authentication
          setLoginModal({ isOpen: true, portal: 'admin', targetRoute: path.includes('studio') ? 'admin-signatures-studio' : 'admin-panel' });
          setCurrentRoute('home');
          window.history.replaceState(null, '', '/');
          return;
        }

        if (path === '/admin/signatures/studio' || path === 'admin/signatures/studio' || path.includes('studio')) {
          setCurrentRoute('admin-signatures-studio');
          setAdminInitialTab('signature-studio');
          window.history.replaceState(null, '', '/admin/signatures/studio');
        } else {
          setCurrentRoute('admin-panel');
          window.history.replaceState(null, '', '/admin');
        }
        return;
      }

      // 2. Internal Protected Route: /management and subpaths
      if (path === '/management' || path === 'management' || path.startsWith('/management') || path.startsWith('management/')) {
        if (!canAccessManagement(session)) {
          setLoginModal({ isOpen: true, portal: 'management', targetRoute: path.includes('signatures') ? 'management-signatures' : 'management-portal' });
          setCurrentRoute('home');
          window.history.replaceState(null, '', '/');
          return;
        }

        if (path === '/management/signatures' || path === 'management/signatures' || path.includes('signatures')) {
          setCurrentRoute('management-signatures');
          setManagementInitialTab('signatures');
          window.history.replaceState(null, '', '/management/signatures');
        } else {
          setCurrentRoute('management-portal');
          window.history.replaceState(null, '', '/management');
        }
        return;
      }

      // 3. Internal Protected Route: /employee and subpaths
      if (path === '/employee' || path === 'employee' || path.startsWith('/employee') || path.startsWith('employee/')) {
        if (!canAccessEmployee(session)) {
          setLoginModal({ isOpen: true, portal: 'employee', targetRoute: path.includes('studio') ? 'employee-signature-studio' : 'employee-portal' });
          setCurrentRoute('home');
          window.history.replaceState(null, '', '/');
          return;
        }

        if (path === '/employee/signature-studio' || path === 'employee/signature-studio' || path.includes('studio')) {
          setCurrentRoute('employee-signature-studio');
          setEmployeeInitialTab('signature-studio');
          window.history.replaceState(null, '', '/employee/signature-studio');
        } else {
          setCurrentRoute('employee-portal');
          window.history.replaceState(null, '', '/employee');
        }
        return;
      }

      // 4. Public Unprotected Routes
      if (path === '/employees' || path === 'employees') {
        setCurrentRoute('employees');
        window.history.replaceState(null, '', '/employees');
      } else if (path === '/signature-studio' || path === 'signature-studio') {
        setCurrentRoute('signature-studio');
        window.history.replaceState(null, '', '/signature-studio');
      } else if (path === '/installation-guide' || path === 'installation-guide') {
        setCurrentRoute('installation-guide');
        window.history.replaceState(null, '', '/installation-guide');
      } else if (path === '/about' || path === 'about') {
        setCurrentRoute('about');
        window.history.replaceState(null, '', '/about');
      } else if (path === '/support' || path === 'support') {
        setCurrentRoute('support');
        window.history.replaceState(null, '', '/support');
      } else {
        setCurrentRoute('home');
        window.history.replaceState(null, '', '/');
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    handleLocationChange();

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const handleNavigate = (route: PageRoute) => {
    const session = getStoredAuthSession();

    // Route guards
    if (route === 'admin-panel' || route === 'admin-signatures-studio') {
      if (!canAccessAdmin(session)) {
        setLoginModal({ isOpen: true, portal: 'admin', targetRoute: route });
        return;
      }
      if (route === 'admin-signatures-studio') {
        setAdminInitialTab('signature-studio');
      }
    } else if (route === 'management-portal' || route === 'management-signatures') {
      if (!canAccessManagement(session)) {
        setLoginModal({ isOpen: true, portal: 'management', targetRoute: route });
        return;
      }
      if (route === 'management-signatures') {
        setManagementInitialTab('signatures');
      }
    } else if (route === 'employee-portal' || route === 'employee-signature-studio') {
      if (!canAccessEmployee(session)) {
        setLoginModal({ isOpen: true, portal: 'employee', targetRoute: route });
        return;
      }
      if (route === 'employee-signature-studio') {
        setEmployeeInitialTab('signature-studio');
      }
    }

    setCurrentRoute(route);

    const pathMap: Record<PageRoute, string> = {
      'home': '/',
      'employees': '/employees',
      'signature-studio': '/signature-studio',
      'installation-guide': '/installation-guide',
      'about': '/about',
      'support': '/support',
      'employee-portal': '/employee',
      'employee-signature-studio': '/employee/signature-studio',
      'management-portal': '/management',
      'management-signatures': '/management/signatures',
      'admin-panel': '/admin',
      'admin-signatures-studio': '/admin/signatures/studio'
    };

    const targetPath = pathMap[route] || '/';
    if (window.location.pathname !== targetPath || window.location.hash) {
      window.history.pushState(null, '', targetPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenLoginModal = (portal?: 'employee' | 'management' | 'admin') => {
    setLoginModal({ isOpen: true, portal: portal || 'employee' });
  };

  const handleLoginSuccess = (role: UserRole, targetRoute: PageRoute, mgmtUser?: ManagementUser, employee?: Employee) => {
    setUserRole(role);
    if (mgmtUser) setCurrentMgmtUser(mgmtUser);
    if (employee) {
      setCurrentEmployee(employee);
    } else if (role === 'employee') {
      const session = getStoredAuthSession();
      const match = employees.find(e => e.id.toLowerCase() === (session?.employeeId || '').toLowerCase());
      if (match) setCurrentEmployee(match);
    }
    setLoginModal({ isOpen: false, portal: 'employee' });

    // Store secure session
    setStoredAuthSession({
      uid: role === 'admin' ? 'adm-root' : role === 'management' ? (mgmtUser?.id || 'mgmt-01') : (employee?.id || 'emp-user'),
      role,
      email: role === 'admin' ? 'basim@alamengaz.com' : role === 'management' ? (mgmtUser?.email || 'ceo@alamengaz.com') : (employee?.email || 'employee@alamengaz.com'),
      displayName: role === 'admin' ? 'Basim Aslam' : role === 'management' ? (mgmtUser?.name || 'Executive') : (employee?.name || 'Employee'),
      adminTier: role === 'admin' ? 'SUPER_ADMIN' : undefined,
      managementRole: role === 'management' ? (mgmtUser?.role === 'General Manager' ? 'GM' : 'CEO') : undefined,
      employeeId: role === 'employee' ? employee?.id : undefined,
      tokenExpiry: Date.now() + 24 * 60 * 60 * 1000 // 24-hour token
    });

    handleNavigate(targetRoute);

    const newLog: ActivityLog = {
      id: `LOG-00${activityLogs.length + 1}`,
      user: role === 'employee' ? (employee?.name || 'Employee') : role === 'management' ? (mgmtUser?.name || 'Executive') : 'Basim Aslam',
      action: 'Authorized Portal Login',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      details: `Successful role authentication into ${targetRoute}.`
    };
    setActivityLogs([newLog, ...activityLogs]);
  };

  const handleLogout = () => {
    clearAuthSession();
    setUserRole('guest');
    setCurrentEmployee(null);
    handleNavigate('home');
  };

  const handleAddEmployee = async (newEmp: Employee) => {
    await saveFirestoreEmployee(newEmp);
    const newLog: ActivityLog = {
      id: `LOG-00${Date.now().toString().slice(-4)}`,
      user: 'Administrator',
      action: 'New Employee Enrolled',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      details: `Added ${newEmp.name} (${newEmp.jobTitle}, ${newEmp.id}) to company registry.`
    };
    await saveFirestoreActivityLog(newLog);
  };

  const handleUpdateEmployee = async (updatedEmp: Employee) => {
    await saveFirestoreEmployee(updatedEmp);
  };

  const handleDeleteEmployee = async (empId: string) => {
    const target = employees.find(e => e.id === empId);
    await deleteFirestoreEmployee(empId);
    await deleteSignatureRecord(empId, target?.name || empId, 'Root Admin', 'SUPER_ADMIN');

    const newLog: ActivityLog = {
      id: `LOG-00${Date.now().toString().slice(-4)}`,
      user: 'Administrator',
      action: 'Employee Purged',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      details: `Deleted employee record and signature customization for ${target?.name || empId}.`
    };
    await saveFirestoreActivityLog(newLog);
  };

  const handleDeleteSignature = async (empId: string, performedBy: string = 'Administrator', role: string = 'SUPER_ADMIN') => {
    const target = employees.find(e => e.id === empId);
    return await deleteSignatureRecord(empId, target?.name || empId, performedBy, role);
  };

  const handleUpdateManagementUsers = (newUsers: ManagementUser[]) => {
    setManagementUsers(newUsers);
  };

  const isInternalPortal = 
    currentRoute === 'admin-panel' || 
    currentRoute === 'admin-signatures-studio' ||
    currentRoute === 'management-portal' || 
    currentRoute === 'management-signatures' ||
    currentRoute === 'employee-portal' ||
    currentRoute === 'employee-signature-studio';

  return (
    <div className="page-wrapper">
      {/* Site Header — visible only on public pages */}
      {!isInternalPortal && (
        <Header 
          currentRoute={currentRoute}
          onNavigate={handleNavigate}
          onOpenLoginModal={handleOpenLoginModal}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      )}

      {/* Main View Router */}
      <main className={`main-content-wrap ${isInternalPortal ? 'admin-main-wrap' : ''}`}>
        {currentRoute === 'home' && (
          <HomeView 
            onNavigate={handleNavigate}
            onOpenLoginModal={handleOpenLoginModal}
          />
        )}

        {currentRoute === 'employees' && (
          <EmployeesView 
            employees={employees}
            onNavigate={handleNavigate}
            onOpenLoginModal={handleOpenLoginModal}
            externalSearchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        )}

        {currentRoute === 'signature-studio' && (
          <SignatureStudioView 
            currentEmployee={currentEmployee || employees[0]}
            employees={employees}
          />
        )}

        {currentRoute === 'installation-guide' && (
          <InstallationGuideView onNavigate={handleNavigate} />
        )}

        {currentRoute === 'about' && (
          <AboutView onNavigate={handleNavigate} />
        )}

        {currentRoute === 'support' && (
          <SupportView 
            searchQuery={searchQuery}
            onNavigate={handleNavigate}
          />
        )}

        {(currentRoute === 'employee-portal' || currentRoute === 'employee-signature-studio') && (
          <EmployeePortalView 
            currentEmployee={currentEmployee || employees[0]}
            initialTab={employeeInitialTab as any}
            onLogout={handleLogout}
            onNavigate={handleNavigate}
            onDeleteSignature={handleDeleteSignature}
          />
        )}

        {(currentRoute === 'management-portal' || currentRoute === 'management-signatures') && (
          <ManagementPortalView 
            currentUser={currentMgmtUser}
            employees={employees}
            activityLogs={activityLogs}
            userRole={userRole}
            initialTab={managementInitialTab as any}
            onLoginSuccess={(user) => {
              setUserRole('management');
              setCurrentMgmtUser(user);
            }}
            onAddEmployee={handleAddEmployee}
            onUpdateEmployee={handleUpdateEmployee}
            onDeleteSignature={handleDeleteSignature}
            onLogout={handleLogout}
            onNavigate={handleNavigate}
          />
        )}

        {(currentRoute === 'admin-panel' || currentRoute === 'admin-signatures-studio') && (
          <AdminPanelView 
            employees={employees}
            managementUsers={managementUsers}
            activityLogs={activityLogs}
            initialTab={adminInitialTab}
            onAddEmployee={handleAddEmployee}
            onUpdateEmployee={handleUpdateEmployee}
            onDeleteEmployee={handleDeleteEmployee}
            onDeleteSignature={handleDeleteSignature}
            onUpdateManagementUsers={handleUpdateManagementUsers}
            onLogout={handleLogout}
            onNavigate={handleNavigate}
          />
        )}
      </main>

      {/* Site Footer — visible only on public pages */}
      {!isInternalPortal && (
        <Footer onNavigate={handleNavigate} currentRoute={currentRoute} />
      )}

      {/* Universal Login Modal */}
      {loginModal.isOpen && (
        <LoginModal 
          initialPortal={loginModal.portal}
          targetRoute={loginModal.targetRoute}
          employees={employees}
          managementUsers={managementUsers}
          onClose={() => setLoginModal({ isOpen: false, portal: 'employee' })}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </div>
  );
};

