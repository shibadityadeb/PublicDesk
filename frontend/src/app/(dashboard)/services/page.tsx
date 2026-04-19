"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Activity, Plus, Search, Clock, Tag, DollarSign, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { servicesApi, officesApi } from "@/lib/api";
import { Service, ServiceStatus } from "@/types";
import { getStatusColor } from "@/lib/utils";
import toast from "react-hot-toast";

const SERVICE_CATEGORIES = [
  "Passport Services", "Driving License", "Land Records", "Tax Services",
  "Birth/Death Certificate", "Business Registration", "Social Welfare", "Other",
];

export default function ServicesPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterOffice, setFilterOffice] = useState(searchParams.get("officeId") ?? "");

  // Sync URL param changes
  useEffect(() => {
    const id = searchParams.get("officeId");
    if (id) setFilterOffice(id);
  }, [searchParams]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: "", description: "", category: SERVICE_CATEGORIES[0],
    estimatedDuration: "30", maxDailyCapacity: "100", fees: "0",
    officeId: "", requiresAppointment: false, requiresDocuments: false,
  });

  const { data: officesData } = useQuery({
    queryKey: ["offices"],
    queryFn: () => officesApi.getAll({ limit: 100 }),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["services", filterOffice],
    queryFn: () =>
      filterOffice
        ? servicesApi.getByOffice(filterOffice, { limit: 200 })
        : servicesApi.getAll({ limit: 200 }),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      servicesApi.create({
        ...form,
        estimatedDuration: parseInt(form.estimatedDuration),
        maxDailyCapacity: parseInt(form.maxDailyCapacity),
        fees: parseFloat(form.fees),
      }),
    onSuccess: () => {
      toast.success("Service created");
      queryClient.invalidateQueries({ queryKey: ["services"] });
      setShowCreate(false);
      setForm({
        name: "", description: "", category: SERVICE_CATEGORIES[0],
        estimatedDuration: "30", maxDailyCapacity: "100", fees: "0",
        officeId: "", requiresAppointment: false, requiresDocuments: false,
      });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed to create service"),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ServiceStatus }) =>
      servicesApi.update(id, { status }),
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
  });

  const offices = officesData?.data?.data?.data || [];
  const rawServices: Service[] = data?.data?.data?.data || data?.data?.data || [];
  const filtered = rawServices.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Services</h1>
          <p className="text-muted-foreground text-sm">{rawServices.length} services configured</p>
        </div>
        <Button className="gap-2" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          Add Service
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or category..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="border border-input rounded-lg px-3 py-2 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          value={filterOffice}
          onChange={(e) => setFilterOffice(e.target.value)}
        >
          <option value="">All Offices</option>
          {offices.map((o: any) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-44" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Activity className="h-16 w-16 text-muted-foreground opacity-30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No services found</h3>
            <Button onClick={() => setShowCreate(true)}>Add First Service</Button>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filtered.map((service, i) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Activity className="h-5 w-5 text-primary" />
                    </div>
                    <Badge className={getStatusColor(service.status)}>{service.status}</Badge>
                  </div>
                  <CardTitle className="text-base mt-2">{service.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">{service.code}</p>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Tag className="h-3 w-3" />
                    {service.category}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    ~{service.estimatedDuration} min · Capacity {service.maxDailyCapacity}/day
                  </div>
                  {service.fees > 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <DollarSign className="h-3 w-3" />
                      ₹{service.fees}
                    </div>
                  )}
                  {service.requiresDocuments && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <FileText className="h-3 w-3" />
                      Documents required
                    </div>
                  )}
                  <div className="pt-2 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs"
                      onClick={() =>
                        toggleStatusMutation.mutate({
                          id: service.id,
                          status:
                            service.status === ServiceStatus.ACTIVE
                              ? ServiceStatus.INACTIVE
                              : ServiceStatus.ACTIVE,
                        })
                      }
                    >
                      {service.status === ServiceStatus.ACTIVE ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-lg my-4">
            <CardHeader>
              <CardTitle>Add New Service</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Office *</label>
                <select
                  className="w-full border border-input rounded-lg px-3 py-2 bg-background text-sm mt-1"
                  value={form.officeId}
                  onChange={(e) => setForm({ ...form, officeId: e.target.value })}
                >
                  <option value="">Select Office</option>
                  {offices.map((o: any) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>

              {[
                { label: "Service Name *", key: "name", placeholder: "Passport Application" },
                { label: "Description", key: "description", placeholder: "Brief description..." },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="text-xs font-medium text-muted-foreground">{label}</label>
                  <Input
                    placeholder={placeholder}
                    value={(form as any)[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  />
                </div>
              ))}

              <div>
                <label className="text-xs font-medium text-muted-foreground">Category</label>
                <select
                  className="w-full border border-input rounded-lg px-3 py-2 bg-background text-sm mt-1"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {SERVICE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Duration (min)", key: "estimatedDuration", type: "number" },
                  { label: "Daily Capacity", key: "maxDailyCapacity", type: "number" },
                  { label: "Fees (₹)", key: "fees", type: "number" },
                ].map(({ label, key, type }) => (
                  <div key={key}>
                    <label className="text-xs font-medium text-muted-foreground">{label}</label>
                    <Input
                      type={type}
                      value={(form as any)[key]}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.requiresAppointment}
                    onChange={(e) => setForm({ ...form, requiresAppointment: e.target.checked })}
                    className="rounded"
                  />
                  Requires Appointment
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.requiresDocuments}
                    onChange={(e) => setForm({ ...form, requiresDocuments: e.target.checked })}
                    className="rounded"
                  />
                  Requires Documents
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  loading={createMutation.isPending}
                  disabled={!form.name || !form.officeId}
                  onClick={() => createMutation.mutate()}
                >
                  Create Service
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
