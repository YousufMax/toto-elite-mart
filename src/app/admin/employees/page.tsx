'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  Plus,
  Key,
  Edit2,
  CheckCircle,
  XCircle,
  Search,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  Check,
  AlertCircle,
  Loader2,
  Settings2,
  ShieldCheck,
  Layers,
  X,
  Sparkles,
} from 'lucide-react';
import { AVAILABLE_PERMISSIONS, ROLE_PERMISSIONS, Role } from '@/lib/permissions';

interface Employee {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  role: string;
  status: string;
  customPermissions?: string[];
  createdAt: string;
  lastLoginAt?: string | null;
}

const ALL_ROLES: Role[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'MANAGER',
  'ORDER_MANAGER',
  'INVENTORY_MANAGER',
  'ACCOUNTANT',
  'STAFF',
];

const ROLE_DESCRIPTIONS: Record<string, string> = {
  SUPER_ADMIN: 'Complete system authority, audit access, financial control, and security rules.',
  ADMIN: 'Comprehensive operations: products, categories, orders, staff, banners, and expenses.',
  MANAGER: 'Daily operations lead: catalog management, inventory adjustments, orders & reports.',
  ORDER_MANAGER: 'Fulfillment operations: order packing, stage updates, shipping & customer calls.',
  INVENTORY_MANAGER: 'Warehouse operations: stock levels, purchase receiving, and inventory audits.',
  ACCOUNTANT: 'Financial auditing: daily operating expenses, profit/loss review, and order ledgers.',
  STAFF: 'General support: storefront catalog view and read-only order confirmation checks.',
};

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [currentSessionUser, setCurrentSessionUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'EMPLOYEES' | 'PERMISSIONS'>('EMPLOYEES');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Add Employee Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addFullName, setAddFullName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addRole, setAddRole] = useState<Role>('STAFF');
  const [addPassword, setAddPassword] = useState('');
  const [addShowPassword, setAddShowPassword] = useState(false);
  const [addCustomPermissions, setAddCustomPermissions] = useState<string[]>([]);
  const [submittingAdd, setSubmittingAdd] = useState(false);
  const [addError, setAddError] = useState('');

  // Edit Employee Modal
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<Role>('STAFF');
  const [editStatus, setEditStatus] = useState('ACTIVE');
  const [editCustomPermissions, setEditCustomPermissions] = useState<string[]>([]);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  // Password Modal (for Super Admin & any employee)
  const [passwordModalEmployee, setPasswordModalEmployee] = useState<Employee | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Fetch employees
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/employees');
      const data = await res.json();
      if (data.success) {
        setEmployees(data.users || []);
        if (data.currentUser) setCurrentSessionUser(data.currentUser);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Generate strong random password
  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
  };

  // Create Employee
  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    if (!addFullName.trim() || !addEmail.trim() || !addPassword) {
      setAddError('Full name, email, and password are required.');
      return;
    }
    setSubmittingAdd(true);

    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: addFullName.trim(),
          email: addEmail.trim(),
          phone: addPhone.trim() || undefined,
          role: addRole,
          password: addPassword,
          customPermissions: addCustomPermissions,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create employee');
      }

      setShowAddModal(false);
      setAddFullName('');
      setAddEmail('');
      setAddPhone('');
      setAddRole('STAFF');
      setAddPassword('');
      setAddCustomPermissions([]);
      fetchEmployees();
    } catch (err: unknown) {
      setAddError(err instanceof Error ? err.message : 'Error creating employee');
    } finally {
      setSubmittingAdd(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setEditFullName(emp.fullName);
    setEditEmail(emp.email);
    setEditPhone(emp.phone || '');
    setEditRole(emp.role as Role);
    setEditStatus(emp.status);
    setEditCustomPermissions(emp.customPermissions || []);
    setEditError('');
  };

  // Save Edit Employee
  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;
    setEditError('');
    setSubmittingEdit(true);

    try {
      const res = await fetch(`/api/employees/${editingEmployee.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: editFullName.trim(),
          email: editEmail.trim(),
          phone: editPhone.trim() || undefined,
          role: editRole,
          status: editStatus,
          customPermissions: editCustomPermissions,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update employee');
      }

      setEditingEmployee(null);
      fetchEmployees();
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'Error updating employee');
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Toggle Employee Status
  const handleToggleStatus = async (emp: Employee) => {
    const nextStatus = emp.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await fetch(`/api/employees/${emp.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || 'Cannot change account status');
        return;
      }
      fetchEmployees();
    } catch (e) {
      console.error(e);
    }
  };

  // Open Password Modal
  const openPasswordModal = (emp: Employee) => {
    setPasswordModalEmployee(emp);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setPasswordSuccess('');
  };

  // Handle Password Update
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalEmployee) return;
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setSubmittingPassword(true);
    try {
      const res = await fetch(`/api/employees/${passwordModalEmployee.id}/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update password');
      }

      setPasswordSuccess('Password successfully updated!');
      setTimeout(() => {
        setPasswordModalEmployee(null);
        setPasswordSuccess('');
      }, 1500);
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : 'Error updating password');
    } finally {
      setSubmittingPassword(false);
    }
  };

  // Filtered list
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.phone && emp.phone.includes(searchQuery));
    const matchesRole = roleFilter === 'ALL' || emp.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || emp.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-amber-100 text-amber-900 border border-amber-300';
      case 'ADMIN':
        return 'bg-purple-100 text-purple-900 border border-purple-300';
      case 'MANAGER':
        return 'bg-blue-100 text-blue-900 border border-blue-300';
      case 'ORDER_MANAGER':
        return 'bg-emerald-100 text-emerald-900 border border-emerald-300';
      case 'INVENTORY_MANAGER':
        return 'bg-orange-100 text-orange-900 border border-orange-300';
      case 'ACCOUNTANT':
        return 'bg-cyan-100 text-cyan-900 border border-cyan-300';
      default:
        return 'bg-slate-100 text-slate-800 border border-slate-300';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-black text-slate-950">Employee Accounts & RBAC Roles</h1>
          </div>
          <p className="text-xs text-slate-500">
            Enterprise Role-Based Access Control, custom staff rule resolutions, password security, and active session governance.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Change My Password button (for current logged-in Super Admin) */}
          {currentSessionUser && (
            <button
              onClick={() => {
                const selfEmp = employees.find((e) => e.id === currentSessionUser.id) || {
                  id: currentSessionUser.id,
                  fullName: 'Super Administrator',
                  email: currentSessionUser.email,
                  role: currentSessionUser.role,
                  status: 'ACTIVE',
                  createdAt: new Date().toISOString(),
                };
                openPasswordModal(selfEmp as Employee);
              }}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center gap-2 border border-slate-300 transition"
            >
              <Key className="w-3.5 h-3.5 text-amber-600" />
              <span>Change My Password</span>
            </button>
          )}

          {/* Add Employee CTA */}
          <button
            onClick={() => {
              setShowAddModal(true);
              setAddError('');
            }}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/25 transition active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Employee</span>
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('EMPLOYEES')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'EMPLOYEES'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Staff Directory ({employees.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('PERMISSIONS')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'PERMISSIONS'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span>Role Permissions & Rules Resolution ({ALL_ROLES.length} Roles)</span>
        </button>
      </div>

      {/* TAB 1: EMPLOYEES DIRECTORY */}
      {activeTab === 'EMPLOYEES' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff by name, email, or phone..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                <option value="ALL">All Roles</option>
                {ALL_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Inactive Only</option>
              </select>
            </div>
          </div>

          {/* Employees Table */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">Employee Name</th>
                    <th className="py-3.5 px-4">Email</th>
                    <th className="py-3.5 px-4">Contact Phone</th>
                    <th className="py-3.5 px-4">Assigned Role</th>
                    <th className="py-3.5 px-4">Custom Rules</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
                        <span>Loading employee directory...</span>
                      </td>
                    </tr>
                  ) : filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400">
                        No employees found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((st) => {
                      const isMe = currentSessionUser?.id === st.id;
                      const hasCustom = st.customPermissions && st.customPermissions.length > 0;

                      return (
                        <tr key={st.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-slate-900 text-amber-400 font-black text-xs flex items-center justify-center shrink-0">
                                {st.fullName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900">{st.fullName}</span>
                                {isMe && (
                                  <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                                    You
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-mono text-slate-600">{st.email}</td>
                          <td className="py-3.5 px-4 font-mono text-slate-600">{st.phone || '—'}</td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-black ${getRoleBadgeColor(
                                st.role
                              )}`}
                            >
                              {st.role}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            {hasCustom ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                                +{st.customPermissions?.length} Custom Rules
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-medium">Standard</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                st.status === 'ACTIVE'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {st.status}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Edit Employee Button */}
                              <button
                                onClick={() => openEditModal(st)}
                                title="Edit Employee"
                                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Change Password Button */}
                              <button
                                onClick={() => openPasswordModal(st)}
                                title="Change / Reset Password"
                                className="p-1.5 rounded-lg text-amber-600 hover:text-amber-700 hover:bg-amber-50 transition"
                              >
                                <Key className="w-3.5 h-3.5" />
                              </button>

                              {/* Activate / Deactivate Toggle */}
                              <button
                                onClick={() => handleToggleStatus(st)}
                                title={st.status === 'ACTIVE' ? 'Deactivate account' : 'Activate account'}
                                className={`text-[11px] font-bold px-2 py-1 rounded-lg transition ${
                                  st.status === 'ACTIVE'
                                    ? 'text-red-600 hover:bg-red-50'
                                    : 'text-emerald-600 hover:bg-emerald-50'
                                }`}
                              >
                                {st.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ROLE PERMISSIONS & RULES RESOLUTION MATRIX */}
      {activeTab === 'PERMISSIONS' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-3">
            <h2 className="text-base font-black text-slate-950 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-500" />
              <span>Role-Based Access Control (RBAC) Rule Resolution</span>
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
              Every staff login evaluates permissions dynamically:
              <br />
              <b>Final Granted Permissions = Default Role Permissions + Custom Employee Rule Overrides</b>.
              Super Admins always bypass all restrictions (`*`) to ensure complete administrative control.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {ALL_ROLES.map((role: Role) => {
              const defaultPerms = ROLE_PERMISSIONS[role] || [];
              const isSuper = role === 'SUPER_ADMIN';

              return (
                <div
                  key={role}
                  className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-amber-400 transition"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`px-3 py-1 rounded-full text-xs font-black ${getRoleBadgeColor(role)}`}>
                        {role}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {isSuper ? 'Unlimited All' : `${defaultPerms.length} rules`}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      {ROLE_DESCRIPTIONS[role]}
                    </p>
                  </div>

                  <div className="border-t border-slate-100 pt-3 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Granted Module Rules:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {isSuper ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          * (All Modules & Root Access)
                        </span>
                      ) : (
                        defaultPerms.map((perm: string) => (
                          <span
                            key={perm}
                            className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700"
                          >
                            {perm}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Full Permission Dictionary */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-600" />
              <span>Available System Permission Rules</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {AVAILABLE_PERMISSIONS.map((p) => (
                <div key={p.key} className="p-3 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{p.label}</span>
                    <span className="text-[9px] uppercase font-bold text-slate-400">{p.module}</span>
                  </div>
                  <div className="font-mono text-[10px] text-amber-700">{p.key}</div>
                  <p className="text-[11px] text-slate-500 leading-snug">{p.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ADD EMPLOYEE MODAL */}
      {/* ======================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-6 right-6 p-1 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-xl font-black text-slate-950 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-500" />
                <span>Add New Employee Account</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Assign a role, generate login credentials, and configure custom permission rules.
              </p>
            </div>

            {addError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleCreateEmployee} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={addFullName}
                  onChange={(e) => setAddFullName(e.target.value)}
                  placeholder="e.g. Tanvir Ahmed"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    placeholder="tanvir@totoelitemart.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Phone (11 Digits)</label>
                  <input
                    type="tel"
                    value={addPhone}
                    onChange={(e) => setAddPhone(e.target.value)}
                    placeholder="01712345678"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Password field with Auto Generator */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Initial Password *</label>
                  <button
                    type="button"
                    onClick={() => setAddPassword(generatePassword())}
                    className="text-amber-600 hover:text-amber-700 font-bold text-[11px] flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Generate Secure Password</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={addShowPassword ? 'text' : 'password'}
                    required
                    value={addPassword}
                    onChange={(e) => setAddPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setAddShowPassword(!addShowPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {addShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Role Select */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Assigned Role *</label>
                <select
                  value={addRole}
                  onChange={(e) => setAddRole(e.target.value as Role)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white font-semibold"
                >
                  {ALL_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r} — {ROLE_DESCRIPTIONS[r]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Permissions Override */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-2">
                <span className="font-bold text-slate-800 block">
                  Custom Rule Overrides (Optional Grant on Top of Role)
                </span>
                <p className="text-[11px] text-slate-500">
                  Select specific module capabilities to grant to this employee without changing their primary role.
                </p>

                <div className="grid grid-cols-2 gap-2 pt-2 max-h-44 overflow-y-auto pr-1">
                  {AVAILABLE_PERMISSIONS.map((perm) => {
                    const checked = addCustomPermissions.includes(perm.key);
                    return (
                      <label
                        key={perm.key}
                        className={`p-2 rounded-xl border flex items-center gap-2 cursor-pointer transition text-[11px] ${
                          checked
                            ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAddCustomPermissions((prev) => [...prev, perm.key]);
                            } else {
                              setAddCustomPermissions((prev) => prev.filter((k) => k !== perm.key));
                            }
                          }}
                          className="rounded text-amber-600 focus:ring-amber-500"
                        />
                        <span className="truncate">{perm.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAdd}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-slate-950 font-black rounded-xl shadow-md transition"
                >
                  {submittingAdd ? 'Creating...' : 'Save & Grant Access'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* EDIT EMPLOYEE MODAL */}
      {/* ======================================================== */}
      {editingEmployee && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditingEmployee(null)}
              className="absolute top-6 right-6 p-1 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-xl font-black text-slate-950 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-600" />
                <span>Edit Employee: {editingEmployee.fullName}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Update account details, change role, or configure custom permission rules.
              </p>
            </div>

            {editError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateEmployee} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assigned Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as Role)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white font-semibold"
                  >
                    {ALL_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Account Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white font-semibold"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              {/* Custom Rule Overrides */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-2">
                <span className="font-bold text-slate-800 block">
                  Custom Rule Overrides (Granted on top of {editRole})
                </span>

                <div className="grid grid-cols-2 gap-2 pt-2 max-h-44 overflow-y-auto pr-1">
                  {AVAILABLE_PERMISSIONS.map((perm) => {
                    const checked = editCustomPermissions.includes(perm.key);
                    return (
                      <label
                        key={perm.key}
                        className={`p-2 rounded-xl border flex items-center gap-2 cursor-pointer transition text-[11px] ${
                          checked
                            ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditCustomPermissions((prev) => [...prev, perm.key]);
                            } else {
                              setEditCustomPermissions((prev) => prev.filter((k) => k !== perm.key));
                            }
                          }}
                          className="rounded text-amber-600 focus:ring-amber-500"
                        />
                        <span className="truncate">{perm.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    const emp = editingEmployee;
                    setEditingEmployee(null);
                    openPasswordModal(emp);
                  }}
                  className="text-amber-700 hover:underline font-bold text-xs flex items-center gap-1.5"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Change Password for this user</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingEmployee(null)}
                    className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingEdit}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-md transition"
                  >
                    {submittingEdit ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CHANGE / RESET PASSWORD MODAL */}
      {/* ======================================================== */}
      {passwordModalEmployee && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setPasswordModalEmployee(null)}
              className="absolute top-6 right-6 p-1 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-lg font-black text-slate-950 flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-500" />
                <span>
                  {currentSessionUser?.id === passwordModalEmployee.id
                    ? 'Change Super Admin Password'
                    : `Reset Password for ${passwordModalEmployee.fullName}`}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Enter a new secure password. The employee will use this password on next login.
              </p>
            </div>

            {passwordError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">New Password (Min. 6 chars) *</label>
                  <button
                    type="button"
                    onClick={() => {
                      const p = generatePassword();
                      setNewPassword(p);
                      setConfirmPassword(p);
                    }}
                    className="text-amber-600 hover:text-amber-700 font-bold text-[11px] flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Auto Generate</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Confirm New Password *</label>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPasswordModalEmployee(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPassword}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-slate-950 font-black rounded-xl shadow-md transition"
                >
                  {submittingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
