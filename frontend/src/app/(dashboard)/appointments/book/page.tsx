"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Building2, Activity, Calendar, Check, ChevronRight, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { officesApi, servicesApi, appointmentsApi } from "@/lib/api";
import { Office, Service } from "@/types";
import { formatTime } from "@/lib/utils";
import toast from "react-hot-toast";

const STEPS = ["Office", "Service", "Schedule", "Confirm", "Done"];

export default function BookAppointmentPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [selectedOffice, setSelectedOffice] = useState<Office | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [booking, setBooking] = useState<any>(null);

  const { data: officesData, isLoading: loadingOffices } = useQuery({
    queryKey: ["offices"],
    queryFn: () => officesApi.getAll({ limit: 50 }),
  });

  const { data: servicesData, isLoading: loadingServices } = useQuery({
    queryKey: ["services", selectedOffice?.id],
    queryFn: () => servicesApi.getByOffice(selectedOffice!.id),
    enabled: !!selectedOffice,
  });

  const today = new Date();
  const minDate = today.toISOString().split("T")[0];

  const { data: slotsData, isLoading: loadingSlots } = useQuery({
    queryKey: ["slots", selectedOffice?.id, selectedService?.id, selectedDate],
    queryFn: () => appointmentsApi.getSlots(selectedOffice!.id, selectedService!.id, selectedDate),
    enabled: !!selectedOffice && !!selectedService && !!selectedDate,
  });

  const bookMutation = useMutation({
    mutationFn: () =>
      appointmentsApi.create({
        serviceId: selectedService!.id,
        officeId: selectedOffice!.id,
        scheduledDate: selectedDate,
        scheduledTime: selectedTime,
        notes,
      }),
    onSuccess: (res) => {
      setBooking(res.data.data);
      setStep(4);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Booking failed"),
  });

  const offices: Office[] = officesData?.data?.data?.data || [];
  const services: Service[] = servicesData?.data?.data?.data || [];
  const slots: string[] = slotsData?.data?.data || [];

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Book Appointment</h1>
        <p className="text-muted-foreground text-sm">Follow the steps to schedule your visit</p>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center">
            <div className={`flex items-center gap-2 ${i <= step ? "text-primary" : "text-muted-foreground"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                ${i < step ? "bg-primary text-primary-foreground" :
                  i === step ? "border-2 border-primary text-primary" :
                  "border-2 border-muted text-muted-foreground"}`}>
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className="hidden md:block text-xs font-medium">{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${i < step ? "bg-primary" : "bg-muted"}`} style={{ width: "40px" }} />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >

          {/* Step 0: Select Office */}
          {step === 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Select Office
                </CardTitle>
                <CardDescription>Choose the office you want to visit</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingOffices ? (
                  <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16"/>)}</div>
                ) : (
                  <div className="space-y-3">
                    {offices.map((office) => (
                      <button
                        key={office.id}
                        onClick={() => { setSelectedOffice(office); setStep(1); }}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all hover:border-primary
                          ${selectedOffice?.id === office.id ? "border-primary bg-primary/5" : "border-border"}`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{office.name}</p>
                            <p className="text-sm text-muted-foreground">{office.city}, {office.state}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {office.openingTime} - {office.closingTime}
                            </p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </button>
                    ))}
                    {offices.length === 0 && (
                      <p className="text-center text-muted-foreground py-6">No offices available</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 1: Select Service */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Select Service
                </CardTitle>
                <CardDescription>Available at {selectedOffice?.name}</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingServices ? (
                  <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-20"/>)}</div>
                ) : (
                  <div className="space-y-3">
                    {services.map((service) => (
                      <button
                        key={service.id}
                        onClick={() => { setSelectedService(service); setStep(2); }}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all hover:border-primary
                          ${selectedService?.id === service.id ? "border-primary bg-primary/5" : "border-border"}`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold">{service.name}</p>
                            <p className="text-sm text-muted-foreground">{service.category}</p>
                            <div className="flex items-center gap-3 mt-1.5">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                ~{service.estimatedDuration} mins
                              </span>
                              {service.fees > 0 && (
                                <span className="text-xs font-medium text-foreground">₹{service.fees}</span>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </button>
                    ))}
                    {services.length === 0 && (
                      <p className="text-center text-muted-foreground py-6">No services available</p>
                    )}
                  </div>
                )}
                <Button variant="outline" className="mt-4" onClick={() => setStep(0)}>
                  ← Back
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Select Date & Time */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Select Date & Time
                </CardTitle>
                <CardDescription>For: {selectedService?.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Date</label>
                  <input
                    type="date"
                    min={minDate}
                    value={selectedDate}
                    onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(""); }}
                    className="w-full border border-input rounded-lg p-3 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                {selectedDate && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Available Time Slots</label>
                    {loadingSlots ? (
                      <div className="grid grid-cols-4 gap-2">
                        {[1,2,3,4,5,6,7,8].map(i => <Skeleton key={i} className="h-10"/>)}
                      </div>
                    ) : slots.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No slots available for this date
                      </p>
                    ) : (
                      <div className="grid grid-cols-4 gap-2">
                        {slots.map((slot) => (
                          <button
                            key={slot}
                            onClick={() => setSelectedTime(slot)}
                            className={`p-2 rounded-lg border text-sm font-medium transition-all
                              ${selectedTime === slot
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border hover:border-primary"}`}
                          >
                            {formatTime(slot)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium mb-2 block">Notes (optional)</label>
                  <textarea
                    className="w-full border border-input rounded-lg p-3 text-sm resize-none bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    rows={2}
                    placeholder="Any special requirements..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)}>← Back</Button>
                  <Button
                    className="flex-1"
                    disabled={!selectedDate || !selectedTime}
                    onClick={() => setStep(3)}
                  >
                    Continue →
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Confirm Appointment</CardTitle>
                <CardDescription>Review your booking details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  {[
                    { label: "Office", value: selectedOffice?.name },
                    { label: "Service", value: selectedService?.name },
                    { label: "Date", value: new Date(selectedDate).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) },
                    { label: "Time", value: formatTime(selectedTime) },
                    { label: "Duration", value: `~${selectedService?.estimatedDuration} minutes` },
                    ...(selectedService?.fees ? [{ label: "Fees", value: `₹${selectedService.fees}` }] : []),
                    ...(notes ? [{ label: "Notes", value: notes }] : []),
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium text-right max-w-[60%]">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(2)}>← Back</Button>
                  <Button
                    className="flex-1"
                    loading={bookMutation.isPending}
                    onClick={() => bookMutation.mutate()}
                  >
                    Confirm Booking
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <Card className="text-center">
              <CardContent className="py-10 space-y-4">
                <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                  <Check className="h-10 w-10 text-success" />
                </div>
                <h2 className="text-2xl font-bold">Booking Confirmed!</h2>
                <p className="text-muted-foreground">
                  Your appointment has been scheduled successfully.
                </p>
                {booking && (
                  <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2 max-w-sm mx-auto">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Reference</span>
                      <span className="font-bold text-primary">{booking.appointmentNumber}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Date</span>
                      <span>{formatDate(booking.scheduledDate)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Time</span>
                      <span>{formatTime(booking.scheduledTime)}</span>
                    </div>
                  </div>
                )}
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={() => router.push("/appointments")}>
                    View All Appointments
                  </Button>
                  <Button onClick={() => {
                    setStep(0);
                    setSelectedOffice(null);
                    setSelectedService(null);
                    setSelectedDate("");
                    setSelectedTime("");
                    setNotes("");
                    setBooking(null);
                  }}>
                    Book Another
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}
