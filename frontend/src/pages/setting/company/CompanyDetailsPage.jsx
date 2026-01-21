import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  ChevronDown,
  ChevronRight,
  Building2,
  User2,
  ShieldCheck,
  Loader2,
  Plus,
} from "lucide-react";
import Page from "../../../components/common/Page";
import Input from "../../../components/ui/Input";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import Divider from "../../../components/ui/Divider";
import useApi from "../../../hooks/useApi";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../components/common/PageHeader";
import { useAuth } from "../../../context/useAuth";

export default function CompanyCreatePage() {
  const { user } = useAuth();
  const permissions = user?.permissions || {};
  const { request, loading } = useApi();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      company_name: "",
      company_details: "",
      user_name: "",
      user_email: "",
      user_mobile: "",
      user_password: "",
      user_role: "",
      permissions: {},
    },
  });

  const [expandedModules, setExpandedModules] = useState({});

  const toggleModule = (module) => {
    setExpandedModules((prev) => ({ ...prev, [module]: !prev[module] }));
  };

  const onSubmit = async (data) => {
   const formattedPermissions = {};

  Object.keys(data.permissions || {}).forEach((module) => {
    formattedPermissions[module] = {};
    Object.keys(data.permissions[module]).forEach((entity) => {
      const perms = data.permissions[module][entity];
      formattedPermissions[module][entity] = Object.keys(perms).filter(
        (perm) => perms[perm] // include only checked ones
      );
    });
  });

  const finalPayload = {
    name: data.company_name,
    details: data.company_details,
    user_name: data.user_name,
    user_email: data.user_email,
    user_mobile: data.user_mobile,
    user_password: data.user_password,
    user_role: data.user_role,
    permissions: formattedPermissions,
  };

    await request("/company/user/", "POST", finalPayload, {
      retries: 2,
      onSuccess: () => {
        reset(), navigate("/settings/companies");
      },
    });
  };

  return (
    <Page title="Create Company">
      <PageHeader
        title="Create New Company"
        subTitle="Fill in details to register a new company with user & permission setup."
        icon={Building2}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* User Info */}
        <Card>
          <section className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-800">
                Company Information
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-5 mb-4">
              <Input
                label="Company Name"
                placeholder="Enter company name"
                {...register("company_name", {
                  required: "Company name is required",
                })}
                error={errors.name?.message}
              />
              <Input
                label="Company Details"
                placeholder="Short description"
                {...register("company_details")}
              />
            </div>
          </section>
          <Divider color="blue" />
          {/* user information */}
          <section className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <User2 className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-800">
                User Information
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <Input
                label="User Name"
                placeholder="User Name"
                {...register("user_name", {
                  required: "User name is required",
                })}
                error={errors.user_name?.message}
              />
              <Input
                label="User Email"
                type="email"
                placeholder="Email address"
                {...register("user_email", { required: "Email is required" })}
                error={errors.user_email?.message}
              />
              <Input
                label="Mobile"
                placeholder="Phone number"
                {...register("user_mobile")}
              />
              <Input
                label="Password"
                type="password"
                placeholder="Password"
                {...register("user_password", {
                  required: "Password is required",
                })}
                error={errors.user_password?.message}
              />
              <Input
                label="Role"
                placeholder="Role"
                {...register("user_role", { required: "Role is required" })}
                error={errors.user_role?.message}
              />
            </div>
          </section>
          <Divider color="blue" />
          {/* permission */}
          {/* permission */}
          <section className="my-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-800">
                  Permissions
                </h2>
              </div>

              {/* Select All Global */}
              <label className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600 cursor-pointer">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    const checked = e.target.checked;
                    const newPermissions = {};
                    Object.keys(permissions).forEach((module) => {
                      newPermissions[module] = {};
                      Object.keys(permissions[module]).forEach((entity) => {
                        newPermissions[module][entity] = {};
                        permissions[module][entity].forEach((perm) => {
                          newPermissions[module][entity][perm] = checked;
                        });
                      });
                    });
                    reset((prev) => ({ ...prev, permissions: newPermissions }));
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
                />
                Select All
              </label>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 max-h-[420px] overflow-y-auto custom-scroll">
              {Object.keys(permissions).map((module) => {
                const allChecked = Object.keys(permissions[module] || {}).every(
                  (entity) => {
                    const perms = permissions[module][entity];
                    // perms can be array or object depending on shape
                    if (Array.isArray(perms)) return false; // initial structure, no values yet
                    return Object.values(perms || {}).every(Boolean);
                  }
                );

                return (
                  <div
                    key={module}
                    className="mb-3 border-b border-gray-100 pb-2">
                    {/* Module Header */}
                    <div
                      className="flex items-center justify-between cursor-pointer hover:bg-gray-50 px-2 py-1 rounded-md transition"
                      onClick={() => toggleModule(module)}>
                      <span className="font-medium capitalize text-gray-800">
                        {module}
                      </span>
                      <div className="flex items-center gap-2">
                        {/* Select All per module */}
                        <label
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 text-xs text-gray-600 hover:text-blue-600 cursor-pointer">
                          <input
                            type="checkbox"
                            onChange={(e) => {
                              const checked = e.target.checked;
                              const modulePermissions = {};
                              Object.keys(permissions[module]).forEach(
                                (entity) => {
                                  modulePermissions[entity] = {};
                                  permissions[module][entity].forEach(
                                    (perm) => {
                                      modulePermissions[entity][perm] = checked;
                                    }
                                  );
                                }
                              );
                              reset((prev) => ({
                                ...prev,
                                permissions: {
                                  ...prev.permissions,
                                  [module]: modulePermissions,
                                },
                              }));
                            }}
                            className="h-3.5 w-3.5 text-blue-600 rounded"
                          />
                          All
                        </label>

                        {expandedModules[module] ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )}
                      </div>
                    </div>

                    {/* Entities */}
                    {expandedModules[module] && (
                      <div className="ml-4 mt-2 space-y-2 animate-fadeIn">
                        {Object.keys(permissions[module]).map((entity) => (
                          <div key={entity}>
                            <p className="text-sm font-medium text-gray-700">
                              {entity}
                            </p>
                            <div className="ml-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {permissions[module][entity].map((perm) => (
                                <Controller
                                  key={perm}
                                  name={`permissions.${module}.${entity}.${perm}`}
                                  control={control}
                                  render={({ field }) => (
                                    <label className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={field.value || false}
                                        onChange={(e) =>
                                          field.onChange(e.target.checked)
                                        }
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
                                      />
                                      {perm}
                                    </label>
                                  )}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </Card>

        {/* Submit */}
        <div className="w-full">
          <Button
            disabled={loading}
            prefix={loading && <Loader2 className="w-4 h-4 animate-spin" />}
            type="submit"
            variant="gradient"
            className="w-full"
            size="md">
            Create Company
          </Button>
        </div>
      </form>

      {/* subtle animation */}
      <style>{`
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .custom-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 4px;
        }
        .custom-scroll::-webkit-scrollbar-thumb:hover {
          background-color: #94a3b8;
        }
      `}</style>
    </Page>
  );
}
