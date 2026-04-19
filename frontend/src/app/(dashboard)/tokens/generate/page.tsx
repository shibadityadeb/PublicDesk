"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Building2, Activity, CheckCircle, AlertCircle, Ticket } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { officesApi, servicesApi, tokensApi } from "@/lib/api";
import { Office, Service, Priority } from "@/types";
import toast from "react-hot-toast";

const STEPS = ["Office", "Service", "Priority", "Confirm", "Done"];

export default function GenerateTokenPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [selectedOffice, setSelectedOffice] = useState<Office | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [priority, setPriority] = useState<Priority>(Priority.NORMAL);
  const [notes, setNotes] = useState("");
  const [generatedToken, setGeneratedToken] = useState<any>(null);

  const { data: officesData, isLoading: loadingOffices } = useQuery({
    queryKey: ["offices"],
    queryFn: () => officesApi.getAll({ limit: 50 }),
  });

  const { data: servicesData, isLoading: loadingServices } = useQuery({
    queryKey: ["services", selectedOffice?.id],
    queryFn: () => servicesApi.getByOffice(selectedOffice!.id),
    enabled: !!selectedOffice,
  });

  const generateMutation = useMutation({
    mutationFn: () =>
      tokensApi.generate({
        officeId: selectedOffice!.id,
        serviceId: selectedService!.id,
        priority: priority !== Priority.NORMAL ? priority : undefined,
        notes: notes || undefined,
      }),
    onSuccess: (res) => {
      const token = res.data?.data;
      setGeneratedToken(token);
      setStep(4);
      toast.success("Token generated successfully!");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Failed to generate token"),
  });

  const offices = officesData?.data?.data?.data || [];
  const services = servicesData?.data?.data?.data || [];

  const handleNext = () => {
    if (step === 0 && !selectedOffice) {
      toast.error("Please select an office");
      return;
    }
    if (step === 1 && !selectedService) {
      toast.error("Please select a service");
      return;
    }
    if (step === 3) {
      generateMutation.mutate();
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleReset = () => {
    setSelectedOffice(null);
    setSelectedService(null);
    setPriority(Priority.NORMAL);
    setNotes("");
    setGeneratedToken(null);
    setStep(0);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Generate Digital Token</h1>
        <p className="text-muted-foreground">Step {step + 1} of {STEPS.length}</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2">
        {STEPS.map((stepName, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm ${
                idx <= step
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {idx < step ? <CheckCircle className="w-4 h-4" /> : idx + 1}
            </motion.div>
            <span className="text-sm font-medium hidden sm:inline">{stepName}</span>
            {idx < STEPS.length - 1 && (
              <div className={`w-12 h-0.5 ${idx < step ? "bg-primary" : "bg-muted"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Content */}
      <Card>
        <CardContent className="pt-6">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Step 0: Select Office */}
            {step === 0 && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">Select An Office</h3>
                  {loadingOffices ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : offices.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {offices.map((office) => (
                        <motion.div
                          key={office.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setSelectedOffice(office);
                            setSelectedService(null);
                          }}
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            selectedOffice?.id === office.id
                              ? "border-primary bg-primary/5"
                              : "border-muted hover:border-primary/50"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Building2 className="w-5 h-5 mt-1 text-primary" />
                            <div>
                              <p className="font-medium">{office.name}</p>
                              <p className="text-sm text-muted-foreground">{office.address}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No offices available</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 1: Select Service */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">Select A Service</h3>
                  {loadingServices ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : services.length > 0 ? (
                    <div className="space-y-2">
                      {services.map((service) => (
                        <motion.div
                          key={service.id}
                          onClick={() => setSelectedService(service)}
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            selectedService?.id === service.id
                              ? "border-primary bg-primary/5"
                              : "border-muted hover:border-primary/50"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Activity className="w-5 h-5 mt-1 text-primary" />
                            <div className="flex-1">
                              <p className="font-medium">{service.name}</p>
                              <p className="text-sm text-muted-foreground">{service.description}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No services available for this office</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Priority & Notes */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="font-semibold mb-3 block">Priority Level</label>
                  <Select value={priority} onValueChange={(val) => setPriority(val as Priority)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="NORMAL">Normal</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="font-semibold mb-3 block">Additional Notes (Optional)</label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any additional information..."
                    rows={4}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Confirm */}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="font-semibold mb-4">Confirm Your Token Request</h3>
                <div className="space-y-3 bg-muted p-4 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Office:</span>
                    <span className="font-medium">{selectedOffice?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service:</span>
                    <span className="font-medium">{selectedService?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Priority:</span>
                    <Badge className="capitalize">{priority.toLowerCase()}</Badge>
                  </div>
                  {notes && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Notes:</span>
                      <span className="font-medium">{notes}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Success */}
            {step === 4 && generatedToken && (
              <div className="space-y-4 text-center py-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                >
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                </motion.div>
                <h2 className="text-2xl font-bold">Token Generated Successfully!</h2>
                <div className="bg-primary/10 p-6 rounded-lg">
                  <p className="text-3xl font-bold text-primary mb-2">#{generatedToken.tokenNumber}</p>
                  <p className="text-muted-foreground">Your digital token number</p>
                </div>
                <div className="bg-muted p-4 rounded-lg space-y-2 text-left">
                  <p><strong>Office:</strong> {selectedOffice?.name}</p>
                  <p><strong>Service:</strong> {selectedService?.name}</p>
                  <p><strong>Status:</strong> <Badge>{generatedToken.status}</Badge></p>
                </div>
              </div>
            )}
          </motion.div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-between">
        {step === 4 ? (
          <Button variant="outline" onClick={handleReset} className="flex-1">
            Generate Another Token
          </Button>
        ) : (
          <>
            <Button
              onClick={handleBack}
              variant="outline"
              disabled={step === 0}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={generateMutation.isPending}
              className="flex-1"
            >
              {generateMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Generating...
                </>
              ) : step === 3 ? (
                <>
                  <Ticket className="w-4 h-4 mr-2" />
                  Generate Token
                </>
              ) : (
                "Next"
              )}
            </Button>
          </>
        )}
      </div>
    </motion.div>
  );
}
